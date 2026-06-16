import { useState } from 'react';
import { AgileCard, CardType } from '../../types/Card';
import { CARD_LABELS } from '../../constants';

interface ReferenceSelectorProps {
	cardType: CardType;
	availableCards: AgileCard[];
	selectedPaths: string[];
	onSelect: (card: AgileCard) => void;
	onDeselect: (path: string) => void;
	onCreateNew?: () => void;
	multiSelect?: boolean;
}

export const ReferenceSelector = ({
	cardType,
	availableCards,
	selectedPaths,
	onSelect,
	onDeselect,
	onCreateNew,
	multiSelect = false,
}: ReferenceSelectorProps) => {
	const [search, setSearch] = useState('');
	const [open, setOpen] = useState(false);

	const label = CARD_LABELS[cardType] ?? cardType;
	const filtered = availableCards.filter((c) =>
		c.title.toLowerCase().includes(search.toLowerCase())
	);

	const selectedCards = availableCards.filter((c) => selectedPaths.includes(c.path));

	return (
		<div className="agile-reference-selector">
			<div className="agile-reference-selector__selected">
				{selectedCards.map((card) => (
					<div key={card.path} className="agile-reference-selector__chip">
						<span>{card.title}</span>
						<button
							className="agile-btn agile-btn--icon"
							onClick={() => onDeselect(card.path)}
							title="Remove reference"
						>
							✕
						</button>
					</div>
				))}
				{(multiSelect || selectedCards.length === 0) && (
					<button
						className="agile-btn agile-btn--add"
						onClick={() => setOpen((o) => !o)}
					>
						+ Link {label}
					</button>
				)}
			</div>

			{open && (
				<div className="agile-reference-selector__dropdown">
					<input
						className="agile-reference-selector__search"
						type="text"
						placeholder={`Search ${label}...`}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						autoFocus
					/>
					<div className="agile-reference-selector__list">
						{filtered.length === 0 ? (
							<div className="agile-reference-selector__empty">
								No {label} cards found.
								{onCreateNew && (
									<button
										className="agile-btn agile-btn--small"
										onClick={() => { onCreateNew(); setOpen(false); }}
									>
										Create new
									</button>
								)}
							</div>
						) : (
							filtered.map((card) => {
								const isSelected = selectedPaths.includes(card.path);
								return (
									<div
										key={card.path}
										className={`agile-reference-selector__item ${isSelected ? 'agile-reference-selector__item--selected' : ''}`}
										onClick={() => {
											if (isSelected) {
												onDeselect(card.path);
											} else {
												onSelect(card);
												if (!multiSelect) setOpen(false);
											}
										}}
										role="option"
										aria-selected={isSelected}
										tabIndex={0}
										onKeyDown={(e) => e.key === 'Enter' && (isSelected ? onDeselect(card.path) : onSelect(card))}
									>
										{card.title}
										{isSelected && <span className="agile-reference-selector__check">✓</span>}
									</div>
								);
							})
						)}
					</div>
				</div>
			)}
		</div>
	);
};
