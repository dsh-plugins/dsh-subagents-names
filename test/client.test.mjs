/**
 * dsh-subagents-names 客户端 bundle 契约测试。
 *
 * 客户端半边是浏览器 bundle，因此这里按 DSH Web 模块系统加载它的方式来加载
 * 已发布的 `lib/client.js`：执行脚本、捕获
 * `window.__ModuleLoader__.load({id, factory})` 注册、再用桩版 `require`
 * 物化 factory。之后所有环节——座席注册、注入面、目录树渲染、重命名与归档
 * 路径——都在镜像当前 `@deepseek-ai/dsh-client-*` 契约的假实现上真实运行。
 */
import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLIENT_SOURCE = readFileSync(join(HERE, "..", "lib", "client.js"), "utf8");

/**
 * 测试期间创建的定时器登记表。
 *
 * 组件的耗时指标会在有运行中后代时每秒刷新，测试里不会走真实卸载流程，
 * 因此由 afterEach 统一清理，否则测试进程不会退出。
 */
const liveTimers = new Set();
afterEach(() => {
  for (const timer of liveTimers) {
    clearTimeout(timer);
    clearInterval(timer);
  }
  liveTimers.clear();
});

/** 最小 React 桩：createElement + bundle 实际使用的 hooks。 */
function createReact() {
  let active = false;
  let stored = { state: [], memos: [], effects: [], index: 0 };
  let invalidate = null;

  const element = (type, props, ...children) => {
    const composed = {
      ...(props ?? {}),
      ...(children.length === 0 ? {} : children.length === 1 ? { children: children[0] } : { children }),
    };
    // 真实 React 由渲染器把宿主节点写进 ref；测试桩在这里补上这一步，
    // 否则依赖 triggerRef.current 的定位/打开逻辑会提前返回。
    if (composed.ref && typeof composed.ref === "object") {
      composed.ref.current = { getBoundingClientRect: () => ({ bottom: 40, left: 24 }) };
    }
    // 真实 React 会递归渲染函数组件；测试桩就地展开它们，这样断言可以直接
    // 作用在最终的宿主元素树上。
    if (typeof type === "function") return type(composed);
    return { $$dsnElement: true, type, props: composed };
  };

  const hook = () => {
    assert.ok(active, "hook 在渲染过程之外被调用");
    return stored.index++;
  };
  const sameDeps = (left, right) => {
    if (left === undefined || right === undefined) return false;
    if (left.length !== right.length) return false;
    return left.every((value, index) => Object.is(value, right[index]));
  };

  const react = {
    createElement: element,
    Fragment: Symbol.for("dsn.fragment"),
    useState(initial) {
      const index = hook();
      if (!(index in stored.state)) stored.state[index] = typeof initial === "function" ? initial() : initial;
      return [stored.state[index], (next) => {
        stored.state[index] = typeof next === "function" ? next(stored.state[index]) : next;
        if (invalidate !== null) invalidate();
      }];
    },
    useReducer(reducer, initial) {
      const index = hook();
      if (!(index in stored.state)) stored.state[index] = initial;
      return [stored.state[index], (action) => {
        stored.state[index] = reducer(stored.state[index], action);
        if (invalidate !== null) invalidate();
      }];
    },
    useRef(initial) {
      const index = hook();
      if (!(index in stored.state)) stored.state[index] = { current: initial };
      return stored.state[index];
    },
    useMemo(factory, deps) {
      const index = hook();
      const previous = stored.memos[index];
      if (previous !== undefined && sameDeps(previous.deps, deps)) return previous.value;
      const value = factory();
      stored.memos[index] = { deps, value };
      return value;
    },
    useEffect(effect, deps) {
      const index = hook();
      const previous = stored.effects[index];
      if (previous !== undefined && sameDeps(previous.deps, deps)) return;
      if (previous?.cleanup) previous.cleanup();
      const cleanup = effect();
      stored.effects[index] = { deps, cleanup };
    },
  };

  return {
    react,
    beginRender: () => { stored.index = 0; active = true; },
    setInvalidate: (fn) => { invalidate = fn; },
    resetHooks: () => { stored = { state: [], memos: [], effects: [], index: 0 }; active = false; },
  };
}

