"use client";

/**
 * ARCHITECT-2525 · LAYER TREE component — the LEFT rail of the Design workspace.
 * =================================================================================================
 * Renders `lib/architect-layers.ts` (the physical Digital Twin) as a Security-2525-style collapsible
 * tree: rotating ChevronRight disclosure, color-swatch scope headers, `·N` count badges, depth
 * indentation, and a search/filter box (the one enhancement Security's PlacementRail lacks — it
 * auto-expands ancestors of matches). Selection highlights the row; the engine + right Context panel
 * wire to it in later steps. Built generically so it can promote to 2525-core (MANIFEST candidate).
 */
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Eye, EyeOff, Lock, Unlock, Settings, MoreHorizontal, DoorOpen, Zap, Droplet, Fan, Sofa, Frame, Wifi, Trees, RectangleHorizontal } from "lucide-react";
import { LAYER_TREE, HOME_TYPES, isVisibleForType, isVisibleForRoom, roomSystems, type LayerNode, type HomeType } from "@/lib/architect-layers";
import { componentEstimate } from "@/lib/architect-house";
import { type LayerState } from "./use-layer-state";

const kUsd = (n: number) => (n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`);

const C = { border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", green: "#22c55e", gold: "#ffd400" };
const SCOPE_COLOR: Record<string, string> = { physical: C.violet, operational: C.cyan, lifecycle: C.green };
// Slice 3 — per-system icon + colour for the in-room tree; colours mirror the map's MEP palette (droplet-cyan
// plumbing, zap-gold electrical, fan-blue duct) so a tree system and its map run read as one source.
const SYSTEM_META: Record<string, { Icon: typeof Eye; color: string }> = {
  "physical/electrical": { Icon: Zap, color: "#ffd400" },
  "physical/plumbing": { Icon: Droplet, color: "#19c8cf" },
  "physical/mechanical": { Icon: Fan, color: "#38bdf8" },
  "physical/interior": { Icon: Sofa, color: "#c084fc" },
  "physical/building-envelope": { Icon: RectangleHorizontal, color: "#19c8cf" },
  "physical/structure": { Icon: Frame, color: "#5f7186" },
  "physical/communications-low-voltage": { Icon: Wifi, color: "#22c55e" },
  "physical/exterior": { Icon: Trees, color: "#22c55e" },
};

// `state` (visibility + lock Sets) is lifted to the shell so the RIGHT Context inspector shares it (R2).
// `homeType` limits which physical components are offered — a Tiny Home has fewer decisions (R3).
export function LayerTree({ selectedId, onSelect, state, homeType = "full", onHomeType, focusRoom = null }: {
  selectedId?: string | null; onSelect?: (id: string) => void; state: LayerState;
  homeType?: HomeType; onHomeType?: (t: HomeType) => void;
  focusRoom?: { k: string; label: string } | null;  // context-scope: when a room is entered, narrow the physical tree
}) {
  const { hidden, locked, toggleHidden, toggleLocked, isolate: isolateNode, revealAll } = state;
  const roomKey = focusRoom?.k ?? null;
  const tinyOK = (id: string, scopeId: string) => isVisibleForType(id, scopeId, homeType);
  const roomOK = (id: string, scopeId: string) => isVisibleForRoom(id, scopeId, roomKey);
  // A node shows only if it passes BOTH the market gate AND the room gate (room = null → whole-house, unchanged).
  const inScope = (id: string, scopeId: string) => tinyOK(id, scopeId) && roomOK(id, scopeId);
  const essentialIds = roomKey ? new Set(roomSystems(roomKey).essential) : null; // bold the room's essential systems
  // Scopes open by default; systems collapsed (matches Security's "start collapsed" density).
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set(["physical", "operational", "lifecycle"]));
  // On entering a room, auto-open its ESSENTIAL system(s) so plumbing/electrical are visible with zero clicks.
  useEffect(() => {
    if (!roomKey) return;
    setOpenIds((s) => { const n = new Set(s); n.add("physical"); roomSystems(roomKey).essential.forEach((id) => n.add(id)); return n; });
  }, [roomKey]);
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const [menuId, setMenuId] = useState<string | null>(null);
  const isolate = (node: LayerNode) => { isolateNode(node); setMenuId(null); };

  // Search: the set of node ids to keep visible, plus ancestors to force-open.
  const { visible, forceOpen } = useMemo(() => {
    if (!query) return { visible: null as Set<string> | null, forceOpen: null as Set<string> | null };
    const vis = new Set<string>(), open = new Set<string>();
    const walk = (n: LayerNode, ancestors: string[]): boolean => {
      const selfMatch = n.label.toLowerCase().includes(query);
      let childMatch = false;
      n.children?.forEach((c) => { if (walk(c, [...ancestors, n.id])) childMatch = true; });
      if (selfMatch || childMatch) {
        vis.add(n.id);
        ancestors.forEach((a) => { vis.add(a); open.add(a); });
        if (childMatch) open.add(n.id);
      }
      return selfMatch || childMatch;
    };
    LAYER_TREE.forEach((s) => s.children.forEach((n) => walk(n, [s.id])));
    return { visible: vis, forceOpen: open };
  }, [query]);

  // While searching, ancestors of matches are force-open; a manually-toggled branch also stays openable.
  const isOpen = (id: string) => (forceOpen ? (forceOpen.has(id) || openIds.has(id)) : openIds.has(id));
  const visCount = (list: LayerNode[]) => (visible ? list.filter((c) => visible.has(c.id)).length : list.length);
  const toggle = (id: string) => setOpenIds((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const stop = (e: { stopPropagation: () => void }) => e.stopPropagation();
  const IconBtn = ({ hook, title, on, active, activeColor, Icon, IconOff }: {
    hook: string; title: string; on: () => void; active: boolean; activeColor: string;
    Icon: typeof Eye; IconOff?: typeof Eye;
  }) => {
    const Show = active && IconOff ? IconOff : Icon;
    return (
      <button data-layer-ctl={hook} title={title} onClick={(e) => { stop(e); on(); }}
        className="shrink-0 rounded p-0.5 hover:bg-white/10" style={{ opacity: active ? 1 : 0.45 }}>
        <Show className="h-3 w-3" style={{ color: active ? activeColor : C.dim }} />
      </button>
    );
  };

  const renderNode = (node: LayerNode, depth: number, scopeId: string) => {
    if (visible && !visible.has(node.id)) return null;
    if (!inScope(node.id, scopeId)) return null;   // hidden by market OR by the entered room's scope
    const kids = (node.children ?? []).filter((c) => inScope(c.id, scopeId));
    const hasKids = kids.length > 0;
    const open = isOpen(node.id);
    const selected = selectedId === node.id;
    const isHidden = hidden.has(node.id);
    const isLocked = locked.has(node.id);
    return (
      <div key={node.id}>
        <div data-layer-node={node.id} data-layer-hidden={isHidden || undefined} data-layer-locked={isLocked || undefined}
          draggable onDragStart={(e) => { e.dataTransfer.setData("text/plain", node.id); e.dataTransfer.effectAllowed = "copy"; }}
          onClick={() => { if (hasKids) toggle(node.id); onSelect?.(node.id); }}
          className="group flex cursor-pointer items-center gap-1 rounded px-1 py-1 text-[10px] select-none hover:bg-white/5"
          style={{ marginLeft: depth * 12, background: selected ? "#221833" : "transparent", color: node.level3 ? C.cyan : C.text, opacity: isHidden ? 0.4 : 1 }}>
          {hasKids
            ? <ChevronRight className="h-3 w-3 shrink-0 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none", color: C.dim }} />
            : <span className="inline-block h-3 w-3 shrink-0" />}
          {/* Slice 3 — in a room, a system row gets its MEP-coloured icon; essential systems (e.g. Plumbing) show gold-bold. */}
          {(() => { const meta = focusRoom && depth === 1 && scopeId === "physical" ? SYSTEM_META[node.id] : undefined;
            return meta ? <meta.Icon className="h-3 w-3 shrink-0" style={{ color: meta.color }} /> : null; })()}
          <span className="min-w-0 flex-1 truncate" style={essentialIds?.has(node.id) ? { fontWeight: 700, color: C.gold } : undefined}>{node.label}</span>
          {state.spec.has(node.id) && <span data-layer-inhouse title="On the house" className="shrink-0 h-1.5 w-1.5 rounded-full" style={{ background: C.green }} />}
          {hasKids && <span className="shrink-0 text-[8px] group-hover:hidden" style={{ color: C.dim }}>·{visCount(kids)}</span>}
          {/* Per-item STARTING COST · install time — every buildable leaf carries an estimate (operator ask). */}
          {!hasKids && !node.level3 && (() => { const e = componentEstimate(node.id); return e ? (
            <span data-layer-est className="shrink-0 text-[8px] tabular-nums group-hover:hidden" style={{ color: C.dim }} title={`Starting cost ${kUsd(e.cost)} · install ~${e.days} days`}>{kUsd(e.cost)}·{e.days}d</span>
          ) : null; })()}
          {/* per-item controls (👁 🔒 ⚙ •••) — Security iconography; reveal on hover/selected to keep rows clean */}
          <span className={`shrink-0 items-center gap-0 ${selected || isHidden || isLocked ? "flex" : "hidden group-hover:flex"}`}>
            <IconBtn hook="visibility" title={isHidden ? "Show layer" : "Hide layer"} on={() => toggleHidden(node.id)} active={isHidden} activeColor={C.dim} Icon={Eye} IconOff={EyeOff} />
            <IconBtn hook="lock" title={isLocked ? "Unlock layer" : "Lock layer"} on={() => toggleLocked(node.id)} active={isLocked} activeColor={C.gold} Icon={Unlock} IconOff={Lock} />
            <IconBtn hook="settings" title="Layer settings (open Context)" on={() => onSelect?.(node.id)} active={selected} activeColor={C.cyan} Icon={Settings} />
            <button data-layer-ctl="menu" title="More" onClick={(e) => { stop(e); setMenuId((m) => (m === node.id ? null : node.id)); }}
              className="shrink-0 rounded p-0.5 hover:bg-white/10" style={{ opacity: menuId === node.id ? 1 : 0.45 }}>
              <MoreHorizontal className="h-3 w-3" style={{ color: menuId === node.id ? C.cyan : C.dim }} />
            </button>
          </span>
        </div>
        {menuId === node.id && (
          <div data-layer-menu={node.id} className="ml-6 mb-1 flex flex-col rounded border text-[9px]" style={{ borderColor: C.border, background: "#0c1420" }}>
            <button className="px-2 py-1 text-left hover:bg-white/5" style={{ color: C.text }} onClick={(e) => { stop(e); isolate(node); }}>Isolate — hide all other layers</button>
            <button className="px-2 py-1 text-left hover:bg-white/5" style={{ color: C.text }} onClick={(e) => { stop(e); revealAll(); setMenuId(null); }}>Reveal all</button>
          </div>
        )}
        {open && kids.map((c) => renderNode(c, depth + 1, scopeId))}
      </div>
    );
  };

  return (
    <div data-arch-layer-tree className="flex flex-col gap-1">
      {/* Context-scope banner — shown only when a room is entered; the Target-Market box stays below (operator choice). */}
      {focusRoom && (
        <div data-arch-tree-focus className="mb-1 flex items-center gap-1.5 rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.gold, background: "#0c1420" }}>
          <DoorOpen className="h-3 w-3 shrink-0" style={{ color: C.gold }} />
          <span className="font-bold" style={{ color: C.gold }}>{focusRoom.k} · {focusRoom.label}</span>
          <span className="min-w-0 flex-1 truncate" style={{ color: C.dim }}>— its systems · ← Back to house for all</span>
        </div>
      )}
      {/* TARGET MARKET — Tiny Home & Home are the two markets. Tiny Home limits systems + decisions (R3/R8). */}
      <div data-layer-hometype className="mb-1 rounded border p-1" style={{ borderColor: C.border }}>
        <div className="mb-1 px-1 text-[8px] font-semibold uppercase tracking-wider" style={{ color: C.dim }}>Target market</div>
        <div className="grid grid-cols-2 gap-1">
          {HOME_TYPES.map((h) => (
            <button key={h.id} data-hometype={h.id} data-hometype-locked={h.locked ? "1" : undefined}
              title={h.locked ? `${h.label} — coming soon` : h.note} disabled={h.locked}
              onClick={() => { if (!h.locked) onHomeType?.(h.id); }}
              className="flex items-center justify-center gap-1 rounded px-2 py-1 text-[9px] font-semibold uppercase tracking-wide"
              style={{ background: homeType === h.id ? "#221833" : "transparent", color: h.locked ? "#3a4658" : homeType === h.id ? C.violet : C.dim, cursor: h.locked ? "not-allowed" : "pointer" }}>
              {h.locked && <Lock className="h-2.5 w-2.5" />}{h.label}
            </button>
          ))}
        </div>
        <div className="mt-1 px-1 text-[8px] leading-tight" style={{ color: C.dim }}>{HOME_TYPES.find((h) => h.id === homeType)?.note}</div>
      </div>
      <input data-layer-search value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search layers…"
        className="mb-1 w-full rounded border bg-transparent px-2 py-1 text-[10px]"
        style={{ borderColor: C.border, color: C.text }} />
      {LAYER_TREE.map((scope) => {
        const open = isOpen(scope.id);
        const scopeKids = scope.children.filter((n) => inScope(n.id, scope.id));
        return (
          <div key={scope.id} data-layer-scope={scope.id}>
            <button onClick={() => toggle(scope.id)} data-layer-node={scope.id}
              className="flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-[10px] font-semibold uppercase tracking-wide hover:bg-white/5"
              style={{ color: SCOPE_COLOR[scope.id] }}>
              <ChevronRight className="h-3 w-3 shrink-0 transition-transform" style={{ transform: open ? "rotate(90deg)" : "none" }} />
              <span className="inline-block h-2 w-2 shrink-0 rounded-sm" style={{ background: SCOPE_COLOR[scope.id] }} />
              <span className="min-w-0 flex-1 truncate">{scope.label}</span>
              <span className="shrink-0 text-[8px]" style={{ color: C.dim }}>·{visCount(scopeKids)}</span>
            </button>
            {open && scopeKids.map((n) => renderNode(n, 1, scope.id))}
          </div>
        );
      })}
    </div>
  );
}
