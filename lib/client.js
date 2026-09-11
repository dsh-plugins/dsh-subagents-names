window.__ModuleLoader__.load({
  id: "dsh-subagents-names",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const {
      IconAgentPresetOutline16,
      IconCheckOutline16,
      IconCloseOutline16,
      IconEditOutline16,
    } = require("@deepseek-ai/dsh-client-ui-primitives");

    const STYLE_ID = "dsh-subagents-names/client";
    const NAME_STORAGE_KEY = "dsh-subagents-names/display-names";
    const SLOT = "conversation.session.header.actions";
    const css = `
.dsn-root{position:relative;display:inline-flex;min-width:0}
.dsn-trigger{box-sizing:border-box;display:inline-flex;align-items:center;gap:5px;height:28px;max-width:180px;padding:0 8px;border:1px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary,#6b7280);font:inherit;font-size:12px;line-height:18px;cursor:pointer}
.dsn-trigger:hover,.dsn-trigger[aria-expanded=true]{background:var(--dsw-alias-interactive-bg-hover,#f0f4fa);color:var(--dsw-alias-label-primary,#1f2937)}
.dsn-trigger:focus-visible,.dsn-tab:focus-visible,.dsn-row:focus-visible,.dsn-iconButton:focus-visible,.dsn-save:focus-visible,.dsn-cancel:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#3b82f6);outline-offset:1px}
.dsn-triggerLabel{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsn-count{min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:var(--dsw-alias-fill-tertiary,#e5e7eb);color:var(--dsw-alias-label-secondary,#6b7280);font-size:10px;line-height:16px;text-align:center}
.dsn-panel{position:absolute;z-index:1000;top:calc(100% + 8px);right:0;display:flex;flex-direction:column;width:min(460px,calc(100vw - 24px));max-height:min(560px,calc(100vh - 74px));overflow:hidden;border:1px solid var(--dsw-alias-border-primary,#d9dee8);border-radius:9px;background:var(--dsw-alias-bg-primary,#fff);box-shadow:0 14px 38px rgba(20,32,56,.2);color:var(--dsw-alias-label-primary,#20242c)}
.dsn-panelHeader{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px 10px;border-bottom:1px solid var(--dsw-alias-border-secondary,#edf0f5)}
.dsn-heading{min-width:0}
.dsn-title{font-size:14px;font-weight:600;line-height:20px}
.dsn-subtitle{margin-top:2px;overflow:hidden;color:var(--dsw-alias-label-secondary,#7b8493);font-size:11px;line-height:16px;text-overflow:ellipsis;white-space:nowrap}
.dsn-close{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#8c95a3);cursor:pointer}
.dsn-close:hover{background:var(--dsw-alias-interactive-bg-hover,#f0f4fa);color:var(--dsw-alias-label-primary,#20242c)}
.dsn-tabs{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin:10px 12px 6px;padding:4px;border-radius:7px;background:transparent}
.dsn-tab{min-width:0;height:30px;padding:0 8px;border:1px solid #d6e5ff;border-radius:5px;background:#edf4ff;color:#3464a8;font:inherit;font-size:12px;cursor:pointer}
.dsn-tab:hover{border-color:#a9c9ff;background:#e3efff;color:#24599d}
.dsn-tab[data-active=true]{border-color:#3478f6;background:#3478f6;color:#fff;box-shadow:0 1px 2px rgba(34,91,190,.25)}
.dsn-tabCount{margin-left:4px;opacity:.8}
.dsn-list{min-height:72px;overflow:auto;padding:3px 8px 9px}
.dsn-row{display:grid;grid-template-columns:8px minmax(0,1fr) auto;align-items:center;gap:8px;min-height:44px;padding:6px 7px;border:1px solid transparent;border-radius:6px;cursor:pointer}
.dsn-row:hover{border-color:var(--dsw-alias-border-secondary,#e8ecf2);background:var(--dsw-alias-interactive-bg-hover,#f6f8fb)}
.dsn-rowMain{min-width:0;padding-left:var(--dsn-indent,0px)}
.dsn-rowTitle{overflow:hidden;font-size:12px;line-height:18px;text-overflow:ellipsis;white-space:nowrap}
.dsn-rowMeta{display:flex;align-items:center;gap:6px;overflow:hidden;color:var(--dsw-alias-label-tertiary,#8a93a1);font-size:10px;line-height:15px}
.dsn-rowMetaText{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsn-dot{width:7px;height:7px;border-radius:50%;background:#d0d5dd}
.dsn-dot[data-running=true]{background:#20a765;box-shadow:0 0 0 2px rgba(32,167,101,.13)}
.dsn-dot[data-protected=true]{background:#e4a72c}
.dsn-rowActions{display:flex;align-items:center;gap:2px}
.dsn-iconButton,.dsn-save,.dsn-cancel{display:inline-flex;align-items:center;justify-content:center;width:25px;height:25px;padding:0;border:0;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#8a93a1);cursor:pointer}
.dsn-iconButton:hover,.dsn-save:hover,.dsn-cancel:hover{background:var(--dsw-alias-interactive-bg-hover,#eaf0fa);color:var(--dsw-alias-label-primary,#20242c)}
.dsn-iconButton[data-danger=true]:hover{background:var(--dsw-alias-state-error-bg,#fff0f0);color:var(--dsw-alias-state-error-primary,#c73434)}
.dsn-iconButton:disabled{cursor:not-allowed;opacity:.38}
.dsn-edit{display:flex;align-items:center;gap:4px;min-width:0}
.dsn-editInput{box-sizing:border-box;width:190px;max-width:100%;height:27px;padding:0 7px;border:1px solid var(--dsw-alias-border-primary,#cbd3df);border-radius:5px;background:var(--dsw-alias-bg-primary,#fff);color:inherit;font:inherit;font-size:12px;outline:none}
.dsn-editInput:focus{border-color:var(--dsw-alias-brand-primary,#3b82f6);box-shadow:0 0 0 2px rgba(59,130,246,.13)}
.dsn-error{margin:1px 12px 9px;padding:6px 8px;border-radius:5px;background:var(--dsw-alias-state-error-bg,#fff0f0);color:var(--dsw-alias-state-error-primary,#bd3030);font-size:11px;line-height:16px}
.dsn-note{margin:0 12px 9px;color:var(--dsw-alias-label-tertiary,#8a93a1);font-size:11px;line-height:16px}
.dsn-empty{padding:22px 12px 28px;color:var(--dsw-alias-label-tertiary,#8a93a1);font-size:12px;line-height:18px;text-align:center}
@media (max-width:560px){.dsn-panel{position:fixed;top:52px;right:12px;left:12px;width:auto;max-height:calc(100vh - 68px)}.dsn-triggerLabel{display:none}.dsn-trigger{width:30px;padding:0;justify-content:center}.dsn-count{display:none}}
`;

    function installStyles() {
      if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return () => {};
      const style = document.createElement("style");
      style.dataset.plugin = "dsh-subagents-names";
      style.dataset.pluginCss = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
      return () => style.remove();
    }

    function loadDisplayNames() {
      try {
        const raw = window.localStorage.getItem(NAME_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return new Map();
        return new Map(Object.entries(parsed).filter(([id, value]) => typeof id === "string" && typeof value === "string" && value.trim() !== ""));
      } catch {
        return new Map();
      }
    }

    function saveDisplayNames(names) {
      try {
        window.localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify(Object.fromEntries(names)));
      } catch {
        // 浏览器存储被禁用时，面板不应该因此不可用。
      }
    }

    function descendants(byId, rootId) {
      const rows = [];
      for (const row of Object.values(byId ?? {})) {
        if (!row || row.sessionId === rootId || row.origin !== "subagent") continue;
        const seen = new Set();
        let parentId = row.parentId;
        while (typeof parentId === "string" && !seen.has(parentId)) {
          if (parentId === rootId) {
            rows.push(row);
            break;
          }
          seen.add(parentId);
          parentId = byId[parentId]?.parentId;
        }
      }
      return rows.sort((left, right) => {
        const updated = (right.updatedAt ?? 0) - (left.updatedAt ?? 0);
        return updated !== 0 ? updated : String(left.sessionId).localeCompare(String(right.sessionId));
      });
    }

    function labelsFromCatalogs(catalogs) {
      const labels = new Map();
      for (const catalog of Object.values(catalogs ?? {})) {
        for (const entry of catalog?.entries ?? []) {
          if (entry?.kind === "child" && typeof entry.label === "string" && entry.label.trim() !== "") {
            labels.set(entry.id, entry.label.trim());
          }
        }
      }
      return labels;
    }

    function catalogEntry(catalogs, id) {
      for (const [parentSessionId, catalog] of Object.entries(catalogs ?? {})) {
        for (const entry of catalog?.entries ?? []) {
          if (entry?.kind === "child" && entry.id === id) return { parentSessionId, entry };
        }
      }
      return undefined;
    }

    function titleFor(row, labels, localNames) {
      const values = [
        localNames.get(row.sessionId),
        row.title,
        labels.get(row.sessionId),
        row.displayTitle,
        row.sessionId,
      ];
      for (const value of values) {
        if (typeof value === "string" && value.trim() !== "") return value.trim();
      }
      return "未命名子代理";
    }

    function depthOf(row, byId, rootId) {
      let depth = 0;
      let parentId = row.parentId;
      const seen = new Set();
      while (parentId && parentId !== rootId && !seen.has(parentId)) {
        seen.add(parentId);
        depth += 1;
        parentId = byId[parentId]?.parentId;
      }
      return Math.min(depth, 4);
    }

    function advanceTurnGuard(ref, parentRunning, rows) {
      const guard = ref.current;
      const ids = new Set(rows.map((row) => row.sessionId));
      if (!guard.initialized) {
        guard.initialized = true;
        guard.parentRunning = parentRunning;
        guard.baselineIds = ids;
        guard.protectedIds = parentRunning ? new Set(ids) : new Set();
        return guard;
      }
      if (parentRunning && !guard.parentRunning) {
        guard.protectedIds = new Set(rows.filter((row) => row.running === true).map((row) => row.sessionId));
      }
      if (!parentRunning) {
        guard.baselineIds = ids;
        guard.parentRunning = false;
        return guard;
      }
      if (parentRunning) {
        for (const row of rows) {
          if (row.running === true || !guard.baselineIds.has(row.sessionId)) guard.protectedIds.add(row.sessionId);
        }
      }
      guard.parentRunning = parentRunning;
      return guard;
    }

    function errorText(value) {
      if (value instanceof Error && value.message) return value.message;
      if (typeof value === "string") return value;
      if (value !== null && typeof value === "object" && typeof value.message === "string") return value.message;
      return "操作失败，请稍后重试。";
    }

    /**
     * 当前宿主对“归子代理路由所有”的会话会以 `agent-busy` 围栏拒绝
     * `session.rename`：子代理路由拥有那段生命周期，因此浏览器无法为子代理
     * 写入持久标题。
     */
    function isOwnershipRejection(value) {
      return value !== null && typeof value === "object" && value.code === "agent-busy";
    }

    function SubagentManager({ sessionId, useSessions, useWorkspaces, archiveSession, refreshSubagents, setCatalogOpen, resolveSession, openSession }) {
      const list = useSessions((snapshot) => snapshot);
      const archivedSessionIds = useWorkspaces((snapshot) => snapshot.archivedSessionIds ?? []);
      const allRows = React.useMemo(() => descendants(list.byId, sessionId), [list.byId, sessionId]);
      const labels = React.useMemo(() => labelsFromCatalogs(list.subagentsByParent), [list.subagentsByParent]);
      const archived = React.useMemo(() => new Set(archivedSessionIds), [archivedSessionIds]);
      const visibleRows = React.useMemo(() => allRows.filter((row) => !archived.has(row.sessionId)), [allRows, archived]);
      const activeRows = React.useMemo(() => visibleRows.filter((row) => row.running === true), [visibleRows]);
      const completedRows = React.useMemo(() => visibleRows.filter((row) => row.running !== true), [visibleRows]);
      const [open, setOpen] = React.useState(false);
      const [tab, setTab] = React.useState("active");
      const [renameId, setRenameId] = React.useState(null);
      const [draft, setDraft] = React.useState("");
      const [localNames, setLocalNames] = React.useState(loadDisplayNames);
      const [busyId, setBusyId] = React.useState(null);
      const [error, setError] = React.useState("");
      const [durableNotice, setDurableNotice] = React.useState(false);
      const rootRef = React.useRef(null);
      const guardRef = React.useRef({ initialized: false, parentRunning: false, baselineIds: new Set(), protectedIds: new Set() });
      // 注入面里的回调每次渲染都是新的闭包，放进 ref 后副作用只依赖真正的状态，
      // 否则每次渲染都会撤销并重设目录登记。
      const catalogOpenRef = React.useRef(setCatalogOpen);
      const refreshRef = React.useRef(refreshSubagents);
      catalogOpenRef.current = setCatalogOpen;
      refreshRef.current = refreshSubagents;
      const currentTurnGuard = advanceTurnGuard(guardRef, list.byId[sessionId]?.running === true, allRows);
      const activeTab = tab === "active" && activeRows.length === 0 && completedRows.length > 0 ? "completed" : tab;
      const shownRows = activeTab === "active" ? activeRows : completedRows;

      React.useEffect(() => {
        if (!open) return undefined;
        const closeOnOutside = (event) => {
          if (!rootRef.current?.contains(event.target)) setOpen(false);
        };
        const closeOnEscape = (event) => {
          if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", closeOnOutside);
        document.addEventListener("keydown", closeOnEscape);
        return () => {
          document.removeEventListener("pointerdown", closeOnOutside);
          document.removeEventListener("keydown", closeOnEscape);
        };
      }, [open]);

      // 打开面板才是目录成员变化真正被消费的窗口，因此在这段时间里向运行时登记，
      // 关闭时释放。
      React.useEffect(() => {
        const signal = catalogOpenRef.current;
        if (typeof signal !== "function") return undefined;
        signal(open);
        return () => signal(false);
      }, [open]);

      // 面板打开期间刷新本会话与每个已知父会话的直接子目录。
      const parentKey = React.useMemo(
        () => [...new Set([sessionId, ...allRows.map((row) => row.parentId).filter(Boolean)])].sort().join(","),
        [allRows, sessionId],
      );

      React.useEffect(() => {
        if (!open) return undefined;
        const refresh = refreshRef.current;
        if (typeof refresh !== "function") return undefined;
        let cancelled = false;
        Promise.all(parentKey.split(",").filter(Boolean).map((parentId) => refresh(parentId))).catch((cause) => {
          if (!cancelled) setError(errorText(cause));
        });
        return () => {
          cancelled = true;
        };
      }, [open, parentKey]);

      if (allRows.length === 0) return null;

      function beginRename(row) {
        setError("");
        setDurableNotice(false);
        setRenameId(row.sessionId);
        setDraft(titleFor(row, labels, localNames));
      }

      async function commitRename(row) {
        const nextName = draft.trim();
        if (nextName === "") {
          setError("名称不能为空。");
          return;
        }
        setBusyId(row.sessionId);
        setError("");
        try {
          // 优先写持久标题：宿主会为普通会话接受显式用户标题并固定它，阻止
          // 自动重新生成。被所有权围栏拒绝的子代理只会走 `agent-busy` 这一条
          // 分支，此时才回退到插件本地的显示别名。
          const session = typeof resolveSession === "function" ? resolveSession(row.sessionId) : undefined;
          let durable = false;
          let aliased = false;
          if (session && typeof session.rename === "function") {
            const result = await session.rename(nextName);
            durable = result?.ok === true;
            if (!durable) {
              if (isOwnershipRejection(result?.error)) aliased = true;
              else throw result?.error ?? new Error("重命名失败。");
            }
          } else {
            aliased = true;
          }
          setLocalNames((previous) => {
            const next = new Map(previous);
            if (aliased) next.set(row.sessionId, nextName);
            else next.delete(row.sessionId);
            saveDisplayNames(next);
            return next;
          });
          setDurableNotice(durable);
          setRenameId(null);
        } catch (cause) {
          setError(errorText(cause));
        } finally {
          setBusyId(null);
        }
      }

      async function archiveRow(row) {
        const protectedRow = row.running === true || currentTurnGuard.protectedIds.has(row.sessionId);
        if (protectedRow || busyId !== null) return;
        setBusyId(row.sessionId);
        setError("");
        try {
          await archiveSession(row.sessionId);
        } catch (cause) {
          setError(errorText(cause));
        } finally {
          setBusyId(null);
        }
      }

      function selectRow(row) {
        setOpen(false);
        setError("");
        openSession(row, list);
      }

      function renderRow(row) {
        const protectedRow = row.running === true || currentTurnGuard.protectedIds.has(row.sessionId);
        const editing = renameId === row.sessionId;
        const title = titleFor(row, labels, localNames);
        const depth = depthOf(row, list.byId, sessionId);
        return React.createElement("div", {
          className: "dsn-row",
          key: row.sessionId,
          role: "button",
          tabIndex: 0,
          onClick: () => { if (!editing) selectRow(row); },
          onKeyDown: (event) => { if (!editing && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); selectRow(row); } },
        },
          React.createElement("span", { className: "dsn-dot", "data-running": row.running === true, "data-protected": protectedRow, "aria-hidden": true }),
          editing
            ? React.createElement("div", { className: "dsn-edit", style: { "--dsn-indent": `${depth * 14}px` } },
                React.createElement("input", {
                  className: "dsn-editInput",
                  value: draft,
                  autoFocus: true,
                  maxLength: 160,
                  "aria-label": "子代理名称",
                  onChange: (event) => setDraft(event.target.value),
                  onClick: (event) => event.stopPropagation(),
                  onKeyDown: (event) => {
                    if (event.key === "Enter") { event.preventDefault(); void commitRename(row); }
                    if (event.key === "Escape") setRenameId(null);
                  },
                }),
                React.createElement("button", { className: "dsn-save", type: "button", title: "保存名称", "aria-label": "保存名称", disabled: busyId === row.sessionId, onClick: (event) => { event.stopPropagation(); void commitRename(row); } }, React.createElement(IconCheckOutline16, { size: 15, "aria-hidden": true })),
                React.createElement("button", { className: "dsn-cancel", type: "button", title: "取消重命名", "aria-label": "取消重命名", onClick: (event) => { event.stopPropagation(); setRenameId(null); } }, React.createElement(IconCloseOutline16, { size: 14, "aria-hidden": true })),
              )
            : React.createElement("div", { className: "dsn-rowMain", style: { "--dsn-indent": `${depth * 14}px` } },
                React.createElement("div", { className: "dsn-rowTitle", title }, title),
                React.createElement("div", { className: "dsn-rowMeta" },
                  React.createElement("span", { className: "dsn-rowMetaText" }, row.running === true ? "运行中" : protectedRow ? "当前轮 · 已完成" : "已完成"),
                  row.agentPreset ? React.createElement("span", { className: "dsn-rowMetaText", title: row.agentPreset }, row.agentPreset) : null,
                ),
              ),
          React.createElement("div", { className: "dsn-rowActions" },
            React.createElement("button", { className: "dsn-iconButton", type: "button", title: "重命名此子代理", "aria-label": `重命名 ${title}`, onClick: (event) => { event.stopPropagation(); beginRename(row); } }, React.createElement(IconEditOutline16, { size: 15, "aria-hidden": true })),
            activeTab === "completed"
              ? React.createElement("button", { className: "dsn-iconButton", type: "button", "data-danger": true, title: protectedRow ? "当前轮生成的子代理不可清理" : "归档子代理", "aria-label": protectedRow ? `${title} 当前轮不可清理` : `归档 ${title}`, disabled: protectedRow || busyId !== null, onClick: (event) => { event.stopPropagation(); void archiveRow(row); } }, React.createElement(IconCloseOutline16, { size: 15, "aria-hidden": true }))
              : null,
          ),
        );
      }

      return React.createElement("div", { className: "dsn-root", ref: rootRef },
        React.createElement("button", { className: "dsn-trigger", type: "button", "aria-haspopup": "dialog", "aria-expanded": open, title: "子代理", onClick: () => { setError(""); setOpen((value) => !value); } },
          React.createElement(IconAgentPresetOutline16, { size: 16, "aria-hidden": true }),
          React.createElement("span", { className: "dsn-triggerLabel" }, "子代理"),
          React.createElement("span", { className: "dsn-count", "aria-label": `${visibleRows.length} 个子代理` }, String(visibleRows.length)),
        ),
        open
          ? React.createElement("section", { className: "dsn-panel", role: "dialog", "aria-label": "子代理管理" },
              React.createElement("header", { className: "dsn-panelHeader" },
                React.createElement("div", { className: "dsn-heading" },
                  React.createElement("div", { className: "dsn-title" }, "子代理"),
                  React.createElement("div", { className: "dsn-subtitle", title: list.byId[sessionId]?.displayTitle ?? sessionId }, list.byId[sessionId]?.displayTitle ?? sessionId),
                ),
                React.createElement("button", { className: "dsn-close", type: "button", title: "关闭", "aria-label": "关闭子代理面板", onClick: () => setOpen(false) }, React.createElement(IconCloseOutline16, { size: 16, "aria-hidden": true })),
              ),
              React.createElement("div", { className: "dsn-tabs", role: "tablist", "aria-label": "子代理状态" },
                React.createElement("button", { className: "dsn-tab", type: "button", role: "tab", "aria-selected": activeTab === "active", "data-active": activeTab === "active", onClick: () => setTab("active") }, "未完成", React.createElement("span", { className: "dsn-tabCount" }, activeRows.length)),
                React.createElement("button", { className: "dsn-tab", type: "button", role: "tab", "aria-selected": activeTab === "completed", "data-active": activeTab === "completed", onClick: () => setTab("completed") }, "已完成", React.createElement("span", { className: "dsn-tabCount" }, completedRows.length)),
              ),
              durableNotice
                ? React.createElement("div", { className: "dsn-note" }, "已写入会话标题。")
                : null,
              React.createElement("div", { className: "dsn-list", role: "tabpanel" },
                shownRows.length === 0
                  ? React.createElement("div", { className: "dsn-empty" }, activeTab === "active" ? "当前没有运行中的子代理" : "还没有已完成的子代理")
                  : shownRows.map(renderRow),
              ),
              error !== "" ? React.createElement("div", { className: "dsn-error", role: "alert" }, error) : null,
            )
          : null,
      );
    }

    const inject = ["slots", "sessions", "workspaces"];

    function apply(ctx) {
      ctx.effect(installStyles);
      ctx.slots.inject(SLOT, () => ctx.slots.register({
        name: SLOT,
        id: "subagents-names",
        order: -4,
        registrant: "dsh-subagents-names",
        // 会话作用域槽位的 inject 工厂会收到框架解析出的会话 id 作为第一个
        // 参数（见 ui-slots 的 InjectParams），因此目录消费信号正对该条目所
        // 渲染的父会话。
        inject: (sessionId) => ({
          archiveSession: (id) => ctx.workspaces.archiveSession(id),
          refreshSubagents: (id) => ctx.sessions.refreshSubagents(id),
          setCatalogOpen: (open) => ctx.sessions.setSubagentCatalogOpen(sessionId, open),
          resolveSession: (id) => ctx.sessions.binding(id)?.session,
          openSession: (row, list) => {
            const retained = ctx.sessions.subagentAddress(row.sessionId);
            if (retained) {
              ctx.sessions.openSubagent(retained);
              return;
            }
            const found = catalogEntry(list.subagentsByParent, row.sessionId);
            if (found && row.parentId) {
              ctx.sessions.openSubagent({
                parentSessionId: found.parentSessionId,
                childSessionId: row.sessionId,
                mode: found.entry.mode,
              });
              return;
            }
            ctx.sessions.open(row.sessionId);
          },
        }),
      }, SubagentManager));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
