"use client";

/**
 * ARCHITECT-2525 · SIMULATE — ALTERNATIVE DESIGN OPTIONS (operator 2026-10-25/27/28).
 * Three ways to build — Cube (3×3, 900 ft²) · Tiny Home (real 8.5×40 THOW ≈340 ft²) · Eco-Sphere (7-hex dome, 900 ft²).
 * Pressing a form's SIMULATE **creates that environment** (the real furnished floor-plan mockup) AND runs the original
 * 13-sim battery (0–5 + metrics). Each card carries the four build dimensions the operator asked for:
 *   • method dropdown — Stick-framed / 3D Print / Hex-panel (the Eco's shell) — the ICON hook.
 *   • material dropdown — 3D Print → Cement · Composite ("more coming"); Stick → Wood · Steel · Aluminum.
 *   • roof dropdown — Gable · Hip · Flat (rectilinear) · Hex-panel dome (Eco).
 *   • cost BY ELEMENT — Foundation · Framing · Electrical · Plumbing · HVAC · Roofing (the six major elements).
 * Plus a per-form BUILD-INSTRUCTIONS plan and a four-path PROJECT TIMELINE (Cube · Tiny · Eco hex-panel · Eco 3D-print).
 *
 * ONE honest story: nothing is scored until you SIMULATE it; every cost DERIVES from one engine so the element
 * breakdown reconciles to the card total; Cube cost is engine-DERIVED, Tiny + Eco ASSUMED; all results are ESTIMATES.
 */
import { useMemo, useState } from "react";
import {
  SIM_MODELS, SIMS, METHODS, METHODS_FOR, PRINT_MATERIALS, FUTURE_PRINT_MATERIALS, FRAME_MATERIALS, ROOFS, ROOFS_FOR,
  LABOR_MODES, DEFAULT_COST, carbonFor, compareModels, costFor, costRollup, elementCosts, elementSubtotal, monthsFor, optFor,
  overallScore, phaseSchedule, recommendation, simMatrix, simResult,
  type BuildOption, type Method, type PrintMaterial, type FrameMaterial, type RoofType, type CostParams, type LaborMode,
} from "@/lib/architect-sim-options";
import { SimEnvironmentView } from "./sim-environment-view";
import { BuildInstructionsPanel, BuildTimelineCompare } from "./build-instructions";
import { type FormId } from "@/lib/architect-sim-environment";
import { TINY_ROOM_LAYOUT } from "@/lib/room-layout";

