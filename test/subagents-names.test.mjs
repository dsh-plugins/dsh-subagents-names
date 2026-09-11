import assert from "node:assert/strict";
import test from "node:test";

import { isSubagentOwnershipError, mergeDisplayName, updateTurnGuard } from "../lib/index.js";

function row(sessionId, options = {}) {
  return { sessionId, running: options.running ?? false };
}

test("首次观察到的运行中轮次会被保守地整体保护", () => {
  const initial = updateTurnGuard(undefined, true, [
    row("current", { running: true }),
    row("already-done"),
  ]);
  assert.deepEqual([...initial.protectedIds].sort(), ["already-done", "current"]);

  const idle = updateTurnGuard(initial, false, [row("current"), row("already-done")]);
  assert.deepEqual([...idle.protectedIds].sort(), ["already-done", "current"]);
});

test("新轮次开始时旧基线可清理，新增与运行中的子代理受保护", () => {
  const first = updateTurnGuard(undefined, false, [row("old")]);
  const active = updateTurnGuard(first, true, [row("old"), row("new")]);

  assert.equal(active.protectedIds.has("old"), false);
  assert.equal(active.protectedIds.has("new"), true);

  const stillRunning = updateTurnGuard(active, true, [row("old"), row("new", { running: true })]);
  assert.equal(stillRunning.protectedIds.has("new"), true);
});

test("守卫不会就地修改上一轮状态", () => {
  const first = updateTurnGuard(undefined, false, [row("a")]);
  const snapshot = new Set(first.protectedIds);
  updateTurnGuard(first, true, [row("a"), row("b", { running: true })]);
  assert.deepEqual([...first.protectedIds], [...snapshot]);
});

test("只识别宿主返回的 `agent-busy` 所有权围栏", () => {
  assert.equal(isSubagentOwnershipError({ code: "agent-busy", message: "owned" }), true);
  assert.equal(isSubagentOwnershipError({ code: "session-not-found" }), false);
  assert.equal(isSubagentOwnershipError({ code: "title-invalid" }), false);
  assert.equal(isSubagentOwnershipError(new Error("agent-busy")), false);
  assert.equal(isSubagentOwnershipError(undefined), false);
  assert.equal(isSubagentOwnershipError(null), false);
});

test("持久标题成功时删除别名，被围栏拒绝时保留别名", () => {
  const start = new Map([["child", "旧名"]]);

  const aliased = mergeDisplayName(start, "child", "新名", false);
  assert.equal(aliased.get("child"), "新名");
  assert.equal(start.get("child"), "旧名", "原别名表不得被就地修改");

  const durable = mergeDisplayName(aliased, "child", "新名", true);
  assert.equal(durable.has("child"), false);
  assert.equal(mergeDisplayName(start, "fresh", "第三者", false).get("fresh"), "第三者");
});
