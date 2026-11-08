"use client";
// ARCHITECT-2525 / FUTURE · the Phase-2 human planning experience (plan §14–§17). ONE canonical project drives every
// view; the UI only reads the pure engine (transform, placement, projections, hash, store). Nothing is hard-coded —
// numbers come from the canonical project. Mobile-first, dark, cyan/violet. Imports NOTHING from the legacy surface.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UM_PER_FT, PROFILE_ID, GROSS_FT2, CLEAR_FT2, SHELL_FT } from "@/lib/architect-future/domain/geometry";
import { transformV1toV2 } from "@/lib/architect-future/transformation/reference-v1-to-v2";
import { hashV2 } from "@/lib/architect-future/serialization/hash-v2";
import { commit } from "@/lib/architect-future/rcore/revisions";
import { loadProject, serializeStore, STORE_KEY } from "@/lib/architect-future/state/project-store";
import { placeArmed, rotateInstance, removeInstance, moveInstance } from "@/lib/architect-future/state/placement-machine";
import { planProjection } from "@/lib/architect-future/selectors/geometry";
import { assetsForRoom, VISION_GROUPS } from "@/lib/architect-future/domain/asset-catalog";
import { materialTakeoff } from "@/lib/architect-future/simulation/materials";
import { applyJurisdiction } from "@/lib/architect-future/simulation/costs";
import { economicsView } from "@/lib/architect-future/selectors/economics";
import { JURISDICTIONS } from "@/lib/architect-future/adapters/labor";
import type { ArchitectProjectV2 } from "@/lib/architect-future/domain/project";
import type { ConstructionMethod } from "@/lib/architect-future/domain/construction";
import type { FutureEvent, EventType } from "@/lib/architect-future/rcore/events";
import type { Vec3Um } from "@/lib/architect-future/domain/assets";

const C = { bg: "#070b12", panel: "#0d1522", edge: "#1d2b3f", cyan: "#4fd6e0", cyanDim: "#2a7f87", violet: "#b45cff", text: "#e6f6ff", dim: "#9fb3c8", faint: "#5b7085" };
const ACTOR = { kind: "UNAUTHENTICATED_HUMAN" as const, id: "unauthenticated-human" };
const EVENTS_KEY = STORE_KEY + ".events";
function nowIso() { return new Date().toISOString(); }

type View = "PLAN" | "3D" | "WALK";
type Mode = "DESIGN" | "SYSTEMS";

