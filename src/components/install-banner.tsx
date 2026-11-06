import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // En iOS no hay beforeinstallprompt, mostramos el banner igual si no está instalada
    if (ios && !window.matchMedia("(display-mode: standalone)").matches) {
      setShow(true);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || dismissed) return null;

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
      setDeferredPrompt(null);
    } else if (isIOS) {
      alert("En Safari: toca el botón de compartir (cuadrado con flecha) y luego \u201cAñadir a pantalla de inicio\u201d.");
    }
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[min(92%,380px)] -translate-x-1/2">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/40 bg-white/80 px-4 py-3 shadow-lg backdrop-blur-md">
        <div className="text-sm">
          <p className="font-medium">Instala NEUSTA</p>
          <p className="text-xs text-muted">Añádela a tu pantalla de inicio</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="text-xs text-muted"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={install}
            className="rounded-full bg-ink px-4 py-2 text-sm text-surface"
          >
            Instala
          </button>
        </div>
      </div>
    </div>
  );
}
