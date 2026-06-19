# Feature Specification: Agile Board Types

**Feature Branch**: `001-agile-board-types`  
**Created**: 2026-06-16  
**Revised**: 2026-06-16 (display-layer architecture)  
**Status**: Draft  
**Input**: User description: "Five agile board types (Value Proposition Canvas, Lean Canvas, Impact Mapping, Story Map, Roadmap). The canvases and maps are a way to *display* vault notes elegantly — they are not where the content lives. Each post-it on a board is an ordinary note; a board holds only the layout (which notes go where)."

## Architecture Principle *(read first)*

This feature treats each board type as a **presentation layer over the user's vault notes**, not as a data store.

- **Content = notes.** Every item shown on a board (a job, a pain, a gain, a problem, an impact, a user story, a feature, a release note…) is an ordinary Markdown note in the vault. One post-it = one note. The note's body is real, human-authored Markdown that the user can open and edit like any other note.
- **A board = a layout.** A board is itself a note, but its frontmatter holds only the *arrangement*: which notes appear in which section/slot of the framework, and in what order. The board does not duplicate or own the content.
- **Notes are "pure."** Content notes carry no board-specific metadata. The plugin never requires special frontmatter on a content note for it to be usable on a board. This keeps every note reusable.
- **Role = placement.** A note has no intrinsic "card type." Its role (Job vs Pain vs Customer vs Goal…) comes from *where a board places it*. The same note can be a "Customer" on a Value Proposition Canvas and an "Actor" on an Impact Map.
- **Reuse, not coupling.** Boards reference notes via standard `[[wikilinks]]`. The same note can appear on many boards. There is no special "consume" mechanism between board types — boards simply link the notes they want to show.

The five frameworks differ only in how they arrange the referenced notes:

| Board | Source | Visual arrangement |
|-------|--------|--------------------|
| Value Proposition Canvas | Strategyzer | Customer Profile (Jobs / Pains / Gains) ↔ Value Map (Products & Services / Pain Relievers / Gain Creators), per customer segment |
| Lean Canvas | Ash Maurya | 9-box grid (Problem, Solution, Key Metrics, UVP, Unfair Advantage, Channels, Customer Segments, Cost Structure, Revenue Streams) |
| Impact Mapping | Gojko Adzic | Tree: Goal (Why) → Actors (Who) → Impacts (How) → Deliverables (What) |
| Story Mapping | Jeff Patton | Backbone of activities/features across the top, stories stacked below, horizontal release slices |
| Roadmap | — | Timeline with releases positioned over time, holding stories/features |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Display notes on a Value Proposition Canvas (Priority: P1)

As a product owner, I want to arrange my vault notes onto a Value Proposition Canvas, so that I can see my customers' jobs/pains/gains beside the value I offer — while each item stays an editable note in my vault.

**Why this priority**: VPC is the simplest two-panel arrangement and proves the core idea: a board displays notes it does not own. It establishes the create-note / link-existing-note / arrange / open-note loop reused by every other board.

**Independent Test**: Create a VPC board, add post-its to Jobs/Pains/Gains and the Value Map (each creating a real note), reorder them, then open one post-it and confirm it is an ordinary editable note. Reload Obsidian and confirm the layout persists in the board note.

**Acceptance Scenarios**:

1. **Given** an empty vault, **When** I create a Value Proposition Canvas board, **Then** I see the two-panel framework with empty Jobs/Pains/Gains and Products/Pain-Relievers/Gain-Creators sections for one customer segment
2. **Given** a VPC board, **When** I add a post-it to the Jobs section, **Then** a new note is created in the vault and a link to it is added to the board's layout
3. **Given** a post-it on the board, **When** I open it, **Then** the underlying note opens for normal Markdown editing, and edits are reflected on the post-it
4. **Given** a post-it on the board, **When** I reorder or move it to another section, **Then** only the board's layout changes — the note's content is untouched
5. **Given** an existing note in my vault, **When** I use "link existing note" on a section, **Then** the note appears as a post-it without being copied or modified
6. **Given** multiple customer segments, **When** I view the board, **Then** each segment shows its own Customer Profile ↔ Value Map pair

---

### User Story 2 - Display notes on a Lean Canvas (Priority: P2)

As an entrepreneur, I want a 9-box Lean Canvas that arranges vault notes, reusing the same customer notes I placed on my Value Proposition Canvas, so that my business model stays consistent without duplicating content.

