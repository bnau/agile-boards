import { useEffect, useState } from 'react';
import { CardSourceInfo, KanbanColumn as KanbanColumnType, Ref } from '../../types/Board';
import { KanbanCard } from './KanbanCard';
import { useApp, useServices } from '../../context/AppContext';

interface KanbanColumnProps {
	column: KanbanColumnType;
	sourcePath: string;
	/** Maps resolved note path → card source info (roadmap-sourced or independent). */
	sourceMap: Map<string, CardSourceInfo>;
	/** Called when the user removes an independent card from the board. */
	onRemoveCard: (columnId: string, ref: Ref) => void;
	/** A card drag started from (columnId, index). */
	onCardDragStart: (columnId: string, index: number) => void;
	/** A dragged card was dropped onto the card at (columnId, index). */
	onCardDropOnCard: (columnId: string, index: number) => void;
	/** A dragged card was dropped on the column body (append to end). */
	onCardDropOnColumn: (columnId: string) => void;
	/** A card drag ended (committed or cancelled). */
	onCardDragEnd: () => void;
}

const INDEPENDENT: CardSourceInfo = { kind: 'independent' };
const UNKNOWN_ROADMAP: CardSourceInfo = { kind: 'roadmap', roadmapRefs: [] };

/**
 * One fixed Kanban column: a workflow state holding an ordered list of story
 * cards. The column set is not editable; only cards move (within or between
 * columns) via native HTML5 drag-and-drop. The header shows the column name and
 * the total story points of its cards.
 */
export const KanbanColumn = ({
	column, sourcePath, sourceMap, onRemoveCard,
	onCardDragStart, onCardDropOnCard, onCardDropOnColumn, onCardDragEnd,
}: KanbanColumnProps) => {
	const app = useApp();
	const { noteService, referenceService } = useServices();

	const [points, setPoints] = useState(0);

	// Sum the cards' estimates; recompute when a card note's metadata changes.
	useEffect(() => {
		const cardPaths = new Set(
			column.cards.map((r) => referenceService.resolve(r, sourcePath)?.path).filter(Boolean) as string[],
		);
		const recompute = () => {
			let sum = 0;
			for (const ref of column.cards) {
				const f = referenceService.resolve(ref, sourcePath);
				const e = f ? noteService.getEstimate(f) : null;
				if (e) sum += e;
			}
			setPoints(sum);
		};
		recompute();
		const changedRef = app.metadataCache.on('changed', (f) => { if (cardPaths.has(f.path)) recompute(); });
		const resolvedRef = app.metadataCache.on('resolved', recompute);
		return () => {
			app.metadataCache.offref(changedRef);
			app.metadataCache.offref(resolvedRef);
		};
	}, [app, noteService, referenceService, sourcePath, column.cards]);

	return (
		<div className="agile-kanban-column">
			<div className="agile-kanban-column__header">
				<span className="agile-kanban-column__name">{column.name}</span>
				<span className="agile-kanban-column__points" title="Total story points">{points} pts</span>
			</div>
			<div
				className="agile-kanban-column__cards"
				onDragOver={(e) => e.preventDefault()}
				onDrop={() => onCardDropOnColumn(column.id)}
			>
				{column.cards.map((ref, i) => {
					const file = referenceService.resolve(ref, sourcePath);
					const source: CardSourceInfo = file
						? (sourceMap.get(file.path) ?? UNKNOWN_ROADMAP)
						: UNKNOWN_ROADMAP;
					const isIndependent = source.kind === 'independent';
					return (
						<div
							key={`${ref}-${i}`}
							className="agile-kanban-column__card-slot"
							draggable
							onDragStart={(e) => { e.stopPropagation(); onCardDragStart(column.id, i); }}
							onDragOver={(e) => e.preventDefault()}
							onDrop={(e) => { e.stopPropagation(); onCardDropOnCard(column.id, i); }}
							onDragEnd={onCardDragEnd}
						>
							<KanbanCard
								refStr={ref}
								sourcePath={sourcePath}
								source={source}
								terminal={!!column.terminal}
								onRemove={isIndependent ? () => onRemoveCard(column.id, ref) : undefined}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
};
