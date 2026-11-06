import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Siempre accesible; la instalación nativa depende del navegador, no de NEUSTA. */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const update = () =>
      setInstalled(
        media.matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
      );
    update();
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvent(null);
      setMessage("NEUSTA se ha instalado.");
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    media.addEventListener("change", update);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      media.removeEventListener("change", update);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className="min-h-11 px-2 text-xs sm:text-sm"
        onClick={() => {
          setMessage("");
          dialog.current?.showModal();
        }}
      >
        {installed ? "App instalada" : "Instalar app"}
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="install-title"
        className="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-surface p-6 text-ink shadow-xl backdrop:bg-black/40"
      >
        <h2 id="install-title" className="font-display text-3xl">
          Instalar NEUSTA
        </h2>
        {installed ? (
          <p className="mt-4">
            Ya estás usando NEUSTA como app o el navegador confirmó su instalación.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm">
              La web funciona sin instalar. La instalación depende de tu navegador y dispositivo; no
              todos la permiten.
            </p>
            {event ? (
              <button
                disabled={busy}
                type="button"
                className="mt-4 min-h-11 rounded-full bg-ink px-5 text-surface"
                onClick={async () => {
                  setBusy(true);
                  try {
                    await event.prompt();
                    const choice = await event.userChoice;
                    setMessage(
                      choice.outcome === "accepted"
                        ? "Solicitud aceptada. El navegador completará la instalación."
                        : "Has cancelado la instalación. Puedes seguir usando la web.",
                    );
                  } catch {
                    setMessage(
                      "El navegador no pudo abrir la instalación. Consulta las instrucciones siguientes.",
                    );
                  } finally {
                    setEvent(null);
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Abriendo…" : "Instalar en este dispositivo"}
              </button>
            ) : null}
            <ul className="mt-5 space-y-4 text-sm">
              <li>
                <strong>iPhone o iPad:</strong> abre NEUSTA en Safari. En Compartir, elige «Añadir a
                pantalla de inicio» y, si aparece, activa «Abrir como app web».
              </li>
              <li>
                <strong>Android:</strong> busca «Instalar aplicación» o «Añadir a pantalla de
                inicio» en el menú del navegador, si está disponible.
              </li>
              <li>
                <strong>Chrome o Edge en ordenador:</strong> busca el icono de instalación en la
                barra de direcciones o la opción de instalar en el menú, si está disponible.
              </li>
              <li>
                <strong>Safari en Mac:</strong> con macOS Sonoma 14 o posterior, usa Archivo →
                Añadir al Dock.
              </li>
              <li>
                <strong>Firefox, otros navegadores o navegadores dentro de redes sociales:</strong>{" "}
                si no ofrecen instalar, abre la dirección en un navegador compatible. Como
                alternativa, guarda un marcador; no es lo mismo que instalar una app.
              </li>
            </ul>
          </>
        )}
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
        <button
          type="button"
          className="mt-5 min-h-11 rounded-full border border-line px-5"
          onClick={() => dialog.current?.close()}
        >
          Cerrar
        </button>
      </dialog>
    </>
  );
}
