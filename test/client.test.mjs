/**
 * dsh-subagents-names 客户端 bundle 契约测试。
 *
 * 客户端半边是浏览器 bundle，因此这里按 DSH Web 模块系统加载它的方式来加载
 * 已发布的 `lib/client.js`：执行脚本、捕获
 * `window.__ModuleLoader__.load({id, factory})` 注册、再用桩版 `require`
 * 物化 factory。之后的所有环节——slot 注册、注入面、组件里的重命名与归档
 * 路径——都在镜像当前 `@deepseek-ai/dsh-client-*` 契约的假实现上真实运行。
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import vm from "node:vm";

const HERE = dirname(fileURLToPath(import.meta.url));
const CLIENT_SOURCE = readFileSync(join(HERE, "..", "lib", "client.js"), "utf8");

/**
 * 最小 React 桩：只覆盖 `createElement` 与 bundle 实际使用的 hooks。
 * 状态按 hook 槽位跨渲染持久保存，与真实函数组件一致。
 */
function createReact() {
  let render = null;
  let stored = { state: [], memos: [], effects: [] };
  let invalidate = null;

  const element = (type, props, ...children) => ({
    $$dsnElement: true,
    type,
    props: {
      ...(props ?? {}),
      ...(children.length === 0 ? {} : children.length === 1 ? { children: children[0] } : { children }),
    },
  });

  const hook = () => {
    assert.ok(render !== null, "hook 在渲染过程之外被调用");
    return render.index++;
  };

  const sameDeps = (left, right) => {
    if (left === undefined || right === undefined) return false;
    if (left.length !== right.length) return false;
    return left.every((value, index) => Object.is(value, right[index]));
  };

  const react = {
    createElement: element,
    useState(initial) {
      const index = hook();
      if (!(index in stored.state)) stored.state[index] = typeof initial === "function" ? initial() : initial;
      return [
        stored.state[index],
        (next) => {
          stored.state[index] = typeof next === "function" ? next(stored.state[index]) : next;
          // 真实组件在写入状态后会重新渲染；测试桩只做脏标记，由 dispatch
          // 在事件处理返回后统一刷新。
          if (invalidate !== null) invalidate();
        },
      ];
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
    element,
    beginRender: () => { render = { index: 0 }; },
    setInvalidate: (fn) => { invalidate = fn; },
    resetHooks: () => { stored = { state: [], memos: [], effects: [] }; },
  };
}

/** 加载并物化已发布的客户端 bundle。 */
function loadBundle() {
  const registration = { id: undefined, factory: undefined };
  const localStorageData = new Map();
  const styleElements = [];

  const documentStub = {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, textContent: "", remove() {} }),
    head: { appendChild: (element) => styleElements.push(element) },
    addEventListener() {},
    removeEventListener() {},
  };
  const windowStub = {
    localStorage: {
      getItem: (key) => (localStorageData.has(key) ? localStorageData.get(key) : null),
      setItem: (key, value) => localStorageData.set(key, value),
    },
    __ModuleLoader__: {
      load: (entry) => {
        registration.id = entry.id;
        registration.factory = entry.factory;
      },
    },
  };

  const icons = {
    IconAgentPresetOutline16: (props) => ({ $$icon: "agent", props }),
    IconCheckOutline16: (props) => ({ $$icon: "check", props }),
    IconCloseOutline16: (props) => ({ $$icon: "close", props }),
    IconEditOutline16: (props) => ({ $$icon: "edit", props }),
  };

  const shim = createReact();
  const sandbox = { window: windowStub, document: documentStub, localStorage: windowStub.localStorage, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(CLIENT_SOURCE, sandbox, { filename: "lib/client.js" });

  assert.equal(registration.id, "dsh-subagents-names", "bundle 必须以包名注册");

  const requireStub = (specifier) => {
    if (specifier === "react") return shim.react;
    if (specifier === "@deepseek-ai/dsh-client-ui-primitives") return icons;
    throw new Error(`未预期的 require：${specifier}`);
  };

  const exports = registration.factory(requireStub);
  return { exports, ...shim, documentStub, localStorageData, styleElements };
}

