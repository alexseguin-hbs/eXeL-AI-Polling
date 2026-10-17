/**
 * ARCHITECT-2525 · Saved-files cloud backup (Vision 2525)
 * =======================================================
 * Mirrors the Design workspace snapshot (house build spec · BIM imports · per-asset overrides · stage gate ·
 * replay log) to Supabase so it survives a cache-clear and reloads on the same owner elsewhere. localStorage
 * stays the fast local rung; Supabase is the durable / cross-device rung — the same ladder philosophy as
 * `tile-cache.ts`. Every call is best-effort and NEVER throws: no Supabase env → the client is `null` → no-op;
 * a missing table or offline → graceful degrade to local-only (nothing breaks before migration 022 is applied).
 *
 * Ownership: scoped by `ownerKeyOrNull()` — a persisted per-browser UUID (`arch2525.ownerId`), or NULL when one
 * cannot be minted durably. It FAILS CLOSED: no durable key means no cloud, never a shared bucket. The 2525 apps
 * sit behind the eXeL login while MVP, so this swaps to the authenticated user id in ONE place when accounts land.
 *
 * Reads and writes go through the SECURITY DEFINER RPCs of migration 044 first and fall back to the legacy
 * direct-table path when they are absent, which is what lets this client ship BEFORE the migration without a
 * window where saving fails. Until 044 is applied the table's own policies are the permissive ones 023/024
 * shipped — see the migration header for what that means and why it is being closed.
 *
 * Supabase table (optional — see supabase/migrations/022_architect_saved_files.sql):
 *   architect_saved_files(id uuid pk, owner_key text, name text, payload jsonb, source_hash text, updated_at)
 */
import { supabase } from "./supabase";
import { isMissingFn, isMissingTable } from "./supabase-errors";
import { sanitizeSnapshot, sanitizeRoomLayout } from "./architect-guard";
import { type RoomCell } from "./room-layout";

export interface ArchitectSnapshot {
  houseSpec: string[];
  layerHidden: string[];
  layerLocked: string[];
  unclassified: unknown[];
  bimManifest: unknown;
  assetOverrides: Record<string, unknown>;
  gate: number;
  globalParams?: unknown; // S5 — whole-project inputs (area · stories · finish); optional for back-compat
  program?: unknown;      // V2 — room program (bedrooms · bathrooms · ceiling ht); optional for back-compat
  codes?: string[];       // V4 — chosen building standards; optional for back-compat
  replay: unknown[];
  savedAt: number; // ms epoch of the snapshot (last-write-wins across devices)
}

export type CloudStatus = "idle" | "saving" | "saved" | "offline" | "error";

const TABLE = "architect_saved_files";
const NAME = "workspace";
const NAME_ROOMS = "roomlayout"; // per-room furniture layouts — the interior designs the operator builds room by room

const OWNER_LS_KEY = "arch2525.ownerId";
const MIN_OWNER_LEN = 32;
const MAX_OWNER_LEN = 64;

/** A key is usable only if it is long, non-guessable, and not the old shared constant. */
function validOwner(v: unknown): v is string {
  return typeof v === "string"
    && v.length >= MIN_OWNER_LEN && v.length <= MAX_OWNER_LEN
    && /^[A-Za-z0-9-]+$/.test(v)
    && v.toLowerCase() !== "anon";
}

/**
 * The authoritative cloud-scoping key, or `null` when one cannot be minted **durably and uniquely**.
 *
 * SECURITY (fail closed). This used to `return "anon"` whenever localStorage threw, so every visitor in a
 * storage-blocked context presented the SAME key — they read each other's house designs and clobbered each
 * other's writes on a 1.2 s autosave timer. It also used to fall back to `"own-" + Date.now().toString(36)`,
 * a millisecond-granular id anyone can enumerate. There is no safe shared fallback, so there is no fallback:
 * no storage, or no CSPRNG, means no cloud, and the local rung carries on untouched. A legacy `"anon"` or
 * `"own-…"` value already in localStorage is rejected and re-minted, so the shared bucket heals on next load.
 *
 * This is the same shape `innovation-store.ts:66-82` already uses, and migration 030 proved: the fix existed
 * for the sibling table and had not been applied here.
 */
export function ownerKeyOrNull(): string | null {
  let ls: Storage;
  try {
    const s = (globalThis as { localStorage?: Storage | null }).localStorage;
    if (!s) return null;
    ls = s;
  } catch { return null; }                       // access itself throws in Lockdown Mode
  try {
    const existing = ls.getItem(OWNER_LS_KEY);
    if (validOwner(existing)) return existing;
    const minted = randomId();
    if (!minted) return null;                    // no CSPRNG → never mint a guessable durable key
    ls.setItem(OWNER_LS_KEY, minted);
    const back = ls.getItem(OWNER_LS_KEY);       // a silently-dropped write must not look durable
    return validOwner(back) ? back : null;
  } catch { return null; }
}

function randomId(): string | null {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const a = new Uint8Array(16);
      c.getRandomValues(a);
      return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    /* no CSPRNG — fail closed below rather than mint something guessable */
  }
  return null;
}

/** True when a Supabase client is configured AND a durable owner key exists. Callers no-op when false. */
export function cloudEnabled(): boolean {
  return !!supabase && ownerKeyOrNull() !== null;
}

