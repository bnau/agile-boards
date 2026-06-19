// Board layout schemas (display-layer architecture).
//
// A board note's frontmatter stores ONLY the layout: which content notes appear
// in which section/slot, and in what order. Every reference below is a wikilink
// string (e.g. "[[Manage projects]]") pointing at an ordinary vault note — the
// post-it. Boards never store post-it content; they arrange notes by reference.

export type BoardType =
	| 'value-proposition-canvas'
	| 'lean-canvas'
	| 'impact-map'
	| 'story-map'
	| 'roadmap';

export type TimelineUnit = 'week' | 'month' | 'quarter';
export type TreeLayout = 'horizontal' | 'vertical';

/** A wikilink reference to a content note, e.g. "[[Manage projects]]". */
export type Ref = string;

export interface BaseBoard {
	boardType: BoardType;
	path: string;
	title: string;
	created: string;
	modified: string;
}

/* ===== Value Proposition Canvas ===== */

export interface VPCSegment {
	/** Optional anchor note for the segment/persona (reusable as an Impact Map actor). */
	customer?: Ref;
	// Customer Profile
	jobs: Ref[];
	pains: Ref[];
	gains: Ref[];
	// Value Map
	productsServices: Ref[];
	painRelievers: Ref[];
	gainCreators: Ref[];
}

export interface VPCBoard extends BaseBoard {
	boardType: 'value-proposition-canvas';
	segments: VPCSegment[];
	activeSegment: number;
}

export function emptyVPCSegment(customer?: Ref): VPCSegment {
	return {
		customer,
		jobs: [], pains: [], gains: [],
		productsServices: [], painRelievers: [], gainCreators: [],
	};
}

/* ===== Lean Canvas ===== */

export interface LeanSections {
	problem: Ref[];
	solution: Ref[];
	keyMetrics: Ref[];
	uniqueValueProposition: Ref[];
	unfairAdvantage: Ref[];
	channels: Ref[];
	customerSegments: Ref[];
	costStructure: Ref[];
	revenueStreams: Ref[];
}

export interface LeanBoard extends BaseBoard {
	boardType: 'lean-canvas';
	sections: LeanSections;
}

export function emptyLeanSections(): LeanSections {
	return {
		problem: [], solution: [], keyMetrics: [], uniqueValueProposition: [],
		unfairAdvantage: [], channels: [], customerSegments: [],
		costStructure: [], revenueStreams: [],
	};
}

/* ===== Impact Map ===== */

export interface ImpactNode {
	impact: Ref;          // How — a behaviour-change note
	deliverables: Ref[];  // What — feature notes
}

export interface ImpactActor {
	actor: Ref;           // Who — a customer/persona note
	impacts: ImpactNode[];
}

export interface ImpactGoal {
	goal: Ref;            // Why — a root goal note (may be empty)
	actors: ImpactActor[];
}

export interface ImpactBoard extends BaseBoard {
	boardType: 'impact-map';
	goals: ImpactGoal[];  // Why — each goal is an independent root tree
	layout: TreeLayout;
	collapsed: Ref[];     // actor refs whose branch is collapsed
}

/* ===== Story Map ===== */

export interface MMF {
	name: string;
	features: Ref[];      // impact-map deliverables imported into this MMF.
	                      // A feature appears in at most one MMF across the board.
}

export interface StoryBoard extends BaseBoard {
	boardType: 'story-map';
	impactMap?: Ref;                 // source impact-map board the features are imported from
	mmfs: MMF[];                     // marketable feature groupings
	stories: Record<string, Ref[]>;  // feature ref -> user stories created in that cell
}

/* ===== Roadmap ===== */

export interface RoadmapRelease {
	name: string;
	targetDate?: string;  // ISO date
	items: Ref[];         // story/feature notes assigned to this release
}

export interface RoadmapBoard extends BaseBoard {
	boardType: 'roadmap';
	timelineUnit: TimelineUnit;
	startDate?: string;
	endDate?: string;
	releases: RoadmapRelease[];
}

export type AgileBoard = VPCBoard | LeanBoard | ImpactBoard | StoryBoard | RoadmapBoard;
