import { WorkspaceLeaf } from 'obsidian';
import { AgileBoardView } from './AgileBoardView';
import { PluginServices } from '../context/AppContext';
import { LeanBoard } from '../components/boards/LeanBoard';
import { VIEW_TYPE_LEAN } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { LeanBoard as LeanBoardType } from '../types/Board';

export class LeanCanvasView extends AgileBoardView {
	constructor(leaf: WorkspaceLeaf, services: PluginServices) {
		super(leaf, services);
	}

	getViewType(): string { return VIEW_TYPE_LEAN; }
	getDisplayText(): string { return 'Lean Canvas'; }
	getIcon(): string { return 'layout-dashboard'; }

	protected renderContent() {
		return <LeanViewContent boardPath={this.boardPath} />;
	}
}

const LeanViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

	if (!boardPath) return (
		<div className="agile-boards-container agile-empty-state">
			<p>No board selected.</p>
		</div>
	);
	if (!board) return <div className="agile-boards-container">Loading board...</div>;
	if (board.boardType !== 'lean-canvas') return <div className="agile-boards-container">Invalid board type.</div>;

	return (
		<div className="agile-boards-container">
			<h2>{board.title}</h2>
			<LeanBoard
				board={board as LeanBoardType}
				boardPath={boardPath}
				onBoardUpdate={(updates) => updateBoard(updates as Partial<LeanBoardType>)}
			/>
		</div>
	);
};
