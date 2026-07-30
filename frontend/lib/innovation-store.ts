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
 * ── AUTHORISATION (migration 030_innovation_state_rls_hardening.sql) ─────────────────────────────────
 * 028/029 shipped RLS policies of the form `USING (owner_key IS NOT NULL AND length(owner_key) > 0)`.
 * That is a NOT-NULL check, TRUE for every row — the whole table was readable/writable/deletable with the
 * public anon key, and the `.eq("owner_key", …)` filters below were the ONLY scoping, which is a
 * convenience, never a control. Migration 030 revokes the anon role's table grants entirely and exposes
 * four SECURITY DEFINER RPCs that require the exact owner key as an argument, so the table can no longer
 * be enumerated or dumped. This module now calls those RPCs first and only falls back to the direct-table
 * path when the function is absent (i.e. before 030 is applied) — the fallback cannot weaken anything,
 * because pre-030 the database itself is permissive regardless of what the client sends.
 *
 * Ownership: `ownerKeyOrNull()` — a persisted per-browser UUID (`innovation.ownerId`). It FAILS CLOSED:
 * when localStorage is unavailable (Safari Private Browsing, iOS Lockdown Mode, partitioned webviews,
 * storage-blocking extensions) or no CSPRNG exists, it returns `null` and the cloud rung switches off, so
 * those users run local-only instead of piling into ONE shared row per namespace. It swaps to the
 * authenticated user id in ONE place when accounts land.
 *
 * Supabase table (optional — supabase/migrations/028 + 029 + 030):
 *   innovation_state(id uuid pk, owner_key text, name text, payload jsonb, user_id uuid,
 *                    created_at, updated_at, UNIQUE(owner_key,name))
 */
import { supabase } from "./supabase";
import { scrubDeep } from "./innovation-data";

const TABLE = "innovation_state";

/** `saved-lossy` = the write landed, but scrubbing materially shrank it (see scrubReport). Never silent. */
export type CloudStatus = "idle" | "saving" | "saved" | "saved-lossy" | "offline" | "error";

// ── Ownership ────────────────────────────────────────────────────────────────────────────────────────
const OWNER_LS_KEY = "innovation.ownerId";
/** Matches `innovation_state_owner_ok()` in migration 030 — a crypto-minted UUID (36) or 32-char hex. */
const MIN_OWNER_LEN = 32, MAX_OWNER_LEN = 64;

function validOwner(v: unknown): v is string {
  return typeof v === "string"
    && v.length >= MIN_OWNER_LEN && v.length <= MAX_OWNER_LEN
    && /^[A-Za-z0-9-]+$/.test(v)
    && v.toLowerCase() !== "anon";
}

/**
 * The authoritative cloud-scoping key, or `null` when one cannot be minted **durably and uniquely**.
 *
 * SECURITY (fail closed) — the previous implementation returned the literal string `"anon"` whenever
 * localStorage threw. Every user in a storage-blocked context then shared ONE row per namespace: they read
 * each other's data and clobbered each other's writes. There is no safe shared fallback, so there is no
 * fallback: no storage, or no CSPRNG, means no cloud. A legacy `"anon"` (or any other malformed) value
 * already sitting in localStorage is rejected and re-minted, so the shared bucket heals on next load.
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

// A per-page-load, never-persisted, never-uploaded identity token. Used ONLY by the ownerKey() shim below
// so the UI keeps a stable "me" within a session when the durable key is unavailable. The ":" makes it fail
// both validOwner() here and innovation_state_owner_ok() in the database, so it can never scope a cloud row.
let _ephemeral: string | null = null;
function ephemeralLocalId(): string {
  if (!_ephemeral) {
    const r = randomId();
    _ephemeral = "local-only:" + (r ?? `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`);
  }
  return _ephemeral;
}

/**
 * Non-null identity token for UI use (membership rows, "(you)" markers).
 *
 * Prefer `ownerKeyOrNull()` for anything that touches the network — this shim is deliberately total so the
 * existing `string`-typed call sites keep compiling, and it NEVER returns a shared constant: when the
 * durable key cannot be minted it hands back a unique, ephemeral, local-only token instead of `"anon"`.
 * @deprecated for cloud scoping — every store function below uses `ownerKeyOrNull()`.
 */
export function ownerKey(): string {
  return ownerKeyOrNull() ?? ephemeralLocalId();
}

/** 128 bits from a CSPRNG, or `null`. Fails closed — never mints a millisecond-granular, enumerable id. */
function randomId(): string | null {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c?.randomUUID) return c.randomUUID();
    if (c?.getRandomValues) {
      const a = new Uint8Array(16);
      c.getRandomValues(a);
      return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* fall through */ }
  return null;
}

