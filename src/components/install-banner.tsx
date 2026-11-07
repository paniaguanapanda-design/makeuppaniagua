import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { dismissInstall, installDismissedRecently } from "@/lib/makeup/memory";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

/** Invitación a instalar la web app. Reserva su propio espacio para no tapar contenido. */
export function InstallBanner({ ready }: { ready: boolean }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    setDismissed(installDismissedRecently());

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // No mostrar si ya está instalada o si el usuario la cerró
  if (isStandalone || dismissed || !ready) return null;

  function close() {
    dismissInstall();
    setDismissed(true);
  }

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") close();
      setDeferredPrompt(null);
    } else {
      setShowHelp(true);
    }
  }

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <>
      <div className="h-28" aria-hidden="true" />
      <div
        className="toast-enter fixed bottom-4 left-1/2 z-40 w-[min(92%,400px)] -translate-x-1/2"
        role="dialog"
        aria-label="Instalar NEUSTA"
      >
        <div className="rounded-2xl border border-line bg-surface/95 px-4 py-3.5 shadow-xl backdrop-blur-lg">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blush/10 text-blush">
              <Download className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Ten NEUSTA a mano</p>
              <p className="text-xs text-muted">Añádela a tu pantalla de inicio</p>
            </div>
            <button
              type="button"
              onClick={() => void install()}
              className="min-h-10 rounded-full bg-ink px-4 text-sm font-medium text-surface"
            >
              Añadir
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="icon-button -mr-2 text-muted"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
          {showHelp ? (
            <p className="mt-3 border-t border-line pt-3 text-xs text-muted">
              {isIOS
                ? "En Safari, pulsa el botón Compartir (cuadrado con flecha) y elige «Añadir a pantalla de inicio»."
                : "Abre el menú del navegador (los tres puntos) y elige «Instalar app» o «Añadir a pantalla de inicio»."}
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
}
