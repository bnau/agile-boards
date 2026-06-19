# Agile Boards for Obsidian

> **This plugin was vibe-coded.** Built with focus and purpose, it provides essential agile frameworks directly within your Obsidian vault.

An Obsidian plugin that brings professional agile and product strategy frameworks to your note-taking workflow. Every board is backed by markdown files in your vault, ensuring your strategic thinking remains integrated with your knowledge base.

## Features

Six specialized board types, each designed for a specific phase of product development. All boards use plain markdown files with YAML frontmatter, keeping your data portable and under your control.

### 1. Value Proposition Canvas

**Foundation for product-market fit.**

The Value Proposition Canvas helps you systematically map:
- **Customer Profile**: Jobs to be done, pains, and gains your customer experiences
- **Value Map**: How your product creates gains and relieves pains

This framework ensures alignment between customer needs and your solution. Each section of the canvas is composed of linked notes, allowing you to elaborate on insights, link to research, and maintain evidence for your strategic decisions.

### 2. Lean Canvas

**Business model validation.**

The Lean Canvas provides a structured one-page business plan with nine essential components:
- Problem
- Customer Segments
- Unique Value Proposition
- Solution
- Channels
- Revenue Streams
- Cost Structure
- Key Metrics
- Unfair Advantage

Each component is backed by notes in your vault, enabling you to link business assumptions to supporting research, meeting notes, and market analysis. This approach keeps your business model documentation integrated with your broader knowledge base.

### 3. Impact Map

**Connect business goals to deliverables.**

Impact Mapping creates a clear hierarchy from business objectives to specific features:
- **Goal**: The business outcome you want to achieve (revenue, engagement, retention)
- **Actors**: Stakeholders who can influence the goal
- **Impacts**: Behavioral changes that drive the outcome
- **Deliverables**: Features that enable those behavioral changes

This framework ensures every deliverable has a clear line of sight to measurable business impact, helping teams prioritize work based on strategic value rather than feature requests.

### 4. Story Map

**Organize features into user journeys.**

Story Mapping arranges features across two dimensions:
- **Horizontal axis**: The user's journey through the product (sequential activities)
- **Vertical axis**: Priority (essential features at the top, enhancements below)

The top row forms the backbone—the core activities that define the user experience. Lower rows represent incremental releases, allowing you to plan iterative delivery that provides coherent value at each stage.

This approach supports incremental delivery while maintaining a complete, end-to-end user experience in every release.

### 5. Roadmap

**Plan releases over time.**

The Roadmap organizes deliverables into time-bound releases, each containing:
- A **target date**
- A **release goal** (the outcome this release achieves)
- A **set of features** (linked to Story Map deliverables)

This view helps teams sequence work, communicate delivery timelines, and make explicit trade-offs between scope, time, and resources.

### 6. Kanban Board

**Visualize and manage workflow.**

The Kanban board provides workflow visualization and management:
- **Columns** represent workflow stages (To Do, In Progress, Done, etc.)
- **Cards** represent work items (features, bugs, technical tasks)
- **WIP limits** help identify bottlenecks and maintain flow

Because each card is a note in your vault, you can link to specifications, embed code snippets, and trace work items back to the strategic artifacts (Impact Maps, Story Maps) that justified them.

---

## Design Philosophy

**Integration over fragmentation.** Product strategy tools should live alongside your other knowledge work, not in isolated SaaS platforms.

**Data ownership.** Your strategic thinking is stored in markdown files you control. No proprietary formats, no vendor lock-in, no cloud dependencies.

**Connectivity.** Because boards are built on notes, a card on your Kanban board can reference a Story Map deliverable, which links to an Impact Map impact, which traces to a Value Proposition insight. Your strategic artifacts form a connected graph of reasoning.

**Proven frameworks.** This plugin implements established product management and agile methodologies (Value Proposition Canvas, Lean Canvas, Impact Mapping, User Story Mapping, Roadmapping, and Kanban) without modification or dilution.

---

## How to Use It

### Installation

1. Copy this plugin folder to `<your-vault>/.obsidian/plugins/agile-boards/`
2. Enable "Agile Boards" in **Settings → Community plugins**
3. Restart Obsidian (or enable the **Hot-Reload** plugin for development)

### Creating a Board

Use the command palette (`Ctrl/Cmd + P`) and type one of:
- `Create Value Proposition Canvas`
- `Create Lean Canvas`
- `Create Impact Map`
- `Create Story Map`
- `Create Roadmap`
- `Create Kanban Board`

Or click the **grid icon** in the ribbon to open your most recent board.

### Opening an Existing Board

Right-click any board note (in file explorer or in the editor) and select **"Open as agile board"**. Or use the command `Open current note as agile board` when viewing a board note in markdown mode.

### Adding Cards

Click the **+** button in any section/column. This creates a new note in your configured cards folder (default: `Agile Boards/Cards/`) and links it to the board.

Every card is a **real note** in your vault. You can:
- Open it to add details, embed images, or link to other notes
- Reference it elsewhere in your vault  
- Search for it
- Tag it, template it, automate it—whatever your vault workflow supports

### Moving Cards

Drag and drop. Between columns, between sections, wherever the board type allows.

### Deleting Cards

Right-click a card and select **Delete**. This removes the card from the board but does **not delete the underlying note** from your vault. The plugin preserves your data by default. To permanently delete a note, remove it from your vault separately.

---

## Configuration

**Settings → Agile Boards → New note folder**

Configure the folder where new card notes are created. The default location is `Agile Boards/Cards/`. You can organize cards by project, board type, date, or any structure that fits your workflow.

---

## Core Principles

1. **Vault-native storage.** All boards and cards are stored as markdown files in your vault. No external databases or cloud services required.

2. **Linked thinking.** Boards are interconnected views over your notes. A Kanban card can reference a Story Map deliverable, which links to an Impact Map impact, which traces to Value Proposition insights.

3. **Framework fidelity.** Each board type implements its respective methodology as designed by its creators, without simplification or modification.

4. **Zero lock-in.** Every board is a markdown file with YAML frontmatter. You can read, edit, version control, and migrate your strategic artifacts using standard tools.

---

## Development

Want to modify this plugin or contribute?

```bash
npm install          # Install dependencies
npm run dev          # Watch mode (auto-rebuild on change)
npm run build        # Production build with type-checking
```

Test in a **separate development vault** (not your main vault). Symlink the plugin folder or develop directly in `.obsidian/plugins/agile-boards/`.

Use the **Hot-Reload** community plugin to auto-reload on rebuild, or toggle the plugin off/on in settings.

---

## Tech Stack

- **TypeScript** (strict mode, ES2018 target)
- **React** (createRoot, functional components)
- **esbuild** (fast builds, no webpack bloat)
- **Obsidian API** (official, stable, desktop + mobile)

---

## License

Apache 2.0. See [LICENSE](./LICENSE) for details.

This plugin is open source. You are free to use, modify, and distribute it according to the terms of the Apache License.

---

## Credits

Built by **Bertrand Nau**.

This plugin was vibe-coded—built with focus on delivering working software over extensive planning.
