import { useState } from 'react';
import { StoryBoard as StoryBoardType, StorySlice } from '../../types/Board';
import { Section } from '../common/Section';
import { PostIt } from '../common/PostIt';
import { AddPostIt } from '../common/AddPostIt';
import { useServices } from '../../context/AppContext';
import { CARD_TYPE } from '../../constants';

interface StoryBoardProps {
	board: StoryBoardType;
	boardPath: string;
	onBoardUpdate: (updates: Partial<StoryBoardType>) => Promise<void>;
}

export const StoryBoard = ({ board, boardPath, onBoardUpdate }: StoryBoardProps) => {
	const { referenceService } = useServices();

	const addBackbone = (ref: string) => onBoardUpdate({ backbone: [...board.backbone, ref] });

	const removeBackbone = (i: number) => {
		const ref = board.backbone[i];
		const backbone = board.backbone.filter((_, idx) => idx !== i);
		const stories = { ...board.stories };
		delete stories[ref];
		onBoardUpdate({ backbone, stories });
	};

	const replaceBackbone = (i: number, next: string) => {
		const old = board.backbone[i];
		const backbone = board.backbone.map((r, idx) => (idx === i ? next : r));
		const stories = { ...board.stories };
		if (old in stories) { stories[next] = stories[old]; delete stories[old]; }
		onBoardUpdate({ backbone, stories });
	};

	const setColumn = (backboneRef: string, refs: string[]) => {
		onBoardUpdate({ stories: { ...board.stories, [backboneRef]: refs } });
	};

	const updateSlices = (slices: StorySlice[]) => onBoardUpdate({ slices });
	const addSlice = () => updateSlices([...board.slices, { name: `Release ${board.slices.length + 1}`, stories: [] }]);
	const renameSlice = (i: number, name: string) => updateSlices(board.slices.map((s, idx) => (idx === i ? { ...s, name } : s)));
	const removeSlice = (i: number) => updateSlices(board.slices.filter((_, idx) => idx !== i));
	const setSliceStories = (i: number, refs: string[]) => updateSlices(board.slices.map((s, idx) => (idx === i ? { ...s, stories: refs } : s)));

	return (
		<div className="agile-story-board">
			{/* Backbone */}
			<div className="agile-story-board__backbone">
				<div className="agile-story-board__backbone-label">Backbone</div>
				<div className="agile-story-board__backbone-features">
					{board.backbone.map((ref, i) => (
						<div key={`${ref}-${i}`} className="agile-story-feature">
							<PostIt
								refStr={ref}
								sourcePath={boardPath}
								onRemove={() => removeBackbone(i)}
								onReplace={(next) => replaceBackbone(i, next)}
								compact
								cardType={CARD_TYPE.feature}
							/>
						</div>
					))}
					<AddPostIt sourcePath={boardPath} onAdd={addBackbone} label="+ Activity" cardType={CARD_TYPE.feature} />
				</div>
			</div>

			{/* Story columns */}
			<div className="agile-story-board__grid">
				{board.backbone.map((ref, i) => (
					<div key={`${ref}-${i}`} className="agile-story-column">
						<div className="agile-story-column__head">{referenceService.label(ref)}</div>
						<Section
							refs={board.stories[ref] ?? []}
							sourcePath={boardPath}
							onChange={(refs) => setColumn(ref, refs)}
							compact
							addLabel="+ Story"
							cardType={CARD_TYPE.story}
						/>
					</div>
				))}
			</div>

			{/* Release slices */}
			<div className="agile-story-board__mmfs">
				<h4>Releases (slices)</h4>
				{board.slices.map((slice, i) => (
					<div key={i} className="agile-mmf-band">
						<div className="agile-mmf-band__header">
							<input
								className="agile-field__input agile-mmf-band__name"
								value={slice.name}
								onChange={(e) => renameSlice(i, e.target.value)}
							/>
							<button className="agile-btn agile-btn--icon agile-btn--danger" onClick={() => removeSlice(i)} title="Remove slice">✕</button>
						</div>
						<Section
							refs={slice.stories}
							sourcePath={boardPath}
							onChange={(refs) => setSliceStories(i, refs)}
							compact
							addLabel="+ Story"
							cardType={CARD_TYPE.story}
						/>
					</div>
				))}
				<button className="agile-btn agile-btn--add" onClick={addSlice}>+ Release slice</button>
			</div>
		</div>
	);
};
