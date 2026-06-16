# Data Model: Agile Board Types

**Feature**: 001-agile-board-types  
**Date**: 2026-06-16

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CARD ENTITIES                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Value Proposition Canvas          Lean Canvas                              │
│  ┌──────────┐  ┌──────────┐       ┌──────────┐  ┌──────────┐               │
│  │ Customer │  │  Value   │       │ Problem  │  │ Solution │               │
│  └────┬─────┘  └────┬─────┘       └──────────┘  └──────────┘               │
│       │             │                                                       │
│       └──────┬──────┘                                                       │
│              │ references                                                   │
│              ▼                                                              │
│  Impact Mapping                    Story Map                                │
│  ┌──────────┐  ┌──────────┐       ┌──────────┐  ┌──────────┐               │
│  │   Goal   │  │  Impact  │       │   US     │  │   MMF    │               │
│  └──────────┘  └────┬─────┘       └────┬─────┘  └────┬─────┘               │
│                     │                  │             │                      │
│              ┌──────┘                  └──────┬──────┘                      │
│              ▼                                │ references                  │
│       ┌──────────┐                            ▼                             │
│       │ Feature  │                     ┌──────────┐                         │
│       └──────────┘                     │ Release  │                         │
│                                        └──────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Base Card Schema

All cards share a common frontmatter structure:

```yaml
---
agile-type: <card-type>        # Required: identifies card type
created: <ISO-date>            # Required: creation timestamp
modified: <ISO-date>           # Required: last modification
tags: []                       # Optional: user tags
---
```

## Card Type Definitions

### Customer

**Created by**: Value Proposition Canvas  
**Consumed by**: Lean Canvas, Impact Mapping, Story Map

```yaml
---
agile-type: customer
created: 2026-06-16
modified: 2026-06-16
segment-name: "Enterprise"
jobs:
  - "Manage multiple projects"
  - "Track team velocity"
pains:
  - "Switching between tools"
  - "Lost context between boards"
gains:
  - "Single source of truth"
  - "Faster planning sessions"
---
# Customer: Enterprise

[User-authored description and notes]
```

**Validation Rules**:
- `segment-name`: Required, non-empty string
- `jobs`: Optional array, at least one recommended
- `pains`: Optional array
- `gains`: Optional array

---

### Value

**Created by**: Value Proposition Canvas  
**Consumed by**: Lean Canvas

```yaml
---
agile-type: value
created: 2026-06-16
modified: 2026-06-16
customer: "[[Customer - Enterprise]]"
products-services:
  - "Unified board interface"
  - "Vault-backed storage"
pain-relievers:
  - "No tool switching"
  - "Markdown export"
gain-creators:
  - "Native Obsidian integration"
  - "Offline support"
---
# Value: Enterprise Value Proposition

[User-authored description]
```

**Validation Rules**:
- `customer`: Required, valid wikilink to Customer card
- At least one of `products-services`, `pain-relievers`, or `gain-creators` recommended

---

### Problem

**Created by**: Lean Canvas

```yaml
---
agile-type: problem
created: 2026-06-16
modified: 2026-06-16
severity: high
existing-alternatives:
  - "Trello + manual sync"
  - "Physical sticky notes"
---
# Problem: Fragmented Agile Planning

[Problem description]
```

**Validation Rules**:
- `severity`: Optional, enum: `low`, `medium`, `high`, `critical`
- `existing-alternatives`: Optional array

---

### Solution

**Created by**: Lean Canvas

```yaml
---
agile-type: solution
created: 2026-06-16
modified: 2026-06-16
problems:
  - "[[Problem - Fragmented Planning]]"
---
# Solution: Integrated Agile Boards

[Solution description]
```

**Validation Rules**:
- `problems`: Optional array of wikilinks to Problem cards

---

### Goal

**Created by**: Impact Mapping

```yaml
---
agile-type: goal
created: 2026-06-16
modified: 2026-06-16
metrics:
  - metric: "User adoption"
    target: "1000 active users"
    timeframe: "6 months"
  - metric: "Task completion rate"
    target: "90%"
---
# Goal: Increase Team Productivity

[Goal description and context]
```

**Validation Rules**:
- `metrics`: Optional array of objects with `metric`, `target`, optional `timeframe`

---

### Impact

**Created by**: Impact Mapping

```yaml
---
agile-type: impact
created: 2026-06-16
modified: 2026-06-16
goal: "[[Goal - Increase Productivity]]"
actor: "[[Customer - Enterprise]]"
behavior-change: "positive"
---
# Impact: Reduce Context Switching

[Description of the behavioral impact]
```

**Validation Rules**:
- `goal`: Required, wikilink to Goal card
- `actor`: Required, wikilink to Customer card
- `behavior-change`: Optional, enum: `positive` (encourage), `negative` (prevent)

---

### Feature

**Created by**: Impact Mapping  
**Consumed by**: Story Map

```yaml
---
agile-type: feature
created: 2026-06-16
modified: 2026-06-16
impacts:
  - "[[Impact - Reduce Context Switching]]"
  - "[[Impact - Faster Planning]]"
priority: high
---
# Feature: Unified Board View

[Feature description]
```

