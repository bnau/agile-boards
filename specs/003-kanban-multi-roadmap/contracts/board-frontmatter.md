# Contract: Kanban Board Frontmatter (v2)

**Spec**: 003-kanban-multi-roadmap | **Amends**: specs/002-kanban-board/contracts/board-frontmatter.md

This contract supersedes the spec 002 Kanban frontmatter contract for the `roadmap` and new `independent-tickets` fields. All other fields remain unchanged.

---

## Full Kanban Board Frontmatter

```yaml
agile-type: board           # required, fixed value
board-type: kanban          # required, fixed value
title: string               # required, board display name
created: YYYY-MM-DD         # required, creation date
modified: YYYY-MM-DD        # required, last save date
roadmaps:                   # required (may be empty list)
  - "[[Roadmap Note Name]]" # zero or more wikilink strings
independent-tickets:        # required (may be empty list)
  - "[[Story Note Name]]"   # zero or more wikilink strings; User Stories only
columns:                    # required (six entries)
  - id: string              # stable id (e.g. "col-1")
    name: string            # column display name
    terminal: true          # optional; omit when false
    cards:                  # ordered list of wikilink story refs
      - "[[Story Ref]]"
```

---

## Changed Fields

### `roadmaps` (replaces `roadmap`)

| Attribute | Value |
|-----------|-------|
| Key | `roadmaps` |
| Type | YAML sequence of strings (wikilinks) |
| Default | `[]` (empty list) |
| Notes | Each entry is a wikilink to a Roadmap board note. Order is preserved; the UI displays them in this order. Duplicate entries are harmless (deduplication happens at render time). |

**Migration from spec 002**: If `roadmap:` (single string) is present and `roadmaps:` is absent, parse as `roadmaps: [roadmap]`. Rewrite as `roadmaps:` on next save.

### `independent-tickets` (new)

| Attribute | Value |
|-----------|-------|
| Key | `independent-tickets` |
| Type | YAML sequence of strings (wikilinks) |
| Default | `[]` (empty list) |
| Notes | Each entry is a wikilink to a User Story note (`agile-type: story`). The plugin does not enforce the type on read (a non-story note is rendered but excluded from the picker). A ticket that also appears in a linked roadmap is treated as roadmap-sourced at render time and cannot be removed from the board through the board UI. |

---

## Removed Fields

| Field | Was in spec 002 | Replacement |
|-------|----------------|-------------|
| `roadmap` | single wikilink string (optional) | `roadmaps` list |

---

## Invariants

1. `roadmaps` contains only wikilinks to notes with `board-type: roadmap`. Non-roadmap links are ignored at render.
2. `independent-tickets` contains wikilinks to any note; the board renders them as missing-note cards if unresolvable.
3. A wikilink may appear in both `independent-tickets` and the column `cards` — this is a normal stored layout state (the card is placed explicitly, its column is persisted in the layout, and its classification as independent vs roadmap-sourced is computed at render).
4. The `columns` array always has exactly 6 entries after a save; fewer entries on read fall back to `defaultKanbanColumns()`.
