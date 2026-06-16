import { WorkspaceLeaf } from 'obsidian';
import { AgileBoardView } from './AgileBoardView';
import { PluginServices } from '../context/AppContext';
import { VPCBoard } from '../components/boards/VPCBoard';
import { VIEW_TYPE_VPC } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { VPCBoard as VPCBoardType } from '../types/Board';

export class ValuePropositionView extends AgileBoardView {
	constructor(leaf: WorkspaceLeaf, services: PluginServices) {
		super(leaf, services);
	}

	getViewType(): string { return VIEW_TYPE_VPC; }
	getDisplayText(): string { return 'Value Proposition Canvas'; }
	getIcon(): string { return 'layout-grid'; }

	protected renderContent() {
		return <VPCViewContent boardPath={this.boardPath} />;
	}
}

const VPCViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

	if (!boardPath) return (
		<div className="agile-boards-container agile-empty-state">
			<p>No board selected.</p>
		</div>
	);
	if (!board) return <div className="agile-boards-container">Loading board...</div>;
	if (board.boardType !== 'value-proposition-canvas') return <div className="agile-boards-container">Invalid board type.</div>;

	return (
		<div className="agile-boards-container">
			<h2>{board.title}</h2>
			<VPCBoard
				board={board as VPCBoardType}
				boardPath={boardPath}
				onBoardUpdate={(updates) => updateBoard(updates as Partial<VPCBoardType>)}
			/>
		</div>
	);
};
