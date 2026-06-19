import { ImpactBoard as ImpactBoardType, ImpactActor, ImpactNode } from '../../types/Board';
import { Section } from '../common/Section';
import { PostIt } from '../common/PostIt';
import { AddPostIt } from '../common/AddPostIt';

interface ImpactBoardProps {
	board: ImpactBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<ImpactBoardType>) => Promise<void>;
}

export const ImpactBoard = ({ board, boardPath, onBoardUpdate }: ImpactBoardProps) => {
	const updateActors = (fn: (actors: ImpactActor[]) => ImpactActor[]) => {
		onBoardUpdate({ actors: fn(board.actors.map(cloneActor)) });
	};

	const setGoal = (goal: string) => onBoardUpdate({ goal });
	const addActor = (ref: string) => updateActors((a) => [...a, { actor: ref, impacts: [] }]);
	const removeActor = (i: number) => updateActors((a) => a.filter((_, idx) => idx !== i));
	const replaceActor = (i: number, ref: string) => updateActors((a) => a.map((x, idx) => (idx === i ? { ...x, actor: ref } : x)));

	const addImpact = (ai: number, ref: string) =>
		updateActors((a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: [...x.impacts, { impact: ref, deliverables: [] }] } : x)));
	const removeImpact = (ai: number, ii: number) =>
		updateActors((a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: x.impacts.filter((_, j) => j !== ii) } : x)));
	const replaceImpact = (ai: number, ii: number, ref: string) =>
		updateActors((a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: x.impacts.map((im, j) => (j === ii ? { ...im, impact: ref } : im)) } : x)));
	const setDeliverables = (ai: number, ii: number, refs: string[]) =>
		updateActors((a) => a.map((x, idx) => (idx === ai ? { ...x, impacts: x.impacts.map((im, j) => (j === ii ? { ...im, deliverables: refs } : im)) } : x)));

	const toggleCollapse = (actorRef: string) => {
		const collapsed = board.collapsed.includes(actorRef)
			? board.collapsed.filter((r) => r !== actorRef)
			: [...board.collapsed, actorRef];
		onBoardUpdate({ collapsed });
	};

	return (
		<div className="agile-impact-board">
			<div className="agile-impact-tree">
				{/* Why — Goal */}
				<div className="agile-impact-node agile-impact-node--goal">
					<span className="agile-impact-node__type">Goal (Why)</span>
					<div className="agile-impact-node__label">
						{board.goal ? (
							<PostIt refStr={board.goal} sourcePath={boardPath} onRemove={() => setGoal('')} onReplace={setGoal} compact cardType="Goal" />
						) : (
							<AddPostIt sourcePath={boardPath} onAdd={setGoal} label="+ Goal" cardType="Goal" />
						)}
					</div>
				</div>

				{/* Who — Actors */}
				<div className="agile-impact-children">
					{board.actors.map((actor, ai) => {
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
											onRemove={() => removeActor(ai)}
											onReplace={(ref) => replaceActor(ai, ref)}
											compact
											cardType="Actor"
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
															onRemove={() => removeImpact(ai, ii)}
															onReplace={(ref) => replaceImpact(ai, ii, ref)}
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
														onChange={(refs) => setDeliverables(ai, ii, refs)}
														compact
														addLabel="+ Deliverable"
														cardType="Deliverable"
													/>
												</div>
											</div>
										))}
										<AddPostIt sourcePath={boardPath} onAdd={(ref) => addImpact(ai, ref)} label="+ Impact" cardType="Impact" />
									</div>
								)}
							</div>
						);
					})}
					<AddPostIt sourcePath={boardPath} onAdd={addActor} label="+ Actor" cardType="Actor" />
				</div>
			</div>
		</div>
	);

	function cloneActor(a: ImpactActor): ImpactActor {
		return { actor: a.actor, impacts: a.impacts.map((i) => ({ impact: i.impact, deliverables: [...i.deliverables] })) };
	}
};
