# Tasks: Agile Board Types

**Input**: Design documents from `specs/001-agile-board-types/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in spec — test tasks omitted. Manual verification in dev vault per constitution.

**Organization**: Tasks grouped by user story (VPC → Lean → Impact → Story → Roadmap) for independent implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1-US5) this task belongs to
- Paths use single project structure: `src/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, type definitions, and base components

- [x] T001 Create type definitions file in src/types/Card.ts
- [x] T002 [P] Create board type definitions in src/types/Board.ts
- [x] T003 [P] Create constants file with view IDs and enums in src/constants.ts
- [x] T004 [P] Create base Card component in src/components/common/Card.tsx
- [x] T005 [P] Create CardEditor modal component in src/components/common/CardEditor.tsx
- [x] T006 [P] Create ReferenceSelector component in src/components/common/ReferenceSelector.tsx
- [x] T007 [P] Create MissingReference indicator component in src/components/common/MissingReference.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core services that ALL board types depend on — MUST complete before user stories

**⚠️ CRITICAL**: No board implementation can begin until this phase is complete

- [x] T008 Implement CardService with CRUD operations in src/services/CardService.ts
- [x] T009 Implement IndexService for card discovery in src/services/IndexService.ts
- [x] T010 [P] Implement ReferenceService for link resolution in src/services/ReferenceService.ts
- [x] T011 [P] Implement BoardService for board state management in src/services/BoardService.ts
- [x] T012 Create useCards hook in src/hooks/useCards.ts
- [x] T013 [P] Create useBoard hook in src/hooks/useBoard.ts
- [x] T014 [P] Create useReferences hook in src/hooks/useReferences.ts
- [x] T015 Update src/main.ts to initialize IndexService on plugin load
- [x] T016 Add board styles to styles.css for common board elements

**Checkpoint**: Foundation ready — board implementations can now begin

---

## Phase 3: User Story 1 — Create Value Proposition Canvas (Priority: P1) 🎯 MVP

**Goal**: Users can create a VPC board with Customer and Value cards for multiple customer segments

**Independent Test**: Create VPC board, add customer segments with jobs/pains/gains and value propositions, verify cards persist in vault

### Implementation for User Story 1

- [x] T017 [P] [US1] Define Customer card schema in src/types/Card.ts (add to existing file)
- [x] T018 [P] [US1] Define Value card schema in src/types/Card.ts (add to existing file)
- [x] T019 [P] [US1] Define VPC board configuration schema in src/types/Board.ts (add to existing file)
- [x] T020 [US1] Create VPCBoard React component in src/components/boards/VPCBoard.tsx
- [x] T021 [US1] Implement customer segment panel (Jobs, Pains, Gains) in VPCBoard.tsx
- [x] T022 [US1] Implement value map panel (Products, Pain Relievers, Gain Creators) in VPCBoard.tsx
- [x] T023 [US1] Implement segment tabs/accordion for multiple customers in VPCBoard.tsx
- [x] T024 [US1] Create ValuePropositionView ItemView wrapper in src/views/ValuePropositionView.tsx
- [x] T025 [US1] Register VPC view and command in src/main.ts
- [x] T026 [US1] Add VPC-specific styles to styles.css

**Checkpoint**: VPC board fully functional — can create, edit, and persist Customer/Value cards

---

## Phase 4: User Story 2 — Create Lean Canvas (Priority: P2)

**Goal**: Users can create a Lean Canvas that references existing Customer/Value cards and creates new section cards

**Independent Test**: Create Lean Canvas, link existing VPC customers, fill all 9 sections, verify new cards created

### Implementation for User Story 2

- [x] T027 [P] [US2] Define Problem card schema in src/types/Card.ts
- [x] T028 [P] [US2] Define Solution card schema in src/types/Card.ts
- [x] T029 [P] [US2] Define Lean Canvas board configuration schema in src/types/Board.ts
- [x] T030 [US2] Create LeanBoard React component with 9-box grid in src/components/boards/LeanBoard.tsx
- [x] T031 [US2] Implement Customer Segments section with reference selector in LeanBoard.tsx
- [x] T032 [US2] Implement Problem section with card creation in LeanBoard.tsx
- [x] T033 [US2] Implement Solution section with card creation in LeanBoard.tsx
- [x] T034 [US2] Implement remaining 6 sections (UVP, Channels, Revenue, Cost, Metrics, Unfair Advantage) in LeanBoard.tsx
- [x] T035 [US2] Create LeanCanvasView ItemView wrapper in src/views/LeanCanvasView.tsx
- [x] T036 [US2] Register Lean Canvas view and command in src/main.ts
- [x] T037 [US2] Add Lean Canvas grid styles to styles.css