/** 极简 DOM 桩：只需要查询接口与 portal 的挂载点。 */
function createDocumentStub() {
  const make = () => ({ children: [], appendChild(node) { this.children.push(node); } });
  return {
    head: make(),
    body: make(),
    querySelector: () => null,
    createElement: () => ({ dataset: {}, textContent: "", remove() {} }),
    addEventListener() {},
    removeEventListener() {},
    activeElement: null,
  };
}

/** 加载并物化已发布的客户端 bundle。 */
function loadBundle(seed = {}) {
  const registration = { id: undefined, factory: undefined };
  const localStorageData = new Map(Object.entries(seed));
  const documentStub = createDocumentStub();

  const windowStub = {
    innerWidth: 1200,
    localStorage: {
      getItem: (key) => (localStorageData.has(key) ? localStorageData.get(key) : null),
      setItem: (key, value) => localStorageData.set(key, value),
    },
    addEventListener() {},
    removeEventListener() {},
    __ModuleLoader__: {
      load: (entry) => {
        registration.id = entry.id;
        registration.factory = entry.factory;
      },
    },
  };

  const icons = new Proxy({}, { get: () => (props) => ({ $$icon: props }) });
  const shim = createReact();
  const sandbox = {
    window: windowStub,
    document: documentStub,
    localStorage: windowStub.localStorage,
    console,
    setTimeout: (fn, ms) => {
      const timer = setTimeout(fn, ms);
      liveTimers.add(timer);
      return timer;
    },
    clearTimeout: (timer) => {
      liveTimers.delete(timer);
      clearTimeout(timer);
    },
    setInterval: (fn, ms) => {
      const timer = setInterval(fn, ms);
      liveTimers.add(timer);
      return timer;
    },
    clearInterval: (timer) => {
      liveTimers.delete(timer);
      clearInterval(timer);
    },
    queueMicrotask,
    Node: class Node {},
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(CLIENT_SOURCE, sandbox, { filename: "lib/client.js" });

  assert.equal(registration.id, "dsh-subagents-names", "bundle 必须以包名注册");

  const requireStub = (specifier) => {
    if (specifier === "react") return shim.react;
    if (specifier === "react-dom") return { createPortal: (node) => node };
    if (specifier === "@deepseek-ai/dsh-client-ui-primitives") return icons;
    throw new Error(`未预期的 require：${specifier}`);
  };

  return {
    exports: registration.factory(requireStub),
    ...shim,
    documentStub,
    localStorageData,
    windowStub,
  };
}

/** 构造假的客户端 ctx 与座席 props。 */
function harness(options = {}) {
  const bundle = loadBundle(options.localStorageSeed ?? {});
  bundle.resetHooks();

  const held = new Map();
  const registration = { options: undefined, component: undefined };
  const calls = { openSubagent: [], refreshSubagents: [], catalogOpen: [], archive: [], rename: [] };

  const ctx = {
    effect: (factory) => {
      factory();
      return () => {};
    },
    slots: {
      inject: (key, callback) => {
        held.set(key, callback);
        return () => held.delete(key);
      },
      register: (opts, component) => {
        registration.options = opts;
        registration.component = component;
        return () => {};
      },
    },
    sessions: {
      list: { getSnapshot: () => ({ current: options.current }) },
      binding: (id) => options.binding?.(id),
      refreshSubagents: (id) => {
        calls.refreshSubagents.push(id);
        return Promise.resolve();
      },
      setSubagentCatalogOpen: (id, open) => calls.catalogOpen.push([id, open]),
      openSubagent: (address) => calls.openSubagent.push(address),
    },
    workspaces: {
      archiveSession: (id) => {
        calls.archive.push(id);
        return options.archiveSession ? options.archiveSession(id) : Promise.resolve();
      },
    },
  };

  bundle.exports.apply(ctx);
  assert.ok(held.has("conversation.session.header.lineage"), "必须接管官方谱系座席");
  // 模拟声明提交：ui-slots 在那一刻运行回调。
  held.get("conversation.session.header.lineage")();

  return attachFlush({ ...bundle, ctx, registration, calls, options });
}

/** 渲染座席组件；props 记忆化，注入面只构造一次。 */
function render(h, props = {}) {
  if (props.lineageSessionId !== undefined || props.rows !== undefined || props.catalogs !== undefined) {
    h.memoizedProps = props;
  }
  const effective = h.memoizedProps ?? {};
  if (h.injected === undefined) h.injected = h.registration.options.inject();
  const rows = effective.rows ?? {};
  const standard = {
    lineageSessionId: effective.lineageSessionId ?? h.options.current,
    displayTitle: effective.displayTitle,
    openTitle: effective.openTitle,
    useSessions: (selector) => selector({ byId: rows, subagentsByParent: effective.catalogs ?? {} }),
    useWorkspaces: (selector) => selector({ archivedSessionIds: effective.archivedSessionIds ?? [] }),
  };
  h.setInvalidate(() => { h.dirty = true; });
  h.beginRender();
  h.latest = h.registration.component({ ...standard, ...h.injected, ...effective.overrides });
  return h.latest;
}

function attachFlush(h) {
  h.flush = () => {
    if (h.dirty !== true) return h.latest;
    h.dirty = false;
    return render(h);
  };
  return h;
}

async function settle(h) {
  for (let round = 0; round < 8; round += 1) {
    await Promise.resolve();
    h.flush();
  }
  return h.latest;
}

/* ------------------------------------------------------------------ *
 * 遍历与事件辅助
 * ------------------------------------------------------------------ */

function walk(element, visit) {
  if (element === null || typeof element !== "object") return;
  if (Array.isArray(element)) {
    for (const child of element) walk(child, visit);
    return;
  }
  if (element.$$dsnElement === true) {
    visit(element);
    walk(element.props.children, visit);
  }
}

function collect(element, match) {
  const found = [];
  walk(element, (node) => { if (match(node)) found.push(node); });
  return found;
}

/** 类名精确匹配（`dsn-action` 与 `dsn-actions` 必须区分开）。 */
const hasClass = (name) => (element) => {
  const className = element.props.className;
  if (typeof className !== "string") return false;
  return className.split(/\s+/).includes(name);
};

function dispatch(element, handler, event = {}, h = undefined) {
  assert.ok(element, `期望存在带 ${handler} 的元素`);
  const fn = element.props[handler];
  assert.equal(typeof fn, "function", `期望存在 ${handler} 处理函数`);
  const result = fn({ preventDefault() {}, stopPropagation() {}, target: {}, key: undefined, ...event });
  if (h !== undefined) h.flush();
  return result;
}

/* ------------------------------------------------------------------ *
 * 夹具
 * ------------------------------------------------------------------ */

const childRow = (sessionId, parentId, extra = {}) => ({
  sessionId,
  parentId,
  origin: "subagent",
  displayTitle: sessionId,
  running: false,
  updatedAt: 0,
  ...extra,
});

const parentRow = (sessionId, extra = {}) => ({
  sessionId,
  displayTitle: sessionId,
  running: false,
  updatedAt: 0,
  ...extra,
});

const catalogEntry = (id, extra = {}) => ({
  kind: "child",
  id,
  activity: "inactive",
  hasChildren: false,
  mode: "continuable",
  label: id,
  ...extra,
});

const readyCatalog = (entries, extra = {}) => ({
  entries,
  parentAvailable: true,
  state: "ready",
  error: null,
  ...extra,
});

/** 打开展的根会话：父会话 + 两个子代理。 */
function openedFixture(overrides = {}) {
  return {
    lineageSessionId: "parent",
    rows: {
      parent: parentRow("parent"),
      a: childRow("a", "parent", { running: true, updatedAt: 2 }),
      b: childRow("b", "parent", { updatedAt: 1 }),
      ...(overrides.rows ?? {}),
    },
    catalogs: {
      parent: readyCatalog([
        catalogEntry("a", { activity: "running", label: "第一个" }),
        catalogEntry("b", { label: "第二个" }),
      ]),
      ...(overrides.catalogs ?? {}),
    },
    ...overrides,
  };
}

/**
 * 渲染并打开下拉，返回当前树。
 *
 * 打开入口分两种（与官方一致）：子代理会话的切换器按钮带 `onClick`；根会话的
 * 计数触发器没有 `onClick`，靠根节点上的 `onMouseEnter` 悬停 150ms 打开。
 */
async function open(h, props) {
  render(h, props);
  const trigger = collect(h.latest, hasClass("dsn-trigger"))[0];
  assert.ok(trigger, "必须渲染计数触发器");
  if (typeof trigger.props.onClick === "function") {
    dispatch(trigger, "onClick", {}, h);
  } else {
    const root = collect(h.latest, hasClass("dsn-root"))[0];
    assert.ok(root, "必须渲染根节点");
    assert.equal(typeof root.props.onMouseEnter, "function", "根节点必须提供悬停打开");
    dispatch(root, "onMouseEnter", {}, h);
    await new Promise((resolve) => setTimeout(resolve, 220));
  }
  await settle(h);
  return h.latest;
}

/** 打开某一行的重命名编辑器。 */
function beginRename(h, label) {
  const button = collect(h.latest, (node) => node.props["aria-label"] === `重命名 ${label}`)[0];
  assert.ok(button, `必须存在「重命名 ${label}」入口`);
  dispatch(button, "onClick", {}, h);
  const input = collect(h.latest, hasClass("dsn-editInput"))[0];
  assert.ok(input, "必须打开行内编辑器");
  return input;
}

function save(h) {
  const button = collect(h.latest, (node) => node.props["data-save"] === true)[0];
  assert.ok(button, "必须存在保存按钮");
  return dispatch(button, "onClick", {}, h);
}

/* ------------------------------------------------------------------ *
 * 座席接管
 * ------------------------------------------------------------------ */

test("接管官方谱系座席，并以显式优先级压过官方条目", () => {
  const h = harness({ current: "parent" });
  assert.equal(h.registration.options.name, "conversation.session.header.lineage");
  assert.equal(h.registration.options.registrant, "dsh-subagents-names");
  // single 座席同格位同优先级会抛错，必须显式低于官方默认的 0。
  assert.ok(h.registration.options.priority < 0, "必须以更低 priority 接管 single 座席");
});

test("注入面暴露官方同款的目录动作", () => {
  const h = harness({ current: "parent" });
  const injected = h.registration.options.inject();
  assert.equal(typeof injected.openChild, "function");
  assert.equal(typeof injected.refresh, "function");
  assert.equal(typeof injected.setCatalogOpen, "function");
  assert.equal(typeof injected.archiveSession, "function");

  const address = { parentSessionId: "parent", childSessionId: "a", mode: "continuable" };
  injected.openChild(address);
  injected.refresh("parent");
  injected.setCatalogOpen("parent", true);
  assert.deepEqual(h.calls.openSubagent, [address]);
  assert.deepEqual(h.calls.refreshSubagents, ["parent"]);
  assert.deepEqual(h.calls.catalogOpen, [["parent", true]]);
});

test("根会话渲染计数触发器，子代理会话渲染面包屑切换器", async () => {
  const h = harness({ current: "parent" });
  render(h, openedFixture());
  const countTrigger = collect(h.latest, hasClass("dsn-trigger"))[0];
  assert.ok(countTrigger, "根会话必须有计数触发器");
  // 有运行中的后代时，无障碍名称切到运行态文案（官方同款）。
  assert.equal(countTrigger.props["aria-label"], "1 个子代理，正在运行");
  assert.equal(collect(h.latest, hasClass("dsn-switcherTrigger")).length, 0);

  const child = harness({ current: "a" });
  render(child, {
    lineageSessionId: "a",
    displayTitle: "父标题",
    rows: { parent: parentRow("parent"), a: childRow("a", "parent") },
    catalogs: { parent: readyCatalog([catalogEntry("a", { label: "目录名" })]) },
  });
  const switcher = collect(child.latest, hasClass("dsn-switcherTrigger"))[0];
  assert.ok(switcher, "子代理会话必须有兄弟切换器");
  assert.equal(collect(child.latest, hasClass("dsn-switcherTitle"))[0].props.children, "目录名");
});

/* ------------------------------------------------------------------ *
 * 菜单内容
 * ------------------------------------------------------------------ */

test("菜单按目录渲染行，并保留模式与运行状态", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, openedFixture());

  assert.deepEqual(
    collect(tree, hasClass("dsn-label")).map((node) => node.props.children),
    ["第一个", "第二个"],
  );
  const summaries = collect(tree, hasClass("dsn-summary")).map((node) => node.props.children);
  assert.ok(summaries[0].includes("可继续"), `副标题应含模式：${summaries[0]}`);
  assert.ok(summaries[0].includes("正在运行"), `副标题应含活动：${summaries[0]}`);
});

