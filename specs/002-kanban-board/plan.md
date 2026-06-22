# Implementation Plan: Kanban Board

**Branch**: `002-kanban-board` | **Date**: 2026-06-19 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/002-kanban-board/spec.md`

## Summary

Add a sixth board type — **Kanban** — as a presentation layer over vault notes, reusing the existing display-layer infrastructure (Content Note + Board Note model, `BoardService` frontmatter I/O, `ReferenceService`, `IndexService`, `PostIt`/`MissingNote`). A Kanban board note stores only its layout: a link to one **source Roadmap** and, per **fixed column**, the ordered `[[wikilink]]` story references placed there. The Roadmap is the single source: the board **automatically displays every story in its releases** (no manual import; an unplaced story shows in the first column / Backlog) and the same Roadmap supplies the release dates that drive deadline colors. The columns are a **fixed, non-editable set** (Backlog, To do, Doing, Testing, Done, Impact achieved) with no column drag-and-drop; only cards move — reorderable within a column and movable between columns by drag-and-drop, each in exactly one column. A story's **estimate** is the single card-intrinsic field, read from / written to the note's own frontmatter (`estimate:`, Fibonacci); column headers sum estimates. Each card shows a **deadline color** computed from the earliest containing release's target date, hidden in the Done / Impact achieved columns.

> **Revision (2026-06-19, post-implementation)**: Per user direction the design dropped (a) the source **Story Map** and per-story **import** in favor of auto-displaying the linked Roadmap's stories, and (b) **editable columns / column drag-and-drop** in favor of a fixed column set. The spec, data model, and contracts below reflect the revised design; superseded items are noted in `tasks.md`.

## Technical Context

**Language/Version**: TypeScript (strict), ES2018 target  
**Primary Dependencies**: React 18, react-dom, obsidian API (no new runtime dependencies)  
**Storage**: Content = ordinary vault notes; Kanban layout = board-note frontmatter; estimate = story-note frontmatter (`estimate:`)  
**Testing**: Manual verification in a development vault (per constitution)  
**Target Platform**: Obsidian desktop + mobile (offline-capable)  
**Project Type**: Obsidian plugin (single project, `src/`)  
**Performance Goals**: Board load < 2 s; card move / reorder / column edit < 100 ms  
**Constraints**: Offline-capable, no external network, official Obsidian API only, lifecycle cleanup  
**Scale/Scope**: Single vault, 1k–10k notes; one new board type, one view, one board component, plus reused common components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | Spec (FR-001…FR-019) written and validated before this plan |
| II. Simplicity & YAGNI | ✅ Pass | Reuses existing services/components; one new view, one new board component, no new dependency. WIP limits / swimlanes explicitly out of scope |
| III. Obsidian Platform Compliance | ✅ Pass | `registerView` + command in `onload`, cleanup in `onunload`/`onClose`; native wikilinks, MetadataCache, rename events |
| IV. User Vault Data Safety | ✅ Pass | Layout edits confined to board frontmatter; the only write to a content note is the user-initiated `estimate:` field (scoped frontmatter merge, body untouched); removing a card never deletes a note; deleting a non-empty column is confirmed |

### Post-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | All artifacts trace to FR-001…FR-019 and SC-001…SC-008 |
| II. Simplicity & YAGNI | ✅ Pass | New code is one `KanbanBoard` type, one view, one board component, one `ReleaseDateService`, and an `estimate` read/write on `NoteService`. Column DnD reuses the established `draggable`/`onDrop` pattern from `Section` |
| III. Obsidian Platform Compliance | ✅ Pass | Same lifecycle wiring as the five existing views; `fileManager.processFrontMatter` for the estimate write |
| IV. User Vault Data Safety | ✅ Pass | `estimate:` write merges one key via `processFrontMatter` (no body rewrite); confirmation gate on non-empty column delete reuses `ConfirmDialog` |

No complexity-tracking entries required (no violations).

## Project Structure

### Documentation (this feature)

```text
specs/002-kanban-board/
├── spec.md              # Feature specification (done)
├── plan.md              # This file
├── research.md          # Phase 0: decisions (estimate storage, release lookup, DnD, columns)
├── data-model.md        # Phase 1: KanbanBoard / KanbanColumn schema + estimate field
├── quickstart.md        # Phase 1: user + developer guide
├── contracts/
│   ├── board-frontmatter.md   # Kanban board-note frontmatter contract
│   └── services.md            # New/changed service method signatures
├── checklists/
│   └── requirements.md  # Spec quality checklist (done)
└── tasks.md             # Phase 2 output (via /speckit-tasks — NOT created here)
```

### Source Code (repository root)

New files are marked **(new)**; everything else is an edit to an existing file.

```text
src/
├── main.ts                          # + register VIEW_TYPE_KANBAN, + "Create Kanban Board" command, + VIEW_TYPE_MAP entry, + registerExtensions(['board'], …)
├── constants.ts                     # + VIEW_TYPE_KANBAN, + DEFAULT_KANBAN_COLUMNS, + deadline thresholds, + ESTIMATE_SCALE
├── types/
│   └── Board.ts                     # + 'kanban' to BoardType, + KanbanColumn / KanbanBoard, + AgileBoard union member
├── views/
│   └── KanbanView.tsx               # (new) ItemView for the Kanban board
├── components/
│   ├── boards/
│   │   └── KanbanBoard.tsx          # (new) columns + cards, DnD, source-board selectors, column totals
│   ├── kanban/
│   │   ├── KanbanColumn.tsx         # (new) one column: header (name, total, delete), card list, column DnD
│   │   └── KanbanCard.tsx           # (new) wraps PostIt + estimate control + deadline-color border
│   └── common/                      # reused as-is: PostIt, MissingNote, NotePicker, ConfirmDialog
├── services/
│   ├── BoardService.ts              # + kanban parse/serialize/default-layout/extractRefs branches
│   ├── NoteService.ts               # + getEstimate(file), + setEstimate(file, value) via processFrontMatter
│   └── ReleaseDateService.ts        # (new) story ref → earliest release target date, from a source Roadmap
└── hooks/
    └── useDeadlineColor.ts          # (new) ref + roadmap + column → DeadlineColor (recomputes on change)
