import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { PGlite } from "@electric-sql/pglite";

const require = createRequire(import.meta.url);
// Compile the real TS modules; replace only the server-function transport and network.
function harness(
  env = {},
  fetch = async () => {
    throw new Error("Unexpected fetch");
  },
  imports = {},
) {
  const cache = new Map();
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const path = fileURLToPath(new URL(`../src/${name}`, import.meta.url));
    const source = readFileSync(path, "utf8");
    const code = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    const exports = {};
    cache.set(name, exports);
    vm.runInNewContext(
      code,
      {
        exports,
        process: { env },
        Buffer,
        AbortSignal,
        fetch,
        console: { warn() {} },
        require(id) {
          if (id in imports) return imports[id];
          // Authentication is exercised separately by auth-flow/check-account-auth.
          // This harness asserts protected handlers keep their middleware attached.
          if (id === "@/lib/auth/middleware") return { authMiddleware: "required-session" };
          if (id === "@tanstack/react-start")
            return {
              createServerFn: () => ({
                middleware(middlewares) {
                  assert.deepEqual(Array.from(middlewares), ["required-session"]);
                  return this;
                },
                handler: (fn) => fn,
                validator: (schema) => ({
                  handler: (fn) => (input) => fn({ data: schema.parse(input.data) }),
                }),
              }),
            };
          if (id.startsWith("@/")) return load(`${id.slice(2)}.ts`);
          return require(id);
        },
      },
      { filename: path },
    );
    return exports;
  }
  return load;
}
const data = { situation: "boda", owned: [], skin: "" };
const photo = "data:image/jpeg;base64,dGVzdA==";
const request = (optionId) => ({
  data: { ...data, photo, optionId, undertone: "neutro", depth: "media", shape: "ovalado" },
});

test("every occasion has exactly three distinct restrained looks", () => {
  const load = harness();
  for (const situation of [
    "dia",
    "oficina",
    "entrevista",
    "cita",
    "boda",
    "fiesta",
    "fotos",
    "editorial",
  ]) {
    const options = load("lib/makeup/references.ts").optionsFor(situation);
    assert.equal(options.length, 3);
    assert.equal(new Set(options.map((o) => o.id)).size, 3);
    assert.ok(!options.some((o) => o.id === "cargado"));
  }
});

test("catalog starts with three empty images, never a painted photo", async () => {
  const cards = (await harness()("lib/makeup/imagine.ts").referenceLooks({ data })).cards;
  assert.equal(cards.length, 3);
  assert.ok(cards.every((c) => c.imageUrl === ""));
});

test("generation flags and lower cost caps still apply", async () => {
  const disabled = harness({ ENEBLE_IMAGE_GEN: "false" })("lib/makeup/imagine.ts");
  await assert.rejects(disabled.referenceLooks({ data }), /desactivada/);
  const load = harness({
    ENABLE_IMAGE_GEN: "true",
    ENEBLE_IMAGE_GEN: "false",
    MAX_IMAGE_GENERATIONS: "1",
    XAI_API_KEY: "test-only",
  });
  assert.equal((await load("lib/makeup/imagine.ts").referenceLooks({ data })).cards.length, 1);
  await assert.rejects(load("lib/makeup/ai-look.ts").aiLook(request("definido")), /límite/);
});

test("all three photos are edits of the supplied person through xAI", async () => {
  const calls = [];
  const load = harness({ XAI_API_KEY: "test-only" }, async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return Response.json({ data: [{ b64_json: "Z3Jvaw==" }] });
  });
  const cards = (await load("lib/makeup/imagine.ts").referenceLooks({ data })).cards;
  for (const card of cards) {
    const result = await load("lib/makeup/ai-look.ts").aiLook(request(card.id));
    assert.equal(result.imageUrl, "data:image/jpeg;base64,Z3Jvaw==");
  }
  assert.equal(calls.length, 3);
  for (const call of calls) {
    assert.equal(call.url, "https://api.x.ai/v1/images/edits");
    assert.equal(call.body.image.url, photo);
    assert.equal(call.body.model, "grok-imagine-image-2.0");
    assert.match(call.body.prompt, /same face, age, identity/);
    assert.match(call.body.prompt, /No clown makeup/);
  }
});

test("missing xAI key never switches provider", async () => {
  await assert.rejects(
    harness({ GEMINI_API_KEY: "test-only" })("lib/makeup/ai-look.ts").aiLook(request("piel")),
    /XAI_API_KEY/,
  );
});

test("provider failures reject without a local replacement or private response", async () => {
  for (const status of [400, 401, 402, 403, 404, 422, 429, 500]) {
    const load = harness(
      { XAI_API_KEY: "test-only" },
      async () => new Response("private provider detail", { status }),
    );
    await assert.rejects(
      load("lib/makeup/ai-look.ts").aiLook(request("piel")),
      (e) => e.message.includes(String(status)) && !e.message.includes("private"),
    );
  }
  const load = harness({ XAI_API_KEY: "test-only" }, async () => Response.json({ data: [] }));
  await assert.rejects(load("lib/makeup/ai-look.ts").aiLook(request("piel")), /no devolvió/);
});

