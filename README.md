# dsh-subagents-names

[English](README.en.md)

`dsh-subagents-names` 在 DSH Web 的会话页头加一个紧凑的子代理管理面板。原生页头谱系下拉负责“当前这条链”的导航；本插件的侧重点是**命名**、**全局视角**和**清理**：把某个会话之下的全部子代理（含嵌套 workflow 子代理）一次列清楚，并允许改名与归档。

## 功能

- 在 `conversation.session.header.actions` 座席渲染一个入口按钮，显示当前会话可见的子代理数量。
- 面板分 `未完成` 与 `已完成` 两个页签，覆盖多层嵌套后代，而不仅是直接子代理。
- 标题优先级：面板本地别名 → 宿主持久会话标题 → 目录创建标签 → 运行时显示标题 → 会话 id。
- 重命名优先写**宿主持久标题**（`session.rename`），成功后面板立即显示该标题。
- 面板打开期间会向运行时登记目录消费（`ctx.sessions.setSubagentCatalogOpen`）并刷新本会话与每个已知父会话的直接子目录，因此创建标签会随面板打开而补齐。
- 行上的 `×` 在 `已完成` 页签中归档该子代理，使用 DSH 官方的工作区归档集合（`ctx.workspaces.archiveSession`），保留其会话日志与工作区记账。
- 当前轮保护：本轮内观察到的子代理会保持受保护状态，`×` 可见但禁用，直到下一个父轮次建立新基线。

## 与当前 DSH 的兼容性

本版本按以下契约重写并验证：

| 契约 | 位置 | 本插件的用法 |
| --- | --- | --- |
| 页头动作座席 | `conversation.session.header.actions`（`kind: 'list'`，`scope: 'session'`） | `ctx.slots.inject` + `ctx.slots.register`，注入面为 `inject: (sessionId) => …` |
| 会话列表 | `useSessions` 标准钩子（`SessionListState`） | 读取 `byId`（含 `origin: 'subagent'`、`parentId`、`title`、`running`、`agentPreset`）与 `subagentsByParent` |
| 工作区列表 | `useWorkspaces` 标准钩子（`WorkspaceListState`） | 读取 `archivedSessionIds` |
| 会话面 | `ctx.sessions.binding(id)?.session` | `rename(title)` 写持久标题 |
| 目录 | `ctx.sessions.refreshSubagents` / `setSubagentCatalogOpen` | 面板打开期间刷新并登记 |
| 导航 | `ctx.sessions.subagentAddress` → `openSubagent(address)` | 有保留地址时优先走地址，否则用目录地址，最后回退到 `open(id)` |
| 归档 | `ctx.workspaces.archiveSession` | 已完成且不受保护的子代理 |

### 为什么子代理改名仍可能只写本地别名

当前宿主对**归子代理路由所有**的会话会用 `agent-busy` 所有权围栏拒绝 `session.rename`（见 `@deepseek-ai/dsh-api-remotes` 的 `apiRemoteSubagentOwnershipError`），因为那段生命周期归子代理路由所有；而子代理的创建标签本身是创建时写定的、事后没有改名接口。因此本插件的策略是：

1. 先尝试持久标题；
2. 只在收到 `agent-busy` 围栏时回退到面板本地显示别名（保存在浏览器 `localStorage`，键为 `dsh-subagents-names/display-names`）；
3. 其它失败（如传输错误、`title-invalid`）直接报错，不伪装成功。

一旦宿主接受持久标题，本地别名会被删除，面板展示的就是持久标题。

## 安装

从本地检出安装（推荐，profile 会以软链接方式挂载）：

```powershell
dsh plugin --profile web add link:D:\DSH基本工作区\dsh-subagents-names
```

从 GitHub 安装：

```powershell
dsh plugin --profile web add github:dsh-plugins/dsh-subagents-names#main
```

从 npm 安装：

```powershell
dsh plugin --profile web add dsh-subagents-names
```

`dsh plugin` 会在 pnpm 安装完成后自动把声明了 `dsh.bundle.patch` 的包追加到 profile 的 `dsh.profile.bundles`，因此无需手工改配置。安装后重启 DSH Web profile，客户端 bundle 才会被加载。

## 开发

```powershell
npm test
```

测试分两层：

- `test/subagents-names.test.mjs`：纯函数契约（后代遍历、标题回退、当前轮保护、所有权围栏识别等）。
- `test/client.test.mjs`：把已发布的 `lib/client.js` 按 DSH Web 模块系统的方式加载（捕获 `window.__ModuleLoader__.load` 注册、用桩版 `require` 物化 factory），然后在镜像当前 `@deepseek-ai/dsh-client-*` 契约的假实现上真实运行 slot 注册、注入面、重命名与归档路径。

## 已知限制

- 面板只读取会话列表镜像里已经可见的子代理行；某个子代理从未被加载过目录时，它可能只显示创建标签而还没有持久标题。
- 归档是 DSH 工作区级别的归档：会话日志与记账保留，插件内不提供“取消归档”。
- 面板本地别名只存在当前浏览器；换浏览器或清空站点数据会丢失（持久标题不受影响）。
