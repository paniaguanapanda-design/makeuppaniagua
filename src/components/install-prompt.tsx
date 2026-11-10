import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "neusta-install-dismissed-at";
const WEEK = 7 * 24 * 60 * 60 * 1000;

function dismissedRecently(): boolean {
  try {
    return Date.now() - Number(localStorage.getItem(KEY) ?? 0) < WEEK;
  } catch {
    return false;
  }
}

function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/**
 * Invitación a instalar NEUSTA en cuanto se entra. Si el navegador permite
 * instalar directamente (Android/Chrome), lo hace; si no (iPhone), explica cómo.
 * Publica su altura en --install-h para que la página no quede tapada.
 */
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [event, setEvent] = useState<InstallEvent | null>(null);
  const [help, setHelp] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (isInstalled() || dismissedRecently()) return;
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setVisible(true);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvent(e as InstallEvent);
    };
    const onInstalled = () => setVisible(false);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--install-h", visible ? (help ? "9rem" : "6rem") : "0px");
    return () => root.style.setProperty("--install-h", "0px");
  }, [visible, help]);

  if (!visible) return null;

  const close = () => {
    setVisible(false);
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* sin almacenamiento: se vuelve a mostrar la próxima vez */
    }
  };

  const install = async () => {
    if (!event) {
      setHelp(true);
      return;
    }
    await event.prompt();
    const choice = await event.userChoice.catch(() => undefined);
    setEvent(null);
    if (choice?.outcome === "accepted") setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Instalar NEUSTA"
      className="install-prompt glass fixed inset-x-4 z-50 mx-auto max-w-sm rounded-[1.6rem] px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="" width={40} height={40} className="rounded-xl" />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-semibold text-ink">{t("install.title")}</p>
          <p className="text-xs text-muted">{t("install.sub")}</p>
        </div>
        <button
          type="button"
          className="min-h-11 rounded-full px-4 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg,#b4546c,#8f3c52)" }}
          onClick={() => void install()}
        >
          {t("install.btn")}
        </button>
        <button
          type="button"
          aria-label={t("install.close")}
          className="min-h-11 min-w-11 text-lg text-muted"
          onClick={close}
        >
          ×
        </button>
      </div>
      {help ? (
        <p className="mt-2 border-t border-line pt-2 text-left text-xs leading-5 text-muted">
          {isIOS ? t("install.ios") : t("install.other")}
        </p>
      ) : null}
    </div>
  );
}