// PERF — skip a cloud write whose CONTENT is byte-identical to the last one we saved for that name. The debounced
// write-through fires on any state-reference change (even a no-op re-render), so without this every idle tick would
// re-upload the full snapshot; the hash guard cuts those redundant writes → less Supabase write load, egress, cost.
const lastHash: Record<string, string> = {};
function contentHash(v: unknown): string {
  const s = JSON.stringify(v);
  let h = 5381; for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}:${s.length}`;
}

/** Best-effort push of the snapshot to Supabase. Never throws. Returns the resulting CloudStatus. */
export async function saveSnapshot(snap: ArchitectSnapshot, sourceHash?: string): Promise<CloudStatus> {
  const sb = supabase; if (!sb) return "offline";
  const owner = ownerKeyOrNull(); if (!owner) return "offline";   // fail closed — never a shared bucket
  // dedup on CONTENT (exclude savedAt — the timestamp changes every tick and would defeat the guard).
  const { savedAt: _t, ...content } = snap;
  const h = contentHash(content);
  if (lastHash[NAME] === h) return "saved"; // unchanged → no network write
  try {
    // RPC FIRST, legacy table SECOND. This is what makes the client and migration 044 order-independent:
    // against a pre-044 database the RPC 404s and the table path still works; against a post-044 database
    // the RPC succeeds and the table path is denied anyway. So the client can ship first and nobody's save
    // breaks in the window before the migration is applied.
    const { error } = await sb.rpc("architect_saved_files_put",
      { p_owner: owner, p_name: NAME, p_payload: snap, p_source_hash: sourceHash ?? null });
    if (!error) { lastHash[NAME] = h; return "saved"; }
    if (!isMissingFn(error)) return isMissingTable(error) ? "offline" : "error";
  } catch { /* fall through to the legacy path */ }
  try {
    const { error } = await sb.from(TABLE).upsert(
      {
        owner_key: owner,
        name: NAME,
        payload: snap,
        source_hash: sourceHash ?? null,
        updated_at: new Date(snap.savedAt || Date.now()).toISOString(),
      },
      { onConflict: "owner_key,name" },
    );
    if (!error) { lastHash[NAME] = h; return "saved"; }
    return isMissingTable(error) ? "offline" : "error";
  } catch {
    return "error";
  }
}

/** Best-effort load of this owner's latest snapshot. Returns null on any failure / no row / no client. */
export async function loadSnapshot(): Promise<ArchitectSnapshot | null> {
  const sb = supabase; if (!sb) return null;
  const owner = ownerKeyOrNull(); if (!owner) return null;
  try {
    const { data, error } = await sb.rpc("architect_saved_files_get", { p_owner: owner, p_name: NAME });
    if (!error) return data == null ? null : sanitizeSnapshot(data);
    if (!isMissingFn(error)) return null;
  } catch { /* fall through to the legacy path */ }
  try {
    const { data } = await sb
      .from(TABLE)
      .select("payload")
      .eq("owner_key", owner)
      .eq("name", NAME)
      .maybeSingle();
    const payload = (data as { payload?: unknown } | null)?.payload;
    // WireGuard: a cloud row is untrusted input — sanitize before it can seat any state.
    return payload == null ? null : sanitizeSnapshot(payload);
  } catch {
    return null;
  }
}

// ─── Per-room furniture layouts (the interior designs) — the ONE Supabase gap: these lived only in localStorage,
//     so a cache-clear / new device lost every room's furniture. Same best-effort/never-throws/sanitized ladder. ───

/** Best-effort push of the room-furniture layout to Supabase (durable + cross-device). Never throws. */
export async function saveRoomLayout(layout: RoomCell[], sourceHash?: string): Promise<CloudStatus> {
  const sb = supabase; if (!sb) return "offline";
  const owner = ownerKeyOrNull(); if (!owner) return "offline";
  const h = contentHash(layout);
  if (lastHash[NAME_ROOMS] === h) return "saved"; // unchanged → no network write
  try {
    const { error } = await sb.rpc("architect_saved_files_put",
      { p_owner: owner, p_name: NAME_ROOMS, p_payload: { layout }, p_source_hash: sourceHash ?? null });
    if (!error) { lastHash[NAME_ROOMS] = h; return "saved"; }
    if (!isMissingFn(error)) return isMissingTable(error) ? "offline" : "error";
  } catch { /* fall through to the legacy path */ }
  try {
    const { error } = await sb.from(TABLE).upsert(
      { owner_key: owner, name: NAME_ROOMS, payload: { layout }, source_hash: sourceHash ?? null, updated_at: new Date(Date.now()).toISOString() },
      { onConflict: "owner_key,name" },
    );
    if (!error) { lastHash[NAME_ROOMS] = h; return "saved"; }
    return isMissingTable(error) ? "offline" : "error"; // pre-migration → local-only
  } catch {
    return "error";
  }
}

/** Best-effort load of this owner's room-furniture layout. Sanitized (WireGuard). Returns null on any failure / no row. */
export async function loadRoomLayout(): Promise<RoomCell[] | null> {
  const sb = supabase; if (!sb) return null;
  const owner = ownerKeyOrNull(); if (!owner) return null;
  try {
    const { data, error } = await sb.rpc("architect_saved_files_get", { p_owner: owner, p_name: NAME_ROOMS });
    if (!error) {
      const raw = (data as { layout?: unknown } | null)?.layout;
      return raw == null ? null : sanitizeRoomLayout(raw);
    }
    if (!isMissingFn(error)) return null;
  } catch { /* fall through to the legacy path */ }
  try {
    const { data } = await sb.from(TABLE).select("payload").eq("owner_key", owner).eq("name", NAME_ROOMS).maybeSingle();
    const raw = (data as { payload?: { layout?: unknown } } | null)?.payload?.layout;
    return raw == null ? null : sanitizeRoomLayout(raw); // untrusted cloud row → sanitize before it seats any state
  } catch {
    return null;
  }
}
