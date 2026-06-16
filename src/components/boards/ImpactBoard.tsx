import { useState } from 'react';
import { ImpactBoard as ImpactBoardType } from '../../types/Board';
import { AgileCard, CustomerCard, GoalCard, ImpactCard, FeatureCard } from '../../types/Card';
import { CardEditor } from '../common/CardEditor';
import { ReferenceSelector } from '../common/ReferenceSelector';
import { MissingReference } from '../common/MissingReference';
import { useCards } from '../../hooks/useCards';
import { useReference } from '../../hooks/useReferences';
import { useServices } from '../../context/AppContext';
import { useApp } from '../../context/AppContext';

interface ImpactBoardProps {
	board: ImpactBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<ImpactBoardType>) => Promise<void>;
}

export const ImpactBoard = ({ board, boardPath, onBoardUpdate }: ImpactBoardProps) => {
	const [creatingGoal, setCreatingGoal] = useState(false);
	const app = useApp();

	const goalCard = useReference(board.goal) as GoalCard | undefined;
	const customers = useCards('customer') as CustomerCard[];
	const impacts = useCards('impact') as ImpactCard[];
	const features = useCards('feature') as FeatureCard[];
	const goals = useCards('goal');
	const { cardService } = useServices();

	const handleCreateGoal = async (title: string, fields: Record<string, unknown>) => {
		const file = await cardService.createCard('goal', title, fields);
		await onBoardUpdate({ goal: file.path });
		setCreatingGoal(false);
	};

	const handleLinkGoal = async (card: AgileCard) => {
		await onBoardUpdate({ goal: card.path });
	};

	const handleOpenCard = (card: AgileCard) => {
		app.workspace.openLinkText(card.title, boardPath, false);
	};

	const toggleNodeExpanded = async (path: string) => {
		const expanded = board.expandedNodes.includes(path)
			? board.expandedNodes.filter((p) => p !== path)
			: [...board.expandedNodes, path];
		await onBoardUpdate({ expandedNodes: expanded });
	};

	const actorsForGoal = customers; // All customers can be actors

	const impactsForActor = (actorPath: string) =>
		impacts.filter((i) => i.actor === actorPath || i.actor.includes(actorPath));

	const featuresForImpact = (impactPath: string) =>
		features.filter((f) => f.impacts.some((ref) => ref === impactPath || ref.includes(impactPath)));

	return (
		<div className="agile-impact-board">
			{/* Goal (root) */}
			<div className="agile-impact-tree">
				<div className="agile-impact-node agile-impact-node--goal">
					<div className="agile-impact-node__label">
						<span className="agile-impact-node__type">Goal</span>
						{goalCard ? (
							<span
								className="agile-impact-node__title"
								onClick={() => handleOpenCard(goalCard)}
								role="button"
								tabIndex={0}
								onKeyDown={(e) => e.key === 'Enter' && handleOpenCard(goalCard)}
							>
								{goalCard.title}
							</span>
						) : board.goal ? (
							<MissingReference
								label={board.goal}
								onCreateNew={() => setCreatingGoal(true)}
							/>
						) : (
							<div className="agile-impact-node__actions">
								<ReferenceSelector
									cardType="goal"
									availableCards={goals}
									selectedPaths={[]}
									onSelect={handleLinkGoal}
									onDeselect={() => {}}
									onCreateNew={() => setCreatingGoal(true)}
								/>
							</div>
						)}
					</div>
				</div>

				{/* Actors */}
				{goalCard && (
					<div className="agile-impact-children">
						{actorsForGoal.map((actor) => {
							const actorImpacts = impactsForActor(actor.path);
							const isExpanded = board.expandedNodes.includes(actor.path);

							return (
								<div key={actor.path} className="agile-impact-branch">
									<div
										className="agile-impact-node agile-impact-node--actor"
										onClick={() => toggleNodeExpanded(actor.path)}
										role="button"
										tabIndex={0}
										onKeyDown={(e) => e.key === 'Enter' && toggleNodeExpanded(actor.path)}
									>
										<span className="agile-impact-node__toggle">{isExpanded ? '▼' : '▶'}</span>
										<span className="agile-impact-node__type">Actor</span>
										<span className="agile-impact-node__title">{actor.title}</span>
									</div>

									{isExpanded && (
										<ActorImpacts
											actor={actor}
											impacts={actorImpacts}
											features={features}
											boardPath={boardPath}
											goalPath={goalCard.path}
											onOpenCard={handleOpenCard}
										/>
									)}
								</div>
							);
						})}
					</div>
				)}
			</div>

			{creatingGoal && (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="goal"
							onSave={handleCreateGoal}
							onCancel={() => setCreatingGoal(false)}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

interface ActorImpactsProps {
	actor: CustomerCard;
	impacts: ImpactCard[];
	features: FeatureCard[];
	boardPath: string;
	goalPath: string;
	onOpenCard: (card: AgileCard) => void;
}

const ActorImpacts = ({ actor, impacts, features, goalPath, onOpenCard }: ActorImpactsProps) => {
	const [creatingImpact, setCreatingImpact] = useState(false);
	const { cardService } = useServices();

	const handleCreateImpact = async (title: string, fields: Record<string, unknown>) => {
		await cardService.createCard('impact', title, {
			...fields,
			goal: `[[${goalPath}]]`,
			actor: `[[${actor.title}]]`,
		});
		setCreatingImpact(false);
	};

	return (
		<div className="agile-impact-children agile-impact-children--impacts">
			{impacts.map((impact) => {
				const impactFeatures = features.filter((f) =>
					f.impacts.some((ref) => ref === impact.path || ref.includes(impact.title))
				);
				return (
					<div key={impact.path} className="agile-impact-branch">
						<div
							className="agile-impact-node agile-impact-node--impact"
							onClick={() => onOpenCard(impact)}
							role="button"
							tabIndex={0}
							onKeyDown={(e) => e.key === 'Enter' && onOpenCard(impact)}
						>
							<span className="agile-impact-node__type">Impact</span>
							<span className="agile-impact-node__title">{impact.title}</span>
						</div>
						<ImpactFeatures
							impact={impact}
							features={impactFeatures}
							onOpenCard={onOpenCard}
						/>
					</div>
				);
			})}
			{creatingImpact ? (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="impact"
							onSave={handleCreateImpact}
							onCancel={() => setCreatingImpact(false)}
						/>
					</div>
				</div>
			) : (
				<button className="agile-btn agile-btn--add" onClick={() => setCreatingImpact(true)}>
					+ Impact
				</button>
			)}
		</div>
	);
};

const ImpactFeatures = ({ impact, features, onOpenCard }: { impact: ImpactCard; features: FeatureCard[]; onOpenCard: (c: AgileCard) => void }) => {
	const [creatingFeature, setCreatingFeature] = useState(false);
	const { cardService } = useServices();

	const handleCreateFeature = async (title: string, fields: Record<string, unknown>) => {
		await cardService.createCard('feature', title, {
			...fields,
			impacts: [`[[${impact.title}]]`],
		});
		setCreatingFeature(false);
	};

	return (
		<div className="agile-impact-children agile-impact-children--features">
			{features.map((feature) => (
				<div
					key={feature.path}
					className="agile-impact-node agile-impact-node--feature"
					onClick={() => onOpenCard(feature)}
					role="button"
					tabIndex={0}
					onKeyDown={(e) => e.key === 'Enter' && onOpenCard(feature)}
				>
					<span className="agile-impact-node__type">Feature</span>
					<span className="agile-impact-node__title">{feature.title}</span>
				</div>
			))}
			{creatingFeature ? (
				<div className="agile-overlay">
					<div className="agile-overlay__content">
						<CardEditor
							cardType="feature"
							onSave={handleCreateFeature}
							onCancel={() => setCreatingFeature(false)}
						/>
					</div>
				</div>
			) : (
				<button className="agile-btn agile-btn--add" onClick={() => setCreatingFeature(true)}>
					+ Feature
				</button>
			)}
		</div>
	);
};
