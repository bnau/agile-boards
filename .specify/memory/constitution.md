<!--
SYNC IMPACT REPORT
==================
Version change: 1.0.0 → 1.1.0
Rationale: Materially expanded "Technology & Platform Constraints" with the concrete
adopted stack (TypeScript + React + esbuild) now that the base project exists (MINOR).

History:
  - 1.0.0 (2026-06-16): Initial ratification — first adoption of the four core principles.
  - 1.1.0 (2026-06-16): Pinned concrete technology stack and build/distribution layout.

Modified principles: none (titles and rules unchanged)
  - I. Spec-Driven Development
  - II. Simplicity & YAGNI
  - III. Obsidian Platform Compliance
  - IV. User Vault Data Safety

Added sections: none (Technology & Platform Constraints expanded in place)

Removed sections: none

Templates requiring updates:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check reads gates dynamically; no hardcoded principles)
  - .specify/templates/spec-template.md ✅ aligned (spec-first flow consistent with Principle I)
  - .specify/templates/tasks-template.md ✅ aligned (tests treated as OPTIONAL; consistent with no Test-First mandate)
  - .specify/templates/checklist-template.md ✅ aligned (no principle-specific references)

Follow-up TODOs: none
-->

# Agile Boards Constitution
<!-- Obsidian plugin providing agile/Kanban boards backed by the user's vault notes. -->

## Core Principles

### I. Spec-Driven Development

Every feature MUST begin as a written specification before any implementation code is
written. The flow is non-negotiable: spec (`/speckit-specify`) → plan (`/speckit-plan`) →
tasks (`/speckit-tasks`) → implementation (`/speckit-implement`). Specs MUST describe user
value and acceptance scenarios independently of implementation detail. No feature ships
without a traceable spec, and ad-hoc, undocumented features MUST NOT be merged.

**Rationale**: A small plugin lives or dies by clarity of intent. Writing the spec first
forces the "what" and "why" to be settled before the "how", keeps scope honest, and gives
every change a reviewable rationale.

### II. Simplicity & YAGNI

The simplest design that satisfies the current spec MUST be chosen. Abstractions,
configuration options, dependencies, and generalizations MUST NOT be introduced for
anticipated-but-unconfirmed future needs ("You Aren't Gonna Need It"). Any added
complexity — a new dependency, an extra layer, a design pattern — MUST be justified in the
plan's Complexity Tracking table, naming the concrete problem it solves and why a simpler
alternative was rejected.

**Rationale**: Obsidian plugins run inside the user's editor; every extra dependency and
abstraction is weight the user pays for and the maintainer must carry. Defaulting to simple
keeps the plugin fast, auditable, and easy to evolve.

### III. Obsidian Platform Compliance

The plugin MUST interact with Obsidian exclusively through the official plugin API. It MUST
register and clean up all resources (events, intervals, DOM nodes, commands) through the
plugin lifecycle so that disabling or unloading the plugin leaves no residue. Private or
undocumented internals MUST NOT be relied upon. The plugin MUST declare an accurate
`manifest.json` (including `minAppVersion`), and any feature that cannot work on a platform
(e.g. mobile) MUST be gated rather than allowed to fail silently.

**Rationale**: Plugins share a process with Obsidian and other plugins. Staying on the
supported API and cleaning up after ourselves is what keeps the user's editor stable and
the plugin compatible across Obsidian updates.

### IV. User Vault Data Safety

The user's vault is their data, not ours. Board state SHOULD be stored as human-readable
Markdown/notes whenever feasible, and the plugin MUST NOT silently destroy, reorder, or
rewrite note content that it did not author. Operations that modify or delete vault files
MUST be deliberate, scoped, and reversible by ordinary Obsidian means (undo, file history).
Destructive actions MUST require explicit user intent.

**Rationale**: Trust is the plugin's most valuable asset. A single data-loss incident is
unrecoverable reputationally; treating the vault as sacred is therefore a hard constraint,
not a preference.

## Technology & Platform Constraints

- **Language**: TypeScript with strict type-checking, compiled to the ES2018 JavaScript
  target supported by the declared `minAppVersion` of Obsidian.
- **UI framework**: React (`react` + `react-dom`) is the approved runtime dependency for
  rendering board UI. React views MUST be mounted with `createRoot` and unmounted on view
  close to satisfy Principle III (cleanup). No additional UI framework may be added.
- **Build tooling**: esbuild bundles `src/main.ts` into a single `main.js`. `npm run dev`
  runs the watch build; `npm run build` runs `tsc -noEmit` type-checking followed by a
  minified production bundle. `obsidian`, `electron`, and CodeMirror packages MUST stay
  external (not bundled).
- **Source layout**: Plugin source lives under `src/`; the React entry view is
  `src/BoardView.tsx` and presentational components live under `src/components/`.
- **Distribution artifacts**: `main.js`, `manifest.json`, and `styles.css` are the shipped
  outputs. `main.js` is a build artifact (git-ignored); source is not shipped directly.
- **Runtime**: The Obsidian desktop and (where feasible) mobile plugin environment
  (`isDesktopOnly: false`). Node is used for tooling/build only, not assumed at runtime.
- **Dependencies**: Beyond React, third-party runtime dependencies are discouraged (see
  Principle II) and each new one MUST be justified in the relevant plan.
- **Offline-first**: The plugin MUST function without network access; any networked feature
  MUST be optional and clearly disclosed.

## Development Workflow & Quality Gates

- **Branch per feature**: Work happens on feature branches created via `/speckit-git-feature`;
  the constitution and spec-kit flow govern what lands on the main branch.
- **Constitution Check**: `/speckit-plan` MUST run the Constitution Check gate before and
  after design. Violations MUST be either removed or recorded with justification in the
  plan's Complexity Tracking table.
- **Manual verification**: Each shipped change MUST be exercised in a development Obsidian
  vault. Automated tests are encouraged where they add value but are not mandated by this
  constitution; when a spec requests tests, they become required for that feature.
- **Review**: Every change MUST be traceable to its spec and reviewed for compliance with
  the four core principles before merge.

## Governance

This constitution supersedes other development practices for this project. When guidance
conflicts, the constitution wins.

- **Amendments** MUST be proposed as a change to this file, including the rationale and the
  resulting version bump, and approved by the project maintainer before taking effect.
- **Versioning** follows semantic versioning: MAJOR for backward-incompatible governance or
  principle removals/redefinitions, MINOR for a new principle or materially expanded
  guidance, PATCH for clarifications and non-semantic refinements.
- **Compliance review**: All plans and reviews MUST verify adherence to the core principles.
  Unjustified complexity is grounds to reject a change. Dependent spec-kit templates MUST be
  kept in sync whenever principles change.

**Version**: 1.1.0 | **Ratified**: 2026-06-16 | **Last Amended**: 2026-06-16
