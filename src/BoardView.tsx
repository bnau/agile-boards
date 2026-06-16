import { ItemView, WorkspaceLeaf } from 'obsidian';
import { StrictMode } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { Board } from './components/Board';

export const VIEW_TYPE_BOARD = 'agile-boards-view';

export class BoardView extends ItemView {
	private root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_BOARD;
	}

	getDisplayText(): string {
		return 'Agile board';
	}

	getIcon(): string {
		return 'kanban';
	}

	async onOpen() {
		this.root = createRoot(this.contentEl);
		this.root.render(
			<StrictMode>
				<Board />
			</StrictMode>,
		);
	}

	async onClose() {
		// Clean up the React tree so it does not leak after the view closes.
		this.root?.unmount();
		this.root = null;
	}
}
