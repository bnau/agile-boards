# Contract: Kanban Board-Note Frontmatter

The board note is the single source of truth for a Kanban's layout. This contract defines the frontmatter the plugin reads and writes. It extends the shared board contract (`agile-type`, `board-type`, `title`, `created`, `modified`).

## Schema

```yaml
agile-type: board            # required, literal "board"
board-type: kanban           # required, literal "kanban"
title: <string>             # board display title
created: <YYYY-MM-DD>
modified: <YYYY-MM-DD>       # rewritten on every layout change

roadmap: <wikilink|"">       # source Roadmap (stories shown + release dates); "" = unlinked

columns:                     # the fixed columns; `cards` give within-column ORDER only
  - id: <string>            # stable unique id
    name: <string>          # column name (from the fixed set)
    terminal: <bool>        # optional; default false. true => deadline color hidden
    cards:                  # ordered story references (ordering hint; membership is the
      - <wikilink>          #   story note's own `status:` field, not this list)
```

## Read rules (frontmatter → KanbanBoard)

| Input | Result |
|-------|--------|
| `columns` absent / empty / not a list | fall back to the fixed `defaultKanbanColumns()` |
| column entry missing `id` | generate a stable id on read |
| `terminal` absent | `false` |
| `cards` absent / not a list | `[]` |
| `cards` is a single string | one-element list |
| `roadmap` absent or `""` | `undefined` |
| same story ref present in two columns | kept only in the first column (uniqueness repair) |

## Write rules (KanbanBoard → frontmatter)

- Only keys present in the `Partial<KanbanBoard>` update are written; others are preserved (merge semantics of `updateBoard`).
- `modified` is set to today on every write.
- `columns` serialize in array order; each column writes `id`, `name`, `cards`, and `terminal` only when true (omit when false to keep frontmatter clean).
- Empty `roadmap` serializes as `""`.
- The Kanban write path never touches content notes and never writes to the source Roadmap.

## Default layout (on create)

`defaultLayout('kanban')` produces:

```yaml
roadmap: ""
columns:
  - { id: col-1, name: Backlog, cards: [] }
  - { id: col-2, name: To do, cards: [] }
  - { id: col-3, name: Doing, cards: [] }
  - { id: col-4, name: Testing, cards: [] }
  - { id: col-5, name: Done, terminal: true, cards: [] }
  - { id: col-6, name: Impact achieved, terminal: true, cards: [] }
```

## Invariants enforced by the contract

1. A card's column membership is the story note's `status:` field, not this layout; `cards` lists give only the within-column ordering.
2. The column set, names, and order are fixed; `id`s are unique and stable.
3. The displayed cards equal the linked Roadmap's stories; moving a card writes the note's `status:` (and updates ordering here) and never deletes a note.
4. The estimate and column are NOT the source-of-truth here — they live on the story note (`estimate:`, `status:`).