/** 构造假的客户端 ctx，记录注册项与注入面。 */
function harness(options = {}) {
  const bundle = loadBundle();
  bundle.resetHooks();

  const effects = [];
  const held = new Map();
  const registration = { options: undefined, component: undefined };
  const calls = {
    archiveSession: [],
    refreshSubagents: [],
    catalogOpen: [],
    openSubagent: [],
    open: [],
    rename: [],
  };

  const current = options.current ?? "parent";
  const ctx = {
    effect: (factory) => {
      effects.push(factory());
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
      list: { getSnapshot: () => ({ current }) },
      binding: (id) => options.binding?.(id),
      refreshSubagents: (id) => {
        calls.refreshSubagents.push(id);
        return Promise.resolve();
      },
      setSubagentCatalogOpen: (id, open) => calls.catalogOpen.push([id, open]),
      subagentAddress: (id) => options.addresses?.[id],
      openSubagent: (address) => calls.openSubagent.push(address),
      open: (id) => calls.open.push(id),
    },
    workspaces: {
      archiveSession: (id) => {
        calls.archiveSession.push(id);
        return options.archiveSession ? options.archiveSession(id) : Promise.resolve();
      },
    },
  };

  bundle.exports.apply(ctx);
  assert.ok(held.has("conversation.session.header.actions"), "必须申请会话页头动作座席");
  // 模拟声明已提交：ui-slots 会在那一刻运行回调。
  const disposer = held.get("conversation.session.header.actions")();
  assert.equal(typeof disposer, "function", "注入回调必须返回注册释放器");

  return attachFlush({ ...bundle, ctx, effects, registration, calls, current });
}

/**
 * 渲染注册的组件。渲染使用记忆化的 props，并缓存注入面（真实的 ui-slots
 * 只为每条注册构造一次注入面）。
 *
 * 状态写入不在这里立刻重渲染：真实 React 会在事件处理返回之后重渲染，
 * 因此由 `dispatch` 标记脏状态、再由 `h.flush()` 统一刷新。
 */
function render(h, props = {}) {
  if (props.byId !== undefined || props.subagentsByParent !== undefined || props.archivedSessionIds !== undefined) {
    h.memoizedProps = props;
  }
  const effective = h.memoizedProps ?? {};
  const { registration } = h;
  if (h.injected === undefined) h.injected = registration.options.inject(h.current);
  const standard = {
    sessionId: h.current,
    useSessions: (selector) => selector({ byId: effective.byId ?? {}, subagentsByParent: effective.subagentsByParent ?? {} }),
    useWorkspaces: (selector) => selector({ archivedSessionIds: effective.archivedSessionIds ?? [] }),
  };
  h.setInvalidate(() => { h.dirty = true; });
  h.beginRender();
  h.latest = registration.component({ ...standard, ...h.injected, ...effective.overrides });
  return h.latest;
}

/** 遍历元素树，收集所有满足 `match` 的元素。 */
function find(element, match, found = []) {
  if (element === null || typeof element !== "object") return found;
  if (Array.isArray(element)) {
    for (const child of element) find(child, match, found);
    return found;
  }
  if (element.$$dsnElement === true) {
    if (match(element)) found.push(element);
    find(element.props.children, match, found);
  }
  return found;
}

const byClass = (name) => (element) => element.props.className === name;

/**
 * 转发一次 React 事件；事件处理返回后，只要组件写过状态就重渲染一次，
 * 与真实 React 的“事件结束后刷新”一致。传入 harness 即可获得自动刷新。
 */
function dispatch(element, handler, event = {}, h = undefined) {
  assert.ok(element, `期望存在带 ${handler} 的元素`);
  const fn = element.props[handler];
  assert.equal(typeof fn, "function", `期望存在 ${handler} 处理函数`);
  const result = fn({
    preventDefault() {},
    stopPropagation() {},
    target: {},
    key: undefined,
    ...event,
  });
  if (h !== undefined) h.flush();
  return result;
}

/** 组件生命周期内的重渲染入口。 */
function attachFlush(h) {
  h.flush = () => {
    if (h.dirty !== true) return h.latest;
    h.dirty = false;
    return render(h);
  };
  return h;
}

/**
 * 等待组件内部异步动作（renaming / archiving）落定。
 *
 * `commitRename` 是 async 函数，事件处理器用 `void` 丢弃了它的 promise
 * （真实浏览器里也一样），所以测试需要显式把微任务队列推空，再刷新渲染。
 */
