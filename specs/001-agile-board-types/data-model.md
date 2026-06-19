# Data Model: Agile Board Types

**Feature**: 001-agile-board-types  
**Date**: 2026-06-16 (revised for display-layer architecture)

## Mental Model

```
┌──────────────────────────────────────────────────────────────────────────┐
│  THE VAULT                                                                 │
│                                                                            │
│   Content notes (ordinary .md — the post-its)                              │
│   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐     │
│   │ Manage       │ │ Tool         │ │ Single       │ │ Enterprise   │ ... │
│   │ projects.md  │ │ switching.md │ │ source.md    │ │ (segment).md │     │
│   └──────▲───────┘ └──────▲───────┘ └──────▲───────┘ └──────▲───────┘     │
│          │ [[wikilink]]   │                │                │              │
│   ┌──────┴────────────────┴────────────────┴────────────────┴────────┐    │
│   │  BOARD NOTE  (agile-type: board)                                   │   │
│   │  frontmatter = LAYOUT ONLY:                                        │   │
│   │    section "Jobs"  → [ [[Manage projects]] ]                       │   │
│   │    section "Pains" → [ [[Tool switching]] ]                        │   │
│   │    section "Gains" → [ [[Single source]] ]                        │   │
│   └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘

A board NEVER stores content. It stores references (wikilinks) and their order.
Content lives only in the notes. The same note can be referenced by many boards.
```

Two entities exist: **Content Note** (any note) and **Board Note** (a layout). Everything else ("Customer", "Job", "Impact", "Release"…) is a *section role* assigned by a board's layout, not a property of a note.

## Content Note

**What it is**: An ordinary Markdown note. It is the unit of content — one post-it = one note.

**Required plugin metadata**: **None.** A content note needs no `agile-type` and no board pointers. Any note in the vault can be placed on any board.

**Displayed as a post-it using**:
- **Title** — first H1 heading if present, otherwise the file basename.
- **Preview** — a truncated rendering of the note body.

```markdown
# Manage multiple projects

Enterprise PMs juggle several concurrent initiatives and need a single
place to see status across all of them.
```

> The note above is just a note. It becomes a "Job" only because a Value
> Proposition Canvas lists it under its Jobs section. Placed under an Impact
> Map's "Deliverables", the very same note would render as a deliverable.

**Optional, user's choice (not required, not written by the plugin by default)**: users may add their own tags or frontmatter for their own organization; the plugin reads none of it for board placement.

## Board Note

**What it is**: A note that declares itself a board and encodes a framework layout in its frontmatter. The body may hold a free-form description.

**Common frontmatter**:
```yaml
---
agile-type: board
board-type: value-proposition-canvas   # | lean-canvas | impact-map | story-map | roadmap
title: "Q3 Product Strategy"
created: 2026-06-16
modified: 2026-06-16
# ...board-type-specific layout follows (see below)
---
# Q3 Product Strategy

Optional free-form notes about this board.
```

**Layout invariants** (apply to every board type):
- Every slot value is either a single `"[[wikilink]]"` or an **ordered array** of wikilinks to content notes.
- Order in the array == display order on the board.
- A board never contains the post-it text itself — only links.
- Editing arrays (reorder / add / remove links) is the only thing reordering or removing a post-it does; the referenced notes are never touched.
- An unresolved link is rendered as a "missing note" indicator (re-link / quick-create), never silently dropped.

### Section / Slot

A named region of a framework that holds an ordered list of references. The section name defines the **role** a note plays while shown there. Sections are fixed per board type (frameworks are predefined).

### Reference

A standard Obsidian `[[wikilink]]`. Resolved at render time via `MetadataCache`. Rename/move events keep links valid automatically.

---

## Per-Board Layout Schemas

> These describe the **board note frontmatter only**. None of these fields ever
> appear on the content notes they point to.

### Value Proposition Canvas

```yaml
---
agile-type: board
board-type: value-proposition-canvas
title: "Q3 Product Strategy"
segments:
  - customer: "[[Enterprise]]"          # optional anchor note for the segment
    # Customer Profile
    jobs:            ["[[Manage projects]]", "[[Track velocity]]"]
    pains:           ["[[Tool switching]]", "[[Lost context]]"]
    gains:           ["[[Single source of truth]]"]
    # Value Map
    products-services: ["[[Unified board view]]"]
    pain-relievers:    ["[[No tool switching]]"]
    gain-creators:     ["[[Native Obsidian integration]]"]
  - customer: "[[SMB]]"
    jobs: []
    pains: []
    gains: []
    products-services: []
    pain-relievers: []
    gain-creators: []
active-segment: 0
---
```
- `segments`: ordered list; each is a Customer Profile ↔ Value Map pair.
- `customer`: optional link to a "segment/persona" note (itself reusable as an Actor on an Impact Map).
- Six section arrays per segment; all arrays of links, all may be empty.

### Lean Canvas

