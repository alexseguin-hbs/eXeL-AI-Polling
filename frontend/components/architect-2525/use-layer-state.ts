"use client";

/**
 * ARCHITECT-2525 · shared Layer-Tree state — visibility + lock Sets lifted so BOTH the LEFT tree and the
 * RIGHT Context inspector act on the same selected item (Security-2525's asset⇄inspector model). Persisted
 * to localStorage (the `aoHidden` pattern, mission-planning.tsx:4611).
 */
import { useEffect, useState } from "react";
import { flattenLayers, type LayerNode } from "@/lib/architect-layers";
import { systemFirstLeaf, type BimImport, type ImportedObject } from "@/lib/architect-bim";
import { type AssetOverrides } from "@/lib/architect-assets";

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
  // Asset Intelligence customizations (Inc 2) — per-asset overrides (quantity/upgrade/supplier/status).
  assetOverrides: Record<string, AssetOverrides>;
  setAssetOverride: (id: string, patch: AssetOverrides) => void;
  // Project stage gate (Inc 4) — the single Design-workspace gate index into the reused estimate engine's
  // GATES ladder (G0–G13). Advancing it matures every asset's estimate: confidence RISES, ± band NARROWS.
  gate: number;
  setGate: (g: number) => void;
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

  // Asset Intelligence customizations (Inc 2) — persisted per-asset overrides; each edit logs a Replay event.
  const [assetOverrides, setAssetOverrides] = useState<Record<string, AssetOverrides>>({});
  useEffect(() => { try { const v = localStorage.getItem("arch2525.assetOverrides"); if (v) setAssetOverrides(JSON.parse(v)); } catch {} }, []);
  const setAssetOverride = (id: string, patch: AssetOverrides) => {
    setAssetOverrides((m) => { const next = { ...m, [id]: { ...(m[id] || {}), ...patch } }; try { localStorage.setItem("arch2525.assetOverrides", JSON.stringify(next)); } catch {} return next; });
    logReplay("asset.customize", `${id} · ${Object.keys(patch).join(",")}`);
  };

  // Project stage gate (Inc 4) — persisted index into the reused estimate engine's G0–G13 ladder; every change
  // logs Replay (a homeowner decision). Default G3 (Concept), matching the estimate surface's starting gate.
  const [gate, setGateRaw] = useState(3);
  useEffect(() => { try { const v = localStorage.getItem("arch2525.gate"); if (v != null) setGateRaw(Math.max(0, Math.min(13, JSON.parse(v)))); } catch {} }, []);
  const setGate = (g: number) => setGateRaw(() => {
    const n = Math.max(0, Math.min(13, Math.round(g)));
    try { localStorage.setItem("arch2525.gate", JSON.stringify(n)); } catch {}
    logReplay("gate.advance", `G${n}`);
    return n;
  });

  return {
    hidden, locked, toggleHidden, toggleLocked, isolate, revealAll, spec, toggleSpec, addSpecIds, setSpecIds, clearSpec,
    replay, logReplay, unclassified, bimManifest, applyBimImport, resolveUnclassified, assetOverrides, setAssetOverride,
    gate, setGate,
  };
}
