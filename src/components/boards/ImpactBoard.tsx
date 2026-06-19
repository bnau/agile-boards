import { ImpactBoard as ImpactBoardType, ImpactGoal, ImpactActor, ImpactNode } from '../../types/Board';
import { Section } from '../common/Section';
import { PostIt } from '../common/PostIt';
import { AddPostIt } from '../common/AddPostIt';
import { CARD_TYPE } from '../../constants';

interface ImpactBoardProps {
	board: ImpactBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<ImpactBoardType>) => Promise<void>;
}

export const ImpactBoard = ({ board, boardPath, onBoardUpdate }: ImpactBoardProps) => {
	const updateGoals = (fn: (goals: ImpactGoal[]) => ImpactGoal[]) => {
		onBoardUpdate({ goals: fn(board.goals.map(cloneGoal)) });
	};

	const addGoal = (ref: string) => updateGoals((g) => [...g, { goal: ref, actors: [] }]);
	const removeGoal = (gi: number) => updateGoals((g) => g.filter((_, idx) => idx !== gi));
	const replaceGoal = (gi: number, ref: string) =>
		updateGoals((g) => g.map((x, idx) => (idx === gi ? { ...x, goal: ref } : x)));

	const updateActors = (gi: number, fn: (actors: ImpactActor[]) => ImpactActor[]) =>
		updateGoals((g) => g.map((x, idx) => (idx === gi ? { ...x, actors: fn(x.actors) } : x)));

	const addActor = (gi: number, ref: string) => updateActors(gi, (a) => [...a, { actor: ref, impacts: [] }]);
	const removeActor = (gi: number, i: number) => updateActors(gi, (a) => a.filter((_, idx) => idx !== i));
	const replaceActor = (gi: number, i: number, ref: string) =>
		updateActors(gi, (a) => a.map((x, idx) => (idx === i ? { ...x, actor: ref } : x)));

	const addImpact = (gi: number, ai: number, ref: string) =>
		updateActors(gi, (a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: [...x.impacts, { impact: ref, deliverables: [] }] } : x)));
	const removeImpact = (gi: number, ai: number, ii: number) =>
		updateActors(gi, (a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: x.impacts.filter((_, j) => j !== ii) } : x)));
	const replaceImpact = (gi: number, ai: number, ii: number, ref: string) =>
		updateActors(gi, (a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: x.impacts.map((im, j) => (j === ii ? { ...im, impact: ref } : im)) } : x)));
	const setDeliverables = (gi: number, ai: number, ii: number, refs: string[]) =>
		updateActors(gi, (a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: x.impacts.map((im, j) => (j === ii ? { ...im, deliverables: refs } : im)) } : x)));

	const toggleCollapse = (actorRef: string) => {
		const collapsed = board.collapsed.includes(actorRef)
			? board.collapsed.filter((r) => r !== actorRef)
			: [...board.collapsed, actorRef];
		onBoardUpdate({ collapsed });
	};

	return (
		<div className="agile-impact-board">
			<div className="agile-impact-tree">
				{board.goals.map((goalNode, gi) => (
					<div key={`${goalNode.goal}-${gi}`} className="agile-impact-goal">
						{/* Why — Goal */}
						<div className="agile-impact-node agile-impact-node--goal">
							<span className="agile-impact-node__type">Goal (Why)</span>
							<div className="agile-impact-node__label">
								<PostIt
									refStr={goalNode.goal}
									sourcePath={boardPath}
									onRemove={() => removeGoal(gi)}
									onReplace={(ref) => replaceGoal(gi, ref)}
									compact
									cardType="Goal"
								/>
							</div>
						</div>

						{/* Who — Actors */}
						<div className="agile-impact-children">
							{goalNode.actors.map((actor, ai) => {
								const collapsed = board.collapsed.includes(actor.actor);
								return (
									<div key={`${actor.actor}-${ai}`} className="agile-impact-branch">
										<div className="agile-impact-node agile-impact-node--actor">
											<span
												className="agile-impact-node__toggle"
												onClick={() => toggleCollapse(actor.actor)}
												role="button"
												tabIndex={0}
												onKeyDown={(e) => e.key === 'Enter' && toggleCollapse(actor.actor)}
												title={collapsed ? 'Expand' : 'Collapse'}
											>
												{collapsed ? '▶' : '▼'}
											</span>
											<span className="agile-impact-node__type">Actor (Who)</span>
											<div className="agile-impact-node__label">
												<PostIt
													refStr={actor.actor}
													sourcePath={boardPath}
													onRemove={() => removeActor(gi, ai)}
													onReplace={(ref) => replaceActor(gi, ai, ref)}
													compact
													cardType={CARD_TYPE.customerSegment}
												/>
											</div>
										</div>

										{!collapsed && (
											<div className="agile-impact-children agile-impact-children--impacts">
												{actor.impacts.map((node: ImpactNode, ii) => (
													<div key={`${node.impact}-${ii}`} className="agile-impact-branch">
														<div className="agile-impact-node agile-impact-node--impact">
															<span className="agile-impact-node__type">Impact (How)</span>
															<div className="agile-impact-node__label">
																<PostIt
																	refStr={node.impact}
																	sourcePath={boardPath}
																	onRemove={() => removeImpact(gi, ai, ii)}
																	onReplace={(ref) => replaceImpact(gi, ai, ii, ref)}
																	compact
																	cardType="Impact"
																/>
															</div>
														</div>
														<div className="agile-impact-children agile-impact-children--features">
															<Section
																title="Deliverables (What)"
																refs={node.deliverables}
																sourcePath={boardPath}
																onChange={(refs) => setDeliverables(gi, ai, ii, refs)}
																compact
																addLabel="+ Deliverable"
																cardType={CARD_TYPE.feature}
															/>
														</div>
													</div>
												))}
												<AddPostIt sourcePath={boardPath} onAdd={(ref) => addImpact(gi, ai, ref)} label="+ Impact" cardType="Impact" />
											</div>
										)}
									</div>
								);
							})}
							<AddPostIt sourcePath={boardPath} onAdd={(ref) => addActor(gi, ref)} label="+ Actor" cardType={CARD_TYPE.customerSegment} />
						</div>
					</div>
				))}

				<div className="agile-impact-add-goal">
					<AddPostIt sourcePath={boardPath} onAdd={addGoal} label="+ Goal" cardType="Goal" />
				</div>
			</div>
		</div>
	);

	function cloneGoal(g: ImpactGoal): ImpactGoal {
		return { goal: g.goal, actors: g.actors.map(cloneActor) };
	}

	function cloneActor(a: ImpactActor): ImpactActor {
		return { actor: a.actor, impacts: a.impacts.map((i) => ({ impact: i.impact, deliverables: [...i.deliverables] })) };
	}
};