async function settle(h) {
  for (let round = 0; round < 8; round += 1) {
    await Promise.resolve();
    h.flush();
  }
  return h.latest;
}

const childRow = (sessionId, parentId, extra = {}) => ({
  sessionId,
  parentId,
  origin: "subagent",
  displayTitle: sessionId,
  running: false,
  updatedAt: 0,
  ...extra,
});

test("通过 ctx.effect 安装样式，并只注册一个页头动作条目", () => {
  const h = harness();
  assert.equal(h.registration.options.name, "conversation.session.header.actions");
  assert.equal(h.registration.options.id, "subagents-names");
  assert.equal(h.registration.options.order, -4);
  assert.equal(typeof h.registration.options.inject, "function");
  assert.equal(h.effects.length, 1, "样式副作用必须属于插件 fiber");
  assert.equal(h.documentStub.head.appendChild !== undefined, true);
});

test("会话没有任何子代理时完全不渲染", () => {
  const h = harness();
  assert.equal(render(h, { byId: {} }), null);
});

test("渲染触发器，统计全部可见后代并隐藏已归档项", () => {
  const byId = {
    parent: { sessionId: "parent", displayTitle: "父会话", running: false },
    a: childRow("a", "parent", { running: true, updatedAt: 2 }),
    b: childRow("b", "parent", { updatedAt: 1 }),
    c: childRow("c", "b", { updatedAt: 0 }),
  };
  const h = harness();
  const tree = render(h, { byId });
  const trigger = find(tree, byClass("dsn-trigger"))[0];
  assert.ok(trigger, "必须渲染触发器");
  assert.equal(find(trigger, byClass("dsn-count"))[0].props.children, "3");

  const archived = render(h, { byId, archivedSessionIds: ["c"] });
  assert.equal(find(archived, byClass("dsn-count"))[0].props.children, "2");
});

test("标题优先级：持久标题 > 目录标签 > 会话 id", () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    titled: childRow("titled", "parent", { title: "持久标题", updatedAt: 3 }),
    labelled: childRow("labelled", "parent", { updatedAt: 2 }),
    bare: childRow("bare", "parent", { updatedAt: 1 }),
  };
  const subagentsByParent = {
    parent: {
      parentAvailable: true,
      entries: [
        { kind: "child", id: "titled", mode: "continuable", label: "目录标签" },
        { kind: "child", id: "labelled", mode: "continuable", label: "目录标签" },
        { kind: "child", id: "bare", mode: "one-shot" },
      ],
    },
  };
  const h = harness();
  render(h, { byId, subagentsByParent });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  const titles = find(h.latest, byClass("dsn-rowTitle")).map((element) => element.props.children);
  assert.deepEqual(titles, ["持久标题", "目录标签", "bare"]);
});

test("默认停留在未完成页签，不会把已完成项当作运行中", () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    live: childRow("live", "parent", { running: true, updatedAt: 2 }),
    done: childRow("done", "parent", { updatedAt: 1 }),
  };
  const h = harness();
  const tree = render(h, { byId });
  dispatch(find(tree, byClass("dsn-trigger"))[0], "onClick", {}, h);

  const tabs = find(h.latest, byClass("dsn-tab"));
  assert.equal(tabs[0].props["aria-selected"], true);
  assert.equal(tabs[0].props.children[1].props.children, 1);
  assert.equal(tabs[1].props.children[1].props.children, 1);
  assert.deepEqual(find(h.latest, byClass("dsn-rowTitle")).map((element) => element.props.children), ["live"]);
});

test("打开面板会登记目录消费并向每个父会话请求刷新", async () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const h = harness();
  globalThis.__DSN_DEBUG__ = true;
  const tree = render(h, { byId });
  dispatch(find(tree, byClass("dsn-trigger"))[0], "onClick", {}, h);
  globalThis.__DSN_DEBUG__ = false;

  assert.ok(find(h.latest, byClass("dsn-panel"))[0], "点击后面板必须打开");
  // 关闭态会先释放登记；随后打开态登记一次。这里验证“最终处于已登记状态”，
  // 而不锁定清理/重跑的具体次数（真实 React 在依赖变化时的重跑次数取决于
  // 渲染次数，不是契约的一部分）。
  assert.deepEqual(h.calls.catalogOpen.at(-1), ["parent", true]);
  assert.equal(h.calls.catalogOpen.filter(([, open]) => open).length, 1);
  await Promise.resolve();
  assert.deepEqual(h.calls.refreshSubagents, ["parent"]);
});

