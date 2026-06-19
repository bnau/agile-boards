import { WorkspaceLeaf } from 'obsidian';
import { AgileBoardView } from './AgileBoardView';
import { PluginServices } from '../context/AppContext';
import { KanbanBoard } from '../components/boards/KanbanBoard';
import { VIEW_TYPE_KANBAN } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { KanbanBoard as KanbanBoardType } from '../types/Board';

export class KanbanView extends AgileBoardView {
	constructor(leaf: WorkspaceLeaf, services: PluginServices) {
		super(leaf, services);
	}

	getViewType(): string { return VIEW_TYPE_KANBAN; }
	getDisplayText(): string { return 'Kanban'; }
	getIcon(): string { return 'square-kanban'; }

	protected renderContent() {
		return <KanbanViewContent boardPath={this.boardPath} />;
	}
}

const KanbanViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

	if (!boardPath) return (
		<div className="agile-boards-container agile-empty-state">
			<p>No board selected.</p>
		</div>
	);
	if (!board) return <div className="agile-boards-container">Loading board...</div>;
	if (board.boardType !== 'kanban') return <div className="agile-boards-container">Invalid board type.</div>;

	return (
		<div className="agile-boards-container">
			<h2>{board.title}</h2>
			<KanbanBoard
				board={board as KanbanBoardType}
				boardPath={boardPath}
				onBoardUpdate={(updates) => updateBoard(updates as Partial<KanbanBoardType>)}
			/>
		</div>
	);
};
