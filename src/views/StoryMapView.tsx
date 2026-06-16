import { ItemView, WorkspaceLeaf } from 'obsidian';
import { StrictMode } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { AppContext, PluginServices } from '../context/AppContext';
import { StoryBoard } from '../components/boards/StoryBoard';
import { VIEW_TYPE_STORY } from '../constants';
import { useBoard } from '../hooks/useBoard';
import { StoryBoard as StoryBoardType } from '../types/Board';

interface StoryMapViewProps {
	leaf: WorkspaceLeaf;
	services: PluginServices;
	boardPath: string;
}

export class StoryMapView extends ItemView {
	private root: Root | null = null;
	private services: PluginServices;
	private boardPath: string;

	constructor({ leaf, services, boardPath }: StoryMapViewProps) {
		super(leaf);
		this.services = services;
		this.boardPath = boardPath;
	}

	getViewType(): string { return VIEW_TYPE_STORY; }
	getDisplayText(): string { return 'Story Map'; }
	getIcon(): string { return 'map'; }

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={{ app: this.app, services: this.services }}>
					<StoryViewContent boardPath={this.boardPath} />
				</AppContext.Provider>
			</StrictMode>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}

const StoryViewContent = ({ boardPath }: { boardPath: string }) => {
	const { board, updateBoard } = useBoard(boardPath);

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
