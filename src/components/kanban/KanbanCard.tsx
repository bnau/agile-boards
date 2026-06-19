import { useEffect, useState } from 'react';
import { PostIt } from '../common/PostIt';
import { CARD_TYPE, ESTIMATE_SCALE } from '../../constants';
import { Estimate, Ref } from '../../types/Board';
import { useApp, useServices } from '../../context/AppContext';
import { useDeadlineColor } from '../../hooks/useDeadlineColor';

interface KanbanCardProps {
	/** Wikilink reference to the user-story note this card displays. */
	refStr: string;
	/** Path of the Kanban board note (for link resolution + open context). */
	sourcePath: string;
	/** Source Roadmap reference supplying the release date for the deadline color. */
	roadmapRef?: Ref;
	/** Whether the card's column is terminal (deadline color suppressed). */
	terminal: boolean;
}

/**
 * One Kanban card: a user story rendered as a post-it, with a Fibonacci estimate
 * control (stored on the note) and a deadline-color border driven by the linked
 * Roadmap's release date. Cards are auto-displayed from the Roadmap, so they are
 * not removable here — a story leaves the board by leaving the Roadmap.
 */
export const KanbanCard = ({ refStr, sourcePath, roadmapRef, terminal }: KanbanCardProps) => {
	const app = useApp();
	const { noteService, referenceService } = useServices();
	const color = useDeadlineColor({ storyRef: refStr, roadmapRef, sourcePath, terminal });

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

	return (
		<div className={`agile-kanban-card agile-kanban-card--${color}`}>
			<PostIt
				refStr={refStr}
				sourcePath={sourcePath}
				compact
				cardType={CARD_TYPE.story}
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
