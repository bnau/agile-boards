import { WorkspaceLeaf } from 'obsidian';
import { AgileBoardView } from './AgileBoardView';
import { PluginServices } from '../context/AppContext';
import { RoadmapBoard } from '../components/boards/RoadmapBoard';
import { VIEW_TYPE_ROADMAP } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { RoadmapBoard as RoadmapBoardType } from '../types/Board';

export class RoadmapView extends AgileBoardView {
	constructor(leaf: WorkspaceLeaf, services: PluginServices) {
		super(leaf, services);
	}

	getViewType(): string { return VIEW_TYPE_ROADMAP; }
	getDisplayText(): string { return 'Roadmap'; }
	getIcon(): string { return 'calendar-range'; }

	protected renderContent() {
		return <RoadmapViewContent boardPath={this.boardPath} />;
	}
}

const RoadmapViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

	if (!boardPath) return (
		<div className="agile-boards-container agile-empty-state">
			<p>No board selected.</p>
		</div>
	);
	if (!board) return <div className="agile-boards-container">Loading board...</div>;
	if (board.boardType !== 'roadmap') return <div className="agile-boards-container">Invalid board type.</div>;

	return (
		<div className="agile-boards-container">
			<h2>{board.title}</h2>
			<RoadmapBoard
				board={board as RoadmapBoardType}
				boardPath={boardPath}
				onBoardUpdate={(updates) => updateBoard(updates as Partial<RoadmapBoardType>)}
			/>
		</div>
	);
};
