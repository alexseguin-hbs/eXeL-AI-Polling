/**
 * HWR client-rotor (Tier 1 of the 4-tier Hexagonal Write Rotor).
 * ============================================================================
 * A pure, framework-free micro-batch buffer for the CLIENT side of the write path.
 * High-throughput writes (bulk import, SIM replay) accumulate + dedup here and flush as
 * ONE payload on a size or time threshold — so the API receives a handful of bulk calls
 * instead of N per-row round-trips (Tier 2 `POST /responses/bulk` → `hwr_absorb`).
 *
 * NON-SACRED: single live poll responses do NOT go through this — they keep the exact
 * Trinity-Redundancy 3-path delivery (session-view Paths A/B/C), which is latency-critical
 * and must never be batched. The caller decides: live → sacred paths; bulk → this buffer.
 *
 * Deterministic + offline-testable: dedup by a natural key (or content fingerprint), size
 * flush is synchronous, and the time flush takes an injected `nowMs` so tests need no timers.
 */

export const FACES = 6; // a cube's 6 faces / hex ring / drone-swarm modular units

/** Stable content fingerprint (sorted keys) for dedup when no natural key is given. */
export function contentKey(rec: Record<string, unknown>): string {
  return JSON.stringify(rec, Object.keys(rec).sort());
}

/** Deterministic client-side face for local sharding (the authoritative face is recomputed
 *  server-side by write_rotor.rotor_face; this only balances the client buffer). */
export function clientFace(key: string, seq: number, seed = "hwr"): number {
  let h = 5381;
  const s = `${seed}:${key}:${seq}`;
  for (let i = 0; i < s.length; i++) h = (((h << 5) + h) ^ s.charCodeAt(i)) >>> 0;
  return h % FACES;
}

export interface HwrClientOptions<T> {
  maxBatch?: number; // flush when the buffer reaches this many (default 500)
  maxWaitMs?: number; // flush when the oldest buffered item is this old (default 2000)
  dedupKey?: keyof T & string; // dedup on this field; else content fingerprint
  onFlush: (batch: T[]) => void | Promise<void>;
}

/** A batching, deduping client buffer. Add records; it flushes on size or (checked) time. */
export class HwrClient<T extends Record<string, unknown>> {
  private buf: T[] = [];
  private seen = new Set<string>();
  private oldestAt: number | null = null;
  private readonly maxBatch: number;
  private readonly maxWaitMs: number;
  private readonly dedupKey?: string;
  private readonly onFlush: (batch: T[]) => void | Promise<void>;

  constructor(opts: HwrClientOptions<T>) {
    this.maxBatch = opts.maxBatch ?? 500;
    this.maxWaitMs = opts.maxWaitMs ?? 2000;
    this.dedupKey = opts.dedupKey;
    this.onFlush = opts.onFlush;
  }

  private fp(rec: T): string {
    return this.dedupKey ? String(rec[this.dedupKey]) : contentKey(rec);
  }

  /** Buffer a record (deduped). Returns true if accepted, false if a duplicate was dropped.
   *  Flushes synchronously when the size threshold is hit. */
  add(rec: T, nowMs = 0): boolean {
    const k = this.fp(rec);
    if (this.seen.has(k)) return false; // Trinity write-layer dedup (client seenIds)
    this.seen.add(k);
    this.buf.push(rec);
    if (this.oldestAt === null) this.oldestAt = nowMs;
    if (this.buf.length >= this.maxBatch) this.flush();
    return true;
  }

  /** Flush by elapsed time — call from a setInterval with the current clock. */
  maybeFlushByTime(nowMs: number): void {
    if (this.buf.length > 0 && this.oldestAt !== null && nowMs - this.oldestAt >= this.maxWaitMs) {
      this.flush();
    }
  }

  size(): number {
    return this.buf.length;
  }

  /** Emit the current batch (if any) and clear the buffer + dedup window. */
  flush(): void {
    if (this.buf.length === 0) return;
    const batch = this.buf;
    this.buf = [];
    this.seen.clear();
    this.oldestAt = null;
    void this.onFlush(batch);
  }
}
