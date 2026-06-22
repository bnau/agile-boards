# Data Model: Kanban Multi-Roadmap & Independent Tickets

**Branch**: `003-kanban-multi-roadmap` | **Date**: 2026-06-22

Amends the `KanbanBoard` schema from spec 002. All other board schemas are unchanged.

---

## `KanbanBoard` (amended)

### TypeScript type (`src/types/Board.ts`)

```typescript
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
    /** Fixed workflow columns; store only per-column card placement/order. */
    columns: KanbanColumn[];
}
```

### Changes from spec 002

| Field (spec 002) | Field (spec 003) | Change |
|-----------------|-----------------|--------|
| `roadmap?: Ref` | `roadmaps: Ref[]` | Renamed and changed from optional scalar to required array |
| *(absent)* | `independentTickets: Ref[]` | New field |

`KanbanColumn` is unchanged.

---

## Frontmatter Schema

### Board Note (`.board`)

```yaml
---
agile-type: board
board-type: kanban
title: "My Kanban Board"
created: "2026-06-22"
modified: "2026-06-22"
roadmaps:
  - "[[Sprint Roadmap]]"
  - "[[Platform Roadmap]]"
independent-tickets:
  - "[[Fix login regression]]"
  - "[[Spike: WebSockets]]"
columns:
  - id: col-1
    name: Backlog
    cards:
      - "[[Story A]]"
  - id: col-2
    name: To do
    cards: []
  - id: col-3
    name: Doing
    cards:
      - "[[Story B]]"
  - id: col-4
    name: Testing
    cards: []
  - id: col-5
    name: Done
    terminal: true
    cards:
      - "[[Story C]]"
  - id: col-6
    name: Impact achieved
    terminal: true
    cards: []
---
# My Kanban Board
```

### Key naming rules

- `roadmaps` (list, was `roadmap` single string) — stores wikilink strings
- `independent-tickets` (list, kebab-case) — stores wikilink strings
- Both fields default to empty lists on new board creation and on parse when absent

### Migration from spec 002 (`roadmap:` single string)

On parse, if `roadmaps:` is absent but `roadmap:` is present:
```
roadmaps = roadmap ? [roadmap] : []
```
On next save (any board update), the frontmatter is rewritten using `roadmaps:` only (`roadmap:` key is dropped by the full-frontmatter replacement).

---

## `CardSourceInfo` (runtime, not persisted)

Computed in `KanbanBoard.tsx` during aggregation. Not stored; derived fresh on each render.

```typescript
type CardSourceInfo =
    | { kind: 'roadmap'; roadmapRefs: Ref[] }  // refs of roadmaps containing this story
    | { kind: 'independent' }
```

- **Roadmap-sourced**: `kind: 'roadmap'`; `roadmapRefs` lists every linked roadmap ref in which this story appears (at least one). Used to render the source badge and compute deadline color.
- **Independent**: `kind: 'independent'`; deadline color is always blue (no release date). Has a visible remove button.

### Source precedence rule

During aggregation:
1. Collect all stories from all linked roadmaps → `roadmapStoryPaths` (Set)
2. For each `ref` in `independentTickets`: if its resolved path is in `roadmapStoryPaths`, classify it `roadmap` (precedence); otherwise `independent`.

---

## `NoteService.getAgileType` (new method)

```typescript
getAgileType(file: TFile): string | null
```

Reads `agile-type` from `MetadataCache` frontmatter. Returns the value as-is (lowercased for comparison), or `null` if absent. Used by the "Add ticket" picker to restrict choices to `'story'` notes.

---

## `ReleaseDateService.earliestReleaseDateFor` (new method)

```typescript
earliestReleaseDateFor(
    storyRef: Ref,
    roadmapRefs: Ref[],
    sourcePath: string
): string | null
```

Loops over `roadmapRefs`, calls `releaseDateFor(storyRef, ref, sourcePath)` for each, and returns the lexicographically smallest non-null result (ISO `YYYY-MM-DD` strings sort correctly). Returns `null` when `roadmapRefs` is empty or no roadmap yields a date.

---

## Derived Values

| Value | Source | Notes |
|-------|--------|-------|
| Card column | `status:` frontmatter on the story note | Unchanged from spec 002 |
| Card estimate | `estimate:` frontmatter on the story note | Unchanged |
| Deadline color | `earliestReleaseDateFor(storyRef, roadmapRefs, boardPath)` | `roadmapRefs` = `[]` for independent tickets → blue |
| Column point total | Sum of `getEstimate(file)` for each card | Unchanged |
| Source badge label | `CardSourceInfo.roadmapRefs` → resolve roadmap titles via `IndexService.getBoardTitle` | "Independent" when `kind: 'independent'` |
