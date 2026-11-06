import { useCallback, useEffect, useState } from "react";
import { KitScreen } from "@/components/atelier/kit";
import { DirectoryScreen, HomeScreen, OccasionScreen } from "@/components/atelier/screens";
import { OptionsScreen } from "@/components/atelier/options";
import { ScannerScreen } from "@/components/atelier/scanner";
import { StepsScreen } from "@/components/atelier/steps";
import { FeedbackScreen } from "@/components/atelier/feedback";
import { InstallBanner } from "@/components/install-banner";
import { referenceLooks, type ReferenceCard, type ReferenceResult } from "@/lib/makeup/imagine";
import { jpegDataUrl } from "@/lib/makeup/photo";
import { noteZones, personLine, type PersonBrief } from "@/lib/makeup/profile";
import { getDirectory, recommendLook } from "@/lib/makeup/server";
import type { Capture, Directory, LookPlan, SituationId } from "@/lib/makeup/types";
import { ArrowLeft } from "lucide-react";

const referenceJobs = new Map<string, Promise<ReferenceResult>>();

type View = "home" | "occasion" | "kit" | "scan" | "options" | "steps" | "feedback" | "directory";

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
        setSeen({ skin: data.skinSeen, fromPhoto: data.skinFromPhoto });
        setCardsError(null);
      })
      .catch((error: unknown) => {
        referenceJobs.delete(jobKey);
        if (!alive) return;
        setCardsError(error instanceof Error ? error.message : "No pude crear las referencias.");
        setCards([
          { id: "piel", title: "Mínimo", line: "Casi sin maquillaje", imageUrl: "" },
          { id: "natural", title: "Natural", line: "Piel luminosa y ligera", imageUrl: "" },
          { id: "definido", title: "Definido", line: "Más presencia sin cargar", imageUrl: "" },
        ]);
      })
      .finally(() => {
        if (alive) setCardsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [view, shot, cards, cardsError, capture, situation, profile]);

  function openDirectory() {
    setBackTo(view === "directory" ? backTo : view);
    setView("directory");
  }

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-20 border-b border-line/50 bg-surface/70 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button type="button" onClick={() => setView("home")} className="font-display text-xl tracking-wide">
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
                      : view === "feedback"
                        ? "steps"
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

      {view === "home" && (
        <HomeScreen
          counts={directory?.counts ?? null}
          catalogError={catalogError}
          onStart={() => setView("occasion")}
          onDirectory={openDirectory}
        />
      )}
      {view === "occasion" && (
        <OccasionScreen
          onPick={(id) => {
            setSituation(id);
            setPlan(null);
            setView("kit");
          }}
        />
      )}
      {view === "kit" && (
        <KitScreen
          onContinue={(person) => {
            setProfile(person);
            setCards(null);
            setCardsError(null);
            setChosen(null);
            setView("scan");
          }}
        />
      )}
      {view === "scan" && (
        <ScannerScreen
          onCapture={(next) => {
            setCapture(next);
            setPlan(null);
            setCards(null);
            setCardsError(null);
            setChosen(null);
            setSeen({ skin: "", fromPhoto: false });
            setShot((v) => v + 1);
            setView("options");
          }}
        />
      )}
      {view === "options" && situation && (
        <OptionsScreen
          situation={situation}
          read={capture?.read ?? null}
          summary={profile ? personLine(profile) : ""}
          skinLine={profile?.skin ? `Tu piel: ${profile.skin}` : seen.skin ? `En la foto: ${seen.skin}` : ""}
          readingSkin={!profile?.skin}
          cards={cards}
          loading={cardsLoading}
          error={cardsError}
          onRetry={() => {
            setCards(null);
            setCardsError(null);
            setShot((v) => v + 1);
          }}
          onChoose={(card) => {
            setChosen(card);
            setView("steps");
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
          <div className="mx-auto max-w-md px-5 pb-10">
            <button
              type="button"
              onClick={() => setView("feedback")}
              className="w-full min-h-12 rounded-full border border-blush/40 bg-blush/10 text-blush"
            >
              ¿Qué te pareció este look?
            </button>
          </div>
        </>
      )}
      {view === "feedback" && <FeedbackScreen onDone={() => setView("home")} />}
      {view === "directory" && (
        <DirectoryScreen directory={directory} error={catalogError} onRetry={loadDirectory} />
      )}

      <InstallBanner />
    </div>
  );
}