const ROOM_LEGEND = TINY_ROOM_LAYOUT.map((r) => ({ k: r.k, label: r.label }));

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", red: "#f87171", ground: "#070b12", cement: "#9aa7b4", composite: "#7fd4a8" };
const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const stars = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
const selectStyle = { background: C.ground, color: C.text, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 4px", fontSize: 9 } as const;

/** The tiny form glyph for the matrix column heads (the big furnished mockups live in the cards). */
function FormGlyph({ id, size = 26 }: { id: string; size?: number }) {
  const st = { width: size, height: size, display: "block" } as const;
  if (id === "tiny") {
    return (
      <svg viewBox="0 0 32 32" style={st} fill="none" stroke={C.cyan} strokeWidth={1.5} aria-hidden>
        <path d="M3 14 L9 9 L29 9 L29 23 L3 23 Z" vectorEffect="non-scaling-stroke" />
        <line x1="3" y1="14" x2="29" y2="14" vectorEffect="non-scaling-stroke" />
        <rect x="19" y="16" width="5" height="7" stroke={C.violet} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  if (id === "eco-sphere") {
    return (
      <svg viewBox="0 0 32 32" style={st} fill="none" stroke={C.cyan} strokeWidth={1.5} aria-hidden>
        <path d="M4 24 A12 12 0 0 1 28 24" vectorEffect="non-scaling-stroke" />
        <line x1="4" y1="24" x2="28" y2="24" vectorEffect="non-scaling-stroke" />
        <path d="M16 12 L9 24 M16 12 L23 24 M8.5 18 L23.5 18 M12 13.5 L16 24 M20 13.5 L16 24" stroke={C.violet} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" style={st} fill="none" stroke={C.cyan} strokeWidth={1.5} aria-hidden>
      <path d="M9 10 L13 6 L29 6 L25 10 M29 6 L29 22 L25 26" stroke={C.violet} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <rect x="9" y="10" width="16" height="16" vectorEffect="non-scaling-stroke" />
      <path d="M14.33 10 L14.33 26 M19.66 10 L19.66 26 M9 15.33 L25 15.33 M9 20.66 L25 20.66" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SimulateOptions() {
  const [simulated, setSimulated] = useState<Set<string>>(new Set());
  const [optsBy, setOptsBy] = useState<Record<string, BuildOption>>(() => Object.fromEntries(SIM_MODELS.map((m) => [m.id, optFor(m)])));
  const [compare, setCompare] = useState(false);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  // per-card COST VIEW — who builds (labour mode) + markup slider (operator IMG-02/06: Material + Labor + Markup, default 50%)
  const [costBy, setCostBy] = useState<Record<string, CostParams>>(() => Object.fromEntries(SIM_MODELS.map((m) => [m.id, { ...DEFAULT_COST }])));
  const setCost = (id: string, patch: Partial<CostParams>) => setCostBy((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const allSimulated = SIM_MODELS.every((m) => simulated.has(m.id));
  const allPrintedCement = SIM_MODELS.every((m) => optsBy[m.id]?.method === "3d-print" && optsBy[m.id]?.printMaterial === "cement");
  const allNative = SIM_MODELS.every((m) => JSON.stringify(optsBy[m.id]) === JSON.stringify(optFor(m)));   // every card at its native option
  const applyMode = (mode: "native" | "cement") => setOptsBy(Object.fromEntries(SIM_MODELS.map((m) =>
    [m.id, mode === "cement" ? { ...optsBy[m.id], method: "3d-print" as Method, printMaterial: "cement" as PrintMaterial } : optFor(m)]
  )));
  const ranks = useMemo(() => compareModels(SIM_MODELS, optsBy), [optsBy]);
  const rec = useMemo(() => recommendation(SIM_MODELS, optsBy), [optsBy]);
  const winnerOf = (metric: string) => ranks.find((r) => r.metric === metric)?.winnerId;
  const cols = `minmax(66px,1.1fr) repeat(${SIM_MODELS.length}, minmax(70px,1fr))`;

  const matrix = useMemo(() => {
    const allSim = SIM_MODELS.every((m) => simulated.has(m.id));
    return simMatrix(SIM_MODELS, optsBy).map((rw) => ({ ...rw, winnerId: allSim ? rw.winnerId : null }));
  }, [optsBy, simulated]);

  const simulate = (id: string) => setSimulated((s) => new Set(s).add(id));
  const simulateAll = () => setSimulated(new Set(SIM_MODELS.map((m) => m.id)));
  const setOpt = (id: string, patch: Partial<BuildOption>) => setOptsBy((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const toggleRow = (s: string) => setOpenRows((prev) => { const n = new Set(prev); if (n.has(s)) n.delete(s); else n.add(s); return n; });

  return (
    <div className="space-y-3" data-arch-sim-options>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>SIMULATE · ALTERNATIVE DESIGN OPTIONS</div>
        <span className="text-[9px]" style={{ color: C.dim }}>· Cube · Tiny Home · Eco-Sphere — press SIMULATE to build each environment + score it</span>
        {!allSimulated && (
          <button data-arch-sim-all onClick={simulateAll} className="rounded border px-2 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.violet, color: C.violet, background: "#1a1030" }}>◉ SIMULATE ALL</button>
        )}
      </div>

      {/* master compare mode — each form's native method, or ALL as 3D-printed cement (Christo: flag mixed methods) */}
      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
        <span style={{ color: C.dim }}>Compare at</span>
        {([["native", "NATIVE methods"], ["cement", "ALL 3D Print · cement"]] as const).map(([mode, lbl]) => {
          const on = mode === "cement" ? allPrintedCement : allNative;
          return (
            <button key={mode} data-arch-sim-method-mode={mode} onClick={() => applyMode(mode)} className="rounded border px-1.5 py-0.5 font-semibold"
              style={{ borderColor: on ? (mode === "cement" ? C.cement : C.cyan) : C.border, color: on ? (mode === "cement" ? C.cement : C.cyan) : C.dim, background: on ? "#0b1220" : "transparent" }}>{lbl}</button>
          );
        })}
        <span style={{ color: C.dim }}>{allPrintedCement ? "· all three printed in cement" : allNative ? "· native: Eco-Sphere hex-panel dome; Cube + Tiny framed" : "· custom — options edited per card (neither preset)"}</span>
      </div>

      {/* ★ RATINGS + COMPARE — always one tap away (operator IMG-04: 5★ + compare easily accessible) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-2 py-1.5 text-[9px]" style={{ borderColor: `${C.gold}55`, background: C.panel }} data-arch-sim-ratings>
        <span className="uppercase tracking-wider" style={{ color: C.gold }}>★ Ratings · tap-to-compare</span>
        {SIM_MODELS.map((m) => { const sim = simulated.has(m.id); const sc = overallScore(m.id, optsBy[m.id]); return (
          <span key={m.id}><b style={{ color: C.cyan }}>{m.label.split(" ")[0]}</b> <span style={{ color: sim ? C.gold : C.dim }}>{sim ? `${stars(Math.round(sc))} ${sc.toFixed(1)}` : "— run"}</span>{sim ? <span style={{ color: C.dim }}> · {usd(costFor(m, optsBy[m.id], costBy[m.id]))}</span> : null}</span>
        ); })}
        <button data-arch-sim-compare-top disabled={!allSimulated} onClick={() => { setCompare(true); if (typeof document !== "undefined") document.querySelector("[data-arch-sim-compare]")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
          className="rounded border px-2 py-0.5 font-semibold" style={{ borderColor: allSimulated ? C.gold : C.border, color: allSimulated ? C.gold : C.dim, background: allSimulated ? "#1a1405" : "transparent" }}>
          {allSimulated ? "▾ COMPARE ALL 3" : "COMPARE — run all 3 first"}
        </button>
      </div>

      {/* 3 model cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SIM_MODELS.map((m) => {
          const opt = optsBy[m.id];
          const isSim = simulated.has(m.id);
          const printed = opt.method === "3d-print";
          const results = isSim ? SIMS.map((s) => simResult(m.id, s, opt)) : [];
          const passed = results.filter((r) => r.status === "PASS").length;
          const avg = overallScore(m.id, opt);
          const basisCol = m.basis === "DERIVED" ? C.green : C.amber;
          const cv = costBy[m.id];
          const cardTotal = costFor(m, opt, cv);
          const elems = elementCosts(m, opt, cv);
          const elemMax = Math.max(...elems.map((e) => e.usd), 1);
          const elemSub = elementSubtotal(m, opt, cv);
          const roll = costRollup(m, opt, cv);
          const assumeOpen = openRows.has("assume:" + m.id);
          const row = (label: string, value: string, metric?: string) => {
            const win = !!metric && compare && allSimulated && winnerOf(metric) === m.id;
            return (
              <div className="flex items-baseline justify-between text-[11px]">
                <span style={{ color: C.dim }}>{label}</span>
                <span style={{ color: win ? C.gold : C.text, fontWeight: win ? 700 : 400 }}>{win ? "✦ " : ""}{value}</span>
              </div>
            );
          };
          return (
            <div key={m.id} data-arch-sim-model={m.id} className="rounded-lg border p-2.5" style={{ borderColor: C.border, background: C.panel }}>
              <div className="flex items-center gap-1.5">
                <span className="rounded border p-0.5" style={{ borderColor: C.border, background: C.ground }}><FormGlyph id={m.id} size={22} /></span>
                <span className="text-[12px] font-bold" style={{ color: C.cyan }}>{m.label}</span>
              </div>
              <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>{m.form}</div>
              <div className="mt-1.5 space-y-0.5">
                {row("Area", `${m.areaFt2.toLocaleString()} ft² · ${m.layoutLabel}`)}
                {row("Cost", usd(cardTotal), "Cost")}
                {row("Build", `${monthsFor(m, opt)} mo`, "Build time")}
                {row("Energy", stars(m.energyScore), "Energy")}
                {row("Carbon", stars(carbonFor(m, opt)), "Carbon")}
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: basisCol }}>
                <span>{m.basis === "DERIVED" ? "cost · derived · engine" : "cost · assumed · parametric"}</span>
                <span style={{ color: C.dim }}>envelope: assumed</span>
              </div>

              {!isSim ? (
                <button data-arch-sim-run={m.id} onClick={() => simulate(m.id)}
                  className="mt-2 w-full rounded border px-2 py-1.5 text-[10px] font-semibold" style={{ borderColor: C.violet, color: C.violet, background: "#1a1030" }}>
                  ◉ SIMULATE · create environment + run 13 sims
                </button>
              ) : (
                <div className="mt-2 space-y-1.5" data-arch-sim-generated={m.id}>
                  {/* the GENERATED environment */}
                  <SimEnvironmentView formId={m.id as FormId} opt={opt} size={240} />

                  {/* ── build option: method · material/frame · roof ── */}
                  <div className="space-y-1 rounded border p-1.5" style={{ borderColor: C.border, background: C.ground }}>
                    <div className="flex flex-wrap items-center gap-1 text-[9px]">
                      <span style={{ color: C.dim, width: 44 }}>Method</span>
                      {METHODS_FOR[m.id as FormId].map((mth) => (
                        <button key={mth} data-arch-sim-method={`${m.id}:${mth}`} onClick={() => setOpt(m.id, { method: mth })}
                          className="rounded border px-1.5 py-0.5 font-semibold"
                          style={{ borderColor: opt.method === mth ? C.cyan : C.border, color: opt.method === mth ? C.cyan : C.dim, background: opt.method === mth ? "#0b1220" : "transparent" }}>
                          {METHODS[mth].short}
                        </button>
                      ))}
                    </div>
                    {/* material dropdown — 3D Print: cement/composite + "more coming"; Stick: wood/steel/aluminum; Hex-panel: fixed */}
                    {printed ? (
                      <div className="flex items-center gap-1 text-[9px]">
                        <span style={{ color: C.dim, width: 44 }}>Material</span>
                        <select data-arch-sim-material={m.id} value={opt.printMaterial} style={selectStyle}
                          onChange={(e) => setOpt(m.id, { printMaterial: e.target.value as PrintMaterial })}>
                          {(Object.keys(PRINT_MATERIALS) as PrintMaterial[]).map((pm) => (
                            <option key={pm} value={pm}>{PRINT_MATERIALS[pm].label} · est.</option>
                          ))}
                          {FUTURE_PRINT_MATERIALS.map((f) => <option key={f.label} disabled>{f.label} — {f.note}</option>)}
                        </select>
                      </div>
                    ) : opt.method === "stick-framed" ? (
                      <div className="flex items-center gap-1 text-[9px]">
                        <span style={{ color: C.dim, width: 44 }}>Frame</span>
                        <select data-arch-sim-frame={m.id} value={opt.frameMaterial} style={selectStyle}
                          onChange={(e) => setOpt(m.id, { frameMaterial: e.target.value as FrameMaterial })}>
                          {(Object.keys(FRAME_MATERIALS) as FrameMaterial[]).map((fm) => (
                            <option key={fm} value={fm}>{FRAME_MATERIALS[fm].label} · est.</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="text-[8px]" style={{ color: C.dim }}>Prefab geodesic hex panels — bolted hub-to-hub.</div>
                    )}
                    <div className="flex items-center gap-1 text-[9px]">
                      <span style={{ color: C.dim, width: 44 }}>Roof</span>
                      {ROOFS_FOR[m.id as FormId].length > 1 ? (
                        <select data-arch-sim-roof={m.id} value={opt.roof} style={selectStyle} onChange={(e) => setOpt(m.id, { roof: e.target.value as RoofType })}>
                          {ROOFS_FOR[m.id as FormId].map((rf) => <option key={rf} value={rf}>{ROOFS[rf].label}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: C.violet }}>{ROOFS[opt.roof].label} <span style={{ color: C.dim }}>· integral</span></span>
                      )}
                    </div>
                  </div>

                  {/* ── COST · Material + Labor + Markup (operator IMG-02/06: see M+L+Markup, adjustable markup, boil it down) ── */}
                  <div data-arch-sim-elements className="rounded border p-1.5" style={{ borderColor: C.border, background: C.ground }}>
                    <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>
                      <span>Cost · Material + Labor + Markup</span><span style={{ color: C.cyan, fontWeight: 700 }}>{usd(cardTotal)}</span>
                    </div>
                    {/* WHO builds — the labour lever (friends/family/veterans ⇒ ≈ $0 labour) */}
                    <div className="flex flex-wrap items-center gap-1 text-[8px]">
                      <span style={{ color: C.dim, width: 38, flexShrink: 0 }}>Labor</span>
                      {(Object.keys(LABOR_MODES) as LaborMode[]).map((lm) => (
                        <button key={lm} data-arch-sim-labor={`${m.id}:${lm}`} title={LABOR_MODES[lm].blurb} onClick={() => setCost(m.id, { laborMode: lm })}
                          className="rounded border px-1 py-0.5 font-semibold" style={{ borderColor: cv.laborMode === lm ? C.green : C.border, color: cv.laborMode === lm ? C.green : C.dim, background: cv.laborMode === lm ? "#0a1f14" : "transparent" }}>{LABOR_MODES[lm].short}</button>
                      ))}
                    </div>
                    {/* markup slider — default 50% margin */}
                    <div className="mt-1 flex items-center gap-1.5 text-[8px]">
                      <span style={{ color: C.dim, width: 38, flexShrink: 0 }}>Markup</span>
                      <input type="range" min={0} max={100} step={5} value={Math.round(cv.markup * 100)} data-arch-sim-markup={m.id}
                        onChange={(e) => setCost(m.id, { markup: Number(e.target.value) / 100 })} style={{ flex: 1, accentColor: C.gold }} aria-label={`${m.label} markup`} />
                      <span style={{ color: C.gold, width: 30, textAlign: "right" }}>{Math.round(cv.markup * 100)}%</span>
                    </div>
                    {/* the Material → +Labor → +Markup → Total waterfall */}
                    {(() => {
                      const steps: [string, number, string][] = [["Material", roll.material, C.cyan], ["Labor", roll.labor, C.violet], ["Markup", roll.markup, C.gold]];
                      const max = roll.total || 1; let run = 0;
                      return (
                        <div data-arch-sim-waterfall className="mt-1.5 space-y-0.5">
                          {steps.map(([lbl, val, col]) => { const left = run; run += val; return (
                            <div key={lbl} className="flex items-center gap-1.5 text-[8px]">
                              <span style={{ color: C.dim, width: 46, flexShrink: 0 }}>{lbl}</span>
                              <span className="relative h-2 flex-1 rounded-sm" style={{ background: "#0b1220" }}>
                                <span className="absolute top-0 h-2 rounded-sm" style={{ left: `${(left / max) * 100}%`, width: `${Math.max(1, (val / max) * 100)}%`, background: col, opacity: 0.9 }} />
                              </span>
                              <span style={{ color: col, width: 58, flexShrink: 0, textAlign: "right" }}>+{usd(val)}</span>
                            </div>
                          ); })}
                          <div className="flex items-center gap-1.5 text-[8px] font-bold" style={{ borderTop: `1px solid ${C.border}`, paddingTop: 2 }}>
                            <span style={{ color: C.text, width: 46 }}>Total</span><span className="flex-1" /><span style={{ color: C.text, width: 58, textAlign: "right" }}>{usd(roll.total)}</span>
                          </div>
                        </div>
                      );
                    })()}
                    {/* reveal assumptions — per-element Material / Labor / Markup */}
                    <button data-arch-sim-assume={m.id} onClick={() => toggleRow("assume:" + m.id)} className="mt-1 w-full rounded border px-1.5 py-0.5 text-[8px] font-semibold" style={{ borderColor: C.border, color: C.dim }}>
                      {assumeOpen ? "▴ hide assumptions" : "▾ reveal assumptions · M / L / Markup per element"}
                    </button>
                    {assumeOpen && (
                      <div className="mt-1 space-y-0.5">
                        {elems.map((e) => (
                          <div key={e.element} className="grid items-center gap-1 text-[8px]" style={{ gridTemplateColumns: "54px 1fr 1fr 1fr 46px" }}>
                            <span style={{ color: C.dim }}>{e.element}</span>
                            <span style={{ color: C.cyan }}>M {usd(e.material)}</span>
                            <span style={{ color: C.violet }}>L {usd(e.labor)}</span>
                            <span style={{ color: C.gold }}>+{usd(e.markup)}</span>
                            <span style={{ color: C.text, textAlign: "right" }}>{usd(e.usd)}</span>
                          </div>
                        ))}
                        <div className="text-[8px]" style={{ color: C.dim }}>Six major elements · {m.basis === "DERIVED" ? "derived from the estimate engine" : "ASSUMED area · parametric"} · labour {LABOR_MODES[cv.laborMode].label.toLowerCase()} · markup {Math.round(cv.markup * 100)}% · est. Switch to <b style={{ color: C.green }}>Volunteer + 0% markup</b> for the friends/family/veterans build cost.</div>
                      </div>
                    )}
                    {/* element bars (always visible) */}
                    <div className="mt-1 space-y-0.5">
                      {elems.map((e) => (
                        <div key={e.element} className="flex items-center gap-1.5 text-[8px]">
                          <span style={{ color: C.dim, width: 56, flexShrink: 0 }}>{e.element}</span>
                          <span className="h-2 rounded-sm" style={{ background: C.cyan, width: `${Math.max(4, (e.usd / elemMax) * 100)}%`, opacity: 0.8 }} />
                          <span style={{ color: C.text, flexShrink: 0 }}>{usd(e.usd)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* TIME TO BUILD, BY PHASE (calendar months) */}
                  {(() => {
                    const sched = phaseSchedule(m.id, opt);
                    const maxW = Math.max(1, ...sched.map((p) => p.weeks));
                    // option-aware labels so the Framing + Roofing rows name the ACTUAL shell/roof, matching the Build
                    // Instructions panel below (no "Framing" vs "Shell · hex panels" drift on one card — Aset).
                    const phaseName = (id: string, label: string) =>
                      id === "framing" ? (opt.method === "3d-print" ? "Shell·3D-print" : opt.method === "hex-panel" ? "Shell·hex" : `Framing·${opt.frameMaterial}`)
                      : id === "roofing" ? `Roof·${ROOFS[opt.roof].short.toLowerCase()}`
                      : label;
                    return (
                      <div data-arch-sim-phases className="rounded border p-1.5" style={{ borderColor: C.border, background: C.ground }}>
                        <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>
                          <span>Time to build · by phase · calendar</span><span>{monthsFor(m, opt)} mo total</span>
                        </div>
                        <div className="space-y-0.5">
                          {sched.map((p) => (
                            <div key={p.id} className="flex items-center gap-1.5 text-[8px]">
                              <span style={{ color: C.dim, width: 62, flexShrink: 0 }}>{phaseName(p.id, p.label)}</span>
                              <span className="h-2 rounded-sm" style={{ background: p.color, width: `${Math.max(3, (p.weeks / maxW) * 100)}%`, opacity: 0.85 }} />
                              <span style={{ color: p.color, flexShrink: 0 }}>{p.weeks}w</span>
                            </div>
                          ))}
                        </div>
                        {printed && <div className="mt-0.5 text-[8px]" style={{ color: C.cement }}>↳ 3D Print collapses the Framing phase (the shell prints fast).</div>}
                        {opt.method === "hex-panel" && <div className="mt-0.5 text-[8px]" style={{ color: C.composite }}>↳ hex panels assemble dry — the shell goes up fast.</div>}
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-between rounded px-1.5 py-1 text-[10px]" style={{ background: C.ground }}>
                    <span style={{ color: C.dim }}>13-sim avg</span>
                    <span style={{ color: C.cyan, fontWeight: 700 }}>{avg.toFixed(1)}/5 · {passed}/13 pass</span>
                  </div>
                  <button onClick={() => toggleRow("card:" + m.id)} className="w-full rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: C.green, color: C.green, background: "#0a1f14" }}>
                    {openRows.has("card:" + m.id) ? "▴ HIDE 13-SIM DETAIL" : "▾ 13-SIM DETAIL · per-sim scores"}
                  </button>
                  {openRows.has("card:" + m.id) && (
                    <div data-arch-sim-strip className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {results.map((r) => (
                        <div key={r.sim} className="flex items-center justify-between text-[9px]">
                          <span style={{ color: C.dim }}>{r.sim}</span>
                          <span style={{ color: r.status === "PASS" ? C.green : C.amber }}>{r.score.toFixed(1)} {stars(r.stars)}</span>
                        </div>
                      ))}
                      <div className="col-span-2 mt-0.5 text-[10px]" style={{ color: C.dim }}>deterministic estimate (a design preview, not an engineering result)</div>
                    </div>
                  )}

                  {/* BUILD INSTRUCTIONS for this form + option */}
                  <button onClick={() => toggleRow("build:" + m.id)} className="w-full rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: C.violet, color: C.violet, background: "#1a1030" }}>
                    {openRows.has("build:" + m.id) ? "▴ HIDE BUILD INSTRUCTIONS" : "▾ BUILD INSTRUCTIONS · measured steps + crew-days"}
                  </button>
                  {openRows.has("build:" + m.id) && <BuildInstructionsPanel formId={m.id as FormId} option={opt} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* room-key + furniture legend */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg border px-2 py-1.5 text-[9px]" style={{ borderColor: C.border, background: C.panel }} data-arch-sim-legend>
        <span className="uppercase tracking-wider" style={{ color: C.dim }}>Room keys</span>
        {ROOM_LEGEND.map((r) => (
          <span key={r.k}><b style={{ color: C.cyan }}>{r.k}</b> <span style={{ color: C.dim }}>{r.label}</span></span>
        ))}
        <span className="uppercase tracking-wider" style={{ color: C.dim, borderLeft: `1px solid ${C.border}`, paddingLeft: 8 }}>Furniture</span>
        <span><span style={{ color: "#c084fc" }}>■</span> <span style={{ color: C.dim }}>furniture</span></span>
        <span><span style={{ color: "#19c8cf" }}>■</span> <span style={{ color: C.dim }}>appliance · plumbing</span></span>
        <span><span style={{ color: "#ffd400" }}>■</span> <span style={{ color: C.dim }}>table</span></span>
      </div>

      {/* SIDE-BY-SIDE TEST MATRIX */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider" style={{ color: C.cyan }}>TEST MATRIX · the 13 sims, side by side</span>
          <span className="text-[9px]" style={{ color: C.dim }}>· a score appears once that form is SIMULATED · tap a sim for detail · ✦ = best</span>
        </div>
        <div className="overflow-x-auto" data-arch-sim-matrix>
          <div style={{ minWidth: 300 }}>
            <div className="grid items-end gap-1 pb-1.5" style={{ gridTemplateColumns: cols }}>
              <div className="self-center text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>13 sims · 0–5</div>
              {SIM_MODELS.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-0.5">
                  <span className="rounded border p-1" style={{ borderColor: C.border, background: C.ground }}><FormGlyph id={m.id} size={26} /></span>
                  <span className="text-center text-[9px] font-bold leading-tight" style={{ color: C.cyan }}>{m.label}</span>
                  <span className="text-[8px]" style={{ color: simulated.has(m.id) ? C.dim : C.amber }}>{simulated.has(m.id) ? `avg ${overallScore(m.id, optsBy[m.id]).toFixed(1)}` : "NOT_RUN"}</span>
                </div>
              ))}
            </div>
            {matrix.map((rw) => {
              const isOpen = openRows.has(rw.sim);
              return (
                <div key={rw.sim} data-arch-sim-row={rw.sim} className="border-t" style={{ borderColor: "#0f1724" }}>
                  <button onClick={() => toggleRow(rw.sim)} className="grid w-full items-center gap-1 py-1 text-left" style={{ gridTemplateColumns: cols }}>
                    <span className="text-[10px]" style={{ color: C.text }}>{isOpen ? "▾ " : "▸ "}{rw.sim}</span>
                    {rw.cells.map((c) => {
                      const shown = simulated.has(c.modelId);
                      const win = shown && c.modelId === rw.winnerId;
                      return (
                        <span key={c.modelId} data-arch-sim-cell className="flex flex-col items-center leading-none">
                          <span className="text-[11px] font-semibold" style={{ color: !shown ? C.dim : win ? C.gold : c.status === "PASS" ? C.green : C.amber }}>{shown ? `${win ? "✦ " : ""}${c.score.toFixed(1)}` : "—"}</span>
                          {shown && <span className="mt-0.5 text-[8px]" style={{ color: win ? C.gold : C.dim }}>{stars(c.stars)}</span>}
                        </span>
                      );
                    })}
                  </button>
                  {isOpen && (
                    <div className="grid gap-1 pb-1.5" style={{ gridTemplateColumns: cols }}>
                      <span className="self-start text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>metrics <span style={{ color: C.amber }}>· est.</span></span>
                      {rw.cells.map((c) => (
                        <div key={c.modelId} className="space-y-0.5">
                          {simulated.has(c.modelId) ? c.metrics.map((mt) => (
                            <div key={mt.label} className="text-center text-[8px] leading-tight">
                              <div style={{ color: C.dim }}>{mt.label}</div>
                              <div style={{ color: C.text }}>{mt.value}</div>
                            </div>
                          )) : <div className="text-center text-[8px]" style={{ color: C.dim }}>—</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 space-y-0.5">
          <div className="text-[10px]" style={{ color: C.dim }}>Initial 0–5 score + detailed metrics · deterministic estimate (a design preview, not an engineering analysis).</div>
          <div className="text-[10px]" style={{ color: C.amber }}>⚠ Energy/Carbon — and the sims they weight — are DESIGN ASSUMPTIONS. Only the Cube's cost is engine-derived. Materials are modelled honestly (cement: stronger/non-combustible, higher embodied carbon; composite: stronger/lighter/less carbon; steel/aluminum: stronger, higher carbon).</div>
        </div>
      </div>

      {/* BUILD INSTRUCTIONS · four-path project timeline (the operator's headline compare) */}
      <BuildTimelineCompare />

      {/* the original 13-sim battery — run on EVERY model */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 text-[9px] uppercase tracking-wider" style={{ color: C.dim }}>The 13-sim battery · run on every model</div>
        <div className="flex flex-wrap gap-1">
          {SIMS.map((s) => (
            <span key={s} data-sim className="rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>{s}</span>
          ))}
        </div>
      </div>

      {/* COMPARE ALL — enabled once all three are simulated */}
      <button data-arch-sim-compare disabled={!allSimulated} onClick={() => setCompare((v) => !v)} className="rounded border px-3 py-1 text-[11px] font-semibold"
        style={{ borderColor: !allSimulated ? C.border : compare ? C.gold : C.cyan, color: !allSimulated ? C.dim : compare ? C.gold : C.cyan, background: !allSimulated ? "transparent" : compare ? "#1a1405" : "#07202a", opacity: allSimulated ? 1 : 0.6 }}>
        {!allSimulated ? "▸ COMPARE ALL 3 — simulate all three first" : compare ? "✦ COMPARING — winner starred per metric" : "▸ COMPARE ALL 3 — rank by cost · time · energy · carbon · sim avg"}
      </button>
      {compare && allSimulated && (
        <div className="rounded-lg border p-2 text-[10px]" style={{ borderColor: `${C.gold}55`, background: C.panel }}>
          <div className="mb-1 rounded px-2 py-1.5 text-[11px]" style={{ background: C.ground, border: `1px solid ${C.gold}55` }}>
            <span style={{ color: C.dim }}>Top sim-average → </span>
            <span style={{ color: C.gold, fontWeight: 700 }}>✦ {rec.label}</span>
            <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>{rec.reason}</div>
          </div>
          {ranks.map((r) => {
            const w = SIM_MODELS.find((m) => m.id === r.winnerId);
            return (
              <div key={r.metric} className="flex items-center justify-between border-b py-0.5" style={{ borderColor: "#111827" }}>
                <span style={{ color: C.dim }}>{r.metric}</span>
                <span style={{ color: C.gold }}>✦ {w?.label}</span>
              </div>
            );
          })}
          {/* the ICON payoff: time to FRAME/raise each shell (3D Print + hex panels collapse it) — Asar */}
          {(() => {
            const fw = SIM_MODELS.map((m) => ({ m, w: phaseSchedule(m.id, optsBy[m.id]).find((p) => p.id === "framing")?.weeks ?? 0 }));
            const best = fw.reduce((a, b) => (b.w < a.w ? b : a));
            return (
              <div className="flex items-center justify-between border-b py-0.5" style={{ borderColor: "#111827" }}>
                <span style={{ color: C.dim }}>Framing / shell phase</span>
                <span className="text-[9px]"><span style={{ color: C.dim }}>{fw.map((x) => `${x.m.label.split(" ")[0]} ${x.w}w`).join(" · ")} </span><span style={{ color: C.gold }}>✦ {best.m.label}</span></span>
              </div>
            );
          })()}
          <div className="flex items-center justify-between py-0.5">
            <span style={{ color: C.dim }}>Sim average (13 sims)</span>
            <span style={{ color: C.gold }}>✦ {rec.label} · {rec.avg.toFixed(1)}</span>
          </div>
          <div className="mt-1 text-[10px]" style={{ color: C.dim }}>Lower cost/time wins · higher energy/carbon/sim-avg wins. Estimates — not a quote.</div>
        </div>
      )}
    </div>
  );
}
