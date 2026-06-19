# Quickstart: Agile Board Types

**Feature**: 001-agile-board-types  
**Date**: 2026-06-16 (revised for display-layer architecture)

## The one idea to remember

A board **displays** notes; it does not **store** them. Every post-it on a board
is an ordinary note in your vault. The board note only remembers *which notes go
where*. Move a post-it and you change the board's layout — never the note. The
same note can appear on as many boards as you like.

## Prerequisites

- Node.js 18+ installed
- Obsidian desktop application
- A development vault (separate from your main vault)

## Setup

1. **Install**
   ```bash
   cd /path/to/dev-vault/.obsidian/plugins/agile-boards
   npm install
   ```

2. **Start the watch build**
   ```bash
   npm run dev
   ```

3. **Enable the plugin in Obsidian**
   - Settings → Community plugins → enable "Agile Boards"
   - (Optional) Install "Hot-Reload" for auto-refresh on rebuild

## Creating your first board

### 1. Value Proposition Canvas

1. Command palette (Ctrl/Cmd + P) → "Agile Boards: Create Value Proposition Canvas"
2. Name the board (e.g., "Q3 Product Strategy") — this creates the **board note**
3. In the **Jobs** section, click **+ → New note**, type a title, and a note is created in your vault and shown as a post-it
4. Add more post-its to **Pains**, **Gains**, and the **Value Map** sections
5. Click a post-it to **open the underlying note** and write its content
6. Drag post-its to reorder — only the board layout changes

**Result**: one board note (layout) + one ordinary note per post-it.

### 2. Lean Canvas — reuse notes

1. "Agile Boards: Create Lean Canvas"
2. In **Customer Segments**, click **+ → Link existing note** and pick the customer notes you already used on the VPC — the *same* notes now appear here
3. Add new post-its to the other boxes (Problem, Solution, …)

**Result**: notes are shared across boards; nothing is copied.

### 3. Impact Mapping

1. "Agile Boards: Create Impact Map"
2. Set the **Goal** (link or create a note)
3. Add **Actors** by linking existing customer notes
4. Branch **Impacts** under each Actor, then **Deliverables** (Feature notes) under each Impact
5. Expand/collapse branches as needed

### 4. Story Map

1. "Agile Boards: Create Story Map"
2. Build the **backbone** by linking your Feature (deliverable) notes from the Impact Map
3. Add **user-story** post-its in the column under each backbone item
4. Draw horizontal **release slices** across the map (first slice = walking skeleton)

### 5. Roadmap

1. "Agile Boards: Create Roadmap"
2. Set the timeline range and unit (week/month/quarter)
3. Add **releases** with target dates
4. Assign story/feature notes to releases; they position chronologically

## Where things live in your vault

```
vault/
├── Agile/
│   ├── Boards/                     # board notes = layouts only
│   │   ├── Q3 Product Strategy.md  # (agile-type: board, board-type: value-proposition-canvas)
│   │   ├── Business Model.md
│   │   ├── Goals 2026.md
│   │   ├── Product Backlog.md
│   │   └── 2026 Roadmap.md
│   └── Cards/                      # content notes = post-its (configurable folder)
│       ├── Manage projects.md
│       ├── Tool switching.md
│       ├── Single source of truth.md
│       ├── Enterprise.md
│       └── ...
```

> The `Cards/` folder is just where *new* post-it notes are created (configurable).
> You can place a post-it that points to **any** note anywhere in the vault.

A board note's frontmatter is human-readable — you can inspect or hand-edit the
layout:

```yaml
---
agile-type: board
board-type: value-proposition-canvas
title: "Q3 Product Strategy"
segments:
  - customer: "[[Enterprise]]"
    jobs:  ["[[Manage projects]]", "[[Track velocity]]"]
    pains: ["[[Tool switching]]"]
    gains: ["[[Single source of truth]]"]
    products-services: ["[[Unified board view]]"]
    pain-relievers:    ["[[No tool switching]]"]
    gain-creators:     ["[[Native Obsidian integration]]"]
active-segment: 0
---
```

## Common tasks

### Add a post-it
- **+ → New note**: creates a note in the configured folder and links it into the section.
- **+ → Link existing note**: fuzzy-search any vault note and link it (no copy).

### Open / edit a post-it
- Click → open the note in the current pane. Cmd/Ctrl+Click → new pane. Edit the note as normal Markdown; the post-it preview updates.

### Reorder / move a post-it
- Drag within a section to reorder, or drag to another section. Only the board layout changes.

### Remove vs delete
- **Remove from board**: detaches the link from the layout. The note stays in your vault.
- **Delete note**: a separate, explicitly confirmed action that removes the note file.

### Handle a missing note
- A yellow "missing note" indicator appears where a link can't be resolved (note deleted/renamed away). Click to **re-link** an existing note or **create** a replacement.

## Keyboard shortcuts

| Action | Shortcut |
|--------|----------|
| Create new board | Ctrl/Cmd + Shift + B |
| Add post-it | Enter (with a section focused) |
| Open post-it's note | Enter (with a post-it focused) |
| Remove post-it from board | Backspace (with confirmation) |
| Navigate | Arrow keys |

## Troubleshooting

- **Board won't render**: the board note's layout frontmatter is invalid YAML — fix it in the note; the plugin shows a non-destructive error rather than discarding content.
- **A post-it shows "missing note"**: the linked note was deleted or renamed outside a tracked rename; re-link or quick-create.
- **A post-it preview is stale**: edit and save the note; the board re-renders on the metadata-change event.

## Development commands

```bash
npm run dev      # Watch build
npm run build    # Type-check + production bundle
```
