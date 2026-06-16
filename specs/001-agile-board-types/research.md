# Research: Agile Board Types

**Feature**: 001-agile-board-types  
**Date**: 2026-06-16

## Card Storage Strategy

**Decision**: Store each card as an individual Markdown note with YAML frontmatter

**Rationale**: 
- Aligns with Principle IV (User Vault Data Safety) — human-readable, editable by user
- Native Obsidian linking via `[[wikilinks]]` for card references
- User can view/edit cards outside the plugin UI
- Standard Obsidian file operations (move, rename, delete) work naturally

**Alternatives Considered**:
- JSON file per board: Rejected — not human-readable, violates vault transparency
- Single JSON config file: Rejected — doesn't scale, hard to link between boards
- DataView-style inline fields only: Rejected — limits structure, harder to parse consistently

## Card Reference Mechanism

**Decision**: Use Obsidian `[[wikilinks]]` stored in frontmatter arrays for card references

**Rationale**:
- Native Obsidian feature — works with graph view, backlinks, renaming
- Users can manually edit references if needed
- Plugin just reads/writes standard frontmatter arrays

**Implementation**:
```yaml
---
type: lean-canvas
references:
  customers:
    - "[[Customer - Enterprise]]"
    - "[[Customer - SMB]]"
  value-propositions:
    - "[[Value - Time Savings]]"
---
```

## Board Layout Structures

### Value Proposition Canvas
**Decision**: Two-panel layout (Customer Profile | Value Map) with expandable customer segments

**Structure**:
- Left panel: Customer Profile (Jobs, Pains, Gains)
- Right panel: Value Map (Products/Services, Pain Relievers, Gain Creators)
- Tab or accordion for multiple customer segments

### Lean Canvas
**Decision**: Standard 9-box grid layout

**Structure**:
```
┌──────────────┬─────────────┬──────────────┬─────────────┐
│   Problem    │   Solution  │    UVP       │  Unfair     │
│              │             │              │  Advantage  │
├──────────────┼─────────────┼──────────────┼─────────────┤
│   Key        │             │   Channels   │  Customer   │
│   Metrics    │             │              │  Segments   │
├──────────────┴─────────────┴──────────────┴─────────────┤
│        Cost Structure       │       Revenue Streams      │
└─────────────────────────────┴────────────────────────────┘
```

### Impact Mapping
**Decision**: Hierarchical tree layout (left-to-right or top-to-bottom)

**Structure**:
```
Goal → Actors (Personas) → Impacts → Deliverables (Features)
```

### Story Map
**Decision**: Two-axis grid with backbone on top

**Structure**:
- X-axis: Features (backbone) from Impact Map
- Y-axis: Priority/releases (MMF slices)
- Cells: User Stories

### Roadmap
**Decision**: Timeline-based horizontal layout

**Structure**:
- X-axis: Time (dates/sprints/quarters)
- Y-axis: Releases/MMFs
- Items: User Stories with assigned dates

## Card Type Hierarchy

**Decision**: Flat card types with type-specific frontmatter schemas

**Rationale**:
- Simpler than class inheritance
- Each card type is self-contained
- Relationships expressed via references, not inheritance

**Card Types**:
| Type | Created By | Consumed By | Key Fields |
|------|-----------|-------------|------------|
| customer | VPC | Lean, Impact, Story | jobs, pains, gains |
| value | VPC | Lean | products, pain-relievers, gain-creators |
| problem | Lean | — | description, severity |
| solution | Lean | — | description |
| goal | Impact | — | description, metrics |
| impact | Impact | Story | description, actor-ref |
| feature | Impact | Story | description, impact-refs |
| user-story | Story | Roadmap | description, feature-ref, acceptance |
| mmf | Story | Roadmap | name, story-refs |
| release | Roadmap | — | name, date, mmf-refs, story-refs |

## Board State Persistence

**Decision**: Each board is a note with frontmatter defining board type and layout state

**Rationale**:
- Board itself is a first-class Obsidian note
- User can see/organize boards in file explorer
- Board metadata (zoom, scroll, expanded sections) in frontmatter

**Structure**:
```yaml
---
type: board
board-type: value-proposition-canvas
title: "Q3 Product Strategy"
customer-segments:
  - "[[Customer - Enterprise]]"
  - "[[Customer - SMB]]"
view-state:
  zoom: 100
  activeSegment: 0
---
```

## Dependency Validation

**Decision**: Soft validation with visual warnings, not hard blocks

**Rationale**:
- Aligns with Principle IV — don't prevent user actions
- Allow creating boards in any order for flexibility
- Show warnings for missing references, let user resolve

**Implementation**:
- On board load, check if referenced cards exist
- Display "missing reference" indicator for broken links
- Offer quick-create action for missing cards

## Plugin Architecture

**Decision**: Single ItemView class per board type, shared React components

**Structure**:
```
src/
├── main.ts                    # Plugin lifecycle
├── views/
│   ├── ValuePropositionView.tsx
│   ├── LeanCanvasView.tsx
│   ├── ImpactMapView.tsx
│   ├── StoryMapView.tsx
│   └── RoadmapView.tsx
├── components/
│   ├── Card.tsx               # Generic card display
│   ├── CardEditor.tsx         # Card creation/editing modal
│   ├── ReferenceSelector.tsx  # Pick existing cards to reference
│   └── boards/
│       ├── VPCBoard.tsx
│       ├── LeanBoard.tsx
│       ├── ImpactBoard.tsx
│       ├── StoryBoard.tsx
│       └── RoadmapBoard.tsx
├── services/
│   ├── CardService.ts         # CRUD for card notes
│   ├── BoardService.ts        # Board state management
│   └── ReferenceService.ts    # Link resolution
└── models/
    ├── Card.ts                # Card type definitions
    └── Board.ts               # Board type definitions
```

## Technology Decisions

**Decision**: Use existing React setup, no additional dependencies

**Rationale**:
- Principle II (Simplicity) — use what's already approved
- React handles all UI needs for boards
- Obsidian API for file operations

**Rejected Libraries**:
- react-dnd: Drag-and-drop library — defer until needed, use native HTML5 DnD
- zustand/redux: State management — React useState/useReducer sufficient initially
- date-fns: Date formatting — defer until Roadmap implementation, use Intl API
