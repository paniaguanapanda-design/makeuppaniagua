// Local integration smoke: ephemeral users and secret, no production credentials.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
const origin = "http://localhost:8080";
async function run(secret) {
  const child = spawn(
    process.execPath,
    [
      "node_modules/vite/bin/vite.js",
      "dev",
      "--host",
      "localhost",
      "--port",
      "8080",
      "--strictPort",
    ],
    {
      env: {
        ...process.env,
        DATABASE_URL: "",
        BETTER_AUTH_URL: origin,
        BETTER_AUTH_SECRET: secret,
        VITE_AUTH_ENABLED: "true",
      },
      stdio: "ignore",
    },
  );
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (child.exitCode !== null) throw new Error("Local server exited before becoming ready");
      try {
        await fetch(`${origin}/api/auth/get-session`);
        ready = true;
        break;
      } catch {
        await sleep(500);
      }
    }
    assert.ok(ready, "Local auth server started");
    const post = (path, body, cookie = "") =>
      fetch(`${origin}/api/auth/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: origin, Cookie: cookie },
        body: JSON.stringify(body),
      });
    const email = `local-${randomBytes(6).toString("hex")}@example.invalid`;
    const password = randomBytes(24).toString("hex");
    const signup = await post("sign-up/email", { email, password, name: "Local test" });
    if (!secret) {
      assert.equal(signup.status, 503);
      console.log("PASS missing secret: signup blocked");
      return;
    }
    assert.equal(signup.status, 200, "Signup succeeded");
    const cookie = signup.headers
      .getSetCookie()
      .map((v) => v.split(";")[0])
      .join("; ");
    assert.ok(cookie, "Session cookie issued");
    const session = await (
      await fetch(`${origin}/api/auth/get-session`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(session.user.email, email);
    const bad = await post("sign-in/email", { email, password: "not-the-password" });
    assert.equal(bad.status, 401);
    const login = await post("sign-in/email", { email, password });
    assert.equal(login.status, 200);
    const crossSite = await fetch(`${origin}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://untrusted.invalid" },
      body: JSON.stringify({ email, password, name: "No" }),
    });
    assert.equal(crossSite.status, 403);
    const signout = await post("sign-out", {}, cookie);
    assert.equal(signout.status, 200);
    // Bypass signed cookie-cache: verify revocation against the server token.
    const tokenCookie = cookie
      .split("; ")
      .filter((v) => v.startsWith("__Host-grok-auth.session_token="))
      .join("; ");
    const after = await (
      await fetch(`${origin}/api/auth/get-session`, { headers: { Cookie: tokenCookie } })
    ).json();
    assert.equal(after, null);
    console.log("PASS signup, session, invalid password, login, CSRF and logout");
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => child.once("exit", resolve));
  }
}
await run("");
await run(randomBytes(32).toString("hex"));
