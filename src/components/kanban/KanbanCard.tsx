import { useEffect, useState } from 'react';
import { PostIt } from '../common/PostIt';
import { CARD_TYPE, ESTIMATE_SCALE } from '../../constants';
import { CardSourceInfo, Estimate, Ref } from '../../types/Board';
import { useApp, useServices } from '../../context/AppContext';
import { useDeadlineColor } from '../../hooks/useDeadlineColor';

interface KanbanCardProps {
	/** Wikilink reference to the user-story note this card displays. */
	refStr: string;
	/** Path of the Kanban board note (for link resolution + open context). */
	sourcePath: string;
	/** Card provenance: roadmap-sourced (with roadmap refs) or independent. */
	source: CardSourceInfo;
	/** Whether the card's column is terminal (deadline color suppressed). */
	terminal: boolean;
	/** When provided (independent cards only), renders a remove button. */
	onRemove?: () => void;
	/** Called after the card note is renamed, with the new wikilink. */
	onReplace?: (newRef: string) => void;
}

/**
 * One Kanban card: a user story rendered as a post-it, with a Fibonacci estimate
 * control (stored on the note), a deadline-color border, a source badge, and
 * (for independent tickets) a remove button.
 */
export const KanbanCard = ({ refStr, sourcePath, source, terminal, onRemove, onReplace }: KanbanCardProps) => {
	const app = useApp();
	const { noteService, referenceService, indexService } = useServices();

	const roadmapRefs: Ref[] = source.kind === 'roadmap' ? source.roadmapRefs : [];
	const color = useDeadlineColor({ storyRef: refStr, roadmapRefs, sourcePath, terminal });

	const [estimate, setEstimate] = useState<Estimate | null>(null);

	useEffect(() => {
		const file = referenceService.resolve(refStr, sourcePath);
		const read = () => setEstimate(file ? noteService.getEstimate(file) : null);
		read();
		const changedRef = app.metadataCache.on('changed', (f) => { if (file && f.path === file.path) read(); });
		const resolvedRef = app.metadataCache.on('resolved', read);
		return () => {
			app.metadataCache.offref(changedRef);
			app.metadataCache.offref(resolvedRef);
		};
	}, [app, refStr, sourcePath, referenceService, noteService]);

	const changeEstimate = async (value: Estimate | null) => {
		const file = referenceService.resolve(refStr, sourcePath);
		if (!file) return;
		await noteService.setEstimate(file, value);
		setEstimate(value);
	};

	// Resolve source badge label.
	let sourceLabel: string;
	if (source.kind === 'independent') {
		sourceLabel = 'Independent';
	} else {
		const names = source.roadmapRefs.map((ref) => {
			const f = referenceService.resolve(ref, sourcePath);
			return f ? (indexService.getBoardTitle(f.path) ?? f.basename) : ref;
		}).filter(Boolean);
		sourceLabel = names.join(', ') || 'Roadmap';
	}

	return (
		<div className={`agile-kanban-card agile-kanban-card--${color}`}>
			<div className="agile-kanban-card__header-row">
				<span
					className={`agile-kanban-card__source agile-kanban-card__source--${source.kind}`}
					title={sourceLabel}
				>
					{sourceLabel}
				</span>
				{onRemove && (
					<button
						className="agile-kanban-card__remove agile-btn agile-btn--icon agile-btn--small"
						title="Remove from board"
						onClick={(e) => { e.stopPropagation(); onRemove(); }}
					>
						×
					</button>
				)}
			</div>
			<PostIt
				refStr={refStr}
				sourcePath={sourcePath}
				compact
				cardType={CARD_TYPE.story}
				onReplace={onReplace}
			/>
			<div className="agile-kanban-card__footer" onClick={(e) => e.stopPropagation()}>
				<label className="agile-kanban-card__estimate-label" title="Estimate (story points)">
					<select
						className="agile-kanban-card__estimate"
						value={estimate ?? ''}
						onChange={(e) => changeEstimate(e.target.value === '' ? null : (Number(e.target.value) as Estimate))}
						onClick={(e) => e.stopPropagation()}
					>
						<option value="">– pts</option>
						{ESTIMATE_SCALE.map((n) => (
							<option key={n} value={n}>{n} pts</option>
						))}
					</select>
				</label>
			</div>
		</div>
	);
};
