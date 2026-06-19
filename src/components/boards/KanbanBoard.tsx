import { useEffect, useReducer, useRef, useState } from 'react';
import { TFile } from 'obsidian';
import { KanbanBoard as KanbanBoardType, KanbanColumn, RoadmapBoard } from '../../types/Board';
import { KanbanColumn as KanbanColumnView } from '../kanban/KanbanColumn';
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

	// Re-render when any board changes so the displayed cards track edits to the source Roadmap.
	const [, force] = useReducer((x: number) => x + 1, 0);
	useEffect(() => indexService.subscribe(force), [indexService]);

	// Re-render when a relevant note changes (e.g. a story's `status` frontmatter,
	// which determines its column). Filtered to the board, the Roadmap, and the cards.
	const relevantPaths = useRef<Set<string>>(new Set());
	useEffect(() => {
		const onChanged = (f: TFile) => { if (relevantPaths.current.has(f.path)) force(); };
		const changedRef = app.metadataCache.on('changed', onChanged);
		const resolvedRef = app.metadataCache.on('resolved', () => force());
		return () => {
			app.metadataCache.offref(changedRef);
			app.metadataCache.offref(resolvedRef);
		};
	}, [app]);

	const [cardDrag, setCardDrag] = useState<CardDrag | null>(null);

	/* ===== source Roadmap (stories + release dates) ===== */
	const roadmapBoards = boardService.getBoardsOfType('roadmap');
	const roadmapFile = board.roadmap ? referenceService.resolve(board.roadmap, boardPath) : null;
	const roadmapBoard = roadmapFile ? (boardService.parseBoard(roadmapFile) as RoadmapBoard | null) : null;
	const roadmapValid = roadmapBoard?.boardType === 'roadmap';

	const boardLabel = (f: TFile) => boardService.parseBoard(f)?.title || f.basename;

	const selectRoadmap = (path: string) => {
		const f = roadmapBoards.find((b) => b.path === path);
		onBoardUpdate({ roadmap: f ? referenceService.toWikilink(f, boardPath) : '' });
	};

	/** Stable identity for a reference (resolved note path, or its linkpath if missing). */
	const keyOf = (ref: string, src: string) => {
		const dest = referenceService.resolve(ref, src);
		return dest ? dest.path : referenceService.linkpath(ref);
	};

	/* ===== stories come from the Roadmap's release items (ordered, distinct) ===== */
	const roadmapStoryFiles: TFile[] = [];
	const roadmapKeys = new Set<string>();
	if (roadmapBoard && roadmapFile) {
		for (const release of roadmapBoard.releases) {
			for (const item of release.items) {
				const dest = referenceService.resolve(item, roadmapFile.path);
				if (!dest || roadmapKeys.has(dest.path)) continue;
				roadmapKeys.add(dest.path);
				roadmapStoryFiles.push(dest);
			}
		}
	}

	// Re-render this board when any of these notes change (status edits move cards).
	relevantPaths.current = new Set([
		boardPath,
		...(roadmapFile ? [roadmapFile.path] : []),
		...roadmapStoryFiles.map((f) => f.path),
	]);

	/**
	 * Place each Roadmap story into a column. A story's column is the column whose
	 * name matches its note's `status:` frontmatter (the source of truth); a story
	 * with no/unknown status falls to the first column (Backlog). Within a column,
	 * cards keep the order stored in the board layout, with any not-yet-ordered
	 * stories appended in Roadmap order.
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
	for (const file of roadmapStoryFiles) {
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

	/* ===== card drag-and-drop (within and between columns) ===== */
	const cloneColumn = (c: KanbanColumn): KanbanColumn => ({ ...c, cards: [...c.cards] });

	// Move the dragged card into targetColumnId at targetIndex (null = append):
	// persist the order in the board layout and reflect the column in the story's
	// `status` frontmatter (the source of truth for the card's column).
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

	return (
		<div className="agile-kanban-board">
			{/* Source Roadmap */}
			<div className="agile-kanban-source">
				<label className="agile-kanban-source__label">Source Roadmap</label>
				<select
					className="agile-field__input agile-kanban-source__select"
					value={roadmapFile?.path ?? ''}
					onChange={(e) => selectRoadmap(e.target.value)}
				>
					<option value="">— Select a Roadmap —</option>
					{roadmapBoards.map((f) => (
						<option key={f.path} value={f.path}>{boardLabel(f)}</option>
					))}
				</select>
				{board.roadmap && !roadmapValid && (
					<span className="agile-kanban-source__warn">Linked Roadmap not found.</span>
				)}
			</div>

			{!roadmapValid && (
				<div className="agile-empty-state">
					<p>Select a source Roadmap above to display its stories on the board.</p>
				</div>
			)}

			{/* Fixed columns */}
			<div className="agile-kanban-columns">
				{displayColumns.map((column) => (
					<KanbanColumnView
						key={column.id}
						column={column}
						sourcePath={boardPath}
						roadmapRef={board.roadmap}
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
