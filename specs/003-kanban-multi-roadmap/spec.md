# Feature Specification: Kanban Board — Multi-Roadmap & Independent Tickets

**Feature Branch**: `003-kanban-multi-roadmap`
**Created**: 2026-06-22
**Status**: Draft
**Input**: Amends spec 002 (Kanban Board). Adds multi-roadmap linking, independent tickets with explicit deletion, read-only protection for roadmap-sourced cards, and per-card source indicators.

## Architecture Principle *(read first)*

This feature amends the Kanban board established in spec 002 (Kanban Board). It extends the same **presentation-layer-over-vault-notes** model without introducing a new storage system:

- **Source of card membership**: A card on the board is either (a) *roadmap-sourced* — it belongs to a release in at least one linked roadmap — or (b) *independent* — it is an existing User Story note explicitly linked to this board, with no roadmap association.
- **Independent tickets are board-managed**: Only independent tickets can be removed from the board. Removing them unlinks the note reference from the board frontmatter; the note itself is never deleted.
- **Roadmap tickets are roadmap-managed**: Cards sourced from a linked roadmap appear automatically and cannot be removed from the board directly. To remove them, the user must remove them from the roadmap.
- **Multi-roadmap**: A board can reference zero or more roadmaps. All stories across all linked roadmaps are aggregated and deduplicated before display.
- **Independent tickets are User Stories only**: Only notes identified as User Stories (`agile-type: story`) can be linked as independent tickets. No other note type can be added.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Link multiple roadmaps to aggregate stories (Priority: P1)

As a delivery lead, I want to link several roadmaps to a single Kanban board so that I can track stories from multiple product lines in one unified view, without needing separate boards.

**Why this priority**: Without multi-roadmap support the feature has no value. This story unlocks the core capability and is independently demonstrable.

**Independent Test**: Create a Kanban board → add two roadmaps each containing distinct stories → confirm all stories from both roadmaps appear as cards, deduplicated → remove one roadmap → confirm only its stories disappear → reload and confirm state is restored.

**Acceptance Scenarios**:

1. **Given** a Kanban board with no linked roadmaps, **When** I add a roadmap, **Then** all of its stories appear automatically as cards, unplaced ones in the Backlog column
2. **Given** a Kanban board with one linked roadmap, **When** I add a second roadmap, **Then** stories from both roadmaps are shown, deduplicated (a story in both roadmaps appears exactly once)
3. **Given** a card sourced from a roadmap, **When** I view the card, **Then** there is no delete affordance on it; I cannot remove it from the board through any board interaction
4. **Given** a Kanban board with two linked roadmaps, **When** I remove one roadmap link, **Then** only stories exclusive to that roadmap disappear; stories also in the remaining roadmap stay
5. **Given** multiple linked roadmaps, **When** I reload Obsidian, **Then** all roadmap links and card placements are restored exactly
6. **Given** a linked roadmap that is later renamed, **When** I view the board, **Then** the link updates automatically via Obsidian rename tracking and stories continue to display
7. **Given** a linked roadmap that is deleted or becomes unresolvable, **When** I view the board, **Then** the board shows a "Roadmap not found" warning for that link and hides its stories, while stories from other linked roadmaps remain

---

### User Story 2 — Add and remove independent tickets (Priority: P2)

As a product owner, I want to add existing User Story notes to the Kanban board as independent tickets, and remove them when they are no longer relevant, without affecting the underlying note or any roadmap.

**Why this priority**: Independent tickets are the second core capability. They depend on the board existing (US1) and add the ability to manage ad-hoc work alongside roadmap-driven work.

**Independent Test**: On a Kanban board (with or without roadmaps) → link an existing User Story note as an independent ticket → confirm it appears with a visible remove button → drag it across columns → remove it from the board → confirm the note still exists in the vault → reload and confirm the board state is restored.

**Acceptance Scenarios**:

