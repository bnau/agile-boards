import { Plugin, TFile, PluginSettingTab, Setting, App } from 'obsidian';
import {
	VIEW_TYPE_VPC, VIEW_TYPE_LEAN, VIEW_TYPE_IMPACT, VIEW_TYPE_STORY, VIEW_TYPE_ROADMAP,
	DEFAULT_CARDS_FOLDER,
} from './constants';
import { PluginServices } from './context/AppContext';
import { NoteService } from './services/NoteService';
import { BoardService } from './services/BoardService';
import { ReferenceService } from './services/ReferenceService';
import { IndexService } from './services/IndexService';
import { ValuePropositionView } from './views/ValuePropositionView';
import { LeanCanvasView } from './views/LeanCanvasView';
import { ImpactMapView } from './views/ImpactMapView';
import { StoryMapView } from './views/StoryMapView';
import { RoadmapView } from './views/RoadmapView';
import { BoardType } from './types/Board';

interface AgileBoardsSettings {
	cardsFolder: string;
}

const DEFAULT_SETTINGS: AgileBoardsSettings = {
	cardsFolder: DEFAULT_CARDS_FOLDER,
};

export default class AgileBoardsPlugin extends Plugin {
	settings!: AgileBoardsSettings;
	private services!: PluginServices;

	async onload() {
		await this.loadSettings();

		const noteService = new NoteService(this.app, this.settings.cardsFolder);
		const boardService = new BoardService(this.app);
		const referenceService = new ReferenceService(this.app);
		const indexService = new IndexService(this.app, boardService, referenceService);

		this.services = { noteService, boardService, referenceService, indexService };
		indexService.initialize();

		this.registerView(VIEW_TYPE_VPC, (leaf) => new ValuePropositionView(leaf, this.services));
		this.registerView(VIEW_TYPE_LEAN, (leaf) => new LeanCanvasView(leaf, this.services));
		this.registerView(VIEW_TYPE_IMPACT, (leaf) => new ImpactMapView(leaf, this.services));
		this.registerView(VIEW_TYPE_STORY, (leaf) => new StoryMapView(leaf, this.services));
		this.registerView(VIEW_TYPE_ROADMAP, (leaf) => new RoadmapView(leaf, this.services));

		this.addRibbonIcon('layout-grid', 'Open agile board', () => this.openBoardPicker());

		this.addCommand({ id: 'create-value-proposition-canvas', name: 'Create Value Proposition Canvas', callback: () => this.createAndOpenBoard('value-proposition-canvas', 'Value Proposition Canvas') });
		this.addCommand({ id: 'create-lean-canvas', name: 'Create Lean Canvas', callback: () => this.createAndOpenBoard('lean-canvas', 'Lean Canvas') });
		this.addCommand({ id: 'create-impact-map', name: 'Create Impact Map', callback: () => this.createAndOpenBoard('impact-map', 'Impact Map') });
		this.addCommand({ id: 'create-story-map', name: 'Create Story Map', callback: () => this.createAndOpenBoard('story-map', 'Story Map') });
		this.addCommand({ id: 'create-roadmap', name: 'Create Roadmap', callback: () => this.createAndOpenBoard('roadmap', 'Roadmap') });

		// Open an EXISTING board note in its canvas view.
		this.addCommand({
			id: 'open-as-agile-board',
			name: 'Open current note as agile board',
			checkCallback: (checking) => {
				const file = this.app.workspace.getActiveFile();
				if (!file || !this.services.boardService.parseBoard(file)) return false;
				if (!checking) this.openBoardFile(file, true);
				return true;
			},
		});

		// Right-click a board note (file explorer or note menu) → Open as agile board.
		this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
			if (!(file instanceof TFile) || !this.services.boardService.parseBoard(file)) return;
			menu.addItem((item) =>
				item
					.setTitle('Open as agile board')
					.setIcon('layout-grid')
					.onClick(() => this.openBoardFile(file)),
			);
		}));

		this.addSettingTab(new AgileBoardsSettingTab(this.app, this));
	}

	async onunload() {
		this.services.indexService.destroy();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.services?.noteService.setCardsFolder(this.settings.cardsFolder);
	}

	private async createAndOpenBoard(type: BoardType, defaultTitle: string): Promise<void> {
		const file = await this.services.boardService.createBoard(type, defaultTitle);
		await this.openBoardFile(file);
	}

	async openBoardFile(file: TFile, inPlace = false): Promise<void> {
		const board = this.services.boardService.parseBoard(file);
		if (!board) return;
		const viewType = VIEW_TYPE_MAP[board.boardType];
		if (!viewType) return;
		// inPlace: convert the currently active leaf (e.g. the markdown view of this
		// board) into the canvas view; otherwise open in a new tab.
		const leaf = inPlace ? this.app.workspace.getLeaf(false) : this.app.workspace.getLeaf('tab');
		await leaf.setViewState({ type: viewType, state: { boardPath: file.path }, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	private openBoardPicker(): void {
		const boards = this.services.boardService.getAllBoards();
		if (boards.length === 0) {
			this.createAndOpenBoard('value-proposition-canvas', 'Value Proposition Canvas');
			return;
		}
		const sorted = [...boards].sort((a, b) => b.stat.mtime - a.stat.mtime);
		this.openBoardFile(sorted[0]);
	}
}

const VIEW_TYPE_MAP: Partial<Record<BoardType, string>> = {
	'value-proposition-canvas': VIEW_TYPE_VPC,
	'lean-canvas': VIEW_TYPE_LEAN,
	'impact-map': VIEW_TYPE_IMPACT,
	'story-map': VIEW_TYPE_STORY,
	'roadmap': VIEW_TYPE_ROADMAP,
};

class AgileBoardsSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: AgileBoardsPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('New note folder')
			.setDesc('Folder where new post-it notes are created when you add a card to a board.')
			.addText((text) =>
				text
					.setPlaceholder(DEFAULT_CARDS_FOLDER)
					.setValue(this.plugin.settings.cardsFolder)
					.onChange(async (value) => {
						this.plugin.settings.cardsFolder = value.trim() || DEFAULT_CARDS_FOLDER;
						await this.plugin.saveSettings();
					}),
			);
	}
}
