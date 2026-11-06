import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function AccountScreen({ onSuccess }: { onSuccess: () => void }) {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="mx-auto max-w-md px-5 py-12">
      <h1 className="font-display text-4xl">{register ? "Crea tu cuenta" : "Entra en NEUSTA"}</h1>
      <p className="mt-4 text-sm">
        Accede con tu correo y contraseña o crea una cuenta para NEUSTA.
      </p>
      <form
        className="mt-6 flex flex-col gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setBusy(true);
          const form = new FormData(event.currentTarget);
          const email = String(form.get("email"));
          const password = String(form.get("password"));
          try {
            const result = register
              ? await authClient.signUp.email({ email, password, name: String(form.get("name")) })
              : await authClient.signIn.email({ email, password });
            if (result.error)
              setError(
                result.error.status === 503
                  ? "El registro aún no está activado. Falta configurar la autenticación segura."
                  : "No se pudo acceder. Revisa tus datos o inténtalo más tarde.",
              );
            else {
              await authClient.getSession();
              onSuccess();
            }
          } catch {
            setError("No pude conectar con el servicio de acceso.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {register ? (
          <label>
            Nombre
            <input
              name="name"
              required
              maxLength={100}
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-line p-3"
            />
          </label>
        ) : null}
        <label>
          Correo electrónico
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-line p-3"
          />
        </label>
        <label>
          Contraseña
          <input
            name="password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete={register ? "new-password" : "current-password"}
            className="mt-1 w-full rounded-xl border border-line p-3"
          />
        </label>
        {error ? (
          <p role="alert" className="text-sm text-blush">
            {error}
          </p>
        ) : null}
        <button disabled={busy} className="min-h-11 rounded-full bg-ink px-5 text-surface">
          {busy ? "Un momento…" : register ? "Crear cuenta" : "Iniciar sesión"}
        </button>
      </form>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setRegister(!register);
          setError("");
        }}
        className="mt-5 min-h-11 underline"
      >
        {register ? "Ya tengo cuenta" : "Crear una cuenta gratuita"}
      </button>
    </main>
  );
}
