import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";

test("email accounts sign in, reset passwords and revoke sessions", async () => {
  const previous = {
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    FEEDBACK_EMAIL_FROM: process.env.FEEDBACK_EMAIL_FROM,
    VITE_AUTH_ENABLED: process.env.VITE_AUTH_ENABLED,
  };
  process.env.BETTER_AUTH_URL = "http://localhost:8080";
  process.env.RESEND_API_KEY = "test-key";
  process.env.FEEDBACK_EMAIL_FROM = "NEUSTA <test@example.invalid>";
  process.env.VITE_AUTH_ENABLED = "true";
  const originalFetch = globalThis.fetch;
  let resetUrl;
  globalThis.fetch = async (input, init) => {
    if (input === "https://api.resend.com/emails") {
      const email = JSON.parse(init.body);
      resetUrl = email.text.match(/https?:\/\/\S+/)?.[0];
      return Response.json({ id: "test" });
    }
    return originalFetch(input, init);
  };

  const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
  try {
    const { auth } = await server.ssrLoadModule("/src/lib/auth/server.ts");
    const request = (path, body, cookie) =>
      auth.handler(new Request(`http://localhost:8080/api/auth/${path}`, {
        method: body ? "POST" : "GET",
        headers: {
          origin: "http://localhost:8080",
          ...(body ? { "content-type": "application/json" } : {}),
          ...(cookie ? { cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }));
    const email = "test@example.invalid";
    const signup = await request("sign-up/email", { name: "Prueba", email, password: "password-uno" });
    assert.equal(signup.status, 200);
    const cookie = signup.headers.getSetCookie().map((part) => part.split(";")[0]).join("; ");
    assert.ok(cookie);
    assert.ok((await (await request("get-session", undefined, cookie)).json()).user);

    const forgot = await request("request-password-reset", { email, redirectTo: "http://localhost:8080/restablecer" });
    assert.equal(forgot.status, 200);
    assert.ok(resetUrl);
    const callback = await auth.handler(new Request(resetUrl));
    assert.equal(callback.status, 302);
    const token = new URL(callback.headers.get("location")).searchParams.get("token");
    assert.ok(token);
    assert.equal((await request("reset-password", { token, newPassword: "password-dos" })).status, 200);
    assert.equal(await (await request("get-session", undefined, cookie)).json(), null);
    assert.notEqual((await request("sign-in/email", { email, password: "password-uno" })).status, 200);
    assert.equal((await request("sign-in/email", { email, password: "password-dos" })).status, 200);
    assert.notEqual((await request("reset-password", { token, newPassword: "password-tres" })).status, 200);
  } finally {
    await server.close();
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
