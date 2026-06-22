# Quickstart: Kanban Multi-Roadmap & Independent Tickets

**Spec**: 003-kanban-multi-roadmap | **Date**: 2026-06-22

---

## User Guide

### Linking multiple roadmaps

1. Open or create a Kanban board.
2. In the **Linked Roadmaps** section at the top, click **"Add roadmap"** and select a roadmap from the dropdown. Stories from that roadmap appear automatically in Backlog (unless they already have a `status:` placing them in another column).
3. To add another roadmap, repeat step 2. Stories from all linked roadmaps are aggregated and deduplicated.
4. To remove a roadmap, click the **×** button next to its name in the list. Only stories exclusive to that roadmap disappear; stories also in another linked roadmap remain.

> **Note**: Cards sourced from a roadmap have **no remove button**. To remove them from the board, remove the story from the roadmap.

---

### Adding independent tickets

1. Click **"Add ticket"** in the board header.
2. A fuzzy picker opens showing all User Story notes in the vault that are not already on this board. Type to search, then select a note.
3. The ticket appears in Backlog (or its column if it already has a `status:`).
4. Independent tickets show a **Remove** button (🗑 icon). Clicking it removes the link from the board; the note is untouched.

> **Only User Stories** (`agile-type: story`) appear in the ticket picker. Board notes and other types are excluded.

---

### Reading card badges

Each card shows a small source badge below the title:

| Badge | Meaning |
|-------|---------|
| `Sprint Roadmap` | Card comes from that roadmap |
| `Sprint Roadmap, Platform Roadmap` | Card is in multiple linked roadmaps |
| `Independent` | Card was explicitly linked; can be removed |

---

### Deadline colors

- **Roadmap-sourced cards**: color comes from the earliest release `targetDate` across ALL linked roadmaps that contain this story. Same thresholds as spec 002 (green > 30 days, yellow ≤ 30 / > 14, orange ≤ 14 / > 7, red ≤ 7 / overdue).
- **Independent tickets**: always **blue** (no release date context).
- **Terminal columns** (Done, Impact achieved): deadline color hidden, regardless of source.

---

## Developer Guide

### Running a build

```bash
npm run build   # tsc type-check + minified bundle
npm run dev     # watch build
```

### Manual verification checklist

1. **Multi-roadmap**: Create a board → link two roadmaps → confirm all their stories appear, deduplication works → remove one roadmap → only its exclusive stories disappear → reload and confirm state restores.
2. **Independent tickets**: Click "Add ticket" → confirm only User Story notes appear → add one → confirm badge shows "Independent" + remove button → remove it → confirm note untouched.
3. **Read-only roadmap cards**: Confirm no remove button on roadmap-sourced cards.
4. **Source badge**: Add two roadmaps with overlapping story → confirm badge shows both roadmap names → for a non-overlapping story confirm single roadmap name.
5. **Deadline color**: Independent ticket shows blue; roadmap story with two linked roadmaps uses earliest date across both.
6. **Legacy migration**: Open a spec 002 board note (with `roadmap:` single string) → confirm it renders correctly → move a card → reopen raw note → confirm `roadmaps:` list is present and `roadmap:` key is gone.
7. **DnD**: Independent tickets drag-and-drop exactly like roadmap cards; `status:` is updated on drop.
8. **Missing-note**: Add an independent ticket, then delete the underlying note → missing-note card shows, remove button is still present.

### Key file locations

| File | Change |
|------|--------|
| `src/types/Board.ts` | `KanbanBoard` amended; `CardSourceInfo` added |
| `src/services/BoardService.ts` | kanban parse/serialize/extractRefs/defaultLayout |
| `src/services/NoteService.ts` | `getAgileType()` added |
| `src/services/ReleaseDateService.ts` | `earliestReleaseDateFor()` added |
| `src/hooks/useDeadlineColor.ts` | `roadmapRefs: Ref[]` signature |
| `src/components/boards/KanbanBoard.tsx` | major refactor |
| `src/components/kanban/KanbanCard.tsx` | source badge + remove button |
| `src/components/kanban/KanbanColumn.tsx` | sourceMap + onRemoveCard |
| `styles.css` | source badge + remove button styles |
