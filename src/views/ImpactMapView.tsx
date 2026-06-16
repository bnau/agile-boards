import { WorkspaceLeaf } from 'obsidian';
import { AgileBoardView } from './AgileBoardView';
import { PluginServices } from '../context/AppContext';
import { ImpactBoard } from '../components/boards/ImpactBoard';
import { VIEW_TYPE_IMPACT } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { ImpactBoard as ImpactBoardType } from '../types/Board';

export class ImpactMapView extends AgileBoardView {
	constructor(leaf: WorkspaceLeaf, services: PluginServices) {
		super(leaf, services);
	}

	getViewType(): string { return VIEW_TYPE_IMPACT; }
	getDisplayText(): string { return 'Impact Map'; }
	getIcon(): string { return 'git-branch'; }

	protected renderContent() {
		return <ImpactViewContent boardPath={this.boardPath} />;
	}
}

const ImpactViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

	if (!boardPath) return (
		<div className="agile-boards-container agile-empty-state">
			<p>No board selected.</p>
		</div>
	);
	if (!board) return <div className="agile-boards-container">Loading board...</div>;
	if (board.boardType !== 'impact-map') return <div className="agile-boards-container">Invalid board type.</div>;

	return (
		<div className="agile-boards-container">
			<h2>{board.title}</h2>
			<ImpactBoard
				board={board as ImpactBoardType}
				boardPath={boardPath}
				onBoardUpdate={(updates) => updateBoard(updates as Partial<ImpactBoardType>)}
			/>
		</div>
	);
};