**Checkpoint**: Lean Canvas fully functional — references VPC cards, creates new cards for each section

---

## Phase 5: User Story 3 — Create Impact Mapping (Priority: P3)

**Goal**: Users can create an Impact Map with Goals, Actors (from Customers), Impacts, and Features

**Independent Test**: Create Impact Map with goal, link existing customers as actors, add impacts and features, verify tree structure

### Implementation for User Story 3

- [x] T038 [P] [US3] Define Goal card schema in src/types/Card.ts
- [x] T039 [P] [US3] Define Impact card schema in src/types/Card.ts
- [x] T040 [P] [US3] Define Feature card schema in src/types/Card.ts
- [x] T041 [P] [US3] Define Impact Map board configuration schema in src/types/Board.ts
- [x] T042 [US3] Create ImpactBoard React component with tree layout in src/components/boards/ImpactBoard.tsx
- [x] T043 [US3] Implement Goal node as tree root in ImpactBoard.tsx
- [x] T044 [US3] Implement Actor selection linking to Customer cards in ImpactBoard.tsx
- [x] T045 [US3] Implement Impact nodes branching from Actors in ImpactBoard.tsx
- [x] T046 [US3] Implement Feature nodes (deliverables) branching from Impacts in ImpactBoard.tsx
- [x] T047 [US3] Implement expand/collapse for tree nodes in ImpactBoard.tsx
- [x] T048 [US3] Create ImpactMapView ItemView wrapper in src/views/ImpactMapView.tsx
- [x] T049 [US3] Register Impact Map view and command in src/main.ts
- [x] T050 [US3] Add Impact Map tree styles to styles.css

**Checkpoint**: Impact Map fully functional — hierarchical Goal → Actor → Impact → Feature structure

---

## Phase 6: User Story 4 — Create Story Map (Priority: P4)

**Goal**: Users can create a Story Map with Features as backbone, User Stories in columns, and MMF groupings

**Independent Test**: Create Story Map, select features for backbone, add user stories, group into MMFs

### Implementation for User Story 4

- [x] T051 [P] [US4] Define UserStory card schema in src/types/Card.ts
- [x] T052 [P] [US4] Define MMF card schema in src/types/Card.ts
- [x] T053 [P] [US4] Define Story Map board configuration schema in src/types/Board.ts
- [x] T054 [US4] Create StoryBoard React component with grid layout in src/components/boards/StoryBoard.tsx
- [x] T055 [US4] Implement backbone row with Feature references in StoryBoard.tsx
- [x] T056 [US4] Implement User Story cards in columns under Features in StoryBoard.tsx
- [x] T057 [US4] Implement MMF horizontal bands grouping stories in StoryBoard.tsx
- [x] T058 [US4] Implement drag-drop for story reordering (native HTML5 DnD) in StoryBoard.tsx
- [x] T059 [US4] Create StoryMapView ItemView wrapper in src/views/StoryMapView.tsx
- [x] T060 [US4] Register Story Map view and command in src/main.ts
- [x] T061 [US4] Add Story Map grid styles to styles.css

**Checkpoint**: Story Map fully functional — backbone with features, stories in columns, MMF groupings

---

## Phase 7: User Story 5 — Create Roadmap (Priority: P5)

**Goal**: Users can create a Roadmap with Releases, assigned MMFs/Stories, and target dates

**Independent Test**: Create Roadmap, add releases with dates, assign MMFs and stories, verify timeline display

### Implementation for User Story 5

