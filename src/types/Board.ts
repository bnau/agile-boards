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
	| 'roadmap'
	| 'kanban';

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

/* ===== Kanban ===== */

/** A Fibonacci story-point estimate stored on a story note (frontmatter `estimate:`). */
export type Estimate = 1 | 2 | 3 | 5 | 8 | 13 | 21;

/** Deadline-color bucket for a card; 'none' means no color is shown. */
export type DeadlineColor = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'none';

export interface KanbanColumn {
	/** Stable id (keys React lists + story→column placement lookup). */
	id: string;
	name: string;
	/** When true, deadline color is hidden for cards in this column. */
	terminal?: boolean;
	/** Ordered story references placed in this column. */
	cards: Ref[];
}

/** Identifies the provenance of a card on the Kanban board. */
export type CardSourceInfo =
	| { kind: 'roadmap'; roadmapRefs: Ref[] }
	| { kind: 'independent' };

export interface KanbanBoard extends BaseBoard {
	boardType: 'kanban';
	/**
	 * Source Roadmap boards. Stories from every linked roadmap are auto-displayed.
	 * Replaces the single `roadmap?: Ref` from spec 002.
	 */
	roadmaps: Ref[];
	/**
	 * User Story notes explicitly linked to this board (not roadmap-sourced).
	 * These are the only cards the user can remove from the board.
	 */
	independentTickets: Ref[];
	/** Fixed workflow columns; store only the per-column card placement. */
	columns: KanbanColumn[];
}

/** The six fixed columns of a Kanban board (Done + Impact achieved are terminal). */
export function defaultKanbanColumns(): KanbanColumn[] {
	const seed: Array<Omit<KanbanColumn, 'id'>> = [
		{ name: 'Backlog', cards: [] },
		{ name: 'To do', cards: [] },
		{ name: 'Doing', cards: [] },
		{ name: 'Testing', cards: [] },
		{ name: 'Done', terminal: true, cards: [] },
		{ name: 'Impact achieved', terminal: true, cards: [] },
	];
	return seed.map((c, i) => ({ id: `col-${i + 1}`, ...c }));
}

export type AgileBoard = VPCBoard | LeanBoard | ImpactBoard | StoryBoard | RoadmapBoard | KanbanBoard;
