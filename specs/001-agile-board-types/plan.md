# Implementation Plan: Agile Board Types

**Branch**: `001-agile-board-types` | **Date**: 2026-06-16 (revised for display-layer architecture) | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-agile-board-types/spec.md`

## Summary

Implement five agile board types as **presentation layers over vault notes**. Each post-it is an ordinary note (one note per post-it); a board is a note whose frontmatter stores only the layout (ordered `[[wikilink]]` references per section/slot, plus board-type-specific arrangement data). Boards never own content — they arrange and display it, and the same note may appear on many boards. Each board type has a dedicated React view mounted via Obsidian's ItemView API.

## Technical Context

**Language/Version**: TypeScript (strict), ES2018 target  
**Primary Dependencies**: React 18, react-dom, obsidian API  
**Storage**: Content = ordinary vault notes; board layout = board note frontmatter (`[[wikilinks]]`)  
**Testing**: Manual verification in development vault (per constitution)  
**Target Platform**: Obsidian desktop + mobile (offline-capable)  
**Project Type**: Obsidian plugin (desktop-app)  
**Performance Goals**: Board load < 2 seconds, post-it operations < 100ms  
**Constraints**: Offline-capable, no external network dependencies  
**Scale/Scope**: Single vault, typical vault size (1k–10k notes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | Spec revised first; plan follows the display-layer model |
| II. Simplicity & YAGNI | ✅ Pass | No per-card-type schemas; content notes are plain Markdown |
| III. Obsidian Platform Compliance | ✅ Pass | ItemView, MetadataCache, wikilink resolution, rename events, lifecycle cleanup |
| IV. User Vault Data Safety | ✅ Pass | Boards store only references; the sole destructive op is an explicit confirmed note delete |

### Post-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | All artifacts trace to the revised requirements (FR-001…FR-018) |
| II. Simplicity & YAGNI | ✅ Pass | Two entities only (Content Note, Board Note); roles are section placement |
| III. Obsidian Platform Compliance | ✅ Pass | registerView, cleanup in onunload, native wikilinks and rename handling |
| IV. User Vault Data Safety | ✅ Pass | Layout edits confined to board frontmatter; notes never implicitly deleted |

## Project Structure

### Documentation (this feature)

```text
specs/001-agile-board-types/
├── spec.md              # Feature specification (display-layer)
├── plan.md              # This file
├── research.md          # Phase 0: technology + architecture decisions
├── data-model.md        # Phase 1: Content Note + Board Note layout schemas
├── quickstart.md        # Phase 1: developer/user guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── main.ts                       # Plugin lifecycle, view + command registration, index init
├── constants.ts                  # View type IDs, board-type enum, section keys, default folder
├── types/
│   └── Board.ts                  # Board-type union + per-type layout interfaces (frontmatter shapes)
├── views/
│   ├── ValuePropositionView.tsx  # VPC ItemView
│   ├── LeanCanvasView.tsx        # Lean Canvas ItemView
│   ├── ImpactMapView.tsx         # Impact Map ItemView
│   ├── StoryMapView.tsx          # Story Map ItemView
│   └── RoadmapView.tsx           # Roadmap ItemView
├── components/
│   ├── common/
│   │   ├── PostIt.tsx            # Renders a note reference (title + body preview); open/edit/remove
│   │   ├── Section.tsx           # An ordered, drag-reorderable list of PostIts for one slot
│   │   ├── AddPostIt.tsx         # "+" affordance → create new note OR pick existing
│   │   ├── NotePicker.tsx        # Fuzzy-search existing vault notes to link
│   │   └── MissingNote.tsx       # Unresolved-reference indicator (re-link / quick-create)
│   └── boards/
│       ├── VPCBoard.tsx          # Two-panel segments layout
│       ├── LeanBoard.tsx         # 9-box grid layout
│       ├── ImpactBoard.tsx       # Multiple Goal → Actor → Impact → Deliverable trees
│       ├── StoryBoard.tsx        # MMFs + impact-derived actor/feature/impact table of user stories
│       └── RoadmapBoard.tsx      # Timeline of releases
├── services/
│   ├── NoteService.ts            # Create content notes; read title + body preview; (explicit) delete
│   ├── BoardService.ts           # Read/write board-note frontmatter layout (add/move/reorder/remove refs)
│   ├── ReferenceService.ts       # Resolve wikilinks → TFile; report missing; follow renames
│   └── IndexService.ts           # boards set + referencedBy map; rebuild on vault/metadata events
└── hooks/
    ├── useBoard.ts               # Load + mutate a board's layout, re-render on change
    └── useNotePreview.ts         # Resolve a reference to {title, preview, file|missing}
