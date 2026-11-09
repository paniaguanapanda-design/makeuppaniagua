import { useCallback, useEffect, useRef, useState } from "react";
import { KitScreen, type KitDraft } from "@/components/atelier/kit";
import { HomeScreen, OccasionScreen } from "@/components/atelier/screens";
import { BottomNav, type NavTab } from "@/components/atelier/bottom-nav";
import { MyLooksScreen } from "@/components/atelier/my-looks";
import { saveLook } from "@/lib/makeup/saved";
import { optionById, visibleZones, type OptionId } from "@/lib/makeup/references";
import { OptionsScreen } from "@/components/atelier/options";
import { ScannerScreen } from "@/components/atelier/scanner";
import { StepsScreen } from "@/components/atelier/steps";
import { referenceLooks, type ReferenceCard, type ReferenceResult } from "@/lib/makeup/imagine";
import { aiLook } from "@/lib/makeup/ai-look";
import { renderCard } from "@/lib/makeup/preview";
import { noteZones, type PersonBrief } from "@/lib/makeup/profile";
import { recommendLook } from "@/lib/makeup/server";
import type { Capture, LookPlan, SituationId } from "@/lib/makeup/types";
import { analysisLine, analyzeFace, type FaceAnalysis } from "@/lib/makeup/analysis";
import { jpegDataUrl } from "@/lib/makeup/photo";
import { useLang } from "@/lib/i18n";
import { signOut } from "@/lib/auth/client";

const referenceJobs = new Map<string, Promise<ReferenceResult>>();

type View = "home" | "occasion" | "kit" | "scan" | "options" | "steps" | "looks";

/** Reduce la foto del look para guardarla en la cuenta sin que pese demasiado. */
async function compactJpeg(src: string): Promise<string> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const scale = Math.min(1, 720 / img.naturalWidth);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  for (const quality of [0.82, 0.7, 0.55]) {
    const out = canvas.toDataURL("image/jpeg", quality);
    if (out.length < 880_000) return out;
  }
  return canvas.toDataURL("image/jpeg", 0.4);
}

