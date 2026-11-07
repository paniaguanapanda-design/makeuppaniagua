import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

function handle(request: Request) {
  if (
    process.env.VITE_AUTH_ENABLED === "false" ||
    (process.env.BETTER_AUTH_SECRET?.trim().length ?? 0) < 32
  ) {
    return new Response("El acceso no está configurado.", { status: 503 });
  }
  if (
    process.env.VERCEL &&
    (!process.env.DATABASE_URL?.trim() ||
      !process.env.BETTER_AUTH_SECRET?.trim() ||
      !process.env.BETTER_AUTH_URL?.trim() ||
      process.env.VITE_AUTH_ENABLED === "false")
  ) {
    console.error("[auth] Persistent database, auth secret, URL, or auth flag is not configured");
    return new Response("El acceso no está configurado. Inténtalo más tarde.", { status: 503 });
  }
  if (
    new URL(request.url).pathname.endsWith("/request-password-reset") &&
    (!process.env.RESEND_API_KEY?.trim() || !process.env.FEEDBACK_EMAIL_FROM?.trim())
  ) {
    return new Response("La recuperación de contraseña no está configurada.", { status: 503 });
  }
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
    },
  },
});
