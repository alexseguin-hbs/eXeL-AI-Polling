/**
 * Shared image library (SoI-2525) — a small, cross-project pool of uploaded images so the CONOPS visual (and
 * other attach fields) can PICK a previously-uploaded image instead of re-uploading. Populated from two places:
 * the CONOPS uploader and the Light-Codex easter-egg tool ("Add to library"). localStorage-backed (per browser,
 * shared across every project) with a best-effort cloud mirror; never throws.
 */
import { saveState } from "./innovation-store";

export interface LibImage { name: string; src: string } // src = data: URI or http(s) URL
const KEY = "soi-image-library";
const MAX = 24; // keep the pool (and the persisted blob) bounded

/** Stable content id for dedupe (FNV-1a over the src). */
const idOf = (src: string): string => { let h = 2166136261; for (let i = 0; i < src.length; i++) h = Math.imul(h ^ src.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };

export function loadImageLibrary(): LibImage[] {
  try { const s = localStorage.getItem(KEY); const a = s ? JSON.parse(s) : []; return Array.isArray(a) ? a : []; } catch { return []; }
}
function persist(next: LibImage[]) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* quota — keep in-memory only */ }
  void saveState("image-library", next as unknown as Record<string, string>); // best-effort cloud mirror
}
/** Add an image (deduped by content); newest first, capped at MAX. Returns the updated library. */
export function addToImageLibrary(name: string, src: string): LibImage[] {
  if (!src) return loadImageLibrary();
  const lib = loadImageLibrary();
  const key = idOf(src);
  if (lib.some((i) => idOf(i.src) === key)) return lib; // already present
  const next = [{ name: name || "image", src }, ...lib].slice(0, MAX);
  persist(next);
  return next;
}
/** Remove by content src. Returns the updated library. */
export function removeFromImageLibrary(src: string): LibImage[] {
  const key = idOf(src);
  const next = loadImageLibrary().filter((i) => idOf(i.src) !== key);
  persist(next);
  return next;
}
