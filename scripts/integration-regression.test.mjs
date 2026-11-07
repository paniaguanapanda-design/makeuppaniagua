import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";
import { pendingMigrations } from "./migration-plan.mjs";

const require = createRequire(import.meta.url);
test("auth route retains secure configuration and password-recovery guards", async () => {
  const env = {};
  let calls = 0;
  const exports = {};
  const source = readFileSync(new URL("../src/routes/api/auth/$.ts", import.meta.url), "utf8");
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    {
      exports,
      Response,
      URL,
      process: { env },
      console: { error() {} },
      require(id) {
        if (id === "@tanstack/react-router") return { createFileRoute: () => (config) => config };
        if (id === "@/lib/auth/server")
          return {
            auth: {
              handler: () => {
                calls++;
                return new Response("ok");
              },
            },
          };
        return require(id);
      },
    },
  );
  const get = (path = "get-session") =>
    exports.Route.server.handlers.GET({
      request: new Request(`https://neusta.com/api/auth/${path}`),
    });
  assert.equal((await get()).status, 503);
  env.BETTER_AUTH_SECRET = "short";
  assert.equal((await get()).status, 503);
  env.BETTER_AUTH_SECRET = "test-only-secret-with-at-least-32-characters";
  env.VERCEL = "1";
  assert.equal((await get()).status, 503);
  env.DATABASE_URL = "test-only";
  env.BETTER_AUTH_URL = "https://neusta.com";
  assert.equal((await get()).status, 200);
  assert.equal((await get("request-password-reset")).status, 503);
  env.RESEND_API_KEY = "test-only";
  env.FEEDBACK_EMAIL_FROM = "test@example.invalid";
  assert.equal((await get("request-password-reset")).status, 200);
  env.VITE_AUTH_ENABLED = "false";
  assert.equal((await get()).status, 503);
  assert.equal(calls, 2);
});

test("upgrading the current schema preserves accounts and keeps existing reviews private", async () => {
  const pg = new PGlite();
  const dir = new URL("../migrations/", import.meta.url);
  const consent = "0005_opiniones_consent.sql";
  const existing = pendingMigrations(readdirSync(dir), []).filter(({ name }) => name !== consent);
  try {
    for (const { name } of existing) await pg.exec(readFileSync(new URL(name, dir), "utf8"));
    await pg.query(
      `insert into "user" (id, name, email, "emailVerified") values ('existing', 'Prueba', 'existing@example.invalid', false)`,
    );
    await pg.query("insert into opiniones (rating, comment) values (5, 'Anterior')");
    assert.deepEqual(
      pendingMigrations(
        readdirSync(dir),
        existing.map(({ name }) => name),
      ).map(({ name }) => name),
      [consent],
    );
    await pg.exec(readFileSync(new URL(consent, dir), "utf8"));
    assert.equal((await pg.query(`select id from "user"`)).rows[0].id, "existing");
    const review = (await pg.query("select * from opiniones")).rows[0];
    assert.equal(review.publication_status, "private");
    assert.equal(review.publication_consent, false);
    assert.equal(review.comment, "Anterior");
  } finally {
    await pg.close();
  }
});
