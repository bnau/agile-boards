import { useState } from 'react';
import { LeanBoard as LeanBoardType, LeanSections } from '../../types/Board';
import { AgileCard } from '../../types/Card';
import { CardEditor } from '../common/CardEditor';
import { ReferenceSelector } from '../common/ReferenceSelector';
import { useCards } from '../../hooks/useCards';
import { useServices } from '../../context/AppContext';

interface LeanBoardProps {
	board: LeanBoardType;
	onBoardUpdate: (updates: Partial<LeanBoardType>) => Promise<void>;
}

type SectionKey = keyof LeanSections;

interface SectionDef {
	key: SectionKey;
	label: string;
	gridArea: string;
	createType?: string;
	referenceType?: 'customer' | 'value';
}

const SECTIONS: SectionDef[] = [
	{ key: 'problems', label: 'Problem', gridArea: 'problem', createType: 'problem' },
	{ key: 'solutions', label: 'Solution', gridArea: 'solution', createType: 'solution' },
	{ key: 'valuePropositions', label: 'Unique Value Proposition', gridArea: 'uvp', referenceType: 'value' },
	{ key: 'unfairAdvantage', label: 'Unfair Advantage', gridArea: 'advantage' },
	{ key: 'customers', label: 'Customer Segments', gridArea: 'customers', referenceType: 'customer' },
	{ key: 'keyMetrics', label: 'Key Metrics', gridArea: 'metrics' },
	{ key: 'channels', label: 'Channels', gridArea: 'channels' },
	{ key: 'costStructure', label: 'Cost Structure', gridArea: 'cost' },
	{ key: 'revenueStreams', label: 'Revenue Streams', gridArea: 'revenue' },
];

export const LeanBoard = ({ board, onBoardUpdate }: LeanBoardProps) => {
	const [creatingIn, setCreatingIn] = useState<SectionKey | null>(null);
	const [creatingType, setCreatingType] = useState<string>('problem');

	const customers = useCards('customer');
	const values = useCards('value');
	const { cardService, indexService } = useServices();

	const getAvailableCards = (section: SectionDef): AgileCard[] => {
		if (section.referenceType === 'customer') return customers;
		if (section.referenceType === 'value') return values;
		return [];
	};

	const handleAddToSection = async (sectionKey: SectionKey, path: string) => {
		const paths = [...(board.sections[sectionKey] as string[]), path];
		await onBoardUpdate({ sections: { ...board.sections, [sectionKey]: paths } });
	};

	const handleRemoveFromSection = async (sectionKey: SectionKey, path: string) => {
		const paths = (board.sections[sectionKey] as string[]).filter((p) => p !== path);
		await onBoardUpdate({ sections: { ...board.sections, [sectionKey]: paths } });
	};

	const handleCreateCard = async (title: string, fields: Record<string, unknown>) => {
		if (!creatingIn) return;
		const file = await cardService.createCard(creatingType as 'problem' | 'solution', title, fields);
		await handleAddToSection(creatingIn, file.path);
		setCreatingIn(null);
	};

	const getSectionCards = (sectionKey: SectionKey): AgileCard[] => {
		const paths = board.sections[sectionKey] as string[];
		return paths.flatMap((p) => {
			const card = indexService.getCardByPath(p);
			return card ? [card] : [];
		});
	};

	return (
		<div className="agile-lean-board">
			{SECTIONS.map((section) => {
				const cards = getSectionCards(section.key);
				const available = getAvailableCards(section);
				const selectedPaths = board.sections[section.key] as string[];

				return (
					<div
						key={section.key}
						className={`agile-lean-section agile-lean-section--${section.gridArea}`}
					>
						<div className="agile-lean-section__header">
							<h4 className="agile-lean-section__title">{section.label}</h4>
						</div>
						<div className="agile-lean-section__items">
							{cards.map((card) => (
								<div key={card.path} className="agile-lean-item">
									<span>{card.title}</span>
									<button
										className="agile-btn agile-btn--icon"
										onClick={() => handleRemoveFromSection(section.key, card.path)}
										title="Remove"
									>
										✕
									</button>
								</div>
							))}
						</div>
						{section.referenceType ? (
							<ReferenceSelector
								cardType={section.referenceType}
								availableCards={available}
								selectedPaths={selectedPaths}
								onSelect={(card) => handleAddToSection(section.key, card.path)}
								onDeselect={(path) => handleRemoveFromSection(section.key, path)}
								multiSelect
							/>
						) : section.createType ? (
							<button
								className="agile-btn agile-btn--add"
								onClick={() => { setCreatingIn(section.key); setCreatingType(section.createType!); }}
							>
								+ Add
							</button>
						) : (
							<button
								className="agile-btn agile-btn--add"
								onClick={() => { setCreatingIn(section.key); setCreatingType('solution'); }}
							>
								+ Add
							</button>
						)}
					</div>
				);
			})}

			{creatingIn && (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType={creatingType as 'problem' | 'solution'}
							onSave={handleCreateCard}
							onCancel={() => setCreatingIn(null)}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
