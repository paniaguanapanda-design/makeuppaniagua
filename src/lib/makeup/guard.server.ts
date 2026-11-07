import { createHash } from "node:crypto";
import { getRequest } from "@tanstack/react-start/server";
import { getSql } from "@/lib/db";

/**
 * Identificador anónimo de la visitante: hash de la IP, nunca la IP en claro.
 * MUST keep the `.server` suffix: imports `@tanstack/react-start/server`.
 */
export function clientId() {
  const headers = getRequest().headers;
  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headers.get("x-real-ip") || "desconocida";
  return createHash("sha256").update(`neusta:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Reserva `amount` generaciones de imagen para hoy. Devuelve cuántas se
 * conceden (0 si ya se gastó el cupo diario). Vive en la base de datos, así
 * que funciona aunque Vercel reparta las peticiones entre varias instancias.
 */
export async function takeImageQuota(amount: number) {
  const limit = Number(process.env.MAX_GENERATIONS_PER_IP ?? 6);
  if (!Number.isFinite(limit) || limit <= 0) return amount;
  try {
    const sql = await getSql();
    const rows = await sql<{ count: number }>`
      insert into image_usage (client, day, count)
      values (${clientId()}, current_date, ${amount})
      on conflict (client, day) do update set count = image_usage.count + excluded.count
      returning count`;
    const used = Number(rows[0]?.count ?? amount);
    const before = used - amount;
    return Math.max(0, Math.min(amount, limit - before));
  } catch (error) {
    console.error("[imagine] no pude comprobar el cupo", error);
    return amount;
  }
}
