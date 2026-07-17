/**
 * ARCHITECT-2525 · Saved-files cloud backup (Vision 2525)
 * =======================================================
 * Mirrors the Design workspace snapshot (house build spec · BIM imports · per-asset overrides · stage gate ·
 * replay log) to Supabase so it survives a cache-clear and reloads on the same owner elsewhere. localStorage
 * stays the fast local rung; Supabase is the durable / cross-device rung — the same ladder philosophy as
 * `tile-cache.ts`. Every call is best-effort and NEVER throws: no Supabase env → the client is `null` → no-op;
 * a missing table or offline → graceful degrade to local-only (nothing breaks before migration 022 is applied).
 *
 * Ownership: scoped by `ownerKey()` — a persisted per-browser UUID today (`arch2525.ownerId`). The 2525 apps sit
 * behind the eXeL login while MVP, so this swaps to the authenticated user id in ONE place when accounts land.
 *
 * Supabase table (optional — see supabase/migrations/022_architect_saved_files.sql):
 *   architect_saved_files(id uuid pk, owner_key text, name text, payload jsonb, source_hash text, updated_at)
 */
import { supabase } from "./supabase";

export interface ArchitectSnapshot {
  houseSpec: string[];
  layerHidden: string[];
  layerLocked: string[];
  unclassified: unknown[];
  bimManifest: unknown;
  assetOverrides: Record<string, unknown>;
  gate: number;
  globalParams?: unknown; // S5 — whole-project inputs (area · stories · finish); optional for back-compat
  replay: unknown[];
  savedAt: number; // ms epoch of the snapshot (last-write-wins across devices)
}

export type CloudStatus = "idle" | "saving" | "saved" | "offline" | "error";

const TABLE = "architect_saved_files";
const NAME = "workspace";

/** Per-browser owner id (persisted). Swap to the logged-in user id HERE when accounts land. */
export function ownerKey(): string {
  try {
    let id = localStorage.getItem("arch2525.ownerId");
    if (!id) {
      id = randomId();
      localStorage.setItem("arch2525.ownerId", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

function randomId(): string {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const a = new Uint8Array(16);
      c.getRandomValues(a);
      return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* fall through to the time-based id */
  }
  return "own-" + Date.now().toString(36);
}

/** True when a Supabase client is configured (env present). Callers no-op when false. */
export function cloudEnabled(): boolean {
  return !!supabase;
}

/** Best-effort push of the snapshot to Supabase. Never throws. Returns the resulting CloudStatus. */
export async function saveSnapshot(snap: ArchitectSnapshot, sourceHash?: string): Promise<CloudStatus> {
  if (!supabase) return "offline";
  try {
    const { error } = await supabase.from(TABLE).upsert(
      {
        owner_key: ownerKey(),
        name: NAME,
        payload: snap,
        source_hash: sourceHash ?? null,
        updated_at: new Date(snap.savedAt || Date.now()).toISOString(),
      },
      { onConflict: "owner_key,name" },
    );
    return error ? "error" : "saved";
  } catch {
    return "error";
  }
}

/** Best-effort load of this owner's latest snapshot. Returns null on any failure / no row / no client. */
export async function loadSnapshot(): Promise<ArchitectSnapshot | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from(TABLE)
      .select("payload")
      .eq("owner_key", ownerKey())
      .eq("name", NAME)
      .maybeSingle();
    return (data as { payload?: ArchitectSnapshot } | null)?.payload ?? null;
  } catch {
    return null;
  }
}
