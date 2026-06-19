import { ItemView, WorkspaceLeaf, ViewStateResult } from 'obsidian';
import { StrictMode, ReactElement } from 'react';
import { Root, createRoot } from 'react-dom/client';
import { AppContext, PluginServices } from '../context/AppContext';

export abstract class AgileBoardView extends ItemView {
	protected root: Root | null = null;
	protected services: PluginServices;
	boardPath = '';
	private actionAdded = false;

	constructor(leaf: WorkspaceLeaf, services: PluginServices) {
		super(leaf);
		this.services = services;
	}

	getState(): Record<string, unknown> {
		return { boardPath: this.boardPath };
	}

	async setState(state: Record<string, unknown>, result: ViewStateResult): Promise<void> {
		if (typeof state.boardPath === 'string') {
			this.boardPath = state.boardPath;
		}
		await super.setState(state, result);
		this.refresh();
	}

	async onOpen() {
		if (!this.actionAdded) {
			// Header toggle: switch this leaf back to the Markdown view of the board note.
			this.addAction('file-text', 'Open as Markdown', () => this.openAsMarkdown());
			this.actionAdded = true;
		}
		this.refresh();
	}

	private async openAsMarkdown() {
		if (!this.boardPath) return;
		await this.leaf.setViewState({
			type: 'markdown',
			state: { file: this.boardPath, mode: 'source' },
			active: true,
		});
	}

	protected refresh() {
		const content = this.renderContent();
		if (!this.root) {
			this.root = createRoot(this.contentEl);
		}
		this.root.render(
			<StrictMode>
				<AppContext.Provider value={{ app: this.app, services: this.services }}>
					{content}
				</AppContext.Provider>
			</StrictMode>,
		);
	}

	protected abstract renderContent(): ReactElement;

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}