1. **Given** a Kanban board, **When** I use the "Add ticket" affordance, **Then** I am shown a picker that lists only User Story notes (`agile-type: story`) from the workspace, excluding notes already on the board
2. **Given** a selected User Story, **When** I confirm the addition, **Then** it appears as an independent card in the Backlog column (unless it already has a `status:` placing it elsewhere), with a visible remove button
3. **Given** an independent card, **When** I click its remove button, **Then** the card is removed from the board and the underlying note is untouched
4. **Given** an independent card, **When** I drag it between columns, **Then** its `status:` frontmatter is updated exactly as for roadmap-sourced cards
5. **Given** a User Story already on the board (either roadmap-sourced or independent), **When** I open the "Add ticket" picker, **Then** that story does not appear in the picker
6. **Given** a note that is NOT a User Story (`agile-type: story`), **When** I use the "Add ticket" picker, **Then** that note does not appear; no non-story note can be added

---

### User Story 3 — Distinguish card sources at a glance (Priority: P3)

As a team member, I want each card to clearly indicate whether it comes from a roadmap (and which one) or is an independent ticket, so I know at a glance why some cards have a remove button and others do not.

**Why this priority**: Clarity about card provenance prevents confusion. It can be layered onto US1+US2 without blocking earlier stories.

**Independent Test**: On a board with at least one roadmap and at least one independent ticket → confirm roadmap-sourced cards display a roadmap label/badge → confirm independent cards display a different label (e.g., "Independent") → confirm roadmap cards have no remove button → confirm independent cards have a remove button.

**Acceptance Scenarios**:

1. **Given** a card sourced from a roadmap, **When** I view the card, **Then** it displays the name of its source roadmap as a label or badge
2. **Given** a card that is an independent ticket, **When** I view the card, **Then** it displays a label or badge indicating it is independent (not roadmap-linked)
3. **Given** a story that appears in multiple linked roadmaps, **When** I view its card, **Then** the label reflects that it belongs to more than one roadmap (e.g., lists all source roadmaps or shows a combined indicator)
4. **Given** any card, **When** the source is unresolvable (roadmap deleted, independent note missing), **Then** a "missing source" indicator is shown and the card renders as a missing-note card

---

### Edge Cases

- **A story in two linked roadmaps**: It appears exactly once on the board. Its deadline color uses the earliest `targetDate` across all releases in all linked roadmaps that contain it. Its source label reflects both roadmaps.
- **An independent ticket that is later added to a linked roadmap**: It continues to appear on the board. Whether it is treated as roadmap-sourced or independent at that point is resolved by the deduplication step: roadmap-sourced takes precedence, and the remove button disappears.
- **The "Add ticket" picker is opened on a board with no linked roadmaps**: The picker still shows all User Story notes in the workspace (no roadmap filter applies); any US can be added as an independent ticket.
- **A linked roadmap link is removed but the story was also an independent ticket**: This scenario cannot arise because a note cannot be both at the same time; roadmap-sourced always takes precedence.
- **No roadmaps and no independent tickets**: The board shows its fixed columns with an empty state and affordances to add a roadmap or a ticket.
- **A non-story note is added manually to the board frontmatter**: The board ignores it (does not render a card) or renders it as a missing-note / invalid-type indicator — no crash.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow a Kanban board to be linked to zero or more roadmaps (previously exactly one). All roadmap links are stored in the board note frontmatter as an ordered list.
- **FR-002**: System MUST automatically display every story contained in any linked roadmap's release items, aggregated and deduplicated across all linked roadmaps; there MUST be no manual per-story import for roadmap stories.
- **FR-003**: System MUST allow the user to add a roadmap link and remove a roadmap link independently; adding a roadmap makes its stories appear; removing a roadmap makes stories exclusive to it disappear.
- **FR-004**: System MUST provide an "Add ticket" affordance that opens a picker of User Story notes (`agile-type: story`) present in the vault, excluding notes already on the board (roadmap-sourced or independent).
- **FR-005**: System MUST allow the user to add a User Story note from the picker as an independent ticket on the board; only notes with `agile-type: story` are selectable; adding them never creates or modifies the note.
- **FR-006**: System MUST render independent tickets with a visible remove affordance (button or icon); removing an independent ticket removes its reference from the board frontmatter and MUST NOT delete or modify the underlying note.
- **FR-007**: System MUST NOT render a remove affordance on roadmap-sourced cards; those cards can only be removed by removing the story from the roadmap itself.
- **FR-008**: When a story is present in at least one linked roadmap, it MUST be treated as roadmap-sourced (not independent), even if it was previously added as an independent ticket. Roadmap-sourced status takes precedence.
- **FR-009**: Each card MUST display a source indicator: roadmap-sourced cards show the name(s) of the roadmap(s) they belong to; independent cards show a distinct "Independent" label. This indicator must be visible without opening the note.
- **FR-010**: For deadline color, roadmap-sourced cards use the earliest `targetDate` across all releases in all linked roadmaps that contain that story (existing logic extended to multiple roadmaps). Independent tickets always receive the "no date" color (blue).
- **FR-011**: System MUST persist the list of linked roadmaps and the list of independent ticket references in the board note frontmatter; both MUST be fully restored on reload.
- **FR-012**: System MUST display a per-roadmap "not found" warning when a linked roadmap is unresolvable, while continuing to display stories from other linked roadmaps and all independent tickets.
- **FR-013**: All existing Kanban behaviors from spec 002 that are NOT explicitly changed by this spec MUST be preserved: fixed column set, card drag-and-drop, `status:`-driven column placement, estimate read/write, column point totals, deadline color thresholds, missing-note indicators, rename tracking, and board note persistence.

