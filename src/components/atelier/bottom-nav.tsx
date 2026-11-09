import { useEffect, useRef, useState, type ReactNode } from "react";
import { CircleUserRound, Globe, LogOut } from "lucide-react";
import { LanguageSwitch, useLang } from "@/lib/i18n";

export type NavTab = "home" | "create" | "looks";
export type NavVariant = "petalo" | "arcoiris" | "joya";

type IconProps = { className?: string };

const svg = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

/** Espejo de mano: inicio. */
export function MirrorIcon({ className }: IconProps) {
  return (
    <svg {...svg} className={className}>
      <ellipse cx="12" cy="8.6" rx="5.6" ry="6.4" />
      <path d="M9.4 6.2c.6-1 1.5-1.6 2.6-1.8" />
      <path d="M12 15v6.5M10 21.5h4" />
    </svg>
  );
}

/** Brocha de maquillaje: crear look. */
export function BrushIcon({ className }: IconProps) {
  return (
    <svg {...svg} className={className}>
      <path d="M14.2 9.8c-.4-3.6 2.2-6.5 6.3-6.8-.2 4.1-3.1 6.7-6.3 6.8Z" />
      <path d="m12.6 9.6 1.8 1.8" />
      <path d="M13.5 10.5 4 20" />
      <path d="M4.5 6.5v2M3.5 7.5h2M8.5 3v1.5M7.75 3.75h1.5" />
    </svg>
  );
}

/** Pintalabios: mis looks. */
export function LipstickIcon({ className }: IconProps) {
  return (
    <svg {...svg} className={className}>
      <path d="M10 9.5V5.4L14 3v6.5" />
      <rect x="8.6" y="9.5" width="6.8" height="4" rx="0.8" />
      <rect x="7.6" y="13.5" width="8.8" height="8" rx="1.4" />
    </svg>
  );
}

type Item = { id: string; label: string; icon: ReactNode; active?: boolean; onClick?: () => void };

/**
 * Barra de navegación inferior: inicio, crear look, mis looks, idioma y cuenta.
 * Publica su altura en --nav-h para que nada quede tapado.
 */
export function BottomNav({
  active,
  variant,
  onNavigate,
  onSignOut,
}: {
  active: NavTab | null;
  variant: NavVariant;
  onNavigate: (tab: NavTab) => void;
  onSignOut: () => void;
}) {
  const { t } = useLang();
  const [account, setAccount] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nav-h", variant === "arcoiris" ? "4.75rem" : "5.5rem");
    return () => root.style.setProperty("--nav-h", "0px");
  }, [variant]);

  useEffect(() => {
    if (!account) return;
    const close = (event: Event) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccount(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [account]);

  const tabs: Item[] = [
    {
      id: "home",
      label: t("nav.home"),
      icon: <MirrorIcon className="nav-icon" />,
      active: active === "home",
      onClick: () => onNavigate("home"),
    },
    {
      id: "create",
      label: t("nav.create"),
      icon: <BrushIcon className="nav-icon" />,
      active: active === "create",
      onClick: () => onNavigate("create"),
    },
    {
      id: "looks",
      label: t("nav.looks"),
      icon: <LipstickIcon className="nav-icon" />,
      active: active === "looks",
      onClick: () => onNavigate("looks"),
    },
  ];

  const button = (item: Item) => (
    <button
      key={item.id}
      type="button"
      onClick={item.onClick}
      aria-current={item.active ? "page" : undefined}
      className={`nav-item nav-${item.id} ${item.active ? "is-active" : ""}`}
    >
      <span className="nav-bubble">{item.icon}</span>
      <span className="nav-label">{item.label}</span>
    </button>
  );

  return (
    <nav className={`bottom-nav nav-${variant}`} aria-label="NEUSTA">
      <div className="bottom-nav-inner">
        {button(tabs[0])}
        {button(tabs[1])}
        {button(tabs[2])}
        <LanguageSwitch placement="up" className="nav-item nav-lang">
          <span className="nav-bubble">
            <Globe className="nav-icon" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <span className="nav-label">{t("nav.lang")}</span>
        </LanguageSwitch>
        <div ref={accountRef} className="nav-item nav-account relative">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={account}
            onClick={() => setAccount((value) => !value)}
            className="lang-trigger"
          >
            <span className="nav-bubble">
              <CircleUserRound className="nav-icon" strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className="nav-label">{t("nav.account")}</span>
          </button>
          {account ? (
            <div role="menu" className="lang-pop glass is-up is-right">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAccount(false);
                  onSignOut();
                }}
              >
                <LogOut className="size-4" strokeWidth={1.6} aria-hidden="true" />
                <span>{t("common.signOut")}</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
