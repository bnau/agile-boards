---
name: obsidian-docs
description: Explains where to find documentation for Obsidian plugin development
---

# obsidian-docs

Explain where to find documentation for Obsidian plugin development.

## Instructions

When this skill is invoked, provide the user with a comprehensive guide to Obsidian plugin development documentation sources:

### Official Documentation

1. **Obsidian Developer Docs** (Primary)
   - URL: https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin
   - Content: Official guide for building plugins, API reference, best practices
   - Covers: Plugin lifecycle, views, commands, settings, events, and more

2. **Obsidian API TypeScript Definitions**
   - URL: https://github.com/obsidianmd/obsidian-api
   - Content: TypeScript type definitions (`obsidian.d.ts`)
   - Usage: Install via `npm install obsidian` for type checking

3. **Sample Plugin Repository**
   - URL: https://github.com/obsidianmd/obsidian-sample-plugin
   - Content: Official starter template with examples
   - Good for: Understanding project structure and basic patterns

### Community Resources

4. **Obsidian Plugin Developer Docs (Community)**
   - URL: https://marcus.se.net/obsidian-plugin-docs/
   - Content: Community-maintained, more detailed tutorials
   - Covers: React integration, views, modals, advanced patterns

5. **Obsidian Forum - Developers & API**
   - URL: https://forum.obsidian.md/c/developers-api/14
   - Content: Community discussions, Q&A, announcements

6. **Obsidian Discord - #plugin-dev channel**
   - URL: https://discord.gg/obsidianmd
   - Content: Real-time help from the community

### Key API Concepts to Study

- `Plugin` class: `onload()`, `onunload()`, `addCommand()`, `registerView()`
- `ItemView`: Custom views in the workspace
- `Modal`: Popup dialogs
- `Setting`: Plugin settings UI
- `MarkdownView`: Interacting with notes
- `Vault`: File operations (read, write, modify notes)
- `MetadataCache`: Frontmatter and links
- `Workspace`: Managing views and layout

### Recommended Learning Path

1. Read the official "Build a plugin" guide
2. Clone and study the sample plugin
3. Install `obsidian` npm package for types
4. Use a dev vault with Hot-Reload plugin
5. Check community docs for advanced topics
