# Tasks: Agile Board Types

**Input**: Design documents from `specs/001-agile-board-types/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec — test tasks omitted. Manual verification in dev vault per constitution.

**Organization**: Tasks grouped by user story (VPC → Lean → Impact → Story → Roadmap) for independent implementation.

> ⚠️ **Architecture revision (2026-06-16)**: the spec moved from "content stored in
> board/card frontmatter" to a **display-layer model** — each post-it is an ordinary
> note (one note per post-it) and a board note stores *only* the layout (ordered
> `[[wikilink]]` references per section). The previous implementation (old `Card`
> schemas, `CardService`, `CardEditor`, type-per-card frontmatter) is superseded by
> `NoteService` + `BoardService` + reference resolution and reusable `PostIt`/`Section`
> components. Tasks below reflect the revised design and start unchecked.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1–US5) this task belongs to
- Paths use single project structure: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Board-type definitions, constants, and reusable display primitives

- [x] T001 Define board-type union + per-type layout interfaces in src/types/Board.ts
- [x] T002 [P] Create constants (view IDs, board-type enum, section keys, default cards folder) in src/constants.ts
- [x] T003 [P] Create PostIt component (title + body preview, open/remove) in src/components/common/PostIt.tsx
- [x] T004 [P] Create Section component (ordered, drag-reorderable list of PostIts) in src/components/common/Section.tsx
- [x] T005 [P] Create AddPostIt affordance (new note / link existing) in src/components/common/AddPostIt.tsx
- [x] T006 [P] Create NotePicker (fuzzy-search existing vault notes) in src/components/common/NotePicker.tsx
- [x] T007 [P] Create MissingNote indicator (re-link / quick-create) in src/components/common/MissingNote.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Services and hooks every board depends on — MUST complete before user stories

**⚠️ CRITICAL**: No board implementation can begin until this phase is complete

- [x] T008 Implement NoteService (create content note in configured folder, read title + body preview) in src/services/NoteService.ts
- [x] T009 Implement BoardService (read/write layout frontmatter: add/move/reorder/remove references) in src/services/BoardService.ts
- [x] T010 [P] Implement ReferenceService (resolve wikilinks → TFile, detect missing, follow renames) in src/services/ReferenceService.ts
- [x] T011 [P] Implement IndexService (boards set + referencedBy map, event-driven rebuild) in src/services/IndexService.ts
- [x] T012 Create useBoard hook (load + mutate layout, re-render on change) in src/hooks/useBoard.ts
- [x] T013 [P] Create useNotePreview hook (resolve reference → {title, preview, file|missing}) in src/hooks/useNotePreview.ts
- [x] T014 Initialize IndexService and register vault/metadata event handlers in src/main.ts
- [x] T015 Add base board + post-it + section styles to styles.css

**Checkpoint**: Foundation ready — board implementations can now begin

---

## Phase 3: User Story 1 — Value Proposition Canvas (Priority: P1) 🎯 MVP

**Goal**: Display vault notes in the VPC two-panel framework across customer segments; add/link/reorder/open post-its.

**Independent Test**: Create a VPC board, add post-its (real notes) to Jobs/Pains/Gains and the Value Map, reorder them, open one to confirm it's an ordinary note, reload Obsidian and confirm the layout persists.

### Implementation for User Story 1

- [x] T016 [P] [US1] Define VPC layout interface (segments + 6 section arrays) in src/types/Board.ts
- [x] T017 [US1] Create VPCBoard component with Customer Profile ↔ Value Map panels in src/components/boards/VPCBoard.tsx
- [x] T018 [US1] Wire the six sections to Section + AddPostIt in VPCBoard.tsx
- [x] T019 [US1] Implement segment tabs/accordion for multiple segments in VPCBoard.tsx
- [x] T020 [US1] Create ValuePropositionView ItemView wrapper in src/views/ValuePropositionView.tsx
- [x] T021 [US1] Register VPC view + "Create Value Proposition Canvas" command in src/main.ts
- [x] T022 [US1] Add VPC layout styles to styles.css

**Checkpoint**: VPC fully functional — post-its are real notes, layout persists in the board note

---

## Phase 4: User Story 2 — Lean Canvas (Priority: P2)

**Goal**: Display notes in the 9-box Lean Canvas, reusing existing customer notes via the picker.

**Independent Test**: Create a Lean Canvas, link existing customer notes into Customer Segments, add post-its to the other 8 boxes, reload and confirm the grid layout persists.

### Implementation for User Story 2

- [x] T023 [P] [US2] Define Lean Canvas layout interface (9 section arrays) in src/types/Board.ts
- [x] T024 [US2] Create LeanBoard 9-box grid component in src/components/boards/LeanBoard.tsx
- [x] T025 [US2] Wire all 9 boxes to Section + AddPostIt (Customer Segments emphasizes "link existing") in LeanBoard.tsx
- [x] T026 [US2] Create LeanCanvasView ItemView wrapper in src/views/LeanCanvasView.tsx
- [x] T027 [US2] Register Lean Canvas view + command in src/main.ts
- [x] T028 [US2] Add Lean Canvas grid styles to styles.css

**Checkpoint**: Lean Canvas functional — boxes arrange notes, customer notes reused from VPC

---

## Phase 5: User Story 3 — Impact Mapping (Priority: P3)

**Goal**: Display notes as a Goal → Actor → Impact → Deliverable tree with expand/collapse, reusing customer notes as Actors.

**Independent Test**: Create an Impact Map, set a Goal, link customer notes as Actors, branch Impacts and Deliverables, reload and confirm the hierarchy persists.

### Implementation for User Story 3

- [x] T029 [P] [US3] Define Impact Map layout interface (goal + nested actors/impacts/deliverables) in src/types/Board.ts
- [x] T030 [US3] Create ImpactBoard tree component (Goal root) in src/components/boards/ImpactBoard.tsx
- [x] T031 [US3] Implement Actor level linking existing notes in ImpactBoard.tsx
- [x] T032 [US3] Implement Impact and Deliverable child levels in ImpactBoard.tsx
- [x] T033 [US3] Implement expand/collapse persisted in layout (`collapsed`) in ImpactBoard.tsx
- [x] T034 [US3] Create ImpactMapView ItemView wrapper in src/views/ImpactMapView.tsx
- [x] T035 [US3] Register Impact Map view + command in src/main.ts
- [x] T036 [US3] Add Impact Map tree styles to styles.css

**Checkpoint**: Impact Map functional — Why/Who/How/What tree of reused + new notes

> **Rework (post-implementation)**: The Impact Map now supports **multiple independent goal trees** (`goals[]`) instead of a single root `goal`. Legacy single-goal frontmatter is migrated to a one-element `goals` list on read. See updated spec.md / data-model.md.

---

## Phase 6: User Story 4 — Story Map (Priority: P4)

**Goal**: Display notes as a backbone with stacked story columns and horizontal release slices, reusing Feature notes as the backbone.

**Independent Test**: Create a Story Map, link Feature notes as the backbone, add story post-its in columns, draw release slices, reload and confirm grid + slices persist.

> **Rework (post-implementation)**: The Story Map was redesigned. It no longer uses a backbone, story columns, or release slices. It now links to a **source Impact Map**, groups imported features into **MMFs** (each feature in at most one MMF), and renders a **derived table** (actor columns × feature sub-columns over impact rows) whose cells hold user stories. See updated spec.md / data-model.md. T037–T041 below describe the original design.

### Implementation for User Story 4

- [x] T037 [P] [US4] Define Story Map layout interface (backbone + stories map + slices) in src/types/Board.ts
- [x] T038 [US4] Create StoryBoard component (backbone top row) in src/components/boards/StoryBoard.tsx
- [x] T039 [US4] Implement stacked story columns under each backbone item in StoryBoard.tsx
- [x] T040 [US4] Implement horizontal release slices (walking skeleton first) in StoryBoard.tsx
- [x] T041 [US4] Implement native HTML5 drag-drop reordering (updates layout only) in StoryBoard.tsx
- [x] T042 [US4] Create StoryMapView ItemView wrapper in src/views/StoryMapView.tsx
- [x] T043 [US4] Register Story Map view + command in src/main.ts
- [x] T044 [US4] Add Story Map grid styles to styles.css

**Checkpoint**: Story Map functional — backbone of reused Features, stories in columns, release slices

---

## Phase 7: User Story 5 — Roadmap (Priority: P5)

**Goal**: Display release groupings (and their note items) on a timeline with target dates, ordered chronologically.

**Independent Test**: Create a Roadmap, set a timeline range, add releases with dates, assign story/feature notes, reload and confirm chronological positioning persists.

### Implementation for User Story 5

- [x] T045 [P] [US5] Define Roadmap layout interface (timeline range/unit + releases with dates + items) in src/types/Board.ts
- [x] T046 [US5] Create RoadmapBoard component with time axis in src/components/boards/RoadmapBoard.tsx
- [x] T047 [US5] Implement release lanes with assigned note items in RoadmapBoard.tsx
- [x] T048 [US5] Implement date picker + chronological ordering in RoadmapBoard.tsx
- [x] T049 [US5] Create RoadmapView ItemView wrapper in src/views/RoadmapView.tsx
- [x] T050 [US5] Register Roadmap view + command in src/main.ts
- [x] T051 [US5] Add Roadmap timeline styles to styles.css

**Checkpoint**: Roadmap functional — releases positioned by date, reusing Story Map notes

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Reference integrity, data safety, and refinements across all boards

- [x] T052 Render MissingNote indicators for unresolved references across all boards
- [x] T053 [P] Implement quick-create + re-link from MissingNote
- [x] T054 [P] Follow Obsidian rename/move events; re-render boards when referenced notes change
- [ ] T055 Implement "remove from board" (layout only) distinct from explicit confirmed note delete
- [ ] T056 [P] Add keyboard navigation across sections and post-its
- [ ] T057 Performance: memoize reference resolution and body previews
- [x] T058 Add a setting for the default new-note (cards) folder
- [ ] T059 Run quickstart.md validation in development vault
- [x] T060 Final cleanup: remove console.logs, verify all views/events cleaned up in onunload

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3–7)**: All depend on Foundational completion
  - Sequential by priority (P1 → P5) or parallel if capacity allows
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

| Story | Depends On | Independent? |
|-------|------------|--------------|
| US1 (VPC) | Foundational only | ✅ Yes — fully standalone |
| US2 (Lean) | Foundational only | ✅ Yes — can link any notes, reuse VPC notes if present |
| US3 (Impact) | Foundational only | ✅ Yes — reuses customer notes if present, else create |
| US4 (Story) | Foundational only | ✅ Yes — reuses Feature notes if present, else create |
| US5 (Roadmap) | Foundational only | ✅ Yes — reuses story/feature notes if present, else create |

**Note**: Because boards reference *notes* (never other boards), every board type is
independently usable. Reuse across boards is opportunistic: the picker simply links
whatever notes already exist. There are no cross-board creation dependencies and no
circular-dependency risk.

### Within Each User Story

1. Layout interface (parallel-safe, in Board.ts)
2. Board React component
3. Section/level wiring
4. ItemView wrapper
5. Registration in main.ts
6. Styles

### Parallel Opportunities

**Phase 1 (Setup)**: T002–T007 parallel after (or alongside) T001
**Phase 2 (Foundational)**: T010, T011 parallel after T008/T009; T013 parallel after T012
**Each User Story**: the layout-interface task (T016/T023/T029/T037/T045) is parallel-safe

> Coordinate edits to shared files: `src/types/Board.ts`, `src/main.ts`, and `styles.css`
> are touched by multiple tasks — serialize those edits.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001–T007)
2. Phase 2: Foundational (T008–T015)
3. Phase 3: VPC (T016–T022)
4. **STOP and VALIDATE**: create a VPC in the dev vault; confirm post-its are real notes and layout persists
5. Demo: minimal viable plugin — boards that display vault notes

### Incremental Delivery

Foundation → +VPC (MVP) → +Lean → +Impact → +Story → +Roadmap → +Polish.
Each board type adds a new arrangement without changing the content model.

### Parallel Team Strategy

After Foundational: Developer A → VPC then Lean; Developer B → Impact; Developer C → Story then Roadmap. All share `Board.ts`/`main.ts`/`styles.css`, so coordinate those edits.

---

## Notes

- [P] tasks = different files, no dependencies
- [USn] label maps task to user story for traceability
- Manual verification in dev vault per constitution (no automated tests required)
- Commit after each task or logical group
- Stop at any checkpoint to validate a story independently
- **Data safety**: board mutations edit only board-note frontmatter; the only destructive op on a content note is an explicit, confirmed delete
