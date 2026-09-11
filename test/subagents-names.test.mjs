import assert from "node:assert/strict";
import test from "node:test";

import {
  canArchiveSubagent,
  catalogEntry,
  descendantRows,
  isSubagentOwnershipError,
  labelsFromCatalogs,
  mergeDisplayName,
  partitionSubagents,
  summarizeSubagentTitle,
  updateTurnGuard,
} from "../lib/index.js";

function row(sessionId, parentId, options = {}) {
  return {
    sessionId,
    parentId,
    origin: "subagent",
    title: options.title,
    displayTitle: options.displayTitle ?? sessionId,
    running: options.running ?? false,
    updatedAt: options.updatedAt ?? 0,
  };
}

test("能穿过普通 fork 节点找到嵌套子代理", () => {
  const byId = {
    root: { sessionId: "root", parentId: undefined },
    child: row("child", "root"),
    fork: { sessionId: "fork", parentId: "child", origin: undefined },
    grandchild: row("grandchild", "fork", { updatedAt: 2 }),
    unrelated: row("unrelated", "other", { updatedAt: 10 }),
  };

  assert.deepEqual(descendantRows(byId, "root").map((item) => item.sessionId), ["grandchild", "child"]);
});

test("优先使用持久标题，缺失时回退到 workflow 标签", () => {
  assert.equal(
    summarizeSubagentTitle(row("one", "root", { title: "测试用例" }), new Map([["one", "workflow label"]])),
    "测试用例",
  );
  assert.equal(
    summarizeSubagentTitle(row("two", "root"), new Map([["two", "workflow label"]])),
    "workflow label",
  );
  assert.equal(summarizeSubagentTitle(row("three", "root")), "three");
});

test("面板本地别名优先于任何宿主标题", () => {
  assert.equal(
    summarizeSubagentTitle(
      row("one", "root", { title: "durable", displayTitle: "display" }),
      new Map([["one", "catalog"]]),
      new Map([["one", "alias"]]),
    ),
    "alias",
  );
  assert.equal(
    summarizeSubagentTitle(row("one", "root", { title: "  " }), new Map([["one", " catalog "]])),
    "catalog",
  );
});

test("按当前目录结构读取创建标签与地址", () => {
  const catalogs = {
    parent: {
      parentAvailable: true,
      entries: [
        { kind: "child", id: "a", mode: "continuable", label: " worker " },
        { kind: "child", id: "b", mode: "one-shot" },
        { kind: "diagnostic", id: "c", reason: "corrupt" },
      ],
    },
    other: {
      entries: [{ kind: "child", id: "d", mode: "continuable", label: "second" }],
    },
  };

  assert.deepEqual([...labelsFromCatalogs(catalogs)], [["a", "worker"], ["d", "second"]]);
  assert.equal(catalogEntry(catalogs, "d").parentSessionId, "other");
  assert.equal(catalogEntry(catalogs, "d").entry.mode, "continuable");
  assert.equal(catalogEntry(catalogs, "missing"), undefined);
  assert.equal(catalogEntry(catalogs, "c"), undefined);
});

test("拆分未完成/已完成两组，并隐藏已归档行", () => {
  const result = partitionSubagents([
    row("running", "root", { running: true }),
    row("done", "root"),
    row("old", "root"),
  ], ["old"]);

  assert.deepEqual(result.active.map((item) => item.sessionId), ["running"]);
  assert.deepEqual(result.completed.map((item) => item.sessionId), ["done"]);
});

test("只有不在当前轮的已完成子代理可以归档", () => {
  assert.equal(canArchiveSubagent(row("done", "root")), true);
  assert.equal(canArchiveSubagent(row("running", "root", { running: true })), false);
  assert.equal(canArchiveSubagent(row("same-turn", "root"), new Set(["same-turn"])), false);
});

test("首次观察到的运行中轮次会被保守地整体保护", () => {
  const initial = updateTurnGuard(undefined, true, [
    row("current", "root", { running: true }),
    row("already-done", "root"),
  ]);
  assert.deepEqual([...initial.protectedIds].sort(), ["already-done", "current"]);

  const idle = updateTurnGuard(initial, false, [
    row("current", "root"),
    row("already-done", "root"),
  ]);
  assert.deepEqual([...idle.protectedIds].sort(), ["already-done", "current"]);
});

test("新轮次开始时旧基线可清理，新增子代理受保护", () => {
  const first = updateTurnGuard(undefined, false, [row("old", "root")]);
  const active = updateTurnGuard(first, true, [
    row("old", "root"),
    row("new", "root", { running: false }),
  ]);

  assert.equal(active.protectedIds.has("old"), false);
  assert.equal(active.protectedIds.has("new"), true);
  assert.equal(canArchiveSubagent(row("old", "root"), active.protectedIds), true);
  assert.equal(canArchiveSubagent(row("new", "root"), active.protectedIds), false);
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