### Key Entities

- **Kanban Board Note** (amended): Now stores a list of roadmap links (`roadmaps: [...]`, replacing the single `roadmap:` field) and a separate list of independent ticket references (`independentTickets: [...]`) in its frontmatter.
- **Roadmap-Sourced Card**: A card auto-displayed from a linked roadmap's release items. Cannot be removed from the board directly. Source indicator shows roadmap name(s).
- **Independent Ticket**: An existing User Story note (`agile-type: story`) explicitly linked to the board. Has a remove affordance. Source indicator shows "Independent". Stored in `independentTickets:` in the board frontmatter.
- **Source Indicator**: A visible label on each card identifying its provenance (roadmap name(s) or "Independent").

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can link a second roadmap to an existing Kanban board and see its stories appear within 5 seconds, with no stories duplicated.
- **SC-002**: A user can add an independent ticket from the vault picker in under 30 seconds on a vault with up to 500 User Story notes.
- **SC-003**: Removing an independent ticket from the board leaves the underlying vault note completely unmodified in 100% of cases.
- **SC-004**: Roadmap-sourced cards have no remove affordance in 100% of cases; independent cards always have a remove affordance.
- **SC-005**: Every card displays a correct source indicator (roadmap name or "Independent") in 100% of displayed cards.
- **SC-006**: After reloading Obsidian, all roadmap links, independent ticket references, and card placements are restored exactly.
- **SC-007**: Removing a roadmap link from the board makes stories exclusive to that roadmap disappear within one render cycle; stories in remaining roadmaps are unaffected.
- **SC-008**: Board interactions (add roadmap, remove roadmap, add independent ticket, remove independent ticket) complete in under 500 ms on a typical vault.

## Assumptions

- This spec amends spec 002 (Kanban Board); all infrastructure from spec 002 (fixed columns, DnD, estimates, deadline colors, `BoardService`, `ReferenceService`, `IndexService`, `PostIt`, `MissingNote`, `NotePicker`) is already in place and is reused without change.
- The single `roadmap:` frontmatter field from spec 002 is migrated to a `roadmaps:` list on first parse; a legacy board note with a single `roadmap:` is read as if it had `roadmaps: [<that value>]` and rewritten as a list on first save.
- "User Story note" means a vault note whose frontmatter contains `agile-type: story`; this is the existing convention used by other board types.
- Independent tickets cannot be created (authored) from the Kanban board; only linking existing notes is supported. Creating new story content is out of scope.
- WIP limits, swimlanes, custom column names, and column reordering remain out of scope.
- The plugin operates within a single Obsidian vault; all linked roadmaps and independent ticket notes live in the same vault.
- Deadline color thresholds are unchanged from spec 002 (green >30 days, yellow ≤30/>14, orange ≤14/>7, red ≤7, blue = no date).
- No new runtime dependencies are introduced; the feature reuses the existing stack (TypeScript, React, Obsidian API, `processFrontMatter`).
