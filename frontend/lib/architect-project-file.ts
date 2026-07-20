/**
 * ARCHITECT-2525 · PROJECT FILE (.arch2525) — the custom, self-contained design file the operator can download and
 * re-upload (all elements: market, layers/systems, global params, room program, codes, the full per-room furniture
 * layout, BIM imports, overrides, stage gate). One portable JSON bundle → the whole home design travels as a file, and
 * the same shape backs the named "saved designs" library (like a Mission-Planning mission). Pure + deterministic.
 *
 * WireGuard: an uploaded file is UNTRUSTED — parseProject validates the format tag and runs every field through the
 * existing sanitizers (sanitizeSnapshot / sanitizeRoomLayout), so a malformed or hostile file can never seat bad state.
 */
import { sanitizeSnapshot, sanitizeRoomLayout } from "./architect-guard";
import { type ArchitectSnapshot } from "./architect-saved-files";
import { type RoomCell } from "./room-layout";

export const ARCH_FILE_FORMAT = "architect-2525" as const;
export const ARCH_SEALED_FORMAT = "architect-2525-sealed" as const;
export const ARCH_FILE_VERSION = 1;
export const ARCH_FILE_EXT = "arch2525";
export const SEAL_ALG = "xor-seal-v1"; // MODULAR: the alg tag lets production swap to server-side AES/KMS with no format change
const HOME_TYPES = ["tiny", "full"] as const;

export interface ArchitectProjectFile {
  format: typeof ARCH_FILE_FORMAT;
  version: number;
  savedAt: number;          // ms epoch (stamped by the caller — pure fn takes it in)
  name: string;             // human name (the saved-design title)
  homeType: string;         // "tiny" | "full"
  snapshot: ArchitectSnapshot; // layers · params · program · codes · BIM · overrides · gate · replay
  roomLayout: RoomCell[];   // the interior designs — furniture/openings per room
  // MAX MODULARITY / future expansion — new element kinds (Level-3 cubes, fab specs, HAL profiles, …) land here and
  // round-trip losslessly through OLDER parsers, so a future addition never breaks an existing file. Never dropped.
  ext?: Record<string, unknown>;
}

/** A sealed .arch2525 envelope — the design is encrypted and only the SYSTEM can unlock it (operator). */
export interface SealedProjectFile {
  format: typeof ARCH_SEALED_FORMAT;
  version: number;
  sealed: true;
  alg: string;      // seal algorithm tag (modular — future-proof)
  name: string;     // clear-text title so the library can list a sealed design without unlocking
  savedAt: number;
  blob: string;     // the encrypted project (base64)
}

/** Build a portable project file from the current design state. Pure — the caller supplies savedAt (no Date.now here). */
export function serializeProject(
  name: string, homeType: string, snapshot: ArchitectSnapshot, roomLayout: RoomCell[], savedAt: number, ext?: Record<string, unknown>,
): ArchitectProjectFile {
  return {
    format: ARCH_FILE_FORMAT,
    version: ARCH_FILE_VERSION,
    savedAt: Number.isFinite(savedAt) ? savedAt : 0,
    name: typeof name === "string" && name.trim() ? name.trim().slice(0, 120) : "Untitled Design",
    homeType: (HOME_TYPES as readonly string[]).includes(homeType) ? homeType : "full",
    snapshot,
    roomLayout,
    ...(ext && typeof ext === "object" ? { ext } : {}),
  };
}

/** Serialize to the on-disk JSON string (pretty). */
export function toFileText(p: ArchitectProjectFile): string {
  return JSON.stringify(p, null, 2);
}

/**
 * Parse + sanitize an uploaded .arch2525 file. Accepts a JSON string or an already-parsed object. Returns null when it
 * isn't a valid Architect-2525 project (wrong/missing format tag, unparseable) — so the UI can reject foreign files.
 */