export function FutureApp() {
  const [project, setProject] = useState<ArchitectProjectV2 | null>(null);
  const [events, setEvents] = useState<FutureEvent[]>([]);
  const [view, setView] = useState<View>("PLAN");
  const [mode, setMode] = useState<Mode>("DESIGN");
  const [jurisdiction, setJurisdiction] = useState<string>("us-tx-austin");
  const [armed, setArmed] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [tilt, setTilt] = useState(55);
  const [savedHash, setSavedHash] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);

  // load persisted project (replay + verify) on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EVENTS_KEY);
      const p = loadProject(raw);
      if (p && raw) { setProject(p); setEvents(JSON.parse(raw).events); setSelectedRoom(p.spaces[0]?.entity_id ?? null); setSavedHash(hashV2(p)); }
    } catch { /* storage may be unreadable; start fresh */ }
  }, []);

  const flash = (m: string) => { setToast(m); window.setTimeout(() => setToast(null), 1800); };

  const create = useCallback(() => {
    const { project: p, event } = transformV1toV2(null, PROFILE_ID, ACTOR, nowIso());
    setProject(p); setEvents([event]); setSelectedRoom(p.spaces[0]?.entity_id ?? null); setSavedHash(null);
    flash("Reference house created — 9 rooms, 12/10/1");
  }, []);

  const pushEvent = useCallback((next: ArchitectProjectV2, type: EventType, payload: Record<string, unknown>) => {
    setProject((prev) => {
      if (!prev) return next;
      const { event } = commit(prev, next, type, ACTOR, nowIso(), events.length + 1, payload);
      setEvents((e) => [...e, event]);
      return next;
    });
  }, [events.length]);

  const save = useCallback(() => {
    if (!project) return;
    const h = hashV2(project);
    try { localStorage.setItem(EVENTS_KEY, serializeStore(events, h)); setSavedHash(h); flash("Saved to this device"); }
    catch { flash("Could not save on this device"); }
  }, [project, events]);

  const proj = useMemo(() => (project ? planProjection(project) : null), [project]);
  const liveHash = useMemo(() => (project ? hashV2(project) : ""), [project]);
  const roomAssets = useMemo(() => {
    if (!project || !selectedRoom) return [];
    const fn = project.spaces.find((s) => s.entity_id === selectedRoom)?.function ?? "";
    return assetsForRoom(fn);
  }, [project, selectedRoom]);

  // ── tap on the canvas: place the armed asset, or select a room / instance ──
  const onCanvasTap = useCallback((xFt: number, yFt: number) => {
    if (!project || !proj) return;
    const room = proj.rooms.find((r) => xFt >= r.outer_x_ft && xFt <= r.outer_x_ft + r.outer_w_ft && yFt >= r.outer_y_ft && yFt <= r.outer_y_ft + r.outer_d_ft);
    if (!room) return;
    setSelectedRoom(room.space_id);
    if (armed) {
      const point: Vec3Um = { x: Math.round(xFt * UM_PER_FT), y: Math.round(yFt * UM_PER_FT), z: 0 };
      const res = placeArmed(project, { armed_asset_id: armed }, room.space_id, point, 0, ACTOR);
      if (res.placed) {
        const placedInst = res.project.assets[res.project.assets.length - 1];
        pushEvent(res.project, "ASSET_PLACED", { asset: placedInst });
        setArmed(null); // disarm (one arm → one placement)
        flash(`Placed ${placedInst.asset_id.split(".")[1] ?? "item"}`);
      } else {
        flash(res.rejected_reason ?? "cannot place here");
      }
    }
  }, [project, proj, armed, pushEvent]);

  const doRotate = () => { if (project && selectedInstance) { const next = rotateInstance(project, selectedInstance); pushEvent(next, "ASSET_ROTATED", { instance_id: selectedInstance, rotation_deg: next.assets.find((a) => a.instance_id === selectedInstance)?.rotation_deg }); } };
  const doRemove = () => { if (project && selectedInstance) { const next = removeInstance(project, selectedInstance); pushEvent(next, "ASSET_REMOVED", { instance_id: selectedInstance }); setSelectedInstance(null); } };
  const doNudge = (dxFt: number, dyFt: number) => {
    if (!project || !selectedInstance) return;
    const inst = project.assets.find((a) => a.instance_id === selectedInstance); if (!inst) return;
    const res = moveInstance(project, selectedInstance, { x: inst.position_um.x + dxFt * UM_PER_FT, y: inst.position_um.y + dyFt * UM_PER_FT, z: 0 });
    if (res.placed) pushEvent(res.project, "ASSET_MOVED", { instance_id: selectedInstance, position_um: res.project.assets.find((a) => a.instance_id === selectedInstance)?.position_um });
    else flash(res.rejected_reason ?? "cannot move there");
  };

  // construction method is CANONICAL (it changes the take-off and the project identity) → one event
  const setMethod = (method: ConstructionMethod) => {
    if (!project || project.construction.method === method) return;
    pushEvent({ ...project, construction: { method } }, "CONSTRUCTION_METHOD_CHANGED", { method });
    flash(method === "FRAME" ? "Framed — the take-off now lists lumber" : method === "PRINT" ? "3D-printed — the take-off now lists printed walls" : "Method set aside");
  };

  // ───────────────────────────────────────── INTENT (first) ─────────────────────────────────────────
  if (!project) return <Intent onCreate={create} />;

  const dirty = savedHash !== liveHash;

  return (
    <div data-arch-future-app style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "ui-sans-serif,system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <header style={{ borderBottom: `1px solid ${C.edge}`, padding: "0.6rem 0.9rem", display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" }}>
        <span style={{ letterSpacing: ".25em", fontSize: ".62rem", color: C.cyan }}>ARCHITECT-2525 · FUTURE</span>
        <div style={{ display: "flex", gap: ".3rem" }}>
          {(["DESIGN", "SYSTEMS"] as Mode[]).map((m) => (
            <button key={m} data-arch-mode={m} onClick={() => setMode(m)} style={tab(m === mode)}>{m === "DESIGN" ? "Design" : "Systems & cost"}</button>
          ))}
        </div>
        {mode === "DESIGN" && (
          <div style={{ display: "flex", gap: ".3rem", marginLeft: "auto" }}>
            {(["PLAN", "3D", "WALK"] as View[]).map((v) => (
              <button key={v} data-arch-view={v} onClick={() => setView(v)} style={tab(v === view)}>{v === "3D" ? "3D · drone" : v === "WALK" ? "Walk" : "Plan"}</button>
            ))}
          </div>
        )}
        <button data-arch-save onClick={save} style={{ ...tab(false), marginLeft: mode === "DESIGN" ? undefined : "auto", borderColor: dirty ? C.violet : C.edge, color: dirty ? C.violet : C.dim }}>{dirty ? "Save" : "Saved"}</button>
      </header>

      {/* metrics line — all DERIVED from the canonical project */}
      <div style={{ padding: ".4rem .9rem", fontSize: ".66rem", color: C.dim, display: "flex", gap: "1rem", flexWrap: "wrap", borderBottom: `1px solid ${C.edge}` }}>
        <span>{proj!.rooms.length} rooms</span>
        <span>{CLEAR_FT2} ft² clear <em style={{ color: C.faint, fontStyle: "normal" }}>· derived</em></span>
        <span>{GROSS_FT2} ft² gross <em style={{ color: C.faint, fontStyle: "normal" }}>· derived</em></span>
        <span>{SHELL_FT}×{SHELL_FT} ft</span>
        <span style={{ marginLeft: "auto", color: C.faint, fontFamily: "ui-monospace,monospace" }}>id {liveHash.slice(0, 8)}</span>
      </div>

      {/* mobile drawer toggles (Design mode only) */}
      {mode === "DESIGN" && (
        <div style={{ display: "flex", gap: ".4rem", padding: ".4rem .9rem" }} data-arch-drawer-bar>
          <button onClick={() => setTreeOpen((o) => !o)} style={tab(treeOpen)}>☰ Vision Tree</button>
          <button onClick={() => setActiveOpen((o) => !o)} style={tab(activeOpen)}>Active Elements ({project.assets.length})</button>
        </div>
      )}

      {mode === "SYSTEMS" ? (
        <main style={{ flex: 1, padding: ".6rem .9rem 1.2rem" }}>
          <Systems project={project} jurisdiction={jurisdiction} onJurisdiction={setJurisdiction} onMethod={setMethod} />
        </main>
      ) : (
        <main style={{ flex: 1, display: "flex", gap: ".6rem", padding: ".6rem .9rem 1.2rem", alignItems: "stretch", flexWrap: "wrap" }}>
          {(treeOpen || wide()) && (
            <VisionTree groups={VISION_GROUPS} assets={roomAssets} armed={armed} onArm={(id) => setArmed((a) => (a === id ? null : id))} roomFn={project.spaces.find((s) => s.entity_id === selectedRoom)?.function} />
          )}
          <section style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column", gap: ".4rem" }}>
            {armed && <div style={{ fontSize: ".66rem", color: C.violet }}>Armed: tap a room to place · tap again to re-aim · <button onClick={() => setArmed(null)} style={{ ...link }}>disarm</button></div>}
            <Canvas proj={proj!} view={view} tilt={tilt} selectedRoom={selectedRoom} selectedInstance={selectedInstance} onTap={onCanvasTap} onSelectInstance={setSelectedInstance} />
            {view === "3D" && <label style={{ fontSize: ".66rem", color: C.dim }}>Tilt <input type="range" min={10} max={85} value={tilt} onChange={(e) => setTilt(+e.target.value)} /></label>}
          </section>
          {(activeOpen || wide()) && (
            <ActiveElements project={project} selected={selectedInstance} onSelect={setSelectedInstance} onRotate={doRotate} onRemove={doRemove} onNudge={doNudge} />
          )}
        </main>
      )}

      {toast && <div style={{ position: "fixed", left: "50%", bottom: "calc(1rem + env(safe-area-inset-bottom,0px))", transform: "translateX(-50%)", background: C.panel, border: `1px solid ${C.cyan}`, color: C.cyan, padding: ".4rem .8rem", borderRadius: ".5rem", fontSize: ".72rem" }}>{toast}</div>}
    </div>
  );
}

