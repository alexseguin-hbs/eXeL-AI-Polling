"use client";

/**
 * ARCHITECT-2525 · shared Layer-Tree state — visibility + lock Sets lifted so BOTH the LEFT tree and the
 * RIGHT Context inspector act on the same selected item (Security-2525's asset⇄inspector model). Persisted
 * to localStorage (the `aoHidden` pattern, mission-planning.tsx:4611).
 */
import { useEffect, useState } from "react";
import { flattenLayers, type LayerNode } from "@/lib/architect-layers";

function usePersistentSet(key: string): [Set<string>, (id: string) => void, (ids?: string[]) => void] {
  const [set, setSet] = useState<Set<string>>(() => {
    try { return new Set<string>(JSON.parse(localStorage.getItem(key) || "[]")); } catch { return new Set<string>(); }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(Array.from(set))); } catch {} }, [key, set]);
  const toggle = (id: string) => setSet((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const replace = (ids: string[] = []) => setSet(new Set(ids));
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
  addSubtreeToSpec: (node: LayerNode) => void;   // add a whole system's leaves at once
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
  const addSubtreeToSpec = (node: LayerNode) => {
    const leaves = flattenLayers([node]).filter((n) => !n.children?.length && !n.level3).map((n) => n.id);
    replaceSpec(Array.from(new Set([...Array.from(spec), ...leaves])));
  };
  const clearSpec = () => replaceSpec([]);
  return { hidden, locked, toggleHidden, toggleLocked, isolate, revealAll, spec, toggleSpec, addSubtreeToSpec, clearSpec };
}
