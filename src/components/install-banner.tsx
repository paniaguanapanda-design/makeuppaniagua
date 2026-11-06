import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // No mostrar si ya está instalada o si el usuario la cerró
  if (isStandalone || dismissed) return null;

  async function install() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDismissed(true);
      setDeferredPrompt(null);
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert(
          "Para instalar en iPhone:\n1. Toca el botón de compartir (cuadrado con flecha arriba)\n2. Elige \u201cAñadir a pantalla de inicio\u201d",
        );
      } else {
        alert(
          "Para instalar:\n1. Abre el menú del navegador (los tres puntos)\n2. Elige \u201cAñadir a la pantalla de inicio\u201d o \u201cInstalar app\u201d",
        );
      }
    }
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-50 w-[min(94%,400px)] -translate-x-1/2">
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/50 bg-white/90 px-4 py-3.5 shadow-xl backdrop-blur-lg">
        <div>
          <p className="text-sm font-semibold">Instala NEUSTA</p>
          <p className="text-xs text-muted">Añádela a tu pantalla de inicio</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="px-2 text-xs text-muted"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={install}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-surface"
          >
            Instala
          </button>
        </div>
      </div>
    </div>
  );
}