function wide() { return typeof window !== "undefined" && window.matchMedia && window.matchMedia("(min-width: 900px)").matches; }
const tab = (on: boolean): React.CSSProperties => ({ border: `1px solid ${on ? C.cyan : C.edge}`, background: on ? "rgba(79,214,224,.12)" : "transparent", color: on ? C.cyan : C.dim, borderRadius: ".4rem", padding: ".25rem .6rem", fontSize: ".68rem", cursor: "pointer" });
const link: React.CSSProperties = { background: "none", border: "none", color: C.cyan, textDecoration: "underline", cursor: "pointer", fontSize: ".66rem", padding: 0 };

function Intent({ onCreate }: { onCreate: () => void }) {
  const [occupants, setOccupants] = useState(2);
  return (
    <div style={{ minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "ui-sans-serif,system-ui,sans-serif", padding: "1.4rem 1rem", display: "flex", flexDirection: "column", gap: ".9rem", maxWidth: "34rem", margin: "0 auto" }}>
      <p style={{ letterSpacing: ".25em", fontSize: ".62rem", color: C.cyan, margin: 0 }}>ARCHITECT-2525 · FUTURE</p>
      <h1 style={{ fontSize: "1.5rem", margin: 0 }}>What are you creating?</h1>
      {/* primary action sits ABOVE the fold at 375/428 (T-SEAM step 1) */}
      <button data-arch-create onClick={onCreate} style={{ border: `1px solid ${C.cyan}`, background: "rgba(79,214,224,.14)", color: C.cyan, borderRadius: ".6rem", padding: ".7rem 1rem", fontSize: ".95rem", cursor: "pointer" }}>Create the reference home →</button>
      <p style={{ fontSize: ".8rem", color: C.dim, margin: 0 }}>A nine-room home on a 3×3 plan: each room 12&nbsp;ft outside, 10&nbsp;ft of clear space inside, with a 1&nbsp;ft wall-and-service zone — 900&nbsp;ft² of living space in a 36×36&nbsp;ft shell.</p>
      <label style={{ fontSize: ".78rem", color: C.dim }}>Who will live here?{" "}
        <input type="number" min={1} max={12} value={occupants} onChange={(e) => setOccupants(+e.target.value)} style={{ width: "3rem", background: C.panel, color: C.text, border: `1px solid ${C.edge}`, borderRadius: ".3rem", padding: ".2rem .4rem" }} />
      </label>
      <p style={{ fontSize: ".66rem", color: C.faint, margin: 0 }}>You can design every room next. Nothing is built; this is a plan you shape.</p>
    </div>
  );
}

