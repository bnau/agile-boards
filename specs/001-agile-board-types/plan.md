# Implementation Plan: Agile Board Types

**Branch**: `001-agile-board-types` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `specs/001-agile-board-types/spec.md`

## Summary

Implement five interconnected agile board types (Value Proposition Canvas, Lean Canvas, Impact Mapping, Story Map, Roadmap) with shared card entities stored as Obsidian notes. Cards use YAML frontmatter for typed metadata and wikilinks for cross-board references. Each board type has a dedicated React view mounted via Obsidian's ItemView API.

## Technical Context

**Language/Version**: TypeScript (strict), ES2018 target  
**Primary Dependencies**: React 18, react-dom, obsidian API  
**Storage**: Obsidian vault notes with YAML frontmatter  
**Testing**: Manual verification in development vault (per constitution)  
**Target Platform**: Obsidian desktop + mobile (offline-capable)  
**Project Type**: Obsidian plugin (desktop-app)  
**Performance Goals**: Board load < 2 seconds, card operations < 100ms  
**Constraints**: Offline-capable, no external network dependencies  
**Scale/Scope**: Single vault, typical vault size (1k-10k notes)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Pre-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | Spec created via `/speckit-specify`, plan follows |
| II. Simplicity & YAGNI | ✅ Pass | Using existing React setup, no new dependencies |
| III. Obsidian Platform Compliance | ✅ Pass | ItemView API, MetadataCache, proper lifecycle cleanup |
| IV. User Vault Data Safety | ✅ Pass | Cards as readable Markdown, soft validation, no silent data loss |

### Post-Design Check ✅

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Spec-Driven Development | ✅ Pass | All artifacts traced to spec requirements |
| II. Simplicity & YAGNI | ✅ Pass | No unnecessary abstractions; see Complexity Tracking |
| III. Obsidian Platform Compliance | ✅ Pass | All views use registerView, cleanup in onunload |
| IV. User Vault Data Safety | ✅ Pass | YAML frontmatter readable, wikilinks standard |

## Project Structure

### Documentation (this feature)

```text
specs/001-agile-board-types/
├── spec.md              # Feature specification
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions
├── data-model.md        # Phase 1: Entity schemas
├── quickstart.md        # Phase 1: Developer guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (via /speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── main.ts                      # Plugin lifecycle, view registration
├── constants.ts                 # View type IDs, card type enums
├── types/
│   ├── Card.ts                  # Card type definitions & schemas
│   └── Board.ts                 # Board type definitions
├── views/
│   ├── ValuePropositionView.tsx # VPC ItemView
│   ├── LeanCanvasView.tsx       # Lean Canvas ItemView
│   ├── ImpactMapView.tsx        # Impact Map ItemView
│   ├── StoryMapView.tsx         # Story Map ItemView
│   └── RoadmapView.tsx          # Roadmap ItemView
├── components/
│   ├── common/
│   │   ├── Card.tsx             # Generic card display component
│   │   ├── CardEditor.tsx       # Create/edit card modal
│   │   ├── ReferenceSelector.tsx# Pick cards to reference
│   │   └── MissingReference.tsx # Broken link indicator
│   └── boards/
│       ├── VPCBoard.tsx         # Value Proposition Canvas layout
│       ├── LeanBoard.tsx        # Lean Canvas 9-box grid
│       ├── ImpactBoard.tsx      # Impact Map tree layout
│       ├── StoryBoard.tsx       # Story Map grid
│       └── RoadmapBoard.tsx     # Timeline layout
├── services/
│   ├── CardService.ts           # Card CRUD operations
│   ├── BoardService.ts          # Board state management
│   ├── IndexService.ts          # Card index maintenance
│   └── ReferenceService.ts      # Link resolution & validation
└── hooks/
    ├── useCards.ts              # Card data hooks
    ├── useBoard.ts              # Board state hooks
    └── useReferences.ts         # Reference resolution hooks
```

**Structure Decision**: Single project layout. Views directory separates Obsidian ItemView wrappers from pure React board components. Services handle vault I/O; hooks provide React integration.

## Complexity Tracking

> No constitution violations requiring justification.

| Decision | Rationale | Simpler Alternative Considered |
|----------|-----------|-------------------------------|
| 5 ItemView classes | One per board type required by spec | Single generic view rejected: different layouts per type |
| Service layer | Separates vault I/O from React | Direct API calls in components rejected: harder to test, duplicated logic |
| In-memory index | Fast card lookups by type/reference | Re-scan vault each time rejected: too slow for large vaults |

## Implementation Phases

### Phase 1: Core Infrastructure
- Card type definitions and schemas
- CardService for CRUD operations
- IndexService for card discovery
- Base Card component

### Phase 2: Value Proposition Canvas
- VPC board layout component
- Customer and Value card types
- VPC ItemView registration
- Create/edit customer segments

### Phase 3: Lean Canvas
- Lean Canvas 9-box layout
- Reference existing Customer/Value cards
- Problem, Solution card types
- Remaining Lean Canvas sections

### Phase 4: Impact Mapping
- Tree layout component
- Goal, Impact, Feature card types
- Actor selection (references Customers)
- Hierarchical navigation

### Phase 5: Story Map
- Grid layout with backbone
- User Story, MMF card types
- Feature backbone integration
- Release slicing

### Phase 6: Roadmap
- Timeline layout component
- Release card type with dates
- MMF/Story assignment
- Date visualization

### Phase 7: Polish & Integration
- Cross-board navigation
- Missing reference handling
- Keyboard shortcuts
- Performance optimization

## Artifacts Generated

| Artifact | Purpose |
|----------|---------|
| [research.md](research.md) | Technology decisions and architecture |
| [data-model.md](data-model.md) | Card and board entity schemas |
| [quickstart.md](quickstart.md) | Developer setup and usage guide |

## Next Steps

Run `/speckit-tasks` to generate the implementation task list.
