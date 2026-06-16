import { Plugin, TFile } from 'obsidian';
import {
	VIEW_TYPE_VPC, VIEW_TYPE_LEAN, VIEW_TYPE_IMPACT, VIEW_TYPE_STORY, VIEW_TYPE_ROADMAP,
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

		// Register views — boardPath is set later via setState when opening a board
		this.registerView(VIEW_TYPE_VPC, (leaf) => new ValuePropositionView(leaf, this.services));
		this.registerView(VIEW_TYPE_LEAN, (leaf) => new LeanCanvasView(leaf, this.services));
		this.registerView(VIEW_TYPE_IMPACT, (leaf) => new ImpactMapView(leaf, this.services));
		this.registerView(VIEW_TYPE_STORY, (leaf) => new StoryMapView(leaf, this.services));
		this.registerView(VIEW_TYPE_ROADMAP, (leaf) => new RoadmapView(leaf, this.services));

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
		const file = await this.services.boardService.createBoard(type, defaultTitle, { boardType: type });
		await this.openBoardFile(file);
	}

	async openBoardFile(file: TFile): Promise<void> {
		const board = this.services.boardService.parseBoard(file);
		if (!board) return;

		const viewType = VIEW_TYPE_MAP[board.boardType];
		if (!viewType) return;

		const leaf = this.app.workspace.getLeaf('tab');
		await leaf.setViewState({ type: viewType, state: { boardPath: file.path }, active: true });
		this.app.workspace.revealLeaf(leaf);
	}

	private openBoardPicker(): void {
		const boardTypes: BoardType[] = [
			'value-proposition-canvas', 'lean-canvas', 'impact-map', 'story-map', 'roadmap',
		];
		const boards = boardTypes.flatMap((t) => this.services.boardService.getBoardsOfType(t));

		if (boards.length === 0) {
			this.createAndOpenBoard('value-proposition-canvas', 'Value Proposition Canvas');
			return;
		}

		// Open the most recently modified board
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
