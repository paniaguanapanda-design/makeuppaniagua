import { useCallback, useEffect, useRef, useState } from "react";
import { KitScreen, type KitDraft } from "@/components/atelier/kit";
import { DirectoryScreen, HomeScreen, OccasionScreen } from "@/components/atelier/screens";
import { OptionsScreen } from "@/components/atelier/options";
import { ScannerScreen } from "@/components/atelier/scanner";
import { StepsScreen } from "@/components/atelier/steps";
import { FeedbackScreen } from "@/components/atelier/feedback";
import { LooksScreen } from "@/components/atelier/looks";
import { FLOW, FlowProgress } from "@/components/atelier/ui";
import { InstallBanner } from "@/components/install-banner";
import {
  referenceLooks,
  type FaceAnalysis,
  type ReferenceCard,
  type ReferenceResult,
} from "@/lib/makeup/imagine";
import { loadProfile, saveLook, saveProfile } from "@/lib/makeup/memory";
import { jpegDataUrl } from "@/lib/makeup/photo";
import { noteZones, personLine, type PersonBrief } from "@/lib/makeup/profile";
import { optionById, optionsFor, visibleZones, type OptionId } from "@/lib/makeup/references";
import { getDirectory, recommendLook } from "@/lib/makeup/server";
import type { Capture, Directory, LookPlan, SituationId } from "@/lib/makeup/types";
import { ArrowLeft, Bookmark, Check, Heart, Share2, Users } from "lucide-react";

const referenceJobs = new Map<string, Promise<ReferenceResult>>();

type View =
  "home" | "occasion" | "kit" | "scan" | "options" | "steps" | "feedback" | "directory" | "looks";

const VIEWS: View[] = [
  "home",
  "occasion",
  "kit",
  "scan",
  "options",
  "steps",
  "feedback",
  "directory",
  "looks",
];

function flowStep(view: View) {
  const index = (FLOW as readonly string[]).indexOf(view);
  return index === -1 ? 0 : index + 1;
}

