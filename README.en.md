# dsh-subagents-names

[中文](README.md)

`dsh-subagents-names` **enhances the official subagent dropdown** — it does not add a second panel beside it.

The session header's "N subagents" dropdown, the subagent breadcrumb, and the sibling switcher are owned by the shipped package `@deepseek-ai/dsh-client-ui-subagent`, which occupies the seat `conversation.session.header.lineage` (`kind: 'single'`). This plugin takes over that same seat: it keeps the official navigation and metrics and adds the two things the official renderer does not have — **renaming** and **archiving**.

## What it adds to the official dropdown

- Every row grows a "rename" and an "archive" action on its right edge (shown on hover).
- **Rename**: writes the durable host session title first (`session.rename`) and the row title updates immediately; only when the host rejects it with the `agent-busy` ownership fence does the name fall back to a **panel-local display name** for that child. Any other failure (transport error, `title-invalid`, …) is reported in place instead of pretending to succeed.
- **Row title precedence**: panel-local alias → durable host session title → catalog creation label → session id. The official renderer uses only the catalog creation label (`entry.label ?? entry.id`), which is why a rename can never show up there; taking over the seat is what makes this rule possible.
- **Archive**: collapses that child's record through the official DSH workspace archive set (`ctx.workspaces.archiveSession`), preserving its session log and workspace accounting. Running children and children created during the current turn cannot be archived (the button stays visible but disabled).
- Archived children no longer appear in the dropdown.

## Official behaviour preserved verbatim

Taking over a single seat means the original rendering is reimplemented here; these behaviours follow the official implementation:

| Capability | Notes |
| --- | --- |
| Breadcrumb + sibling switcher | A subagent session shows a "title + double-chevron" switcher; ancestor state uses the muted palette |
| Descendant count trigger | An ordinary session shows `/` + "N subagents"; with running descendants it shows the activity dot and running copy |
| Tree catalog | Renders the direct catalog per level and recurses only through explicitly expanded branches |
| Lazy loading | Expanding a branch registers catalog interest (`setSubagentCatalogOpen`); a not-yet-hydrated catalog is represented by the known direct-child shape |
| Keyboard navigation | `ArrowUp/Down`, `Home/End`, `ArrowRight/Left` expand/collapse, `Escape` closes and restores focus, `Enter/Space` opens |
| Hover open/close | 150 ms hover to open, 120 ms leave to close (same timing as the official renderer) |
| Metrics | Durable token total and active duration per row; running children tick their duration once per second |
| Diagnostic rows | Corrupt/unsupported/unavailable catalog entries render as disabled rows with their reason |
| Errors and retry | A failed catalog shows the error copy and a retry button |

## Compatibility with the current DSH

Verified against the version the desktop profile is running (DSH `0.1.5-rc.1`, same as the official UI package):

| Contract | Location | Use in this plugin |
| --- | --- | --- |
| Lineage seat | `conversation.session.header.lineage` (single / session) | `ctx.slots.inject` + `ctx.slots.register` with an explicit `priority: -10` so it wins below the official default priority |
| Session list | `useSessions` standard hook (`SessionListState`) | reads `byId` (`origin`, `parentId`, `title`, `running`, `agentPreset`, `projectionValues`) and `subagentsByParent` |
| Workspace list | `useWorkspaces` standard hook (`WorkspaceListState`) | reads `archivedSessionIds` |
| Session face | `ctx.sessions.binding(id)?.session` | `rename(title)` writes the durable title |
| Catalogs | `ctx.sessions.refreshSubagents` / `setSubagentCatalogOpen` | refreshed on expand and retry, registered while expanded |
| Navigation | `ctx.sessions.openSubagent(address)` | row click / `Enter` opens that address |
| Archiving | `ctx.workspaces.archiveSession` | completed, unprotected children |

### Why a subagent rename usually lands as a local alias

The host fences `session.rename` for a **subagent-owned** identity with the `agent-busy` ownership error (see `apiRemoteSubagentOwnershipError` in `@deepseek-ai/dsh-api-remotes`): that lifecycle belongs to subagent routing, and a child's creation label is written once at creation with no later rename API. So the plugin:

1. tries the durable title first;
2. only for that `agent-busy` fence, stores the name as a panel-local display name (browser `localStorage`, key `dsh-subagents-names/display-names`);
3. reports every other failure.

Once the host accepts a durable title, that child's local alias is removed and the panel shows the durable title.

### Trade-offs of taking over the seat

- The official package still loads; only its `conversation.session.header.lineage` entry is outranked by this plugin and no longer renders. Its read-only composer fallback on `conversation.composer` (one-shot children / offline parent) is unaffected.
- When DSH is upgraded, a rename or owner-contract change of that seat requires re-checking this plugin's props usage (`lineageSessionId`, `displayTitle`, `openTitle`, plus the standard props).
- This plugin declares no locale namespace; its copy is inlined Simplified Chinese.

## Install

Install into the profile you actually run. Check the current profile first:

```powershell
Get-Content "$env:APPDATA\DSH Desktop Beta\profile-selection\state.json"
```

From a local checkout (recommended; the profile links it, so code edits apply immediately):

```powershell
dsh plugin --profile desktop add "link:D:\DSH基本工作区\dsh-subagents-names"
```

From GitHub:

```powershell
dsh plugin --profile desktop add github:dsh-plugins/dsh-subagents-names#main
```

From npm:

```powershell
dsh plugin --profile desktop add dsh-subagents-names
```

`dsh plugin` appends any package declaring `dsh.bundle.patch` to the profile's `dsh.profile.bundles`. The desktop profile uses `patchReload: live`, so host-side changes apply immediately; **a newly added client bundle needs one page refresh**.

## Development

```powershell
npm test
```

Two layers:

- `test/client.test.mjs` — loads the published `lib/client.js` the way the DSH Web module system does (captures the `window.__ModuleLoader__.load` registration, materializes the factory with a stub `require`) and then really runs seat registration and priority, the inject face, the count trigger and breadcrumb switcher, catalog row rendering, expand registration, inline rename (durable success / fence fallback / other failure / blank / Escape), archiving and current-turn protection, and navigation against fakes mirroring the current `@deepseek-ai/dsh-client-*` contracts.
- `test/subagents-names.test.mjs` — host-half pure functions (current-turn guard, ownership-fence detection, alias folding).
- `npm test` also runs `scripts/check-encoding.mjs`, keeping every text file UTF-8 without BOM.

## Known limits

- The dropdown consumes only subagent rows already present in the session-list mirror; a child whose catalog was never loaded shows its creation label first.
- Archiving is DSH workspace-level archiving: log and accounting remain, and the plugin exposes no unarchive action.
- A panel-local alias lives in the current browser only; another browser or cleared site data loses it (durable titles are unaffected).
- Renaming a **one-shot** subagent changes only its display: it will never be continued.
