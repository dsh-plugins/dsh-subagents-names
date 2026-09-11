# dsh-subagents-names

[中文](README.md)

`dsh-subagents-names` adds a compact subagent manager to the DSH Web session header. The native header-lineage dropdown owns navigation of the current chain; this plugin focuses on **naming**, a **whole-subtree view**, and **cleanup**: it lists every subagent below the current session (nested workflow children included) and lets you rename and archive them.

## Features

- Renders one entry in the `conversation.session.header.actions` seat, showing how many subagents the current session can see.
- Opens a two-tab panel with `未完成` (unfinished) and `已完成` (completed), covering nested descendants rather than direct children only.
- Title precedence: panel-local alias → durable host session title → catalog creation label → runtime display title → session id.
- Renaming prefers the **durable host title** (`session.rename`); on success the panel shows that title immediately.
- While the panel is open it registers catalog interest with the runtime (`ctx.sessions.setSubagentCatalogOpen`) and refreshes the direct-child catalog of this session and every known parent, so creation labels fill in.
- The `×` action on a row archives that subagent from the `已完成` tab through the official DSH workspace archive set (`ctx.workspaces.archiveSession`), preserving its session log and workspace accounting.
- Current-turn protection: subagents observed during the running parent turn stay protected — `×` is visible but disabled — until the next parent turn establishes a new baseline.

## Compatibility with the current DSH

This version is rewritten and verified against the following contracts:

| Contract | Location | Use in this plugin |
| --- | --- | --- |
| Header action seat | `conversation.session.header.actions` (`kind: 'list'`, `scope: 'session'`) | `ctx.slots.inject` + `ctx.slots.register`, inject face `inject: (sessionId) => …` |
| Session list | `useSessions` standard hook (`SessionListState`) | reads `byId` (`origin: 'subagent'`, `parentId`, `title`, `running`, `agentPreset`) and `subagentsByParent` |
| Workspace list | `useWorkspaces` standard hook (`WorkspaceListState`) | reads `archivedSessionIds` |
| Session face | `ctx.sessions.binding(id)?.session` | `rename(title)` writes the durable title |
| Catalogs | `ctx.sessions.refreshSubagents` / `setSubagentCatalogOpen` | refreshed and registered while the panel is open |
| Navigation | `ctx.sessions.subagentAddress` → `openSubagent(address)` | retained address first, then the catalog address, then `open(id)` |
| Archiving | `ctx.workspaces.archiveSession` | completed, unprotected subagents |

### Why a subagent rename may still land as a local alias

The host fences `session.rename` for a **subagent-owned** identity with the `agent-busy` ownership error (see `apiRemoteSubagentOwnershipError` in `@deepseek-ai/dsh-api-remotes`): that lifecycle belongs to subagent routing, and a child's creation label is written once at creation with no later rename API. The plugin therefore:

1. tries the durable title first;
2. falls back to a panel-local display alias (browser `localStorage`, key `dsh-subagents-names/display-names`) only for that `agent-busy` fence;
3. surfaces every other failure (transport error, `title-invalid`, …) instead of pretending to succeed.

Once the host accepts a durable title the local alias is dropped, and the panel shows the durable title.

## Install

From a local checkout (recommended; the profile links the checkout):

```powershell
dsh plugin --profile web add link:D:\DSH基本工作区\dsh-subagents-names
```

From GitHub:

```powershell
dsh plugin --profile web add github:dsh-plugins/dsh-subagents-names#main
```

From npm:

```powershell
dsh plugin --profile web add dsh-subagents-names
```

`dsh plugin` appends any package declaring `dsh.bundle.patch` to the profile's `dsh.profile.bundles` after pnpm finishes, so no manual configuration edit is needed. Restart the DSH Web profile after installing so the client bundle loads.

## Development

```powershell
npm test
```

Two test layers:

- `test/subagents-names.test.mjs` — pure-function contracts (descendant traversal, title precedence, current-turn guard, ownership-fence detection).
- `test/client.test.mjs` — loads the published `lib/client.js` the way the DSH Web module system does (captures the `window.__ModuleLoader__.load` registration, materializes the factory with a stub `require`) and then really runs slot registration, the inject face, rename, and archive paths against fakes mirroring the current `@deepseek-ai/dsh-client-*` contracts.

## Known limits

- The panel only reads subagent rows already present in the session-list mirror; a child whose catalog was never loaded may show its creation label before any durable title arrives.
- Archiving is DSH workspace-level archiving: the session log and accounting remain, and the plugin exposes no unarchive action.
- A panel-local alias lives in the current browser only; another browser or cleared site data loses it (durable titles are unaffected).
