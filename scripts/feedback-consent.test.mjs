import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import test from "node:test";
import ts from "typescript";
import { PGlite } from "@electric-sql/pglite";

const require = createRequire(import.meta.url);
function load(path, imports = {}, globals = {}) {
  const exports = {};
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, atob, console, ...globals, require: (id) => imports[id] ?? require(id) },
  );
  return exports;
}
const schema = load("../src/lib/makeup/feedback-schema.ts");
const review = { rating: 5, comment: "Una experiencia estupenda" };
const photo = `data:image/png;base64,${Buffer.from("\x89PNG\r\n\x1a\n", "binary").toString("base64")}`;

test("legacy submissions stay private; publication requires name and comment", () => {
  assert.equal(schema.feedbackSchema.parse(review).publicationConsent, false);
  assert.equal(
    schema.feedbackSchema.safeParse({ ...review, publicationConsent: true }).success,
    false,
  );
  assert.equal(
    schema.feedbackSchema.safeParse({
      ...review,
      displayName: " Ana ",
      comment: " ",
      publicationConsent: true,
    }).success,
    false,
  );
  assert.equal(
    schema.feedbackSchema.parse({ ...review, displayName: " Ana ", publicationConsent: true })
      .displayName,
    "Ana",
  );
});

test("reject invalid email, rating, unconsented photos, SVG and oversized images", () => {
  for (const patch of [
    { contactEmail: "invalid" },
    { rating: 0 },
    { photo },
    { photo: "data:image/svg+xml;base64,PHN2Zz4=", publicationConsent: true, displayName: "Ana" },
    {
      photo: `data:image/png;base64,${"A".repeat(500_000)}`,
      publicationConsent: true,
      displayName: "Ana",
    },
  ])
    assert.equal(schema.feedbackSchema.safeParse({ ...review, ...patch }).success, false);
  assert.equal(
    schema.feedbackSchema.safeParse({
      ...review,
      photo,
      publicationConsent: true,
      displayName: "Ana",
    }).success,
    true,
  );
});

test("real handler stores private contact, opt-in evidence and pending status; migration protects old reviews", async () => {
  const pg = new PGlite();
  try {
    await pg.exec(
      readFileSync(new URL("../migrations/0004_opiniones.sql", import.meta.url), "utf8"),
    );
    await pg.query("insert into opiniones (rating, comment) values (4, 'Anterior')");
    await pg.exec(
      readFileSync(new URL("../migrations/0005_opiniones_consent.sql", import.meta.url), "utf8"),
    );
    const sql = async (strings, ...values) => {
      let text = strings[0];
      for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
      return (await pg.query(text, values)).rows;
    };
    const emails = [];
    const { sendFeedback } = load(
      "../src/lib/makeup/feedback.ts",
      {
        "./feedback-schema": schema,
        "@/lib/auth/middleware": { authMiddleware: "required-session" },
        "@/lib/db": { getSql: async () => sql },
        "@tanstack/react-start": {
          createServerFn: () => ({
            middleware(middlewares) {
              assert.deepEqual(Array.from(middlewares), ["required-session"]);
              return this;
            },
            validator: (validator) => ({
              handler:
                (handler) =>
                ({ data }) =>
                  handler({ data: validator.parse(data) }),
            }),
          }),
        },
      },
      {
        process: {
          env: {
            RESEND_API_KEY: "test-only",
            FEEDBACK_EMAIL_TO: "owner@example.test",
            FEEDBACK_EMAIL_FROM: "site@example.test",
          },
        },
        AbortSignal,
        fetch: async (_url, options) => {
          emails.push(JSON.parse(options.body));
          return { ok: true };
        },
      },
    );
    await sendFeedback({ data: review });
    await sendFeedback({
      data: {
        ...review,
        displayName: "Ana",
        contactEmail: "ana@example.test",
        publicationConsent: true,
        photo,
      },
    });
    const rows = (await pg.query("select * from opiniones order by id")).rows;
    for (const row of rows.slice(0, 2)) {
      assert.equal(row.publication_consent, false);
      assert.equal(row.publication_status, "private");
      assert.equal(row.consent_at, null);
    }
    assert.equal(rows[2].publication_status, "pending");
    assert.equal(rows[2].display_name, "Ana");
    assert.equal(rows[2].contact_email, "ana@example.test");
    assert.equal(rows[2].photo_data_url, photo);
    assert.equal(rows[2].consent_text, schema.REVIEW_CONSENT_TEXT);
    assert.equal(rows[2].consent_version, schema.REVIEW_CONSENT_VERSION);
    assert.ok(rows[2].consent_at);
    assert.match(emails[1].text, /PENDIENTE/);
    assert.match(emails[1].text, /Correo privado \(no publicar\): ana@example.test/);
    assert.equal(JSON.stringify(emails).includes(photo), false);
    await assert.rejects(
      pg.query("update opiniones set publication_status = 'approved' where id = 1"),
    );
    await assert.rejects(async () => sendFeedback({ data: { ...review, photo } }));
  } finally {
    await pg.close();
  }
});