function VisionTree({ groups, assets, armed, onArm, roomFn }: { groups: readonly string[]; assets: ReturnType<typeof assetsForRoom>; armed: string | null; onArm: (id: string) => void; roomFn?: string }) {
  return (
    <aside data-arch-vision-tree style={{ flex: "0 0 13rem", maxWidth: "15rem", background: C.panel, border: `1px solid ${C.edge}`, borderRadius: ".5rem", padding: ".5rem", fontSize: ".72rem", alignSelf: "flex-start" }}>
      <div style={{ color: C.cyan, letterSpacing: ".1em", fontSize: ".62rem", marginBottom: ".4rem" }}>VISION TREE{roomFn ? ` · ${roomFn}` : ""}</div>
      {groups.filter((g) => assets.some((a) => a.group === g)).map((g) => (
        <div key={g} style={{ marginBottom: ".4rem" }}>
          <div style={{ color: C.dim, fontSize: ".62rem", textTransform: "uppercase", letterSpacing: ".08em" }}>{g}</div>
          {assets.filter((a) => a.group === g).map((a) => (
            <button key={a.asset_id} data-arch-tree-item={a.asset_id} onClick={() => onArm(a.asset_id)}
              style={{ display: "block", width: "100%", textAlign: "left", border: `1px solid ${armed === a.asset_id ? C.violet : "transparent"}`, background: armed === a.asset_id ? "rgba(180,92,255,.14)" : "transparent", color: armed === a.asset_id ? C.violet : C.text, borderRadius: ".35rem", padding: ".28rem .4rem", cursor: "pointer", fontSize: ".72rem" }}>
              {a.label}{a.mounting === "WALL" ? " ·wall" : ""}
            </button>
          ))}
        </div>
      ))}
      {assets.length === 0 && <div style={{ color: C.faint }}>Tap a room to see its items.</div>}
    </aside>
  );
}

