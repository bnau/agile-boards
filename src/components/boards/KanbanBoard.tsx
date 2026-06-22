import { useEffect, useReducer, useRef, useState, useCallback } from 'react';
import { TFile } from 'obsidian';
import { CardSourceInfo, KanbanBoard as KanbanBoardType, KanbanColumn, Ref, RoadmapBoard } from '../../types/Board';
import { CARD_TYPE } from '../../constants';
import { KanbanColumn as KanbanColumnView } from '../kanban/KanbanColumn';
import { AddPostIt } from '../common/AddPostIt';
import { useApp, useServices } from '../../context/AppContext';

interface KanbanBoardProps {
	board: KanbanBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<KanbanBoardType>) => Promise<void>;
}

/** Card drag payload: which column + position the card came from. */
interface CardDrag {
	columnId: string;
	index: number;
}

export const KanbanBoard = ({ board, boardPath, onBoardUpdate }: KanbanBoardProps) => {
	const app = useApp();
	const { boardService, noteService, referenceService, indexService } = useServices();

	// Re-render when any board changes so displayed cards track edits to source Roadmaps.
	const [, force] = useReducer((x: number) => x + 1, 0);
	useEffect(() => indexService.subscribe(force), [indexService]);

	// Re-render when a relevant note changes (story `status:`, estimate, roadmap content).
	const relevantPaths = useRef<Set<string>>(new Set());
	const roadmapPathsRef = useRef<Set<string>>(new Set());
	const [roadmapVersion, setRoadmapVersion] = useState(0);
	useEffect(() => {
		const onChanged = (f: TFile) => {
			if (!relevantPaths.current.has(f.path)) return;
			force();
			if (roadmapPathsRef.current.has(f.path)) setRoadmapVersion((v) => v + 1);
		};
		const changedRef = app.metadataCache.on('changed', onChanged);
		const resolvedRef = app.metadataCache.on('resolved', () => force());
		return () => {
			app.metadataCache.offref(changedRef);
			app.metadataCache.offref(resolvedRef);
		};
	}, [app]);

	const [cardDrag, setCardDrag] = useState<CardDrag | null>(null);

	/* ===== Multi-roadmap loading ===== */
	const roadmapBoards = indexService.getBoardsOfType('roadmap');

	// Resolve all linked roadmap file references.
	const roadmapFiles: (TFile | null)[] = board.roadmaps.map(
		(ref) => referenceService.resolve(ref, boardPath),
	);

	const [parsedRoadmaps, setParsedRoadmaps] = useState<(RoadmapBoard | null)[]>([]);
	useEffect(() => {
		let cancelled = false;
		Promise.all(
			roadmapFiles.map((f) =>
				f ? boardService.parseBoardAsync(f).then((b) =>
					b?.boardType === 'roadmap' ? (b as RoadmapBoard) : null,
				) : Promise.resolve(null),
			),
		).then((results) => { if (!cancelled) setParsedRoadmaps(results); });
		return () => { cancelled = true; };
		// Re-run when the roadmap list, their resolved paths, or their content changes.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [boardService, board.roadmaps.join(','), roadmapFiles.map((f) => f?.path ?? '').join(','), roadmapVersion]);

	const boardLabel = (f: TFile) => indexService.getBoardTitle(f.path) || f.basename;

	/** Stable identity for a reference (resolved note path, or its linkpath if missing). */
	const keyOf = (ref: string, src: string) => {
		const dest = referenceService.resolve(ref, src);
		return dest ? dest.path : referenceService.linkpath(ref);
	};

	/* ===== Aggregate stories from all roadmaps (ordered, deduped) ===== */
	const roadmapStoryFiles: TFile[] = [];
	const roadmapStoryPathSet = new Set<string>();
	// sourceMap: file.path → CardSourceInfo
	const sourceMap = new Map<string, CardSourceInfo>();

	parsedRoadmaps.forEach((roadmapBoard, idx) => {
		const roadmapFile = roadmapFiles[idx];
		if (!roadmapBoard || !roadmapFile) return;
		const roadmapRef = board.roadmaps[idx];
		for (const release of roadmapBoard.releases) {
			for (const item of release.items) {
				const dest = referenceService.resolve(item, roadmapFile.path);
				if (!dest) continue;
				if (!roadmapStoryPathSet.has(dest.path)) {
					roadmapStoryPathSet.add(dest.path);
					roadmapStoryFiles.push(dest);
				}
				// Track which roadmaps contain this story.
				const existing = sourceMap.get(dest.path);
				if (existing && existing.kind === 'roadmap') {
					if (!existing.roadmapRefs.includes(roadmapRef)) {
						existing.roadmapRefs.push(roadmapRef);
					}
				} else {
					sourceMap.set(dest.path, { kind: 'roadmap', roadmapRefs: [roadmapRef] });
				}
			}
		}
	});

	/* ===== Independent ticket reconciliation ===== */
	const independentFiles: TFile[] = [];
	const seenIndependentPaths = new Set<string>();
	for (const ref of board.independentTickets) {
		const dest = referenceService.resolve(ref, boardPath);
		if (dest && !roadmapStoryPathSet.has(dest.path) && !seenIndependentPaths.has(dest.path)) {
			seenIndependentPaths.add(dest.path);
			sourceMap.set(dest.path, { kind: 'independent' });
			independentFiles.push(dest);
		}
	}

	// All displayable files (roadmap + independent), for column reconciliation.
	const allDisplayFiles = [...roadmapStoryFiles, ...independentFiles];

	// Update relevantPaths and roadmapPaths for selective re-renders.
	const roadmapFilePaths = roadmapFiles.filter(Boolean).map((f) => f!.path);
	relevantPaths.current = new Set([boardPath, ...roadmapFilePaths, ...allDisplayFiles.map((f) => f.path)]);
	roadmapPathsRef.current = new Set(roadmapFilePaths);

	/**
	 * Place each file into a column. A story's column is the column whose
	 * name matches its note's `status:` frontmatter; unknown status → first column.
	 */
	const firstColumnId = board.columns[0]?.id;
	const columnIdByName = new Map(board.columns.map((c) => [c.name.toLowerCase(), c.id]));

	const columnIdFor = (file: TFile): string | undefined => {
		const status = noteService.getStatus(file);
		const byStatus = status ? columnIdByName.get(status.toLowerCase()) : undefined;
		return byStatus ?? firstColumnId;
	};

	// Stored order index per story path (flattened layout order), for intra-column ordering.
	const orderIndex = new Map<string, number>();
	let nextOrder = 0;
	for (const c of board.columns) {
		for (const ref of c.cards) {
			const k = keyOf(ref, boardPath);
			if (!orderIndex.has(k)) orderIndex.set(k, nextOrder++);
		}
	}

	const buckets = new Map<string, TFile[]>(board.columns.map((c) => [c.id, []]));
	for (const file of allDisplayFiles) {
		const id = columnIdFor(file) ?? firstColumnId;
		if (id && buckets.has(id)) buckets.get(id)!.push(file);
	}

	const displayColumns: KanbanColumn[] = board.columns.map((c) => {
		const files = [...(buckets.get(c.id) ?? [])].sort((a, b) => {
			const ia = orderIndex.has(a.path) ? (orderIndex.get(a.path) as number) : Number.MAX_SAFE_INTEGER;
			const ib = orderIndex.has(b.path) ? (orderIndex.get(b.path) as number) : Number.MAX_SAFE_INTEGER;
			return ia - ib;
		});
		return { ...c, cards: files.map((f) => referenceService.toWikilink(f, boardPath)) };
	});

	/* ===== Card drag-and-drop ===== */
	const cloneColumn = (c: KanbanColumn): KanbanColumn => ({ ...c, cards: [...c.cards] });

	const moveCard = (targetColumnId: string, targetIndex: number | null) => {
		const drag = cardDrag;
		setCardDrag(null);
		if (!drag) return;
		const cols = displayColumns.map(cloneColumn);
		const src = cols.find((c) => c.id === drag.columnId);
		const dst = cols.find((c) => c.id === targetColumnId);
		if (!src || !dst) return;
		const [ref] = src.cards.splice(drag.index, 1);
		if (ref === undefined) return;
		const at = targetIndex === null || targetIndex > dst.cards.length ? dst.cards.length : targetIndex;
		dst.cards.splice(at, 0, ref);
		onBoardUpdate({ columns: cols });

		if (drag.columnId !== targetColumnId) {
			const file = referenceService.resolve(ref, boardPath);
			if (file) noteService.setStatus(file, dst.name);
		}
	};

	/* ===== Independent ticket management ===== */
	const removeIndependentTicket = (ref: Ref) => {
		const targetPath = referenceService.resolve(ref, boardPath)?.path;
		onBoardUpdate({
			independentTickets: board.independentTickets.filter((r) => {
				if (targetPath) return referenceService.resolve(r, boardPath)?.path !== targetPath;
				return r !== ref;
			}),
		});
	};

	const handleRemoveCard = (_columnId: string, ref: Ref) => {
		removeIndependentTicket(ref);
	};

	const handleReplaceCard = useCallback((oldRef: Ref, newRef: Ref) => {
		const oldPath = referenceService.resolve(oldRef, boardPath)?.path;
		onBoardUpdate({
			independentTickets: board.independentTickets.map((r) => {
				if (oldPath) return referenceService.resolve(r, boardPath)?.path === oldPath ? newRef : r;
				return r === oldRef ? newRef : r;
			}),
			columns: board.columns.map((c) => ({ ...c, cards: c.cards.map((r) => (r === oldRef ? newRef : r)) })),
		});
	}, [board.independentTickets, board.columns, onBoardUpdate, referenceService, boardPath]);

	/* ===== Roadmap management ===== */
	const addRoadmap = (path: string) => {
		const f = roadmapBoards.find((b) => b.path === path);
		if (!f) return;
		const ref = referenceService.toWikilink(f, boardPath);
		if (!board.roadmaps.includes(ref)) {
			onBoardUpdate({ roadmaps: [...board.roadmaps, ref] });
		}
	};

	const removeRoadmap = (ref: Ref) => {
		onBoardUpdate({ roadmaps: board.roadmaps.filter((r) => r !== ref) });
	};

	// Roadmap boards not yet linked (for the add-select).
	const linkedRoadmapPaths = new Set(roadmapFiles.filter(Boolean).map((f) => f!.path));
	const availableRoadmaps = roadmapBoards.filter((f) => !linkedRoadmapPaths.has(f.path));

	const hasAnyContent = roadmapStoryFiles.length > 0 || independentFiles.length > 0;

	return (
		<div className="agile-kanban-board">
			{/* Linked Roadmaps list */}
			<div className="agile-kanban-source">
				<span className="agile-kanban-source__label">Linked Roadmaps</span>
				<div className="agile-kanban-source__list">
					{board.roadmaps.map((ref, idx) => {
						const f = roadmapFiles[idx];
						// Show warning only when the ref can't be resolved — not during async parse.
						const missing = !f;
						return (
							<span key={ref} className="agile-kanban-source__item">
								<span className="agile-kanban-source__item-name">
									{f ? boardLabel(f) : referenceService.label(ref)}
								</span>
								{missing && (
									<span className="agile-kanban-source__warn"> (not found)</span>
								)}
								<button
									className="agile-kanban-source__remove agile-btn agile-btn--icon agile-btn--small"
									title="Remove roadmap link"
									onClick={() => removeRoadmap(ref)}
								>
									×
								</button>
							</span>
						);
					})}
					{availableRoadmaps.length > 0 && (
						<select
							className="agile-field__input agile-kanban-source__add"
							value=""
							onChange={(e) => { if (e.target.value) addRoadmap(e.target.value); }}
						>
							<option value="">+ Add roadmap…</option>
							{availableRoadmaps.map((f) => (
								<option key={f.path} value={f.path}>{boardLabel(f)}</option>
							))}
						</select>
					)}
				</div>
				<AddPostIt
					sourcePath={boardPath}
					cardType={CARD_TYPE.story}
					label="Create"
					linkItems={(() => {
						const cardsFolder = noteService.getCardsFolder();
						const alreadyOnBoard = new Set(allDisplayFiles.map((f) => f.path));
						return app.vault.getMarkdownFiles().filter((f) =>
							!alreadyOnBoard.has(f.path) &&
							((f.parent?.name === CARD_TYPE.story && f.path.startsWith(cardsFolder + '/')) ||
							noteService.getAgileType(f) === CARD_TYPE.story),
						);
					})()}
					onAdd={(ref) => {
						const file = referenceService.resolve(ref, boardPath);
						if (!file || !allDisplayFiles.some((f) => f.path === file.path)) {
							onBoardUpdate({ independentTickets: [...board.independentTickets, ref] });
						}
					}}
				/>
			</div>

			{/* Empty state */}
			{!hasAnyContent && board.roadmaps.length === 0 && board.independentTickets.length === 0 && (
				<div className="agile-empty-state">
					<p>Add a roadmap or link a ticket to get started.</p>
				</div>
			)}

			{/* Fixed columns */}
			<div className="agile-kanban-columns">
				{displayColumns.map((column) => (
					<KanbanColumnView
						key={column.id}
						column={column}
						sourcePath={boardPath}
						sourceMap={sourceMap}
						onRemoveCard={handleRemoveCard}
						onReplaceCard={handleReplaceCard}
						onCardDragStart={(columnId, index) => setCardDrag({ columnId, index })}
						onCardDropOnCard={(columnId, index) => moveCard(columnId, index)}
						onCardDropOnColumn={(columnId) => moveCard(columnId, null)}
						onCardDragEnd={() => setCardDrag(null)}
					/>
				))}
			</div>
		</div>
	);
};
