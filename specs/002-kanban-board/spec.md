# Feature Specification: Kanban Board

**Feature Branch**: `002-kanban-board`  
**Created**: 2026-06-19  
**Status**: Draft  
**Input**: User description: "Add a sixth agile board type: a Kanban board. Same display-layer architecture as the existing five (post-its are ordinary vault notes; the board note's frontmatter stores only the layout). Columns the user can create, rename, delete and reorder (drag-and-drop), seeded with defaults Backlog / To do / Doing / Testing / Done / Impact achieved. User stories are imported from a linked Story Map (never created here), can be reordered within a column and moved between columns by drag-and-drop, and live in at most one column at a time. Each story carries an estimate (`estimate:` frontmatter, Fibonacci scale); each column header shows the total points. Each card shows a deadline color derived from the target date of the linked Roadmap release that contains the story; the color is hidden once the card reaches Done or Impact achieved."

## Architecture Principle *(read first)*

This board type extends the existing **presentation-layer-over-vault-notes** model used by the five current board types (see `specs/001-agile-board-types/spec.md`). It introduces no new storage model:

- **Content = notes.** Every card is an ordinary Markdown note (a user story). The Kanban never creates story content; it only arranges references to stories that already exist.
- **A board = a layout.** A Kanban board is a note whose frontmatter holds only the arrangement: a link to one **source Roadmap** and, per fixed column, the ordered story references placed there.
- **Stories come from the Roadmap.** The board does not import stories one by one; it automatically displays every story contained in the linked Roadmap's releases. A story is removed from the board only by being removed from the Roadmap.
- **Fixed columns.** The columns are a fixed set (Backlog, To do, Doing, Testing, Done, Impact achieved) and are not editable; only cards move between them. The Done and Impact achieved columns are terminal (deadline color hidden).
- **Role = placement.** A story's column is its workflow state. The same story note may appear on other boards; the board layout stores only the within-column ordering.
- **Two intrinsic fields on the note.** A story's **estimate** (`estimate:`) and its **column / workflow status** (`status:`) are stored on the note itself, because both are properties of the story and should read identically everywhere the note is shown. `status` is the source of truth for a card's column: dropping a card into a column writes it, and editing it on the note moves the card. Both are optional (a story with no `status` shows in Backlog; one with no `estimate` counts as 0).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Track Roadmap stories across workflow columns (Priority: P1)

As a delivery lead, I want to create a Kanban board, link one of my Roadmaps, and have all of its stories appear automatically so I can drag each into a workflow column, so that I can track delivery state without re-entering or hand-picking any story.

**Why this priority**: This is the core of the board — without auto-displayed, movable cards across columns there is no Kanban. It proves the link-Roadmap / auto-display / arrange / persist loop and delivers a usable board on its own.

**Independent Test**: Create a Kanban board, link a Roadmap, confirm every story in that Roadmap appears as a card (new ones in Backlog), drag a card from one column to another, reorder cards within a column, reload Obsidian, and confirm every placement and order is restored and no note content changed.

**Acceptance Scenarios**:

1. **Given** an empty vault, **When** I create a Kanban board, **Then** I see six fixed columns in order — Backlog, To do, Doing, Testing, Done, Impact achieved — each empty
2. **Given** a Kanban board, **When** I link a source Roadmap, **Then** every story contained in that Roadmap's releases appears as a card, with stories not yet placed shown in the first column (Backlog)
3. **Given** a story added to the linked Roadmap later, **When** I view the board, **Then** it appears automatically as a card (no manual import); a story removed from the Roadmap no longer appears
4. **Given** a card in a column, **When** I drag it to another position in the same column, **Then** only its order within that column changes in the layout
5. **Given** a card in a column, **When** I drag it to a different column, **Then** it is removed from the source column and added to the target column, appearing in exactly one column
6. **Given** a card on the board, **When** I open it, **Then** the underlying user-story note opens for normal Markdown editing
7. **Given** a populated board, **When** I reload Obsidian, **Then** every card placement and order is restored from the board note

---

### User Story 2 - See size and urgency at a glance (Priority: P2)

As a product owner, I want each card to show its estimate, each column to show its total points, and each card to carry a deadline color tied to its release date, so that I can read load and urgency across the board instantly.

**Why this priority**: This is the analytical payoff layered on top of a working board. It depends on cards existing (User Story 1) and adds estimation and deadline signals. There is no separate "edit columns" story — the columns are a fixed set.

**Independent Test**: Set `estimate:` values on several story notes, link a Roadmap whose releases contain those stories with target dates, and confirm each card shows its estimate, each column header shows the correct point total, each card shows the expected deadline color for its remaining time, cards with no release date show blue, and cards in Done / Impact achieved show no deadline color.

