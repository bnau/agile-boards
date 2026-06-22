# Research: Kanban Multi-Roadmap & Independent Tickets

**Branch**: `003-kanban-multi-roadmap` | **Date**: 2026-06-22 | **Plan**: [plan.md](plan.md)

## Decision Log

### D1 — Frontmatter field names for new Kanban fields

**Decision**: Replace `roadmap: "<ref>"` with `roadmaps: ["<ref>", …]` (array). Add `independent-tickets: ["<ref>", …]` (array, kebab-case for naming consistency with `board-type`, `agile-type`, etc.).

**Rationale**: Kebab-case is used consistently in every existing board frontmatter field. A list field is the natural plural. The old `roadmap:` single string is a valid degenerate case that the parser migrates on read.

**Alternatives considered**: Using `roadmap-links:` or `linked-roadmaps:` — rejected as wordier and less discoverable. Using a nested object (e.g. `roadmaps: [{ref: "…", label: "…"}]`) — rejected as YAGNI; the roadmap note's own title is sufficient for labelling.

---

### D2 — Migration of legacy `roadmap:` single-link boards

**Decision**: In `BoardService.frontmatterToBoard`, when the `kanban` branch encounters a frontmatter that has `roadmap:` set but no `roadmaps:` key, coerce it to `roadmaps: [roadmap]` (a one-element list). On the next save via `layoutToFrontmatter`, the board is written with `roadmaps:` only (the old `roadmap:` key is dropped because the full frontmatter object is replaced). This is a silent, automatic migration.

**Rationale**: One-time, transparent, and respects Vault Data Safety — the note is only rewritten on a user action that already saves the board (e.g. moving a card), not proactively. After migration the board is functionally identical.

**Alternatives considered**: A separate migration pass on plugin load — rejected as adding complexity and touching board files without user action (violates Principle IV). Keeping both fields in parallel — rejected as redundant and error-prone.

---

### D3 — Card source tracking data structure

**Decision**: `KanbanBoard.tsx` computes a `Map<string, CardSourceInfo>` keyed by the resolved note `file.path`, built during story aggregation (before computing `displayColumns`). It is passed down through `KanbanColumn` to `KanbanCard` as a prop. `CardSourceInfo` is a discriminated union:
```typescript
type CardSourceInfo =
  | { kind: 'roadmap'; roadmapRefs: Ref[] }   // sorted by roadmap order
  | { kind: 'independent' }
```

**Rationale**: Centralising source computation in `KanbanBoard` keeps `KanbanCard` declarative; the card just renders what it is told. The map is cheap to build (one pass over stories), naturally handles the "in multiple roadmaps" case, and the `roadmapRefs` sub-array gives the card exactly what it needs for the source label and the deadline color hook.

**Alternatives considered**: Storing source on the `KanbanColumn.cards` array — rejected because the column layout stores `Ref` strings (wikilinks), not rich objects; enriching them would require changing the stored schema. Passing a lookup function instead of a map — rejected as making re-renders harder to control.

---

### D4 — ReleaseDateService: multi-roadmap extension

**Decision**: Add a new method `earliestReleaseDateFor(storyRef: Ref, roadmapRefs: Ref[], sourcePath: string): string | null` to `ReleaseDateService`. It loops over `roadmapRefs`, calls the existing `releaseDateFor` for each, and returns the minimum non-null date string (ISO lexicographic ordering is correct for `YYYY-MM-DD`). The existing `releaseDateFor` method is kept unchanged (used by the single-roadmap case via delegation if needed, or called directly per roadmap).

**Rationale**: Additive change; the existing single-roadmap path in `releaseDateFor` is reused. Minimal blast radius — only `useDeadlineColor` switches to the new method.

**Alternatives considered**: Modifying `releaseDateFor` to accept `Ref | Ref[]` — rejected as overloading the signature in a way that muddies the intent. Inlining the loop in the hook — rejected as moving logic into a React hook that belongs in a service.

---

### D5 — `useDeadlineColor` signature update

