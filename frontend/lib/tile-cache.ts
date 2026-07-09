/**
 * SECURITY-2525 · Tile cache ladder (the 6-face "pull-as-you-need" data path)
 * ===========================================================================
 * getTile(key, originUrl) resolves a map tile through a 4-rung ladder, fastest first:
 *   1. memory        — this tab, instant
 *   2. localStorage  — this device across sessions, instant (survives reload)
 *   3. Supabase      — shared team cache: one operator loads it, everyone gets it
 *   4. origin        — static /security-2525/*.json (or an API), then written back UP
 *      the ladder (localStorage + Supabase) so it's warm next time, for everyone.
 *
 * In-flight requests for the same key are de-duplicated (two panes zoom to the same
 * tile → one network round-trip). Every rung is best-effort: a missing Supabase table,
 * quota-full localStorage, or offline origin all degrade gracefully to the next rung
 * (R-CORE law — one rung offline, the ladder still delivers).
 *
 * Supabase table (optional — falls back to origin if absent):
 *   create table map_tiles (tile_key text primary key, face text, payload jsonb,
 *     updated_at timestamptz default now());  -- see docs/security-2525/supabase_map_tiles.sql
 */
import { supabase } from "./supabase";

const mem = new Map<string, unknown>();
const inflight = new Map<string, Promise<unknown>>();
const LS = "sec2525.tile.";

function lsGet<T>(key: string): T | null {
  try { const s = localStorage.getItem(LS + key); return s ? (JSON.parse(s) as T) : null; } catch { return null; }
}
function lsPut(key: string, v: unknown): void {
  try { localStorage.setItem(LS + key, JSON.stringify(v)); } catch { /* quota — memory still holds it */ }
}

/** Synchronous peek — returns a tile only if it's already in memory (no I/O). */
export function peekTile<T>(key: string): T | null {
  return (mem.get(key) as T) ?? null;
}

/** Resolve a tile through memory → localStorage → Supabase → origin, warming each rung. */
export function getTile<T>(key: string, originUrl: string, face = "dem"): Promise<T | null> {
  const hit = mem.get(key);
  if (hit !== undefined) return Promise.resolve(hit as T);
  const pending = inflight.get(key);
  if (pending) return pending as Promise<T | null>;

  const job = (async (): Promise<T | null> => {
    // 2. localStorage
    const local = lsGet<T>(key);
    if (local) { mem.set(key, local); return local; }
    // 3. Supabase shared cache (best-effort)
    if (supabase) {
      try {
        const { data } = await supabase.from("map_tiles").select("payload").eq("tile_key", key).maybeSingle();
        const payload = (data as { payload?: T } | null)?.payload;
        if (payload) { mem.set(key, payload); lsPut(key, payload); return payload; }
      } catch { /* table missing / offline → next rung */ }
    }
    // 4. origin — then write back UP the ladder for everyone
    try {
      const r = await fetch(originUrl);
      if (!r.ok) return null;
      const v = (await r.json()) as T;
      mem.set(key, v);
      lsPut(key, v);
      if (supabase) {
        supabase.from("map_tiles").upsert({ tile_key: key, face, payload: v }).then(
          () => { /* shared cache warmed */ },
          () => { /* no write access / table missing — fine */ },
        );
      }
      return v;
    } catch {
      return null;
    }
  })();

  inflight.set(key, job);
  job.finally(() => inflight.delete(key));
  return job;
}
