import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";

const require = createRequire(import.meta.url);
// Execute the real component with a small hook/DOM harness. No provider or browser credentials.
function setup(standalone = false) {
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
      window: {
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
      for (const fn of effects) fn();
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
  return { render, all, listeners, dialog };
}

test("install entry always opens guidance even without an install event; closing does not dismiss it forever", () => {
  const h = setup();
  let tree = h.render();
  let buttons = h.all(tree, "button");
  assert.equal(buttons[0].props.children, "Instalar app");
  buttons[0].props.onClick();
  assert.equal(h.dialog.open, true);
  buttons.at(-1).props.onClick();
  assert.equal(h.dialog.open, false);
  tree = h.render();
  h.all(tree, "button")[0].props.onClick();
  assert.equal(h.dialog.open, true);
  const text = JSON.stringify(tree);
  for (const browser of ["iPhone", "Android", "Chrome", "Safari", "Firefox", "marcador"])
    assert.match(text, new RegExp(browser));
});

test("native install cancellation and failure keep manual help available", async () => {
  for (const fail of [false, true]) {
    const h = setup();
    h.render();
    let prompted = 0;
    let prevented = false;
    h.listeners.get("beforeinstallprompt")({
      preventDefault() {
        prevented = true;
      },
      async prompt() {
        prompted++;
        if (fail) throw new Error("not available");
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    const nativeButton = h
      .all(h.render(), "button")
      .find((b) => b.props.children === "Instalar en este dispositivo");
    await nativeButton.props.onClick();
    assert.equal(prompted, 1);
    assert.equal(prevented, true);
    const tree = h.render();
    assert.match(JSON.stringify(tree), fail ? /no pudo abrir/ : /cancelado/);
    assert.match(JSON.stringify(tree), /Añadir a pantalla de inicio/);
  }
});

test("standalone and completed install are reported without offering another native prompt", () => {
  for (const standalone of [true, false]) {
    const h = setup(standalone);
    h.render();
    if (!standalone) h.listeners.get("appinstalled")();
    const tree = h.render();
    assert.equal(h.all(tree, "button")[0].props.children, "App instalada");
    assert.match(JSON.stringify(tree), /Ya estás usando/);
  }
});
