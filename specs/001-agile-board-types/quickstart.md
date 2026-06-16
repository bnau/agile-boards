# Quickstart: Agile Board Types

**Feature**: 001-agile-board-types  
**Date**: 2026-06-16

## Prerequisites

- Node.js 18+ installed
- Obsidian desktop application
- A development vault (separate from your main vault)

## Setup

1. **Clone and install**
   ```bash
   cd /path/to/dev-vault/.obsidian/plugins/agile-boards
   npm install
   ```

2. **Start development build**
   ```bash
   npm run dev
   ```

3. **Enable plugin in Obsidian**
   - Open Settings → Community plugins
   - Enable "Agile Boards"
   - (Optional) Install "Hot-Reload" plugin for auto-refresh

## Creating Your First Board

### 1. Value Proposition Canvas

1. Open command palette (Ctrl/Cmd + P)
2. Run "Agile Boards: Create Value Proposition Canvas"
3. Enter board name (e.g., "Q3 Product Strategy")
4. Add customer segment via the "+" button
5. Fill in Jobs, Pains, Gains for customer
6. Fill in Products/Services, Pain Relievers, Gain Creators

**Result**: Creates board note + Customer and Value cards in your vault

### 2. Lean Canvas

1. Run "Agile Boards: Create Lean Canvas"
2. Enter board name
3. In Customer Segments section, click "Link existing" to reference VPC customers
4. Fill remaining sections (Problem, Solution, etc.)

**Result**: References existing Customer/Value cards, creates new Problem/Solution cards

### 3. Impact Mapping

1. Run "Agile Boards: Create Impact Map"
2. Define your business Goal
3. Add Actors by linking existing Customer cards (as Personas)
4. Define Impacts for each Actor
5. Add Feature deliverables under Impacts

**Result**: Creates Goal, Impact, Feature cards linked to existing Customers

### 4. Story Map

1. Run "Agile Boards: Create Story Map"
2. Select Features from Impact Map as backbone
3. Add User Stories under each Feature
4. Group stories into MMF slices (horizontal bands)

**Result**: Creates User Story and MMF cards linked to Features

### 5. Roadmap

1. Run "Agile Boards: Create Roadmap"
2. Set timeline range (start/end dates)
3. Create Release milestones
4. Assign MMFs and User Stories to Releases
5. Set target dates

**Result**: Creates Release cards with date associations

## File Structure

After creating boards, your vault will contain:

```
vault/
├── Agile/
│   ├── Boards/
│   │   ├── Q3 Product Strategy (VPC).md
│   │   ├── Business Model (Lean).md
│   │   ├── Goals 2026 (Impact).md
│   │   ├── Product Backlog (Story).md
│   │   └── 2026 Roadmap.md
│   ├── Customers/
│   │   ├── Customer - Enterprise.md
│   │   └── Customer - SMB.md
│   ├── Values/
│   │   └── Value - Enterprise VP.md
│   ├── Problems/
│   │   └── Problem - Fragmented Planning.md
│   ├── Features/
│   │   └── Feature - Unified View.md
│   ├── Stories/
│   │   └── US - View Multiple Boards.md
│   ├── MMFs/
│   │   └── MMF - Board Foundation.md
│   └── Releases/
│       └── Release - v1.0.0.md
```

## Common Tasks

### Link existing card to board
1. Click reference slot in board
2. Search/filter existing cards by type
3. Select card to create reference

### Create card inline
1. Click "+" in empty slot
2. Enter card details in modal
3. Card created and linked automatically

### View card details
- Click card to open in current pane
- Cmd/Ctrl+Click to open in new pane
- Edit directly in note or use board UI

### Handle missing references
- Yellow indicator shows broken link
- Click to re-link or create replacement card

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Create new board | Ctrl/Cmd + Shift + B |
| Add card | Enter (with slot selected) |
| Open card | Enter (with card selected) |
| Delete card | Backspace (with confirmation) |
| Navigate | Arrow keys |

## Troubleshooting

**Board not loading**: Check console for errors, verify frontmatter is valid YAML

**Cards not appearing**: Ensure card has `agile-type` in frontmatter, rebuild index via command palette

**References broken**: Card was renamed/moved; click warning to re-link

## Development Commands

```bash
npm run dev      # Watch mode
npm run build    # Production build
npm run lint     # Check code style (if configured)
```
