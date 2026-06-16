# Feature Specification: Agile Board Types

**Feature Branch**: `001-agile-board-types`  
**Created**: 2026-06-16  
**Status**: Draft  
**Input**: User description: "Five agile board types (Value Proposition Canvas, Lean Canvas, Impact Mapping, Story Map, Roadmap) with shared card types and dependencies between boards."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create Value Proposition Canvas (Priority: P1)

As a product owner, I want to create a Value Proposition Canvas board to define my customers and their value propositions, so that I can understand customer needs before building solutions.

**Why this priority**: The Value Proposition Canvas is the foundational board that creates Customer and Value cards, which are consumed by all other board types. Without this, no other boards can function.

**Independent Test**: Can be fully tested by creating a new Value Proposition Canvas, adding multiple customer segments with their jobs/pains/gains and corresponding value propositions, and verifying all cards are created and persisted in the vault.

**Acceptance Scenarios**:

1. **Given** an empty vault, **When** I create a new Value Proposition Canvas board, **Then** I see a board with Customer Profile and Value Map sections for each customer segment
2. **Given** a Value Proposition Canvas, **When** I add a new customer segment, **Then** Customer cards (Jobs, Pains, Gains) and Value cards (Products/Services, Pain Relievers, Gain Creators) are created
3. **Given** multiple customer segments, **When** I view the board, **Then** all segments are displayed grouped together on the same board

---

### User Story 2 - Create Lean Canvas (Priority: P2)

As an entrepreneur, I want to create a Lean Canvas board that references existing Customer and Value cards, so that I can document my business model using consistent customer definitions.

**Why this priority**: Lean Canvas depends on Customer and Value cards from the Value Proposition Canvas, making it the natural second step in the workflow.

**Independent Test**: Can be tested by creating a Lean Canvas after a Value Proposition Canvas exists, verifying that Customer Segments and Value Proposition sections reference existing cards, and that new sections (Problem, Solution, Channels, Revenue, Cost, Metrics, Unfair Advantage) create new cards.

**Acceptance Scenarios**:

1. **Given** existing Customer and Value cards, **When** I create a Lean Canvas, **Then** the Customer Segments and Unique Value Proposition sections display referenced cards
2. **Given** a Lean Canvas, **When** I fill in the Problem section, **Then** Problem cards are created and linked to the board
3. **Given** a Lean Canvas with all sections, **When** I view the board, **Then** I see the 9-section layout with both referenced and newly created cards

---

### User Story 3 - Create Impact Mapping (Priority: P3)

As a product manager, I want to create an Impact Mapping board that reuses Customer cards as Personas, so that I can trace from business goals through actors to deliverables.

**Why this priority**: Impact Mapping introduces Goal, Impact, and Feature cards that will be consumed by Story Mapping, making it essential for the downstream workflow.

**Independent Test**: Can be tested by creating an Impact Map with a goal, linking existing Customer cards as actors/personas, defining impacts, and creating feature deliverables.

**Acceptance Scenarios**:

1. **Given** existing Customer cards, **When** I create an Impact Map, **Then** I can select Customers as Actors/Personas
2. **Given** an Impact Map with a Goal, **When** I add an Actor, **Then** I can branch out Impacts from that Actor
3. **Given** an Impact with defined behaviors, **When** I add Deliverables, **Then** Feature cards are created and linked to the Impact

---

### User Story 4 - Create Story Map (Priority: P4)

As a development team lead, I want to create a Story Map that uses existing Customers, Features, and Impacts, so that I can organize user stories into a releasable structure.

**Why this priority**: Story Map consumes cards from previous boards and introduces User Stories and MMF (Minimum Marketable Features), which are needed for the Roadmap.

**Independent Test**: Can be tested by creating a Story Map, referencing existing Features as the backbone, creating User Stories under each feature, and grouping stories into MMF releases.

**Acceptance Scenarios**:

1. **Given** existing Feature and Customer cards, **When** I create a Story Map, **Then** Features form the backbone and Customers define user perspectives
2. **Given** a Story Map backbone, **When** I add User Stories under a Feature, **Then** US cards are created with references to the parent Feature
3. **Given** multiple User Stories, **When** I group them into an MMF, **Then** an MMF card is created containing references to the grouped stories

---

### User Story 5 - Create Roadmap (Priority: P5)

As a product owner, I want to create a Roadmap that organizes MMFs and User Stories into time-based releases, so that I can communicate delivery plans to stakeholders.

**Why this priority**: The Roadmap is the final board in the workflow, depending on all previous boards' outputs. It adds temporal planning with dates and releases.

