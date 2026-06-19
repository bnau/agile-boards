# Phase 1 Data Model: Kanban Board

This feature adds no new storage mechanism. It introduces one new `BoardType` and its layout schema, and one optional field on content notes (the estimate). All references are `[[wikilink]]` strings resolved at render time, exactly like the five existing board types.

## Entities

### Content Note (unchanged, one optional field added)

An ordinary Markdown note used as a card. For a Kanban card the note is a **user story** imported from the linked Story Map.

| Field | Type | Notes |
|-------|------|-------|
| (title) | filename | Display title, as for every post-it |
| (body) | Markdown | The story content; never written by the Kanban |
| `estimate` | integer (frontmatter) | **Optional.** Story-point estimate on the Fibonacci scale. Absent/invalid ⇒ "no estimate", counts as 0 in totals. |
| `status` | string (frontmatter) | **Optional.** The card's Kanban column name (source of truth for placement). Absent/unknown ⇒ Backlog. |

`estimate` and `status` are the card-intrinsic values — the only fields the Kanban writes to a content note (each via `processFrontMatter`, one key at a time, body untouched). Both are optional: a story with neither still renders (in Backlog, contributing 0 points).

### Kanban Board Note (new)

A note identifying itself as a board whose frontmatter encodes the Kanban layout.

| Frontmatter key | Type | Meaning |
|-----------------|------|---------|
| `agile-type` | `"board"` | Marks the note as a board (shared) |
| `board-type` | `"kanban"` | New board type discriminator |
| `title` | string | Board title (shared `BaseBoard`) |
| `created` / `modified` | ISO date | Timestamps (shared) |
| `roadmap` | wikilink \| "" | Source Roadmap board — supplies both the stories shown and the release dates. Empty until linked |
| `columns` | list | The fixed columns, storing per-column card placement (see below) |

### Column (embedded in the board)

The column **set, names, and order are fixed** (not user-editable). Each column stores only the placement of cards within it.

| Frontmatter key | Type | Meaning |
|-----------------|------|---------|
| `id` | string | Stable identifier (keys React lists + story→column placement lookup) |
| `name` | string | Column name (from the fixed set) |
| `terminal` | boolean | When true, deadline color is hidden for cards here (Done / Impact achieved) |
| `cards` | list of wikilink | Ordered story references placed in this column |

## TypeScript shapes (`src/types/Board.ts`)

```ts
export type BoardType =
  | 'value-proposition-canvas'
  | 'lean-canvas'
  | 'impact-map'
  | 'story-map'
  | 'roadmap'
  | 'kanban';            // added

export interface KanbanColumn {
  id: string;            // stable, e.g. "col-1718800000000-1"
  name: string;
  terminal?: boolean;    // true => deadline color suppressed
  cards: Ref[];          // ordered story wikilinks
}

export interface KanbanBoard extends BaseBoard {
  boardType: 'kanban';
  roadmap?: Ref;         // source Roadmap board (stories shown + release dates)
  columns: KanbanColumn[]; // fixed set; stores per-column card placement
}

export type AgileBoard =
  | VPCBoard | LeanBoard | ImpactBoard | StoryBoard | RoadmapBoard
  | KanbanBoard;         // added

/** Fibonacci estimation scale offered for a card. */
export type Estimate = 1 | 2 | 3 | 5 | 8 | 13 | 21;

/** Deadline color buckets. */
export type DeadlineColor = 'green' | 'yellow' | 'orange' | 'red' | 'blue' | 'none';

export function defaultKanbanColumns(): KanbanColumn[] {
  // ids assigned at create time
  return [
    { name: 'Backlog', cards: [] },
    { name: 'To do', cards: [] },
    { name: 'Doing', cards: [] },
    { name: 'Testing', cards: [] },
    { name: 'Done', terminal: true, cards: [] },
    { name: 'Impact achieved', terminal: true, cards: [] },
  ].map((c, i) => ({ id: `col-${i + 1}`, ...c }));
}
```

