export const name = "dsh-subagents-names";
export const inject = [];

/**
 * 返回某个会话之下的全部子代理，包含嵌套的 workflow 子代理。
 * 普通会话 fork 只作为遍历节点，本身不会被返回。
 *
 * 这里与运行时的 `indexSubagentDescendants` 规则保持一致（只沿不被普通
 * fork 打断的 `origin: 'subagent'` 谱系），同时给出面板需要的排序结果。
 */
export function descendantRows(byId, rootId) {
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

/**
 * 从某个父会话的目录里读出子代理的持久创建标签。
 *
 * 当前宿主返回 `{ entries: [{ kind: 'child', id, mode, label? }] }`。
 * 目录是“创建标签”的权威来源，会话列表则是“持久标题”的权威来源。
 */
export function labelsFromCatalogs(catalogs) {
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

/**
 * 从已加载的目录里解析某个子代理的直接父地址。
 *
 * `ctx.sessions.subagentAddress(id)` 是首选来源；这里是运行时尚未保留该地址
 * 时的回退路径。
 */
export function catalogEntry(catalogs, id) {
  for (const [parentSessionId, catalog] of Object.entries(catalogs ?? {})) {
    for (const entry of catalog?.entries ?? []) {
      if (entry?.kind === "child" && entry.id === id) return { parentSessionId, entry };
    }
  }
  return undefined;
}

/**
 * 客户端使用的标题回退链：面板本地别名优先，其次是宿主生成的会话标题，
 * 再次是 workflow/创建标签，然后是运行时自己的显示标题，最后是会话 id。
 */
export function summarizeSubagentTitle(row, labels = new Map(), localNames = new Map()) {
  const values = [
    localNames.get(row?.sessionId),
    row?.title,
    labels.get(row?.sessionId),
    row?.displayTitle,
    row?.sessionId,
  ];
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") return value.trim();
  }
  return "未命名子代理";
}

/**
 * 在尊重 DSH 全局归档集合的前提下，拆出未完成/已完成两组可见行。
 */
export function partitionSubagents(rows, archivedSessionIds = []) {
  const archived = new Set(archivedSessionIds);
  const visible = rows.filter((row) => !archived.has(row.sessionId));
  return {
    active: visible.filter((row) => row.running === true),
    completed: visible.filter((row) => row.running !== true),
  };
}

/**
 * 只有不在当前轮里的已完成行才允许归档。
 */
export function canArchiveSubagent(row, protectedSessionIds = new Set()) {
  return Boolean(
    row &&
    row.running !== true &&
    !protectedSessionIds.has(row.sessionId),
  );
}

/**
 * 推进“当前轮保护”这道保守护栏。
 *
 * 首次观察到运行中的父会话时，全部可见后代都会被保护，因为插件无法判断
 * 它们的启动是否就发生在页面挂载前一刻。之后的轮次里，旧基线可以被清理，
 * 而新增的或正在运行的子代理继续保持保护。
 */
export function updateTurnGuard(previous, parentRunning, rows) {
  const ids = new Set(rows.map((row) => row.sessionId));
  const next = {
    initialized: previous?.initialized === true,
    parentRunning: previous?.parentRunning === true,
    baselineIds: new Set(previous?.baselineIds ?? []),
    protectedIds: new Set(previous?.protectedIds ?? []),
  };

  if (!next.initialized) {
    next.initialized = true;
    next.parentRunning = parentRunning;
    next.baselineIds = ids;
    if (parentRunning) {
      next.protectedIds = new Set(ids);
    }
    return next;
  }

  if (parentRunning && !next.parentRunning) {
    next.protectedIds = new Set(rows.filter((row) => row.running === true).map((row) => row.sessionId));
  }

  if (!parentRunning) {
    next.baselineIds = ids;
    next.parentRunning = false;
    return next;
  }

  if (parentRunning) {
    for (const row of rows) {
      if (row.running === true || !next.baselineIds.has(row.sessionId)) {
        next.protectedIds.add(row.sessionId);
      }
    }
  }

  next.parentRunning = parentRunning;
  return next;
}

/**
 * 判断一次重命名失败是否属于宿主对子代理的所有权围栏。
 *
 * 当前宿主对“归子代理路由所有”的会话会以 `agent-busy` 拒绝
 * `session.rename`，客户端只为这一种情况回退到面板本地别名；其余失败都按
 * 真实错误上报。
 */
export function isSubagentOwnershipError(value) {
  if (typeof value !== "object" || value === null) return false;
  return value.code === "agent-busy";
}

/**
 * 把一次重命名结果折算进面板的别名表。
 *
 * 宿主的持久标题优先：写入成功就删掉别名，让面板展示持久标题。被所有权围栏
 * 拒绝的子代理保留别名，因为宿主永远不会为它承载持久标题。
 *
 * @param localNames - 当前别名表（不会被就地修改）。
 * @param sessionId - 被重命名的子代理。
 * @param title - 被接受的标题。
 * @param durable - 宿主是否把它作为持久标题接受。
 * @returns 新的别名表。
 */
export function mergeDisplayName(localNames, sessionId, title, durable) {
  const next = new Map(localNames);
  if (durable === true) next.delete(sessionId);
  else next.set(sessionId, title);
  return next;
}

export function apply() {}
