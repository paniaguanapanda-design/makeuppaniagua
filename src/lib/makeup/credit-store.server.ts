import { createHash, randomUUID } from "node:crypto";
import type { Sql } from "@/lib/db";

export const TRIAL_LIMIT = 3;
export const photoHash = (photo: string) => createHash("sha256").update(photo).digest("hex");

export async function remainingCredit(sql: Sql, userId: string) {
  const rows = await sql.query<{ used: number }>(
    "select used from makeup_trial_credit where user_id = $1",
    [userId],
  );
  return TRIAL_LIMIT - (rows[0]?.used ?? 0);
}

export async function reserveTrial(
  sql: Sql,
  userId: string,
  requestId: string,
  situation: string,
  photo: string,
) {
  // A retry of the same catalog request reuses its reservation, never spends twice.
  const existing = await sql.query<{ id: string; situation: string; photo_hash: string }>(
    "select id, situation, photo_hash from makeup_trial where user_id = $1 and request_id = $2",
    [userId, requestId],
  );
  if (existing[0]) {
    if (existing[0].situation !== situation || existing[0].photo_hash !== photoHash(photo))
      throw new Error("Esta prueba pertenece a otra foto u ocasión.");
    return existing[0].id;
  }
  // One statement: counter increment and reservation commit together. A unique
  // request conflict rolls back the increment, even across server instances.
  try {
    const rows = await sql.query<{ id: string }>(
      `
      with credit as (
        insert into makeup_trial_credit(user_id, used) values ($1, 1)
        on conflict(user_id) do update set used = makeup_trial_credit.used + 1
        where makeup_trial_credit.used < 3 returning user_id
      )
      insert into makeup_trial(id, user_id, request_id, situation, photo_hash)
      select $2::uuid, user_id, $3::uuid, $4, $5 from credit returning id
    `,
      [userId, randomUUID(), requestId, situation, photoHash(photo)],
    );
    if (!rows[0])
      throw new Error("Has agotado tus 3 pruebas gratuitas. No se realizarán más generaciones.");
    return rows[0].id;
  } catch (error) {
    // Another copy of the SAME request might have won the unique constraint.
    const rows = await sql.query<{ id: string; situation: string; photo_hash: string }>(
      "select id, situation, photo_hash from makeup_trial where user_id = $1 and request_id = $2",
      [userId, requestId],
    );
    if (rows[0]?.situation === situation && rows[0]?.photo_hash === photoHash(photo))
      return rows[0].id;
    throw error;
  }
}

export async function claimGeneration(
  sql: Sql,
  userId: string,
  trialId: string,
  situation: string,
  photo: string,
  optionId: string,
) {
  const rows = await sql.query<{ option_id: string }>(
    `
    insert into makeup_trial_attempt(trial_id, option_id)
    select id, $5 from makeup_trial
    where id = $1::uuid and user_id = $2 and situation = $3 and photo_hash = $4
    on conflict do nothing returning option_id
  `,
    [trialId, userId, situation, photoHash(photo), optionId],
  );
  if (!rows[0])
    throw new Error(
      "Esta generación ya se utilizó o la prueba no pertenece a tu cuenta y foto. No se ha llamado a Grok.",
    );
}