test("行标题优先级：持久标题优先于目录创建标签", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, {
    lineageSessionId: "parent",
    rows: {
      parent: parentRow("parent"),
      a: childRow("a", "parent", { title: "持久标题" }),
    },
    catalogs: { parent: readyCatalog([catalogEntry("a", { label: "目录标签" })]) },
  });
  // 这是与官方的关键差异：官方主标签只用 entry.label。
  assert.deepEqual(
    collect(tree, hasClass("dsn-label")).map((node) => node.props.children),
    ["持久标题"],
  );
});

test("每行都提供重命名入口；运行中的行归档按钮禁用", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, openedFixture());

  assert.equal(collect(tree, (node) => node.props["aria-label"]?.startsWith("重命名 ")).length, 2);

  const archiveButtons = collect(tree, (node) => node.props["data-danger"] === true);
  assert.equal(archiveButtons.length, 2);
  assert.equal(archiveButtons[0].props.disabled, true, "运行中的子代理不可归档");
  assert.equal(archiveButtons[1].props.disabled, false);
});

test("展开分支会向运行时登记子目录消费", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, {
    lineageSessionId: "parent",
    rows: {
      parent: parentRow("parent"),
      a: childRow("a", "parent"),
      a1: childRow("a1", "a"),
    },
    catalogs: {
      parent: readyCatalog([catalogEntry("a", { hasChildren: true })]),
      a: readyCatalog([catalogEntry("a1", { label: "孙代" })]),
    },
  });

  const disclosure = collect(tree, hasClass("dsn-disclosure"))[0];
  assert.ok(disclosure, "有下级的行必须渲染展开控件");
  dispatch(disclosure, "onClick", {}, h);

  assert.ok(h.calls.catalogOpen.some(([id, value]) => id === "a" && value === true));
  assert.deepEqual(
    collect(h.latest, hasClass("dsn-label")).map((node) => node.props.children),
    ["a", "孙代"],
  );
});

