import { LeanBoard as LeanBoardType, LeanSections } from '../../types/Board';
import { Section } from '../common/Section';
import { CARD_TYPE } from '../../constants';

interface LeanBoardProps {
	board: LeanBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<LeanBoardType>) => Promise<void>;
}

type BoxKey = keyof LeanSections;

// `type` overrides the section title as the card-type folder, so boxes that
// share notes with other canvases use a canonical type. Boxes without a `type`
// fall back to their title (no cross-board overlap).
const BOXES: Array<{ key: BoxKey; title: string; area: string; type?: string }> = [
	{ key: 'problem', title: 'Problem', area: 'problem' },
	{ key: 'solution', title: 'Solution', area: 'solution' },
	{ key: 'uniqueValueProposition', title: 'Unique Value Proposition', area: 'uvp', type: CARD_TYPE.valueProposition },
	{ key: 'unfairAdvantage', title: 'Unfair Advantage', area: 'advantage' },
	{ key: 'customerSegments', title: 'Customer Segments', area: 'customers', type: CARD_TYPE.customerSegment },
	{ key: 'keyMetrics', title: 'Key Metrics', area: 'metrics' },
	{ key: 'channels', title: 'Channels', area: 'channels' },
	{ key: 'costStructure', title: 'Cost Structure', area: 'cost' },
	{ key: 'revenueStreams', title: 'Revenue Streams', area: 'revenue' },
];

export const LeanBoard = ({ board, boardPath, onBoardUpdate }: LeanBoardProps) => {
	const update = (key: BoxKey, refs: string[]) => {
		onBoardUpdate({ sections: { ...board.sections, [key]: refs } });
	};

	return (
		<div className="agile-lean-board">
			{BOXES.map(({ key, title, area, type }) => (
				<div key={key} className={`agile-lean-section agile-lean-section--${area}`}>
					<div className="agile-lean-section__header">
						<h4 className="agile-lean-section__title">{title}</h4>
					</div>
					<Section
						refs={board.sections[key]}
						sourcePath={boardPath}
						onChange={(refs) => update(key, refs)}
						compact
						cardType={type ?? title}
					/>
				</div>
			))}
		</div>
	);
};