test("宿主接受时，重命名写入持久会话标题", async () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const h = harness({
    binding: (id) => (id === "a"
      ? {
          session: {
            rename: (title) => {
              h.calls.rename.push(title);
              return Promise.resolve({ ok: true, value: { title, seq: 7 } });
            },
          },
        }
      : undefined),
  });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  dispatch(find(h.latest, byClass("dsn-iconButton"))[0], "onClick", {}, h);

  const input = find(h.latest, byClass("dsn-editInput"))[0];
  assert.ok(input, "必须打开行内编辑器");
  dispatch(input, "onChange", { target: { value: "新名字" } }, h);
  await dispatch(find(h.latest, byClass("dsn-save"))[0], "onClick");
  await settle(h);

  assert.deepEqual(h.calls.rename, ["新名字"]);
  assert.equal(h.localStorageData.get("dsh-subagents-names/display-names"), "{}", "持久标题生效后不应留下别名");
  assert.equal(find(h.latest, byClass("dsn-note")).length, 1);
  assert.equal(find(h.latest, byClass("dsn-rowTitle"))[0].props.children, "a");
});

test("被所有权围栏拒绝的子代理回退到面板本地别名", async () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const h = harness({
    binding: (id) => (id === "a"
      ? {
          session: {
            rename: (title) => {
              h.calls.rename.push(title);
              return Promise.resolve({
                ok: false,
                error: { code: "agent-busy", message: 'session "a" is owned by subagent routing', details: {} },
              });
            },
          },
        }
      : undefined),
  });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  dispatch(find(h.latest, byClass("dsn-iconButton"))[0], "onClick", {}, h);

  const input = find(h.latest, byClass("dsn-editInput"))[0];
  dispatch(input, "onChange", { target: { value: "别名" } }, h);
  await dispatch(find(h.latest, byClass("dsn-save"))[0], "onClick");
  await settle(h);

  assert.deepEqual(find(h.latest, byClass("dsn-rowTitle")).map((element) => element.props.children), ["别名"]);
  assert.equal(h.localStorageData.get("dsh-subagents-names/display-names"), JSON.stringify({ a: "别名" }));
  assert.equal(find(h.latest, byClass("dsn-note")).length, 0);
  assert.equal(find(h.latest, byClass("dsn-error")).length, 0);
});

test("非所有权类失败会报错，不会伪装成成功", async () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const h = harness({
    binding: () => ({
      session: {
        rename: () => Promise.resolve({ ok: false, error: { code: "internal", message: "boom", details: {} } }),
      },
    }),
  });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  dispatch(find(h.latest, byClass("dsn-iconButton"))[0], "onClick", {}, h);
  const input = find(h.latest, byClass("dsn-editInput"))[0];
  dispatch(input, "onChange", { target: { value: "x" } }, h);
  await dispatch(find(h.latest, byClass("dsn-save"))[0], "onClick");
  await settle(h);

  assert.equal(find(h.latest, byClass("dsn-error"))[0].props.children, "boom");
  // 失败时只报错，不写入别名，也不留下“已写入持久标题”的提示。
  assert.equal(h.localStorageData.has("dsh-subagents-names/display-names"), false);
  assert.equal(find(h.latest, byClass("dsn-note")).length, 0);
});

test("空名称被拒绝，不发起任何重命名", async () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const h = harness({ binding: () => ({ session: { rename: () => Promise.resolve({ ok: true, value: { title: "x", seq: 1 } }) } }) });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  dispatch(find(h.latest, byClass("dsn-iconButton"))[0], "onClick", {}, h);
  const input = find(h.latest, byClass("dsn-editInput"))[0];
  dispatch(input, "onChange", { target: { value: "   " } }, h);
  await dispatch(find(h.latest, byClass("dsn-save"))[0], "onClick");
  await settle(h);

  assert.deepEqual(h.calls.rename, []);
  assert.equal(find(h.latest, byClass("dsn-error"))[0].props.children, "名称不能为空。");
});

