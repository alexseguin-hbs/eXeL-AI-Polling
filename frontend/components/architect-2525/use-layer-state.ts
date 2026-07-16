"use client";

/**
 * ARCHITECT-2525 · shared Layer-Tree state — visibility + lock Sets lifted so BOTH the LEFT tree and the
 * RIGHT Context inspector act on the same selected item (Security-2525's asset⇄inspector model). Persisted
 * to localStorage (the `aoHidden` pattern, mission-planning.tsx:4611).
 */
import { useEffect, useState } from "react";
import { flattenLayers, type LayerNode } from "@/lib/architect-layers";

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
  clearSpec: () => void;
}

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
  const clearSpec = () => replaceSpec([]);
  return { hidden, locked, toggleHidden, toggleLocked, isolate, revealAll, spec, toggleSpec, addSpecIds, clearSpec };
}
