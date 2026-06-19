# Quickstart: Kanban Board

## For users

### Create a Kanban board
1. Run the command **Create Kanban Board** (command palette) or pick it from the agile-board ribbon.
2. A new board note is created with six columns: **Backlog, To do, Doing, Testing, Done, Impact achieved**.

### Bring in your stories
1. In the board header, select a **source Story Map** — the Story Map whose user stories you want to track.
2. Click **+ Import story** on a column and pick a story from the map. (Stories already on the board are not offered again.)
3. The Kanban never creates stories — author them in the Story Map; here you only arrange them.

### Move things around
- **Reorder a card** within a column: drag it up/down.
- **Move a card** to another column: drag it onto that column. A story lives in exactly one column.
- **Reorder columns**: drag a column header left/right.
- **Add / rename / delete a column**: use the column header controls. Deleting a column with cards asks for confirmation and only removes the cards from the board (the notes stay in your vault).
- **Remove a card**: the ✕ on the card removes it from the board; the note is never deleted.

### Estimate & deadline color
- Set a card's **estimate** (story points, Fibonacci: 1, 2, 3, 5, 8, 13, 21) from the card. It is saved to the story note's frontmatter (`estimate:`), so it shows everywhere that note appears.
- Each column header shows the **total points** of its cards.
- Select a **source Roadmap** in the header to enable **deadline colors**. Each card is tinted by time left until the date of the Roadmap release that contains it:
  - **green** > 30 days · **yellow** ≤ 30 · **orange** ≤ 14 · **red** ≤ 7 (or overdue) · **blue** when the story has no release date.
  - The color disappears once a card reaches **Done** or **Impact achieved**.

## For developers

### Where things live
- **Type & defaults**: `src/types/Board.ts` (`KanbanBoard`, `KanbanColumn`, `defaultKanbanColumns`), `src/constants.ts` (`VIEW_TYPE_KANBAN`, thresholds, Fibonacci scale).
- **Persistence**: `src/services/BoardService.ts` — `'kanban'` branches in `frontmatterToBoard`, `layoutToFrontmatter`, `defaultLayout`, `extractRefs`.
- **Estimate I/O**: `src/services/NoteService.ts` — `getEstimate` / `setEstimate` (via `app.fileManager.processFrontMatter`).
- **Release dates**: `src/services/ReleaseDateService.ts` — `releaseDateFor(storyRef, roadmapRef, sourcePath)`.
- **View**: `src/views/KanbanView.tsx` (registered in `src/main.ts`).
- **UI**: `src/components/boards/KanbanBoard.tsx` + `src/components/kanban/{KanbanColumn,KanbanCard}.tsx`; reuses `PostIt`, `MissingNote`, `NotePicker`, `ConfirmDialog`.
- **Color**: `useDeadlineColor` hook + a pure `deadlineColor(...)` helper.

### Wiring a new board type (checklist, mirrors the five existing types)
1. Add `'kanban'` to `BoardType` and the `KanbanBoard` shape to the `AgileBoard` union.
2. Add `VIEW_TYPE_KANBAN` and register the view + a create command in `main.ts`; add it to `VIEW_TYPE_MAP`.
3. Add `BoardService` parse/serialize/default/extractRefs branches.
4. Build the view (copy `StoryMapView.tsx` shape) and the board component.

### Build & verify
- `npm run dev` — watch build; reload the plugin (Hot-Reload or toggle off/on).
- `npm run build` — `tsc -noEmit` type-check + production bundle. Run this before considering a task done.
- Manual verification (per constitution) against the acceptance scenarios in `spec.md`:
  - Create board → 6 default columns appear in order.
  - Link a Story Map → import stories; each appears in exactly one column; reload restores layout.
  - Drag a card within and across columns; reorder columns; delete a non-empty column (confirm) — notes survive.
  - Set `estimate:` on stories → card shows it, column header sums correctly; invalid value counts as 0.
  - Link a Roadmap with dated releases → colors match 30/14/7 thresholds; no date → blue; Done / Impact achieved → no color.

### Key invariants to preserve
- One column per story (enforce on import, move, and hand-edit repair).
- Never create or delete a content note from Kanban operations; the only content-note write is the user-set `estimate:`.
- All resource registration in `onload`/`onOpen`, cleanup in `onunload`/`onClose`.
