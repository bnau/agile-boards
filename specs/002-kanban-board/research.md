# Phase 0 Research: Kanban Board

All unknowns from the Technical Context are resolved below. Each decision records what was chosen, why, and what was rejected. No `NEEDS CLARIFICATION` markers remain (the spec's open choices were settled interactively before drafting).

## 1. Where the estimate is stored

**Decision**: Store the estimate in the **story note's own frontmatter** under `estimate:`, as an integer on the Fibonacci scale. Read it from `MetadataCache`; write it with `app.fileManager.processFrontMatter`.

**Rationale**:
- An estimate is a property of the *story*, not of a board. The same story shows the same size on every board and in search — storing it on the note keeps a single source of truth (SC-007).
- `processFrontMatter` merges a single key and leaves the note body untouched, satisfying User Vault Data Safety (Principle IV): the plugin authors exactly the `estimate` field it manages, nothing else.
- It is the *one* documented exception to "notes are pure"; it is optional (a story with no `estimate` still works everywhere), so it does not violate FR-004's spirit (no board-specific metadata is required).

**Alternatives considered**:
- *Estimate in the Kanban board layout (ref → points map)*: strictly preserves pure notes, but the same story could carry different sizes on different boards and the estimate would be invisible elsewhere — rejected as semantically wrong for story points.
- *A separate `EstimateService`*: rejected (YAGNI) — two methods belong on `NoteService`, which already owns content-note I/O.

## 2. How a card's release date is found

**Decision**: The Kanban links **one source Roadmap**. A new `ReleaseDateService` resolves a story ref against that Roadmap's `releases[].items`; for a story contained in several releases, the **earliest** `targetDate` is used. No containing release, no `targetDate`, no Roadmap linked, or unresolved Roadmap → no date.

**Rationale**:
- Release dates already live on the Roadmap board (`RoadmapRelease.targetDate`); reading them avoids duplicating dates and keeps the Roadmap the source of truth (consistent with how `StoryBoard` reads a foreign Impact Map).
- "Earliest wins" gives the most conservative (most urgent) signal when a story spans releases — matches a delivery-tracking intent and is documented as an assumption in the spec.

**Alternatives considered**:
- *`due:` date on the story note*: simpler but disconnected from real releases; rejected per the user's decision to drive color from the linked Roadmap.
- *Date stored per card on the Kanban layout*: re-entry burden and drift from real releases — rejected.

## 3. Deadline color computation

**Decision**: Compute days remaining = `targetDate − today` (date-only, local midnight). Map to color with fixed thresholds:

| Condition | Color |
|-----------|-------|
| no resolvable date | `blue` |
| days > 30 | `green` |
| 14 < days ≤ 30 | `yellow` |
| 7 < days ≤ 14 | `orange` |
| days ≤ 7 (incl. 0 and overdue) | `red` |

The color is **suppressed** (rendered neutral, no color) when the card's column is terminal (Done / Impact achieved).

**Rationale**:
- Matches the thresholds the user specified (30 / 14 / 7, no date → blue). The `≤7` band absorbs the 0–7 day gap and overdue, giving contiguous bands and a single "act now / late" red.
- Suppression keys off a per-column `terminal` flag rather than the column *name*, so renaming "Done" or adding another terminal column still behaves correctly (FR-016).
- Thresholds are constants (not settings) — configurable thresholds are explicitly out of scope for this version.

**Alternatives considered**:
- *Proportional thresholds (% of original lead time)*: needs a per-story start date that doesn't exist; rejected.
- *Match terminal columns by name*: brittle under rename; rejected in favor of a `terminal` flag.

## 4. Columns as data vs. a fixed enum

**Decision**: A column is a layout object `{ id, name, cards: Ref[], terminal?: boolean }`; the board holds an ordered `columns: KanbanColumn[]`. New boards seed six defaults (Backlog, To do, Doing, Testing, Done `terminal`, Impact achieved `terminal`). Users add / rename / delete / reorder columns and may toggle a column's `terminal` flag.

**Rationale**:
- The spec requires fully user-editable columns (FR-003…FR-005), so a fixed enum is impossible. Stable `id`s (not names) key React lists and the story→column lookup, so renames don't lose cards.
- A `terminal` flag (rather than position or name) cleanly encodes "deadline color hidden here" and stays correct as columns move/rename.

**Alternatives considered**:
- *Columns keyed by name*: rename collisions and lost cards; rejected for stable ids.
- *Hardcoded Done/Impact-achieved detection*: breaks on rename; rejected.

## 5. Drag-and-drop approach

**Decision**: Use native HTML5 DnD (`draggable`, `onDragStart`, `onDragOver` + `preventDefault`, `onDrop`, `onDragEnd`), the same pattern already in `Section.tsx`, extended to two cross-list cases: (a) a card dropped on another column, (b) a column dropped on another column. Track drag payloads in component state (`{ kind: 'card', columnId, index }` or `{ kind: 'column', index }`).

**Rationale**:
- Zero new dependencies (Principle II) and consistent with the existing reorder UX. The current `Section` proves the pattern works for within-list reorder; extending it to cross-list is a small step.
- Works offline and on the Obsidian/Electron renderer without extra setup.

**Alternatives considered**:
- *`react-dnd` / `dnd-kit`*: richer, but a new runtime dependency for behavior we can do natively — rejected per YAGNI and the dependency constraint. (Touch/mobile nuance noted as a future refinement, not a v1 blocker.)

## 6. The import pool (which stories are offered)

**Decision**: The Kanban links **one source Story Map**. The importable pool is every distinct story note referenced by that Story Map's `stories` cells, minus any story already placed in any column of this Kanban. Reuse `NotePicker` by passing the resolved `items` list, exactly as `StoryBoard.openImport` does for features.

**Rationale**:
- Reuses the existing Story Map data (its `stories: Record<featureKey, Ref[]>`), so no new notion of "what is a story" is needed (documented assumption in the spec).
- Excluding already-placed stories enforces one-column uniqueness at import time and mirrors the Story Map's "feature offered to at most one MMF" behavior.

**Alternatives considered**:
- *Any markdown note*: no filter, easy to import non-stories; rejected for a scoped, meaningful pool.
- *Notes in a "story" type folder*: weaker link to the actual map; rejected in favor of the linked Story Map per the user's decision.

## 7. Re-render triggers

**Decision**: Subscribe the Kanban component to `IndexService` (so changes to the source Story Map or Roadmap re-render the board, as `StoryBoard` does) and rely on `useNotePreview`/MetadataCache for per-note changes; the estimate display re-reads on `metadataCache 'changed'` for the story file.

**Rationale**: Matches the established reactivity model; keeps source-board edits (new stories, changed release dates) and note edits (estimate) reflected without manual refresh, supporting SC-006/SC-007.

## Summary of resolved decisions

| # | Topic | Decision |
|---|-------|----------|
| 1 | Estimate storage | Story-note frontmatter `estimate:` via `processFrontMatter`; Fibonacci |
| 2 | Release date | Linked source Roadmap; earliest containing release's `targetDate` |
| 3 | Deadline color | Fixed 30/14/7 thresholds; blue when none; suppressed in terminal columns |
| 4 | Columns | Data objects with stable id + `terminal` flag; six seeded defaults |
| 5 | Drag-and-drop | Native HTML5 DnD, extended cross-list; no new dependency |
| 6 | Import pool | Stories of the linked Story Map, minus already-placed; `NotePicker` |
| 7 | Reactivity | `IndexService` subscription + MetadataCache, as in existing boards |
