import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { getSessionUser } from "@/lib/auth/verify.server";
import { dbSource, getSql } from "@/lib/db";

/** Never use a shared dev user or an ephemeral DB for paid inference. */
export async function creditContext() {
  assertSameSiteRequest();
  if ((process.env.BETTER_AUTH_SECRET?.trim().length ?? 0) < 32 || dbSource !== "neon") {
    throw new Error(
      "Las pruebas aún no están activadas: falta configurar la autenticación segura del servidor.",
    );
  }
  const user = await getSessionUser();
  if (!user) throw new Error("Inicia sesión para utilizar tus 3 pruebas gratuitas.");
  return { userId: user.id, sql: await getSql() };
}