```

**Structure Decision**: Single project layout. `NoteService` owns content-note I/O; `BoardService` owns layout frontmatter; `ReferenceService` resolves/validates wikilinks. React components are split into reusable post-it/section primitives and per-framework board layouts. Note that there is **no per-card-type service or schema** — content notes are untyped Markdown, so the old `CardService`/`CardEditor`/type-per-card-schema layer is replaced by `NoteService` + `PostIt`.

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale | Simpler Alternative Considered |
|----------|-----------|-------------------------------|
| 5 ItemView classes | One per framework arrangement required by spec | Single generic view rejected: each framework has a distinct layout |
| Layout in board frontmatter | User-selected; single source of truth for arrangement, keeps notes pure | Per-note board pointers rejected: couples notes to boards, hurts reuse |
| Service layer (Note/Board/Reference) | Separates note I/O, layout I/O, and link resolution from React | Direct API calls in components rejected: duplicated logic, harder to keep data-safe |
| In-memory index | Fast "which boards reference this note?" for re-render | Re-scan vault per render rejected: too slow at 10k notes |

## Implementation Phases

### Phase 1: Core Infrastructure
- Board-type definitions and per-type layout interfaces (`types/Board.ts`)
- `NoteService` (create note, read title + body preview)
- `BoardService` (read/write layout frontmatter: add/move/reorder/remove references)
- `ReferenceService` (resolve wikilinks, detect missing, follow renames)
- `IndexService` (boards + referencedBy, event-driven rebuild)
- Common components: `PostIt`, `Section`, `AddPostIt`, `NotePicker`, `MissingNote`

### Phase 2: Value Proposition Canvas
- `VPCBoard` two-panel, multi-segment layout
- Six sections per segment wired to `Section` + `AddPostIt`
- `ValuePropositionView` + command registration

### Phase 3: Lean Canvas
- `LeanBoard` 9-box grid
- Reuse existing notes in Customer Segments via `NotePicker`
- `LeanCanvasView` + command registration

### Phase 4: Impact Mapping
- `ImpactBoard` one or more Goal → Actor → Impact → Deliverable trees with expand/collapse; add/remove goals
- Actor slots reuse existing customer/segment notes
- `ImpactMapView` + command registration

### Phase 5: Story Map
- `StoryBoard` links a source Impact Map; MMFs group imported features (each feature in at most one MMF)
- Derived table (actor columns × feature sub-columns over impact rows) built from the Impact Map; cells hold user-story notes; no releases
- `StoryMapView` + command registration

### Phase 6: Roadmap
- `RoadmapBoard` timeline with releases and target dates
- Release items reuse story/feature notes; chronological ordering
- `RoadmapView` + command registration

### Phase 7: Polish & Integration
- Missing-note indicators + quick-create across all boards
- Rename/move follow-through; re-render boards when referenced notes change
- Keyboard navigation; explicit (confirmed) note-delete flow
- Performance: memoized reference resolution and previews

## Artifacts Generated

| Artifact | Purpose |
|----------|---------|
| [research.md](research.md) | Architecture + technology decisions (display-layer) |
| [data-model.md](data-model.md) | Content Note + Board Note layout schemas |
| [quickstart.md](quickstart.md) | Developer/user setup and usage guide |

## Next Steps

Run `/speckit-tasks` to regenerate the implementation task list against this revised plan.
