# Contract: New & Changed Service / Hook Signatures

Only additions and changes for the Kanban feature are listed. Existing signatures are unchanged unless noted.

## NoteService (changed) — estimate I/O

The estimate is the one content-note field the Kanban manages. Reads come from the metadata cache; writes go through `processFrontMatter` so only the `estimate` key changes.

```ts
/** Read a story's Fibonacci estimate, or null when absent/invalid. */
getEstimate(file: TFile): Estimate | null;

/**
 * Set (or clear, when value is null) a story's estimate.
 * Writes ONLY the `estimate` frontmatter key via app.fileManager.processFrontMatter;
 * the note body is never rewritten. (User Vault Data Safety.)
 */
async setEstimate(file: TFile, value: Estimate | null): Promise<void>;
```

- `getEstimate` returns a value only if it is one of `1,2,3,5,8,13,21`; any other / missing value ⇒ `null` (rendered as no estimate, counted 0 in totals).
- `setEstimate(file, null)` removes the key (delete in the `processFrontMatter` callback).

## NoteService (changed) — status (column) I/O

A card's column is stored on the note (source of truth), written/read the same way as the estimate.

```ts
/** Read a story's Kanban column from frontmatter `status:`, or null when absent. */
getStatus(file: TFile): string | null;

/**
 * Set (column name) or clear (null) a story's Kanban column. Writes ONLY the
 * `status` frontmatter key via processFrontMatter; the note body is never rewritten.
 */
async setStatus(file: TFile, value: string | null): Promise<void>;
```

- `getStatus` returns the trimmed string when present and non-empty, else `null`.
- The board matches `status` to a column by name (case-insensitive); an unknown/absent value places the card in the first column (Backlog).

## ReleaseDateService (new)

Resolves a story's deadline from a source Roadmap board. Pure read; no writes.

```ts
class ReleaseDateService {
  constructor(app: App, boardService: BoardService, referenceService: ReferenceService);

  /**
   * The earliest target date among releases (of the given Roadmap board ref)
   * whose items contain the story note. Returns null when:
   *  - roadmapRef is empty/unresolved, or not a roadmap board, or
   *  - no release contains the story, or
   *  - matching releases have no targetDate.
   * `sourcePath` is the Kanban board path (for wikilink resolution).
   */
  releaseDateFor(storyRef: Ref, roadmapRef: Ref | undefined, sourcePath: string): string | null;
}
```

Resolution detail: a story matches a release when `referenceService.resolve(storyRef, kanbanPath)` and `referenceService.resolve(item, roadmapPath)` resolve to the same `TFile.path`. Dates compared as ISO `YYYY-MM-DD`; earliest wins.

## Deadline color (pure function + hook)

```ts
// pure, in a small util (e.g. src/utils/deadline.ts) or constants module
function deadlineColor(targetDate: string | null, opts: { terminal: boolean; today?: Date }): DeadlineColor;
//  terminal === true            -> 'none'
//  targetDate === null          -> 'blue'
//  daysRemaining  > 30          -> 'green'
//  14 < daysRemaining <= 30     -> 'yellow'
//   7 < daysRemaining <= 14     -> 'orange'
//      daysRemaining <= 7       -> 'red'   (includes 0 and overdue)
```

```ts
// hook: recomputes when the source Roadmap / note / column changes
function useDeadlineColor(args: {
  storyRef: Ref;
  roadmapRef: Ref | undefined;
  sourcePath: string;     // kanban board path
  terminal: boolean;      // card's column terminal flag
}): DeadlineColor;
```

`daysRemaining` is computed on date-only boundaries (local midnight to local midnight).

## BoardService (changed) — kanban branches

No new public methods; add `'kanban'` cases to the existing private methods and to `extractRefs`:

```ts
// frontmatterToBoard: case 'kanban' -> KanbanBoard (columns fall back to defaults when empty)
// layoutToFrontmatter: case 'kanban' -> { roadmap, columns }
// defaultLayout:       case 'kanban' -> { roadmap: '', columns: defaultKanbanColumns() }
// extractRefs:         case 'kanban' -> [roadmap?, ...columns.flatMap(c => c.cards)]
```

## KanbanBoard component contract

Columns are fixed (no add/rename/delete/reorder). Stories are not imported — the board displays the linked Roadmap's stories automatically. The component derives the displayed columns each render and mutates layout only via `onBoardUpdate(updates: Partial<KanbanBoard>)`.

```ts
// Derivation (per render, not stored):
//   roadmapStories = distinct notes across roadmapBoard.releases[].items (release order)
//   columnOf(story) = column whose name matches noteService.getStatus(story) (case-insensitive),
//                     else the FIRST column (Backlog)
//   order within a column = the story's position in that column's stored `cards` list,
//                           newcomers appended in roadmap order
//
// Mutations:
moveCard(srcColId, idx, dstColId, to|null):
//   - persist within-column order in the board layout: onBoardUpdate({ columns })
//   - when the column changed, reflect it on the note: noteService.setStatus(file, dstColumn.name)
selectRoadmap(path): onBoardUpdate({ roadmap: toWikilink(file) | '' })
```

The component re-renders on `metadataCache 'changed'` for the board, the Roadmap, or any displayed story (so a `status:` edit on a note moves the card). There is no `importCard`, `removeCard`, or any column mutation. All logic is local to the component (no new service), matching `StoryBoard`'s mutation style.