test("仅在已完成页签、且不在当前轮时提供归档", async () => {
  const byId = {
    parent: { sessionId: "parent", running: true },
    done: childRow("done", "parent", { updatedAt: 2 }),
    live: childRow("live", "parent", { running: true, updatedAt: 1 }),
  };
  const h = harness({ archiveSession: () => Promise.resolve() });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);

  // 首次观察到运行中的父会话时，全部可见子项都受保护。
  assert.equal(find(h.latest, (element) => element.props["data-danger"] === true).length, 0);

  dispatch(find(h.latest, byClass("dsn-tab"))[1], "onClick", {}, h);
  const buttons = find(h.latest, (element) => element.props["data-danger"] === true);
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].props.disabled, true);

  dispatch(buttons[0], "onClick");
  await Promise.resolve();
  assert.deepEqual(h.calls.archiveSession, [], "受保护的当前轮子项不得被归档");
});

test("未受保护的已完成子项通过 ctx.workspaces 归档", async () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    old: childRow("old", "parent", { updatedAt: 1 }),
  };
  const h = harness({ archiveSession: () => Promise.resolve() });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  dispatch(find(h.latest, byClass("dsn-tab"))[1], "onClick", {}, h);

  const buttons = find(h.latest, (element) => element.props["data-danger"] === true);
  assert.equal(buttons[0].props.disabled, false);
  dispatch(buttons[0], "onClick");
  await Promise.resolve();
  assert.deepEqual(h.calls.archiveSession, ["old"]);
});

test("归档失败会在面板内报错", async () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    old: childRow("old", "parent", { updatedAt: 1 }),
  };
  const h = harness({ archiveSession: () => Promise.reject(new Error("归档失败")) });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  dispatch(find(h.latest, byClass("dsn-tab"))[1], "onClick", {}, h);
  dispatch(find(h.latest, (element) => element.props["data-danger"] === true)[0], "onClick", {}, h);
  await settle(h);

  assert.equal(find(h.latest, byClass("dsn-error"))[0].props.children, "归档失败");
});

test("点击行优先使用运行时保留的地址打开子代理", () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const address = { parentSessionId: "parent", childSessionId: "a", mode: "continuable" };
  const h = harness({ addresses: { a: address } });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  dispatch(find(h.latest, byClass("dsn-row"))[0], "onClick", {}, h);

  assert.deepEqual(h.calls.openSubagent, [address]);
  assert.deepEqual(h.calls.open, []);
});

test("没有保留地址时回退到目录地址，再回退到普通打开", () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const plain = harness({ addresses: {} });
  render(plain, { byId });
  dispatch(find(plain.latest, byClass("dsn-trigger"))[0], "onClick", {}, plain);
  dispatch(find(plain.latest, byClass("dsn-row"))[0], "onClick", {}, plain);
  assert.deepEqual(plain.calls.open, ["a"], "没有目录条目时直接普通打开");

  const viaCatalog = harness({ addresses: {} });
  render(viaCatalog, {
    byId,
    subagentsByParent: {
      parent: { parentAvailable: true, entries: [{ kind: "child", id: "a", mode: "one-shot" }] },
    },
  });
  dispatch(find(viaCatalog.latest, byClass("dsn-trigger"))[0], "onClick", {}, viaCatalog);
  dispatch(find(viaCatalog.latest, byClass("dsn-row"))[0], "onClick", {}, viaCatalog);
  // bundle 与测试运行在不同 realm，对象原型不同，因此比较序列化结果。
  assert.equal(
    JSON.stringify(viaCatalog.calls.openSubagent),
    JSON.stringify([{ parentSessionId: "parent", childSessionId: "a", mode: "one-shot" }]),
  );
  assert.deepEqual(viaCatalog.calls.open, []);
});

test("键盘 Enter 也能打开行", () => {
  const byId = {
    parent: { sessionId: "parent", running: false },
    a: childRow("a", "parent", { updatedAt: 1 }),
  };
  const h = harness({ addresses: {} });
  render(h, { byId });
  dispatch(find(h.latest, byClass("dsn-trigger"))[0], "onClick", {}, h);
  const row = find(h.latest, byClass("dsn-row"))[0];
  dispatch(row, "onKeyDown", { key: "Enter" }, h);
  assert.deepEqual(h.calls.open, ["a"]);
});