export function AtelierApp() {
  const [view, setView] = useState<View>("home");
  const [situation, setSituation] = useState<SituationId | null>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [plan, setPlan] = useState<LookPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [cards, setCards] = useState<ReferenceCard[] | null>(null);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [limited, setLimited] = useState(false);
  const [shot, setShot] = useState(0);
  const [chosen, setChosen] = useState<ReferenceCard | null>(null);
  const [profile, setProfile] = useState<PersonBrief | null>(null);
  const [remembered, setRemembered] = useState<PersonBrief | null>(null);
  const [kitDraft, setKitDraft] = useState<KitDraft | null>(null);
  const [seen, setSeen] = useState({ skin: "", fromPhoto: false });
  const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // --- Navegación con el historial del navegador -------------------------
  // Cada pantalla es una entrada del historial: el gesto "atrás" del móvil
  // vuelve a la pantalla anterior en vez de sacar a la usuaria de la app.
  const ready = useRef({ situation, capture, chosen });
  ready.current = { situation, capture, chosen };

  const canShow = useCallback((next: View) => {
    const { situation: s, capture: c, chosen: ch } = ready.current;
    if (next === "kit" || next === "scan") return Boolean(s);
    if (next === "options") return Boolean(s && c);
    if (next === "steps" || next === "feedback") return Boolean(s && ch);
    return true;
  }, []);

  const viewRef = useRef<View>("home");
  viewRef.current = view;

  const go = useCallback((next: View) => {
    if (viewRef.current === next) return;
    viewRef.current = next;
    try {
      window.history.pushState({ ...(window.history.state ?? {}), neusta: next }, "");
    } catch {
      /* sin historial: navegamos igual */
    }
    setView(next);
  }, []);

  useEffect(() => {
    try {
      window.history.replaceState({ ...(window.history.state ?? {}), neusta: "home" }, "");
    } catch {
      /* ignore */
    }
    const onPop = (event: PopStateEvent) => {
      const wanted = (event.state as { neusta?: View } | null)?.neusta;
      const next = wanted && VIEWS.includes(wanted) && canShow(wanted) ? wanted : "home";
      setView(next);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [canShow]);

  function back() {
    const state = window.history.state as { neusta?: View } | null;
    if (state?.neusta && state.neusta !== "home") window.history.back();
    else setView("home");
  }

  // Cada pantalla nueva empieza arriba.
  useEffect(() => {
    setToast(null);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [view]);

  useEffect(() => {
    setRemembered(loadProfile());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // --- Datos -------------------------------------------------------------
  const loadDirectory = useCallback(() => {
    setCatalogError(null);
    getDirectory()
      .then((data) => {
        setDirectory(data);
        setCatalogError(null);
      })
      .catch((error: unknown) => {
        setCatalogError(error instanceof Error ? error.message : "No pude abrir el catálogo.");
      });
  }, []);

  const loadPlan = useCallback(() => {
    if (!situation) return;
    setPlan(null);
    setPlanError(null);
    const read = capture?.read;
    recommendLook({
      data: {
        situation,
        undertone: read?.undertone ?? "neutro",
        depth: read?.depth ?? "media",
        shape: analysis?.shape ?? read?.shape ?? "ovalado",
        owned: [],
        age: profile?.age ?? "joven",
        tastes: profile?.tastes ?? [],
        note: profile?.note ?? "",
        skin: [profile?.skin, seen.skin].filter(Boolean).join(". En la foto: ").slice(0, 300),
      },
    })
      .then((data) => setPlan(data))
      .catch((error: unknown) => {
        setPlanError(error instanceof Error ? error.message : "No pude armar el look.");
      });
  }, [situation, capture, profile, seen.skin, analysis]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (view === "steps" && !plan) loadPlan();
  }, [view, plan, loadPlan]);

  useEffect(() => {
    if (view !== "options" || cards || cardsError || !capture?.read || !situation) return;
    let alive = true;
    const read = capture.read;
    const owned = noteZones(profile?.note ?? "");
    const jobKey = `${shot}:${owned.join(",")}:${profile?.age ?? ""}:${profile?.tastes.join(",") ?? ""}:${profile?.note ?? ""}:${profile?.skin ?? ""}`;
    let job = referenceJobs.get(jobKey);
    if (!job) {
      job = referenceLooks({
        data: {
          situation,
          undertone: read.undertone,
          depth: read.depth,
          shape: read.shape,
          owned,
          age: profile?.age ?? "joven",
          tastes: profile?.tastes ?? [],
          note: profile?.note ?? "",
          skin: profile?.skin ?? "",
          years: profile?.years,
          photo: jpegDataUrl(capture.photo),
        },
      });
      referenceJobs.set(jobKey, job);
    }
    setCardsLoading(true);
    job
      .then((data) => {
        if (!alive) return;
        setCards(data.cards);
        setLimited(Boolean(data.limited));
        setSeen({ skin: data.skinSeen, fromPhoto: data.skinFromPhoto });
        setAnalysis(data.analysis);
        setCardsError(null);
      })
      .catch((error: unknown) => {
        referenceJobs.delete(jobKey);
        if (!alive) return;
        setCardsError(error instanceof Error ? error.message : "No pude crear las referencias.");
        setCards([
          ...optionsFor(situation).map((option) => ({
            id: option.id,
            title: option.title,
            line: option.line,
            imageUrl: "",
          })),
        ]);
      })
      .finally(() => {
        if (alive) setCardsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [view, shot, cards, cardsError, capture, situation, profile]);

  // --- Acciones del look --------------------------------------------------
  function storeLook() {
    if (!situation || !chosen) return;
    const option = optionById(situation, chosen.id as OptionId);
    const zones = visibleZones(option, noteZones(profile?.note ?? ""));
    const id = `${situation}-${chosen.id}-${Date.now()}`;
    saveLook({
      id,
      savedAt: new Date().toISOString(),
      situation,
      title: chosen.title,
      line: chosen.line,
      imageUrl: chosen.imageUrl,
      stylist: plan?.stylist.name ?? "",
      steps: (plan?.steps ?? [])
        .filter((step) => zones.includes(step.zone))
        .map((step) => ({
          zone: step.zone,
          title: step.title,
          instruction: step.instruction,
          product: `${step.product.brandName} · ${step.product.name} · ${step.product.shade}`,
        })),
    });
    setSavedId(`${situation}-${chosen.id}`);
    setToast("Guardado en Mis looks");
  }

  async function shareLook() {
    if (!chosen) return;
    const text = `Mi look «${chosen.title}» en NEUSTA: ${chosen.line}.`;
    const url = window.location.origin;
    try {
      if (navigator.share) {
        await navigator.share({ title: "NEUSTA", text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setToast("Enlace copiado");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setToast("No pude compartir. Prueba de nuevo.");
    }
  }

  const step = flowStep(view);
  const isSaved = Boolean(situation && chosen && savedId === `${situation}-${chosen.id}`);

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-line/50 bg-surface/80 backdrop-blur-md">
        <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-2">
          <div className="w-24">
            {view !== "home" ? (
              <button
                type="button"
                onClick={back}
                aria-label="Volver"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm transition-colors hover:bg-ink/5"
              >
                <ArrowLeft className="size-5" aria-hidden="true" />
                <span>Volver</span>
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => go("home")}
            className="absolute left-1/2 -translate-x-1/2 font-display text-2xl tracking-[0.18em]"
          >
            NEUSTA
          </button>
          <nav className="flex w-24 items-center justify-end" aria-label="Secciones">
            <button
              type="button"
              onClick={() => go("looks")}
              aria-label="Mis looks"
              aria-current={view === "looks" ? "page" : undefined}
              className="icon-button"
            >
              <Bookmark className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go("directory")}
              aria-label="Estilistas"
              aria-current={view === "directory" ? "page" : undefined}
              className="icon-button"
            >
              <Users className="size-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </nav>
        </div>
        {step > 0 ? <FlowProgress step={step} /> : null}
      </header>

      <div key={view} className="view-enter">
        {view === "home" && <HomeScreen onStart={() => go("occasion")} />}
        {view === "occasion" && (
          <OccasionScreen
            selected={situation}
            onPick={(id) => {
              setSituation(id);
              ready.current.situation = id;
              setPlan(null);
              setCards(null);
              setCardsError(null);
              setChosen(null);
              go("kit");
            }}
          />
        )}
        {view === "kit" && (
          <KitScreen
            initial={kitDraft ?? profile ?? remembered}
            remembered={Boolean(remembered) && !profile}
            onDraft={setKitDraft}
            onContinue={(person) => {
              setProfile(person);
              saveProfile(person);
              setCards(null);
              setCardsError(null);
              setChosen(null);
              setPlan(null);
              go("scan");
            }}
          />
        )}
        {view === "scan" && (
          <ScannerScreen
            onCapture={(next) => {
              setCapture(next);
              ready.current.capture = next;
              setPlan(null);
              setCards(null);
              setCardsError(null);
              setChosen(null);
              setLimited(false);
              setSeen({ skin: "", fromPhoto: false });
              setAnalysis(null);
              setShot((v) => v + 1);
              go("options");
            }}
          />
        )}
        {view === "options" && situation && (
          <OptionsScreen
            situation={situation}
            read={capture?.read ?? null}
            analysis={analysis}
            summary={profile ? personLine(profile) : ""}
            skinLine={
              profile?.skin
                ? `Tu piel: ${profile.skin}`
                : seen.skin
                  ? `En la foto: ${seen.skin}`
                  : ""
            }
            readingSkin={!profile?.skin}
            cards={cards}
            loading={cardsLoading}
            error={cardsError}
            limited={limited}
            onRetry={() => {
              setCards(null);
              setCardsError(null);
              setShot((v) => v + 1);
            }}
            onChoose={(card) => {
              setChosen(card);
              ready.current.chosen = card;
              setPlan(null);
              go("steps");
            }}
          />
        )}
        {view === "steps" && situation && chosen && (
          <>
            <StepsScreen
              situation={situation}
              card={chosen}
              plan={plan}
              error={planError}
              onRetry={loadPlan}
              ownedZones={noteZones(profile?.note ?? "")}
              note={profile?.note ?? ""}
              skin={profile?.skin || seen.skin}
              skinFromPhoto={!profile?.skin && seen.fromPhoto}
              kit={profile?.kit ?? null}
              summary={profile ? personLine(profile) : ""}
            />
            <div className="mx-auto max-w-md px-5 pb-12">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={storeLook}
                  disabled={!plan || isSaved}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-medium"
                >
                  {isSaved ? (
                    <Check className="size-4 text-blush" aria-hidden="true" />
                  ) : (
                    <Bookmark className="size-4" aria-hidden="true" />
                  )}
                  {isSaved ? "Guardado" : "Guardar look"}
                </button>
                <button
                  type="button"
                  onClick={() => void shareLook()}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-medium"
                >
                  <Share2 className="size-4" aria-hidden="true" />
                  Compartir
                </button>
              </div>
              <button
                type="button"
                onClick={() => go("feedback")}
                className="mt-3 inline-flex w-full min-h-14 items-center justify-center gap-2 rounded-full bg-ink text-base text-surface"
              >
                <Heart className="size-4" aria-hidden="true" />
                ¿Qué te pareció este look?
              </button>
            </div>
          </>
        )}
        {view === "feedback" && (
          <FeedbackScreen
            situation={situation ?? ""}
            look={chosen?.title ?? ""}
            lookImage={chosen?.imageUrl ?? ""}
            photo={capture?.source === "camera" ? jpegDataUrl(capture.photo) : ""}
            source={capture?.source ?? ""}
            onDone={() => go("home")}
          />
        )}
        {view === "directory" && (
          <DirectoryScreen directory={directory} error={catalogError} onRetry={loadDirectory} />
        )}
        {view === "looks" && <LooksScreen onStart={() => go("occasion")} />}
      </div>

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4"
      >
        {toast ? (
          <p className="toast-enter rounded-full bg-ink px-5 py-3 text-sm text-surface shadow-lg">
            {toast}
          </p>
        ) : null}
      </div>

      {/* Web app: la invitación a instalar aparece nada más entrar. Se oculta solo
          donde hay una barra fija abajo, para no tapar el botón principal. */}
      <InstallBanner ready={view !== "kit"} />
    </div>
  );
}
