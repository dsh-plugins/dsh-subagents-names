export const name = "dsh-subagents-names";
export const inject = [];

/**
 * 这个包的宿主半边不做任何事。
 *
 * 客户端半边接管的是官方 single 座席 `conversation.session.header.lineage`：
 * 页面里只存在一个谱系渲染器，因此没有“独立面板”那类需要宿主侧聚合成
 * 持久化的状态。这里导出的纯函数是客户端组件里同源规则的可测副本，便于
 * 在没有浏览器的环境下验证规则本身。
 */

/**
 * 推进“当前轮保护”这道保守护栏。
 *
 * 首次观察到运行中的父会话时，全部可见后代都会被保护，因为插件无法判断
 * 它们的启动是否就发生在页面挂载前一刻。之后的轮次里，旧基线可以被清理，
 * 而新增的或正在运行的子代理继续保持保护。
 *
 * @param previous - 上一轮的守卫状态（首次调用传 undefined）。
 * @param parentRunning - 当前父会话是否在运行。
 * @param rows - 本轮可见的子代理行（需含 sessionId 与 running）。
 * @returns 新的守卫状态（不会就地修改入参）。
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

  for (const row of rows) {
    if (row.running === true || !next.baselineIds.has(row.sessionId)) {
      next.protectedIds.add(row.sessionId);
    }
  }

  next.parentRunning = parentRunning;
  return next;
}

/**
 * 判断一次重命名失败是否属于宿主对子代理的所有权围栏。
 *
 * 当前宿主对“归子代理路由所有”的会话会以 `agent-busy` 拒绝
 * `session.rename`（见 `@deepseek-ai/dsh-api-remotes` 的
 * `apiRemoteSubagentOwnershipError`）。客户端只为这一种失败回退到面板本地
 * 别名，其余失败都按真实错误上报。
 *
 * @param value - `session.rename` 返回的 `error` 字段。
 * @returns 是否为 `agent-busy` 所有权围栏。
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