**Why this priority**: Lean Canvas demonstrates note *reuse* across boards (the same Customer/Value notes appear here) and a denser grid layout.

**Independent Test**: Create a Lean Canvas, link existing customer notes into Customer Segments, add post-its (new notes) to the other boxes, and verify all 9 boxes render and persist their layout.

**Acceptance Scenarios**:

1. **Given** notes already used on a VPC, **When** I link them into the Lean Canvas Customer Segments / UVP boxes, **Then** the same notes appear here with no copying
2. **Given** a Lean Canvas, **When** I add post-its to the Problem box, **Then** new notes are created and linked into that box of the layout
3. **Given** a Lean Canvas with all 9 boxes populated, **When** I reload, **Then** the full grid layout is restored from the board note

---

### User Story 3 - Display notes on an Impact Map (Priority: P3)

As a product manager, I want an Impact Map tree that arranges notes from Goal → Actors → Impacts → Deliverables, reusing my customer notes as Actors, so that I can trace business goals to features.

**Why this priority**: Impact Mapping introduces a hierarchical (tree) arrangement and shows anchor-note reuse (Customers as Actors) feeding deliverable notes that the Story Map will reuse.

**Independent Test**: Create an Impact Map, set a Goal note, link customer notes as Actors, branch Impact notes under each Actor and Deliverable (Feature) notes under each Impact; verify the tree renders and the parent/child arrangement persists.

**Acceptance Scenarios**:

1. **Given** existing customer notes, **When** I add Actors, **Then** I can link those notes as the Who level of the tree
2. **Given** a Goal and an Actor, **When** I branch an Impact, **Then** a new note is created and placed as a child of that Actor in the layout
3. **Given** an Impact, **When** I add Deliverables, **Then** Feature notes are created/linked as children, and I can expand/collapse branches

---

### User Story 4 - Display notes on a Story Map (Priority: P4)

As a development team lead, I want a Story Map whose backbone reuses my Feature notes, with user-story notes stacked below and grouped into horizontal release slices, so that I can organize delivery.

**Why this priority**: Story Mapping introduces a two-axis arrangement (backbone × stacked stories) and horizontal slicing into releases, reusing Feature notes from the Impact Map.

**Independent Test**: Create a Story Map, link Feature notes as the backbone, add user-story notes in columns under each, and group rows into release slices; verify the grid and slices persist.

**Acceptance Scenarios**:

1. **Given** existing Feature notes, **When** I build the backbone, **Then** those notes form the top row in left-to-right order
2. **Given** a backbone column, **When** I add user stories, **Then** new notes are created and stacked under that backbone item
3. **Given** stacked stories, **When** I draw a horizontal slice, **Then** a release grouping is recorded in the layout spanning the stories above the line

---

### User Story 5 - Display notes on a Roadmap (Priority: P5)

As a product owner, I want a Roadmap timeline that places release groupings (and the story/feature notes they contain) over time, so that I can communicate a delivery plan.

**Why this priority**: Roadmap is the final arrangement, adding a time axis and reusing release/story/feature notes from the Story Map.

**Independent Test**: Create a Roadmap, define a timeline range, add releases with target dates, place story/feature notes into them, and verify chronological positioning persists.

**Acceptance Scenarios**:

1. **Given** existing story/feature notes, **When** I assign them to a release on the timeline, **Then** they appear positioned at that release's date
2. **Given** a release, **When** I set its target date, **Then** its position on the timeline updates and the date is stored in the board layout
3. **Given** several releases with dates, **When** I view the Roadmap, **Then** releases are ordered chronologically along the time axis

---

### Edge Cases