**Independent Test**: Can be tested by creating a Roadmap, assigning existing MMFs and User Stories to Release cards, setting target dates, and verifying the timeline visualization.

**Acceptance Scenarios**:

1. **Given** existing MMF and US cards, **When** I create a Roadmap, **Then** I can assign them to Release containers
2. **Given** a Release with assigned items, **When** I set a target date, **Then** the date is associated with all contained User Stories
3. **Given** multiple Releases with dates, **When** I view the Roadmap, **Then** items are displayed in chronological order

---

### Edge Cases

- What happens when a referenced card (e.g., Customer) is deleted from the vault? The referencing boards display a "missing reference" indicator and allow re-linking.
- How does the system handle circular dependencies between cards? Dependencies flow one direction only (VPC → Lean Canvas → Impact Map → Story Map → Roadmap); circular references are prevented.
- What happens when a board is opened but referenced cards don't exist yet? The board displays empty reference slots with prompts to create or link cards.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support five distinct board types: Value Proposition Canvas, Lean Canvas, Impact Mapping, Story Map, and Roadmap
- **FR-002**: System MUST create cards as Obsidian notes in the user's vault with appropriate metadata
- **FR-003**: System MUST allow cards to be shared/referenced across multiple board types
- **FR-004**: Value Proposition Canvas MUST create Customer cards (Jobs, Pains, Gains) and Value cards (Products/Services, Pain Relievers, Gain Creators)
- **FR-005**: Value Proposition Canvas MUST support multiple customer segments grouped in a single board
- **FR-006**: Lean Canvas MUST consume existing Customer and Value cards from Value Proposition Canvas
- **FR-007**: Lean Canvas MUST create new cards for: Problem, Solution, Channels, Revenue Streams, Cost Structure, Key Metrics, Unfair Advantage
- **FR-008**: Impact Mapping MUST consume Customer cards as Personas/Actors
- **FR-009**: Impact Mapping MUST create Goal, Impact, and Feature cards in a hierarchical structure
- **FR-010**: Story Map MUST consume Customer, Feature, and Impact cards from previous boards
- **FR-011**: Story Map MUST create User Story (US) and MMF (Minimum Marketable Feature) cards
- **FR-012**: Roadmap MUST consume MMF and US cards from Story Map
- **FR-013**: Roadmap MUST create Release cards that group MMFs and User Stories
- **FR-014**: Roadmap MUST allow associating target dates with User Stories and Releases
- **FR-015**: System MUST display visual indicators when referenced cards are missing or deleted
- **FR-016**: System MUST prevent circular dependencies between board types

### Key Entities

- **Customer**: Represents a customer segment with associated jobs, pains, and gains. Created by Value Proposition Canvas, consumed by Lean Canvas, Impact Mapping, and Story Map.
- **Value**: Represents value proposition elements (products/services, pain relievers, gain creators). Created by Value Proposition Canvas, consumed by Lean Canvas.
- **Problem**: Business problem identified in Lean Canvas. Created by Lean Canvas.
- **Solution**: Proposed solution in Lean Canvas. Created by Lean Canvas.
- **Goal**: Business objective in Impact Mapping. Created by Impact Mapping.
- **Impact**: Behavioral change expected from actors. Created by Impact Mapping.
- **Feature**: Deliverable that enables an impact. Created by Impact Mapping, consumed by Story Map.
- **User Story (US)**: Detailed user requirement. Created by Story Map, consumed by Roadmap.
- **MMF (Minimum Marketable Feature)**: Group of user stories forming a releasable unit. Created by Story Map, consumed by Roadmap.
- **Release**: Time-boxed delivery milestone with a target date. Created by Roadmap.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create any of the five board types and populate them with cards within 5 minutes of initial use
- **SC-002**: Cards referenced across boards remain synchronized—changes in one board reflect in all boards displaying that card
- **SC-003**: Users can trace a feature from its origin (Customer need) through to its delivery (Release date) by following card references
- **SC-004**: 90% of users successfully create a complete workflow (all 5 boards) without external documentation
- **SC-005**: Board loading time remains under 2 seconds regardless of the number of referenced cards
- **SC-006**: Users can identify missing or broken card references within 1 second through visual indicators

## Assumptions

- Users have basic familiarity with agile methodologies and the purpose of each board type
- The plugin operates within a single Obsidian vault; cross-vault references are out of scope
- Cards are stored as individual Markdown notes with YAML frontmatter for metadata
- Board layouts are predefined for each type; custom board layouts are out of scope for this feature
- Users will typically follow the recommended workflow order (VPC → Lean → Impact → Story → Roadmap), but the system does not enforce this order
- Real-time collaboration between multiple users is out of scope; the plugin targets single-user scenarios