- [x] T062 [P] [US5] Define Release card schema in src/types/Card.ts
- [x] T063 [P] [US5] Define Roadmap board configuration schema in src/types/Board.ts
- [x] T064 [US5] Create RoadmapBoard React component with timeline layout in src/components/boards/RoadmapBoard.tsx
- [x] T065 [US5] Implement timeline header with date range in RoadmapBoard.tsx
- [x] T066 [US5] Implement Release rows with MMF/Story assignment in RoadmapBoard.tsx
- [x] T067 [US5] Implement date picker for releases and stories in RoadmapBoard.tsx
- [x] T068 [US5] Implement chronological sorting of releases in RoadmapBoard.tsx
- [x] T069 [US5] Create RoadmapView ItemView wrapper in src/views/RoadmapView.tsx
- [x] T070 [US5] Register Roadmap view and command in src/main.ts
- [x] T071 [US5] Add Roadmap timeline styles to styles.css

**Checkpoint**: Roadmap fully functional — releases with dates, MMF/Story assignments, timeline view

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Integration, error handling, and refinements across all boards

- [ ] T072 Implement cross-board navigation (click card → open in board context)
- [ ] T073 [P] Add missing reference warnings across all board components
- [ ] T074 [P] Implement card quick-create from missing reference indicators
- [ ] T075 Add keyboard navigation support to all boards
- [ ] T076 [P] Implement card delete confirmation dialog
- [ ] T077 Add undo support for card operations using Obsidian's undo system
- [ ] T078 Performance optimization: memoize card lookups in IndexService
- [ ] T079 Run quickstart.md validation in development vault
- [ ] T080 Final cleanup: remove console.logs, verify cleanup in onunload

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Stories (Phases 3-7)**: All depend on Foundational completion
  - Can proceed sequentially (P1 → P2 → P3 → P4 → P5)
  - Or in parallel if team capacity allows
- **Polish (Phase 8)**: Depends on all user stories complete

### User Story Dependencies

| Story | Depends On | Independent? |
|-------|------------|--------------|
| US1 (VPC) | Foundational only | ✅ Yes — creates Customer/Value cards |
| US2 (Lean) | Foundational + US1 cards exist | ⚠️ Partial — references VPC cards |
| US3 (Impact) | Foundational + US1 cards exist | ⚠️ Partial — references Customer cards |
| US4 (Story) | Foundational + US1/US3 cards exist | ⚠️ Partial — references Customer/Feature cards |
| US5 (Roadmap) | Foundational + US4 cards exist | ⚠️ Partial — references MMF/Story cards |

**Note**: While US2-US5 reference cards from previous stories, they can be implemented with empty reference slots. The reference selector will simply show no available cards until the source boards are populated.

### Within Each User Story

1. Card schemas first (parallel within story)
2. Board configuration schema
3. Board React component
4. Section implementations
5. ItemView wrapper
6. Registration in main.ts
7. Styles

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002, T003, T004, T005, T006, T007 — all parallel after T001
```

**Phase 2 (Foundational)**:
```
T010, T011 — parallel after T008, T009
T013, T014 — parallel after T012
```

**Each User Story**: Card schemas (TXX7, TXX8, TXX9) can run in parallel

---

## Parallel Example: User Story 1

```bash
# Card schemas in parallel:
Task: "Define Customer card schema in src/types/Card.ts"
Task: "Define Value card schema in src/types/Card.ts"
Task: "Define VPC board configuration schema in src/types/Board.ts"

# Then sequential: Board component → Sections → View → Registration
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T016)
3. Complete Phase 3: User Story 1 — VPC (T017-T026)
4. **STOP and VALIDATE**: Test VPC in development vault
5. Deploy/demo: Minimal viable plugin with VPC boards

### Incremental Delivery

1. **Foundation** → Setup + Foundational complete
2. **+VPC** (US1) → Test → Deploy (MVP!)
3. **+Lean Canvas** (US2) → Test → Deploy
4. **+Impact Map** (US3) → Test → Deploy
5. **+Story Map** (US4) → Test → Deploy
6. **+Roadmap** (US5) → Test → Deploy
7. **+Polish** → Final release

Each story adds a new board type without breaking existing boards.

### Parallel Team Strategy

With multiple developers after Foundational:
- Developer A: VPC (US1) → Lean Canvas (US2)
- Developer B: Impact Map (US3)
- Developer C: Story Map (US4) → Roadmap (US5)

---

## Notes

- [P] tasks = different files, no dependencies
- [USn] label maps task to user story for traceability
- Manual verification in dev vault per constitution (no automated tests required)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Card schemas share src/types/Card.ts — coordinate additions