test("pending and failed cards cannot be chosen, successful photos can", async () => {
  const load = harness();
  const cards = (await load("lib/makeup/imagine.ts").referenceLooks({ data })).cards;
  const { OptionsScreen } = load("components/atelier/options.tsx");
  const html = renderToStaticMarkup(
    React.createElement(OptionsScreen, {
      situation: "boda",
      read: null,
      summary: "",
      skinLine: "",
      readingSkin: false,
      loading: false,
      error: null,
      onRetry() {},
      onChoose() {},
      cards: [
        { ...cards[0], imageUrl: "data:image/jpeg;base64,Z3Jvaw==" },
        { ...cards[1], error: "xAI no disponible" },
        cards[2],
      ],
    }),
  );
  assert.equal((html.match(/data-testid="option-/g) ?? []).length, 3);
  assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
  assert.equal((html.match(/<img /g) ?? []).length, 1);
  assert.match(html, /Reintentar solo los looks fallidos/);
  assert.match(html, /Grok está generando/);
  assert.match(html, /role="alert"/);
});

test("each real edit requests complete makeup, not just retouching, even with a partial kit", async () => {
  const calls = [];
  const load = harness({ XAI_API_KEY: "test-only" }, async (_url, init) => {
    calls.push(JSON.parse(init.body));
    return Response.json({ data: [{ b64_json: "Z3Jvaw==" }] });
  });
  const refs = load("lib/makeup/references.ts");
  const options = refs.optionsFor("boda");
  for (const option of options) {
    assert.ok(option.zones.includes("ojos"));
    assert.ok(option.zones.includes("rubor"));
    assert.ok(option.zones.includes("labios"));
    assert.equal(refs.visibleZones(option, ["base"]).length, option.zones.length);
    const input = request(option.id);
    input.data.owned = ["base"];
    await load("lib/makeup/ai-look.ts").aiLook(input);
  }
  assert.equal(new Set(calls.map((c) => c.prompt)).size, 3);
  for (const call of calls) {
    assert.match(call.prompt, /lipstick/i);
    assert.match(call.prompt, /eyeshadow/i);
    assert.match(call.prompt, /mascara/i);
    assert.match(call.prompt, /blush/i);
    assert.match(call.prompt, /NOT a skin retouch/);
    assert.match(call.prompt, /Do not blur, airbrush, smooth/);
    assert.match(call.prompt, /not restrictions/);
    assert.doesNotMatch(
      call.prompt,
      /Almost no makeup|No blush|No eyeshadow|Very unsaturated|Every other area stays bare skin/,
    );
  }
});

const situations = ["dia", "oficina", "entrevista", "cita", "boda", "fiesta", "fotos", "editorial"];

test("regression: all 24 designs have different techniques, not just occasion names", () => {
  const refs = harness()("lib/makeup/references.ts");
  const recipes = situations.flatMap((situation) => refs.optionsFor(situation));
  assert.equal(new Set(recipes.map((option) => JSON.stringify(option.instructions))).size, 24);
  assert.equal(new Set(recipes.map((option) => option.line)).size, 24);
  assert.equal(new Set(recipes.map((option) => option.title)).size, 24);
  for (const option of recipes) {
    assert.equal(option.zones.length, Object.keys(option.instructions).length);
    for (const instruction of Object.values(option.instructions)) {
      assert.ok(option.prompt.includes(instruction));
    }
  }
  const office = refs.optionsFor("oficina");
  assert.ok(office.every((option) => !option.instructions.ojos.includes("ahumado bronce")));
  assert.match(refs.optionsFor("fiesta")[0].instructions.ojos, /ahumado bronce/);
  assert.match(refs.optionsFor("editorial")[0].instructions.ojos, /línea flotante/);
});

test("real edit endpoint sends the selected occasion's recipe for every option", async () => {
  const calls = [];
  const load = harness({ XAI_API_KEY: "test-only" }, async (_url, init) => {
    calls.push(JSON.parse(init.body));
    return Response.json({ data: [{ b64_json: "Z3Jvaw==" }] });
  });
  for (const situation of situations) {
    for (const option of load("lib/makeup/references.ts").optionsFor(situation)) {
      const input = request(option.id);
      input.data.situation = situation;
      await load("lib/makeup/ai-look.ts").aiLook(input);
      const call = calls.at(-1);
      for (const instruction of Object.values(option.instructions)) {
        assert.ok(call.prompt.includes(instruction));
      }
      assert.equal(call.image.url, photo);
    }
  }
  assert.equal(calls.length, 24);
  assert.equal(new Set(calls.map((call) => call.prompt)).size, 24);
});

test("selected recipe drives real DB recommendation steps, title and pigment suggestions", async () => {
  const pg = new PGlite();
  try {
    for (const migration of ["0002_orla.sql", "0003_accesible.sql"]) {
      await pg.exec(readFileSync(new URL(`../migrations/${migration}`, import.meta.url), "utf8"));
    }
    const sql = async (strings, ...values) => {
      let text = strings[0];
      for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
      return (await pg.query(text, values)).rows;
    };
    const load = harness({}, undefined, { "@/lib/db": { getSql: async () => sql } });
    const refs = load("lib/makeup/references.ts");
    const server = load("lib/makeup/server.ts");
    const plans = [];
    for (const situation of situations) {
      for (const option of refs.optionsFor(situation)) {
        const plan = await server.recommendLook({
          data: {
            situation,
            optionId: option.id,
            undertone: "neutro",
            depth: "media",
            shape: "ovalado",
            owned: [],
            age: "treinta",
            tastes: [],
            note: "",
            skin: "",
          },
        });
        assert.equal(plan.title, option.title);
        assert.equal(plan.promise, option.line);
        assert.equal(plan.steps.length, option.zones.length);
        for (const step of plan.steps) {
          assert.equal(step.instruction, option.instructions[step.zone]);
          assert.equal(step.product.category, step.zone);
          const hint = option.productHints[step.zone];
          if (hint)
            assert.match(`${step.product.shade} ${step.product.finish}`, new RegExp(hint, "i"));
        }
        plans.push(plan);
      }
    }
    assert.equal(
      new Set(plans.map((plan) => plan.steps.map((step) => step.instruction).join(" "))).size,
      24,
    );
  } finally {
    await pg.close();
  }
});