**Acceptance Scenarios**:

1. **Given** a story note with `estimate: 5`, **When** it appears as a card, **Then** the card displays the estimate `5`
2. **Given** a column containing cards with estimates 3, 5, and 8, **When** I view the column header, **Then** it shows a total of `16` points
3. **Given** a story whose estimate is missing or not a valid Fibonacci value, **When** it appears as a card, **Then** the card shows no estimate and contributes 0 to the column total
4. **Given** a linked Roadmap with a release dated more than 30 days away that contains the story, **When** the card is shown outside Done/Impact achieved, **Then** the card's deadline color is green
5. **Given** release dates yielding 30, 14, and 7 days or fewer of remaining time, **When** the cards are shown, **Then** their colors are yellow (≤30 and >14), orange (≤14 and >7), and red (≤7, including overdue) respectively
6. **Given** a story not contained in any release of the linked Roadmap (or no Roadmap linked), **When** the card is shown, **Then** its deadline color is blue
7. **Given** any card, **When** it is in the Done or Impact achieved column, **Then** no deadline color is shown regardless of dates

---

### Edge Cases

- **No Roadmap linked yet.** The board shows its fixed columns, empty, with a prompt to select a source Roadmap; no stories are shown until one is linked.
- **The linked Roadmap is deleted or renamed.** Renames are followed automatically via Obsidian's link updates. If it becomes unresolved, the board shows a "Roadmap not found" indicator and the columns render empty until it is re-linked.
- **A story is added to or removed from the linked Roadmap.** Adding makes it appear automatically (in Backlog if not yet placed); removing makes it disappear from the board. Its stored column placement is retained should it return.
- **A referenced story note is deleted or unresolved.** The card slot shows a "missing note" indicator; the board never deletes a note.
- **The same story is contained in more than one Roadmap release.** The earliest target date is used to compute the deadline color. *(Assumption — see Assumptions.)*
- **A release in the linked Roadmap has no target date.** Stories whose only release has no date are treated as having no deadline (blue).
- **The user edits the board note frontmatter by hand.** The board re-renders from the edited layout; malformed layout YAML shows a non-destructive error rather than discarding the note. Missing/empty columns fall back to the fixed default set.
- **A Roadmap story is in no column.** It defaults to the first column (Backlog); a displayed story always resolves to exactly one column.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a sixth board type, Kanban, as a distinct display arrangement alongside the existing five, registered and cleaned up through the plugin lifecycle like the others.
- **FR-002**: System MUST store a Kanban board as a note whose frontmatter holds only the layout: a link to the source Roadmap and, per column, the ordered list of story references (for within-column ordering). A card's column membership is the story note's own `status:` field, not the board layout.
- **FR-002a**: System MUST reflect a card's column in its story note's frontmatter `status:` field (the column name), treating that field as the source of truth: dropping a card into a column MUST write `status:` (writing only that key, never the body), and a story whose `status:` names a column MUST appear in that column on every board that shows it. A story with no/unknown `status` MUST appear in the first column (Backlog).
- **FR-003**: System MUST present a fixed set of columns, in order: Backlog, To do, Doing, Testing, Done, Impact achieved. The column set, names, and order MUST NOT be user-editable, and there MUST be no column drag-and-drop.
- **FR-004**: System MUST let the user link exactly one source Roadmap and MUST automatically display every story contained in that Roadmap's release items as a card; there MUST be no manual per-story import.
- **FR-005**: System MUST show a story not yet placed in any column in the first column (Backlog), and MUST stop displaying a story once it is no longer in the linked Roadmap (retaining its stored placement should it return).
- **FR-006**: System MUST NOT allow creating user-story content from the Kanban board.
- **FR-008**: A displayed story MUST appear in exactly one column at a time (determined by its `status:`); moving a card between columns MUST update its `status:` accordingly.
- **FR-009**: Users MUST be able to reorder cards within a column (order persisted in the board layout) and move cards between columns (column persisted in the note's `status:`) by drag-and-drop.
- **FR-010**: Opening a card MUST open the underlying note for editing; no Kanban operation MUST ever delete a content note.
- **FR-011**: System MUST read each story's estimate from the story note's own frontmatter field `estimate:` and MUST treat it on a Fibonacci scale (1, 2, 3, 5, 8, 13, 21); a missing or non-Fibonacci value MUST be shown as no estimate and counted as 0.
- **FR-012**: System MUST allow the user to set or change a story's estimate from the card; setting an estimate MUST write the `estimate:` field to the story note's frontmatter and MUST leave the rest of the note body untouched.
- **FR-013**: Each column header MUST display the sum of the estimates of the cards it contains.
- **FR-014**: For each card, System MUST determine the story's release as the linked Roadmap release whose items contain that story, using that release's target date as the story's deadline.
- **FR-015**: System MUST display a deadline color on each card based on days remaining until its release target date: green when more than 30 days, yellow when 30 or fewer and more than 14, orange when 14 or fewer and more than 7, red when 7 or fewer (including overdue); when the story has no resolvable release date, the color MUST be blue.
- **FR-016**: System MUST hide the deadline color for any card located in the Done or Impact achieved columns.
- **FR-017**: System MUST display a "missing note" indicator for an unresolved story reference, and MUST display a "Roadmap not found" indicator when the linked Roadmap is unresolved (rendering the columns empty until re-linked).
- **FR-018**: System MUST follow Obsidian rename/move events so that references to story notes and to the source Roadmap remain valid.
- **FR-019**: Board layout (per-column card placement and order, and the source Roadmap link) MUST persist across sessions by virtue of being stored in the board note's frontmatter and MUST be fully restored on reload.
- **FR-020**: System MUST register the `.board` file extension with Obsidian so that vault notes with that extension open in the Agile Board view by default, without requiring the user to manually select the view; the registration MUST be cleaned up automatically when the plugin unloads.

### Key Entities *(include if feature involves data)*

- **Kanban Board Note**: A note identifying itself as a board (`agile-type: board`, `board-type: kanban`) whose frontmatter encodes the layout: a link to the source Roadmap and, per fixed column, the ordered story references placed there.
- **Column**: One of the fixed, non-editable workflow states (Backlog, To do, Doing, Testing, Done, Impact achieved) holding an ordered list of references to the story notes placed there. Done and Impact achieved are terminal (deadline color hidden).
- **User Story (card)**: An ordinary Markdown note that is a member of the linked Roadmap's releases. Carries two optional intrinsic frontmatter fields in its own note: `estimate:` (Fibonacci) and `status:` (its Kanban column name). `status:` is the source of truth for the card's column.
- **Source Roadmap**: An existing Roadmap board referenced by the Kanban; its releases (each with items and an optional target date) supply both the set of stories shown on the board and the release date used to compute each card's deadline color.
- **Reference**: A standard `[[wikilink]]` from the Kanban layout to a story note (or to the source Roadmap), resolved at render time and reported missing if unresolved.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a Kanban board and link a Roadmap so its stories appear on the board within 2 minutes.
- **SC-002**: No Kanban operation ever deletes a note — underlying notes remain in the vault in 100% of cases.
- **SC-003**: After reloading Obsidian, every card placement and order is restored exactly in 100% of cases.
- **SC-004**: Every displayed story resolves to exactly one column at all times — no story appears in two columns, and every Roadmap story appears (unplaced ones in Backlog).
- **SC-005**: A column header's displayed total equals the sum of its cards' Fibonacci estimates for every column.
- **SC-006**: Each card outside Done / Impact achieved shows the correct deadline color for its remaining time (green/yellow/orange/red, or blue when no date) in 100% of checked cases, and cards in Done / Impact achieved show none.
- **SC-007**: Editing a story note once (content or estimate) is reflected on the Kanban card and on every other board that references the same note.
- **SC-008**: Board interactions (move card, reorder) complete in under 100 ms on a typical vault.

## Assumptions

- The Kanban reuses the existing display-layer infrastructure (note references, missing-note indicators, rename handling, board frontmatter persistence) established for the first five board types.
- A story shown on the board is any note contained in the linked Roadmap's release items; the Kanban does not define what makes a note a story beyond that membership.
- The estimate (`estimate:`) and the column (`status:`) are stored on the note rather than only in the board layout, because both are properties of the story and should be identical wherever the note is displayed; `status:` holds the column name and is the source of truth for placement, while the board layout retains only the within-column ordering.
- When a story belongs to more than one release on the linked Roadmap, the earliest target date is used for the deadline color.
- Deadline-color thresholds are fixed at green > 30 days, yellow ≤ 30 and > 14, orange ≤ 14 and > 7, red ≤ 7 (including overdue), and blue when no date; configurable thresholds are out of scope for this version.
- The columns are a fixed set and are not user-editable; editable/custom columns, WIP limits, swimlanes, and color-by-estimate are out of scope for this version.
- The plugin operates within a single Obsidian vault; the source Roadmap lives in the same vault.
- Roadmap stories not yet placed default to the first column (Backlog) unless the user drags them elsewhere.
