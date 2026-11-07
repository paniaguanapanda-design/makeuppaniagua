import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth/client";

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
        if (result.error) setError("No se pudo crear la cuenta. Revisa los datos o intenta ingresar.");
        else window.location.assign("/");
      } else if (mode === "forgot") {
        const result = await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: `${window.location.origin}/restablecer`,
        });
        if (result.error) {
          setError("No se pudo solicitar la recuperación. Inténtalo más tarde.");
        } else {
          setMessage("Si existe una cuenta con ese correo, recibirás un enlace para recuperar tu contraseña.");
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
        <form className="access-form" onSubmit={submit}>
          {mode !== "reset" && (
            <label>
              Correo electrónico
              <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Contraseña
              <span className="access-password">
                <input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </span>
              {mode !== "login" && <span className="access-hint">Mínimo 8 caracteres.</span>}
            </label>
          )}
          {(mode === "signup" || mode === "reset") && (
            <label>
              Confirmar contraseña
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} />
            </label>
          )}
          {error && <p className="access-error" role="alert">{error}</p>}
          {message && <p className="access-message" role="status">{message}</p>}
          {mode === "login" && <button className="access-link" type="button" onClick={() => changeMode("forgot")}>¿Olvidaste tu contraseña?</button>}
          <button className="access-submit" type="submit" disabled={busy}>
            {busy ? "Un momento..." : { login: "Ingresar", signup: "Crear cuenta", forgot: "Enviar enlace", reset: "Guardar contraseña" }[mode]}
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