## Frontmatter mapping (BoardService)

`board-type: kanban` round-trips through `frontmatterToBoard` / `layoutToFrontmatter`, mirroring the existing branches.

Serialized example:

```yaml
---
agile-type: board
board-type: kanban
title: Sprint Board
created: 2026-06-19
modified: 2026-06-19
roadmap: "[[2026 Roadmap]]"
columns:
  - id: col-1
    name: Backlog
    cards:
      - "[[Guest can pay with card]]"
      - "[[Guest sees order summary]]"
  - id: col-2
    name: To do
    cards: []
  - id: col-3
    name: Doing
    cards:
      - "[[Returning user one-click pay]]"
  - id: col-4
    name: Testing
    cards: []
  - id: col-5
    name: Done
    terminal: true
    cards:
      - "[[Cart shows item count]]"
  - id: col-6
    name: Impact achieved
    terminal: true
    cards: []
---
```

Parsing rules (defensive, matching the existing `refs()`/defaulting style):
- Missing/empty/non-array `columns` ⇒ fall back to `defaultKanbanColumns()` (the columns are a fixed set, so re-seeding the defaults is safe and expected).
- A column missing `id` ⇒ assign a generated id on read (kept stable thereafter once saved).
- `terminal` absent ⇒ `false`.
- `cards` non-array ⇒ `[]`; string ⇒ single-element list (via `refs()`).
- A story ref appearing in more than one column ⇒ kept only in its first column (uniqueness repair).
- `roadmap` absent/empty ⇒ `undefined`.

`extractRefs(kanban)` returns `[roadmap?, ...columns.flatMap(c => c.cards)]` (filtered for presence) so `IndexService` tracks the board's referenced notes and source Roadmap.

## Derived values (not stored)

| Value | Source | Rule |
|-------|--------|------|
| Displayed stories | linked Roadmap | Distinct notes across the Roadmap's `releases[].items`, in release order (FR-004) |
| Card column | note `status:` | The column whose name matches the story's `status:` field; no/unknown status ⇒ first column / Backlog (FR-002a/FR-005) |
| Card order in column | board layout `cards` | Stories ordered by their position in that column's stored `cards` list; not-yet-ordered stories appended in Roadmap order |
| Column point total | cards' `estimate` | Sum of valid Fibonacci estimates; invalid/absent counts as 0 (FR-013) |
| Card release date | linked Roadmap | Earliest `targetDate` among releases whose `items` contain the card's note (FR-014) |
| Card deadline color | release date + column | Thresholds 30/14/7 → green/yellow/orange/red; none → blue; suppressed (`none`) if column `terminal` (FR-015/FR-016) |

## Invariants

1. **One column per displayed story**: a story's column is its `status:` (one value), so it resolves to exactly one column; no/unknown status ⇒ Backlog.
2. **`status:` is the source of truth for the column**: written on drop, read on render; editing it on the note moves the card, and the same story shows the same column on every board.
3. **Stories follow the Roadmap**: the set of cards equals the linked Roadmap's stories; a story removed from the Roadmap stops being shown (its `status:`/order are retained for if it returns).
4. **Estimate and status are optional and on the note**: never the source-of-truth in the board layout (which keeps only ordering); both written one key at a time, body untouched.
5. **No content note is created or deleted by Kanban operations**: the only content-note writes are the user-driven `estimate:` and `status:` fields.
6. **Columns are fixed**: the set, names, and order are not user-editable; ids are stable.

## Relationships

```text
KanbanBoard ──(roadmap)───▶ RoadmapBoard ──▶ releases[].items     (stories shown)
                                          └─▶ releases[].targetDate (deadline color)
KanbanColumn.cards[*] ──[[wikilink]]──▶ Content Note (user story)  ──frontmatter──▶ estimate, status
                          (ordering only)                          (status = column, source of truth)
```

A Kanban references the story notes (cards) and one source Roadmap. Editing a story note updates its card on every board that references it (SC-007). The Roadmap is a read-only input; the Kanban never writes to it.
