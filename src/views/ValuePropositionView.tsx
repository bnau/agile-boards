import { ItemView, WorkspaceLeaf } from 'obsidian';
import { StrictMode } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { AppContext, PluginServices } from '../context/AppContext';
import { VPCBoard } from '../components/boards/VPCBoard';
import { VIEW_TYPE_VPC } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { VPCBoard as VPCBoardType } from '../types/Board';

interface ValuePropositionViewProps {
	leaf: WorkspaceLeaf;
	services: PluginServices;
	boardPath: string;
}

export class ValuePropositionView extends ItemView {
	private root: Root | null = null;
	private services: PluginServices;
	private boardPath: string;

	constructor({ leaf, services, boardPath }: ValuePropositionViewProps) {
		super(leaf);
		this.services = services;
		this.boardPath = boardPath;
	}

	getViewType(): string { return VIEW_TYPE_VPC; }
	getDisplayText(): string { return 'Value Proposition Canvas'; }
	getIcon(): string { return 'layout-grid'; }

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={{ app: this.app, services: this.services }}>
					<VPCViewContent boardPath={this.boardPath} />
				</AppContext.Provider>
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

const VPCViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

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
