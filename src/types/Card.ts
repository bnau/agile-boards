export type CardType =
	| 'customer'
	| 'value'
	| 'problem'
	| 'solution'
	| 'goal'
	| 'impact'
	| 'feature'
	| 'user-story'
	| 'mmf'
	| 'release';

export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type BehaviorChange = 'positive' | 'negative';
export type StoryStatus = 'backlog' | 'ready' | 'in-progress' | 'done';
export type ReleaseStatus = 'planned' | 'in-progress' | 'released';

export interface BaseCard {
	agileType: CardType;
	path: string;
	title: string;
	created: string;
	modified: string;
	tags: string[];
}

export interface CustomerCard extends BaseCard {
	agileType: 'customer';
	segmentName: string;
	jobs: string[];
	pains: string[];
	gains: string[];
}

export interface ValueCard extends BaseCard {
	agileType: 'value';
	customer: string;
	productsServices: string[];
	painRelievers: string[];
	gainCreators: string[];
}

export interface ProblemCard extends BaseCard {
	agileType: 'problem';
	severity?: Priority;
	existingAlternatives: string[];
}

export interface SolutionCard extends BaseCard {
	agileType: 'solution';
	problems: string[];
}

export interface GoalMetric {
	metric: string;
	target: string;
	timeframe?: string;
}

export interface GoalCard extends BaseCard {
	agileType: 'goal';
	metrics: GoalMetric[];
}

export interface ImpactCard extends BaseCard {
	agileType: 'impact';
	goal: string;
	actor: string;
	behaviorChange?: BehaviorChange;
}

export interface FeatureCard extends BaseCard {
	agileType: 'feature';
	impacts: string[];
	priority?: Priority;
}

export interface UserStoryCard extends BaseCard {
	agileType: 'user-story';
	feature: string;
	customer?: string;
	storyPoints?: number;
	acceptanceCriteria: string[];
	status: StoryStatus;
}

export interface MmfCard extends BaseCard {
	agileType: 'mmf';
	stories: string[];
	description?: string;
}

export interface ReleaseCard extends BaseCard {
	agileType: 'release';
	targetDate?: string;
	mmfs: string[];
	stories: string[];
	status?: ReleaseStatus;
	version?: string;
}

export type AgileCard =
	| CustomerCard
	| ValueCard
	| ProblemCard
	| SolutionCard
	| GoalCard
	| ImpactCard
	| FeatureCard
	| UserStoryCard
	| MmfCard
	| ReleaseCard;
