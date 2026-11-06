import { useCallback, useEffect, useRef, useState } from "react";
import { KitScreen } from "@/components/atelier/kit";
import { DirectoryScreen, HomeScreen, OccasionScreen } from "@/components/atelier/screens";
import { OptionsScreen } from "@/components/atelier/options";
import { ScannerScreen } from "@/components/atelier/scanner";
import { StepsScreen } from "@/components/atelier/steps";
import { referenceLooks, type ReferenceCard, type ReferenceResult } from "@/lib/makeup/imagine";
import { aiLook } from "@/lib/makeup/ai-look";
import { jpegDataUrl } from "@/lib/makeup/photo";
import { noteZones, personLine, type PersonBrief } from "@/lib/makeup/profile";
import { getDirectory, recommendLook } from "@/lib/makeup/server";
import type { Capture, Directory, LookPlan, SituationId } from "@/lib/makeup/types";
import { ArrowLeft } from "lucide-react";

type View = "home" | "occasion" | "kit" | "scan" | "options" | "steps" | "directory";

export function AtelierApp() {
  const [view, setView] = useState<View>("home");
  const [backTo, setBackTo] = useState<View>("home");
  const [situation, setSituation] = useState<SituationId | null>(null);
  const [capture, setCapture] = useState<Capture | null>(null);
  const [directory, setDirectory] = useState<Directory | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [plan, setPlan] = useState<LookPlan | null>(null);
  const [planError, setPlanError] = useState<string | null>(null);
  const [cards, setCards] = useState<ReferenceCard[] | null>(null);
  const [cardsError, setCardsError] = useState<string | null>(null);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [shot, setShot] = useState(0);
  const [chosen, setChosen] = useState<ReferenceCard | null>(null);
  const [profile, setProfile] = useState<PersonBrief | null>(null);
  const [seen, setSeen] = useState({ skin: "", fromPhoto: false });
  const upgraded = useRef(new Set<string>());
  const referenceJobs = useRef(new Map<string, Promise<ReferenceResult>>());
  const shotRef = useRef(0);
  shotRef.current = shot;

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
        shape: read?.shape ?? "ovalado",
        owned: [],
        age: profile?.age ?? "joven",
        tastes: profile?.tastes ?? [],
        note: profile?.note ?? "",
        skin: profile?.skin || seen.skin,
      },
    })
      .then((data) => setPlan(data))
      .catch((error: unknown) => {
        setPlanError(error instanceof Error ? error.message : "No pude armar el look.");
      });
  }, [situation, capture, profile, seen.skin]);

  useEffect(() => {
    loadDirectory();
  }, [loadDirectory]);

  useEffect(() => {
    if (view === "steps") loadPlan();
  }, [view, loadPlan]);

  useEffect(() => {
    if (view !== "options" || cards || cardsError || !capture?.read || !situation) return;
    let alive = true;
    const owned = noteZones(profile?.note ?? "");
    const jobKey = `${situation}:${shot}:${owned.join(",")}:${profile?.age ?? ""}:${profile?.tastes.join(",") ?? ""}:${profile?.note ?? ""}:${profile?.skin ?? ""}`;
    let job = referenceJobs.current.get(jobKey);
    if (!job) {
      job = referenceLooks({
        data: { situation, owned, skin: profile?.skin ?? "" },
      });
      referenceJobs.current.set(jobKey, job);
    }
    setCardsLoading(true);
    job
      .then((data) => {
        if (!alive) return;
        setCards(data.cards);
        setSeen({ skin: data.skinSeen, fromPhoto: data.skinFromPhoto });
        setCardsError(null);
      })
      .catch((error: unknown) => {
        referenceJobs.current.delete(jobKey);
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

  // Solo mostrar imágenes de Grok. Cada solicitud tiene su propio estado y error.
  useEffect(() => {
    if (view !== "options" || !cards || !capture?.read || !situation) return;
    const read = capture.read;
    const owned = noteZones(profile?.note ?? "");
    const jpeg = jpegDataUrl(capture.photo);
    for (const card of cards.filter((card) => !card.imageUrl && !card.error)) {
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
        },
      })
        .then((res) => {
          if (shotRef.current !== shot) return;
          setCards(
            (prev) =>
              prev?.map((c) => (c.id === card.id ? { ...c, imageUrl: res.imageUrl } : c)) ?? prev,
          );
        })
        .catch((error: unknown) => {
          if (shotRef.current !== shot) return;
          setCards(
            (prev) =>
              prev?.map((c) =>
                c.id === card.id
                  ? {
                      ...c,
                      error:
                        error instanceof Error
                          ? error.message
                          : "No pude generar este look con Grok.",
                    }
                  : c,
              ) ?? prev,
          );
        });
    }
  }, [view, cards, capture, situation, profile, shot]);

  function openDirectory() {
    setBackTo(view === "directory" ? backTo : view);
    setView("directory");
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-line bg-surface/90 shadow-[0_8px_24px_rgba(131,24,67,0.06)] backdrop-blur-md">
        <div className="h-0.5 bg-blush" />
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() => setView("home")}
            className="font-display text-xl tracking-wide"
          >
            NEUSTA
          </button>
          <nav className="flex items-center gap-1">
            {view !== "home" ? (
              <button
                type="button"
                onClick={() =>
                  setView(
                    view === "directory"
                      ? backTo
                      : view === "steps"
                        ? "options"
                        : view === "options"
                          ? "scan"
                          : view === "scan"
                            ? "kit"
                            : view === "kit"
                              ? "occasion"
                              : "home",
                  )
                }
                className="inline-flex min-h-11 items-center gap-1 px-3 text-sm"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Volver
              </button>
            ) : null}
            <button type="button" onClick={openDirectory} className="min-h-11 px-3 text-sm">
              Directorio
            </button>
          </nav>
        </div>
      </header>
      {view === "home" ? (
        <HomeScreen onStart={() => setView("occasion")} onDirectory={openDirectory} />
      ) : null}
      {view === "occasion" ? (
        <OccasionScreen
          onPick={(id) => {
            setSituation(id);
            setPlan(null);
            setView("kit");
          }}
        />
      ) : null}
      {view === "kit" ? (
        <KitScreen
          onContinue={(person) => {
            setProfile(person);
            setCards(null);
            setCardsError(null);
            setChosen(null);
            setView("scan");
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
            setShot((value) => value + 1);
            setView("options");
          }}
        />
      ) : null}
      {view === "options" && situation ? (
        <OptionsScreen
          situation={situation}
          read={capture?.read ?? null}
          summary={profile ? personLine(profile) : ""}
          skinLine={
            profile?.skin
              ? `Tu piel: ${profile.skin}`
              : seen.fromPhoto && seen.skin
                ? `En la foto: ${seen.skin}. No es un diagnóstico.`
                : ""
          }
          readingSkin={!profile?.skin}
          cards={cards}
          loading={cardsLoading}
          error={cardsError}
          onRetry={() => {
            if (cards?.some((card) => card.error)) {
              for (const card of cards.filter((card) => card.error))
                upgraded.current.delete(`${shot}:${card.id}`);
              setCards(cards.map((card) => ({ ...card, error: undefined })));
              return;
            }
            setCards(null);
            setCardsError(null);
            setShot((value) => value + 1);
          }}
          onChoose={(card) => {
            setChosen(card);
            setView("steps");
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
          summary={profile ? personLine(profile) : ""}
        />
      ) : null}
      {view === "directory" ? (
        <DirectoryScreen directory={directory} error={catalogError} onRetry={loadDirectory} />
      ) : null}
    </div>
  );
}