- **A referenced note is deleted or renamed.** The board shows a "missing note" indicator on that slot and offers to re-link or create a replacement. Renames are followed automatically when Obsidian updates the wikilink. Removing a post-it from a board never deletes the underlying note.
- **The same note appears on multiple boards.** This is expected and supported; editing the note updates every board that displays it.
- **A board references a note that hasn't been created yet.** The slot renders as an unresolved link with a quick-create action.
- **A note has a long body.** The post-it shows the note title and a truncated preview; opening the post-it reveals the full note.
- **The user edits the board note's frontmatter by hand.** The board re-renders from the edited layout; malformed layout YAML shows a non-destructive error rather than discarding the note.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support five board types as distinct *display arrangements*: Value Proposition Canvas, Lean Canvas, Impact Mapping, Story Map, and Roadmap
- **FR-002**: System MUST treat each post-it as an ordinary vault note (one note per post-it); the note body is the content of record
- **FR-003**: System MUST store a board as a note whose frontmatter holds only the layout (section/slot → ordered list of note references, plus board-type-specific arrangement data such as dates)
- **FR-004**: System MUST NOT require any board-specific metadata on a content note for it to be displayed on a board
- **FR-005**: System MUST allow the same note to be displayed on multiple boards and in multiple sections without copying its content
- **FR-006**: System MUST let users add a post-it either by creating a new note or by linking an existing note via a picker
- **FR-007**: When creating a post-it as a new note, System MUST create the note in a user-configurable folder and add a reference to it in the board layout
- **FR-008**: System MUST render each post-it from the referenced note's title and a preview of its body, and MUST open the underlying note for editing on demand
- **FR-009**: Reordering or moving a post-it MUST modify only the board layout and MUST NOT alter the referenced note's content
- **FR-010**: Removing a post-it from a board MUST remove only the reference from the layout and MUST NOT delete the underlying note; deleting the note MUST be a separate, explicitly confirmed action
- **FR-011**: Value Proposition Canvas MUST arrange notes into per-segment Customer Profile (Jobs, Pains, Gains) and Value Map (Products/Services, Pain Relievers, Gain Creators) sections
- **FR-012**: Lean Canvas MUST arrange notes into the 9 boxes: Problem, Solution, Key Metrics, Unique Value Proposition, Unfair Advantage, Channels, Customer Segments, Cost Structure, Revenue Streams
- **FR-013**: Impact Mapping MUST arrange notes into a Goal → Actors → Impacts → Deliverables tree with expand/collapse
- **FR-014**: Story Map MUST arrange notes as a backbone (top row, ordered) with stacked story notes below each backbone item and horizontal release slices
- **FR-015**: Roadmap MUST arrange release groupings (and the notes they contain) along a time axis with target dates, ordered chronologically
- **FR-016**: System MUST display a visual indicator when a referenced note is missing (deleted or unresolved) and MUST offer re-link or quick-create
- **FR-017**: Board layouts MUST persist across sessions by virtue of being stored in the board note's frontmatter
- **FR-018**: System MUST follow Obsidian rename/move events so that references in board layouts remain valid

### Key Entities

- **Content Note**: Any ordinary Markdown note in the vault. Serves as a post-it on one or more boards. Has a title (filename / first heading) and a Markdown body. Carries no required plugin metadata.
- **Board Note**: A note identifying itself as a board (`agile-type: board`, `board-type: <type>`) whose frontmatter encodes the framework layout — the ordered references to content notes per section/slot, plus board-type-specific arrangement data (e.g., customer segments, release slices, timeline range, target dates).
- **Section / Slot**: A named region of a board's framework (e.g., "Jobs", "Problem", "Backbone", a tree node, a release column) that holds an ordered list of references to content notes. Defines the *role* a note plays while displayed there.
- **Reference**: A standard `[[wikilink]]` from a board layout to a content note. Resolved at render time; may be reported missing if unresolved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create any of the five board types and place their first post-it (as a real note) within 2 minutes
- **SC-002**: A note displayed on multiple boards shows identical, current content everywhere — editing it once updates all boards that reference it
- **SC-003**: No content is ever stored only in a board; every post-it corresponds to a note the user can open, edit, and find via search/graph independently of the plugin
- **SC-004**: Removing a post-it from a board never causes data loss — the underlying note remains in the vault in 100% of cases
- **SC-005**: Board layout (arrangement and order) is fully restored after reloading Obsidian
- **SC-006**: A missing/unresolved reference is visually identifiable within 1 second of opening a board
- **SC-007**: Board load time remains under 2 seconds regardless of how many notes are referenced

## Assumptions

- Users have basic familiarity with the agile frameworks and the purpose of each board type.
- The plugin operates within a single Obsidian vault; cross-vault references are out of scope.
- Content notes are standard Markdown; the plugin reads the body for the post-it preview and does not impose a schema on it.
- Board frameworks are predefined; user-defined custom board layouts are out of scope for this feature.
- The recommended authoring order is VPC → Lean → Impact → Story → Roadmap (because later boards naturally reuse earlier notes), but the plugin does not enforce any order and boards reference notes, not other boards.
- Real-time multi-user collaboration is out of scope; single-user scenarios are targeted.