```

**Structure Decision**: Single-project layout, identical to feature 001. The Kanban is one more `BoardType` handled by `BoardService`; rendering follows the established view → board-component → common-components composition. A small `kanban/` component folder keeps column/card pieces beside the existing `boards/` layouts. `ReleaseDateService` is the one new service — it isolates the "which release contains this story, and what is its date" lookup so `KanbanCard`/`useDeadlineColor` stay declarative. The estimate read/write lives on `NoteService` (it owns content-note I/O) rather than a new service.

## Key Design Decisions

(Full rationale in [research.md](research.md).)

1. **Estimate on the note, not the board.** Stored as `estimate:` in the story note's frontmatter; written via `app.fileManager.processFrontMatter` so only that one key changes and the body is never rewritten (Principle IV). Read at render via MetadataCache. Non-Fibonacci / missing → treated as "no estimate", counted as 0 in column totals.
2. **Roadmap is the single source (stories + dates).** The board auto-displays the distinct notes across the linked Roadmap's `releases[].items`; `ReleaseDateService` resolves each story to the **earliest** containing release's `targetDate`. No date / no Roadmap / unresolved → blue. There is no Story Map link and no manual import.
3. **Deadline color thresholds (fixed).** days-remaining: `>30` green, `≤30 && >14` yellow, `≤14 && >7` orange, `≤7` (incl. overdue) red; none → blue. Hidden when the card's column is terminal (Done / Impact achieved).
4. **Columns are a fixed set.** A column is `{ id, name, cards: Ref[], terminal?: boolean }`, but the set, names, and order are fixed (not user-editable) and there is no column drag-and-drop. The defaults are seeded on create and re-seeded if `columns` is missing/empty; Done and Impact achieved carry `terminal: true`. Card ordering is array order; the layout stores only per-column card placement.
5. **Stories follow the Roadmap; one column per story.** Each render reconciles stored placement with the Roadmap: stored cards no longer in the Roadmap are dropped, and Roadmap stories not yet placed are appended to the first column (Backlog). Moving a card splices it between columns; a ref found in two columns is kept only in the first (uniqueness repair). Persisting after a move concretizes previously-unplaced stories.
6. **DnD reuses the existing pattern, cards only.** Native HTML5 `draggable` + `onDragStart/onDragOver/onDrop`, same as `Section.tsx`, extended to cross-list (card → other column). No column DnD, no DnD library (Principle II).

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale | Simpler Alternative Considered |
|----------|-----------|-------------------------------|
| New `ReleaseDateService` | Isolates the story→release→date lookup against a foreign board so the card stays declarative and the logic is testable/reusable | Inline lookup in the component rejected: duplicated across card + total + color, harder to keep correct on edits |
| `estimate` read/write on `NoteService` | `NoteService` already owns content-note I/O; the estimate is content-note metadata | New `EstimateService` rejected as over-abstraction for two methods (YAGNI) |
| `kanban/` component subfolder | Keeps column/card primitives together without bloating `boards/` | Single mega-component rejected: column DnD + card DnD + estimate + color in one file hurts readability |

## Implementation Phases

### Phase A: Types & persistence
- `types/Board.ts`: add `'kanban'` to `BoardType`; add `KanbanColumn` + `KanbanBoard`; extend `AgileBoard`.
- `constants.ts`: `VIEW_TYPE_KANBAN`, `DEFAULT_KANBAN_COLUMNS` (Backlog, To do, Doing, Testing, Done[terminal], Impact achieved[terminal]), deadline thresholds, Fibonacci `ESTIMATE_SCALE`.
- `BoardService.ts`: kanban branches for `frontmatterToBoard`, `layoutToFrontmatter`, `defaultLayout`, `extractRefs` (include source links + all column cards).

### Phase B: View wiring (US1 backbone)
- `views/KanbanView.tsx` mirroring `StoryMapView`; register in `main.ts` (view + command + `VIEW_TYPE_MAP`).
- `components/boards/KanbanBoard.tsx`: render seeded columns, source Story Map selector, import picker, render cards via `PostIt`; card add/remove and within-column reorder + cross-column move (DnD); enforce one-column uniqueness.

### Phase C: Columns (US2)
- `components/kanban/KanbanColumn.tsx`: header with editable name, add/delete (with `ConfirmDialog` when non-empty), terminal toggle; column-level DnD reorder in `KanbanBoard`.

### Phase D: Estimates & deadline color (US3)
- `NoteService.getEstimate` / `setEstimate`; `KanbanCard.tsx` estimate control; column-header point totals.
- `ReleaseDateService.ts` + `hooks/useDeadlineColor.ts`; source Roadmap selector; apply color, suppress in terminal columns.
- `styles.css`: column/card/deadline-color classes.

### Phase E: Polish & integration
- Missing-note + source-missing indicators; rename/move follow-through (inherited); re-render on `indexService` changes (source boards) and metadata changes (estimates).
- Manual verification against all acceptance scenarios; performance check (< 100 ms interactions).

## Artifacts Generated

| Artifact | Purpose |
|----------|---------|
| [research.md](research.md) | Decisions: estimate storage, release-date lookup, deadline color, columns-as-data, DnD, import pool |
| [data-model.md](data-model.md) | `KanbanBoard` / `KanbanColumn` schema, frontmatter mapping, `estimate` field, derived values |
| [contracts/board-frontmatter.md](contracts/board-frontmatter.md) | Kanban board-note frontmatter contract |
| [contracts/services.md](contracts/services.md) | New/changed service + hook signatures |
| [quickstart.md](quickstart.md) | User + developer guide |

## Next Steps

Run `/speckit-tasks` to generate the dependency-ordered task list against this plan.
