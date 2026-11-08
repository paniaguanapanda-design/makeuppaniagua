import { getSql } from "@/lib/db";

/**
 * Reserva una generación de imagen para hoy. Devuelve false si la usuaria ya
 * gastó su cupo diario (MAX_GENERATIONS_PER_IP, 9 por defecto).
 * MUST keep the `.server` suffix: solo se importa dentro de handlers.
 */
export async function takeImageQuota(userId: string) {
  const limit = Number(process.env.MAX_GENERATIONS_PER_IP ?? 9);
  if (!Number.isFinite(limit) || limit <= 0) return true;
  try {
    const sql = await getSql();
    const rows = await sql<{ count: number }>`
      insert into image_usage (client, day, count)
      values (${`user:${userId}`}, current_date, 1)
      on conflict (client, day) do update set count = image_usage.count + 1
      returning count`;
    return Number(rows[0]?.count ?? 1) <= limit;
  } catch (error) {
    console.error("[ai-look] no pude comprobar el cupo", error);
    return true;
  }
}
