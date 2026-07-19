"use client";

/**
 * ARCHITECT-2525 · shared Layer-Tree state — visibility + lock Sets lifted so BOTH the LEFT tree and the
 * RIGHT Context inspector act on the same selected item (Security-2525's asset⇄inspector model). Persisted
 * to localStorage (the `aoHidden` pattern, mission-planning.tsx:4611).
 */
import { useEffect, useRef, useState } from "react";
import { flattenLayers, type LayerNode } from "@/lib/architect-layers";
import { systemFirstLeaf, type BimImport, type ImportedObject } from "@/lib/architect-bim";
import { type AssetOverrides } from "@/lib/architect-assets";
import { cloudEnabled, loadSnapshot, saveSnapshot, type ArchitectSnapshot, type CloudStatus } from "@/lib/architect-saved-files";
import { DEFAULT_PARAMS, type GlobalParams } from "@/lib/architect-project";
import { DEFAULT_PROGRAM, type RoomProgram } from "@/lib/room-program";
import { sanitizeParams, sanitizeProgram, strList } from "@/lib/architect-guard";

// Empty on the server AND the client's first render (no hydration mismatch under `output: export`);
// stored values load in a mount effect. Persistence is write-through on mutation — never on mount —
// so the pre-load empty state can't clobber what's in localStorage.
function usePersistentSet(key: string): [Set<string>, (id: string) => void, (ids?: string[]) => void] {
  const [set, setSet] = useState<Set<string>>(() => new Set<string>());
  // WireGuard: a stored set is untrusted — keep only string members (never seat objects/numbers/injections).
  useEffect(() => { try { const v = localStorage.getItem(key); if (v) setSet(new Set<string>(strList(JSON.parse(v)))); } catch {} }, [key]);
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
  // Global building params (S5) — whole-project inputs (floor area · stories · finish tier) that LIVE-RECALCULATE
  // the project rollup. Persisted + in the cloud snapshot; every change logs Replay (a homeowner decision).
  globalParams: GlobalParams;
  setGlobalParams: (patch: Partial<GlobalParams>) => void;
  program: RoomProgram;
  setProgram: (patch: Partial<RoomProgram>) => void;
  codes: Set<string>;               // chosen building standards (V4)
  toggleCode: (id: string) => void;
  // Supabase saved-files (cloud backup) — the workspace snapshot mirrors to Supabase (best-effort, never blocks
  // the UI); localStorage stays the fast local rung. `cloudStatus` drives a small indicator near House Build Spec.
  cloudStatus: CloudStatus;
}

export interface ReplayEvent { t: number; kind: string; detail: string; }
// Inc 5 — the manifest carries the mapping provenance summary (exact/keyword/spatial) for UI transparency.
export interface BimManifest { file: string; hash: string; placed: number; queued: number; exact: number; keyword: number; spatialLinked: number; }