test("已归档的子代理不出现在菜单里", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, { ...openedFixture(), archivedSessionIds: ["a"] });
  assert.deepEqual(
    collect(tree, hasClass("dsn-label")).map((node) => node.props.children),
    ["第二个"],
  );
});

test("空目录显示加载占位，错误目录显示错误与重试", async () => {
  const h = harness({ current: "parent" });
  const loading = await open(h, {
    lineageSessionId: "parent",
    rows: { parent: parentRow("parent"), a: childRow("a", "parent") },
    catalogs: { parent: { entries: [], parentAvailable: true, state: "loading", error: null } },
  });
  // 目录尚未水合时，先用已知的直接子会话形状占位（官方同款）。
  assert.equal(collect(loading, hasClass("dsn-loadingRow")).length, 1);
  assert.equal(collect(loading, hasClass("dsn-notice")).length, 0);

  const errored = await open(h, {
    lineageSessionId: "parent",
    rows: { parent: parentRow("parent"), a: childRow("a", "parent") },
    catalogs: { parent: { entries: [], parentAvailable: true, state: "error", error: { message: "炸了" } } },
  });
  const errorBox = collect(errored, hasClass("dsn-error"))[0];
  assert.ok(errorBox, "错误目录必须渲染错误行");
  assert.ok(collect(errorBox, hasClass("dsn-action")).length >= 1, "错误行必须提供重试按钮");
});

