import { WorkspaceLeaf } from 'obsidian';
import { AgileBoardView } from './AgileBoardView';
import { PluginServices } from '../context/AppContext';
import { StoryBoard } from '../components/boards/StoryBoard';
import { VIEW_TYPE_STORY } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { StoryBoard as StoryBoardType } from '../types/Board';

export class StoryMapView extends AgileBoardView {
	constructor(leaf: WorkspaceLeaf, services: PluginServices) {
		super(leaf, services);
	}

	getViewType(): string { return VIEW_TYPE_STORY; }
	getDisplayText(): string { return 'Story Map'; }
	getIcon(): string { return 'map'; }

	protected renderContent() {
		return <StoryViewContent boardPath={this.boardPath} />;
	}
}

const StoryViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

	if (!boardPath) return (
		<div className="agile-boards-container agile-empty-state">
			<p>No board selected.</p>
		</div>
	);
	if (!board) return <div className="agile-boards-container">Loading board...</div>;
	if (board.boardType !== 'story-map') return <div className="agile-boards-container">Invalid board type.</div>;

	return (
		<div className="agile-boards-container">
			<h2>{board.title}</h2>
			<StoryBoard
				board={board as StoryBoardType}
				boardPath={boardPath}
				onBoardUpdate={(updates) => updateBoard(updates as Partial<StoryBoardType>)}
			/>
		</div>
	);
};