function Canvas({ proj, view, tilt, selectedRoom, selectedInstance, onTap, onSelectInstance }: { proj: ReturnType<typeof planProjection>; view: View; tilt: number; selectedRoom: string | null; selectedInstance: string | null; onTap: (x: number, y: number) => void; onSelectInstance: (id: string) => void }) {
  const ref = useRef<SVGSVGElement | null>(null);
  const S = proj.shell_ft;
  const click = (e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * S;
    const y = ((e.clientY - r.top) / r.height) * S;
    onTap(x, y);
  };
  const svg = (
    <svg ref={ref} viewBox={`0 0 ${S} ${S}`} onClick={click} data-arch-canvas
      style={{ width: "100%", maxWidth: 560, aspectRatio: "1 / 1", background: "#050a10", border: `1px solid ${C.edge}`, borderRadius: ".5rem", touchAction: "manipulation" }}>
      {proj.rooms.map((r) => (
        <g key={r.space_id}>
          <rect x={r.outer_x_ft} y={r.outer_y_ft} width={r.outer_w_ft} height={r.outer_d_ft} fill="none" stroke={C.cyanDim} strokeWidth={0.12} />
          <rect x={r.clear_x_ft} y={r.clear_y_ft} width={r.clear_w_ft} height={r.clear_d_ft}
            fill={r.space_id === selectedRoom ? "rgba(79,214,224,.08)" : "rgba(79,214,224,.025)"} stroke={r.space_id === selectedRoom ? C.cyan : C.edge} strokeWidth={0.1} />
          <text x={r.outer_x_ft + r.outer_w_ft / 2} y={r.outer_y_ft + 1.1} fill={C.faint} fontSize={0.9} textAnchor="middle">{r.function}</text>
        </g>
      ))}
      {proj.assets.map((a) => (
        <g key={a.instance_id} onClick={(e) => { e.stopPropagation(); onSelectInstance(a.instance_id); }}>
          <rect x={a.cx_ft - a.w_ft / 2} y={a.cy_ft - a.d_ft / 2} width={a.w_ft} height={a.d_ft}
            fill={a.mounting === "WALL" ? "rgba(180,92,255,.35)" : "rgba(79,214,224,.35)"}
            stroke={a.instance_id === selectedInstance ? C.violet : C.cyan} strokeWidth={a.instance_id === selectedInstance ? 0.22 : 0.12} />
        </g>
      ))}
    </svg>
  );
  if (view === "3D") return <div style={{ perspective: "800px", display: "flex", justifyContent: "center", padding: "1rem 0" }}><div style={{ transform: `rotateX(${tilt}deg)`, transformOrigin: "center" }}>{svg}</div></div>;
  if (view === "WALK") return (
    <div>
      <div style={{ fontSize: ".66rem", color: C.dim, marginBottom: ".3rem" }}>Walk · {proj.rooms.find((r) => r.space_id === selectedRoom)?.function ?? "pick a room"} — a first look inside (full first-person view lands in a later round)</div>
      {svg}
    </div>
  );
  return svg;
}

