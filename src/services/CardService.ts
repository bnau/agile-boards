import { App, TFile, stringifyYaml, parseYaml } from 'obsidian';
import {
	AgileCard, CardType, BaseCard,
	CustomerCard, ValueCard, ProblemCard, SolutionCard,
	GoalCard, ImpactCard, FeatureCard, UserStoryCard, MmfCard, ReleaseCard,
	Priority, BehaviorChange, StoryStatus, ReleaseStatus,
} from '../types/Card';
import { CARD_FOLDERS } from '../constants';

type FrontmatterRecord = Record<string, unknown>;

export class CardService {
	constructor(private app: App) {}

	async createCard(type: CardType, title: string, fields: FrontmatterRecord): Promise<TFile> {
		const folder = CARD_FOLDERS[type];
		await this.ensureFolder(folder);

		const now = new Date().toISOString().split('T')[0];
		const fm: FrontmatterRecord = {
			'agile-type': type,
			created: now,
			modified: now,
			...fields,
		};

		const safeName = title.replace(/[\\/:*?"<>|]/g, '-');
		const path = `${folder}/${safeName}.md`;
		const content = `---\n${stringifyYaml(fm)}---\n# ${title}\n\n`;
		return this.app.vault.create(path, content);
	}

	async updateCard(file: TFile, fields: FrontmatterRecord): Promise<void> {
		const content = await this.app.vault.read(file);
		const { frontmatter, body } = this.splitFrontmatter(content);
		const now = new Date().toISOString().split('T')[0];
		const updated: FrontmatterRecord = { ...frontmatter, ...fields, modified: now };
		const newContent = `---\n${stringifyYaml(updated)}---\n${body}`;
		await this.app.vault.modify(file, newContent);
	}

	async deleteCard(file: TFile): Promise<void> {
		await this.app.vault.delete(file);
	}

	parseCard(file: TFile): AgileCard | null {
		const cache = this.app.metadataCache.getFileCache(file);
		const fm = cache?.frontmatter as FrontmatterRecord | undefined;
		if (!fm || typeof fm['agile-type'] !== 'string') return null;
		return this.frontmatterToCard(file.path, file.basename, fm);
	}

	private frontmatterToCard(path: string, title: string, fm: FrontmatterRecord): AgileCard | null {
		const base: BaseCard = {
			agileType: fm['agile-type'] as CardType,
			path,
			title,
			created: String(fm['created'] ?? ''),
			modified: String(fm['modified'] ?? ''),
			tags: Array.isArray(fm['tags']) ? (fm['tags'] as string[]) : [],
		};

		switch (base.agileType) {
			case 'customer': return {
				...base, agileType: 'customer',
				segmentName: String(fm['segment-name'] ?? title),
				jobs: toStringArray(fm['jobs']),
				pains: toStringArray(fm['pains']),
				gains: toStringArray(fm['gains']),
			} as CustomerCard;

			case 'value': return {
				...base, agileType: 'value',
				customer: String(fm['customer'] ?? ''),
				productsServices: toStringArray(fm['products-services']),
				painRelievers: toStringArray(fm['pain-relievers']),
				gainCreators: toStringArray(fm['gain-creators']),
			} as ValueCard;

			case 'problem': return {
				...base, agileType: 'problem',
				severity: fm['severity'] as Priority | undefined,
				existingAlternatives: toStringArray(fm['existing-alternatives']),
			} as ProblemCard;

			case 'solution': return {
				...base, agileType: 'solution',
				problems: toStringArray(fm['problems']),
			} as SolutionCard;

			case 'goal': return {
				...base, agileType: 'goal',
				metrics: Array.isArray(fm['metrics']) ? (fm['metrics'] as { metric: string; target: string; timeframe?: string }[]) : [],
			} as GoalCard;

			case 'impact': return {
				...base, agileType: 'impact',
				goal: String(fm['goal'] ?? ''),
				actor: String(fm['actor'] ?? ''),
				behaviorChange: fm['behavior-change'] as BehaviorChange | undefined,
			} as ImpactCard;

			case 'feature': return {
				...base, agileType: 'feature',
				impacts: toStringArray(fm['impacts']),
				priority: fm['priority'] as Priority | undefined,
			} as FeatureCard;

			case 'user-story': return {
				...base, agileType: 'user-story',
				feature: String(fm['feature'] ?? ''),
				customer: fm['customer'] ? String(fm['customer']) : undefined,
				storyPoints: typeof fm['story-points'] === 'number' ? fm['story-points'] : undefined,
				acceptanceCriteria: toStringArray(fm['acceptance-criteria']),
				status: (fm['status'] as StoryStatus) ?? 'backlog',
			} as UserStoryCard;

			case 'mmf': return {
				...base, agileType: 'mmf',
				stories: toStringArray(fm['stories']),
				description: fm['description'] ? String(fm['description']) : undefined,
			} as MmfCard;

			case 'release': return {
				...base, agileType: 'release',
				targetDate: fm['target-date'] ? String(fm['target-date']) : undefined,
				mmfs: toStringArray(fm['mmfs']),
				stories: toStringArray(fm['stories']),
				status: fm['status'] as ReleaseStatus | undefined,
				version: fm['version'] ? String(fm['version']) : undefined,
			} as ReleaseCard;

			default:
				return null;
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

function toStringArray(val: unknown): string[] {
	if (Array.isArray(val)) return val.map(String);
	return [];
}
