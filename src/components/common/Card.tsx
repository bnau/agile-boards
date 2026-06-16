import { AgileCard, CardType } from '../../types/Card';
import { CARD_LABELS } from '../../constants';

interface CardProps {
	card: AgileCard;
	onOpen?: (card: AgileCard) => void;
	onEdit?: (card: AgileCard) => void;
	onDelete?: (card: AgileCard) => void;
	compact?: boolean;
}

export const Card = ({ card, onOpen, onEdit, onDelete, compact = false }: CardProps) => {
	const label = CARD_LABELS[card.agileType] ?? card.agileType;

	return (
		<div
			className={`agile-card agile-card--${card.agileType} ${compact ? 'agile-card--compact' : ''}`}
			onClick={() => onOpen?.(card)}
			role="button"
			tabIndex={0}
			onKeyDown={(e) => e.key === 'Enter' && onOpen?.(card)}
		>
			<div className="agile-card__header">
				<span className="agile-card__type-badge">{label}</span>
				<span className="agile-card__title">{card.title}</span>
				<div className="agile-card__actions">
					{onEdit && (
						<button
							className="agile-btn agile-btn--icon"
							onClick={(e) => { e.stopPropagation(); onEdit(card); }}
							title="Edit card"
						>
							✎
						</button>
					)}
					{onDelete && (
						<button
							className="agile-btn agile-btn--icon agile-btn--danger"
							onClick={(e) => { e.stopPropagation(); onDelete(card); }}
							title="Delete card"
						>
							✕
						</button>
					)}
				</div>
			</div>
			{!compact && <CardBody card={card} />}
		</div>
	);
};

const CardBody = ({ card }: { card: AgileCard }) => {
	switch (card.agileType) {
		case 'customer':
			return (
				<div className="agile-card__body">
					<CardSection label="Jobs" items={card.jobs} />
					<CardSection label="Pains" items={card.pains} />
					<CardSection label="Gains" items={card.gains} />
				</div>
			);
		case 'value':
			return (
				<div className="agile-card__body">
					<CardSection label="Products & Services" items={card.productsServices} />
					<CardSection label="Pain Relievers" items={card.painRelievers} />
					<CardSection label="Gain Creators" items={card.gainCreators} />
				</div>
			);
		case 'user-story':
			return (
				<div className="agile-card__body">
					<div className="agile-card__meta">
						{card.storyPoints !== undefined && (
							<span className="agile-card__badge">{card.storyPoints} pts</span>
						)}
						<span className={`agile-card__status agile-card__status--${card.status}`}>
							{card.status}
						</span>
					</div>
					<CardSection label="Acceptance Criteria" items={card.acceptanceCriteria} />
				</div>
			);
		case 'release':
			return (
				<div className="agile-card__body">
					{card.targetDate && (
						<div className="agile-card__meta">
							<span className="agile-card__badge">📅 {card.targetDate}</span>
							{card.version && <span className="agile-card__badge">{card.version}</span>}
						</div>
					)}
				</div>
			);
		default:
			return null;
	}
};

const CardSection = ({ label, items }: { label: string; items: string[] }) => {
	if (items.length === 0) return null;
	return (
		<div className="agile-card__section">
			<div className="agile-card__section-label">{label}</div>
			<ul className="agile-card__list">
				{items.map((item, i) => (
					<li key={i}>{item}</li>
				))}
			</ul>
		</div>
	);
};
