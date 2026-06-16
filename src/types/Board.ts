export type BoardType =
	| 'value-proposition-canvas'
	| 'lean-canvas'
	| 'impact-map'
	| 'story-map'
	| 'roadmap';

export type TimelineUnit = 'week' | 'month' | 'quarter';
export type TreeLayout = 'horizontal' | 'vertical';

export interface BaseBoard {
	boardType: BoardType;
	path: string;
	title: string;
	created: string;
	modified: string;
}

export interface VPCSegment {
	customer: string;
	value: string;
}

export interface VPCBoard extends BaseBoard {
	boardType: 'value-proposition-canvas';
	segments: VPCSegment[];
	activeSegment: number;
}

export interface LeanSections {
	customers: string[];
	problems: string[];
	solutions: string[];
	valuePropositions: string[];
	channels: string[];
	revenueStreams: string[];
	costStructure: string[];
	keyMetrics: string[];
	unfairAdvantage: string[];
}

export interface LeanBoard extends BaseBoard {
	boardType: 'lean-canvas';
	sections: LeanSections;
}

export interface ImpactBoard extends BaseBoard {
	boardType: 'impact-map';
	goal: string;
	layout: TreeLayout;
	expandedNodes: string[];
}

export interface StoryRelease {
	name: string;
	mmf: string;
}

export interface StoryBoard extends BaseBoard {
	boardType: 'story-map';
	backbone: string[];
	releases: StoryRelease[];
}

export interface RoadmapBoard extends BaseBoard {
	boardType: 'roadmap';
	timelineUnit: TimelineUnit;
	startDate?: string;
	endDate?: string;
	releases: string[];
}

export type AgileBoard = VPCBoard | LeanBoard | ImpactBoard | StoryBoard | RoadmapBoard;
