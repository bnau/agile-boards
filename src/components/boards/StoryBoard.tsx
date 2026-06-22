import { useEffect, useReducer, useState } from 'react';
import { TFile } from 'obsidian';
import { StoryBoard as StoryBoardType, MMF, ImpactBoard } from '../../types/Board';
import { Section } from '../common/Section';
import { PostIt } from '../common/PostIt';
import { openNotePicker } from '../common/NotePicker';
import { useApp, useServices } from '../../context/AppContext';
import { CARD_TYPE } from '../../constants';

interface StoryBoardProps {
	board: StoryBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<StoryBoardType>) => Promise<void>;
}

/** A leaf column of the table: one feature, under its actor, on its impact row. */
interface FeatureCol {
	ref: string;   // feature reference (impact-map deliverable form)
	key: string;   // resolved identity (note path) — stable cell key
	impactKey: string;
}
interface ActorCol {
	ref: string;          // actor reference
	features: FeatureCol[];
}

export const StoryBoard = ({ board, boardPath, onBoardUpdate }: StoryBoardProps) => {
	const app = useApp();
	const { boardService, referenceService, indexService } = useServices();

	// Re-render when any board changes so the table tracks edits to the source impact map.
	const [, force] = useReducer((x: number) => x + 1, 0);
	useEffect(() => indexService.subscribe(force), [indexService]);

	/* ===== source impact map ===== */
	const impactBoards = indexService.getBoardsOfType('impact-map');
	const impactFile = board.impactMap ? referenceService.resolve(board.impactMap, boardPath) : null;

	const [impactBoard, setImpactBoard] = useState<ImpactBoard | null>(null);
	useEffect(() => {
		if (!impactFile) { setImpactBoard(null); return; }
		boardService.parseBoardAsync(impactFile).then((b) =>
			setImpactBoard(b?.boardType === 'impact-map' ? (b as ImpactBoard) : null),
		);
	}, [impactFile?.path, boardService]);

	const impactMapValid = impactBoard?.boardType === 'impact-map';

	const boardLabel = (f: TFile) => indexService.getBoardTitle(f.path) ?? f.basename;

	const selectImpactMap = (path: string) => {
		const f = impactBoards.find((b) => b.path === path);
		onBoardUpdate({ impactMap: f ? referenceService.toWikilink(f, boardPath) : '' });
	};

	/** Stable identity for a reference (resolved note path, or its linkpath if missing). */
	const keyOf = (ref: string, src: string) => {
		const dest = referenceService.resolve(ref, src);
		return dest ? dest.path : referenceService.linkpath(ref);
	};

	/* ===== MMF mutations ===== */
	const updateMmfs = (fn: (mmfs: MMF[]) => MMF[]) => onBoardUpdate({ mmfs: fn(board.mmfs.map(cloneMmf)) });
	const addMmf = () => updateMmfs((m) => [...m, { name: `MMF ${m.length + 1}`, features: [] }]);
	const renameMmf = (i: number, name: string) => updateMmfs((m) => m.map((x, idx) => (idx === i ? { ...x, name } : x)));
	const removeMmf = (i: number) => updateMmfs((m) => m.filter((_, idx) => idx !== i));
	const addFeature = (i: number, ref: string) =>
		updateMmfs((m) => m.map((x, idx) => (idx === i ? { ...x, features: [...x.features, ref] } : x)));

	const removeFeature = (i: number, fi: number) => {
		const removed = board.mmfs[i].features[fi];
		const mmfs = board.mmfs
			.map(cloneMmf)
			.map((x, idx) => (idx === i ? { ...x, features: x.features.filter((_, j) => j !== fi) } : x));
		const stories = { ...board.stories };
		delete stories[keyOf(removed, boardPath)];
		onBoardUpdate({ mmfs, stories });
	};

	// Called when a feature note is renamed from this board's PostIt.
	// Updates both the wikilink in mmfs and the path-keyed stories dict.
	const replaceFeature = (i: number, fi: number, oldKey: string, newRef: string) => {
		const mmfs = board.mmfs
			.map(cloneMmf)
			.map((x, idx) => idx === i ? { ...x, features: x.features.map((r, j) => j === fi ? newRef : r) } : x);
		const newFile = referenceService.resolve(newRef, boardPath);
		const newKey = newFile ? newFile.path : oldKey;
		const stories = { ...board.stories };
		if (oldKey !== newKey && oldKey in stories) {
			stories[newKey] = stories[oldKey];
			delete stories[oldKey];
		}
		onBoardUpdate({ mmfs, stories });
	};

	/* ===== import picker (impact-map deliverables not yet used in any MMF) ===== */
	const usedFeatureKeys = new Set<string>();
	for (const m of board.mmfs) for (const f of m.features) usedFeatureKeys.add(keyOf(f, boardPath));

	const importableFiles = (): TFile[] => {
		if (!impactBoard || !impactFile) return [];
		const files: TFile[] = [];
		const seen = new Set<string>();
		for (const goal of impactBoard.goals)
			for (const actor of goal.actors)
				for (const node of actor.impacts)
					for (const d of node.deliverables) {
						const dest = referenceService.resolve(d, impactFile.path);
						if (!dest || seen.has(dest.path) || usedFeatureKeys.has(dest.path)) continue;
						seen.add(dest.path);
						files.push(dest);
					}
		return files;
	};

	const openImport = (mmfIndex: number) => {
		const items = importableFiles();
		openNotePicker(
			app,
			(file) => addFeature(mmfIndex, referenceService.toWikilink(file, boardPath)),
			{ items, cardType: CARD_TYPE.feature },
		);
	};

	/* ===== derive the actor / feature / impact table from the impact map ===== */
	const importedKeys = new Set(board.mmfs.flatMap((m) => m.features.map((f) => keyOf(f, boardPath))));
	const actorCols: ActorCol[] = [];
	const actorByKey = new Map<string, ActorCol>();
	const impactRows: { ref: string; key: string }[] = [];
	const impactSeen = new Set<string>();

	if (impactBoard && impactFile) {
		for (const goal of impactBoard.goals)
			for (const actor of goal.actors) {
				const aKey = keyOf(actor.actor, impactFile.path);
				for (const node of actor.impacts) {
					const iKey = keyOf(node.impact, impactFile.path);
					for (const d of node.deliverables) {
						const dKey = keyOf(d, impactFile.path);
						if (!importedKeys.has(dKey)) continue;
						let col = actorByKey.get(aKey);
						if (!col) { col = { ref: actor.actor, features: [] }; actorByKey.set(aKey, col); actorCols.push(col); }
						if (!col.features.some((f) => f.key === dKey)) col.features.push({ ref: d, key: dKey, impactKey: iKey });
						if (!impactSeen.has(iKey)) { impactSeen.add(iKey); impactRows.push({ ref: node.impact, key: iKey }); }
					}
				}
			}
	}
	const leafCols = actorCols.reduce((n, c) => n + c.features.length, 0);

	const setCellStories = (featureKey: string, refs: string[]) =>
		onBoardUpdate({ stories: { ...board.stories, [featureKey]: refs } });

	return (
		<div className="agile-story-board">
			{/* Source impact map */}
			<div className="agile-story-source">
				<label className="agile-story-source__label">Source impact map</label>
				<select
					className="agile-field__input agile-story-source__select"
					value={impactFile?.path ?? ''}
					onChange={(e) => selectImpactMap(e.target.value)}
				>
					<option value="">— Select an impact map —</option>
					{impactBoards.map((f) => (
						<option key={f.path} value={f.path}>{boardLabel(f)}</option>
					))}
				</select>
				{board.impactMap && !impactMapValid && (
					<span className="agile-story-source__warn">Linked impact map not found.</span>
				)}
			</div>

			{!impactMapValid && (
				<div className="agile-empty-state">
					<p>Select a source impact map above to import features into MMFs.</p>
				</div>
			)}

			{impactMapValid && (
				<>
					{/* MMFs */}
					<div className="agile-story-mmfs">
						<h4>MMFs</h4>
						{board.mmfs.map((mmf, i) => (
							<div key={i} className="agile-mmf">
								<div className="agile-mmf__header">
									<input
										className="agile-field__input agile-mmf__name"
										value={mmf.name}
										onChange={(e) => renameMmf(i, e.target.value)}
									/>
									<button
										className="agile-btn agile-btn--icon agile-btn--danger"
										onClick={() => removeMmf(i)}
										title="Remove MMF"
									>
										✕
									</button>
								</div>
								<div className="agile-mmf__features">
									{mmf.features.map((ref, fi) => {
									const featureKey = keyOf(ref, boardPath);
									return (
										<div key={`${ref}-${fi}`} className="agile-story-feature">
											<PostIt
												refStr={ref}
												sourcePath={boardPath}
												onRemove={() => removeFeature(i, fi)}
												onReplace={(newRef) => replaceFeature(i, fi, featureKey, newRef)}
												compact
												cardType={CARD_TYPE.feature}
											/>
										</div>
									);
								})}
									<button
										className="agile-btn agile-btn--add agile-btn--small"
										onClick={() => openImport(i)}
										title="Import a feature from the impact map"
									>
										+ Import feature
									</button>
								</div>
							</div>
						))}
						<button className="agile-btn agile-btn--add" onClick={addMmf}>+ MMF</button>
					</div>

					{/* Derived table: actors × features (cols) over impacts (rows) */}
					<div className="agile-story-table-wrap">
						<h4>User stories</h4>
						{leafCols === 0 ? (
							<div className="agile-empty-state">
								<p>Import features into an MMF to build the table.</p>
							</div>
						) : (
							<table className="agile-story-table">
								<thead>
									<tr>
										<th className="agile-story-table__corner" rowSpan={2}>Impact \ Feature</th>
										{actorCols.map((col, ci) => (
											<th key={ci} className="agile-story-table__actor" colSpan={col.features.length}>
												{referenceService.label(col.ref)}
											</th>
										))}
									</tr>
									<tr>
										{actorCols.flatMap((col, ci) =>
											col.features.map((f, fi) => (
												<th key={`${ci}-${fi}`} className="agile-story-table__feature">
													{referenceService.label(f.ref)}
												</th>
											)),
										)}
									</tr>
								</thead>
								<tbody>
									{impactRows.map((row) => (
										<tr key={row.key}>
											<th className="agile-story-table__impact" scope="row">
												{referenceService.label(row.ref)}
											</th>
											{actorCols.flatMap((col, ci) =>
												col.features.map((f, fi) => (
													<td key={`${ci}-${fi}`} className="agile-story-table__cell">
														{f.impactKey === row.key ? (
															<Section
																refs={board.stories[f.key] ?? []}
																sourcePath={boardPath}
																onChange={(refs) => setCellStories(f.key, refs)}
																compact
																addLabel="+ US"
																cardType={CARD_TYPE.story}
															/>
														) : null}
													</td>
												)),
											)}
										</tr>
									))}
								</tbody>
							</table>
						)}
					</div>
				</>
			)}
		</div>
	);

	function cloneMmf(m: MMF): MMF {
		return { name: m.name, features: [...m.features] };
	}
};
