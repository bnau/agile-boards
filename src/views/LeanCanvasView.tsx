import { ItemView, WorkspaceLeaf } from 'obsidian';
import { StrictMode } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { AppContext, PluginServices } from '../context/AppContext';
import { LeanBoard } from '../components/boards/LeanBoard';
import { VIEW_TYPE_LEAN } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { LeanBoard as LeanBoardType } from '../types/Board';

interface LeanCanvasViewProps {
	leaf: WorkspaceLeaf;
	services: PluginServices;
	boardPath: string;
}

export class LeanCanvasView extends ItemView {
	private root: Root | null = null;
	private services: PluginServices;
	private boardPath: string;

	constructor({ leaf, services, boardPath }: LeanCanvasViewProps) {
		super(leaf);
		this.services = services;
		this.boardPath = boardPath;
	}

	getViewType(): string { return VIEW_TYPE_LEAN; }
	getDisplayText(): string { return 'Lean Canvas'; }
	getIcon(): string { return 'layout-dashboard'; }

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={{ app: this.app, services: this.services }}>
					<LeanViewContent boardPath={this.boardPath} />
				</AppContext.Provider>
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

const LeanViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

	if (!board) return <div className="agile-boards-container">Loading board...</div>;
	if (board.boardType !== 'lean-canvas') return <div className="agile-boards-container">Invalid board type.</div>;

	return (
		<div className="agile-boards-container">
			<h2>{board.title}</h2>
			<LeanBoard
				board={board as LeanBoardType}
				onBoardUpdate={(updates) => updateBoard(updates as Partial<LeanBoardType>)}
			/>
		</div>
	);
};