export function AtelierApp() {
  const [view, setView] = useState<View>("home");
  const [situation, setSituation] = useState<SituationId | null>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [looksKey, setLooksKey] = useState(0);
  const savedIds = useRef(new Map<string, string>());
  const [savedNote, setSavedNote] = useState(false);
  const [plan, setPlan] = useState<LookPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [cards, setCards] = useState<ReferenceCard[] | null>(null);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [shot, setShot] = useState(0);
  const [chosen, setChosen] = useState<ReferenceCard | null>(null);
  const [profile, setProfile] = useState<PersonBrief | null>(null);
  const [kitDraft, setKitDraft] = useState<KitDraft | null>(null);
  const [seen, setSeen] = useState({ skin: "", fromPhoto: false });
  const upgraded = useRef(new Set<string>());
  // Estado de la imagen con IA de cada tarjeta (clave: foto:look). Sin entrada = aún pendiente.
  const [aiState, setAiState] = useState<Record<string, "done" | "failed">>({});
  const [aiNote, setAiNote] = useState("");
  const [signOutError, setSignOutError] = useState("");
  const { t, lang } = useLang();
  const [analysis, setAnalysis] = useState<FaceAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const analyzedShot = useRef(-1);
  const analysisSkin = analysis ? analysisLine(analysis) : "";
  const shotRef = useRef(0);
  shotRef.current = shot;

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
        skin: [profile?.skin || seen.skin, analysisSkin]
          .filter(Boolean)
          .join(". En la foto: ")
          .slice(0, 300),
        lang,
      },
    })
      .then((data) => setPlan(data))
      .catch((error: unknown) => {
        setPlanError(error instanceof Error ? error.message : "No pude armar el look.");
      });
  }, [situation, capture, profile, seen.skin, analysis, analysisSkin, lang]);

  // El look elegido se guarda en su cuenta (y se actualiza al llegar la IA o el tutorial).
  useEffect(() => {
    if (!chosen || !situation) return;
    const id = savedIds.current.get(`${shot}:${chosen.id}`);
    if (!id) return;
    const option = optionById(situation, chosen.id as OptionId);
    const zones = visibleZones(option, noteZones(profile?.note ?? ""));
    const steps = (plan?.steps ?? [])
      .filter((step) => zones.includes(step.zone))
      .map((step) => ({
        zone: step.zone,
        title: step.title.slice(0, 120),
        instruction: step.instruction.slice(0, 900),
      }));
    let alive = true;
    compactJpeg(chosen.imageUrl)
      .then((image) =>
        saveLook({
          data: { id, situation, look: chosen.id as OptionId, image, steps: steps.slice(0, 12) },
        }),
      )
      .then(() => alive && setSavedNote(true))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [chosen, plan, situation, shot, profile]);

  useEffect(() => {
    if (view === "steps") loadPlan();
  }, [view, loadPlan]);

  useEffect(() => {
    if (view !== "options" || cards || cardsError || !capture?.read || !situation) return;
    let alive = true;
    const owned = noteZones(profile?.note ?? "");
    const jobKey = `${shot}:${owned.join(",")}:${profile?.age ?? ""}:${profile?.tastes.join(",") ?? ""}:${profile?.note ?? ""}:${profile?.skin ?? ""}`;
    let job = referenceJobs.get(jobKey);
    if (!job) {
      job = referenceLooks({
        data: { situation, owned, skin: profile?.skin ?? "" },
      });
      referenceJobs.set(jobKey, job);
    }
    setCardsLoading(true);
    job
      .then((data) => {
        if (!alive) return;
        setCards(
          data.cards.map((card) => ({
            ...card,
            imageUrl: renderCard(card, capture, situation, owned),
          })),
        );
        setSeen({ skin: data.skinSeen, fromPhoto: data.skinFromPhoto });
        setCardsError(null);
      })
      .catch((error: unknown) => {
        referenceJobs.delete(jobKey);
        if (!alive) return;
        setCardsError(error instanceof Error ? error.message : "No pude crear las referencias.");
      })
      .finally(() => {
        if (alive) setCardsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [view, shot, cards, cardsError, capture, situation, profile]);

  // Con clave de Gemini, cada tarjeta se mejora con una foto editada por IA. Si falla, queda el pintado local.
  useEffect(() => {
    if (view !== "options" || !cards || !capture?.read || !situation || analyzing) return;
    const read = capture.read;
    const skin = [profile?.skin, analysisSkin].filter(Boolean).join(". ").slice(0, 400);
    const owned = noteZones(profile?.note ?? "");
    const jpeg = capture.photo.toDataURL("image/jpeg", 0.85);
    for (const card of cards) {
      const id = `${shot}:${card.id}`;
      if (upgraded.current.has(id)) continue;
      upgraded.current.add(id);
      aiLook({
        data: {
          situation,
          optionId: card.id,
          undertone: read.undertone,
          depth: read.depth,
          shape: read.shape,
          owned,
          photo: jpeg,
          skin: skin || undefined,
        },
      })
        .then((res) => {
          if (shotRef.current !== shot) return;
          setAiNote("ok");
          setAiState((prev) => ({ ...prev, [id]: "done" }));
          setCards(
            (prev) =>
              prev?.map((c) => (c.id === card.id ? { ...c, imageUrl: res.imageUrl } : c)) ?? prev,
          );
          setChosen((prev) => (prev?.id === card.id ? { ...prev, imageUrl: res.imageUrl } : prev));
        })
        .catch((error: unknown) => {
          setAiState((prev) => ({ ...prev, [id]: "failed" }));
          if (shotRef.current === shot)
            setAiNote(error instanceof Error ? error.message.slice(0, 160) : "error");
        });
    }
  }, [view, cards, capture, situation, profile, shot, analyzing, analysisSkin]);

  // La maquilladora mira el rostro y la piel una vez por foto.
  useEffect(() => {
    if (view !== "options" || !capture || analyzedShot.current === shot) return;
    analyzedShot.current = shot;
    setAnalysis(null);
    setAnalyzing(true);
    analyzeFace({ data: { photo: jpegDataUrl(capture.photo), lang } })
      .then((result) => {
        if (shotRef.current === shot) setAnalysis(result);
      })
      .catch(() => undefined)
      .finally(() => {
        if (shotRef.current === shot) setAnalyzing(false);
      });
  }, [view, capture, shot, lang]);

  // --- Navegación con el historial: el gesto "atrás" del móvil vuelve a la pantalla anterior.
  const viewRef = useRef<View>("home");
  viewRef.current = view;
  const ready = useRef({ situation, capture, chosen });
  ready.current = { situation, capture, chosen };

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
      const wanted = (event.state as { neusta?: View } | null)?.neusta ?? "home";
      const { situation: s, capture: c, chosen: ch } = ready.current;
      const ok =
        wanted === "home" ||
        wanted === "looks" ||
        wanted === "occasion" ||
        ((wanted === "kit" || wanted === "scan") && Boolean(s)) ||
        (wanted === "options" && Boolean(s && c)) ||
        (wanted === "steps" && Boolean(s && ch));
      setView(ok ? wanted : "home");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const activeTab: NavTab = view === "home" ? "home" : view === "looks" ? "looks" : "create";

  function navigate(tab: NavTab) {
    if (tab === "home") go("home");
    else if (tab === "create") go("occasion");
    else {
      setLooksKey((value) => value + 1);
      go("looks");
    }
  }

  return (
    <div className="app-shell">
      <header className="app-title-bar sticky top-0 z-20">
        <button type="button" onClick={() => go("home")} className="app-title">
          NEUSTA
        </button>
      </header>
      {signOutError && (
        <p role="alert" className="px-4 py-2 text-sm">
          {signOutError}
        </p>
      )}
      {view === "home" ? <HomeScreen onStart={() => go("occasion")} /> : null}
      {view === "occasion" ? (
        <OccasionScreen
          onPick={(id) => {
            setSituation(id);
            ready.current.situation = id;
            setPlan(null);
            go("kit");
          }}
        />
      ) : null}
      {view === "kit" ? (
        <KitScreen
          initial={kitDraft}
          onDraft={setKitDraft}
          onContinue={(person) => {
            setProfile(person);
            setCards(null);
            setCardsError(null);
            setChosen(null);
            go("scan");
          }}
        />
      ) : null}
      {view === "scan" ? (
        <ScannerScreen
          onCapture={(next) => {
            setCapture(next);
            setPlan(null);
            setCards(null);
            setCardsError(null);
            setChosen(null);
            setSeen({ skin: "", fromPhoto: false });
            ready.current.capture = next;
            setShot((value) => value + 1);
            go("options");
          }}
        />
      ) : null}
      {view === "options" && aiNote.includes("limite-diario") ? (
        <p className="mx-auto mt-3 max-w-md rounded-2xl bg-white/70 px-4 py-3 text-center text-sm text-ink">
          {t("opt.limit")}
        </p>
      ) : null}
      {view === "options" &&
      aiNote &&
      aiNote !== "ok" &&
      !aiNote.includes("limite-diario") &&
      import.meta.env.DEV ? (
        <p className="mx-auto max-w-6xl px-4 pt-2 text-center text-xs text-muted">
          IA no disponible: {aiNote}
        </p>
      ) : null}
      {view === "options" && situation ? (
        <OptionsScreen
          situation={situation}
          read={capture?.read ?? null}
          analysis={analysis}
          analyzing={analyzing}
          aiPending={(cardId) => !aiState[`${shot}:${cardId}`]}
          summary={profile ? profile.tastes.map((id) => t(`taste.${id}`)).join(", ") : ""}
          skinLine={
            profile?.skin
              ? t("opt.skinLine", { skin: profile.skin })
              : seen.fromPhoto && seen.skin
                ? t("opt.skinPhoto", { skin: seen.skin })
                : ""
          }
          readingSkin={!profile?.skin}
          cards={cards}
          loading={cardsLoading}
          error={cardsError}
          onRetry={() => {
            setCards(null);
            setCardsError(null);
            setShot((value) => value + 1);
          }}
          onChoose={(card) => {
            const key = `${shot}:${card.id}`;
            if (!savedIds.current.has(key)) savedIds.current.set(key, crypto.randomUUID());
            setSavedNote(false);
            setChosen(card);
            ready.current.chosen = card;
            go("steps");
          }}
        />
      ) : null}
      {view === "steps" && situation && chosen ? (
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
          summary={profile ? profile.tastes.map((id) => t(`taste.${id}`)).join(", ") : ""}
          photo={capture?.source === "camera" ? jpegDataUrl(capture.photo) : undefined}
          saved={savedNote}
        />
      ) : null}
      {view === "looks" ? <MyLooksScreen key={looksKey} onCreate={() => go("occasion")} /> : null}
      <BottomNav
        active={activeTab}
        onNavigate={navigate}
        onSignOut={() => {
          setSignOutError("");
          void signOut().catch(() => setSignOutError(t("common.signOutError")));
        }}
      />
    </div>
  );
}
