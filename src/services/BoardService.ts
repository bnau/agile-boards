import { App, TFile, stringifyYaml, parseYaml } from 'obsidian';
import {
	AgileBoard, BoardType, Ref,
	VPCBoard, LeanBoard, ImpactBoard, StoryBoard, RoadmapBoard,
	VPCSegment, LeanSections, ImpactActor, ImpactGoal, StorySlice, RoadmapRelease,
	TimelineUnit, TreeLayout, emptyLeanSections,
} from '../types/Board';
import { BOARD_FOLDER } from '../constants';

type FrontmatterRecord = Record<string, unknown>;

/**
 * Owns board-note I/O. A board note's frontmatter holds only the layout —
 * ordered wikilink references per section/slot. BoardService reads it into a
 * typed AgileBoard and writes mutations back, never touching content notes.
 */
export class BoardService {
	constructor(private app: App) {}

	async createBoard(type: BoardType, title: string): Promise<TFile> {
		await this.ensureFolder(BOARD_FOLDER);
		const now = new Date().toISOString().split('T')[0];
		const safeName = title.replace(/[\\/:*?"<>|]/g, '-');
		const path = await this.uniquePath(`${BOARD_FOLDER}/${safeName}.md`);

		const fm: FrontmatterRecord = {
			'agile-type': 'board',
			'board-type': type,
			title,
			created: now,
			modified: now,
			...this.defaultLayout(type),
		};

		const content = `---\n${stringifyYaml(fm)}---\n# ${title}\n\n`;
		return this.app.vault.create(path, content);
	}

	async updateBoard(file: TFile, updates: Partial<AgileBoard>): Promise<void> {
		const content = await this.app.vault.read(file);
		const { frontmatter, body } = this.splitFrontmatter(content);
		const boardType = frontmatter['board-type'] as BoardType;
		const now = new Date().toISOString().split('T')[0];
		const updated: FrontmatterRecord = {
			...frontmatter,
			...this.layoutToFrontmatter(boardType, updates),
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

	getAllBoards(): TFile[] {
		return this.app.vault.getMarkdownFiles().filter((f) => {
			const fm = this.app.metadataCache.getFileCache(f)?.frontmatter as FrontmatterRecord | undefined;
			return fm?.['agile-type'] === 'board';
		});
	}

	getBoardsOfType(type: BoardType): TFile[] {
		return this.getAllBoards().filter((f) => {
			const fm = this.app.metadataCache.getFileCache(f)?.frontmatter as FrontmatterRecord | undefined;
			return fm?.['board-type'] === type;
		});
	}

	/** All note references contained in a board layout (flattened). */
	extractRefs(board: AgileBoard): Ref[] {
		switch (board.boardType) {
			case 'value-proposition-canvas':
				return board.segments.flatMap((s) => [
					...(s.customer ? [s.customer] : []),
					...s.jobs, ...s.pains, ...s.gains,
					...s.productsServices, ...s.painRelievers, ...s.gainCreators,
				]);
			case 'lean-canvas':
				return Object.values(board.sections).flat();
			case 'impact-map':
				return board.goals.flatMap((g) => [
					...(g.goal ? [g.goal] : []),
					...g.actors.flatMap((a) => [a.actor, ...a.impacts.flatMap((i) => [i.impact, ...i.deliverables])]),
				]);
			case 'story-map':
				return [
					...board.backbone,
					...Object.values(board.stories).flat(),
				];
			case 'roadmap':
				return board.releases.flatMap((r) => r.items);
			default:
				return [];
		}
	}

	/* ===== frontmatter <-> typed board ===== */

	private frontmatterToBoard(path: string, fm: FrontmatterRecord): AgileBoard | null {
		const base = {
			path,
			title: String(fm['title'] ?? ''),
			created: String(fm['created'] ?? ''),
			modified: String(fm['modified'] ?? ''),
		};
		const type = fm['board-type'] as BoardType;

		switch (type) {
			case 'value-proposition-canvas': {
				const segments = (Array.isArray(fm['segments']) ? fm['segments'] : []) as FrontmatterRecord[];
				return {
					...base, boardType: 'value-proposition-canvas',
					segments: segments.map(parseSegment),
					activeSegment: typeof fm['active-segment'] === 'number' ? fm['active-segment'] : 0,
				} as VPCBoard;
			}
			case 'lean-canvas': {
				const s = (fm['sections'] ?? {}) as Partial<Record<string, unknown>>;
				return {
					...base, boardType: 'lean-canvas',
					sections: {
						problem: refs(s['problem']),
						solution: refs(s['solution']),
						keyMetrics: refs(s['key-metrics']),
						uniqueValueProposition: refs(s['unique-value-proposition']),
						unfairAdvantage: refs(s['unfair-advantage']),
						channels: refs(s['channels']),
						customerSegments: refs(s['customer-segments']),
						costStructure: refs(s['cost-structure']),
						revenueStreams: refs(s['revenue-streams']),
					} as LeanSections,
				} as LeanBoard;
			}
			case 'impact-map': {
				return {
					...base, boardType: 'impact-map',
					goals: parseGoals(fm),
					layout: (fm['layout'] as TreeLayout) ?? 'horizontal',
					collapsed: refs(fm['collapsed']),
				} as ImpactBoard;
			}
			case 'story-map': {
				const stories = (fm['stories'] ?? {}) as Record<string, unknown>;
				const storyMap: Record<string, Ref[]> = {};
				for (const [k, v] of Object.entries(stories)) storyMap[k] = refs(v);
				const slices = (Array.isArray(fm['slices']) ? fm['slices'] : []) as FrontmatterRecord[];
				return {
					...base, boardType: 'story-map',
					backbone: refs(fm['backbone']),
					stories: storyMap,
					slices: slices.map((sl) => ({ name: String(sl['name'] ?? ''), stories: refs(sl['stories']) } as StorySlice)),
				} as StoryBoard;
			}
			case 'roadmap': {
				const releases = (Array.isArray(fm['releases']) ? fm['releases'] : []) as FrontmatterRecord[];
				return {
					...base, boardType: 'roadmap',
					timelineUnit: (fm['timeline-unit'] as TimelineUnit) ?? 'month',
					startDate: fm['start-date'] ? String(fm['start-date']) : undefined,
					endDate: fm['end-date'] ? String(fm['end-date']) : undefined,
					releases: releases.map((r) => ({
						name: String(r['name'] ?? ''),
						targetDate: r['target-date'] ? String(r['target-date']) : undefined,
						items: refs(r['items']),
					} as RoadmapRelease)),
				} as RoadmapBoard;
			}
			default:
				return null;
		}
	}

	private layoutToFrontmatter(type: BoardType, config: Partial<AgileBoard>): FrontmatterRecord {
		switch (type) {
			case 'value-proposition-canvas': {
				const b = config as Partial<VPCBoard>;
				const out: FrontmatterRecord = {};
				if (b.segments) out['segments'] = b.segments.map(segmentToFm);
				if (b.activeSegment !== undefined) out['active-segment'] = b.activeSegment;
				return out;
			}
			case 'lean-canvas': {
				const b = config as Partial<LeanBoard>;
				if (!b.sections) return {};
				const s = b.sections;
				return {
					sections: {
						problem: s.problem,
						solution: s.solution,
						'key-metrics': s.keyMetrics,
						'unique-value-proposition': s.uniqueValueProposition,
						'unfair-advantage': s.unfairAdvantage,
						channels: s.channels,
						'customer-segments': s.customerSegments,
						'cost-structure': s.costStructure,
						'revenue-streams': s.revenueStreams,
					},
				};
			}
			case 'impact-map': {
				const b = config as Partial<ImpactBoard>;
				const out: FrontmatterRecord = {};
				if (b.goals) out['goals'] = b.goals.map(goalToFm);
				if (b.layout) out['layout'] = b.layout;
				if (b.collapsed) out['collapsed'] = b.collapsed;
				return out;
			}
			case 'story-map': {
				const b = config as Partial<StoryBoard>;
				const out: FrontmatterRecord = {};
				if (b.backbone) out['backbone'] = b.backbone;
				if (b.stories) out['stories'] = b.stories;
				if (b.slices) out['slices'] = b.slices.map((sl) => ({ name: sl.name, stories: sl.stories }));
				return out;
			}
			case 'roadmap': {
				const b = config as Partial<RoadmapBoard>;
				const out: FrontmatterRecord = {};
				if (b.timelineUnit) out['timeline-unit'] = b.timelineUnit;
				if (b.startDate !== undefined) out['start-date'] = b.startDate;
				if (b.endDate !== undefined) out['end-date'] = b.endDate;
				if (b.releases) out['releases'] = b.releases.map((r) => ({
					name: r.name,
					'target-date': r.targetDate,
					items: r.items,
				}));
				return out;
			}
			default:
				return {};
		}
	}

	private defaultLayout(type: BoardType): FrontmatterRecord {
		switch (type) {
			case 'value-proposition-canvas':
				return { segments: [segmentToFm({ jobs: [], pains: [], gains: [], productsServices: [], painRelievers: [], gainCreators: [] })], 'active-segment': 0 };
			case 'lean-canvas':
				return this.layoutToFrontmatter('lean-canvas', { sections: emptyLeanSections() } as Partial<LeanBoard>);
			case 'impact-map':
				return { goals: [], layout: 'horizontal', collapsed: [] };
			case 'story-map':
				return { backbone: [], stories: {}, slices: [] };
			case 'roadmap':
				return { 'timeline-unit': 'month', releases: [] };
			default:
				return {};
		}
	}

	/* ===== helpers ===== */

	private async uniquePath(path: string): Promise<string> {
		if (!this.app.vault.getAbstractFileByPath(path)) return path;
		const base = path.replace(/\.md$/, '');
		for (let i = 2; i < 1000; i++) {
			const candidate = `${base} ${i}.md`;
			if (!this.app.vault.getAbstractFileByPath(candidate)) return candidate;
		}
		return `${base} ${Date.now()}.md`;
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

/* ===== module-local parse helpers ===== */

function refs(val: unknown): Ref[] {
	if (Array.isArray(val)) return val.map(String);
	if (typeof val === 'string' && val) return [val];
	return [];
}

function parseSegment(s: FrontmatterRecord): VPCSegment {
	return {
		customer: s['customer'] ? String(s['customer']) : undefined,
		jobs: refs(s['jobs']),
		pains: refs(s['pains']),
		gains: refs(s['gains']),
		productsServices: refs(s['products-services']),
		painRelievers: refs(s['pain-relievers']),
		gainCreators: refs(s['gain-creators']),
	};
}

function segmentToFm(s: VPCSegment): FrontmatterRecord {
	return {
		customer: s.customer ?? '',
		jobs: s.jobs,
		pains: s.pains,
		gains: s.gains,
		'products-services': s.productsServices,
		'pain-relievers': s.painRelievers,
		'gain-creators': s.gainCreators,
	};
}

function parseActor(a: FrontmatterRecord): ImpactActor {
	const impacts = (Array.isArray(a['impacts']) ? a['impacts'] : []) as FrontmatterRecord[];
	return {
		actor: String(a['actor'] ?? ''),
		impacts: impacts.map((i) => ({
			impact: String(i['impact'] ?? ''),
			deliverables: refs(i['deliverables']),
		})),
	};
}

function actorToFm(a: ImpactActor): FrontmatterRecord {
	return {
		actor: a.actor,
		impacts: a.impacts.map((i) => ({ impact: i.impact, deliverables: i.deliverables })),
	};
}

function parseGoal(g: FrontmatterRecord): ImpactGoal {
	const actors = (Array.isArray(g['actors']) ? g['actors'] : []) as FrontmatterRecord[];
	return { goal: String(g['goal'] ?? ''), actors: actors.map(parseActor) };
}

// Supports the new multi-goal `goals` array and migrates the legacy single
// `goal` + top-level `actors` shape into a one-element goals list.
function parseGoals(fm: FrontmatterRecord): ImpactGoal[] {
	if (Array.isArray(fm['goals'])) {
		return (fm['goals'] as FrontmatterRecord[]).map(parseGoal);
	}
	const actors = (Array.isArray(fm['actors']) ? fm['actors'] : []) as FrontmatterRecord[];
	const goal = String(fm['goal'] ?? '');
	if (!goal && actors.length === 0) return [];
	return [{ goal, actors: actors.map(parseActor) }];
}

function goalToFm(g: ImpactGoal): FrontmatterRecord {
	return { goal: g.goal, actors: g.actors.map(actorToFm) };
}
