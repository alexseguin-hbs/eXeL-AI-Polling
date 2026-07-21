/**
 * SECURITY-2525 · MISSION FILE (.sec2525) — the portable, self-contained mission file that mirrors Architect's
 * .arch2525 (SEC-A). One mission = an area-of-operations key/name + its plan (placed assets + placed mission-support
 * evidence objects), bundled as one JSON file the operator can download, re-upload, and store in a "saved missions"
 * library. Pure + deterministic (the caller supplies savedAt — no Date.now here).
 *
 * WireGuard: an uploaded file is UNTRUSTED — parseMission validates the format tag and runs the plan through
 * sanitizePlan (drops malformed/foreign objects, whitelists support kinds vs SUPPORT_CATALOG), so a hostile file can
 * never seat bad state. A sealed envelope encrypts the mission so only the SYSTEM can unlock it (alg tag left modular
 * for a future server-side AES/KMS swap — no format change).
 */
import { sanitizePlan, boundStr, boundNum, type SecPlan } from "./security-guard";

export const SEC_FILE_FORMAT = "security-2525" as const;
export const SEC_SEALED_FORMAT = "security-2525-sealed" as const;
export const SEC_FILE_VERSION = 1;
export const SEC_FILE_EXT = "sec2525";
export const SEC_SEAL_ALG = "xor-seal-v1"; // MODULAR — swap to server-side AES/KMS with no format change

export interface SecMissionFile {
  format: typeof SEC_FILE_FORMAT;
  version: number;
  savedAt: number;   // ms epoch (stamped by caller)
  name: string;      // human mission title
  aoKey: string;     // area-of-operations key this plan belongs to
  plan: SecPlan;     // placed assets + placed mission-support objects
  ext?: Record<string, unknown>; // forward-compat bag — round-trips losslessly through older parsers
}

export interface SealedMissionFile {
  format: typeof SEC_SEALED_FORMAT;
  version: number;
  sealed: true;
  alg: string;
  name: string;   // clear-text title so the library can list a sealed mission without unlocking
  savedAt: number;
  blob: string;   // encrypted mission (base64)
}

/** Build a portable mission file from live state. Pure — caller supplies savedAt. */
export function serializeMission(name: string, aoKey: string, plan: SecPlan, savedAt: number, ext?: Record<string, unknown>): SecMissionFile {
  return {
    format: SEC_FILE_FORMAT,
    version: SEC_FILE_VERSION,
    savedAt: Number.isFinite(savedAt) ? savedAt : 0,
    name: boundStr(name, 120) || "Untitled Mission",
    aoKey: boundStr(aoKey, 80) || "AO",
    plan: sanitizePlan(plan),
    ...(ext && typeof ext === "object" ? { ext } : {}),
  };
}

/** Serialize to the on-disk JSON string (pretty). */
export function toFileText(m: SecMissionFile): string {
  return JSON.stringify(m, null, 2);
}

/** Parse + sanitize an uploaded .sec2525 file (string or object). Null when it isn't a valid Security-2525 mission. */
export function parseMission(raw: unknown): SecMissionFile | null {
  let obj: unknown = raw;
  if (typeof raw === "string") { try { obj = JSON.parse(raw); } catch { return null; } }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (o.format !== SEC_FILE_FORMAT) return null; // foreign upload → reject
  return {
    format: SEC_FILE_FORMAT,
    version: typeof o.version === "number" ? o.version : SEC_FILE_VERSION,
    savedAt: boundNum(o.savedAt, 0, Number.MAX_SAFE_INTEGER, 0),
    name: boundStr(o.name, 120) || "Untitled Mission",
    aoKey: boundStr(o.aoKey, 80) || "AO",
    plan: sanitizePlan(o.plan),
    ...(o.ext && typeof o.ext === "object" ? { ext: o.ext as Record<string, unknown> } : {}),
  };
}

// ─── SYSTEM SEAL — deterministic system-keyed cipher (obfuscation-grade MVP); the alg tag + sealed envelope are
//     MODULAR so production swaps to a server-held AES/KMS key with no format change. Key lives in system code. ───
const SYSTEM_SEAL_KEY = "eXeL-AI·Security-2525·SoI-Trinity·▬♡웃·system-seal·v1";
const enc = () => new TextEncoder();
function b64(bytes: Uint8Array): string { let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }
function unb64(s: string): Uint8Array { const bin = atob(s); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
function xorBytes(data: Uint8Array): Uint8Array { const key = enc().encode(SYSTEM_SEAL_KEY); const out = new Uint8Array(data.length); for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length]; return out; }

/** Seal a mission into an encrypted envelope only the system can unlock. Deterministic. */
export function sealMission(m: SecMissionFile): SealedMissionFile {
  const blob = b64(xorBytes(enc().encode(JSON.stringify(m))));
  return { format: SEC_SEALED_FORMAT, version: SEC_FILE_VERSION, sealed: true, alg: SEC_SEAL_ALG, name: m.name, savedAt: m.savedAt, blob };
}

/** True when a parsed object / JSON string is a sealed envelope. */
export function isSealed(raw: unknown): raw is SealedMissionFile {
  let o: unknown = raw; if (typeof raw === "string") { try { o = JSON.parse(raw); } catch { return false; } }
  return !!o && typeof o === "object" && (o as Record<string, unknown>).format === SEC_SEALED_FORMAT;
}

/** Unlock a sealed envelope back into a sanitized mission — SYSTEM ONLY. Null on any failure. */
export function unsealMission(raw: unknown): SecMissionFile | null {
  let o: unknown = raw; if (typeof raw === "string") { try { o = JSON.parse(raw); } catch { return null; } }
  if (!o || typeof o !== "object") return null;
  const env = o as Record<string, unknown>;
  if (env.format !== SEC_SEALED_FORMAT || env.alg !== SEC_SEAL_ALG || typeof env.blob !== "string") return null;
  try { return parseMission(new TextDecoder().decode(xorBytes(unb64(env.blob)))); } catch { return null; }
}

/** Safe download filename → "ao-alpha-recon.sec2525". */
export function missionFilename(name: string): string {
  const slug = (name || "mission").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "mission";
  return `${slug}.${SEC_FILE_EXT}`;
}