/** True when a Supabase client is configured AND a durable owner key exists. Callers no-op when false. */
export function cloudEnabled(): boolean {
  return !!supabase && ownerKeyOrNull() !== null;
}

// ── Lossy-write detection (Fix 3) ────────────────────────────────────────────────────────────────────
/** Mirrors the `max` default of `redactSecrets()` in innovation-data.ts. Locked by tests. */
export const REDACT_MAX = 4000;
/** Below this, shrink is ordinary secret redaction; at or above it, the caller is told the write was lossy. */
export const MATERIAL_LOSS_CHARS = 256;

export interface ScrubReport {
  rawChars: number;
  safeChars: number;
  lostChars: number;
  /** Strings that hit the hard `redactSecrets` cap — real, silent content loss. */
  truncatedFields: number;
  /** Strings changed without hitting the cap — intentional secret redaction. */
  redactedFields: number;
  lossy: boolean;
}

/**
 * Compare a payload with its scrubbed twin and report what scrubbing removed.
 *
 * `redactSecrets()` truncates every string at REDACT_MAX with no signal, while localStorage keeps the full
 * value — so the cloud copy silently becomes a shorter version of the truth. Pure and exported so the
 * behaviour is testable without a network.
 */
export function scrubReport(raw: unknown, safe: unknown): ScrubReport {
  const r: ScrubReport = { rawChars: 0, safeChars: 0, lostChars: 0, truncatedFields: 0, redactedFields: 0, lossy: false };
  walkPair(raw, safe, r, 0);
  r.lossy = r.truncatedFields > 0 || r.lostChars >= MATERIAL_LOSS_CHARS;
  return r;
}

const own = (o: object, k: string): unknown =>
  Object.prototype.hasOwnProperty.call(o, k) ? (o as Record<string, unknown>)[k] : undefined;

function walkPair(a: unknown, b: unknown, r: ScrubReport, depth: number): void {
  if (depth > 64) return;                                  // pathological nesting guard
  if (typeof a === "string") {
    const s = typeof b === "string" ? b : "";              // missing/dropped ⇒ everything was lost
    r.rawChars += a.length;
    r.safeChars += s.length;
    if (s.length < a.length) r.lostChars += a.length - s.length;
    if (a.length > REDACT_MAX && s.length === REDACT_MAX) r.truncatedFields++;
    else if (s !== a) r.redactedFields++;
    return;
  }
  if (Array.isArray(a)) {
    const bb = Array.isArray(b) ? b : [];
    for (let i = 0; i < a.length; i++) walkPair(a[i], bb[i], r, depth + 1);
    return;
  }
  if (a && typeof a === "object") {
    const bo = b && typeof b === "object" ? (b as object) : {};
    for (const [k, v] of Object.entries(a as Record<string, unknown>)) walkPair(v, own(bo, k), r, depth + 1);
  }
}

// ── Error classification ─────────────────────────────────────────────────────────────────────────────
const errText = (e: unknown): string =>
  `${(e as { code?: string } | null)?.code ?? ""} ${(e as { message?: string } | null)?.message ?? ""}`.toLowerCase();
/** The 030 RPCs are absent (pre-migration) → use the legacy direct-table path. */
const isMissingFn = (e: unknown): boolean => /pgrst202|42883|could not find the function|function .* does not exist/.test(errText(e));
/** A missing table (pre-028) is expected → report as local-only, not an error the user must act on. */
const isMissingTable = (e: unknown): boolean => /42p01|pgrst205|does not exist|could not find|schema cache/.test(errText(e));

// PERF — skip a cloud write whose CONTENT is byte-identical to the last one saved for that name, so idle
// re-renders don't re-upload. Mirrors the architect hash guard.
const lastHash: Record<string, string> = {};
const lastLossy: Record<string, boolean> = {};
function contentHash(v: unknown): string {
  const s = JSON.stringify(v);
  let h = 5381; for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return `${h.toString(36)}:${s.length}`;
}

/**
 * Best-effort push of a namespaced payload to Supabase. Never throws. Returns the resulting CloudStatus.
 *
 * Returns `"saved-lossy"` (not `"saved"`) when scrubbing materially shrank the payload, so a truncated
 * cloud copy is visible to the caller instead of silently replacing the fuller local copy later.
 */
