import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { z } from "zod";
import { getSql } from "@/lib/db";

const SITUATIONS = [
  "dia",
  "oficina",
  "entrevista",
  "cita",
  "boda",
  "fiesta",
  "fotos",
  "editorial",
] as const;

const stepSchema = z.object({
  zone: z.string().max(20),
  title: z.string().max(120),
  instruction: z.string().max(900),
});

export type SavedStep = z.infer<typeof stepSchema>;

export type SavedLook = {
  id: string;
  createdAt: string;
  situation: (typeof SITUATIONS)[number];
  look: "natural" | "medio" | "glam";
  image: string;
  steps: SavedStep[];
};

const MAX_LOOKS = 30;

/** Guarda (o actualiza) el look elegido en la cuenta de la usuaria. */
export const saveLook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: z.string().uuid(),
      situation: z.enum(SITUATIONS),
      look: z.enum(["natural", "medio", "glam"]),
      image: z.string().startsWith("data:image/jpeg;base64,").max(900_000),
      steps: z.array(stepSchema).max(12),
    }),
  )
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`
      insert into saved_looks (id, user_id, situation, look, image, steps)
      values (${data.id}, ${context.userId}, ${data.situation}, ${data.look}, ${data.image},
              ${JSON.stringify(data.steps)}::jsonb)
      on conflict (id) do update set image = excluded.image, steps = excluded.steps
      where saved_looks.user_id = ${context.userId}`;
    // Solo los más recientes: la foto pesa y no hace falta un archivo infinito.
    await sql`
      delete from saved_looks where user_id = ${context.userId} and id not in (
        select id from saved_looks where user_id = ${context.userId}
        order by created_at desc limit ${MAX_LOOKS})`;
    console.log(`[mis-looks] guardado ${data.look} (${data.situation})`);
    return { ok: true };
  });

export const listLooks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<SavedLook[]> => {
    const sql = await getSql();
    const rows = await sql<{
      id: string;
      created_at: string | Date;
      situation: SavedLook["situation"];
      look: SavedLook["look"];
      image: string;
      steps: SavedStep[] | string;
    }>`
      select id, created_at, situation, look, image, steps from saved_looks
      where user_id = ${context.userId} order by created_at desc limit ${MAX_LOOKS}`;
    return rows.map((row) => ({
      id: row.id,
      createdAt: new Date(row.created_at).toISOString(),
      situation: row.situation,
      look: row.look,
      image: row.image,
      steps: typeof row.steps === "string" ? (JSON.parse(row.steps) as SavedStep[]) : row.steps,
    }));
  });

export const deleteLook = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    const sql = await getSql();
    await sql`delete from saved_looks where id = ${data.id} and user_id = ${context.userId}`;
    return { ok: true };
  });