export function parseProject(raw: unknown): ArchitectProjectFile | null {
  let obj: unknown = raw;
  if (typeof raw === "string") { try { obj = JSON.parse(raw); } catch { return null; } }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (o.format !== ARCH_FILE_FORMAT) return null; // not our file type → reject (never trust a foreign upload)
  return {
    format: ARCH_FILE_FORMAT,
    version: typeof o.version === "number" ? o.version : ARCH_FILE_VERSION,
    savedAt: typeof o.savedAt === "number" && Number.isFinite(o.savedAt) ? o.savedAt : 0,
    name: typeof o.name === "string" && o.name.trim() ? o.name.trim().slice(0, 120) : "Untitled Design",
    homeType: (HOME_TYPES as readonly string[]).includes(o.homeType as string) ? (o.homeType as string) : "full",
    snapshot: sanitizeSnapshot(o.snapshot),        // WireGuard — untrusted → clamp/whitelist
    roomLayout: sanitizeRoomLayout(o.roomLayout),  // WireGuard — untrusted → drop malformed, clamp footprints
    // preserve the forward-compat ext bag verbatim so future additions round-trip through this (older) parser losslessly
    ...(o.ext && typeof o.ext === "object" ? { ext: o.ext as Record<string, unknown> } : {}),
  };
}

// ─── SYSTEM SEAL — "special encryption only the system can unlock" (operator). MVP = a deterministic system-keyed
//     cipher (obfuscation-grade); the sealed-envelope + alg tag are MODULAR so production hardens this to a server-held
//     AES/KMS key behind an endpoint with NO file-format change. The seal key lives in system code, never handed to the
//     user, so a sealed .arch2525 can't be read or edited outside the system. ───
const SYSTEM_SEAL_KEY = "eXeL-AI·Architect-2525·SoI-Trinity·▬♡웃·system-seal·v1";
const enc = () => new TextEncoder();
function b64(bytes: Uint8Array): string { let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }
function unb64(s: string): Uint8Array { const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function xorBytes(data: Uint8Array): Uint8Array { const key = enc().encode(SYSTEM_SEAL_KEY); const out = new Uint8Array(data.length); for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length]; return out; }

/** Seal a project into an encrypted envelope only the system can unlock. Deterministic (no randomness). */
export function sealProject(p: ArchitectProjectFile): SealedProjectFile {
  const blob = b64(xorBytes(enc().encode(JSON.stringify(p))));
  return { format: ARCH_SEALED_FORMAT, version: ARCH_FILE_VERSION, sealed: true, alg: SEAL_ALG, name: p.name, savedAt: p.savedAt, blob };
}

/** True when a parsed object / JSON string is a sealed envelope (so the UI can show a 🔒 and route to unseal). */
export function isSealed(raw: unknown): raw is SealedProjectFile {
  let o: unknown = raw; if (typeof raw === "string") { try { o = JSON.parse(raw); } catch { return false; } }
  return !!o && typeof o === "object" && (o as Record<string, unknown>).format === ARCH_SEALED_FORMAT;
}

/** Unlock a sealed envelope back into a sanitized project — SYSTEM ONLY (needs the in-system seal key). Null on any failure. */
export function unsealProject(raw: unknown): ArchitectProjectFile | null {
  let o: unknown = raw; if (typeof raw === "string") { try { o = JSON.parse(raw); } catch { return null; } }
  if (!o || typeof o !== "object") return null;
  const env = o as Record<string, unknown>;
  if (env.format !== ARCH_SEALED_FORMAT || env.alg !== SEAL_ALG || typeof env.blob !== "string") return null;
  try { return parseProject(new TextDecoder().decode(xorBytes(unb64(env.blob)))); } catch { return null; }
}

/** Safe download filename for a design name → "master-bedroom-loft.arch2525". */
export function projectFilename(name: string): string {
  const slug = (name || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "design";
  return `${slug}.${ARCH_FILE_EXT}`;
}
