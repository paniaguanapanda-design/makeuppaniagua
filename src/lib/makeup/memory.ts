import type { PersonBrief } from "@/lib/makeup/profile";
import type { SituationId, ZoneId } from "@/lib/makeup/types";

/** Pequeña memoria del dispositivo. Nada de esto sale del navegador. */

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* modo privado o sin espacio: la app sigue funcionando */
  }
}

const PROFILE_KEY = "neusta:perfil";
const LOOKS_KEY = "neusta:looks";
const INSTALL_KEY = "neusta:instalar-cerrado";

export function loadProfile(): PersonBrief | null {
  return read<PersonBrief | null>(PROFILE_KEY, null);
}

export function saveProfile(person: PersonBrief) {
  write(PROFILE_KEY, person);
}

export type SavedStep = {
  zone: ZoneId;
  title: string;
  instruction: string;
  product: string;
};

export type SavedLook = {
  id: string;
  savedAt: string;
  situation: SituationId;
  title: string;
  line: string;
  imageUrl: string;
  stylist: string;
  steps: SavedStep[];
};

export function loadLooks(): SavedLook[] {
  const looks = read<SavedLook[]>(LOOKS_KEY, []);
  return Array.isArray(looks) ? looks : [];
}

export function saveLook(look: SavedLook) {
  const rest = loadLooks().filter((item) => item.id !== look.id);
  write(LOOKS_KEY, [look, ...rest].slice(0, 20));
}

export function removeLook(id: string) {
  write(
    LOOKS_KEY,
    loadLooks().filter((item) => item.id !== id),
  );
}

export function installDismissedRecently() {
  const at = read<number>(INSTALL_KEY, 0);
  return Date.now() - at < 7 * 24 * 60 * 60 * 1000;
}

export function dismissInstall() {
  write(INSTALL_KEY, Date.now());
}
