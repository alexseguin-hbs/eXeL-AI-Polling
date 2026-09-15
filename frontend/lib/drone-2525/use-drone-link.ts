"use client";

// THE CREW LINK — the impure half of lib/drone-2525/link.ts.
//
// THREE PATHS IN PARALLEL, the same shape as the Trinity Redundancy the polling app already relies on: any
// one of them arriving is the message delivered, and the pure reducer drops the duplicates the other two
// produce. A crew that loses each other mid-flight is the failure this is arranged against.
//
//   A · BroadcastChannel   same browser, another tab      ~0 ms   always available
//   B · Cloudflare store   any device, via the Pages fn   ~1 s    available on the deployed site
//   C · localStorage       same browser, another tab      ~0 ms   the fallback when BroadcastChannel is not there
//
// Supabase is deliberately NOT a fourth path here. The polling app's broadcast channels are load-bearing
// and locked (CLAUDE.md: SACRED CODE), and a rehearsal surface has no business sharing them.
import { useCallback, useEffect, useRef, useState } from "react";
import { initLink, receive, compose, authored, type LinkMsg, type LinkState, type Seat } from "./link";

const POLL_MS = 900;
const KEY = (code: string) => `drone2525.link.${code}`;

export interface DroneLink {
  state: LinkState;
  /** Send something from this seat. Refused, and counted, if this seat may not say it. */
  say: (payload: Parameters<typeof compose>[3]) => void;
  /** How many of the three paths carried the last thing we sent. Shown, never hidden. */
  paths: { channel: boolean; cloud: boolean; storage: boolean };
}

export function useDroneLink(me: Seat, code: string, nowMs: number, enabled = true): DroneLink {
  const [state, setState] = useState<LinkState>(() => initLink(me, code));
  const [paths, setPaths] = useState({ channel: false, cloud: false, storage: false });
  const seq = useRef(0);
  const bc = useRef<BroadcastChannel | null>(null);
  const now = useRef(nowMs);
  useEffect(() => { now.current = nowMs; });

  const take = useCallback((raw: unknown) => {
    const m = raw as LinkMsg;
    if (!m || typeof m !== "object") return;
    setState((s) => receive(s, m, now.current));
  }, []);

  // A — same browser, another tab.
  useEffect(() => {
    if (!enabled || !code || typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel(`drone:${code}`);
    ch.onmessage = (e) => take(e.data);
    bc.current = ch;
    setPaths((p) => ({ ...p, channel: true }));
    return () => { ch.close(); bc.current = null; };
  }, [code, enabled, take]);

  // C — same browser, another tab, when BroadcastChannel is absent.
  useEffect(() => {
    if (!enabled || !code || typeof window === "undefined") return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY(code) || !e.newValue) return;
      try { take(JSON.parse(e.newValue)); } catch { /* a half-written value is not a message */ }
    };
    window.addEventListener("storage", onStorage);
    setPaths((p) => ({ ...p, storage: true }));
    return () => window.removeEventListener("storage", onStorage);
  }, [code, enabled, take]);

  // B — any device. The only path that crosses from a phone to a computer.
  useEffect(() => {
    if (!enabled || !code) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(`/api/drone-link?crew=${encodeURIComponent(code)}`, { cache: "no-store" });
        if (!r.ok) throw new Error(String(r.status));
        const body = (await r.json()) as { seats?: Record<string, LinkMsg> };
        if (!alive) return;
        setPaths((p) => (p.cloud ? p : { ...p, cloud: true }));
        for (const m of Object.values(body.seats ?? {})) take(m);
      } catch { if (alive) setPaths((p) => (p.cloud ? { ...p, cloud: false } : p)); }
    };
    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => { alive = false; window.clearInterval(id); };
  }, [code, enabled, take]);

  const say = useCallback((payload: Parameters<typeof compose>[3]) => {
    setState((s) => {
      const m = compose(s, ++seq.current, now.current, payload);
      if (!m) return { ...s, refused: s.refused + 1, lastRefusal: `this seat may not send a ${payload.kind} message` };
      // Every path gets it. The receiver drops the copies; losing one is what the others are for.
      try { bc.current?.postMessage(m); } catch { /* a closed channel is not a reason to stop */ }
      try { localStorage.setItem(KEY(s.code), JSON.stringify(m)); } catch { /* private window */ }
      void fetch("/api/drone-link", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crew: s.code, msg: m }), keepalive: true,
      }).catch(() => { /* the other two may still have carried it */ });
      return s;
    });
  }, []);

  return { state, say, paths };
}

export { authored };
