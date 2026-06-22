# Contract: Service & Hook Signatures (003)

**Spec**: 003-kanban-multi-roadmap | **Amends**: specs/002-kanban-board/contracts/services.md

Only changed or new signatures are listed. All other signatures from spec 002 are unchanged.

---

## `NoteService` (src/services/NoteService.ts)

### New method

```typescript
/**
 * Read a note's `agile-type` frontmatter field from the MetadataCache.
 * Returns the raw string value (e.g. "story", "board") or null when absent.
 */
getAgileType(file: TFile): string | null
```

---

## `ReleaseDateService` (src/services/ReleaseDateService.ts)

### New method

```typescript
/**
 * Earliest `targetDate` across all roadmaps in `roadmapRefs` that contain
 * the story. Delegates to `releaseDateFor` per roadmap and returns the
 * lexicographically smallest non-null result (ISO YYYY-MM-DD).
 * Returns null when roadmapRefs is empty or no roadmap yields a date.
 */
earliestReleaseDateFor(
    storyRef: Ref,
    roadmapRefs: Ref[],
    sourcePath: string,
): string | null
```

### Unchanged method

`releaseDateFor(storyRef, roadmapRef, sourcePath)` remains unchanged.

---

## `useDeadlineColor` hook (src/hooks/useDeadlineColor.ts)

### Changed signature

```typescript
// Before (spec 002):
useDeadlineColor(args: {
    storyRef: Ref;
    roadmapRef: Ref | undefined;
    sourcePath: string;
    terminal: boolean;
}): DeadlineColor

// After (spec 003):
useDeadlineColor(args: {
    storyRef: Ref;
    roadmapRefs: Ref[];       // was: roadmapRef: Ref | undefined
    sourcePath: string;
    terminal: boolean;
}): DeadlineColor
```

Independent cards pass `roadmapRefs: []` → the hook returns blue.

---

## `BoardService` (src/services/BoardService.ts)

No new public methods. The `kanban` branch of `frontmatterToBoard`, `layoutToFrontmatter`, `defaultLayout`, and `extractRefs` are updated internally. The public interface is unchanged.

**`extractRefs` for kanban** (new behavior):
```typescript
case 'kanban':
    return [
        ...board.roadmaps,            // was: board.roadmap ? [board.roadmap] : []
        ...board.independentTickets,  // new
        ...board.columns.flatMap(c => c.cards),
    ];
```

---

## `KanbanCard` props (src/components/kanban/KanbanCard.tsx)

```typescript
// Before (spec 002):
interface KanbanCardProps {
    refStr: string;
    sourcePath: string;
    roadmapRef?: Ref;
    terminal: boolean;
}

// After (spec 003):
interface KanbanCardProps {
    refStr: string;
    sourcePath: string;
    source: CardSourceInfo;          // new: { kind: 'roadmap'; roadmapRefs: Ref[] } | { kind: 'independent' }
    terminal: boolean;
    onRemove?: () => void;           // new: only provided for independent cards
}
```

---

## `KanbanColumn` props (src/components/kanban/KanbanColumn.tsx)

```typescript
// Added props (spec 003):
sourceMap: Map<string, CardSourceInfo>;  // file path → source info
onRemoveCard: (columnId: string, ref: Ref) => void;  // only called for independent cards
```

All existing props are unchanged.

---

## `CardSourceInfo` (src/components/boards/KanbanBoard.tsx or src/types/Board.ts)

```typescript
export type CardSourceInfo =
    | { kind: 'roadmap'; roadmapRefs: Ref[] }
    | { kind: 'independent' };
```

Kept in `src/types/Board.ts` alongside `KanbanBoard` for reuse across components.
