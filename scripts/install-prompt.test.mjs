import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Execute the real component with a small hook/DOM harness. No provider or browser credentials.
function setup(standalone = false, storedUntil = null, storageFails = false) {
  const storage = new Map(storedUntil ? [["neusta.install-dismissed-until", storedUntil]] : []);
  const timers = new Map();
  let timerId = 0;
  const cleanups = [];
  const state = [];
  const effects = [];
  const listeners = new Map();
  const dialog = {
    open: false,
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
    },
  };
  let cursor = 0;
  let mounted = false;
  const hooks = {
    useState(initial) {
      const id = cursor++;
      if (!(id in state)) state[id] = initial;
      return [
        state[id],
        (next) => {
          state[id] = typeof next === "function" ? next(state[id]) : next;
        },
      ];
    },
    useRef() {
      return { current: dialog };
    },
    useEffect(fn) {
      if (!mounted) effects.push(fn);
    },
  };
  const exports = {};
  const source = readFileSync(
    new URL("../src/components/install-prompt.tsx", import.meta.url),
    "utf8",
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText,
    {
      exports,
      navigator: { standalone },
      localStorage: {
        getItem(key) {
          if (storageFails) throw new Error("denied");
          return storage.get(key) ?? null;
        },
        setItem(key, value) {
          if (storageFails) throw new Error("denied");
          storage.set(key, value);
        },
      },
      window: {
        setTimeout(fn) {
          timers.set(++timerId, fn);
          return timerId;
        },
        clearTimeout(id) {
          timers.delete(id);
        },
        matchMedia: () => ({
          matches: standalone,
          addEventListener() {},
          removeEventListener() {},
        }),
        addEventListener: (key, fn) => listeners.set(key, fn),
        removeEventListener: (key) => listeners.delete(key),
      },
      require: (id) => (id === "react" ? hooks : require(id)),
    },
  );
  function render() {
    cursor = 0;
    const tree = exports.InstallPrompt();
    if (!mounted) {
      mounted = true;
      for (const fn of effects) cleanups.push(fn());
    }
    return tree;
  }
  function all(node, type) {
    if (!node || typeof node !== "object") return [];
    const children = [node.props?.children].flat(Infinity);
    return [
      ...(node.type === type ? [node] : []),
      ...children.flatMap((child) => all(child, type)),
    ];
  }
  return {
    render,
    all,
    listeners,
    dialog,
    storage,
    timers,
    flush() {
      for (const fn of timers.values()) fn();
      timers.clear();
    },
    unmount() {
      for (const fn of cleanups) fn();
    },
  };
}

function button(h, label) {
  return h.all(h.render(), "button").find((item) => item.props.children === label);
}

test("invitation opens automatically once, without an install header entry or a native prompt", () => {
  const h = setup();
  h.render();
  assert.equal(h.dialog.open, false);
  h.flush();
  assert.equal(h.dialog.open, true);
  assert.ok(button(h, "Instalar"));
  assert.ok(button(h, "Ahora no"));
  assert.doesNotMatch(JSON.stringify(h.render()), /Instalar app/);
  const root = readFileSync(new URL("../src/routes/__root.tsx", import.meta.url), "utf8");
  const app = readFileSync(new URL("../src/components/atelier/app.tsx", import.meta.url), "utf8");
  assert.match(root, /<InstallPrompt \/>/);
  assert.doesNotMatch(app, /InstallPrompt/);
});

test("Ahora no and Escape defer the invitation for seven days, including later visits", () => {
  for (const escape of [false, true]) {
    const h = setup();
    h.render();
    h.flush();
    if (escape) h.all(h.render(), "dialog")[0].props.onCancel();
    else button(h, "Ahora no").props.onClick();
    assert.equal(h.dialog.open, false);
    const until = h.storage.get("neusta.install-dismissed-until");
    const days = (Number(until) - Date.now()) / 86400000;
    assert.ok(days > 6.99 && days <= 7);
    const next = setup(false, until);
    next.render();
    next.flush();
    assert.equal(next.dialog.open, false);
    const expired = setup(false, String(Date.now() - 100));
    expired.render();
    expired.flush();
    assert.equal(expired.dialog.open, true);
  }
});

test("missing native event explains installation rather than promising an APK", async () => {
  const h = setup();
  h.render();
  h.flush();
  await button(h, "Instalar").props.onClick();
  assert.equal(h.dialog.open, true);
  assert.match(JSON.stringify(h.render()), /no ofrece instalación directa/);
  assert.match(JSON.stringify(h.render()), /Añadir a pantalla de inicio/);
});

test("late browser event enables native install only after a click; cancellation and error keep help", async () => {
  for (const outcome of ["accepted", "dismissed", "error"]) {
    const h = setup();
    h.render();
    h.flush();
    let prompted = 0;
    let prevented = false;
    h.listeners.get("beforeinstallprompt")({
      preventDefault() {
        prevented = true;
      },
      async prompt() {
        prompted++;
        if (outcome === "error") throw new Error("unavailable");
      },
      userChoice: Promise.resolve({ outcome }),
    });
    assert.equal(prompted, 0);
    await button(h, "Instalar").props.onClick();
    assert.equal(prompted, 1);
    assert.equal(prevented, true);
    if (outcome === "accepted") assert.equal(h.dialog.open, false);
    else {
      assert.equal(h.dialog.open, true);
      assert.match(JSON.stringify(h.render()), outcome === "error" ? /no pudo abrir/ : /cancelado/);
      await button(h, "Instalar").props.onClick();
      assert.equal(prompted, 1); // native events are single-use
    }
  }
});

test("installed apps do not show invitation; installing before or after the timer closes it", () => {
  const standalone = setup(true);
  standalone.render();
  standalone.flush();
  assert.equal(standalone.dialog.open, false);
  for (const early of [true, false]) {
    const h = setup();
    h.render();
    if (!early) h.flush();
    h.listeners.get("appinstalled")();
    h.flush();
    assert.equal(h.dialog.open, false);
  }
});

test("blocked storage does not prevent dismissal; cleanup removes listeners and timer", () => {
  const h = setup(false, null, true);
  h.render();
  h.flush();
  button(h, "Ahora no").props.onClick();
  assert.equal(h.dialog.open, false);
  const unmounted = setup();
  unmounted.render();
  unmounted.unmount();
  unmounted.flush();
  assert.equal(unmounted.dialog.open, false);
  assert.equal(unmounted.listeners.size, 0);
});
