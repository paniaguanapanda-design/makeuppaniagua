import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";

const require = createRequire(import.meta.url);
function moduleUnderTest(path, overrides = {}) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    process: { env: overrides.env ?? {} },
    require(id) {
      return overrides[id] ?? require(id);
    },
  });
  return exports;
}
const store = moduleUnderTest("../src/lib/makeup/credit-store.server.ts");
async function fixture(fn) {
  const db = new PGlite();
  try {
    await db.exec(readFileSync(new URL("../migrations/0001_auth.sql", import.meta.url), "utf8"));
    await db.exec(
      readFileSync(new URL("../migrations/0006_trial_credit.sql", import.meta.url), "utf8"),
    );
    for (const id of ["alice", "bob"])
      await db.query('insert into "user"(id,name,email,"emailVerified") values ($1,$1,$1,false)', [
        id,
      ]);
    const sql = { query: async (text, params) => (await db.query(text, params)).rows };
    await fn(sql);
  } finally {
    await db.close();
  }
}

test("parallel reservations never exceed three lifetime trials per account", () =>
  fixture(async (sql) => {
    const results = await Promise.allSettled(
      Array.from({ length: 12 }, () =>
        store.reserveTrial(sql, "alice", randomUUID(), "boda", "photo"),
      ),
    );
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 3);
    assert.equal(await store.remainingCredit(sql, "alice"), 0);
    assert.equal(await store.remainingCredit(sql, "bob"), 3);
    await assert.rejects(
      store.reserveTrial(sql, "alice", randomUUID(), "boda", "photo"),
      /agotado/,
    );
  }));

test("same request reservation is idempotent, including parallel retries", () =>
  fixture(async (sql) => {
    const requestId = randomUUID();
    const ids = await Promise.all(
      Array.from({ length: 5 }, () => store.reserveTrial(sql, "alice", requestId, "boda", "photo")),
    );
    assert.equal(new Set(ids).size, 1);
    assert.equal(await store.remainingCredit(sql, "alice"), 2);
    await assert.rejects(
      store.reserveTrial(sql, "alice", requestId, "boda", "different"),
      /otra foto/,
    );
  }));

test("at most nine Grok slots; attempts cannot be replayed, stolen or change photo", () =>
  fixture(async (sql) => {
    let successes = 0;
    for (let i = 0; i < 3; i++) {
      const id = await store.reserveTrial(sql, "alice", randomUUID(), "boda", "photo");
      await assert.rejects(store.claimGeneration(sql, "bob", id, "boda", "photo", "piel"));
      await assert.rejects(store.claimGeneration(sql, "alice", id, "fiesta", "photo", "piel"));
      await assert.rejects(
        store.claimGeneration(sql, "alice", id, "boda", "replacement-photo", "piel"),
      );
      for (const option of ["piel", "natural", "definido"]) {
        const results = await Promise.allSettled(
          Array.from({ length: 4 }, () =>
            store.claimGeneration(sql, "alice", id, "boda", "photo", option),
          ),
        );
        successes += results.filter((r) => r.status === "fulfilled").length;
      }
      await assert.rejects(store.claimGeneration(sql, "alice", id, "boda", "photo", "cargado"));
    }
    assert.equal(successes, 9);
  }));

test("generation credit requires persistent DB, secret and a verified session", async () => {
  let session = null;
  const dependencies = {
    env: { BETTER_AUTH_SECRET: "test-placeholder-not-a-real-secret-32" },
    "@/lib/auth/isolation.server": { assertSameSiteRequest() {} },
    "@/lib/db": { dbSource: "neon", getSql: async () => ({}) },
    "@/lib/auth/verify.server": { getSessionUser: async () => session },
  };
  const load = () => moduleUnderTest("../src/lib/makeup/credit.server.ts", dependencies);
  await assert.rejects(load().creditContext(), /Inicia sesión/);
  session = { id: "alice" };
  assert.equal((await load().creditContext()).userId, "alice");
  dependencies.env = {};
  await assert.rejects(load().creditContext(), /autenticación segura/);
  dependencies.env = { BETTER_AUTH_SECRET: "test-placeholder-not-a-real-secret-32" };
  dependencies["@/lib/db"].dbSource = "pglite";
  await assert.rejects(load().creditContext(), /autenticación segura/);
});