/* ------------------------------------------------------------------ *
 * 重命名路径
 * ------------------------------------------------------------------ */

test("宿主接受时写入持久标题，并清掉同 id 的本地别名", async () => {
  // 别名 store 在 bundle 物化时读取 localStorage，预置数据必须早于 harness。
  const h = harness({
    current: "parent",
    localStorageSeed: { "dsh-subagents-names/display-names": JSON.stringify({ a: "旧别名" }) },
    binding: (id) => (id === "a"
      ? {
          session: {
            rename: (title) => {
              h.calls.rename.push(title);
              return Promise.resolve({ ok: true, value: { title, seq: 3 } });
            },
          },
        }
      : undefined),
  });

  await open(h, openedFixture());
  beginRename(h, "旧别名");
  dispatch(collect(h.latest, hasClass("dsn-editInput"))[0], "onChange", { target: { value: "新名字" } }, h);
  await save(h);
  await settle(h);

  assert.deepEqual(h.calls.rename, ["新名字"]);
  assert.equal(h.localStorageData.get("dsh-subagents-names/display-names"), "{}", "持久标题生效后不应保留别名");
});

test("被 agent-busy 围栏拒绝时回退为面板本地别名", async () => {
  const h = harness({
    current: "parent",
    binding: (id) => (id === "b"
      ? {
          session: {
            rename: (title) => {
              h.calls.rename.push(title);
              return Promise.resolve({
                ok: false,
                error: { code: "agent-busy", message: "owned by subagent routing", details: {} },
              });
            },
          },
        }
      : undefined),
  });
  await open(h, openedFixture());
  beginRename(h, "第二个");
  dispatch(collect(h.latest, hasClass("dsn-editInput"))[0], "onChange", { target: { value: "本地名" } }, h);
  await save(h);
  await settle(h);

  assert.deepEqual(h.calls.rename, ["本地名"]);
  assert.equal(h.localStorageData.get("dsh-subagents-names/display-names"), JSON.stringify({ b: "本地名" }));
  assert.deepEqual(
    collect(h.latest, hasClass("dsn-label")).map((node) => node.props.children),
    ["第一个", "本地名"],
  );
});

