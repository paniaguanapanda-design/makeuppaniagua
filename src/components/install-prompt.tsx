import { useEffect, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "neusta-install-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** Botón flotante "Instalar app": aparece solo cuando el navegador permite instalar NEUSTA. */
export function InstallPrompt() {
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (readDismissed()) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!event || hidden) return null;

  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* sin almacenamiento: se vuelve a mostrar la próxima vez */
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Instalar NEUSTA"
      className="glass fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm items-center gap-3 rounded-full px-4 py-3"
    >
      <img src="/icon-192.png" alt="" width={40} height={40} className="rounded-xl" />
      <div className="min-w-0 flex-1 text-left">
        <p className="text-sm font-semibold text-ink">Instala NEUSTA</p>
        <p className="text-xs text-muted">Ábrela como una app.</p>
      </div>
      <button
        type="button"
        className="min-h-11 rounded-full px-4 text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg,#b4546c,#8f3c52)" }}
        onClick={async () => {
          await event.prompt();
          await event.userChoice.catch(() => undefined);
          setEvent(null);
        }}
      >
        Instalar
      </button>
      <button
        type="button"
        aria-label="Cerrar"
        className="min-h-11 min-w-11 text-lg text-muted"
        onClick={close}
      >
        ×
      </button>
    </div>
  );
}
