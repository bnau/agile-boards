import { ItemView, WorkspaceLeaf } from 'obsidian';
import { StrictMode } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { AppContext, PluginServices } from '../context/AppContext';
import { ImpactBoard } from '../components/boards/ImpactBoard';
import { VIEW_TYPE_IMPACT } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { ImpactBoard as ImpactBoardType } from '../types/Board';

interface ImpactMapViewProps {
	leaf: WorkspaceLeaf;
	services: PluginServices;
	boardPath: string;
}

export class ImpactMapView extends ItemView {
	private root: Root | null = null;
	private services: PluginServices;
	private boardPath: string;

	constructor({ leaf, services, boardPath }: ImpactMapViewProps) {
		super(leaf);
		this.services = services;
		this.boardPath = boardPath;
	}

	getViewType(): string { return VIEW_TYPE_IMPACT; }
	getDisplayText(): string { return 'Impact Map'; }
	getIcon(): string { return 'git-branch'; }

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={{ app: this.app, services: this.services }}>
					<ImpactViewContent boardPath={this.boardPath} />
				</AppContext.Provider>
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

const ImpactViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

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
