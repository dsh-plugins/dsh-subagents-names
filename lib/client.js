window.__ModuleLoader__.load({
  id: "dsh-subagents-names",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const ReactDOM = require("react-dom");
    const {
      IconCheckOutline14,
      IconChevronDownOutline14,
      IconChevronRightOutline14,
      IconCloseOutline16,
      IconEditOutline16,
      IconRefreshOutline14,
      StateDot,
    } = require("@deepseek-ai/dsh-client-ui-primitives");

    /**
     * 本插件接管官方 single 座席 `conversation.session.header.lineage`
     * （当前由 `@deepseek-ai/dsh-client-ui-subagent` 占用）。接管意味着官方那套
     * 谱系导航要在这里完整重实现：面包屑、兄弟切换、后代计数、目录懒加载、
     * 键盘导航、token/耗时指标。排版与量纲按官方保留，增强点是每行的
     * 「重命名」与「归档」。
     *
     * 这里不声明 locale 命名空间，因此所有文案直接写在组件内。
     */
    const SLOT = "conversation.session.header.lineage";
    const STYLE_ID = "dsh-subagents-names/client";
    const NAME_STORAGE_KEY = "dsh-subagents-names/display-names";
    const MENU_VIEWPORT_MARGIN = 16;

    const css = `
.dsn-root{align-items:center;gap:10px;min-width:0;display:inline-flex;position:relative}
.dsn-switcherRoot{min-width:0;margin-left:6px}
.dsn-trigger,.dsn-switcherTrigger{min-height:28px;color:var(--dsw-alias-label-tertiary);cursor:pointer;background:0 0;border:0;border-radius:6px;align-items:center;padding:3px 2px;font-size:12px;line-height:18px;display:inline-flex}
.dsn-trigger{gap:4px}
.dsn-switcherTrigger{min-width:0;max-width:244px;color:var(--dsw-alias-label-primary);gap:4px;font-weight:500}
.dsn-ancestorSwitcherTrigger{color:var(--dsw-alias-label-tertiary);font-weight:400}
.dsn-switcherTitle{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}
.dsn-switcherTrigger svg{flex:none}
.dsn-separator{color:var(--dsw-alias-label-caption);font-size:14px;line-height:20px}
.dsn-activitySlot{flex:none;width:10px;height:10px;display:inline-flex}
.dsn-trigger:hover,.dsn-trigger:focus-visible{color:var(--dsw-alias-label-secondary)}
.dsn-switcherTrigger:hover,.dsn-switcherTrigger:focus-visible{color:var(--dsw-alias-label-primary)}
.dsn-ancestorSwitcherTrigger:hover,.dsn-ancestorSwitcherTrigger:focus-visible{color:var(--dsw-alias-label-tertiary)}
.dsn-trigger svg,.dsn-switcherTrigger svg{transition:transform .12s}
.dsn-triggerOpen{transform:rotate(180deg)}
.dsn-menu{z-index:100;box-sizing:border-box;background:var(--dsw-specific-menu);--dsh-scrollbar-thumb:var(--dsw-alias-scrollbar-bg-l2);--dsh-scrollbar-thumb-hover:var(--dsw-alias-scrollbar-hover-l2);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);width:336px;max-width:min(400px,100vw - 32px);max-height:min(560px,100vh - 140px);box-shadow:var(--dsw-elevation-prominent);border-radius:20px;flex-direction:column;padding:4px;display:flex;position:fixed;overflow:auto}
.dsn-node{min-width:0;position:relative}
.dsn-menu>.dsn-node{margin-left:-3px}
.dsn-row{box-sizing:border-box;width:100%;min-height:50px;color:var(--dsw-alias-label-primary);cursor:pointer;background:0 0;border:0;border-radius:14px;align-items:center;gap:2px;padding:6px 8px 6px 4px;display:flex}
.dsn-row:hover,.dsn-row:focus-visible{background:var(--dsw-alias-interactive-bg-hover)}
.dsn-row:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.dsn-disabled{cursor:default}
.dsn-loadingRow{opacity:.6}
.dsn-disclosureSpace{flex:none;width:18px}
.dsn-disclosure{flex:none;width:18px;height:18px;padding:0;border:0;border-radius:4px;background:0 0;color:var(--dsw-alias-label-tertiary);cursor:pointer;align-items:center;justify-content:center;display:inline-flex}
.dsn-disclosure:hover{color:var(--dsw-alias-label-primary)}
.dsn-disclosure svg{transition:transform .12s}
.dsn-disclosureOpen svg{transform:rotate(90deg)}
.dsn-clickarea{min-width:0;flex:1;align-items:center;gap:8px;display:flex}
.dsn-children{flex-direction:column;display:flex}
.dsn-currentLabel{color:var(--dsw-alias-label-primary)}
.dsn-content{min-width:0;flex:1;flex-direction:column;gap:2px;display:flex}
.dsn-label{text-overflow:ellipsis;white-space:nowrap;font-size:13px;font-weight:510;line-height:18px;overflow:hidden}
.dsn-summary{color:var(--dsw-alias-label-tertiary);text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:16px;overflow:hidden}
.dsn-metrics{flex:none;flex-direction:column;align-items:flex-end;gap:2px;display:flex;color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px;font-variant-numeric:tabular-nums}
.dsn-actions{flex:none;align-items:center;gap:2px;display:none}
.dsn-row:hover .dsn-actions,.dsn-row:focus-within .dsn-actions{display:inline-flex}
.dsn-action{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;padding:0;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer}
.dsn-action:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dsn-action[data-danger=true]:hover{background:var(--dsw-alias-state-error-bg,#fff0f0);color:var(--dsw-alias-state-error-primary,#c73434)}
.dsn-action:disabled{cursor:not-allowed;opacity:.38}
.dsn-action[data-save=true]{color:#1a9d5f}
.dsn-editRow{gap:4px}
.dsn-editInput{box-sizing:border-box;min-width:0;flex:1;height:26px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;outline:none}
.dsn-editInput:focus{border-color:var(--dsw-alias-brand-primary)}
.dsn-editInput::placeholder{color:var(--dsw-alias-label-tertiary)}
.dsn-editHint{flex:none;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:14px;max-width:96px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsn-editHint[data-error=true]{color:var(--dsw-alias-state-error-primary,#c73434);max-width:none}
.dsn-error{color:var(--dsw-alias-state-error-primary,#c73434);padding:6px 10px;font-size:11px;line-height:16px;display:flex;align-items:center;gap:8px}
.dsn-notice{color:var(--dsw-alias-label-tertiary);padding:10px;font-size:12px;line-height:18px}
`;

    function installStyles() {
      if (typeof document === "undefined") return () => {};
      if (document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`) !== null) return () => {};
      const style = document.createElement("style");
      style.dataset.plugin = "dsh-subagents-names";
      style.dataset.pluginCss = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
      return () => style.remove();
    }

    /* ------------------------------------------------------------------ *
     * 文案与格式化（官方用 locale 命名空间，这里直接内联）
     * ------------------------------------------------------------------ */

    function diagnosticReason(entry) {
      switch (entry.reason) {
        case "corrupt": return "会话记录损坏";
        case "unsupported": return "子代理记录版本不受支持";
        case "unavailable": return "会话记录暂不可用";
        default: return "子代理记录不可用";
      }
    }

    function formatTokens(value) {
      const scaled = (next) => (next >= 100 ? String(Math.round(next)) : String(Math.round(next * 10) / 10));
      if (value < 1e3) return String(value);
      if (value < 1e6) return `${scaled(value / 1e3)}K`;
      return `${scaled(value / 1e6)}M`;
    }

    /** 官方同款：四个互不重叠的 token 用量桶求和。 */
    function tokenTotal(usage) {
      return usage === undefined
        ? undefined
        : usage.uncachedInputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheWriteTokens;
    }

    function activityDuration(summary, activity, now) {
      if (summary === undefined) return undefined;
      const timing = summary.projectionValues?.subagentTiming;
      if (timing === undefined) return undefined;
      if (timing.active === undefined) return timing.settledMs;
      const end = activity === "running" ? now : timing.active.through;
      return timing.settledMs + Math.max(0, end - timing.active.since);
    }

    function splitDuration(ms) {
      const totalSeconds = Math.floor(Math.max(0, ms) / 1e3);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      return {
        seconds: totalSeconds % 60,
        minutes: totalMinutes % 60,
        hours: totalHours % 24,
        days: Math.floor(totalHours / 24),
        totalMinutes,
        totalHours,
      };
    }

    /** 与官方一致：尺度越大视觉精度越低。 */
    function formatDuration(ms) {
      const { seconds, minutes, hours, days, totalMinutes, totalHours } = splitDuration(ms);
      if (days >= 365) {
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        return months === 0 ? `约${years}年` : `约${years}年${months}个月`;
      }
      if (days >= 30) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        return remainingDays === 0 ? `约${months}个月` : `约${months}个月${remainingDays}天`;
      }
      if (days > 0) return hours === 0 ? `${days}天` : `${days}天${hours}小时`;
      if (totalHours > 0) {
        return `${totalHours}小时${String(minutes).padStart(2, "0")}分${String(seconds).padStart(2, "0")}秒`;
      }
      if (totalMinutes > 0) return `${totalMinutes}分${String(seconds).padStart(2, "0")}秒`;
      return `${seconds}秒`;
    }

    /** 悬停与无障碍名称保留精确到秒的计数。 */
    function formatExactDuration(ms) {
      const { seconds, minutes, hours, days } = splitDuration(ms);
      return days === 0
        ? formatDuration(ms)
        : `${days}天${String(hours).padStart(2, "0")}小时${String(minutes).padStart(2, "0")}分${String(seconds).padStart(2, "0")}秒`;
    }

    /* ------------------------------------------------------------------ *
     * 谱系聚合与守卫
     * ------------------------------------------------------------------ */

    const NO_DESCENDANTS = { count: 0, runningCount: 0 };

    /** 与官方 `indexSubagentDescendants` 同一规则：只沿不被普通 fork 打断的谱系。 */
    function indexSubagentDescendants(summaries) {
      const indexed = new Map();
      for (const descendant of Object.values(summaries)) {
        if (descendant.origin !== "subagent") continue;
        const seen = new Set();
        let current = descendant;
        while (current?.origin === "subagent" && current.parentId !== undefined && !seen.has(current.id)) {
          seen.add(current.id);
          const aggregate = indexed.get(current.parentId);
          if (aggregate === undefined) {
            indexed.set(current.parentId, { count: 1, runningCount: descendant.running ? 1 : 0 });
          } else {
            aggregate.count += 1;
            if (descendant.running) aggregate.runningCount += 1;
          }
          current = summaries[current.parentId];
        }
      }
      return indexed;
    }

    function advanceTurnGuard(guard, parentRunning, rows) {
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
      for (const row of rows) {
        if (row.running === true || !guard.baselineIds.has(row.sessionId)) guard.protectedIds.add(row.sessionId);
      }
      guard.parentRunning = parentRunning;
      return guard;
    }

    /* ------------------------------------------------------------------ *
     * 别名存储与标题优先级
     * ------------------------------------------------------------------ */

    function loadDisplayNames() {
      try {
        const raw = window.localStorage.getItem(NAME_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
        const clean = {};
        for (const [id, value] of Object.entries(parsed)) {
          if (typeof id === "string" && typeof value === "string" && value.trim() !== "") clean[id] = value.trim();
        }
        return clean;
      } catch {
        return {};
      }
    }

    function saveDisplayNames(names) {
      try {
        window.localStorage.setItem(NAME_STORAGE_KEY, JSON.stringify(names));
      } catch {
        // 浏览器存储被禁用时不应影响面板可用性。
      }
    }

    /**
     * 面板别名是模块级共享状态：同一时刻页头可能挂着多个下拉实例（面包屑
     * 切换器、当前子代理计数、以及每个展开层级），改名必须在它们之间立即
     * 同步，否则会出现“一个下拉改了、另一个下拉还是旧名”。
     */
    const aliasStore = {
      value: loadDisplayNames(),
      listeners: new Set(),
      get() {
        return this.value;
      },
      subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
      },
      update(mutate) {
        const next = mutate(this.value);
        if (next === this.value) return;
        this.value = next;
        saveDisplayNames(next);
        for (const listener of this.listeners) listener();
      },
    };

    function useAliases() {
      const [, force] = React.useReducer((count) => count + 1, 0);
      React.useEffect(() => aliasStore.subscribe(force), []);
      return aliasStore.get();
    }

    /**
     * 行标题优先级：面板本地别名 → 宿主持久会话标题 → 目录创建标签 → 会话 id。
     *
     * 这是与官方最关键的差异：官方主标签只取目录创建标签
     * （`entry.label ?? entry.id`），所以官方下拉里的名字无法反映重命名。
     */
    function rowTitle(entry, summary, alias) {
      const values = [alias, summary?.title, entry.label, entry.id];
      for (const value of values) {
        if (typeof value === "string" && value.trim() !== "") return value.trim();
      }
      return entry.id;
    }

    function errorText(value) {
      if (value instanceof Error && value.message) return value.message;
      if (typeof value === "string") return value;
      if (value !== null && typeof value === "object" && typeof value.message === "string") return value.message;
      return "操作失败，请稍后重试。";
    }

    /* ------------------------------------------------------------------ *
     * 无依赖组件
     * ------------------------------------------------------------------ */

    function SubagentSwitcherIcon() {
      return React.createElement("svg", {
        width: "16", height: "16", viewBox: "0 0 20 20", fill: "none", "aria-hidden": "true",
      },
        React.createElement("path", {
          d: "M5.99951 12.7L8.95546 14.9478C9.40011 15.2859 9.62244 15.455 9.87526 15.488C9.95774 15.4988 10.0413 15.4988 10.1238 15.488C10.3766 15.455 10.5989 15.2859 11.0436 14.9478L13.9995 12.7",
          stroke: "currentColor", strokeWidth: "1.5",
        }),
        React.createElement("path", {
          d: "M13.9995 7.7417L11.0436 5.49387C10.5989 5.15574 10.3766 4.98668 10.1238 4.95362C10.0413 4.94283 9.95775 4.94283 9.87527 4.95362C9.62245 4.98668 9.40012 5.15574 8.95547 5.49387L5.99952 7.7417",
          stroke: "currentColor", strokeWidth: "1.5",
        }),
      );
    }

    /** 目录尚未水合时，先按已知的直接子会话形状占位。 */
    function CatalogLoadingRows({ parentSessionId, summaries, level }) {
      const children = Object.values(summaries)
        .filter((summary) => summary.origin === "subagent" && summary.parentId === parentSessionId);
      if (children.length === 0) {
        return React.createElement("div", { className: "dsn-notice" }, "正在加载子代理…");
      }
      return children.map((summary) => React.createElement("div", { className: "dsn-node", key: summary.id },
        React.createElement("div", {
          role: "treeitem",
          "aria-disabled": "true",
          "aria-level": level,
          "aria-label": "正在加载子代理",
          className: "dsn-row dsn-disabled dsn-loadingRow",
        },
          React.createElement("span", { className: "dsn-disclosureSpace" }),
          React.createElement(StateDot, { state: summary.running ? "ongoing" : "done" }),
          React.createElement("span", { className: "dsn-content" },
            React.createElement("span", { className: "dsn-label" }, "正在加载子代理…"),
          ),
        ),
      ));
    }

    function treeItems(root) {
      return root === null
        ? []
        : Array.from(root.querySelectorAll('[role="treeitem"]:not([aria-disabled="true"])'));
    }

    /** 菜单定位：贴在触发器下方，且不越出视口边缘。 */
    function catalogMenuPosition(trigger) {
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(336, window.innerWidth - MENU_VIEWPORT_MARGIN * 2);
      return {
        top: rect.bottom + 5,
        left: Math.min(Math.max(MENU_VIEWPORT_MARGIN, rect.left), window.innerWidth - width - MENU_VIEWPORT_MARGIN),
      };
    }

    /* ------------------------------------------------------------------ *
     * 行内重命名编辑器
     * ------------------------------------------------------------------ */

    function RenameEditor({ initial, onCancel, onSubmit }) {
      const [draft, setDraft] = React.useState(initial);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState("");
      const inputRef = React.useRef(null);

      React.useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, []);

      const commit = async () => {
        const next = draft.trim();
        if (next === "") {
          setError("名称不能为空。");
          return;
        }
        setBusy(true);
        setError("");
        try {
          const result = await onSubmit(next);
          if (result?.ok === true) {
            // 成功后立即关闭编辑器：持久标题与本地别名都会让行标题马上变化。
            onCancel();
            return;
          }
          setError(result?.message ?? "重命名失败。");
        } catch (cause) {
          setError(errorText(cause));
        } finally {
          setBusy(false);
        }
      };

      return React.createElement(React.Fragment, null,
        React.createElement("input", {
          ref: inputRef,
          className: "dsn-editInput",
          value: draft,
          maxLength: 160,
          placeholder: "子代理名称",
          "aria-label": "子代理名称",
          disabled: busy,
          onChange: (event) => setDraft(event.target.value),
          onClick: (event) => event.stopPropagation(),
          onKeyDown: (event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              event.stopPropagation();
              void commit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              event.stopPropagation();
              onCancel();
            }
          },
        }),
        error !== "" ? React.createElement("span", { className: "dsn-editHint", "data-error": true, role: "alert" }, error) : null,
        React.createElement("button", {
          type: "button",
          tabIndex: -1,
          className: "dsn-action",
          "data-save": true,
          disabled: busy,
          title: "保存名称",
          "aria-label": "保存名称",
          onClick: (event) => {
            event.preventDefault();
            event.stopPropagation();
            void commit();
          },
        }, React.createElement(IconCheckOutline14, { size: 14, "aria-hidden": true })),
        React.createElement("button", {
          type: "button",
          tabIndex: -1,
          className: "dsn-action",
          disabled: busy,
          title: "取消",
          "aria-label": "取消重命名",
          onClick: (event) => {
            event.preventDefault();
            event.stopPropagation();
            onCancel();
          },
        }, React.createElement(IconCloseOutline16, { size: 14, "aria-hidden": true })),
      );
    }

    /* ------------------------------------------------------------------ *
     * 目录树一行（官方排版 + 行内操作）
     * ------------------------------------------------------------------ */

    function CatalogRows(props) {
      const {
        parentSessionId, currentSessionId, catalog, catalogs, summaries, expanded, level, now, archived,
        openChild, refresh, toggleBranch, closeCatalog, aliases, archiveSession, renameSession,
        protectedIds, editingId, beginEdit, cancelEdit, onError,
      } = props;

      const entries = catalog.entries.filter((entry) => !archived.has(entry.id));
      const emptyLoading = catalog.state === "loading" && catalog.entries.length === 0;
      const reserveDisclosure = entries.some((entry) => entry.kind === "child" && entry.hasChildren);
      const rows = [];

      if (emptyLoading) {
        rows.push(React.createElement(CatalogLoadingRows, { parentSessionId, summaries, level, key: "loading" }));
      }
      if (catalog.state === "error") {
        rows.push(React.createElement("div", { className: "dsn-error", key: "error" },
          React.createElement("span", null, catalog.error?.message ?? "无法加载子代理"),
          React.createElement("button", {
            type: "button",
            className: "dsn-action",
            title: "重试",
            "aria-label": "重试",
            onClick: () => refresh(parentSessionId),
          }, React.createElement(IconRefreshOutline14, {})),
        ));
      }

      for (const entry of entries) {
        if (entry.kind === "diagnostic") {
          const reason = diagnosticReason(entry);
          rows.push(React.createElement("div", { className: "dsn-node", key: entry.id },
            React.createElement("div", {
              role: "treeitem",
              "aria-disabled": "true",
              "aria-level": level,
              "aria-label": `${entry.id} ${reason}`,
              className: "dsn-row dsn-disabled",
              title: reason,
            },
              reserveDisclosure ? React.createElement("span", { className: "dsn-disclosureSpace" }) : null,
              React.createElement(StateDot, { state: "error" }),
              React.createElement("span", { className: "dsn-content" },
                React.createElement("span", { className: "dsn-label" }, entry.id),
                React.createElement("span", { className: "dsn-summary" }, reason),
              ),
            ),
          ));
          continue;
        }

        const childCatalog = catalogs[entry.id];
        const isCurrent = entry.id === currentSessionId;
        const isExpanded = expanded.has(entry.id);
        const knownLeaf = !entry.hasChildren;
        const childLoading = childCatalog === undefined
          || (childCatalog.state === "loading" && childCatalog.entries.length === 0);
        const summary = summaries[entry.id];
        const label = rowTitle(entry, summary, aliases[entry.id]);
        const editing = editingId === entry.id;
        const mode = entry.mode === "one-shot" ? "一次性" : "可继续";
        const activity = entry.activity === "running" ? "正在运行" : "当前未运行";
        const secondary = [summary?.title, mode, activity].filter((value) => value !== undefined).join(" · ");
        const totalTokens = tokenTotal(summary?.projectionValues?.tokenUsage);
        const durationMs = activityDuration(summary, entry.activity, now);
        const tokenMetric = totalTokens === undefined ? undefined : `${formatTokens(totalTokens)} tok`;
        const durationMetric = durationMs === undefined ? undefined : {
          compact: formatDuration(durationMs),
          exact: formatExactDuration(durationMs),
        };
        const metrics = [tokenMetric, durationMetric?.exact].filter((value) => value !== undefined).join(" · ");
        const protectedRow = protectedIds.has(entry.id);
        const canArchive = entry.activity !== "running" && !protectedRow;

        const open = () => {
          openChild({ parentSessionId, childSessionId: entry.id, mode: entry.mode });
          closeCatalog();
        };
        const handleKey = (event) => {
          if (editing) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            event.stopPropagation();
            open();
          } else if ((event.key === "ArrowRight" && !knownLeaf && !isExpanded)
            || (event.key === "ArrowLeft" && isExpanded)) {
            event.preventDefault();
            event.stopPropagation();
            toggleBranch(entry.id);
          }
        };
        const toggle = (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleBranch(entry.id);
        };

        const disclosure = knownLeaf
          ? (reserveDisclosure ? React.createElement("span", { className: "dsn-disclosureSpace" }) : null)
          : React.createElement("button", {
              type: "button",
              tabIndex: -1,
              className: `dsn-disclosure ${isExpanded ? "dsn-disclosureOpen" : ""}`,
              "aria-label": isExpanded ? `收起 ${label} 的下级子代理` : `展开 ${label} 的下级子代理`,
              onClick: toggle,
            }, React.createElement(IconChevronRightOutline14, {}));

        const actions = editing
          ? React.createElement(RenameEditor, {
              initial: label,
              onCancel: cancelEdit,
              onSubmit: (next) => renameSession(entry, next),
            })
          : React.createElement(React.Fragment, null,
              React.createElement("button", {
                type: "button",
                tabIndex: -1,
                className: "dsn-action",
                title: "重命名这个子代理",
                "aria-label": `重命名 ${label}`,
                onClick: (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  beginEdit(entry.id);
                },
              }, React.createElement(IconEditOutline16, { size: 14, "aria-hidden": true })),
              React.createElement("button", {
                type: "button",
                tabIndex: -1,
                className: "dsn-action",
                "data-danger": true,
                disabled: !canArchive,
                title: canArchive
                  ? "归档这个子代理记录"
                  : (protectedRow ? "当前轮生成的子代理不可清理" : "运行中的子代理不可清理"),
                "aria-label": canArchive ? `归档 ${label}` : `${label} 当前不可归档`,
                onClick: (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  Promise.resolve(archiveSession(entry)).catch((cause) => onError(errorText(cause)));
                },
              }, React.createElement(IconCloseOutline16, { size: 14, "aria-hidden": true })),
            );

        rows.push(React.createElement("div", { className: "dsn-node", key: entry.id },
          React.createElement("div", {
            role: "treeitem",
            tabIndex: 0,
            "aria-level": level,
            "aria-current": isCurrent || undefined,
            "aria-label": [editing ? "重命名" : label, secondary, metrics].filter((value) => value !== "").join(" "),
            ...(knownLeaf ? {} : { "aria-expanded": isExpanded }),
            className: `dsn-row ${editing ? "dsn-editRow" : ""}`,
            onClick: editing ? undefined : open,
            onKeyDown: handleKey,
          },
            disclosure,
            editing ? null : React.createElement("div", { className: "dsn-clickarea" },
              React.createElement(StateDot, { state: entry.activity === "running" ? "ongoing" : "done" }),
              React.createElement("span", { className: "dsn-content" },
                React.createElement("span", { className: `dsn-label ${isCurrent ? "dsn-currentLabel" : ""}` }, label),
                React.createElement("span", { className: "dsn-summary" }, secondary),
              ),
              metrics !== "" ? React.createElement("span", { className: "dsn-metrics" },
                tokenMetric !== undefined
                  ? React.createElement("span", { className: "dsn-metricToken" }, tokenMetric)
                  : null,
                durationMetric !== undefined
                  ? React.createElement("span", {
                      className: "dsn-metricDuration",
                      title: `总活跃耗时：${durationMetric.exact}`,
                    }, durationMetric.compact)
                  : null,
              ) : null,
            ),
            React.createElement("span", { className: "dsn-actions" }, actions),
          ),
          isExpanded && !knownLeaf ? React.createElement("div", {
            role: "group",
            className: "dsn-children",
            "aria-busy": childLoading || undefined,
          },
            childCatalog === undefined
              ? React.createElement(CatalogLoadingRows, { parentSessionId: entry.id, summaries, level: level + 1 })
              : React.createElement(CatalogRows, {
                  ...props,
                  parentSessionId: entry.id,
                  catalog: childCatalog,
                  level: level + 1,
                }),
          ) : null,
        ));
      }
      return React.createElement(React.Fragment, null, rows);
    }

    /* ------------------------------------------------------------------ *
     * 触发器 + 菜单
     * ------------------------------------------------------------------ */

    function CatalogDropdown(props) {
      const {
        rootSessionId, currentSessionId, displayTitle, openTitle, variant, separator = false,
        useSessions, useWorkspaces, openChild, refresh, setCatalogOpen,
        archiveSession, sessions, protectedIds,
      } = props;

      const ancestorSwitcher = variant === "switcher" && openTitle !== undefined;
      const aliases = useAliases();
      const catalogs = useSessions((state) => state.subagentsByParent);
      const summaries = useSessions((state) => state.byId);
      const archivedIds = useWorkspaces((state) => state.archivedSessionIds ?? []);
      const archived = React.useMemo(() => new Set(archivedIds), [archivedIds]);
      const catalog = catalogs[rootSessionId];
      const [open, setOpen] = React.useState(false);
      const [menuPosition, setMenuPosition] = React.useState(undefined);
      const [now, setNow] = React.useState(() => Date.now());
      const [expanded, setExpanded] = React.useState(() => new Set());
      const [editingId, setEditingId] = React.useState(null);
      const [actionError, setActionError] = React.useState("");
      const rootRef = React.useRef(null);
      const triggerRef = React.useRef(null);
      const menuRef = React.useRef(null);
      const hoverOpenTimer = React.useRef(undefined);
      const hoverCloseTimer = React.useRef(undefined);
      const observedCatalogs = React.useRef(new Set());
      const setCatalogOpenRef = React.useRef(setCatalogOpen);
      setCatalogOpenRef.current = setCatalogOpen;

      const currentEntry = currentSessionId === undefined
        ? undefined
        : catalog?.entries.find((entry) => entry.kind === "child" && entry.id === currentSessionId);
      const switcherDisplayTitle = currentEntry?.kind === "child"
        ? rowTitle(currentEntry, summaries[currentSessionId], aliases[currentSessionId])
        : displayTitle;
      const healthy = catalog?.entries.filter((entry) => entry.kind === "child") ?? [];
      const descendants = React.useMemo(
        () => indexSubagentDescendants(summaries).get(rootSessionId) ?? NO_DESCENDANTS,
        [rootSessionId, summaries],
      );
      const descendantCount = Math.max(healthy.length, descendants.count);
      const countLabel = descendants.runningCount > 0
        ? `${descendants.runningCount} 个子代理，正在运行`
        : `${descendantCount} 个子代理`;
      const presentedCatalog = (descendants.count > 0 || variant === "switcher")
        && (catalog === undefined || (catalog.state === "ready" && catalog.entries.length === 0))
        ? { entries: [], parentAvailable: catalog?.parentAvailable ?? false, state: "loading", error: null }
        : catalog;

      const observeCatalog = (parentSessionId, next) => {
        if (next) observedCatalogs.current.add(parentSessionId);
        else observedCatalogs.current.delete(parentSessionId);
        setCatalogOpen(parentSessionId, next);
      };
      const closeAllCatalogs = () => {
        for (const parentSessionId of observedCatalogs.current) setCatalogOpen(parentSessionId, false);
        observedCatalogs.current.clear();
        setExpanded(new Set());
      };
      const cancelHoverClose = () => {
        if (hoverCloseTimer.current === undefined) return;
        clearTimeout(hoverCloseTimer.current);
        hoverCloseTimer.current = undefined;
      };
      const cancelHoverOpen = () => {
        if (hoverOpenTimer.current === undefined) return;
        clearTimeout(hoverOpenTimer.current);
        hoverOpenTimer.current = undefined;
      };
      const changeOpen = (next, restoreFocus = false) => {
        cancelHoverOpen();
        cancelHoverClose();
        if (next) {
          const trigger = triggerRef.current;
          if (trigger === null) return;
          setActionError("");
          setEditingId(null);
          setOpen(true);
          setMenuPosition(catalogMenuPosition(trigger));
          setNow(Date.now());
          observeCatalog(rootSessionId, true);
        } else {
          setOpen(false);
          setMenuPosition(undefined);
          setEditingId(null);
          closeAllCatalogs();
        }
        if (restoreFocus) {
          queueMicrotask(() => {
            triggerRef.current?.focus();
          });
        }
      };
      const scheduleHoverOpen = () => {
        cancelHoverOpen();
        cancelHoverClose();
        if (open) return;
        hoverOpenTimer.current = setTimeout(() => {
          hoverOpenTimer.current = undefined;
          changeOpen(true);
        }, 150);
      };
      const scheduleHoverClose = () => {
        cancelHoverOpen();
        cancelHoverClose();
        hoverCloseTimer.current = setTimeout(() => {
          hoverCloseTimer.current = undefined;
          changeOpen(false);
        }, 120);
      };
      const closeBranch = (root) => {
        const closing = new Set();
        const visit = (parentSessionId) => {
          if (closing.has(parentSessionId) || !expanded.has(parentSessionId)) return;
          closing.add(parentSessionId);
          const branch = catalogs[parentSessionId];
          for (const entry of branch?.entries ?? []) if (entry.kind === "child") visit(entry.id);
        };
        visit(root);
        for (const parentSessionId of closing) observeCatalog(parentSessionId, false);
        setExpanded((current) => new Set([...current].filter((id) => !closing.has(id))));
      };
      const toggleBranch = (childSessionId) => {
        if (expanded.has(childSessionId)) {
          closeBranch(childSessionId);
          return;
        }
        setExpanded((current) => new Set(current).add(childSessionId));
        observeCatalog(childSessionId, true);
      };

      React.useEffect(() => {
        if (!open) return undefined;
        const closeOutside = (event) => {
          if (!(event.target instanceof Node)) return;
          if (!rootRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) changeOpen(false);
        };
        document.addEventListener("pointerdown", closeOutside);
        return () => document.removeEventListener("pointerdown", closeOutside);
      }, [open]);

      React.useEffect(() => {
        if (!open) return undefined;
        const placeMenu = () => {
          const trigger = triggerRef.current;
          if (trigger === null) return;
          setMenuPosition(catalogMenuPosition(trigger));
        };
        window.addEventListener("resize", placeMenu);
        document.addEventListener("scroll", placeMenu, true);
        return () => {
          window.removeEventListener("resize", placeMenu);
          document.removeEventListener("scroll", placeMenu, true);
        };
      }, [open]);

      React.useEffect(() => {
        if (!open || descendants.runningCount === 0) return undefined;
        const timer = setInterval(() => setNow(Date.now()), 1e3);
        return () => clearInterval(timer);
      }, [open, descendants.runningCount]);

      React.useEffect(() => () => {
        cancelHoverOpen();
        cancelHoverClose();
        for (const parentSessionId of observedCatalogs.current) {
          setCatalogOpenRef.current(parentSessionId, false);
        }
        observedCatalogs.current.clear();
      }, []);

      const visible = presentedCatalog !== undefined
        && (variant === "switcher"
          || presentedCatalog.state === "error"
          || presentedCatalog.entries.length > 0
          || descendantCount > 0);

      React.useEffect(() => {
        if (visible) return;
        cancelHoverOpen();
        cancelHoverClose();
        if (!open) return;
        setOpen(false);
        closeAllCatalogs();
      }, [visible, open]);

      if (!visible) return null;

      const focusAt = (index) => {
        const items = treeItems(menuRef.current);
        if (items.length === 0) return;
        items[(index + items.length) % items.length]?.focus();
      };
      const navigate = (event) => {
        const items = treeItems(menuRef.current);
        const index = items.indexOf(document.activeElement);
        if (event.key === "Escape") {
          event.preventDefault();
          changeOpen(false, true);
        } else if (event.key === "Home") {
          event.preventDefault();
          focusAt(0);
        } else if (event.key === "End") {
          event.preventDefault();
          focusAt(items.length - 1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          focusAt(index + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          focusAt(index < 0 ? items.length - 1 : index - 1);
        }
      };

      /**
       * 重命名一枚子代理。
       *
       * 优先写宿主持久标题；只有宿主以 `agent-busy` 所有权围栏拒绝时，才把名字
       * 存成面板本地别名。其余失败按真实错误返回。
       */
      const renameSession = async (entry, next) => {
        const session = sessions.binding(entry.id)?.session;
        if (session && typeof session.rename === "function") {
          const result = await session.rename(next);
          if (result?.ok === true) {
            // 持久标题生效后移除别名，交给宿主持久标题显示。
            aliasStore.update((current) => {
              if (!(entry.id in current)) return current;
              const copy = { ...current };
              delete copy[entry.id];
              return copy;
            });
            setEditingId(null);
            return { ok: true };
          }
          const error = result?.error;
          if (error?.code !== "agent-busy") {
            return { ok: false, message: errorText(error) };
          }
        }
        aliasStore.update((current) => ({ ...current, [entry.id]: next }));
        setEditingId(null);
        return { ok: true };
      };

      return React.createElement("div", {
        className: `dsn-root ${variant === "switcher" ? "dsn-switcherRoot" : ""}`,
        ref: rootRef,
        onKeyDown: navigate,
        onMouseEnter: scheduleHoverOpen,
        onMouseLeave: scheduleHoverClose,
      },
        separator ? React.createElement("span", { className: "dsn-separator" }, "/") : null,
        React.createElement("button", {
          ref: triggerRef,
          type: "button",
          className: variant === "switcher"
            ? `dsn-switcherTrigger ${ancestorSwitcher ? "dsn-ancestorSwitcherTrigger" : ""}`
            : "dsn-trigger",
          "aria-haspopup": "tree",
          "aria-expanded": open,
          "aria-label": variant === "switcher" ? `切换子代理：${switcherDisplayTitle}` : countLabel,
          onClick: openTitle === undefined
            ? undefined
            : () => {
                cancelHoverOpen();
                if (open) changeOpen(false);
                openTitle();
              },
          onKeyDown: (event) => {
            if (event.key !== "ArrowDown") return;
            event.preventDefault();
            if (!open) changeOpen(true);
            queueMicrotask(() => focusAt(0));
          },
        },
          variant === "switcher"
            ? React.createElement("span", { className: "dsn-switcherTitle" }, switcherDisplayTitle)
            : React.createElement(React.Fragment, null,
                descendants.runningCount > 0
                  ? React.createElement("span", { className: "dsn-activitySlot" },
                      React.createElement(StateDot, { state: "ongoing" }))
                  : null,
                React.createElement("span", { className: "dsn-count" }, countLabel),
              ),
          variant === "switcher"
            ? React.createElement(SubagentSwitcherIcon, {})
            : React.createElement(IconChevronDownOutline14, { className: open ? "dsn-triggerOpen" : undefined }),
        ),
        open ? ReactDOM.createPortal(
          React.createElement("div", {
            ref: menuRef,
            className: "dsn-menu",
            style: menuPosition,
            role: "tree",
            "aria-label": "子代理",
            onMouseEnter: cancelHoverClose,
            onMouseLeave: scheduleHoverClose,
          },
            actionError !== ""
              ? React.createElement("div", { className: "dsn-error", role: "alert" }, actionError)
              : null,
            React.createElement(CatalogRows, {
              parentSessionId: rootSessionId,
              currentSessionId,
              catalog: presentedCatalog,
              catalogs,
              summaries,
              archived,
              expanded,
              level: 1,
              now,
              openChild,
              refresh,
              toggleBranch,
              closeCatalog: () => changeOpen(false),
              aliases,
              protectedIds,
              archiveSession: (entry) => archiveSession(entry.id),
              renameSession,
              editingId,
              beginEdit: (id) => {
                setActionError("");
                setEditingId(id);
              },
              cancelEdit: () => setEditingId(null),
              onError: setActionError,
            }),
          ),
          document.body,
        ) : null,
      );
    }

    /* ------------------------------------------------------------------ *
     * 座席组件（官方 SubagentHeaderLineage 的增强替代）
     * ------------------------------------------------------------------ */

    function SubagentLineage(props) {
      const {
        lineageSessionId, displayTitle, openTitle, useSessions, useWorkspaces,
        openChild, refresh, setCatalogOpen, sessions, archiveSession,
      } = props;

      const parentId = useSessions((state) => {
        const summary = state.byId[lineageSessionId];
        return summary?.origin === "subagent" ? summary.parentId : undefined;
      });
      const allRows = useSessions((state) => state.byId);
      const parentRunning = allRows[lineageSessionId]?.running === true;
      const guardRef = React.useRef({ initialized: false, parentRunning: false, baselineIds: new Set(), protectedIds: new Set() });
      const protectedIds = React.useMemo(() => {
        const rows = Object.values(allRows).filter((row) => row.origin === "subagent");
        return advanceTurnGuard(guardRef.current, parentRunning, rows).protectedIds;
      }, [allRows, parentRunning]);

      const shared = {
        useSessions, useWorkspaces, sessions, openChild, refresh, setCatalogOpen,
        protectedIds,
        archiveSession,
      };

      if (parentId === undefined) {
        return React.createElement(CatalogDropdown, {
          ...shared,
          key: lineageSessionId,
          rootSessionId: lineageSessionId,
          variant: "count",
          separator: true,
        });
      }
      return React.createElement(React.Fragment, null,
        // 谱系面包屑本身在这里只做导航：加载目录、切换同父兄弟、展开下级。
        React.createElement(CatalogDropdown, {
          ...shared,
          key: lineageSessionId,
          rootSessionId: parentId,
          currentSessionId: lineageSessionId,
          variant: "switcher",
          displayTitle,
          ...(openTitle === undefined ? {} : { openTitle }),
        }),
        // 当前子代理自己的后代计数下拉（官方同款：仅当前子代理拥有）
        openTitle === undefined
          ? React.createElement(CatalogDropdown, {
              ...shared,
              key: `${lineageSessionId}-count`,
              rootSessionId: lineageSessionId,
              variant: "count",
            })
          : null,
      );
    }

    const inject = ["slots", "sessions", "workspaces"];

    function apply(ctx) {
      ctx.effect(installStyles);
      ctx.slots.inject(SLOT, () => ctx.slots.register({
        name: SLOT,
        // 显式给出较低优先级：single 座席同格位同优先级会抛错，动态注册需要
        // 以更低的 priority 胜过官方条目。
        priority: -10,
        registrant: "dsh-subagents-names",
        inject: () => ({
          openChild: (address) => ctx.sessions.openSubagent(address),
          refresh: (parentSessionId) => ctx.sessions.refreshSubagents(parentSessionId),
          setCatalogOpen: (parentSessionId, open) => ctx.sessions.setSubagentCatalogOpen(parentSessionId, open),
          sessions: ctx.sessions,
          archiveSession: (id) => ctx.workspaces.archiveSession(id),
        }),
      }, SubagentLineage));
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
