export const VIEW_TYPE_VPC = 'agile-boards-vpc';
export const VIEW_TYPE_LEAN = 'agile-boards-lean';
export const VIEW_TYPE_IMPACT = 'agile-boards-impact';
export const VIEW_TYPE_STORY = 'agile-boards-story';
export const VIEW_TYPE_ROADMAP = 'agile-boards-roadmap';
export const VIEW_TYPE_KANBAN = 'agile-boards-kanban';

/** Generic dispatcher view type registered for the .board file extension. */
export const VIEW_TYPE_BOARD_DISPATCH = 'agile-board';

/** Fibonacci story-point scale offered for a Kanban card's estimate. */
export const ESTIMATE_SCALE = [1, 2, 3, 5, 8, 13, 21] as const;

/**
 * Deadline-color thresholds (days remaining until a card's release date).
 * green when days > 30; yellow when ≤30 and >14; orange when ≤14 and >7;
 * red when ≤7 (including overdue); blue when there is no resolvable date.
 */
export const DEADLINE_THRESHOLDS = { green: 30, yellow: 14, orange: 7 } as const;

/** Where board notes (layouts) are created. */
export const BOARD_FOLDER = 'Agile/Boards';

/** Default folder for new post-it notes (configurable in settings). */
export const DEFAULT_CARDS_FOLDER = 'Agile/Cards';

/** Length of the body preview shown on a post-it. */
export const PREVIEW_LENGTH = 240;

/**
 * Canonical card types shared across boards. Sections on different boards that
 * represent the same kind of note use the same canonical type, so the notes are
 * filed in one folder and cross-link between canvases. Sections with no overlap
 * keep their own per-board label as their type (the section title).
 *
 * Reuse relationships come from the spec (specs/001-agile-board-types/spec.md):
 *  - customerSegment: VPC Customer ↔ Lean Customer Segments ↔ Impact Actor
 *  - valueProposition: VPC Products & Services ↔ Lean Unique Value Proposition
 *  - feature: Impact Deliverable ↔ Story Map MMF feature (imported from the Impact Map)
 *  - story: Story Map user stories ↔ Roadmap items (which also reuse features)
 */
export const CARD_TYPE = {
	customerSegment: 'Customer Segment',
	valueProposition: 'Value Proposition',
	feature: 'Feature',
	story: 'Story',
} as const;
