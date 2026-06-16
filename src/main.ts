import { Plugin, WorkspaceLeaf, TFile } from 'obsidian';
import {
	VIEW_TYPE_VPC, VIEW_TYPE_LEAN, VIEW_TYPE_IMPACT, VIEW_TYPE_STORY, VIEW_TYPE_ROADMAP,
	BOARD_FOLDER,
} from './constants';
import { PluginServices } from './context/AppContext';
import { CardService } from './services/CardService';
import { IndexService } from './services/IndexService';
import { ReferenceService } from './services/ReferenceService';
import { BoardService } from './services/BoardService';
import { ValuePropositionView } from './views/ValuePropositionView';
import { LeanCanvasView } from './views/LeanCanvasView';
import { ImpactMapView } from './views/ImpactMapView';
import { StoryMapView } from './views/StoryMapView';
import { RoadmapView } from './views/RoadmapView';
import { BoardType } from './types/Board';

export default class AgileBoardsPlugin extends Plugin {
	private services!: PluginServices;

	async onload() {
		const cardService = new CardService(this.app);
		const indexService = new IndexService(this.app, cardService);
		const referenceService = new ReferenceService(indexService);
		const boardService = new BoardService(this.app);

		this.services = { cardService, indexService, referenceService, boardService };
		indexService.initialize();

		this.registerView(VIEW_TYPE_VPC, (leaf) =>
			new ValuePropositionView({ leaf, services: this.services, boardPath: '' }));
		this.registerView(VIEW_TYPE_LEAN, (leaf) =>
			new LeanCanvasView({ leaf, services: this.services, boardPath: '' }));
		this.registerView(VIEW_TYPE_IMPACT, (leaf) =>
			new ImpactMapView({ leaf, services: this.services, boardPath: '' }));
		this.registerView(VIEW_TYPE_STORY, (leaf) =>
			new StoryMapView({ leaf, services: this.services, boardPath: '' }));
		this.registerView(VIEW_TYPE_ROADMAP, (leaf) =>
			new RoadmapView({ leaf, services: this.services, boardPath: '' }));

		this.addRibbonIcon('layout-grid', 'Open agile board', () => {
			this.openBoardPicker();
		});

		this.addCommand({
			id: 'create-value-proposition-canvas',
			name: 'Create Value Proposition Canvas',
			callback: () => this.createAndOpenBoard('value-proposition-canvas', 'Value Proposition Canvas'),
		});

		this.addCommand({
			id: 'create-lean-canvas',
			name: 'Create Lean Canvas',
			callback: () => this.createAndOpenBoard('lean-canvas', 'Lean Canvas'),
		});

		this.addCommand({
			id: 'create-impact-map',
			name: 'Create Impact Map',
			callback: () => this.createAndOpenBoard('impact-map', 'Impact Map'),
		});

		this.addCommand({
			id: 'create-story-map',
			name: 'Create Story Map',
			callback: () => this.createAndOpenBoard('story-map', 'Story Map'),
		});

		this.addCommand({
			id: 'create-roadmap',
			name: 'Create Roadmap',
			callback: () => this.createAndOpenBoard('roadmap', 'Roadmap'),
		});
	}

	async onunload() {
		this.services.indexService.destroy();
	}

	private async createAndOpenBoard(type: BoardType, defaultTitle: string): Promise<void> {
		const { boardService } = this.services;
		const file = await boardService.createBoard(type, defaultTitle, { boardType: type });
		await this.openBoardFile(file);
	}

	private async openBoardFile(file: TFile): Promise<void> {
		const board = this.services.boardService.parseBoard(file);
		if (!board) return;

		const viewType = {
			'value-proposition-canvas': VIEW_TYPE_VPC,
			'lean-canvas': VIEW_TYPE_LEAN,
			'impact-map': VIEW_TYPE_IMPACT,
			'story-map': VIEW_TYPE_STORY,
			'roadmap': VIEW_TYPE_ROADMAP,
		}[board.boardType];

		if (!viewType) return;

		const leaf = this.app.workspace.getLeaf('tab');

		// Create a view with the board path set
		const view = (() => {
			const services = this.services;
			const boardPath = file.path;
			switch (viewType) {
				case VIEW_TYPE_VPC: return new ValuePropositionView({ leaf, services, boardPath });
				case VIEW_TYPE_LEAN: return new LeanCanvasView({ leaf, services, boardPath });
				case VIEW_TYPE_IMPACT: return new ImpactMapView({ leaf, services, boardPath });
				case VIEW_TYPE_STORY: return new StoryMapView({ leaf, services, boardPath });
				case VIEW_TYPE_ROADMAP: return new RoadmapView({ leaf, services, boardPath });
				default: return null;
			}
		})();

		if (!view) return;

		await leaf.open(view);
		this.app.workspace.revealLeaf(leaf);
	}

	private openBoardPicker(): void {
		const boards = this.services.boardService.getBoardsOfType('value-proposition-canvas')
			.concat(this.services.boardService.getBoardsOfType('lean-canvas'))
			.concat(this.services.boardService.getBoardsOfType('impact-map'))
			.concat(this.services.boardService.getBoardsOfType('story-map'))
			.concat(this.services.boardService.getBoardsOfType('roadmap'));

		if (boards.length === 0) {
			this.createAndOpenBoard('value-proposition-canvas', 'My Value Proposition Canvas');
			return;
		}

		// Open the most recently modified board
		const sorted = boards.sort((a, b) => b.stat.mtime - a.stat.mtime);
		this.openBoardFile(sorted[0]);
	}
}
