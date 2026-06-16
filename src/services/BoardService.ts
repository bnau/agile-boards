import { App, TFile, stringifyYaml, parseYaml } from 'obsidian';
import { AgileBoard, BoardType, VPCBoard, LeanBoard, ImpactBoard, StoryBoard, RoadmapBoard, LeanSections, StoryRelease, TimelineUnit, TreeLayout } from '../types/Board';
import { BOARD_FOLDER } from '../constants';

type FrontmatterRecord = Record<string, unknown>;

export class BoardService {
	constructor(private app: App) {}

	async createBoard(type: BoardType, title: string, config: Partial<AgileBoard>): Promise<TFile> {
		await this.ensureFolder(BOARD_FOLDER);
		const now = new Date().toISOString().split('T')[0];
		const safeName = title.replace(/[\\/:*?"<>|]/g, '-');
		const path = `${BOARD_FOLDER}/${safeName}.md`;

		const fm: FrontmatterRecord = {
			'agile-type': 'board',
			'board-type': type,
			title,
			created: now,
			modified: now,
			...this.boardToFrontmatter(type, config),
		};

		const content = `---\n${stringifyYaml(fm)}---\n# ${title}\n\n`;
		return this.app.vault.create(path, content);
	}

	async updateBoard(file: TFile, config: Partial<AgileBoard>): Promise<void> {
		const content = await this.app.vault.read(file);
		const { frontmatter, body } = this.splitFrontmatter(content);
		const now = new Date().toISOString().split('T')[0];
		const boardType = frontmatter['board-type'] as BoardType;
		const updated: FrontmatterRecord = {
			...frontmatter,
			...this.boardToFrontmatter(boardType, config),
			modified: now,
		};
		const newContent = `---\n${stringifyYaml(updated)}---\n${body}`;
		await this.app.vault.modify(file, newContent);
	}

	parseBoard(file: TFile): AgileBoard | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter as FrontmatterRecord | undefined;
		if (!fm || fm['agile-type'] !== 'board') return null;
		return this.frontmatterToBoard(file.path, fm);
	}

	getBoardsOfType(type: BoardType): TFile[] {
		return this.app.vault.getFiles().filter((f) => {
			const cache = this.app.metadataCache.getFileCache(f);
			const fm = cache?.frontmatter as FrontmatterRecord | undefined;
			return fm?.['agile-type'] === 'board' && fm?.['board-type'] === type;
		});
	}

	private frontmatterToBoard(path: string, fm: FrontmatterRecord): AgileBoard | null {
		const base = {
			boardType: fm['board-type'] as BoardType,
			path,
			title: String(fm['title'] ?? ''),
			created: String(fm['created'] ?? ''),
			modified: String(fm['modified'] ?? ''),
		};

		switch (base.boardType) {
			case 'value-proposition-canvas': return {
				...base, boardType: 'value-proposition-canvas',
				segments: Array.isArray(fm['segments']) ? (fm['segments'] as { customer: string; value: string }[]) : [],
				activeSegment: typeof fm['active-segment'] === 'number' ? fm['active-segment'] : 0,
			} as VPCBoard;

			case 'lean-canvas': {
				const sections = (fm['sections'] ?? {}) as Partial<Record<string, string[]>>;
				return {
					...base, boardType: 'lean-canvas',
					sections: {
						customers: sections['customers'] ?? [],
						problems: sections['problems'] ?? [],
						solutions: sections['solutions'] ?? [],
						valuePropositions: sections['value-propositions'] ?? [],
						channels: sections['channels'] ?? [],
						revenueStreams: sections['revenue-streams'] ?? [],
						costStructure: sections['cost-structure'] ?? [],
						keyMetrics: sections['key-metrics'] ?? [],
						unfairAdvantage: sections['unfair-advantage'] ?? [],
					} as LeanSections,
				} as LeanBoard;
			}

			case 'impact-map': return {
				...base, boardType: 'impact-map',
				goal: String(fm['goal'] ?? ''),
				layout: (fm['layout'] as TreeLayout) ?? 'horizontal',
				expandedNodes: Array.isArray(fm['expanded-nodes']) ? (fm['expanded-nodes'] as string[]) : [],
			} as ImpactBoard;

			case 'story-map': return {
				...base, boardType: 'story-map',
				backbone: Array.isArray(fm['backbone']) ? (fm['backbone'] as string[]) : [],
				releases: Array.isArray(fm['releases']) ? (fm['releases'] as StoryRelease[]) : [],
			} as StoryBoard;

			case 'roadmap': return {
				...base, boardType: 'roadmap',
				timelineUnit: (fm['timeline-unit'] as TimelineUnit) ?? 'month',
				startDate: fm['start-date'] ? String(fm['start-date']) : undefined,
				endDate: fm['end-date'] ? String(fm['end-date']) : undefined,
				releases: Array.isArray(fm['releases']) ? (fm['releases'] as string[]) : [],
			} as RoadmapBoard;

			default: return null;
		}
	}

	private boardToFrontmatter(type: BoardType, config: Partial<AgileBoard>): FrontmatterRecord {
		switch (type) {
			case 'value-proposition-canvas': {
				const b = config as Partial<VPCBoard>;
				return { segments: b.segments ?? [], 'active-segment': b.activeSegment ?? 0 };
			}
			case 'lean-canvas': {
				const b = config as Partial<LeanBoard>;
				const s = b.sections;
				return {
					sections: s ? {
						customers: s.customers,
						problems: s.problems,
						solutions: s.solutions,
						'value-propositions': s.valuePropositions,
						channels: s.channels,
						'revenue-streams': s.revenueStreams,
						'cost-structure': s.costStructure,
						'key-metrics': s.keyMetrics,
						'unfair-advantage': s.unfairAdvantage,
					} : {},
				};
			}
			case 'impact-map': {
				const b = config as Partial<ImpactBoard>;
				return { goal: b.goal ?? '', layout: b.layout ?? 'horizontal', 'expanded-nodes': b.expandedNodes ?? [] };
			}
			case 'story-map': {
				const b = config as Partial<StoryBoard>;
				return { backbone: b.backbone ?? [], releases: b.releases ?? [] };
			}
			case 'roadmap': {
				const b = config as Partial<RoadmapBoard>;
				return {
					'timeline-unit': b.timelineUnit ?? 'month',
					'start-date': b.startDate,
					'end-date': b.endDate,
					releases: b.releases ?? [],
				};
			}
			default: return {};
		}
	}

	private async ensureFolder(path: string): Promise<void> {
		const parts = path.split('/');
		let current = '';
		for (const part of parts) {
			current = current ? `${current}/${part}` : part;
			if (!this.app.vault.getAbstractFileByPath(current)) {
				await this.app.vault.createFolder(current);
			}
		}
	}

	private splitFrontmatter(content: string): { frontmatter: FrontmatterRecord; body: string } {
		if (!content.startsWith('---\n')) return { frontmatter: {}, body: content };
		const end = content.indexOf('\n---\n', 4);
		if (end === -1) return { frontmatter: {}, body: content };
		const yaml = content.slice(4, end);
		const body = content.slice(end + 5);
		try {
			const parsed = parseYaml(yaml) as FrontmatterRecord;
			return { frontmatter: parsed ?? {}, body };
		} catch {
			return { frontmatter: {}, body: content };
		}
	}
}
