/**
 * SECURITY-2525 · WireGuard sanitizers for the portable .sec2525 mission file (SEC-A).
 * ===================================================================================
 * Mirrors lib/architect-guard.ts: an uploaded/stored mission is UNTRUSTED. Every field is coerced/clamped and every
 * object kind is whitelisted before it can seat state. Placed SUPPORT objects must reference a known SUPPORT_CATALOG
 * key (unknown/injection keys are DROPPED, never rendered). Pure, deterministic, never-throw.
 */
import { SUPPORT_CATALOG } from "@/components/security-2525/mission-support";

const SUPPORT_KEYS = new Set(SUPPORT_CATALOG.map((d) => d.key));

/** Finite number clamped to [lo,hi], else `def`. */
export function boundNum(v: unknown, lo: number, hi: number, def: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : def;
}
/** A trimmed string (≤max chars) or "". */
export function boundStr(v: unknown, max = 120): string {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : "";
}
/** Array of trimmed strings; non-strings dropped. */
export function strList(v: unknown, max = 64): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string").map((x) => x.slice(0, max)) : [];
}

export interface SecPlanObject {
  id: string;
  key: string;          // asset/support kind
  lat: number;
  lng: number;
  label?: string;
}
export interface SecPlan {
  placed: SecPlanObject[];        // mission assets
  placedSupport: SecPlanObject[]; // mission-support evidence objects (whitelisted vs SUPPORT_CATALOG)
}

/** Sanitize one plan object — requires a string id + finite lat/lng; label bounded. Returns null when malformed. */
function sanitizePlanObject(raw: unknown, requireCatalogKey: boolean): SecPlanObject | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = boundStr(o.id, 80);
  const key = boundStr(o.key, 80);
  if (!id || !key) return null;                          // no id/kind → drop
  if (requireCatalogKey && !SUPPORT_KEYS.has(key)) return null; // WireGuard: unknown support kind DROPPED
  // Geo coords: DROP out-of-range / non-finite rather than clamp — clamping would silently relocate the object.
  const lat = typeof o.lat === "number" ? o.lat : Number(o.lat);
  const lng = typeof o.lng === "number" ? o.lng : Number(o.lng);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return null;
  const label = boundStr(o.label, 120);
  return label ? { id, key, lat, lng, label } : { id, key, lat, lng };
}

/** Sanitize a whole plan (placed + placedSupport), dropping any malformed/foreign member. Never throws. */
export function sanitizePlan(raw: unknown): SecPlan {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const placed = Array.isArray(o.placed)
    ? o.placed.map((x) => sanitizePlanObject(x, false)).filter((x): x is SecPlanObject => !!x)
    : [];
  const placedSupport = Array.isArray(o.placedSupport)
    ? o.placedSupport.map((x) => sanitizePlanObject(x, true)).filter((x): x is SecPlanObject => !!x)
    : [];
  return { placed, placedSupport };
}
