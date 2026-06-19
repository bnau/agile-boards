<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
`specs/002-kanban-board/plan.md`
<!-- SPECKIT END -->

# Agile Boards

An **Obsidian plugin** that provides agile / Kanban boards backed by the user's vault notes.

## Governance

This project follows a spec-driven workflow. The project constitution at
`.specify/memory/constitution.md` is binding — read it before non-trivial work. Core
principles (v1.1.0):

1. **Spec-Driven Development** — every feature starts as a spec (`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`). No undocumented features.
2. **Simplicity & YAGNI** — simplest design that satisfies the spec; justify any added complexity in the plan's Complexity Tracking table.
3. **Obsidian Platform Compliance** — use only the official Obsidian API; register and clean up all resources in the plugin lifecycle.
4. **User Vault Data Safety** — never silently destroy or rewrite notes the plugin did not author; destructive actions require explicit user intent.

## Tech stack

- **TypeScript** (strict), targeting ES2018.
- **React** (`react` + `react-dom`) for board UI — mount with `createRoot`, unmount on view close.
- **esbuild** for bundling. `obsidian`, `electron`, and CodeMirror packages stay external.

## Project structure

```
manifest.json          # Plugin manifest (id, version, minAppVersion)
package.json           # Scripts and dependencies
tsconfig.json          # TS config (jsx: react-jsx)
esbuild.config.mjs     # Build config (entry: src/main.ts → main.js)
styles.css             # Plugin styles
versions.json          # Plugin version → minAppVersion map
src/
├── main.ts            # Plugin entry: onload/onunload, ribbon + command, registerView
├── BoardView.tsx      # ItemView that mounts the React tree (createRoot / unmount)
└── components/
    └── Board.tsx      # React board UI (placeholder in-memory columns/cards)
```

## Commands

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Watch build (rebuilds `main.js` on change) |
| `npm run build` | Type-check (`tsc -noEmit`) + minified production bundle |

## Local development

To test in Obsidian, the plugin folder must live under a vault's
`.obsidian/plugins/agile-boards/` directory (symlink or develop there). Use a **separate
development vault**, not your main one. Install the community **Hot-Reload** plugin to
auto-reload on rebuild, or toggle the plugin off/on in *Settings → Community plugins*.

`main.js` is a generated build artifact and is git-ignored.
