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
export const ARCH_FILE_VERSION = 1;
export const ARCH_FILE_EXT = "arch2525";
const HOME_TYPES = ["tiny", "full"] as const;

export interface ArchitectProjectFile {
  format: typeof ARCH_FILE_FORMAT;
  version: number;
  savedAt: number;          // ms epoch (stamped by the caller — pure fn takes it in)
  name: string;             // human name (the saved-design title)
  homeType: string;         // "tiny" | "full"
  snapshot: ArchitectSnapshot; // layers · params · program · codes · BIM · overrides · gate · replay
  roomLayout: RoomCell[];   // the interior designs — furniture/openings per room
}

/** Build a portable project file from the current design state. Pure — the caller supplies savedAt (no Date.now here). */
export function serializeProject(
  name: string, homeType: string, snapshot: ArchitectSnapshot, roomLayout: RoomCell[], savedAt: number,
): ArchitectProjectFile {
  return {
    format: ARCH_FILE_FORMAT,
    version: ARCH_FILE_VERSION,
    savedAt: Number.isFinite(savedAt) ? savedAt : 0,
    name: typeof name === "string" && name.trim() ? name.trim().slice(0, 120) : "Untitled Design",
    homeType: (HOME_TYPES as readonly string[]).includes(homeType) ? homeType : "full",
    snapshot,
    roomLayout,
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
  };
}

/** Safe download filename for a design name → "master-bedroom-loft.arch2525". */
export function projectFilename(name: string): string {
  const slug = (name || "design").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "design";
  return `${slug}.${ARCH_FILE_EXT}`;
}
