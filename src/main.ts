import { Plugin, WorkspaceLeaf } from 'obsidian';
import { BoardView, VIEW_TYPE_BOARD } from './BoardView';

export default class AgileBoardsPlugin extends Plugin {
	async onload() {
		// Register the board view. Obsidian tears registered views down on unload.
		this.registerView(VIEW_TYPE_BOARD, (leaf) => new BoardView(leaf));

		// Ribbon entry point.
		this.addRibbonIcon('kanban', 'Open agile board', () => {
			this.activateView();
		});

		// Command palette entry point.
		this.addCommand({
			id: 'open-agile-board',
			name: 'Open agile board',
			callback: () => this.activateView(),
		});
	}

	async onunload() {
		// Views, ribbon icons and commands registered above are released
		// automatically by Obsidian when the plugin unloads. Any manually
		// created resources (timers, global listeners, DOM nodes) MUST be
		// cleaned up here.
	}

	private async activateView() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_BOARD);

		if (leaves.length > 0) {
			// Reuse an already-open board.
			leaf = leaves[0];
		} else {
			// Open the board in a new tab.
			leaf = workspace.getLeaf('tab');
			await leaf.setViewState({ type: VIEW_TYPE_BOARD, active: true });
		}

		workspace.revealLeaf(leaf);
	}
}
