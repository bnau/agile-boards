# Tasks: Kanban Multi-Roadmap & Independent Tickets

**Input**: Design documents from `specs/003-kanban-multi-roadmap/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Not requested. Per the project constitution, verification is **manual** in a development Obsidian vault; no automated test tasks are generated. Each user-story phase ends with a build + manual-verification task.

**Organization**: Tasks are grouped by user story (US1 = P1 MVP, US2 = P2, US3 = P3). No setup phase is needed — this is an amendment to an existing plugin with no new dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (foundational and polish tasks carry no story label)

## Path Conventions

Single project; all paths are relative to the repository root (`src/…`), matching `plan.md`.

---

## Phase 1: Foundational — Types, Services & Persistence

**Purpose**: Update the data model and service layer. All user story UI work is blocked until this phase is complete — components cannot compile against the new `KanbanBoard` shape until types and `BoardService` are updated.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T001 Update `src/types/Board.ts`: in `KanbanBoard`, replace `roadmap?: Ref` with `roadmaps: Ref[]` and add `independentTickets: Ref[]`; add exported `CardSourceInfo` discriminated-union type (`{ kind: 'roadmap'; roadmapRefs: Ref[] } | { kind: 'independent' }`) per `contracts/services.md`
- [X] T002 Update all four `kanban` branches in `src/services/BoardService.ts`: (a) `frontmatterToBoard` — parse `roadmaps:` list; migrate legacy `roadmap:` single string to one-element list when `roadmaps:` absent; parse `independent-tickets:` list; (b) `layoutToFrontmatter` — emit `roadmaps` and `independent-tickets` keys, drop old `roadmap` key; (c) `defaultLayout` — output `roadmaps: []` and `independent-tickets: []`; (d) `extractRefs` — spread `board.roadmaps` and `board.independentTickets` per `contracts/services.md`
- [X] T003 [P] Add `getAgileType(file: TFile): string | null` to `src/services/NoteService.ts`: read `agile-type` from `MetadataCache` frontmatter (same pattern as `getEstimate`/`getStatus`); return the trimmed string or null when absent
- [X] T004 [P] Add `earliestReleaseDateFor(storyRef: Ref, roadmapRefs: Ref[], sourcePath: string): string | null` to `src/services/ReleaseDateService.ts`: loop over `roadmapRefs`, call the existing `releaseDateFor` per ref, return the lexicographically smallest non-null ISO date, or null when the list is empty or no date found
- [X] T005 Update `src/hooks/useDeadlineColor.ts`: rename arg `roadmapRef: Ref | undefined` → `roadmapRefs: Ref[]`; call `releaseDateService.earliestReleaseDateFor(storyRef, roadmapRefs, sourcePath)` instead of `releaseDateFor`; update the `compute` memoisation deps accordingly (depends on T004)

**Checkpoint**: A `board-type: kanban` note with `roadmaps:` list and `independent-tickets:` list round-trips through `BoardService`. A legacy `roadmap:` single-string note parses correctly. `earliestReleaseDateFor(ref, [], path)` returns null. Build still compiles (may need temporary stub for changed prop types in KanbanCard/KanbanColumn).

---

## Phase 2: User Story 1 — Link Multiple Roadmaps (Priority: P1) 🎯 MVP

**Goal**: A Kanban board can be linked to zero or more roadmaps; all their stories aggregate on the board; roadmap-sourced cards are not removable.

**Independent Test**: Create a board → link two roadmaps each with distinct stories → confirm both story sets appear, deduplicated → remove one roadmap link → confirm only its exclusive stories disappear → reload and confirm state restores. Verify no remove affordance on roadmap-sourced cards.

### Implementation for User Story 1

- [X] T006 [P] [US1] Update `src/components/kanban/KanbanCard.tsx`: replace `roadmapRef?: Ref` with `source: CardSourceInfo` and add `onRemove?: () => void`; derive `roadmapRefs` as `source.kind === 'roadmap' ? source.roadmapRefs : []`; pass `roadmapRefs` to `useDeadlineColor` (updated signature from T005); add a stub `<div className="agile-kanban-card__source" />` placeholder for the source badge (content filled in US3/T014); add `{onRemove && <button className="agile-kanban-card__remove" onClick={…}>×</button>}` (depends on T001, T005)
- [X] T007 [P] [US1] Update `src/components/kanban/KanbanColumn.tsx`: add `sourceMap: Map<string, CardSourceInfo>` and `onRemoveCard: (columnId: string, ref: Ref) => void` props; for each card rendered, resolve `ref` to a file path and look up `sourceMap.get(path)`; pass `source` and (when `source.kind === 'independent'`) `onRemove={() => onRemoveCard(column.id, ref)}` to each `KanbanCard` (depends on T001)
- [X] T008 [US1] Refactor `src/components/boards/KanbanBoard.tsx` for multi-roadmap: (a) replace single `roadmapFile`/`roadmapBoard` state with a `roadmapBoards: RoadmapBoard[]` array loaded by `Promise.all` over `board.roadmaps` refs via `parseBoardAsync`; (b) aggregate stories from all roadmap boards, deduplicate by resolved `file.path`, building `roadmapStoryFiles` and `roadmapStoryPathSet`; (c) build `sourceMap: Map<string, CardSourceInfo>` — for each story file track which roadmap refs contain it; (d) replace the single-roadmap `<select>` with a linked-roadmap list (each entry shows its title from `indexService.getBoardTitle` + a `×` remove button calling `onBoardUpdate({ roadmaps: board.roadmaps.filter(r => r !== ref) })`) plus an "Add roadmap" `<select>` listing roadmap boards not already linked; (e) pass `sourceMap` and a `handleRemoveCard` stub (no-op for now) as `onRemoveCard` to `KanbanColumn` (depends on T006, T007)
- [X] T009 [P] [US1] Add roadmap management UI styles to `styles.css`: `.agile-kanban-source__list`, `.agile-kanban-source__item`, `.agile-kanban-source__remove` (remove roadmap button), `.agile-kanban-source__add` (add-roadmap select); follow existing `.agile-kanban-source` class conventions
- [X] T010 [US1] `npm run build` (tsc + bundle), then manually verify US1 acceptance scenarios in the dev vault: link two roadmaps → all stories appear, deduplicated → remove one roadmap → exclusive stories disappear → reload restores state → confirm no remove affordance on roadmap cards → deadline colors are correct (earliest date across both roadmaps)

**Checkpoint**: Board with multiple linked roadmaps is usable end-to-end. US1 is independently demonstrable.

---

## Phase 3: User Story 2 — Add and Remove Independent Tickets (Priority: P2)

**Goal**: The user can link existing User Story notes as independent tickets; those tickets appear on the board with a remove button; removing them does not affect the underlying note.

**Independent Test**: On a board (with or without roadmaps) → click "Add ticket" → confirm picker shows only User Story notes not already on the board → select one → it appears with a remove button → drag it across columns → click remove → note still exists in vault → reload confirms board state.

### Implementation for User Story 2

- [X] T011 [US2] Extend `src/components/boards/KanbanBoard.tsx` for independent tickets: (a) after building `roadmapStoryPathSet`, iterate `board.independentTickets`; resolve each ref; skip any whose path is in `roadmapStoryPathSet` (roadmap takes precedence); add remaining to `sourceMap` with `{ kind: 'independent' }`; include those files in the column reconciliation alongside roadmap stories; (b) add `removeIndependentTicket(ref: Ref)` that calls `onBoardUpdate({ independentTickets: board.independentTickets.filter(r => r !== ref) })`; pass `(columnId, ref) => removeIndependentTicket(ref)` as `onRemoveCard` to `KanbanColumn`; (c) add "Add ticket" button that calls `openNotePicker(app, onChoose, { items: storyFiles, cardType: 'story' })` where `storyFiles` = all markdown files where `noteService.getAgileType(f) === 'story'` and the file is not already on the board; `onChoose` appends `referenceService.toWikilink(file, boardPath)` to `board.independentTickets` via `onBoardUpdate` (depends on T008, T003)
- [X] T012 [P] [US2] Add styles to `styles.css`: `.agile-kanban-add-ticket` (button), `.agile-kanban-card__remove` (remove button on card), follow existing `.agile-kanban-*` spacing conventions
- [ ] T013 [US2] `npm run build`; manually verify US2 acceptance scenarios: "Add ticket" picker shows only `agile-type: story` notes not on board → add one → appears in Backlog → drag across columns → `status:` updated on note → remove it → note untouched → reload confirms board restores without the removed ticket

**Checkpoint**: Independent tickets can be added, dragged, and removed. US1 + US2 both work independently.

---

## Phase 4: User Story 3 — Distinguish Card Sources at a Glance (Priority: P3)

**Goal**: Each card visually indicates its source — roadmap name(s) or "Independent" — so users understand why some cards have a remove button and others do not.

**Independent Test**: On a board with at least one linked roadmap and one independent ticket → confirm roadmap-sourced cards show the roadmap name in a badge → confirm a story in two roadmaps shows both names → confirm independent tickets show "Independent" badge → confirm badge renders correctly after reload.

### Implementation for User Story 3

- [X] T014 [US3] Extend `src/components/kanban/KanbanCard.tsx`: fill in the source badge (replacing the placeholder from T006): when `source.kind === 'roadmap'`, resolve each `source.roadmapRefs[i]` via `referenceService.resolve(ref, sourcePath)` and look up its title via `indexService.getBoardTitle(f.path) ?? f.basename`; join multiple titles with `, `; when `source.kind === 'independent'`, show `"Independent"`; add `indexService` to `useServices()` destructure (depends on T006)
- [X] T015 [P] [US3] Add source badge styles to `styles.css`: `.agile-kanban-card__source` (base badge — small, muted), `.agile-kanban-card__source--roadmap` (roadmap badge variant), `.agile-kanban-card__source--independent` (independent badge variant, slightly distinct colour); add appropriate `data-kind` attribute or CSS class switching in T014
- [ ] T016 [US3] `npm run build`; manually verify US3 acceptance scenarios: roadmap card shows roadmap name → story in two roadmaps shows both names → independent card shows "Independent" → terminal-column cards still suppress deadline color → missing roadmap link shows "not found" warning per roadmap

**Checkpoint**: All three user stories are independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, reactivity, and final integration that span all stories.

- [X] T017 [P] Verify and extend `relevantPaths` in `src/components/boards/KanbanBoard.tsx`: ensure the `relevantPaths` ref used for the `metadataCache.on('changed', …)` listener includes all linked roadmap file paths (not just the first) and all resolved independent ticket note paths, so any edit to a source file triggers a board re-render
- [X] T018 [P] Add per-roadmap "not found" warning in `src/components/boards/KanbanBoard.tsx`: for each ref in `board.roadmaps` that cannot be resolved or does not parse as a roadmap, show an inline warning next to that entry in the linked-roadmap list (mirror the existing `agile-kanban-source__warn` pattern); the warning appears individually, not as a single global indicator
- [X] T019 [P] Add empty-state prompt in `src/components/boards/KanbanBoard.tsx`: when no roadmaps are linked AND `board.independentTickets` is empty (or all unresolvable), replace the empty column area with a short guidance message ("Add a roadmap or link a ticket to get started")
- [X] T020 `npm run build` (tsc `-noEmit` + minified production bundle) clean; reload plugin in dev vault; smoke-test all six board types (VPC, Lean, Impact Map, Story Map, Roadmap, Kanban) open and render without errors
- [ ] T021 Verify legacy migration in dev vault: open a board note from spec 002 that has `roadmap: "[[SomeRoadmap]]"` (single string, no `roadmaps:` key) → confirm it renders and its roadmap stories appear → move one card → open the board note in a text editor → confirm frontmatter now has `roadmaps:` list and no `roadmap:` single-string key

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: no dependencies; **blocks all user stories**.
- **User Stories (Phase 2–4)**: each depends on Foundational; US1 is the MVP; US2 and US3 extend US1's component files but are independently testable.
- **Polish (Phase 5)**: depends on all desired user stories.

### User Story Dependencies

- **US1 (P1)**: starts after Foundational. No dependency on US2/US3.
- **US2 (P2)**: starts after US1 (extends `KanbanBoard.tsx`). Independently testable: add/remove tickets work even without US3 badges.
- **US3 (P3)**: starts after US1 (extends `KanbanCard.tsx`). Can overlap with US2 since they touch different aspects of the card.

### Within Each User Story

- **US1**: T006 / T007 in parallel (different files) → T008 (board; consumes both) → T009 styles parallel with T008 → T010 verify
- **US2**: T011 (board) → T012 styles parallel → T013 verify
- **US3**: T014 (card badge) → T015 styles parallel → T016 verify

### Parallel Opportunities

- T003, T004 are independent of T002 (different files) — run in parallel after T001.
- T006, T007 are independent of each other (different files) — run in parallel, both before T008.
- T009 is independent of T008 (different file, styles.css) — run in parallel with T008.
- T012 is independent of T011 (styles.css vs KanbanBoard.tsx) — run in parallel with T011.
- T015 is independent of T014 (styles.css vs KanbanCard.tsx) — run in parallel with T014.
- T017, T018, T019 are all in the same file (KanbanBoard.tsx) — do sequentially in Phase 5.

---

## Parallel Example: Phase 1 Foundational

```text
# After T001 (Board.ts) completes, launch in parallel:
Task T002: "BoardService.ts kanban branches (parse/serialize/defaultLayout/extractRefs)"
Task T003: "NoteService.ts getAgileType"
Task T004: "ReleaseDateService.ts earliestReleaseDateFor"
# Then:
Task T005: "useDeadlineColor.ts roadmapRefs[] (depends T004)"
```

## Parallel Example: User Story 1

```text
# After Phase 1 completes, launch in parallel:
Task T006: "KanbanCard.tsx new props + hook call"
Task T007: "KanbanColumn.tsx sourceMap + onRemoveCard props"
# Then:
Task T008: "KanbanBoard.tsx multi-roadmap refactor"  +parallel+  Task T009: "styles.css roadmap list"
# Then:
Task T010: "npm run build + verify US1"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Foundational) → Phase 2 (US1).
2. **STOP and VALIDATE**: link two roadmaps, drag cards, reload — board works as a multi-roadmap Kanban.
3. Demo as MVP.

### Incremental Delivery

1. Foundational → types and service layer ready.
2. US1 → multi-roadmap Kanban (MVP) → demo.
3. US2 → independent tickets → demo.
4. US3 → source badges → demo.

Each increment adds value without breaking the previous one.

---

## Notes

- No automated tests (constitution: manual verification); each story phase ends with a build + manual-verification task.
- KanbanCard.tsx is updated twice: T006 (props + hook + structural badge placeholder) and T014 (badge content with service lookups). Keep T006 focused on structure; T014 adds the IndexService calls.
- The only content-note writes in this feature are the existing `estimate:` (unchanged) and `status:` (unchanged) via `processFrontMatter`. Removing an independent ticket writes only the board-note frontmatter (`independent-tickets:` list). No content note is ever deleted.
- Commit after each task or logical group; stop at each checkpoint to validate a story independently.
- `styles.css` tasks (T009, T012, T015) are in different phases; they cannot conflict even though they touch the same file.
