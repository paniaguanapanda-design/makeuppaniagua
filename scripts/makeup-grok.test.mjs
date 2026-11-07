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
          assert.ok(step.instruction.startsWith(option.instructions[step.zone]));
          assert.ok(step.instruction.length > option.instructions[step.zone].length);
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

const analysis = {
  foto_utilizable: true,
  advertencias: [],
  forma_rostro: null,
  subtono_piel: null,
  forma_ojos: null,
  paleta_recomendada: ["#A45C66"],
  observaciones: "Luz suficiente; subtono incierto.",
};
const consultation = {
  age: "silver",
  tastes: ["mate", "labio"],
  note: "Labial rojo que ya tengo",
  skin: "",
  minutes: "5",
  intensity: "suave",
  sensitivities: "Evito perfume",
};

test("vision request enforces the actual Zod schema, includes image, disables storage and accepts uncertainty", async () => {
  const calls = [];
  const load = harness({ XAI_API_KEY: "test-only" }, async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return Response.json({
      choices: [{ finish_reason: "stop", message: { content: JSON.stringify(analysis) } }],
    });
  });
  const result = await load("lib/makeup/analyze.ts").analyzePortrait({ data: { photo } });
  assert.equal(result.subtono_piel, null);
  assert.equal(result.forma_rostro, null);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.x.ai/v1/chat/completions");
  const body = calls[0].body;
  assert.equal(body.store, false);
  assert.equal(body.response_format.type, "json_schema");
  assert.equal(body.response_format.json_schema.strict, true);
  assert.equal(body.response_format.json_schema.schema.additionalProperties, false);
  assert.equal(body.messages[1].content[1].image_url.url, photo);
  assert.ok(!("edad_estimada" in body.response_format.json_schema.schema.properties));
});

test("invalid, extra, truncated or refused analysis never becomes fabricated data", async () => {
  for (const value of [
    { choices: [{ finish_reason: "stop", message: { content: "Here is your JSON: {}" } }] },
    {
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify({ ...analysis, edad_estimada: 35 }) },
        },
      ],
    },
    {
      choices: [
        {
          finish_reason: "stop",
          message: { content: JSON.stringify({ ...analysis, paleta_recomendada: ["red"] }) },
        },
      ],
    },
    { choices: [{ finish_reason: "length", message: { content: JSON.stringify(analysis) } }] },
    {
      choices: [
        { finish_reason: "stop", message: { refusal: "No", content: JSON.stringify(analysis) } },
      ],
    },
  ]) {
    const load = harness({ XAI_API_KEY: "test-only" }, async () => Response.json(value));
    await assert.rejects(
      load("lib/makeup/analyze.ts").analyzePortrait({ data: { photo } }),
      /análisis válido/,
    );
  }
});

test("analysis errors are safe and disabled generation makes no vision request", async () => {
  for (const status of [401, 429, 500]) {
    const load = harness(
      { XAI_API_KEY: "test-only" },
      async () => new Response("private detail", { status }),
    );
    await assert.rejects(
      load("lib/makeup/analyze.ts").analyzePortrait({ data: { photo } }),
      (error) => error.message.includes(String(status)) && !error.message.includes("private"),
    );
  }
  await assert.rejects(
    harness({ XAI_API_KEY: "test-only", ENABLE_IMAGE_GEN: "false" })(
      "lib/makeup/analyze.ts",
    ).analyzePortrait({ data: { photo } }),
    /desactivada/,
  );
});

