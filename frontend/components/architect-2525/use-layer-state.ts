"use client";

/**
 * ARCHITECT-2525 · shared Layer-Tree state — visibility + lock Sets lifted so BOTH the LEFT tree and the
 * RIGHT Context inspector act on the same selected item (Security-2525's asset⇄inspector model). Persisted
 * to localStorage (the `aoHidden` pattern, mission-planning.tsx:4611).
 */
import { useEffect, useState } from "react";
import { flattenLayers, type LayerNode } from "@/lib/architect-layers";
import { systemFirstLeaf, type BimImport, type ImportedObject } from "@/lib/architect-bim";

// Empty on the server AND the client's first render (no hydration mismatch under `output: export`);
// stored values load in a mount effect. Persistence is write-through on mutation — never on mount —
// so the pre-load empty state can't clobber what's in localStorage.
function usePersistentSet(key: string): [Set<string>, (id: string) => void, (ids?: string[]) => void] {
  const [set, setSet] = useState<Set<string>>(() => new Set<string>());
  useEffect(() => { try { const v = localStorage.getItem(key); if (v) setSet(new Set<string>(JSON.parse(v))); } catch {} }, [key]);
  const persist = (n: Set<string>) => { try { localStorage.setItem(key, JSON.stringify(Array.from(n))); } catch {} return n; };
  const toggle = (id: string) => setSet((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return persist(n); });
  const replace = (ids: string[] = []) => setSet(() => persist(new Set(ids)));
  return [set, toggle, replace];
}

export interface LayerState {
  hidden: Set<string>;
  locked: Set<string>;
  toggleHidden: (id: string) => void;
  toggleLocked: (id: string) => void;
  isolate: (node: LayerNode) => void;   // hide every leaf outside this node's subtree
  revealAll: () => void;
  // house build spec (R4) — the components the user has chosen to put ON the house
  spec: Set<string>;
  toggleSpec: (id: string) => void;
  addSpecIds: (ids: string[]) => void;   // add a set of leaf ids at once (the caller applies any home-type filter)
  setSpecIds: (ids: string[]) => void;   // replace the whole spec (BIM import)
  clearSpec: () => void;
  // Replay log (Vision 2525) — every meaningful mutation records an event (Inc 1).
  replay: ReplayEvent[];
  logReplay: (kind: string, detail: string) => void;
  // BIM import (Inc 1) — the Unclassified queue + last manifest, lifted so they survive the empty↔populated remount.
  unclassified: ImportedObject[];
  bimManifest: BimManifest | null;
  applyBimImport: (res: BimImport) => void;
  resolveUnclassified: (extId: string, systemId: string) => void;
}

export interface ReplayEvent { t: number; kind: string; detail: string; }
export interface BimManifest { file: string; hash: string; placed: number; queued: number; }

export function useLayerState(): LayerState {
  const [hidden, toggleHidden, replaceHidden] = usePersistentSet("arch2525.layerHidden");
  const [locked, toggleLocked] = usePersistentSet("arch2525.layerLocked");
  const [spec, toggleSpec, replaceSpec] = usePersistentSet("arch2525.houseSpec");
  const isolate = (node: LayerNode) => {
    const keep = new Set(flattenLayers([node]).map((n) => n.id));
    replaceHidden(flattenLayers().filter((n) => !n.children?.length && !keep.has(n.id)).map((n) => n.id));
  };
  const revealAll = () => replaceHidden([]);
  const addSpecIds = (ids: string[]) => replaceSpec(Array.from(new Set([...Array.from(spec), ...ids])));
  const setSpecIds = (ids: string[]) => replaceSpec(ids);
  const clearSpec = () => replaceSpec([]);

  // Replay log — bounded, persisted, write-through (last 200 events).
  const [replay, setReplay] = useState<ReplayEvent[]>([]);
  useEffect(() => { try { const v = localStorage.getItem("arch2525.replay"); if (v) setReplay(JSON.parse(v)); } catch {} }, []);
  const logReplay = (kind: string, detail: string) => setReplay((r) => {
    const now = (() => { try { return Date.now(); } catch { return 0; } })();
    const next = [...r, { t: now, kind, detail }].slice(-200);
    try { localStorage.setItem("arch2525.replay", JSON.stringify(next)); } catch {}
    return next;
  });

  // BIM Unclassified queue + last manifest (persisted; survives the HouseSpec empty↔populated remount).
  const [unclassified, setUnclassified] = useState<ImportedObject[]>([]);
  const [bimManifest, setBimManifest] = useState<BimManifest | null>(null);
  useEffect(() => {
    try { const u = localStorage.getItem("arch2525.unclassified"); if (u) setUnclassified(JSON.parse(u)); } catch {}
    try { const m = localStorage.getItem("arch2525.bimManifest"); if (m) setBimManifest(JSON.parse(m)); } catch {}
  }, []);
  const persistUnc = (u: ImportedObject[]) => { try { localStorage.setItem("arch2525.unclassified", JSON.stringify(u)); } catch {} return u; };
  const persistMan = (m: BimManifest | null) => { try { localStorage.setItem("arch2525.bimManifest", JSON.stringify(m)); } catch {} return m; };
  const applyBimImport = (res: BimImport) => {
    addSpecIds(res.leafIds);
    setUnclassified((u) => persistUnc([...u, ...res.unclassified]));
    setBimManifest(() => persistMan({ file: res.sourceFile, hash: res.sourceHash, placed: res.leafIds.length, queued: res.unclassified.length }));
    logReplay("bim.import", `${res.objects.length} mapped · ${res.unclassified.length} unclassified · ${res.sourceFile}`);
  };
  const resolveUnclassified = (extId: string, systemId: string) => {
    const leaf = systemFirstLeaf(systemId);
    if (leaf) addSpecIds([leaf]);
    setUnclassified((u) => persistUnc(u.filter((o) => o.extId !== extId)));
    setBimManifest((m) => (m ? persistMan({ ...m, placed: m.placed + (leaf ? 1 : 0), queued: Math.max(0, m.queued - 1) }) : m));
    logReplay("bim.classify", `${extId} → ${systemId}`);
  };

  return {
    hidden, locked, toggleHidden, toggleLocked, isolate, revealAll, spec, toggleSpec, addSpecIds, setSpecIds, clearSpec,
    replay, logReplay, unclassified, bimManifest, applyBimImport, resolveUnclassified,
  };
}