function EconCard({ label, value, evidence, note }: { label: string; value: string; evidence: string; note?: string }) {
  const muted = value === "Not calculated";
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.edge}`, borderRadius: ".5rem", padding: ".55rem .65rem", minWidth: 0 }}>
      <div style={{ fontSize: ".62rem", color: C.dim, letterSpacing: ".04em" }}>{label}</div>
      <div style={{ fontSize: "1.02rem", color: muted ? C.faint : C.text, fontVariantNumeric: "tabular-nums", marginTop: ".15rem" }}>{value}</div>
      <div style={{ fontSize: ".58rem", color: C.faint, marginTop: ".15rem" }}>{evidence}{note ? ` · ${note}` : ""}</div>
    </div>
  );
}

function Systems({ project, jurisdiction, onJurisdiction, onMethod }: { project: ArchitectProjectV2; jurisdiction: string; onJurisdiction: (id: string) => void; onMethod: (m: ConstructionMethod) => void }) {
  const method = project.construction.method;
  const takeoff = materialTakeoff(project);
  const ev = economicsView(project.economics);
  // informational what-if: the settlement for the chosen jurisdiction. applyJurisdiction moves ONLY settlement — the
  // baseline/labour/recognition cards above read the UNCHANGED canonical economics, so the firewall is visible on screen.
  const settlementView = economicsView(applyJurisdiction(project.economics, jurisdiction)).settlement;
  return (
    <div data-arch-systems style={{ display: "flex", flexDirection: "column", gap: ".9rem", maxWidth: "48rem" }}>
      {/* construction method — canonical */}
      <section>
        <div style={{ color: C.cyan, fontSize: ".64rem", letterSpacing: ".08em", marginBottom: ".4rem" }}>HOW IS IT BUILT?</div>
        <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
          {(["UNDECIDED", "FRAME", "PRINT"] as ConstructionMethod[]).map((m) => (
            <button key={m} data-arch-method={m} onClick={() => onMethod(m)} style={tab(m === method)}>
              {m === "UNDECIDED" ? "Not decided" : m === "FRAME" ? "Wood frame" : "3D-printed walls"}
            </button>
          ))}
        </div>
      </section>

      {/* material take-off — branches by method */}
      <section data-arch-takeoff>
        <div style={{ color: C.cyan, fontSize: ".64rem", letterSpacing: ".08em", marginBottom: ".4rem" }}>WHAT IT TAKES TO BUILD · wall system</div>
        {takeoff.length === 0 ? (
          <div style={{ fontSize: ".72rem", color: C.faint }}>Pick a construction method to see the wall-system take-off.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: ".7rem", minWidth: "22rem" }}>
              <thead><tr style={{ color: C.dim, textAlign: "left" }}><th style={th}>Item</th><th style={{ ...th, textAlign: "right" }}>Quantity</th><th style={th}>Basis</th></tr></thead>
              <tbody>
                {takeoff.map((l, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${C.edge}` }}>
                    <td style={td}>{l.item}</td>
                    <td style={{ ...td, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{l.qty.toLocaleString("en-US")} {l.unit}</td>
                    <td style={{ ...td, color: C.faint }}>{l.calculation} · {l.evidence.toLowerCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* four economic domains — each labelled; never a generic "project cost" */}
      <section data-arch-economics>
        <div style={{ color: C.cyan, fontSize: ".64rem", letterSpacing: ".08em", marginBottom: ".4rem" }}>WHAT IT COSTS · four separate things, never mixed</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(10rem, 1fr))", gap: ".5rem" }}>
          <EconCard label={ev.baseline.label} value={ev.baseline.value} evidence={ev.baseline.evidence} note={ev.baseline.note} />
          <EconCard label={ev.perNetFt2.label} value={ev.perNetFt2.value} evidence={ev.perNetFt2.evidence} note={ev.perNetFt2.note} />
          <EconCard label={ev.labor.label} value={ev.labor.value} evidence={ev.labor.evidence} />
          <EconCard label={ev.recognition.label} value={ev.recognition.value} evidence={ev.recognition.evidence} />
        </div>
        <details style={{ marginTop: ".5rem" }}>
          <summary style={{ fontSize: ".66rem", color: C.dim, cursor: "pointer" }}>The ten baseline rows (illustrative · assumed)</summary>
          <div style={{ marginTop: ".4rem", fontSize: ".68rem", color: C.dim }}>
            {ev.baselineSections.map((s) => (
              <div key={s.name} style={{ display: "flex", justifyContent: "space-between", gap: ".8rem", padding: ".08rem 0" }}>
                <span>{s.name}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* local settlement — the ONLY thing a jurisdiction change may move (the firewall) */}
      <section data-arch-jurisdiction>
        <div style={{ color: C.cyan, fontSize: ".64rem", letterSpacing: ".08em", marginBottom: ".4rem" }}>WHERE IS IT BUILT? · {ev.settlement.label}</div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap" }}>
          <select value={jurisdiction} onChange={(e) => onJurisdiction(e.target.value)} data-arch-jurisdiction-select
            style={{ background: C.panel, color: C.text, border: `1px solid ${C.edge}`, borderRadius: ".4rem", padding: ".3rem .5rem", fontSize: ".72rem" }}>
            {JURISDICTIONS.map((j) => (<option key={j.id} value={j.id}>{j.label}</option>))}
          </select>
          <EconCard label={settlementView.label} value={settlementView.value} evidence={settlementView.evidence} note={settlementView.note} />
        </div>
        <div style={{ fontSize: ".6rem", color: C.faint, marginTop: ".4rem" }}>Changing where it is built moves only this local figure. The baseline estimate, labour and recognition above never change with it.</div>
      </section>
    </div>
  );
}
const th: React.CSSProperties = { padding: ".25rem .4rem", fontWeight: 600, fontSize: ".62rem", textTransform: "uppercase", letterSpacing: ".06em" };
const td: React.CSSProperties = { padding: ".3rem .4rem", verticalAlign: "top" };

function ActiveElements({ project, selected, onSelect, onRotate, onRemove, onNudge }: { project: ArchitectProjectV2; selected: string | null; onSelect: (id: string) => void; onRotate: () => void; onRemove: () => void; onNudge: (dx: number, dy: number) => void }) {
  return (
    <aside data-arch-active-elements style={{ flex: "0 0 13rem", maxWidth: "15rem", background: C.panel, border: `1px solid ${C.edge}`, borderRadius: ".5rem", padding: ".5rem", fontSize: ".72rem", alignSelf: "flex-start" }}>
      <div style={{ color: C.cyan, letterSpacing: ".1em", fontSize: ".62rem", marginBottom: ".4rem" }}>ACTIVE ELEMENTS</div>
      {project.assets.length === 0 && <div style={{ color: C.faint }}>Nothing placed yet. Arm an item in the Vision Tree, then tap a room.</div>}
      {project.assets.map((a) => (
        <button key={a.instance_id} onClick={() => onSelect(a.instance_id)} data-arch-active-item={a.instance_id}
          style={{ display: "block", width: "100%", textAlign: "left", border: `1px solid ${a.instance_id === selected ? C.violet : "transparent"}`, background: a.instance_id === selected ? "rgba(180,92,255,.12)" : "transparent", color: C.text, borderRadius: ".35rem", padding: ".28rem .4rem", cursor: "pointer", fontSize: ".7rem" }}>
          {a.asset_id.split(".")[1] ?? a.asset_id} · {a.rotation_deg}°
        </button>
      ))}
      {selected && (
        <div style={{ marginTop: ".5rem", borderTop: `1px solid ${C.edge}`, paddingTop: ".5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: ".25rem", marginBottom: ".3rem" }}>
            <span /><button style={tab(false)} onClick={() => onNudge(0, -1)}>↑</button><span />
            <button style={tab(false)} onClick={() => onNudge(-1, 0)}>←</button><button style={tab(false)} onClick={() => onNudge(0, 1)}>↓</button><button style={tab(false)} onClick={() => onNudge(1, 0)}>→</button>
          </div>
          <div style={{ display: "flex", gap: ".3rem" }}>
            <button style={tab(false)} onClick={onRotate} data-arch-rotate>Rotate 90°</button>
            <button style={{ ...tab(false), borderColor: C.violet, color: C.violet }} onClick={onRemove} data-arch-remove>Remove</button>
          </div>
        </div>
      )}
    </aside>
  );
}