test("非所有权类失败会就地报错，不写别名也不关闭编辑器", async () => {
  const h = harness({
    current: "parent",
    binding: () => ({
      session: { rename: () => Promise.resolve({ ok: false, error: { code: "internal", message: "boom", details: {} } }) },
    }),
  });
  await open(h, openedFixture());
  beginRename(h, "第一个");
  dispatch(collect(h.latest, hasClass("dsn-editInput"))[0], "onChange", { target: { value: "x" } }, h);
  await save(h);
  await settle(h);

  const error = collect(h.latest, (node) => node.props["data-error"] === true)[0];
  assert.equal(error.props.children, "boom");
  assert.equal(h.localStorageData.has("dsh-subagents-names/display-names"), false, "失败不应写入别名");
  assert.ok(collect(h.latest, hasClass("dsn-editInput"))[0], "失败后编辑器应保持打开");
});

test("空名称被就地拒绝，不调用宿主", async () => {
  const h = harness({
    current: "parent",
    binding: () => ({ session: { rename: () => Promise.resolve({ ok: true, value: { title: "x", seq: 1 } }) } }),
  });
  await open(h, openedFixture());
  beginRename(h, "第一个");
  dispatch(collect(h.latest, hasClass("dsn-editInput"))[0], "onChange", { target: { value: "   " } }, h);
  await save(h);
  await settle(h);

  assert.deepEqual(h.calls.rename, []);
  assert.equal(
    collect(h.latest, (node) => node.props["data-error"] === true)[0].props.children,
    "名称不能为空。",
  );
});

