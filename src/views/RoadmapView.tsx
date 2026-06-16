import { ItemView, WorkspaceLeaf } from 'obsidian';
import { StrictMode } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { AppContext, PluginServices } from '../context/AppContext';
import { RoadmapBoard } from '../components/boards/RoadmapBoard';
import { VIEW_TYPE_ROADMAP } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { RoadmapBoard as RoadmapBoardType } from '../types/Board';

interface RoadmapViewProps {
	leaf: WorkspaceLeaf;
	services: PluginServices;
	boardPath: string;
}

export class RoadmapView extends ItemView {
	private root: Root | null = null;
	private services: PluginServices;
	private boardPath: string;

	constructor({ leaf, services, boardPath }: RoadmapViewProps) {
		super(leaf);
		this.services = services;
		this.boardPath = boardPath;
	}

	getViewType(): string { return VIEW_TYPE_ROADMAP; }
	getDisplayText(): string { return 'Roadmap'; }
	getIcon(): string { return 'calendar-range'; }

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={{ app: this.app, services: this.services }}>
					<RoadmapViewContent boardPath={this.boardPath} />
				</AppContext.Provider>
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

const RoadmapViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

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
