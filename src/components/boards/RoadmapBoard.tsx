import { RoadmapBoard as RoadmapBoardType, RoadmapRelease, TimelineUnit } from '../../types/Board';
import { Section } from '../common/Section';
import { CARD_TYPE } from '../../constants';

interface RoadmapBoardProps {
	board: RoadmapBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<RoadmapBoardType>) => Promise<void>;
}

export const RoadmapBoard = ({ board, boardPath, onBoardUpdate }: RoadmapBoardProps) => {
	// Display releases chronologically without mutating stored order.
	const ordered = board.releases
		.map((r, index) => ({ r, index }))
		.sort((a, b) => {
			const da = a.r.targetDate, db = b.r.targetDate;
			if (!da && !db) return 0;
			if (!da) return 1;
			if (!db) return -1;
			return da.localeCompare(db);
		});

	const updateRelease = (index: number, patch: Partial<RoadmapRelease>) => {
		onBoardUpdate({ releases: board.releases.map((r, i) => (i === index ? { ...r, ...patch } : r)) });
	};
	const addRelease = () =>
		onBoardUpdate({ releases: [...board.releases, { name: `Release ${board.releases.length + 1}`, items: [] }] });
	const removeRelease = (index: number) =>
		onBoardUpdate({ releases: board.releases.filter((_, i) => i !== index) });

	return (
		<div className="agile-roadmap-board">
			<div className="agile-roadmap-board__header">
				<h3>Roadmap</h3>
				<div className="agile-roadmap-board__controls">
					<label className="agile-field agile-field--inline">
						<span className="agile-field__label">Unit:</span>
						<select
							className="agile-field__select"
							value={board.timelineUnit}
							onChange={(e) => onBoardUpdate({ timelineUnit: e.target.value as TimelineUnit })}
						>
							<option value="week">Week</option>
							<option value="month">Month</option>
							<option value="quarter">Quarter</option>
						</select>
					</label>
					<label className="agile-field agile-field--inline">
						<span className="agile-field__label">From:</span>
						<input type="date" value={board.startDate ?? ''} onChange={(e) => onBoardUpdate({ startDate: e.target.value || undefined })} />
					</label>
					<label className="agile-field agile-field--inline">
						<span className="agile-field__label">To:</span>
						<input type="date" value={board.endDate ?? ''} onChange={(e) => onBoardUpdate({ endDate: e.target.value || undefined })} />
					</label>
				</div>
			</div>

			<div className="agile-roadmap-releases">
				{ordered.map(({ r, index }) => (
					<div key={index} className="agile-roadmap-release">
						<div className="agile-roadmap-release__header">
							<input
								className="agile-field__input agile-roadmap-release__name"
								value={r.name}
								onChange={(e) => updateRelease(index, { name: e.target.value })}
							/>
							<div className="agile-roadmap-release__date">
								<input
									type="date"
									value={r.targetDate ?? ''}
									onChange={(e) => updateRelease(index, { targetDate: e.target.value || undefined })}
								/>
							</div>
							<button
								className="agile-btn agile-btn--icon agile-btn--danger"
								onClick={() => removeRelease(index)}
								title="Remove release"
							>
								✕
							</button>
						</div>
						<div className="agile-roadmap-release__items">
							<Section
								refs={r.items}
								sourcePath={boardPath}
								onChange={(items) => updateRelease(index, { items })}
								compact
								addLabel="+ Item"
								cardType={CARD_TYPE.story}
								linkTypes={[CARD_TYPE.story, CARD_TYPE.feature]}
							/>
						</div>
					</div>
				))}
			</div>

			<div className="agile-roadmap-board__add-release">
				<button className="agile-btn agile-btn--add" onClick={addRelease}>+ Release</button>
			</div>
		</div>
	);
};