test("real image handler receives tastes, available products, time, intensity and sensitivities", async () => {
  const calls = [];
  const load = harness({ XAI_API_KEY: "test-only" }, async (_url, init) => {
    calls.push(JSON.parse(init.body));
    return Response.json({ data: [{ b64_json: "Z3Jvaw==" }] });
  });
  const input = request("natural");
  input.data.consultation = consultation;
  input.data.analysis = analysis;
  await load("lib/makeup/ai-look.ts").aiLook(input);
  const prompt = calls[0].prompt;
  assert.ok(prompt.includes(JSON.stringify(consultation)));
  assert.match(prompt, /Available time: 5 minutes/);
  assert.match(prompt, /Requested intensity: suave/);
  assert.match(prompt, /not defects/);
  assert.match(prompt, /Do not infer allergies/);
  assert.match(prompt, /same face, age, identity/);
  assert.doesNotMatch(prompt, /Round face: lift|Square face: soften/);
  input.data.analysis = { ...analysis, foto_utilizable: false };
  await assert.rejects(load("lib/makeup/ai-look.ts").aiLook(input), /otra foto/);
  assert.equal(calls.length, 1);
});

test("professional steps keep the chosen recipe and add tools, quantity and requested effort", () => {
  const { applicationInstruction } = harness()("lib/makeup/consultation.ts");
  const quick = applicationInstruction("base", "Base satinada.", consultation);
  assert.match(quick, /^Base satinada/);
  assert.match(quick, /una gota/);
  assert.match(quick, /esponja/);
  assert.match(quick, /Versión rápida/);
  assert.match(quick, /translúcida/);
  const detailed = applicationInstruction("labios", "Labio rojo.", {
    minutes: "30",
    intensity: "intensa",
  });
  assert.match(detailed, /capa fina/);
  assert.doesNotMatch(detailed, /Versión rápida/);
});

test("consultation fields retain previous choices and uncertain analysis is not presented as a measurement", () => {
  const load = harness();
  const { KitScreen } = load("components/atelier/kit.tsx");
  const html = renderToStaticMarkup(
    React.createElement(KitScreen, {
      initial: { ...consultation, kit: { base: "BB", ojos: "", labios: "Rojo", resto: "" } },
      onContinue() {},
    }),
  );
  assert.match(html, /Tiempo disponible/);
  assert.match(html, /value="5" selected/);
  assert.match(html, /value="suave" selected/);
  assert.match(html, /Evito perfume/);
  assert.match(html, />BB<\/textarea>/);
  const { OptionsScreen } = load("components/atelier/options.tsx");
  const result = renderToStaticMarkup(
    React.createElement(OptionsScreen, {
      situation: "boda",
      read: { shape: "redondo", undertone: "calido", depth: "media" },
      analysis,
      summary: "",
      skinLine: "",
      readingSkin: false,
      cards: [],
      loading: false,
      error: null,
      onRetry() {},
      onChoose() {},
      onRetake() {},
    }),
  );
  assert.doesNotMatch(result, /sin confirmar/);
  assert.doesNotMatch(result, /Redondo|Cálido/);
  assert.match(result, /Usar otra foto/);
  assert.match(result, /Luz suficiente/);
  assert.doesNotMatch(result, /#A45C66/);
});

test("preparation shows a warm, occasion-specific status without premature facial results or technical disclaimers", () => {
  const { OptionsScreen } = harness()("components/atelier/options.tsx");
  const props = {
    situation: "editorial",
    read: { shape: "redondo", undertone: "calido", depth: "media" },
    analysis: null,
    summary: "36 a 45",
    preferences: "piel luminosa, ceja marcada",
    skinLine: "",
    cards: null,
    loading: true,
    error: null,
    onRetry() {},
    onChoose() {},
  };
  const html = renderToStaticMarkup(React.createElement(OptionsScreen, props));
  assert.match(html, /Estoy analizando tu foto/);
  assert.match(html, /para editorial/);
  assert.match(html, /piel luminosa, ceja marcada/);
  assert.match(html, /role="status"/);
  assert.doesNotMatch(html, /sin confirmar|Profundidad|diagnosticar|36 a 45|Redondo|Cálido/);
  const failed = renderToStaticMarkup(
    React.createElement(OptionsScreen, {
      ...props,
      loading: false,
      error: "No pude analizar la foto.",
    }),
  );
  assert.doesNotMatch(failed, /Estoy analizando/);
  assert.match(failed, /No pude analizar/);
});