```yaml
---
agile-type: board
board-type: lean-canvas
title: "Business Model"
sections:
  problem:          ["[[Fragmented planning]]"]
  solution:         ["[[Integrated boards]]"]
  key-metrics:      ["[[Weekly active boards]]"]
  unique-value-proposition: ["[[One vault, every framework]]"]
  unfair-advantage: ["[[Vault-native data]]"]
  channels:         ["[[Community plugins directory]]"]
  customer-segments: ["[[Enterprise]]", "[[SMB]]"]   # reused from VPC
  cost-structure:   ["[[Maintenance time]]"]
  revenue-streams:  ["[[Donations]]"]
---
```
- Nine fixed keys, each an ordered array of links. `customer-segments` commonly reuses the same notes referenced by a VPC board.

### Impact Map

```yaml
---
agile-type: board
board-type: impact-map
title: "Goals 2026"
goal: "[[Increase team productivity]]"     # the single Why (root)
actors:                                    # Who → How → What tree
  - actor: "[[Enterprise]]"                # reused customer note
    impacts:
      - impact: "[[Reduce context switching]]"
        deliverables: ["[[Unified board view]]", "[[Quick switcher]]"]
      - impact: "[[Faster planning]]"
        deliverables: ["[[Inline editing]]"]
  - actor: "[[SMB]]"
    impacts: []
layout: horizontal          # | vertical
collapsed: ["[[SMB]]"]      # branches the user collapsed
---
```
- `goal`: single link (root of the tree).
- `actors[]` → `impacts[]` → `deliverables[]`: nested arrays of links expressing the Who/How/What hierarchy.
- `deliverables` (Feature notes) are commonly reused as the Story Map backbone.

### Story Map

```yaml
---
agile-type: board
board-type: story-map
title: "Product Backlog"
backbone: ["[[Unified board view]]", "[[Card management]]"]   # ordered activities/features
stories:                       # one column of stacked story notes per backbone item
  "[[Unified board view]]": ["[[View all boards]]", "[[Switch boards]]"]
  "[[Card management]]":     ["[[Create card]]", "[[Link card]]", "[[Move card]]"]
slices:                        # horizontal release bands (walking skeleton first)
  - name: "Release 1 (walking skeleton)"
    stories: ["[[View all boards]]", "[[Create card]]"]
  - name: "Release 2"
    stories: ["[[Switch boards]]", "[[Link card]]"]
---
```
- `backbone`: ordered links (top row), commonly reusing Impact Map deliverables.
- `stories`: map from a backbone link to its ordered column of story links.
- `slices`: ordered horizontal release bands; each names the story links it spans.

### Roadmap

```yaml
---
agile-type: board
board-type: roadmap
title: "2026 Roadmap"
timeline-unit: month          # | week | quarter
start-date: 2026-07-01
end-date: 2026-12-31
releases:                     # ordered chronologically by target-date
  - name: "v1.0.0 — Foundation"
    target-date: 2026-07-15
    items: ["[[View all boards]]", "[[Create card]]"]   # story/feature notes
  - name: "v1.1.0 — Reuse"
    target-date: 2026-09-30
    items: ["[[Link card]]"]
---
```
- `releases[]`: each has a `name`, optional `target-date`, and an ordered `items` array of links (story/feature notes reused from the Story Map).
- Timeline range + unit drive horizontal positioning; releases render in date order.

---

## Lifecycle Operations

| Operation | Effect on board note (layout) | Effect on content note |
|-----------|-------------------------------|------------------------|
| Add post-it (new) | Append new `[[wikilink]]` to the section array | Create a new note in the configured folder |
| Add post-it (existing) | Append `[[wikilink]]` to the section array | None (note unchanged) |
| Reorder / move post-it | Reorder array / move link between section arrays | None |
| Edit post-it | None | User edits the note's Markdown |
| Remove post-it from board | Remove the `[[wikilink]]` from the array | None (note remains in vault) |
| Delete note | Plugin reports it as a missing reference where still linked | Note deleted — only via a separate, explicitly confirmed action |
| Rename / move note | Obsidian updates the wikilink in the layout automatically | Note path changes |

**Data-safety rule**: the only destructive action the plugin performs on a content note is an explicit, confirmed delete the user initiates. Board edits are confined to the board note's frontmatter.

## Indexing Strategy

The plugin keeps a lightweight in-memory index for fast re-render when notes change:

```typescript
interface BoardIndex {
  boards: Set<TFile>;                       // all notes with agile-type: board
  referencedBy: Map<string, Set<TFile>>;    // note path → boards that reference it
}
```

**Rebuild triggers**:
- Plugin load (scan for `agile-type: board` notes; parse their layouts).
- Vault `create` / `delete` / `rename` events.
- `MetadataCache` `changed` events on board notes (layout edited) and on referenced content notes (preview/title changed).

The "link existing note" picker queries all vault notes (optionally scoped to the configured agile folder); no per-type index is required because content notes are untyped.

## State Notes

- There are no enforced state machines on content notes; any status the user wants (e.g., a story's progress) is plain Markdown in the note body, owned by the user.
- There are no cross-board dependency constraints to enforce: boards reference notes, never other boards, so circular dependencies cannot arise. The VPC → Lean → Impact → Story → Roadmap order is a recommended authoring flow, surfaced as guidance, not a rule.