**Decision**: Change `roadmapRef: Ref | undefined` to `roadmapRefs: Ref[]`. Independent cards pass `[]`; roadmap-sourced cards pass the array of roadmap refs their story belongs to. The hook calls `releaseDateService.earliestReleaseDateFor(storyRef, roadmapRefs, sourcePath)` (returns `null` for `[]` → blue).

**Rationale**: Consistent with the multi-roadmap model. Passing `[]` for independent tickets naturally yields blue (no date) without special-casing in the hook.

**Alternatives considered**: Keeping `roadmapRef?: Ref` and adding a separate hook for multi-roadmap — rejected as duplicating hook logic for no gain.

---

### D6 — "Add ticket" picker: filtering to User Stories

**Decision**: Add `getAgileType(file: TFile): string | null` to `NoteService` — reads `agile-type` from the MetadataCache frontmatter. In `KanbanBoard.tsx`, compute `storyFiles` = all vault markdown files where `getAgileType(f) === 'story'` and the file is not already on the board (neither roadmap-sourced nor already in `independentTickets`). Pass `storyFiles` as the `items` option to `openNotePicker`.

**Rationale**: `NoteService` already owns frontmatter reading (`getEstimate`, `getStatus`). Adding `getAgileType` keeps reads centralised. The MetadataCache lookup is synchronous and fast (O(n) over all markdown files; n is bounded by vault size). The filtering to exclude already-on-board notes prevents duplicates without a confirmation dialog.

**Alternatives considered**: Filtering by folder convention — rejected because `agile-type: story` is the canonical marker, not folder location (stories can live anywhere). Adding a separate `StoryService` — rejected as over-abstraction for one getter (YAGNI).

---

### D7 — Roadmap-sourced precedence over independent tickets

**Decision**: During story aggregation in `KanbanBoard.tsx`, roadmap stories are collected first (all linked roadmaps, deduplicated). Then `independentTickets` are processed: a ticket is classified `independent` only if its resolved path is NOT in the roadmap-story set. Cards that appear in both are rendered as roadmap-sourced (no remove button, roadmap badge).

**Rationale**: FR-008 mandates this. The user adding an independent ticket that later appears in a roadmap should not be confused by two remove affordances or by the card's provenance becoming ambiguous. Roadmap membership is the stronger signal.

**Alternatives considered**: Showing a "promoted from independent" indicator — rejected as extra complexity for a rare edge case.

---

### D8 — Roadmap management UI

**Decision**: Replace the single roadmap `<select>` in `KanbanBoard.tsx` with:
1. A listed display of currently linked roadmaps (each showing its title + a remove button).
2. An "Add roadmap" `<select>` that lists roadmap boards from `indexService.getBoardsOfType('roadmap')` excluding already-linked ones. Selecting one appends it to `board.roadmaps` and persists.

**Rationale**: The list + add-select pattern matches the existing board UI convention (e.g., Impact Map's goal list). Removing a roadmap from the list is a single-click action scoped to the board note — it does not touch any story note.

**Alternatives considered**: A modal / drawer for roadmap management — rejected as unnecessary complexity for a list that is unlikely to exceed ~5 entries. A multi-select combobox — rejected as less discoverable than the explicit add/remove pattern.

---

### D9 — DnD for independent cards

**Decision**: No change to the drag-and-drop logic. Independent cards participate in the same native HTML5 DnD as roadmap-sourced cards. Moving them between columns updates their `status:` frontmatter identically.

**Rationale**: Column placement is `status:`-driven regardless of card source (spec 002, FR-002a). DnD is purely a layout interaction.

---

### D10 — Missing-note handling for independent tickets

**Decision**: If an independent ticket's ref resolves to a missing note, render it using the existing `MissingNote` component (same as roadmap-sourced missing notes) and still show the remove button (independent card, so it can be removed from the board). No new special-casing needed.

**Rationale**: The user explicitly linked this ticket, so they should be able to remove it even when missing. The existing `MissingNote` component already communicates the problem.
