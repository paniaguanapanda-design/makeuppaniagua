import { z } from "zod";

export const REVIEW_PHOTO_MAX_BYTES = 300 * 1024;
export const REVIEW_CONSENT_VERSION = "2026-11-06-v1";
export const REVIEW_CONSENT_TEXT =
  "Autorizo a publicar mi reseña y mi nombre en esta web, junto con la foto opcional que adjunte.";

const photoSchema = z
  .string()
  .max(4 * Math.ceil(REVIEW_PHOTO_MAX_BYTES / 3) + 30)
  .regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/)
  .refine((value) => {
    try {
      const bytes = atob(value.slice(value.indexOf(",") + 1));
      if (bytes.length > REVIEW_PHOTO_MAX_BYTES) return false;
      return value.startsWith("data:image/png;")
        ? bytes.startsWith("\x89PNG\r\n\x1a\n")
        : bytes.startsWith("\xff\xd8\xff");
    } catch {
      return false;
    }
  }, "Adjunta una foto JPG o PNG de hasta 300 KB.");

export const feedbackSchema = z
  .object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000),
    situation: z.string().max(40).optional(),
    displayName: z.string().trim().max(80).default(""),
    contactEmail: z.union([z.email().max(254), z.literal("")]).optional(),
    publicationConsent: z.boolean().default(false),
    photo: photoSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.publicationConsent && (!data.displayName || !data.comment)) {
      ctx.addIssue({ code: "custom", message: "Para publicar, indica tu nombre y un comentario." });
    }
    if (data.photo && !data.publicationConsent) {
      ctx.addIssue({ code: "custom", message: "La foto requiere autorización de publicación." });
    }
  });
