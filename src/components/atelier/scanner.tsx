import { useEffect, useRef, useState } from "react";
import { canvasFromImage, loadImage, loadLandmarker, readPortrait } from "@/lib/makeup/scan";
import type { Capture } from "@/lib/makeup/types";
import { Camera, Loader2, RefreshCw, ScanFace } from "lucide-react";
import { StepLabel } from "@/components/atelier/ui";

const PORTRAITS = [
  {
    id: "olivo",
    src: "/studio/olivo.jpg",
    label: "Olivo",
    note: "Piel media",
    alt: "Retrato de estudio de piel media",
  },
  {
    id: "ebano",
    src: "/studio/ebano.jpg",
    label: "Ébano",
    note: "Piel profunda",
    alt: "Retrato de estudio de piel profunda",
  },
  {
    id: "lino",
    src: "/studio/lino.jpg",
    label: "Lino",
    note: "Piel clara",
    alt: "Retrato de estudio de piel clara",
  },
];

export function ScannerScreen({ onCapture }: { onCapture: (capture: Capture) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [model, setModel] = useState<"loading" | "ready" | "error">("loading");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [live, setLive] = useState(false);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const facingRef = useRef<"user" | "environment">("user");
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const onCaptureRef = useRef(onCapture);
  onCaptureRef.current = onCapture;
  const taken = useRef(false);
  const streak = useRef(0);

  useEffect(() => {
    let cancel = false;
    loadLandmarker()
      .then(() => {
        if (!cancel) setModel("ready");
      })
      .catch(() => {
        if (!cancel) setModel("error");
      });
    return () => {
      cancel = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!live || model !== "ready") return;
    let stop = false;
    let timer = 0;
    const tick = async () => {
      if (stop) return;
      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        const frame = canvasFromImage(
          video,
          video.videoWidth,
          video.videoHeight,
          facingRef.current === "user",
        );
        const result = await readPortrait(frame);
        if (stop || taken.current) return;
        if (result.landmarks) {
          streak.current += 1;
          setLocked(true);
          if (streak.current >= 2) {
            taken.current = true;
            setBusy("Leyendo el rostro");
            streamRef.current?.getTracks().forEach((track) => track.stop());
            onCaptureRef.current({
              photo: frame,
              landmarks: result.landmarks,
              read: result.read,
              source: "camera",
            });
          }
        } else {
          streak.current = 0;
          setLocked(false);
        }
      }
      if (!stop) timer = window.setTimeout(() => void tick(), 900);
    };
    timer = window.setTimeout(() => void tick(), 400);
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [live, model]);

  async function openCamera(lens: "user" | "environment") {
    setCameraError(null);
    streak.current = 0;
    taken.current = false;
    setLocked(false);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: lens }, width: { ideal: 1280 }, height: { ideal: 1600 } },
      });
      streamRef.current = stream;
      facingRef.current = lens;
      setFacing(lens);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLive(true);
    } catch {
      setLive(false);
      setCameraError(
        lens === "environment"
          ? "No pude abrir la cámara trasera. Prueba la frontal o un retrato de estudio."
          : "No pude abrir la cámara frontal. Prueba la trasera o un retrato de estudio.",
      );
    }
  }

  async function pickPortrait(src: string) {
    setBusy("Aplicando el maquillaje");
    setCameraError(null);
    try {
      const image = await loadImage(src);
      const photo = canvasFromImage(image, image.naturalWidth, image.naturalHeight, false);
      const result = await readPortrait(photo);
      setBusy(null);
      onCapture({ photo, ...result, source: "studio" });
    } catch (error) {
      setBusy(null);
      setCameraError(error instanceof Error ? error.message : "No pude leer el retrato.");
    }
  }

  const status =
    model === "loading"
      ? "Preparando el lector de rostro…"
      : model === "error"
        ? "No pude arrancar el lector en este navegador. Prueba con un retrato de estudio."
        : busy
          ? busy
          : locked
            ? "¡Te veo! Preparando tus referencias…"
            : live
              ? facing === "environment"
                ? "Encuadra la cara dentro del óvalo."
                : "Quédate quieta dentro del óvalo."
              : "";

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-6">
      <StepLabel step={3} />
      <h1 className="mt-3 text-4xl">Deja que te vea</h1>
      <p className="mt-3 text-muted">
        Mira a la cámara con luz de frente. Analizo tu rostro y tu piel como lo haría una
        maquilladora y te propongo tres looks.
      </p>

      <div className="relative mt-6 overflow-hidden rounded-[1.5rem] border border-line">
        <div className={`relative frame-portrait ${live ? "bg-ink" : "camera-idle"}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={live ? "h-full w-full object-cover" : "hidden"}
            style={facing === "user" ? { transform: "scaleX(-1)" } : undefined}
          />
          {live ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className={locked ? "face-guide face-guide-lock" : "face-guide"}>
                <span className="sweep" />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
              <div className="face-outline grid place-items-center">
                <ScanFace className="size-12 text-blush/70" strokeWidth={1.25} aria-hidden="true" />
              </div>
              <div>
                <p className="font-display text-2xl text-ink">Lista cuando tú lo estés</p>
                <p className="mt-1 text-sm text-muted">Te pediré permiso para usar la cámara.</p>
              </div>
            </div>
          )}
          {live && status ? (
            <p
              className="absolute inset-x-4 bottom-4 rounded-full bg-ink/70 px-4 py-2 text-center text-sm text-surface backdrop-blur-sm"
              aria-live="polite"
            >
              {status}
            </p>
          ) : null}
        </div>
      </div>

      {!live && status ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-muted" aria-live="polite">
          {model === "loading" || busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {status}
        </p>
      ) : null}
      {cameraError ? (
        <p className="mt-3 rounded-2xl bg-blush/10 px-4 py-3 text-sm text-blush" role="alert">
          {cameraError}
        </p>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        {live ? (
          <button
            type="button"
            data-testid="switch-camera"
            onClick={() => void openCamera(facing === "environment" ? "user" : "environment")}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-line bg-surface px-6"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            {facing === "environment" ? "Usar cámara frontal" : "Usar cámara trasera"}
          </button>
        ) : (
          <>
            <button
              type="button"
              data-testid="open-camera"
              onClick={() => void openCamera("user")}
              disabled={Boolean(busy)}
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base text-surface"
            >
              <Camera className="size-5" aria-hidden="true" />
              Abrir cámara
            </button>
            <button
              type="button"
              data-testid="open-rear-camera"
              onClick={() => void openCamera("environment")}
              disabled={Boolean(busy)}
              className="min-h-11 text-sm text-muted underline-offset-4 hover:underline"
            >
              Prefiero que me haga la foto otra persona
            </button>
          </>
        )}
      </div>

      <div className="mt-10 flex items-center gap-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs tracking-widest text-muted uppercase">o prueba sin cámara</span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <h2 className="mt-5 font-display text-2xl">Retratos de estudio</h2>
      <p className="mt-1 text-sm text-muted">Elige uno y lo maquillo igual que a ti.</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {PORTRAITS.map((portrait) => (
          <button
            key={portrait.id}
            type="button"
            data-testid={`studio-${portrait.id}`}
            disabled={Boolean(busy)}
            onClick={() => void pickPortrait(portrait.src)}
            className="soft-card tap-card overflow-hidden text-left"
          >
            <img
              src={portrait.src}
              alt={portrait.alt}
              loading="lazy"
              className="frame-portrait w-full object-cover"
            />
            <span className="block px-3 py-2.5 text-sm">
              <span className="block font-medium">{portrait.label}</span>
              <span className="text-xs text-muted">{portrait.note}</span>
            </span>
          </button>
        ))}
      </div>
    </main>
  );
}