test("Escape 取消编辑且不触发任何重命名", async () => {
  const h = harness({ current: "parent" });
  await open(h, openedFixture());
  const input = beginRename(h, "第一个");
  dispatch(input, "onKeyDown", { key: "Escape" }, h);

  assert.equal(collect(h.latest, hasClass("dsn-editInput")).length, 0);
  assert.deepEqual(h.calls.rename, []);
});

/* ------------------------------------------------------------------ *
 * 归档路径
 * ------------------------------------------------------------------ */

test("完成且不受保护的子代理通过工作区归档", async () => {
  const h = harness({ current: "parent" });
  await open(h, openedFixture());
  const archive = collect(h.latest, (node) => node.props["data-danger"] === true)[1];
  assert.equal(archive.props.disabled, false);
  dispatch(archive, "onClick", {}, h);
  await settle(h);

  assert.deepEqual(h.calls.archive, ["b"]);
});

test("归档失败会显示错误行", async () => {
  const h = harness({ current: "parent", archiveSession: () => Promise.reject(new Error("归档炸了")) });
  await open(h, openedFixture());
  dispatch(collect(h.latest, (node) => node.props["data-danger"] === true)[1], "onClick", {}, h);
  await settle(h);

  assert.equal(collect(h.latest, hasClass("dsn-error"))[0].props.children, "归档炸了");
});

test("当前轮生成的子代理保持受保护", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, {
    lineageSessionId: "parent",
    rows: {
      parent: parentRow("parent", { running: true }),
      a: childRow("a", "parent"),
      b: childRow("b", "parent"),
    },
    catalogs: { parent: readyCatalog([catalogEntry("a"), catalogEntry("b")]) },
  });

  const archives = collect(tree, (node) => node.props["data-danger"] === true);
  assert.equal(archives.length, 2);
  assert.ok(archives.every((node) => node.props.disabled === true), "当前轮子代理的归档必须禁用");
});

/* ------------------------------------------------------------------ *
 * 导航
 * ------------------------------------------------------------------ */

test("点击行按目录地址打开子代理并收起菜单", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, openedFixture());
  dispatch(collect(tree, (node) => node.props.role === "treeitem")[0], "onClick", {}, h);

  // bundle 与测试运行在不同 realm，对象原型不同，因此比较序列化结果。
  assert.equal(
    JSON.stringify(h.calls.openSubagent),
    JSON.stringify([{ parentSessionId: "parent", childSessionId: "a", mode: "continuable" }]),
  );
  assert.deepEqual(h.calls.catalogOpen.at(-1), ["parent", false], "打开后必须收起菜单");
});

test("键盘 Enter 也能打开子代理", async () => {
  const h = harness({ current: "parent" });
  const tree = await open(h, openedFixture());
  dispatch(collect(tree, (node) => node.props.role === "treeitem")[0], "onKeyDown", { key: "Enter" }, h);

  assert.equal(
    JSON.stringify(h.calls.openSubagent),
    JSON.stringify([{ parentSessionId: "parent", childSessionId: "a", mode: "continuable" }]),
  );
});
