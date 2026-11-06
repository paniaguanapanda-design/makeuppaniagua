import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

const require = createRequire(import.meta.url);
// Compile the real TS modules; replace only the server-function transport and network.
function harness(
  env = {},
  fetch = async () => {
    throw new Error("Unexpected fetch");
  },
) {
  const cache = new Map();
  const credit = {
    creditContext: async () => {
      if (env.TEST_NO_SESSION) throw new Error("Inicia sesión");
      return { sql: {}, userId: "test-user" };
    },
    reserveTrial: async () => "11111111-1111-4111-8111-111111111111",
    remainingCredit: async () => 2,
    claimGeneration: async () => {
      if (env.TEST_NO_CREDIT) throw new Error("Crédito agotado");
    },
  };
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
          if (id === "./credit.server" || id === "./credit-store.server") return credit;
          if (id === "@tanstack/react-start")
            return {
              createServerFn: () => ({
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
const data = {
  situation: "boda",
  owned: [],
  skin: "",
  photo: "data:image/jpeg;base64,dGVzdA==",
  requestId: "11111111-1111-4111-8111-111111111111",
};
const photo = "data:image/jpeg;base64,dGVzdA==";
const request = (optionId) => ({
  data: {
    ...data,
    photo,
    optionId,
    trialId: "11111111-1111-4111-8111-111111111111",
    undertone: "neutro",
    depth: "media",
    shape: "ovalado",
  },
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
  const cards = (
    await harness({ XAI_API_KEY: "test-only" })("lib/makeup/imagine.ts").referenceLooks({ data })
  ).cards;
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
  const load = harness({ XAI_API_KEY: "test-only" });
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
  assert.match(html, /Esta solicitud ya consumió su plaza/);
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

test("unauthorized or exhausted generation never reaches xAI", async () => {
  for (const flag of ["TEST_NO_SESSION", "TEST_NO_CREDIT"]) {
    let calls = 0;
    const load = harness({ XAI_API_KEY: "test-only", [flag]: "true" }, async () => {
      calls++;
      return Response.json({});
    });
    await assert.rejects(load("lib/makeup/ai-look.ts").aiLook(request("piel")), /sesión|agotado/);
    assert.equal(calls, 0);
  }
});
