import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { googleSignInAvailable } from "@/lib/auth/google";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}

type Mode = "login" | "signup" | "forgot" | "reset";

export function AccessScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [token, setToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [googleOn, setGoogleOn] = useState(false);

  useEffect(() => {
    googleSignInAvailable()
      .then(setGoogleOn)
      .catch(() => setGoogleOn(false));
  }, []);

  async function withGoogle() {
    setError("");
    setBusy(true);
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
      if (result.error) {
        setError("No se pudo entrar con Google. Inténtalo de nuevo.");
        setBusy(false);
      }
    } catch {
      setError("No se pudo entrar con Google. Inténtalo de nuevo.");
      setBusy(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("token")) {
      setToken(params.get("token") ?? "");
      setMode("reset");
      window.history.replaceState(null, "", "/restablecer");
    } else if (params.has("error")) {
      setMode("forgot");
      setError("El enlace ha caducado o no es válido. Solicita uno nuevo.");
    }
  }, []);

  function changeMode(next: Mode) {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setError("");
    setMessage("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if ((mode === "signup" || mode === "reset") && password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        const result = await authClient.signIn.email({ email: email.trim(), password });
        if (result.error) setError("No se pudo ingresar. Revisa tu correo y contraseña.");
        else window.location.assign("/");
      } else if (mode === "signup") {
        const result = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: "Usuaria de NEUSTA",
        });
        if (result.error)
          setError("No se pudo crear la cuenta. Revisa los datos o intenta ingresar.");
        else window.location.assign("/");
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: `${window.location.origin}/restablecer`,
        });
        if (result.error) {
          setError("No se pudo solicitar la recuperación. Inténtalo más tarde.");
        } else {
          setMessage(
            "Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña.",
          );
        }
      } else {
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error) {
          setError("El enlace no es válido o ha caducado. Solicita uno nuevo.");
        } else {
          window.history.replaceState(null, "", "/restablecer");
          changeMode("login");
          setMessage("Tu contraseña se actualizó. Ya puedes ingresar.");
        }
      }
    } catch {
      setError("No fue posible conectar con el servicio. Inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  const title = {
    login: "Bienvenida",
    signup: "Crea tu cuenta",
    forgot: "Recupera tu acceso",
    reset: "Nueva contraseña",
  }[mode];

  return (
    <main className="access-page">
      <div className="access-card glass">
        <p className="brand">NEUSTA</p>
        <h1>{title}</h1>
        <p className="access-intro">
          {mode === "login" && "Ingresa para descubrir tu look a tu medida."}
          {mode === "signup" && "Tu espacio personal para descubrir nuevos looks."}
          {mode === "forgot" && "Te enviaremos un enlace para restablecer tu contraseña."}
          {mode === "reset" && "Elige una contraseña nueva para tu cuenta."}
        </p>
        {googleOn && (mode === "login" || mode === "signup") && (
          <>
            <button
              type="button"
              onClick={() => void withGoogle()}
              disabled={busy}
              className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-line bg-white px-5 text-[15px] font-medium text-ink shadow-sm"
            >
              <GoogleIcon />
              Continuar con Google
            </button>
            <p className="my-4 flex items-center gap-3 text-xs text-muted" aria-hidden="true">
              <span className="h-px flex-1 bg-line" />o con tu correo
              <span className="h-px flex-1 bg-line" />
            </p>
          </>
        )}
        <form className="access-form" onSubmit={submit}>
          {mode !== "reset" && (
            <label>
              Correo electrónico
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Contraseña
              <span className="access-password">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
              {mode !== "login" && <span className="access-hint">Mínimo 8 caracteres.</span>}
            </label>
          )}
          {(mode === "signup" || mode === "reset") && (
            <label>
              Confirmar contraseña
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
          )}
          {error && (
            <p className="access-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="access-message" role="status">
              {message}
            </p>
          )}
          {mode === "login" && (
            <button className="access-link" type="button" onClick={() => changeMode("forgot")}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
          <button className="access-submit" type="submit" disabled={busy}>
            {busy
              ? "Un momento..."
              : {
                  login: "Ingresar",
                  signup: "Crear cuenta",
                  forgot: "Enviar enlace",
                  reset: "Guardar contraseña",
                }[mode]}
          </button>
        </form>
        <p className="access-switch">
          {mode === "login" ? "¿Aún no tienes cuenta? " : "¿Ya tienes una cuenta? "}
          <button type="button" onClick={() => changeMode(mode === "login" ? "signup" : "login")}>
            {mode === "login" ? "Crear cuenta" : "Ingresar"}
          </button>
        </p>
      </div>
    </main>
  );
}
