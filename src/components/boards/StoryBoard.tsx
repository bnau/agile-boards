import { useState } from 'react';
import { StoryBoard as StoryBoardType, StoryRelease } from '../../types/Board';
import { AgileCard, FeatureCard, UserStoryCard, MmfCard } from '../../types/Card';
import { CardEditor } from '../common/CardEditor';
import { ReferenceSelector } from '../common/ReferenceSelector';
import { useCards } from '../../hooks/useCards';
import { useServices } from '../../context/AppContext';
import { useApp } from '../../context/AppContext';

interface StoryBoardProps {
	board: StoryBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<StoryBoardType>) => Promise<void>;
}

export const StoryBoard = ({ board, boardPath, onBoardUpdate }: StoryBoardProps) => {
	const [creatingStory, setCreatingStory] = useState<string | null>(null); // featurePath
	const [creatingMmf, setCreatingMmf] = useState(false);
	const [draggedStory, setDraggedStory] = useState<string | null>(null);

	const features = useCards('feature') as FeatureCard[];
	const allStories = useCards('user-story') as UserStoryCard[];
	const mmfs = useCards('mmf') as MmfCard[];
	const { cardService, indexService } = useServices();
	const app = useApp();

	const backboneFeatures = board.backbone
		.map((ref) => indexService.getCardByPath(ref) as FeatureCard | undefined)
		.filter((f): f is FeatureCard => f !== undefined);

	const unlinkedFeatures = features.filter((f) => !board.backbone.includes(f.path));

	const storiesForFeature = (featurePath: string) =>
		allStories.filter((s) => s.feature === featurePath || s.feature.includes(featurePath));

	const storiesInMmf = (mmfCard: MmfCard) =>
		mmfCard.stories.flatMap((ref) => {
			const card = indexService.getCardByPath(ref);
			return card ? [card as UserStoryCard] : [];
		});

	const handleAddFeatureToBackbone = async (card: AgileCard) => {
		const backbone = [...board.backbone, card.path];
		await onBoardUpdate({ backbone });
	};

	const handleRemoveFeature = async (path: string) => {
		const backbone = board.backbone.filter((p) => p !== path);
		await onBoardUpdate({ backbone });
	};

	const handleCreateStory = async (title: string, fields: Record<string, unknown>) => {
		if (!creatingStory) return;
		const feature = backboneFeatures.find((f) => f.path === creatingStory);
		await cardService.createCard('user-story', title, {
			...fields,
			feature: feature ? `[[${feature.title}]]` : '',
		});
		setCreatingStory(null);
	};

	const handleCreateMmf = async (title: string, fields: Record<string, unknown>) => {
		await cardService.createCard('mmf', title, fields);
		setCreatingMmf(false);
	};

	const handleOpenCard = (card: AgileCard) => {
		app.workspace.openLinkText(card.title, boardPath, false);
	};

	return (
		<div className="agile-story-board">
			{/* Backbone row */}
			<div className="agile-story-board__backbone">
				<div className="agile-story-board__backbone-label">Backbone</div>
				<div className="agile-story-board__backbone-features">
					{backboneFeatures.map((feature) => (
						<div key={feature.path} className="agile-story-feature">
							<span
								className="agile-story-feature__title"
								onClick={() => handleOpenCard(feature)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => e.key === 'Enter' && handleOpenCard(feature)}
							>
								{feature.title}
							</span>
							<button
								className="agile-btn agile-btn--icon"
								onClick={() => handleRemoveFeature(feature.path)}
								title="Remove from backbone"
							>
								✕
							</button>
						</div>
					))}
					<ReferenceSelector
						cardType="feature"
						availableCards={unlinkedFeatures}
						selectedPaths={board.backbone}
						onSelect={handleAddFeatureToBackbone}
						onDeselect={handleRemoveFeature}
						multiSelect
					/>
				</div>
			</div>

			{/* Story grid */}
			<div className="agile-story-board__grid">
				{backboneFeatures.map((feature) => {
					const featureStories = storiesForFeature(feature.path);
					return (
						<div key={feature.path} className="agile-story-column">
							{featureStories.map((story) => (
								<div
									key={story.path}
									className={`agile-story-card agile-story-card--${story.status}`}
									draggable
									onDragStart={() => setDraggedStory(story.path)}
									onDragEnd={() => setDraggedStory(null)}
									onClick={() => handleOpenCard(story)}
									role="button"
									tabIndex={0}
									onKeyDown={(e) => e.key === 'Enter' && handleOpenCard(story)}
								>
									<div className="agile-story-card__title">{story.title}</div>
									{story.storyPoints !== undefined && (
										<span className="agile-story-card__points">{story.storyPoints}pts</span>
									)}
									<span className={`agile-story-card__status agile-story-card__status--${story.status}`}>
										{story.status}
									</span>
								</div>
							))}
							<button
								className="agile-btn agile-btn--add"
								onClick={() => setCreatingStory(feature.path)}
							>
								+ Story
							</button>
						</div>
					);
				})}
			</div>

			{/* MMF bands */}
			<div className="agile-story-board__mmfs">
				<h4>MMFs (Minimum Marketable Features)</h4>
				{mmfs.map((mmf) => (
					<div key={mmf.path} className="agile-mmf-band">
						<div className="agile-mmf-band__header">
							<span
								className="agile-mmf-band__title"
								onClick={() => handleOpenCard(mmf)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => e.key === 'Enter' && handleOpenCard(mmf)}
							>
								{mmf.title}
							</span>
							{mmf.description && (
								<span className="agile-mmf-band__description">{mmf.description}</span>
							)}
						</div>
						<div className="agile-mmf-band__stories">
							{storiesInMmf(mmf).map((story) => (
								<div key={story.path} className="agile-mmf-band__story-chip">
									{story.title}
								</div>
							))}
						</div>
					</div>
				))}
				<button className="agile-btn agile-btn--add" onClick={() => setCreatingMmf(true)}>
					+ MMF
				</button>
			</div>

			{creatingStory && (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="user-story"
							onSave={handleCreateStory}
							onCancel={() => setCreatingStory(null)}
						/>
					</div>
				</div>
			)}

			{creatingMmf && (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="mmf"
							onSave={handleCreateMmf}
							onCancel={() => setCreatingMmf(false)}
						/>
					</div>
				</div>
			)}
		</div>
	);
};