**Validation Rules**:
- `impacts`: Required, at least one wikilink to Impact card
- `priority`: Optional, enum: `low`, `medium`, `high`, `critical`

---

### User Story (US)

**Created by**: Story Map  
**Consumed by**: Roadmap

```yaml
---
agile-type: user-story
created: 2026-06-16
modified: 2026-06-16
feature: "[[Feature - Unified Board View]]"
customer: "[[Customer - Enterprise]]"
story-points: 5
acceptance-criteria:
  - "User can view all board types from single interface"
  - "Board state persists between sessions"
status: backlog
---
# US: View Multiple Boards

As an Enterprise user,
I want to view all my boards in a unified interface,
So that I can reduce context switching.

## Acceptance Criteria
- [ ] User can view all board types from single interface
- [ ] Board state persists between sessions
```

**Validation Rules**:
- `feature`: Required, wikilink to Feature card
- `customer`: Optional, wikilink to Customer card
- `story-points`: Optional, positive integer
- `acceptance-criteria`: Required, non-empty array
- `status`: Optional, enum: `backlog`, `ready`, `in-progress`, `done`

---

### MMF (Minimum Marketable Feature)

**Created by**: Story Map  
**Consumed by**: Roadmap

```yaml
---
agile-type: mmf
created: 2026-06-16
modified: 2026-06-16
stories:
  - "[[US - View Multiple Boards]]"
  - "[[US - Create Cards]]"
  - "[[US - Link Cards]]"
description: "Core board viewing and card management"
---
# MMF: Board Foundation

[MMF description - what makes this a marketable unit]
```

**Validation Rules**:
- `stories`: Required, at least one wikilink to User Story card
- `description`: Optional, short summary

---

### Release

**Created by**: Roadmap

```yaml
---
agile-type: release
created: 2026-06-16
modified: 2026-06-16
target-date: 2026-07-15
mmfs:
  - "[[MMF - Board Foundation]]"
stories:
  - "[[US - Quick Actions]]"
status: planned
version: "1.0.0"
---
# Release: v1.0.0 - Foundation

[Release notes and goals]
```

**Validation Rules**:
- `target-date`: Optional, ISO date string
- `mmfs`: Optional array of wikilinks to MMF cards
- `stories`: Optional array of wikilinks to User Story cards (for stories not in MMFs)
- `status`: Optional, enum: `planned`, `in-progress`, `released`
- `version`: Optional, semver string

---

## Board Entity

Boards are also stored as notes with special frontmatter:

```yaml
---
agile-type: board
board-type: value-proposition-canvas  # or: lean-canvas, impact-map, story-map, roadmap
title: "Q3 Product Strategy"
created: 2026-06-16
modified: 2026-06-16
---
# Q3 Product Strategy

[Optional board description]
```

### Board Type Configurations

#### Value Proposition Canvas Board
```yaml
---
agile-type: board
board-type: value-proposition-canvas
segments:
  - customer: "[[Customer - Enterprise]]"
    value: "[[Value - Enterprise VP]]"
  - customer: "[[Customer - SMB]]"
    value: "[[Value - SMB VP]]"
active-segment: 0
---
```

#### Lean Canvas Board
```yaml
---
agile-type: board
board-type: lean-canvas
sections:
  customers:
    - "[[Customer - Enterprise]]"
  problems:
    - "[[Problem - Fragmented Planning]]"
  solutions:
    - "[[Solution - Integrated Boards]]"
  value-propositions:
    - "[[Value - Enterprise VP]]"
  channels: []
  revenue-streams: []
  cost-structure: []
  key-metrics: []
  unfair-advantage: []
---
```

#### Impact Map Board
```yaml
---
agile-type: board
board-type: impact-map
goal: "[[Goal - Increase Productivity]]"
layout: horizontal  # or: vertical
expanded-nodes:
  - "[[Customer - Enterprise]]"
---
```

#### Story Map Board
```yaml
---
agile-type: board
board-type: story-map
backbone:
  - "[[Feature - Unified View]]"
  - "[[Feature - Card Management]]"
releases:
  - name: "Release 1"
    mmf: "[[MMF - Board Foundation]]"
  - name: "Release 2"
    mmf: "[[MMF - Advanced Features]]"
---
```

#### Roadmap Board
```yaml
---
agile-type: board
board-type: roadmap
timeline-unit: month  # or: week, quarter
start-date: 2026-07-01
end-date: 2026-12-31
releases:
  - "[[Release - v1.0.0]]"
  - "[[Release - v1.1.0]]"
---
```

## State Transitions

### User Story Status
```
backlog → ready → in-progress → done
```

### Release Status
```
planned → in-progress → released
```

## Indexing Strategy

The plugin maintains an in-memory index of all agile cards for fast lookups:

```typescript
interface CardIndex {
  byType: Map<CardType, Set<TFile>>;
  byReference: Map<string, Set<TFile>>;  // cards that reference a given path
  boards: Map<BoardType, Set<TFile>>;
}
```

**Rebuild triggers**:
- Plugin load
- File create/delete/rename events
- Frontmatter modification (via MetadataCache)