export async function saveState(name: string, payload: unknown): Promise<CloudStatus> {
  if (!supabase) return "offline";
  const owner = ownerKeyOrNull();
  if (!owner) return "offline";           // no durable key → local-only, never a shared bucket
  const h = contentHash(payload);
  if (lastHash[name] === h) return lastLossy[name] ? "saved-lossy" : "saved"; // unchanged → no network write
  // SECURITY — redact secret-like tokens from every persisted string at this single cloud-write choke point.
  // NOTE: redactSecrets() is a best-effort filter, not a guarantee — see the audit note in the report; it
  // misses AWS `AKIA…`/`+`/`/` keys, `ghp_`/`xox`/`eyJ` prefixes, PEM bodies and DSNs. Hash is on the raw
  // payload so change-detection is stable.
  const safe = scrubDeep(payload);
  const rep = scrubReport(payload, safe);
  if (rep.lossy && typeof console !== "undefined") {
    console.warn(
      `[innovation-store] LOSSY cloud write "${name}": ${rep.lostChars} chars dropped ` +
      `(${rep.truncatedFields} field(s) truncated at ${REDACT_MAX}, ${rep.redactedFields} redacted). ` +
      `The local copy is longer than the cloud copy — do not hydrate over local from this row unconditionally.`,
    );
  }
  const status = await putRemote(owner, name, safe);
  if (status === "saved") {
    lastHash[name] = h;
    lastLossy[name] = rep.lossy;
    return rep.lossy ? "saved-lossy" : "saved";
  }
  return status;
}

async function putRemote(owner: string, name: string, safe: unknown): Promise<CloudStatus> {
  const sb = supabase!;
  try {
    const { error } = await sb.rpc("innovation_state_put", { p_owner: owner, p_name: name, p_payload: safe });
    if (!error) return "saved";
    if (!isMissingFn(error)) return isMissingTable(error) ? "offline" : "error";
  } catch { /* fall through to the pre-030 path */ }
  try {
    const { error } = await sb.from(TABLE).upsert(
      { owner_key: owner, name, payload: safe, updated_at: new Date().toISOString() },
      { onConflict: "owner_key,name" },
    );
    if (!error) return "saved";
    return isMissingTable(error) ? "offline" : "error";
  } catch {
    return "error";
  }
}

/** Best-effort load of a namespaced payload for this owner. Returns null on any failure / no row / no key. */
export async function loadState<T = unknown>(name: string): Promise<T | null> {
  if (!supabase) return null;
  const owner = ownerKeyOrNull();
  if (!owner) return null;
  try {
    const { data, error } = await supabase.rpc("innovation_state_get", { p_owner: owner, p_name: name });
    if (!error) return (data ?? null) as T | null;
    if (!isMissingFn(error)) return null;
  } catch { /* fall through to the pre-030 path */ }
  try {
    const { data } = await supabase
      .from(TABLE)
      .select("payload")
      .eq("owner_key", owner)
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
// returns {} on no client / no durable key / any failure, so hydrate degrades to the local (localStorage)
// rung. Never throws.
export async function loadAllState(names?: string[]): Promise<Record<string, unknown>> {
  if (!supabase) return {};
  const owner = ownerKeyOrNull();
  if (!owner) return {};
  const collect = (rows: { name?: string; payload?: unknown }[] | null): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const row of rows ?? []) if (row?.name != null && row.payload != null) out[row.name] = row.payload;
    return out;
  };
  try {
    const { data, error } = await supabase.rpc("innovation_state_list", {
      p_owner: owner,
      p_names: names && names.length ? names : null,
    });
    if (!error) return collect(data as { name?: string; payload?: unknown }[] | null);
    if (!isMissingFn(error)) return {};
  } catch { /* fall through to the pre-030 path */ }
  try {
    let q = supabase.from(TABLE).select("name,payload").eq("owner_key", owner);
    if (names && names.length) q = q.in("name", names);
    const { data } = await q;
    return collect(data as { name?: string; payload?: unknown }[] | null);
  } catch {
    return {};
  }
}

// SSSES · completeness — a namespace the caller retires (e.g. a per-project blob whose project was removed)
// should be able to drop its durable row, not just its local copy. Best-effort; never throws. Also clears the
// content-hash guard so a later re-save of the same name isn't skipped as "unchanged".
export async function deleteState(name: string): Promise<CloudStatus> {
  delete lastHash[name];
  delete lastLossy[name];
  if (!supabase) return "offline";
  const owner = ownerKeyOrNull();
  if (!owner) return "offline";
  try {
    const { error } = await supabase.rpc("innovation_state_del", { p_owner: owner, p_name: name });
    if (!error) return "saved";
    if (!isMissingFn(error)) return isMissingTable(error) ? "offline" : "error";
  } catch { /* fall through to the pre-030 path */ }
  try {
    const { error } = await supabase.from(TABLE).delete().eq("owner_key", owner).eq("name", name);
    if (!error) return "saved";
    return isMissingTable(error) ? "offline" : "error";
  } catch {
    return "error";
  }
}
