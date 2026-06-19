# Research: Agile Board Types

**Feature**: 001-agile-board-types  
**Date**: 2026-06-16 (revised for display-layer architecture)

## Foundational Decision: Boards Display Notes, They Don't Own Content

**Decision**: A board is a **view** over the vault. Each post-it is an ordinary note (one note per post-it). The board note's frontmatter stores only the *layout* — which notes appear in which section, and their order. Content notes carry no board metadata.

**Rationale**:
- Matches the user's explicit requirement: "the canvases and maps are a way to display the content elegantly; the content itself is notes."
- Maximizes reuse: any note can be dropped onto any board, and the same note can appear on several boards. There is no copying and no duplication of content.
- Aligns with Principle IV (User Vault Data Safety): the plugin never hides content inside a board; everything is a first-class note the user can open, search, link, and graph.
- Aligns with Principle II (Simplicity/YAGNI): no per-card-type frontmatter schemas to define, validate, or migrate — the content note is just Markdown.

**Alternatives Considered**:
- *Content in board frontmatter* (the previous design): Rejected — content was trapped in YAML lists, not real notes; not what the user wants.
- *One note per card with sub-items in frontmatter arrays* (jobs/pains/gains as YAML): Rejected — sub-items were not notes, could not be reused or linked individually.
- *One note per card with sub-items in the note body*: Rejected by user — they want one post-it = one note (atomic), not a parsed body.

## Post-it Granularity

**Decision**: One post-it = one note. The atomic unit displayed on any board is a single vault note.

**Rationale**: User-selected. Encourages atomic, reusable notes (a single "Job", "Pain", "User Story") that can be referenced from multiple boards and surfaced in Obsidian's graph and backlinks.

**Implication**: "Card types" (Customer, Value, Problem, Goal, Impact, Feature, User Story, MMF, Release) are no longer note schemas. They are **section roles** within a board layout. A note becomes a "Job" because the VPC layout places it in the Jobs section — nothing in the note says so.

## Board ↔ Note Association

**Decision**: The board note holds the full layout. Content notes stay pure (no board pointers in their frontmatter).

**Rationale**: User-selected. Keeps content notes reusable and free of plugin coupling; a note can appear on many boards without accumulating per-board metadata. The board is the single source of truth for its own arrangement.

**Layout representation** (board frontmatter): sections map to ordered arrays of `[[wikilinks]]`. Example (VPC):
```yaml
---
agile-type: board
board-type: value-proposition-canvas
title: "Q3 Product Strategy"
segments:
  - customer: "[[Enterprise]]"
    jobs: ["[[Manage projects]]", "[[Track velocity]]"]
    pains: ["[[Tool switching]]"]
    gains: ["[[Single source of truth]]"]
    products-services: ["[[Unified board view]]"]
    pain-relievers: ["[[No tool switching]]"]
    gain-creators: ["[[Native Obsidian integration]]"]
active-segment: 0
---
```
All values are links to plain notes. Reordering edits these arrays; it never touches the notes.

## Reference Mechanism

**Decision**: Use Obsidian `[[wikilinks]]` for every board → note reference.

**Rationale**:
- Native Obsidian feature: participates in graph view, backlinks, and automatic rename/move updates.
- Users can hand-edit a board's layout in Markdown if they wish.
- Resolving a link uses `MetadataCache.getFirstLinkpathDest`; an unresolved link is the signal for the "missing note" indicator.

## Rendering a Post-it

**Decision**: A post-it shows the referenced note's title (first heading or basename) plus a truncated preview of its body. Opening the post-it opens the note (current pane; modifier-click for a new pane). Edits to the note re-render the post-it.

**Rationale**: Keeps the board readable while the note remains the editing surface. Body preview is derived from the cached file content; no schema parsing required.

## Board Layout Structures (visual arrangement only)

Confirmed against canonical sources:

### Value Proposition Canvas (Strategyzer)
Two panels per customer segment — Customer Profile (Jobs, Pains, Gains) ↔ Value Map (Products & Services, Pain Relievers, Gain Creators). Multiple segments via tabs/accordion. The "draw lines from pain relievers to pains, gain creators to gains" relationship is implied by side-by-side placement.

### Lean Canvas (Ash Maurya)
The 9-box grid:
```
┌────────────┬───────────┬───────────────┬────────────┬──────────────────┐
│  Problem   │ Solution  │     Unique     │  Unfair    │    Customer      │
│            ├───────────┤    Value       │ Advantage  │    Segments      │
│            │   Key     │  Proposition   ├────────────┤                  │
│            │  Metrics  │                │  Channels  │                  │
├────────────┴───────────┴───────────────┴────────────┴──────────────────┤
│        Cost Structure              │         Revenue Streams            │
└────────────────────────────────────┴────────────────────────────────────┘
```

### Impact Mapping (Gojko Adzic)
One or more independent goal trees, four levels each — Why (Goal, the root of each tree) → Who (Actors) → How (Impacts, behaviour changes) → What (Deliverables/Features). Rendered left-to-right or top-to-bottom with expand/collapse per branch.

### Story Mapping (Jeff Patton)
Linked to a source Impact Map. Features (the Impact Map's Deliverables) are imported into MMFs (Minimum Marketable Features), each feature belonging to at most one MMF. A table is derived from the Impact Map — one column per actor, one sub-column per imported feature, one row per impact — and each feature's cell (its own actor/impact intersection) holds the user-story notes authored there. No releases.

### Roadmap
Horizontal time axis (week/month/quarter). Releases positioned by target date; each release holds the story/feature notes assigned to it. Ordered chronologically.

## Missing / Broken References

**Decision**: Soft, non-destructive handling. On render, resolve each link; if unresolved, show a "missing note" indicator with re-link and quick-create actions. Follow Obsidian rename/move events so valid references stay valid.

**Rationale**: Principle IV — never block the user or silently drop a reference. Removing a post-it edits only the layout; the note is never deleted implicitly.

## Index / Lookup

**Decision**: Maintain a lightweight in-memory index keyed by reference path → set of boards that reference it, rebuilt on vault create/delete/rename and metadata-change events. The "link existing note" picker searches all vault notes (optionally scoped to the configured agile folder), since content notes have no required type.

**Rationale**: Fast "which boards show this note?" lookups for re-render on note edits; avoids re-scanning the vault per render. No per-type index is needed because notes are untyped.

## Technology Decisions

**Decision**: Keep the existing React + esbuild setup; no new runtime dependencies.

**Rationale**: Principle II. React renders all framework layouts; the Obsidian API handles file I/O, link resolution, and rename events.

**Deferred libraries**: drag-and-drop (use native HTML5 DnD for reordering post-its), date utilities (use `Intl` for the Roadmap timeline), state libraries (React state/reducer is sufficient).
