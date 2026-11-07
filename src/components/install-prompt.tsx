import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISSED_UNTIL = "neusta.install-dismissed-until";
const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Site-owned invitation; native installation still requires browser support and a click. */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [busy, setBusy] = useState(false);
  const [help, setHelp] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_UNTIL, String(Date.now() + WEEK));
    } catch {
      /* Storage may be unavailable. */
    }
    dialog.current?.close();
  }

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const isInstalled = () =>
      media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    let installed = isInstalled();
    const onPrompt = (e: Event) => {
      e.preventDefault();
      if (!installed) setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      installed = true;
      setEvent(null);
      dialog.current?.close();
    };
    const onDisplayChange = () => {
      if (isInstalled()) onInstalled();
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", onDisplayChange);
    let deferred = false;
    try {
      deferred = Number(localStorage.getItem(DISMISSED_UNTIL)) > Date.now();
    } catch {
      /* Still offer help without storage. */
    }
    // Register the native event listener immediately, before showing the invitation.
    const timer = window.setTimeout(() => {
      if (!installed && !deferred && !dialog.current?.open) dialog.current?.showModal();
    }, 1200);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", onDisplayChange);
    };
  }, []);

  async function install() {
    if (!event) {
      setHelp(true);
      setMessage(
        "El navegador no ofrece instalación directa en este momento. Puedes probar desde su menú.",
      );
      return;
    }
    setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") {
        dismiss();
      } else {
        setHelp(true);
        setMessage("Has cancelado la instalación. Puedes seguir usando la web o elegir Ahora no.");
      }
    } catch {
      setHelp(true);
      setMessage(
        "El navegador no pudo abrir la instalación. Consulta las instrucciones siguientes.",
      );
    } finally {
      setEvent(null);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="install-title"
      aria-describedby="install-description"
      onCancel={dismiss}
      className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-black/40"
    >
      <h2 id="install-title" className="font-display text-3xl">
        Lleva NEUSTA contigo
      </h2>
      <p id="install-description" className="mt-4 text-sm">
        Instala NEUSTA para abrirla desde tu pantalla de inicio. También puedes seguir usando la web
        sin instalar.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          disabled={busy}
          type="button"
          onClick={install}
          className="min-h-11 rounded-full bg-ink px-5 text-surface"
        >
          {busy ? "Abriendo…" : "Instalar"}
        </button>
        <button
          disabled={busy}
          type="button"
          onClick={dismiss}
          className="min-h-11 rounded-full border border-line px-5"
        >
          Ahora no
        </button>
      </div>
      <p className="mt-3 text-xs text-muted">
        Si eliges Ahora no, no volveremos a mostrar este aviso durante 7 días en este navegador.
        Puedes instalar desde el menú del navegador cuando quieras.
      </p>
      <p role="status" className="mt-3 text-sm">
        {message}
      </p>
      {help ? (
        <ul className="mt-4 space-y-3 text-sm">
          <li>
            <strong>Android (Chrome):</strong> abre ⋮ → Instalar y crear acceso directo → Instalar,
            si aparece. En otras versiones puede llamarse «Añadir a pantalla de inicio».
          </li>
          <li>
            <strong>iPhone o iPad:</strong> abre NEUSTA en Safari. En Compartir, elige «Añadir a
            pantalla de inicio» y, si aparece, activa «Abrir como app web».
          </li>
          <li>
            <strong>Chrome o Edge en ordenador:</strong> busca el icono de instalación en la barra
            de direcciones o la opción de instalar en el menú.
          </li>
          <li>
            La instalación depende del navegador y dispositivo; no es una descarga APK. Un marcador
            no equivale a instalar una app.
          </li>
        </ul>
      ) : null}
    </dialog>
  );
}
