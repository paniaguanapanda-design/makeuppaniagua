import { useEffect, useRef, useState } from "react";
import { canvasFromImage, loadImage, loadLandmarker, readPortrait } from "@/lib/makeup/scan";
import type { Capture } from "@/lib/makeup/types";

const PORTRAITS = [
  { id: "olivo", src: "/studio/olivo.jpg", label: "Olivo", note: "Piel media" },
  { id: "ebano", src: "/studio/ebano.jpg", label: "Ébano", note: "Piel profunda" },
  { id: "lino", src: "/studio/lino.jpg", label: "Lino", note: "Piel clara" },
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

  async function selectPortrait(src: string) {
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

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 text-center">
      <p className="step-eyebrow">Paso 3 de 4</p>
      <h1 className="mt-3 text-4xl">Deja que te vea</h1>
      <p className="mx-auto mt-4 max-w-xl text-sm text-muted">
        Mira a la lente con luz natural de frente, sin filtros y, si puedes, sin maquillaje previo.
        Grok comprobará si la foto permite asesorarte antes de preparar los looks.
      </p>
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-line bg-ink">
          <div className="relative frame-portrait bg-ink">
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
              <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-surface">
                <p className="font-display text-3xl">Cámara apagada</p>
                <p className="mt-2 max-w-xs text-sm text-clay">El permiso se pide al abrirla.</p>
              </div>
            )}
          </div>
        </div>
        <div>
          <p className="text-sm text-muted">
            {model === "loading"
              ? "Cargando el lector de rostro."
              : model === "error"
                ? "No pude arrancar el lector en este navegador."
                : busy
                  ? busy
                  : locked
                    ? "Te veo. Preparando las referencias."
                    : live
                      ? facing === "environment"
                        ? "Cámara trasera. Encuadra la cara en el óvalo."
                        : "Buscando tu cara. Quédate quieta en el óvalo."
                      : "Elige la cámara frontal o la trasera."}
          </p>
          {cameraError ? <p className="mt-3 text-sm text-blush">{cameraError}</p> : null}
          <div className="mt-6 flex flex-col gap-3">
            {live ? (
              <button
                type="button"
                data-testid="switch-camera"
                onClick={() => void openCamera(facing === "environment" ? "user" : "environment")}
                className="min-h-11 rounded-full border border-line px-6"
              >
                {facing === "environment" ? "Usar cámara frontal" : "Usar cámara trasera"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  data-testid="open-camera"
                  onClick={() => void openCamera("user")}
                  className="min-h-11 rounded-full bg-ink px-6 text-surface"
                >
                  Cámara frontal
                </button>
                <button
                  type="button"
                  data-testid="open-rear-camera"
                  onClick={() => void openCamera("environment")}
                  className="min-h-11 rounded-full border border-line px-6"
                >
                  Cámara trasera
                </button>
              </>
            )}
          </div>
          <h2 className="mt-10 text-2xl">Retratos de estudio</h2>
          <p className="mt-2 text-sm text-muted">
            Si no quieres usar la cámara, elijo un retrato y lo maquillo igual.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {PORTRAITS.map((portrait) => (
              <button
                key={portrait.id}
                type="button"
                data-testid={`studio-${portrait.id}`}
                disabled={Boolean(busy)}
                onClick={() => void selectPortrait(portrait.src)}
                className="overflow-hidden rounded-2xl border border-line bg-surface text-left"
              >
                <img src={portrait.src} alt="" className="frame-portrait w-full object-cover" />
                <span className="block px-2 py-3 text-sm">
                  <span className="block font-medium">{portrait.label}</span>
                  <span className="text-muted">{portrait.note}</span>
                </span>
              </button>
            ))}
          </div>
          {busy ? <p className="mt-4 text-sm text-muted">{busy}</p> : null}
        </div>
      </div>
    </div>
  );
}
