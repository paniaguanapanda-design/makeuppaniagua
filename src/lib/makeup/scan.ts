import { readFace } from "@/lib/makeup/paint";
import type { FaceRead, Pt } from "@/lib/makeup/types";

type Landmarker = {
  detect: (image: HTMLCanvasElement) => { faceLandmarks: { x: number; y: number }[][] };
};

let pending: Promise<Landmarker> | null = null;

export function loadLandmarker(): Promise<Landmarker> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("El escaneo solo funciona en el navegador."));
  }
  if (!pending) {
    pending = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks("/vision");
      return vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "/models/face_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
        minFaceDetectionConfidence: 0.4,
        minFacePresenceConfidence: 0.4,
      });
    })().catch((error: unknown) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

export async function detectLandmarks(photo: HTMLCanvasElement): Promise<Pt[] | null> {
  try {
    const landmarker = await loadLandmarker();
    const result = landmarker.detect(photo);
    const face = result.faceLandmarks?.[0];
    if (!face || face.length < 468) return null;
    return face.map((point) => ({ x: point.x, y: point.y }));
  } catch {
    return null;
  }
}

export async function readPortrait(photo: HTMLCanvasElement): Promise<{ landmarks: Pt[] | null; read: FaceRead | null }> {
  const landmarks = await detectLandmarks(photo);
  if (!landmarks) return { landmarks: null, read: null };
  return { landmarks, read: readFace(photo, landmarks) };
}

export function canvasFromImage(image: CanvasImageSource, width: number, height: number, mirror = false) {
  const maxW = 800;
  const scale = Math.min(1, maxW / Math.max(1, width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  if (mirror) {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No pude abrir el retrato."));
    image.src = src;
  });
}
