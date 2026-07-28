/**
 * SoI-2525 (System of Innovation) · Supabase persistence
 * =====================================================
 * The section of the site formerly labelled "Innovation / Portfolio Prioritization" is referenced as
 * **SoI-2525** going forward.
 * Promotes the SoI-2525 tool's config + per-project edits from device-local (localStorage) to durable /
 * cross-device (Supabase). localStorage stays the fast local rung; Supabase is the durable rung — the same
 * ladder as `architect-saved-files.ts`. Every call is best-effort and NEVER throws: no Supabase env → client
 * `null` → no-op; a missing table or offline → graceful degrade to local-only (nothing breaks before the
 * migration is applied). The UI is never blocked by the network.
 *
 * Storage model: one row per (owner_key, name). `name` is a namespace the caller chooses — e.g. "config"
 * (the admin bundle: pillars · board · stack name · dog-tag highlights · biz-setup · glossary · segment
 * library), or a per-project namespace ("signoff" · "ledger" · "drivers" · "edits"). Each payload is a JSON
 * blob, so new slices add a namespace or a key WITHOUT a schema change.
 *
 * Ownership: `ownerKey()` — a persisted per-browser UUID today (`innovation.ownerId`); swaps to the
 * authenticated user id in ONE place when accounts land (mirrors architect `ownerKey`).
 *
 * Supabase table (optional — supabase/migrations/028_innovation_state.sql):
 *   innovation_state(id uuid pk, owner_key text, name text, payload jsonb, updated_at, UNIQUE(owner_key,name))
 */
import { supabase } from "./supabase";
import { scrubDeep } from "./innovation-data";

const TABLE = "innovation_state";

export type CloudStatus = "idle" | "saving" | "saved" | "offline" | "error";

/** Per-browser owner id (persisted). Swap to the logged-in user id HERE when accounts land. */
export function ownerKey(): string {
  try {
    let id = localStorage.getItem("innovation.ownerId");
    if (!id) { id = randomId(); localStorage.setItem("innovation.ownerId", id); }
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
  } catch { /* fall through */ }
  return "own-" + Date.now().toString(36);
}

/** True when a Supabase client is configured (env present). Callers no-op when false. */
export function cloudEnabled(): boolean {
  return !!supabase;
}

// PERF — skip a cloud write whose CONTENT is byte-identical to the last one saved for that name, so idle
// re-renders don't re-upload. Mirrors the architect hash guard.
const lastHash: Record<string, string> = {};
function contentHash(v: unknown): string {
  const s = JSON.stringify(v);
  let h = 5381; for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}:${s.length}`;
}

/** Best-effort push of a namespaced payload to Supabase. Never throws. Returns the resulting CloudStatus. */
export async function saveState(name: string, payload: unknown): Promise<CloudStatus> {
  if (!supabase) return "offline";
  const h = contentHash(payload);
  if (lastHash[name] === h) return "saved"; // unchanged → no network write
  // SECURITY — redact secret-like tokens from every persisted string at this single cloud-write choke point,
  // so no API key / token can land in the shared blob regardless of which field the caller wrote. Prose
  // survives (redaction-only; no whitespace collapse). Hash is on the raw payload so change-detection is stable.
  const safe = scrubDeep(payload);
  try {
    const { error } = await supabase.from(TABLE).upsert(
      { owner_key: ownerKey(), name, payload: safe, updated_at: new Date().toISOString() },
      { onConflict: "owner_key,name" },
    );
    if (!error) { lastHash[name] = h; return "saved"; }
    // A missing table (pre-migration) is expected → report as local-only, not an error the user must act on.
    const msg = `${(error as { code?: string }).code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (/42p01|pgrst205|does not exist|could not find|schema cache/.test(msg)) return "offline";
    return "error";
  } catch {
    return "error";
  }
}

/** Best-effort load of a namespaced payload for this owner. Returns null on any failure / no row / no client. */
export async function loadState<T = unknown>(name: string): Promise<T | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase
      .from(TABLE)
      .select("payload")
      .eq("owner_key", ownerKey())
      .eq("name", name)
      .maybeSingle();
    const payload = (data as { payload?: unknown } | null)?.payload;
    return payload == null ? null : (payload as T);
  } catch {
    return null;
  }
}

// SSSES · Scalability + Efficiency — hydrate EVERY namespace in ONE round-trip instead of N per-name selects.
// The SoI-2525 deck reads ~8 namespaces on mount (config · members · node-budgets · audit · projects ·
// slide-fields · slide-versions · scenarios); a single query cuts mount latency and DB load ~8×. Best-effort:
// returns {} on no client / any failure, so hydrate degrades to the local (localStorage) rung. Never throws.
export async function loadAllState(names?: string[]): Promise<Record<string, unknown>> {
  if (!supabase) return {};
  try {
    let q = supabase.from(TABLE).select("name,payload").eq("owner_key", ownerKey());
    if (names && names.length) q = q.in("name", names);
    const { data } = await q;
    const out: Record<string, unknown> = {};
    for (const row of (data as { name?: string; payload?: unknown }[] | null) ?? []) {
      if (row?.name != null && row.payload != null) out[row.name] = row.payload;
    }
    return out;
  } catch {
    return {};
  }
}

// SSSES · completeness — a namespace the caller retires (e.g. a per-project blob whose project was removed)
// should be able to drop its durable row, not just its local copy. Best-effort; never throws. Pairs with the
// DELETE RLS policy (migration 029). Also clears the content-hash guard so a later re-save of the same name
// isn't skipped as "unchanged".
export async function deleteState(name: string): Promise<CloudStatus> {
  delete lastHash[name];
  if (!supabase) return "offline";
  try {
    const { error } = await supabase.from(TABLE).delete().eq("owner_key", ownerKey()).eq("name", name);
    if (!error) return "saved";
    const msg = `${(error as { code?: string }).code ?? ""} ${error.message ?? ""}`.toLowerCase();
    if (/42p01|pgrst205|does not exist|could not find|schema cache/.test(msg)) return "offline";
    return "error";
  } catch {
    return "error";
  }
}
