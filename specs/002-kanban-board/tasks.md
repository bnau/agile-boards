# Tasks: Kanban Board

**Input**: Design documents from `specs/002-kanban-board/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested. Per the project constitution, verification is **manual** in a development Obsidian vault; no automated test tasks are generated. Each user-story phase ends with a manual-verification task against the acceptance scenarios in `spec.md`.

**Organization**: Tasks are grouped by user story (US1 = P1 MVP, US2 = P2, US3 = P3) so each can be implemented and verified independently.

> **Revision (2026-06-19, post-implementation)** — design change per user direction, now reflected in `spec.md` / `plan.md` / `data-model.md` / `contracts/`:
> - **Stories auto-display from the linked Roadmap** instead of being imported from a Story Map. The Story Map source and the import picker were removed (superseding the import parts of T005/T006 and the Story-Map selector); the Roadmap is the single source of both stories and dates.
> - **Columns are a fixed set** (no add/rename/delete/terminal-toggle, no column drag-and-drop): the entire US2 "custom columns" phase below (T011–T014) is **superseded/withdrawn**; that code was removed. The estimates/deadline story (formerly US3) is now the second priority.
> Card drag-and-drop, the estimate field, column point totals, and deadline colors are unchanged. The code reflects the revised design and builds clean.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (setup, foundational, and polish tasks carry no story label)

## Path Conventions

Single project; all paths are relative to the repository root (`src/...`), matching `plan.md`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pure constants every later phase reads. The project, build, and dependencies already exist (feature 001).

- [X] T001 [P] Add Kanban constants to `src/constants.ts`: `VIEW_TYPE_KANBAN = 'agile-boards-kanban'`, `ESTIMATE_SCALE = [1,2,3,5,8,13,21]` (Fibonacci), and `DEADLINE_THRESHOLDS = { green: 30, yellow: 14, orange: 7 }` (days remaining)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type system and persistence for the new board type. **MUST complete before any user story** — nothing renders or saves without these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add Kanban types to `src/types/Board.ts`: add `'kanban'` to `BoardType`; add `KanbanColumn` (`id`, `name`, `terminal?`, `cards: Ref[]`) and `KanbanBoard extends BaseBoard` (`boardType: 'kanban'`, `storyMap?`, `roadmap?`, `columns: KanbanColumn[]`); add `KanbanBoard` to the `AgileBoard` union; add `Estimate` and `DeadlineColor` types and the `defaultKanbanColumns()` factory (six seeded columns, Done + Impact achieved `terminal: true`) per `data-model.md`
- [X] T003 Add Kanban branches to `src/services/BoardService.ts`: `frontmatterToBoard` case `'kanban'` (parse `story-map`, `roadmap`, `columns`; generate ids when missing; default `terminal` false; coerce `cards` via `refs()`; repair cross-column duplicates keeping first), `layoutToFrontmatter` case `'kanban'` (emit `story-map`, `roadmap`, `columns` with `terminal` only when true), `defaultLayout` case `'kanban'` (empty source links + `defaultKanbanColumns()`), and `extractRefs` case `'kanban'` (`[storyMap?, roadmap?, ...columns.flatMap(c => c.cards)]`); add a module-local `parseKanbanColumns` helper following the existing `parseGoals`/`parseSegment` style

**Checkpoint**: A `board-type: kanban` note round-trips through `BoardService` (create → frontmatter → parse) — verifiable without UI.

---

## Phase 3: User Story 1 - Organize imported stories across workflow columns (Priority: P1) 🎯 MVP

**Goal**: Create a Kanban board, link a source Story Map, import its user stories as cards, and arrange them across the (default) columns with drag-and-drop — each story in exactly one column — with the full layout persisting across reload.

**Independent Test**: Create a Kanban board → see the 6 default columns → link a Story Map → import several stories → drag a card within a column and to another column → open a card (note opens) → remove a card (note survives) → reload Obsidian and confirm every placement and order is restored.

### Implementation for User Story 1

- [X] T004 [US1] Create `src/components/kanban/KanbanCard.tsx`: a thin wrapper around `PostIt` (passes `refStr`, `sourcePath`, `onRemove`, `cardType` = story) exposing a slot for later estimate/color enhancement; renders one story card
- [X] T005 [US1] Create `src/components/kanban/KanbanColumn.tsx`: render column name + card list (`KanbanCard`) + "+ Import story" button; card drag-and-drop within the column and accept a card dropped from another column (native HTML5 DnD, mirroring `src/components/common/Section.tsx`); call props `onReorderCard`, `onMoveCardIn`, `onRemoveCard`, `onImport`
- [X] T006 [US1] Create `src/components/boards/KanbanBoard.tsx`: source Story Map `<select>` (list `getBoardsOfType('story-map')`, persist via `onBoardUpdate({ storyMap })`); compute import pool = distinct stories in the linked Story Map's `stories` cells minus refs already in any column; `openNotePicker` import into a column; render `board.columns` as `KanbanColumn`s; implement `removeCard`, within-column `reorderCard`, cross-column `moveCard` (splice out of source, into target) enforcing one-column uniqueness; subscribe to `indexService` for source-map edits (as in `StoryBoard.tsx`)
- [X] T007 [US1] Create `src/views/KanbanView.tsx` mirroring `src/views/StoryMapView.tsx`: `getViewType` → `VIEW_TYPE_KANBAN`, display text "Kanban", icon (e.g. `'columns'`); render `<KanbanBoard>` via `useBoard(boardPath)` with the `boardType !== 'kanban'` guard
- [X] T008 [US1] Register the Kanban in `src/main.ts`: import `KanbanView` + `VIEW_TYPE_KANBAN`; `registerView(VIEW_TYPE_KANBAN, …)`; `addCommand({ id: 'create-kanban-board', name: 'Create Kanban Board', callback: () => this.createAndOpenBoard('kanban', 'Kanban Board') })`; add the `'kanban': VIEW_TYPE_KANBAN` entry to `VIEW_TYPE_MAP`
- [X] T009 [P] [US1] Add base Kanban styles to `styles.css`: board horizontal scroll row, column container, column header, card list spacing, drag/drop affordances (follow existing `agile-story-board` / `agile-section` conventions)
- [ ] T010 [US1] `npm run build` (tsc + bundle), then manually verify US1 acceptance scenarios in the dev vault (default columns appear in order; import; within/cross-column drag; one-column uniqueness; open card; remove keeps note; reload restores layout)

**Checkpoint**: The Kanban board is usable end-to-end with the default columns — MVP complete and independently demonstrable.

---

## Phase 4: User Story 2 - Shape the workflow with custom columns (Priority: P2)

**Goal**: Add, rename, delete, and reorder columns by drag-and-drop, including a terminal flag, so the board matches the team's workflow.

**Independent Test**: From the default columns, add a column, rename one, drag to reorder columns, delete an empty column (no prompt) and a non-empty column (confirm; cards removed from board, notes kept); reload and confirm the column set/order persists.

### Implementation for User Story 2

- [X] T011 [US2] Extend `src/components/kanban/KanbanColumn.tsx`: editable column name (inline input → `onRename`), delete button (`onDelete`), terminal toggle (`onToggleTerminal`), and a column drag handle for header-level drag-and-drop
- [X] T012 [US2] Extend `src/components/boards/KanbanBoard.tsx`: `addColumn` (stable new id), `renameColumn`, `toggleTerminal`, `deleteColumn` (use `src/components/common/ConfirmDialog.tsx` when the column has cards; remove only references), `moveColumn` (column-header DnD reorder), and a "+ Column" affordance — all via immutable `columns` updates per `contracts/services.md`
- [X] T013 [P] [US2] Add column-control styles to `styles.css`: header name input, delete/terminal buttons, column drag affordance
- [ ] T014 [US2] `npm run build`, then manually verify US2 acceptance scenarios (add/rename/reorder/delete columns; confirm gate on non-empty delete; notes survive; reload persists columns)

**Checkpoint**: Columns are fully user-editable; US1 + US2 both work independently.

---

## Phase 5: User Story 3 - See size and urgency at a glance (Priority: P3)

**Goal**: Show each card's estimate, each column's total points, and a deadline color driven by the linked Roadmap's release dates (hidden in terminal columns).

**Independent Test**: Set `estimate:` on several story notes → cards show estimates and column headers show correct totals (invalid/missing = 0) → link a Roadmap with dated releases containing those stories → cards show green/yellow/orange/red per the 30/14/7 thresholds, blue when no date, and no color in Done / Impact achieved.

### Implementation for User Story 3

- [X] T015 [P] [US3] Add estimate I/O to `src/services/NoteService.ts`: `getEstimate(file): Estimate | null` (read from metadata cache; valid Fibonacci only) and `setEstimate(file, value): Promise<void>` writing **only** the `estimate` key via `app.fileManager.processFrontMatter` (delete key when `null`); body untouched
- [X] T016 [P] [US3] Create `src/services/ReleaseDateService.ts` with `releaseDateFor(storyRef, roadmapRef, sourcePath): string | null` (resolve the Roadmap board, match story to releases by resolved note path, return the earliest `targetDate`); add it to `PluginServices` in `src/context/AppContext.tsx` and construct + pass it in `src/main.ts`
- [X] T017 [P] [US3] Create the deadline-color logic: pure `deadlineColor(targetDate, { terminal, today? })` in `src/utils/deadline.ts` (terminal → `'none'`; null → `'blue'`; >30 green, ≤30/>14 yellow, ≤14/>7 orange, ≤7 red) and the `useDeadlineColor` hook in `src/hooks/useDeadlineColor.ts` (recomputes on source-Roadmap/note/column change)
- [X] T018 [US3] Extend `src/components/kanban/KanbanCard.tsx`: Fibonacci estimate control (reads `getEstimate`, writes `setEstimate`) and deadline-color styling from `useDeadlineColor` (receives `roadmapRef`, `sourcePath`, and the column `terminal` flag) — depends on T015, T017
- [X] T019 [US3] Extend `src/components/kanban/KanbanColumn.tsx`: show the column point total in the header (sum of cards' estimates via `getEstimate`; non-Fibonacci/absent counts as 0) — depends on T015
- [X] T020 [US3] Extend `src/components/boards/KanbanBoard.tsx`: source Roadmap `<select>` (list `getBoardsOfType('roadmap')`, persist via `onBoardUpdate({ roadmap })`) and thread `roadmap` + each column's `terminal` flag down to columns/cards — depends on T016
- [X] T021 [P] [US3] Add styles to `styles.css`: estimate badge/control and the five deadline-color classes (green/yellow/orange/red/blue) applied to the card
- [ ] T022 [US3] `npm run build`, then manually verify US3 acceptance scenarios (estimate shows + writes to note frontmatter; column totals correct incl. 0 for invalid; colors match thresholds; blue when no date; no color in Done / Impact achieved)

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases and integration that span stories.

- [X] T023 [US3] Add source-missing indicators in `src/components/boards/KanbanBoard.tsx`: warn when a linked Story Map or Roadmap is set but unresolved (mirror `StoryBoard`'s "Linked impact map not found"), while still rendering already-placed cards; show an empty-state prompt when no Story Map is linked
- [X] T024 Verify rename/move follow-through and reactivity: renaming a story note or a source board keeps references valid (Obsidian link update), and edits to the source Story Map / Roadmap / a story's `estimate` re-render the board (IndexService + MetadataCache) — no code change expected beyond confirming subscriptions from T006/T018
- [X] T025 [P] Confirm board interactions (card move/reorder, column add/rename/reorder) complete < 100 ms and board load < 2 s on a typical vault (SC-008/SC-007); memoize reference/estimate resolution if needed
- [ ] T026 Run the full `quickstart.md` validation pass and reconcile any gaps with `spec.md` acceptance scenarios
- [X] T027 Final `npm run build` (tsc `-noEmit` + production bundle) clean; reload plugin and smoke-test all six board types still open

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: depends on Setup; **blocks all user stories**.
- **User Stories (Phase 3–5)**: each depends on Foundational. US1 is the MVP. US2 and US3 build on the US1 component files but are independently testable increments (US2 = editable columns; US3 = estimates/colors). Recommended order P1 → P2 → P3.
- **Polish (Phase 6)**: depends on the user stories it touches (T023 needs US1/US3; T024–T027 after all desired stories).

### User Story Dependencies

- **US1 (P1)**: starts after Foundational. No dependency on other stories (uses default columns).
- **US2 (P2)**: starts after US1 (extends `KanbanBoard.tsx` / `KanbanColumn.tsx`). Independently testable.
- **US3 (P3)**: starts after US1 (extends the same component files + adds services/hooks). Independently testable.

### Within Each User Story

- US1: T004 → T005 → T006 → T007 → T008 (bottom-up import chain: card → column → board → view → registration); T009 styles in parallel; T010 verify last.
- US2: T011 → T012 (column UI before board wiring); T013 parallel; T014 verify last.
- US3: T015 / T016 / T017 in parallel (independent files) → T018 (needs T015+T017), T019 (needs T015), T020 (needs T016); T021 parallel; T022 verify last.

### Parallel Opportunities

- T001 (Setup) is standalone.
- Across stories, the `styles.css` tasks (T009, T013, T021) are independent of logic but all touch `styles.css` — do them within their phase, not simultaneously with each other.
- US3 services/hook (T015, T016, T017) are genuinely parallel (different new files).
- With multiple developers, US2 and US3 can proceed in parallel after US1, coordinating on the shared `KanbanBoard.tsx` / `KanbanColumn.tsx` edits.

---

## Parallel Example: User Story 3

```text
# Launch the three independent US3 building blocks together:
Task: "NoteService.getEstimate/setEstimate in src/services/NoteService.ts"            (T015)
Task: "ReleaseDateService in src/services/ReleaseDateService.ts (+ wiring)"           (T016)
Task: "deadlineColor util + useDeadlineColor hook in src/utils + src/hooks"           (T017)
# Then the UI tasks that consume them:
Task: "KanbanCard estimate control + color (T018)"  /  "Column totals (T019)"  /  "Roadmap selector (T020)"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3 (US1).
2. **STOP and VALIDATE**: import stories, drag across default columns, reload — the board is a usable Kanban.
3. Demo as MVP.

### Incremental Delivery

1. Setup + Foundational → board type persists.
2. US1 → arrange imported stories (MVP) → demo.
3. US2 → custom columns → demo.
4. US3 → estimates, totals, deadline colors → demo.

Each increment adds value without breaking the previous one.

---

## Notes

- No automated tests (constitution: manual verification); each story phase ends with a build + manual-verification task.
- The only content-note write in the whole feature is the user-set `estimate:` (T015) via `processFrontMatter` — never the note body; removing a card or deleting a column never deletes a note (Vault Data Safety).
- Reuse over new code: `PostIt`, `MissingNote`, `NotePicker`, `ConfirmDialog`, `useBoard`, `ReferenceService`, `IndexService` are reused as-is.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
