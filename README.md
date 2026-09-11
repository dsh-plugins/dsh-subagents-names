# dsh-subagents-names

[English](README.en.md)

`dsh-subagents-names` **增强官方那个子代理下拉**，不是在旁边另做一个面板。

DSH 会话页头的「N 个子代理」下拉、子代理面包屑与兄弟切换器，由官方包
`@deepseek-ai/dsh-client-ui-subagent` 占用座席
`conversation.session.header.lineage`（`kind: 'single'`）。本插件接管这同一个
座席，保留官方那套导航与指标，并补上官方没有的两件事：**重命名**与**归档**。

## 它给官方下拉加了什么

- 每一行右侧出现「重命名」与「归档」两个操作（悬停该行时显示）。
- **重命名**：优先写宿主持久会话标题（`session.rename`），成功后行标题立即更新；
  只有当宿主以 `agent-busy` 所有权围栏拒绝时，才回退为该子代理的**面板本地显示名**。
  其它失败（传输错误、`title-invalid` 等）就地报错，不伪装成功。
- **行标题优先级**：面板本地别名 → 宿主持久会话标题 → 目录创建标签 → 会话 id。
  官方原版只用目录创建标签（`entry.label ?? entry.id`），所以官方下拉里的名字
  无法反映重命名；接管后这一条才成立。
- **归档**：以 DSH 官方工作区归档集合（`ctx.workspaces.archiveSession`）收起该
  子代理记录，会话日志与工作区记账保留。运行中的子代理与当前轮生成的子代理
  不可归档（按钮可见但禁用）。
- 已归档的子代理不再出现在下拉里。

## 接管后原样保留的官方能力

接管 single 座席意味着原版渲染要整套重实现，以下行为按官方实现保留：

| 能力 | 说明 |
| --- | --- |
| 面包屑与兄弟切换 | 子代理会话显示「标题 + 双向箭头」切换器，祖先态用弱化配色 |
| 后代计数触发器 | 普通会话显示 `/` + 「N 个子代理」；有运行中后代时显示运行态圆点与运行文案 |
| 树形目录 | 按层级渲染直接子目录，仅对显式展开的分支递归 |
| 懒加载 | 展开分支时向运行时登记目录消费（`setSubagentCatalogOpen`），未水合时按已知子会话形状占位 |
| 键盘导航 | `ArrowUp/Down`、`Home/End`、`ArrowRight/Left` 展开折叠、`Escape` 收起并回焦、`Enter/Space` 打开 |
| 悬停开合 | 根节点悬停 150ms 打开、移出 120ms 收起（与官方同一时序） |
| 指标 | 每行的持久 token 总量与活跃耗时；运行中的子代理每秒刷新耗时 |
| 诊断行 | 损坏/不受支持/不可用的目录项以禁用行加原因呈现 |
| 错误与重试 | 目录加载失败展示错误文案与重试按钮 |

## 与当前 DSH 的兼容性

按 desktop profile 正在运行的版本核对（DSH `0.1.5-rc.1`，
官方 UI 包同为 `0.1.5-rc.1`）：

| 契约 | 位置 | 本插件的用法 |
| --- | --- | --- |
| 谱系座席 | `conversation.session.header.lineage`（single / session） | `ctx.slots.inject` + `ctx.slots.register`，显式 `priority: -10` 以低于官方默认优先级胜出 |
| 会话列表 | `useSessions` 标准钩子（`SessionListState`） | 读 `byId`（`origin`、`parentId`、`title`、`running`、`agentPreset`、`projectionValues`）与 `subagentsByParent` |
| 工作区列表 | `useWorkspaces` 标准钩子（`WorkspaceListState`） | 读 `archivedSessionIds` |
| 会话面 | `ctx.sessions.binding(id)?.session` | `rename(title)` 写持久标题 |
| 目录 | `ctx.sessions.refreshSubagents` / `setSubagentCatalogOpen` | 展开分支与错误重试时刷新，展开期间登记消费 |
| 导航 | `ctx.sessions.openSubagent(address)` | 行点击 / `Enter` 打开对应地址 |
| 归档 | `ctx.workspaces.archiveSession` | 完成且不受保护的子代理 |

### 为什么子代理改名常常落到本地别名

当前宿主对**归子代理路由所有**的会话会用 `agent-busy` 所有权围栏拒绝
`session.rename`（见 `@deepseek-ai/dsh-api-remotes` 的
`apiRemoteSubagentOwnershipError`）：那段生命周期归子代理路由所有，而子代理的
创建标签写定于创建时刻、事后没有改名接口。因此：

1. 先尝试持久标题；
2. 只在收到 `agent-busy` 围栏时，把名字存为面板本地显示名
   （浏览器 `localStorage`，键 `dsh-subagents-names/display-names`）；
3. 其它失败直接报错。

一旦宿主接受持久标题，该子代理的本地别名会被删除，面板展示持久标题。

### 接管座席的取舍

- 官方包仍会挂载，只是它的 `conversation.session.header.lineage` 条目被本插件
  以更低优先级压过，不再渲染；`conversation.composer` 上的只读编辑器兜底
  （一次性子代理 / 父级离线）不受影响。
- 之后升级 DSH 时，如官方重命名或改动该座席的 owner 契约，需要同步核对本插件的
  props 用例（`lineageSessionId`、`displayTitle`、`openTitle` 与标准 props）。
- 本插件不声明 locale 命名空间，文案直接内置为简体中文。

## 安装

本插件必须装到**你实际运行的 profile**。确认当前 profile：

```powershell
Get-Content "$env:APPDATA\DSH Desktop Beta\profile-selection\state.json"
```

从本地检出安装（推荐，profile 以软链接挂载，改代码即时生效）：

```powershell
dsh plugin --profile desktop add "link:D:\DSH基本工作区\dsh-subagents-names"
```

从 GitHub 安装：

```powershell
dsh plugin --profile desktop add github:dsh-plugins/dsh-subagents-names#main
```

从 npm 安装：

```powershell
dsh plugin --profile desktop add dsh-subagents-names
```

`dsh plugin` 会在 pnpm 完成后自动把声明了 `dsh.bundle.patch` 的包追加到 profile 的
`dsh.profile.bundles`。desktop profile 使用 `patchReload: live`，宿主侧改动即时生效；
**新增客户端 bundle 需要刷新一次页面**。

## 开发

```powershell
npm test
```

两层测试：

- `test/client.test.mjs`：把已发布的 `lib/client.js` 按 DSH Web 模块系统的方式加载
  （捕获 `window.__ModuleLoader__.load` 注册、用桩版 `require` 物化 factory），再在
  镜像当前 `@deepseek-ai/dsh-client-*` 契约的假实现上真实跑一遍：座席注册与优先级、
  注入面、计数触发器与面包屑切换器、目录行渲染、展开登记、行内重命名（持久成功 /
  围栏回退 / 其它失败 / 空名 / Escape）、归档与当前轮保护、导航。
- `test/subagents-names.test.mjs`：宿主半边纯函数（当前轮守卫、所有权围栏识别、
  别名折算）。
- `npm test` 同时执行 `scripts/check-encoding.mjs`，保证所有文本文件为 UTF-8（无 BOM）。

## 已知限制

- 面板只消费会话列表镜像里已经可见的子代理行；目录从未加载过的子代理会先以创建
  标签出现。
- 归档是 DSH 工作区级归档：日志与记账保留，插件内不提供“取消归档”。
- 面板本地别名只存在当前浏览器，换浏览器或清空站点数据会丢失（持久标题不受影响）。
- 重命名对**一次性（one-shot）**子代理没有意义：它不会再被继续调用，改名只影响显示。
