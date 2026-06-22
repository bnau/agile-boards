# Implementation Plan: Kanban Multi-Roadmap & Independent Tickets

**Branch**: `003-kanban-multi-roadmap` | **Date**: 2026-06-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/003-kanban-multi-roadmap/spec.md`

## Summary

Amend the existing Kanban board (spec 002) to support (1) zero or more linked source Roadmaps (replacing the single optional roadmap), (2) independent User Story tickets that are explicitly linked to the board and can be removed by the user, and (3) per-card source badges that distinguish roadmap-sourced cards (read-only) from independent cards (removable). The existing fixed columns, DnD, estimate controls, column totals, and deadline colors are preserved and extended to work across multiple roadmaps.

Technical approach (from research):
- `KanbanBoard` type gains `roadmaps: Ref[]` (replacing `roadmap?: Ref`) and `independentTickets: Ref[]`.
- `BoardService` kanban branches migrate the legacy single `roadmap:` field and serialize the new fields.
- `ReleaseDateService.earliestReleaseDateFor()` loops over all roadmap refs; `useDeadlineColor` switches from `roadmapRef?` to `roadmapRefs[]`.
- `KanbanBoard.tsx` is refactored to aggregate stories from all roadmaps, compute a `sourceMap: Map<path, CardSourceInfo>`, and manage independent tickets.
- `KanbanCard` gains a source badge and an optional remove button (independent only).

## Technical Context

**Language/Version**: TypeScript (strict), ES2018 target
**Primary Dependencies**: React 18, react-dom, Obsidian API (no new runtime dependencies)
**Storage**: Board layout = board-note frontmatter; story data = story-note frontmatter (`estimate:`, `status:`, `agile-type:`)
**Testing**: Manual verification in a development vault (per constitution)
**Target Platform**: Obsidian desktop + mobile (offline-capable)
**Project Type**: Obsidian plugin (single project, `src/`)
**Performance Goals**: Board load < 2 s; card move / reorder / ticket add-remove < 100 ms
**Constraints**: Offline-capable, no external network, official Obsidian API only, lifecycle cleanup
**Scale/Scope**: Single vault, up to ~10 linked roadmaps, up to ~100 independent tickets; all existing board types unaffected

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | Spec (FR-001…FR-013) written and validated before this plan |
| II. Simplicity & YAGNI | ✅ Pass | No new runtime dependencies; additive changes to existing services/components; no new views |
| III. Obsidian Platform Compliance | ✅ Pass | `processFrontMatter` for note writes; MetadataCache reads; all resources inherit existing lifecycle |
| IV. User Vault Data Safety | ✅ Pass | Removing an independent ticket removes only a board-note reference; no content-note is ever deleted; roadmap stories cannot be deleted from the board |

### Post-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | All artifacts trace to FR-001…FR-013 and SC-001…SC-008 |
| II. Simplicity & YAGNI | ✅ Pass | `CardSourceInfo` type and `earliestReleaseDateFor()` are the only new abstractions; both solve concrete stated problems (source badge + multi-roadmap deadline). No new service classes. |
| III. Obsidian Platform Compliance | ✅ Pass | No new event subscriptions; `getAgileType` uses MetadataCache (same as `getEstimate`/`getStatus`); no private APIs |
| IV. User Vault Data Safety | ✅ Pass | Independent ticket removal touches only `independent-tickets:` in the board frontmatter via `onBoardUpdate`; note is untouched |

No complexity-tracking entries required (no violations).

## Project Structure

### Documentation (this feature)

```text
specs/003-kanban-multi-roadmap/
├── spec.md                        # Feature specification (done)
├── plan.md                        # This file
├── research.md                    # Phase 0: 10 decisions
├── data-model.md                  # Phase 1: schema, CardSourceInfo, new method signatures
├── quickstart.md                  # Phase 1: user + developer guide
├── contracts/
│   ├── board-frontmatter.md       # Kanban frontmatter contract (v2, amends spec 002)
│   └── services.md                # Changed/new service + hook signatures
├── checklists/
│   └── requirements.md            # Spec quality checklist (done)
└── tasks.md                       # Phase 2 output (via /speckit-tasks — NOT created here)
```

### Source Code (repository root)

New code is marked **(new)**; everything else is an edit to an existing file.

```text
src/
├── types/
│   └── Board.ts                   # KanbanBoard: roadmaps+independentTickets; + CardSourceInfo type
├── services/
│   ├── BoardService.ts            # kanban branches: parse/serialize roadmaps+independentTickets, migration, extractRefs
│   ├── NoteService.ts             # + getAgileType(file): string | null
│   └── ReleaseDateService.ts      # + earliestReleaseDateFor(storyRef, roadmapRefs[], sourcePath)
├── hooks/
│   └── useDeadlineColor.ts        # roadmapRef? → roadmapRefs[] (signature change)
├── components/
│   ├── boards/
│   │   └── KanbanBoard.tsx        # major refactor: multi-roadmap aggregation, sourceMap, independent ticket mgmt
│   └── kanban/
│       ├── KanbanCard.tsx         # source badge, optional remove button, roadmapRefs[]
│       └── KanbanColumn.tsx       # + sourceMap prop + onRemoveCard prop
└── styles.css                     # + source badge + remove button styles
```

**Structure Decision**: All changes stay within the existing single-project layout. No new service classes or view files. The only new abstraction is `CardSourceInfo` (a discriminated union placed in `src/types/Board.ts`). The `kanban/` and `boards/` component subfolder split from spec 002 is preserved.

## Key Design Decisions

(Full rationale in [research.md](research.md).)

1. **`roadmap?: Ref` → `roadmaps: Ref[]`.** Silent migration from the legacy single-string field on read; rewritten as list on next save. (D2)
2. **`independent-tickets: Ref[]` stored in board frontmatter.** Only wikilinks; resolution happens at render. (D1)
3. **`CardSourceInfo` discriminated union, computed in `KanbanBoard.tsx`.** Passed through columns to cards. Roadmap-sourced takes precedence when a story is in both a roadmap and `independentTickets`. (D3, D7)
4. **`earliestReleaseDateFor(storyRef, roadmapRefs[], sourcePath)` on `ReleaseDateService`.** Loops; returns min date. Independent tickets pass `[]` → blue. (D4, D5)
5. **"Add ticket" picker filters to `agile-type: story` notes.** Gated by `NoteService.getAgileType()`. Already-on-board notes excluded. (D6)
6. **Roadmap management UI: list + per-item remove + add-select.** Replaces the single `<select>`. (D8)
7. **DnD unchanged.** Both card types drag/drop identically; `status:` written on drop. (D9)
8. **Missing independent ticket → show MissingNote + remove button.** (D10)

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale | Simpler Alternative Considered |
|----------|-----------|-------------------------------|
| `CardSourceInfo` type | Allows `KanbanCard` to stay declarative; centralises source computation in `KanbanBoard` | Inline per-card flag in `KanbanColumn.cards` rejected: would require changing the stored schema |
| `earliestReleaseDateFor` new method | Isolates multi-roadmap date logic in the service; hook stays declarative | Inlining loop in `useDeadlineColor` rejected: business logic in a React hook |

## Implementation Phases

### Phase A: Types & Persistence (blocking)

- `src/types/Board.ts`: Amend `KanbanBoard` (`roadmaps: Ref[]`, `independentTickets: Ref[]`); add `CardSourceInfo` type.
- `src/services/BoardService.ts`: kanban `frontmatterToBoard` (parse `roadmaps`, migrate `roadmap:`, parse `independent-tickets`); `layoutToFrontmatter` (emit `roadmaps`, `independent-tickets`); `defaultLayout` (`roadmaps: []`, `independent-tickets: []`); `extractRefs` (spread `roadmaps`, spread `independentTickets`).

**Checkpoint**: A `board-type: kanban` note with `roadmaps:` and `independent-tickets:` round-trips through `BoardService` — verifiable without UI. A legacy `roadmap:` single-string note is parsed correctly.

### Phase B: Service Plumbing (can run in parallel after Phase A)

- `src/services/NoteService.ts`: add `getAgileType(file): string | null`.
- `src/services/ReleaseDateService.ts`: add `earliestReleaseDateFor(storyRef, roadmapRefs[], sourcePath)`.
- `src/hooks/useDeadlineColor.ts`: change `roadmapRef?` → `roadmapRefs[]`; call `earliestReleaseDateFor`.

**Checkpoint**: `useDeadlineColor` called with `roadmapRefs: []` returns `'blue'`; called with a valid ref list returns the correct color.

### Phase C: Multi-Roadmap Board UI (US1)

- `src/components/boards/KanbanBoard.tsx`:
  - Load all linked roadmap boards in parallel (one `parseBoardAsync` per roadmap).
  - Aggregate and deduplicate stories across all roadmaps; build `roadmapStoryPaths` set.
  - Build `sourceMap: Map<string, CardSourceInfo>`.
  - Replace the single-roadmap `<select>` with the linked-roadmap list + add-roadmap select.
  - Pass `sourceMap`, `roadmapRefs` arrays to `KanbanColumn`.
- `src/components/kanban/KanbanColumn.tsx`: accept `sourceMap` and `onRemoveCard`; pass `source` and `onRemove?` to `KanbanCard`.
- `src/components/kanban/KanbanCard.tsx`: accept `source: CardSourceInfo`; change `roadmapRef?` → read `roadmapRefs` from `source`; add source badge rendering.

**Checkpoint**: Board with two linked roadmaps shows all stories, deduplicated, with correct roadmap badges. Removing one roadmap removes its exclusive stories.

### Phase D: Independent Tickets & Remove Button (US2 + US3)

- `src/components/boards/KanbanBoard.tsx`:
  - Reconcile `independentTickets`: exclude any refs already roadmap-sourced.
  - Add "Add ticket" button → `openNotePicker` with items = story-type notes not on board.
  - Add `removeIndependentTicket(ref)` → update `board.independentTickets` via `onBoardUpdate`.
  - Include independent ticket files in `displayColumns` reconciliation.
- `src/components/kanban/KanbanCard.tsx`: render remove button when `onRemove` is provided; render "Independent" badge when `source.kind === 'independent'`.
- `src/styles.css`: source badge styles (`.agile-kanban-card__source`, `--roadmap`, `--independent`); remove button style (`.agile-kanban-card__remove`); roadmap list styles (`.agile-kanban-source__list`, `__item`, `__remove`).

**Checkpoint**: Independent tickets appear with badge and remove button; removing them leaves the note intact; roadmap cards have no remove button.

### Phase E: Polish & Integration

- Edge cases: per-roadmap "not found" warnings (one warning per unresolvable roadmap link, not a single global one); empty-state prompt covers three cases: no roadmaps + no independent tickets, roadmaps only, independent only.
- Verify `relevantPaths` tracking covers all linked roadmaps and independent ticket notes (so edits to any source file trigger a re-render).
- `npm run build` (tsc + bundle); manual verification against the full quickstart checklist.

## Artifacts Generated

| Artifact | Purpose |
|----------|---------|
| [research.md](research.md) | 10 decisions: frontmatter naming, migration, source tracking, multi-roadmap date, hook signature, picker filter, source precedence, roadmap UI, DnD, missing-note |
| [data-model.md](data-model.md) | Amended `KanbanBoard` schema, `CardSourceInfo`, new method signatures, derived values |
| [contracts/board-frontmatter.md](contracts/board-frontmatter.md) | Kanban frontmatter contract v2 (amends spec 002) |
| [contracts/services.md](contracts/services.md) | Changed/new service + hook + component prop signatures |
| [quickstart.md](quickstart.md) | User guide (roadmaps, tickets, badges, colors) + developer verification checklist |

## Next Steps

Run `/speckit-tasks` to generate the dependency-ordered task list against this plan.
