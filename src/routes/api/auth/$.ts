import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  if ((process.env.BETTER_AUTH_SECRET?.trim().length ?? 0) < 32) {
    return Response.json(
      { message: "El registro aún no está activado. Falta configurar la autenticación segura." },
      { status: 503 },
    );
  }
  const { auth } = await import("@/lib/auth/server");
  return auth.handler(request);
}

export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { GET: handle, POST: handle } },
});