export function useLayerState(): LayerState {
  const [hidden, toggleHidden, replaceHidden] = usePersistentSet("arch2525.layerHidden");
  const [locked, toggleLocked, replaceLocked] = usePersistentSet("arch2525.layerLocked");
  const [spec, toggleSpec, replaceSpec] = usePersistentSet("arch2525.houseSpec");
  const [codes, toggleCodeRaw, replaceCodes] = usePersistentSet("arch2525.codes");   // V4 — chosen building standards
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
    setBimManifest(() => persistMan({ file: res.sourceFile, hash: res.sourceHash, placed: res.leafIds.length, queued: res.unclassified.length, exact: res.summary.exact, keyword: res.summary.keyword, spatialLinked: res.summary.spatialLinked }));
    logReplay("bim.import", `${res.objects.length} mapped (${res.summary.exact} exact · ${res.summary.keyword} keyword) · ${res.unclassified.length} unclassified · ${res.summary.spatialLinked} spatial-linked · ${res.sourceFile}`);
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

  // Global building params (S5) — persisted; each change recomputes the rollup live and logs Replay.
  const [globalParams, setGlobalParamsRaw] = useState<GlobalParams>(DEFAULT_PARAMS);
  // WireGuard: clamp area/stories + whitelist finish/style at the boundary (not incidentally downstream).
  useEffect(() => { try { const v = localStorage.getItem("arch2525.globalParams"); if (v) setGlobalParamsRaw(sanitizeParams(JSON.parse(v))); } catch {} }, []);
  const setGlobalParams = (patch: Partial<GlobalParams>) => setGlobalParamsRaw((p) => {
    const next = { ...p, ...patch };
    try { localStorage.setItem("arch2525.globalParams", JSON.stringify(next)); } catch {}
    logReplay("params.change", Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(" · "));
    return next;
  });

  // Room program (V2) — bedrooms · bathrooms · ceiling ht; drives the element-count inspector. Persisted + snapshot.
  const [program, setProgramRaw] = useState<RoomProgram>(DEFAULT_PROGRAM);
  // WireGuard: clamp bedrooms/bathrooms/ceiling/kitchens at the boundary.
  useEffect(() => { try { const v = localStorage.getItem("arch2525.program"); if (v) setProgramRaw(sanitizeProgram(JSON.parse(v))); } catch {} }, []);
  const setProgram = (patch: Partial<RoomProgram>) => setProgramRaw((p) => {
    const next = { ...p, ...patch };
    try { localStorage.setItem("arch2525.program", JSON.stringify(next)); } catch {}
    logReplay("program.change", Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(" · "));
    return next;
  });
  const toggleCode = (id: string) => { toggleCodeRaw(id); logReplay("codes.select", id); };   // chosen standard + Replay

  // ── Supabase saved-files (Slice 3) — cloud backup of the whole workspace snapshot. ──────────────────────────
  // localStorage is the fast local rung; Supabase is the durable + cross-device rung (tile-cache.ts ladder). All
  // best-effort: no env / missing table / offline → silently local-only. RESTORE happens ONLY when this device is
  // empty (new device / cleared cache) so active local work is never clobbered; otherwise local pushes UP to cloud.
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>("idle");
  const skipSave = useRef(true);   // suppress saving during mount + restore; user mutations flip it on
  const snapshot = (): ArchitectSnapshot => ({
    houseSpec: Array.from(spec),
    layerHidden: Array.from(hidden),
    layerLocked: Array.from(locked),
    unclassified,
    bimManifest,
    assetOverrides,
    gate,
    globalParams,
    program,
    codes: Array.from(codes),
    replay,
    savedAt: (() => { try { return Date.now(); } catch { return 0; } })(),
  });
  useEffect(() => {
    let cancelled = false;
    if (!cloudEnabled()) { setCloudStatus("offline"); skipSave.current = false; return; }
    const localEmpty = (() => { try { return !localStorage.getItem("arch2525.houseSpec"); } catch { return true; } })();
    (async () => {
      const snap = await loadSnapshot();
      if (cancelled) return;
      if (snap && localEmpty) {
        // New device / cleared cache — hydrate localStorage THEN state (write-through order matches the load effects).
        const put = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
        put("arch2525.houseSpec", snap.houseSpec ?? []);
        put("arch2525.layerHidden", snap.layerHidden ?? []);
        put("arch2525.layerLocked", snap.layerLocked ?? []);
        put("arch2525.unclassified", snap.unclassified ?? []);
        put("arch2525.bimManifest", snap.bimManifest ?? null);
        put("arch2525.assetOverrides", snap.assetOverrides ?? {});
        put("arch2525.gate", Math.max(0, Math.min(13, snap.gate ?? 3)));
        if (snap.globalParams) put("arch2525.globalParams", snap.globalParams);
        if (snap.program) put("arch2525.program", snap.program);
        if (snap.codes) put("arch2525.codes", snap.codes);
        replaceSpec(snap.houseSpec ?? []);
        replaceHidden(snap.layerHidden ?? []);
        replaceLocked(snap.layerLocked ?? []);
        setUnclassified((snap.unclassified as ImportedObject[]) ?? []);
        setBimManifest((snap.bimManifest as BimManifest | null) ?? null);
        setAssetOverrides((snap.assetOverrides as Record<string, AssetOverrides>) ?? {});
        setGateRaw(Math.max(0, Math.min(13, snap.gate ?? 3)));
        if (snap.globalParams) setGlobalParamsRaw({ ...DEFAULT_PARAMS, ...(snap.globalParams as Partial<GlobalParams>) });
        if (snap.program) setProgramRaw({ ...DEFAULT_PROGRAM, ...(snap.program as Partial<RoomProgram>) });
        if (snap.codes) replaceCodes(snap.codes as string[]);
        setCloudStatus("saved");
      } else if (!localEmpty) {
        // Existing local work — back it up to the cloud so it's durable + reachable on the next device.
        setCloudStatus("saving");
        setCloudStatus(await saveSnapshot(snapshot()));
      }
      skipSave.current = false;
    })();
    return () => { cancelled = true; };
  }, []);   // eslint-disable-line react-hooks/exhaustive-deps
  // Debounced write-through of every meaningful workspace mutation to the cloud (best-effort).
  useEffect(() => {
    if (skipSave.current || !cloudEnabled()) return;
    const id = setTimeout(() => { setCloudStatus("saving"); saveSnapshot(snapshot()).then(setCloudStatus); }, 1200);
    return () => clearTimeout(id);
  }, [spec, hidden, locked, unclassified, bimManifest, assetOverrides, gate, globalParams, program, codes]);   // eslint-disable-line react-hooks/exhaustive-deps

  return {
    hidden, locked, toggleHidden, toggleLocked, isolate, revealAll, spec, toggleSpec, addSpecIds, setSpecIds, clearSpec,
    replay, logReplay, unclassified, bimManifest, applyBimImport, resolveUnclassified, assetOverrides, setAssetOverride,
    gate, setGate, globalParams, setGlobalParams, program, setProgram, codes, toggleCode, cloudStatus,
  };
}
