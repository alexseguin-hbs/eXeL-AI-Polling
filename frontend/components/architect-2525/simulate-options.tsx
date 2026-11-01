"use client";

/**
 * ARCHITECT-2525 · SIMULATE — ALTERNATIVE DESIGN OPTIONS (operator 2026-10-25/27/28).
 * Three ways to build — Cube (3×3, 900 ft²) · Tiny Home (real 8.5×24 THOW ≈204 ft²) · Eco-Sphere (7-hex dome, 900 ft²).
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
  LABOR_MODES, DEFAULT_COST, carbonFor, compareModels, costBreakdown, costFor, costPerFt2, defaultMarkupFor, laborHoursFor,
  laborRateFor, proLaborRateFor, monthsFor, optFor,
  overallScore, phaseSchedule, recommendation, simMatrix, simResult,
  type BuildOption, type Method, type PrintMaterial, type FrameMaterial, type RoofType, type CostParams, type LaborMode,
  catalogSum, type UpperKind,
} from "@/lib/architect-sim-options";
import { SimEnvironmentView } from "./sim-environment-view";
import { BuildInstructionsPanel, BuildTimelineCompare } from "./build-instructions";
import { type FormId } from "@/lib/architect-sim-environment";
import { TINY_ROOM_LAYOUT, type RoomCell } from "@/lib/room-layout";
import { rainbow } from "@/lib/architect-rainbow";

const ROOM_LEGEND = TINY_ROOM_LAYOUT.map((r) => ({ k: r.k, label: r.label }));
// RED → VIOLET across the 13 checks (operator 2026-11-01: "rainbow order of trinity 13 · colors from Red to violet").
const SIM_RAINBOW = rainbow(SIMS.length);

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", red: "#f87171", ground: "#070b12", cement: "#9aa7b4", composite: "#7fd4a8" };
const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const stars = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
// RED → GREEN for a 1–5 rating (operator 2026-10-31 "use: Red to Green for 1-5 star" · 2026-11-01 "1 star is red, 4-5 star
// is green"). 1 red · 2 orange · 3 amber · 4 green · 5 deep green — so 4 AND 5 read clearly green, not lime.
const SCORE_COLORS = ["#ef4444", "#ef4444", "#f97316", "#eab308", "#22c55e", "#15803d"]; // index 0..5 (0 and 1 both red; 4 & 5 both green)
const scoreColor = (n: number) => SCORE_COLORS[Math.max(0, Math.min(5, Math.round(n)))];
const selectStyle = { background: C.ground, color: C.text, border: `1px solid ${C.border}`, borderRadius: 4, padding: "1px 4px", fontSize: 9 } as const;
// R-UX6 (operator 2026-11-01, human-first): each of the 13 checks in plain words — what it protects for the people who
// live there and the builder who prices it. Shown on tap (the matrix row + the card's 13-check list + the chip titles),
// so the detail stays visible to all, explained. The short engineering name stays as the key.
const SIM_MEANING: Record<string, string> = {
  Structural: "Stands up to its own weight and loads",
  Wind: "Holds up in a storm",
  Flood: "Stays dry if water rises",
  Fire: "Fire safety and getting out",
  Earthquake: "Holds together when the ground shakes",
  Thermal: "Comfortable without wasting energy",
  Solar: "How much power the roof can make",
  "Water Flow": "Good water pressure to every tap",
  HVAC: "Heating and cooling that fits the home",
  Evacuation: "How fast everyone can get out",
  Accessibility: "Easy to use with a wheelchair or walker",
  Carbon: "Climate footprint — to build and to live in",
  Lifecycle: "What it costs to own over 30 years",
};

/** The tiny form glyph for the matrix column heads (the big furnished mockups live in the cards).
 *
 * ICONOLOGY LAW (operator 2026-10-31, his three zoomed screenshots: "enhance iconology so lines connect better"): every glyph is
 * built from NAMED VERTICES and every stroke endpoint is one of them — one stroke width for cyan and violet, round joins and caps,
 * faces drawn as CLOSED polygons that share their corners. Before: the Tiny Home's roof was a flap with no right-hand face to land
 * on and its door sat on top of the base line; the Eco-Sphere's lattice floated inside the dome in a thinner stroke; the Cube's
 * violet faces met the cyan grid's corners half a stroke off and only the front face carried the 3×3. Gated:
 * tests/architect-form-glyphs.test.mjs (every endpoint on a vertex / the arc / the base / the hub; nothing leaves the dome).
 *
 * Geometry (viewBox 0..32): the two boxes use ONE oblique projection p(x,y,z) = (ox + w·x + d·z, oy − h·y − d·z), depth vector
 * (d, −d). Cube: ox 9 · oy 26 · w = h = 16 · d = 4 — the unit cube's 8 corners, the three visible faces, a 3×3 grid on EACH of them
 * (the 3×3×3 cube his rule demands of the voxel). Tiny Home: ox 3 · oy 25 · w 20 · h 12 · d 6 — three faces; the door is an open path
 * whose feet stand ON the base edge. Eco-Sphere: arc centre (16,24) r 12 whose ends are the base line's ends; lattice nodes only ON
 * the arc (30°·60°·90°·120°·150°), on the base (x 4·10·16·22·28) or the one hub (16,18): the geodesic ring is the chords between
 * consecutive arc nodes; the spokes run hub → every arc node and hub → the two inner base nodes. */
const GLYPH_STROKE = 1.25;
function FormGlyph({ id, size = 26 }: { id: string; size?: number }) {
  const st = { width: size, height: size, display: "block" } as const;
  const svgProps = { viewBox: "0 0 32 32", style: st, fill: "none", stroke: C.cyan, strokeWidth: GLYPH_STROKE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const, "aria-hidden": true };
  if (id === "tiny") {
    return (
      <svg {...svgProps} data-arch-glyph="tiny">
        {/* front face (3,13)→(23,13)→(23,25)→(3,25) · top (3,13)→(9,7)→(29,7)→(23,13) · right (23,13)→(29,7)→(29,19)→(23,25) */}
        <path d="M3 13 L23 13 L23 25 L3 25 Z" vectorEffect="non-scaling-stroke" />
        <path d="M3 13 L9 7 L29 7 L23 13 Z" vectorEffect="non-scaling-stroke" />
        <path d="M23 13 L29 7 L29 19 L23 25 Z" vectorEffect="non-scaling-stroke" />
        {/* the door: an open path inside the front face, its feet on the base edge y 25 (never a rectangle over the base line) */}
        <path d="M15 25 L15 18 L19 18 L19 25" stroke={C.violet} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  if (id === "eco-sphere") {
    return (
      <svg {...svgProps} data-arch-glyph="eco-sphere">
        <path d="M4 24 A12 12 0 0 1 28 24" vectorEffect="non-scaling-stroke" />
        <path d="M4 24 L28 24" vectorEffect="non-scaling-stroke" />
        {/* the geodesic ring: chords between consecutive arc nodes (0°…180° in 30° steps) */}
        <path d="M4 24 L5.608 18 L10 13.608 L16 12 L22 13.608 L26.392 18 L28 24" stroke={C.violet} vectorEffect="non-scaling-stroke" />
        {/* the spokes: hub (16,18) → every arc node, and → the two inner base nodes */}
        <path d="M16 18 L5.608 18 M16 18 L10 13.608 M16 18 L16 12 M16 18 L22 13.608 M16 18 L26.392 18 M16 18 L10 24 M16 18 L22 24" stroke={C.violet} vectorEffect="non-scaling-stroke" />
      </svg>
    );
  }
  return (
    <svg {...svgProps} data-arch-glyph="cube">
      {/* front face (z 0) · its 3×3 grid */}
      <path d="M9 10 L25 10 L25 26 L9 26 Z" vectorEffect="non-scaling-stroke" />
      <path d="M14.333 10 L14.333 26 M19.667 10 L19.667 26 M9 15.333 L25 15.333 M9 20.667 L25 20.667" vectorEffect="non-scaling-stroke" />
      {/* top face (y 1) and right face (x 1), closed, sharing the front face's corners · their 3×3 grids */}
      <path d="M9 10 L13 6 L29 6 L25 10 Z" stroke={C.violet} vectorEffect="non-scaling-stroke" />
      <path d="M25 10 L29 6 L29 22 L25 26 Z" stroke={C.violet} vectorEffect="non-scaling-stroke" />
      <path d="M10.333 8.667 L26.333 8.667 M11.667 7.333 L27.667 7.333 M14.333 10 L18.333 6 M19.667 10 L23.667 6" stroke={C.violet} vectorEffect="non-scaling-stroke" />
      <path d="M25 20.667 L29 16.667 M25 15.333 L29 11.333 M26.333 24.667 L26.333 8.667 M27.667 23.333 L27.667 7.333" stroke={C.violet} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SimulateOptions({ designRooms }: { designRooms?: RoomCell[] } = {}) {
  // R-UX6 (operator 2026-11-01: "remove simulate button … comparison should always be live"): NO run state — every design
  // is scored live from its options at render; the per-card EXPAND toggle only shows/hides the extra detail below.
  // P1 (operator 2026-11-01: "SIMULATE MUST MATCH DESIGN TAB"): `designRooms` is the live Design-tab room layout — every
  // form's drawing uses the user's ACTUAL placed furniture from it (threaded into SimEnvironmentView below).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());   // which cards show their full detail (collapsed by default)
  const [upperBy, setUpperBy] = useState<Record<string, UpperKind>>({});   // R5f: the catalog preset's LOFT / SECOND FLOOR switch
  const [optsBy, setOptsBy] = useState<Record<string, BuildOption>>(() => Object.fromEntries(SIM_MODELS.map((m) => [m.id, optFor(m)])));
  const [compare, setCompare] = useState(false);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  // per-card COST VIEW — who builds (labour mode) + markup slider (operator IMG-02/06: Material + Labor + Markup, default 50%)
  const [costBy, setCostBy] = useState<Record<string, CostParams>>(() => Object.fromEntries(SIM_MODELS.map((m) => [m.id, { ...DEFAULT_COST }])));
  const setCost = (id: string, patch: Partial<CostParams>) => setCostBy((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const allPrintedCement = SIM_MODELS.every((m) => optsBy[m.id]?.method === "3d-print" && optsBy[m.id]?.printMaterial === "cement");
  const allNative = SIM_MODELS.every((m) => JSON.stringify(optsBy[m.id]) === JSON.stringify(optFor(m)));   // every card at its native option
  const applyMode = (mode: "native" | "cement") => setOptsBy(Object.fromEntries(SIM_MODELS.map((m) =>
    [m.id, mode === "cement" ? { ...optsBy[m.id], method: "3d-print" as Method, printMaterial: "cement" as PrintMaterial } : optFor(m)]
  )));
  const ranks = useMemo(() => compareModels(SIM_MODELS, optsBy), [optsBy]);
  const rec = useMemo(() => recommendation(SIM_MODELS, optsBy), [optsBy]);
  const winnerOf = (metric: string) => ranks.find((r) => r.metric === metric)?.winnerId;
  const cols = `minmax(66px,1.1fr) repeat(${SIM_MODELS.length}, minmax(70px,1fr))`;

  const matrix = useMemo(() => simMatrix(SIM_MODELS, optsBy), [optsBy]);

  const toggleExpand = (id: string) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setOpt = (id: string, patch: Partial<BuildOption>) => setOptsBy((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const toggleRow = (s: string) => setOpenRows((prev) => { const n = new Set(prev); if (n.has(s)) n.delete(s); else n.add(s); return n; });

  return (
    <div className="space-y-3" data-arch-sim-options>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>THREE WAYS TO BUILD YOUR HOME</div>
        <span className="text-[9px]" style={{ color: C.dim }}>· Cube · Tiny Home · Eco-Sphere — each scored live from your 3×3 design · tap a card for the details</span>
      </div>

      {/* master compare mode — each form's native method, or ALL as 3D-printed cement (Christo: flag mixed methods) */}
      <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
        <span style={{ color: C.dim }}>Compare as</span>
        {([["native", "As designed"], ["cement", "All 3D-printed · cement"]] as const).map(([mode, lbl]) => {
          const on = mode === "cement" ? allPrintedCement : allNative;
          return (
            <button key={mode} data-arch-sim-method-mode={mode} onClick={() => applyMode(mode)} className="rounded border px-1.5 py-0.5 font-semibold"
              style={{ borderColor: on ? (mode === "cement" ? C.cement : C.cyan) : C.border, color: on ? (mode === "cement" ? C.cement : C.cyan) : C.dim, background: on ? "#0b1220" : "transparent" }}>{lbl}</button>
          );
        })}
        <span style={{ color: C.dim }}>{allPrintedCement ? "· all three 3D-printed in cement" : allNative ? "· as designed: the Eco-Sphere's hex-panel dome; the Cube & Tiny framed" : "· custom — you've changed the options"}</span>
      </div>

      {/* ★ RATINGS + COMPARE — always one tap away (operator IMG-04: 5★ + compare easily accessible) */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-2 py-1.5 text-[9px]" style={{ borderColor: `${C.gold}55`, background: C.panel }} data-arch-sim-ratings>
        <span className="uppercase tracking-wider" style={{ color: C.gold }}>★ Ratings · tap to compare</span>
        {SIM_MODELS.map((m) => { const sc = overallScore(m.id, optsBy[m.id]); return (
          m.catalogPreset
            ? <span key={m.id}><b style={{ color: C.cyan }}>{m.label.split(" ")[0]}</b> <span style={{ color: C.dim }}>stock plan · {usd(catalogSum(m.catalogPreset))} · estimated</span></span>
            : <span key={m.id}><b style={{ color: C.cyan }}>{m.label.split(" ")[0]}</b> <span style={{ color: scoreColor(sc) }}>{stars(Math.round(sc))} {sc.toFixed(1)}</span><span style={{ color: C.dim }}> · {usd(costFor(m, optsBy[m.id], costBy[m.id]))}</span></span>
        ); })}
        <button data-arch-sim-compare-top onClick={() => { setCompare(true); if (typeof document !== "undefined") document.querySelector("[data-arch-sim-compare]")?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
          className="rounded border px-2 py-0.5 font-semibold" style={{ borderColor: C.gold, color: C.gold, background: "#1a1405" }}>
          ▾ Compare all 3
        </button>
      </div>

      {/* 3 model cards */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SIM_MODELS.map((m) => {
          const opt = optsBy[m.id];
          const printed = opt.method === "3d-print";
          const results = SIMS.map((s) => simResult(m.id, s, opt));
          const passed = results.filter((r) => r.status === "PASS").length;
          const avg = overallScore(m.id, opt);
          const basisCol = m.basis === "DERIVED" ? C.green : C.amber;
          const cv = costBy[m.id];
          const bd = costBreakdown(m, opt, cv);
          const roll = bd.total;              // Material / Labor / Markup / Total — the authoritative headline
          const cardTotal = roll.total;
          const perFt2 = costPerFt2(m, opt, cv);   // real market $/ft² (operator 2026-10-30)
          const laborHrs = laborHoursFor(m, opt);  // build-content hours — labor$ = hours × rate
          const laborRate = laborRateFor(m, opt, cv);
          const proRate = proLaborRateFor(m, opt);
          const elems = bd.elements;
          const rem = bd.remainder;           // the four un-itemised sections as one honest reconciling row
          const fx = bd.fixed;                // the Tiny's fixed trailer+appliance equipment row (null for sited forms)
          // THOW terminology (fleet P1#6): a tiny-house-on-wheels sits on a trailer chassis, not a poured foundation
          const elemLabel = (el: string) => (m.id === "tiny" && el === "Foundation" ? "Trailer/chassis" : el);
          // the always-visible bars include the remainder + the fixed row so they visibly sum to the headline; each bar is
          // STACKED Material/Labor/Markup so the "M/L/Markup per element" the reveal promises is shown, not just a total
          const barRows = [
            ...elems.map((e) => ({ label: e.element as string, material: e.material, labor: e.labor, markup: e.markup, usd: e.usd })),
            { label: "Other", material: rem.material, labor: rem.labor, markup: rem.markup, usd: rem.usd },
            ...(fx ? [{ label: fx.label, material: fx.material, labor: fx.labor, markup: fx.markup, usd: fx.usd }] : []),
          ];
          const elemMax = Math.max(...barRows.map((b) => b.usd), 1);
          const assumeOpen = openRows.has("assume:" + m.id);
          const row = (label: string, value: string, metric?: string) => {
            const win = !!metric && compare && winnerOf(metric) === m.id;
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
              {m.catalogPreset ? (() => {
                // R5f — the Tiny Home is a CATALOG PRESET (operator 2026-10-31): the card copy + SEPARATE ASSUMED money lines
                // + the LOFT / SECOND FLOOR switch; NO calculated project cost, NO $/ft², NO build-months, NO stars, NO PASS.
                const pr = m.catalogPreset; const upper = upperBy[m.id] ?? pr.upperDefault;
                return (
                  <div className="mt-1.5 space-y-1" data-arch-sim-catalog={m.id}>
                    {pr.cardLines.map((ln, i) => <div key={i} className="text-[10.5px]" style={{ color: C.text }}>{ln.replace("LOFT or SECOND FLOOR", upper === "loft" ? "LOFT · 140 ft²" : "SECOND FLOOR · 140 ft²")}</div>)}
                    <div className="flex items-center gap-1 text-[9px]">
                      <span style={{ color: C.dim, width: 56 }}>Upper half</span>
                      {(["loft", "second-floor"] as UpperKind[]).map((u) => (
                        <button key={u} data-arch-sim-upper={`${m.id}:${u}`} onClick={() => setUpperBy((st) => ({ ...st, [m.id]: u }))}
                          className="rounded border px-1.5 py-0.5 font-semibold" style={{ borderColor: upper === u ? C.cyan : C.border, color: upper === u ? C.cyan : C.dim, background: upper === u ? "#0b1220" : "transparent" }}>
                          {u === "loft" ? "LOFT" : "SECOND FLOOR"}
                        </button>
                      ))}
                    </div>
                    <div data-arch-sim-catalog-money className="rounded border p-1.5 text-[10px]" style={{ borderColor: C.border, background: C.ground }}>
                      <div className="flex justify-between"><span style={{ color: C.dim }}>House</span><span style={{ color: C.text }}>{usd(pr.money.house)} · ASSUMED</span></div>
                      <div className="flex justify-between"><span style={{ color: C.dim }}>Hookups</span><span style={{ color: C.text }}>{usd(pr.money.hookups)} · ASSUMED</span></div>
                      <div className="flex justify-between"><span style={{ color: C.dim }}>Delivery</span><span style={{ color: C.text }}>{usd(pr.money.delivery)} · ASSUMED</span></div>
                      {upper === "second-floor" && <div className="text-[8.5px]" style={{ color: C.amber }}>· House $57,000 includes a loft — the SECOND FLOOR is NOT CALCULATED, not added in</div>}
                      {pr.notes.map((n, i) => <div key={i} className="text-[8.5px]" style={{ color: C.amber }}>· {n}</div>)}
                      <div className="mt-1 border-t pt-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}>Placed on city utilities · <b>{usd(catalogSum(pr))}</b> · ASSUMED · house + hookups + delivery</div>
                      <div className="text-[8px]" style={{ color: C.dim }}>not a quote · your main home&apos;s plan is untouched</div>
                    </div>
                  </div>
                );
              })() : (<>
              <div className="mt-1.5 space-y-0.5">
                {row("Area", `${m.areaFt2.toLocaleString()} ft² · ${m.layoutLabel}`)}
                {row("Cost", `${usd(cardTotal)} · ${usd(perFt2)}/ft²`, "Cost")}
                {row("Build", `${monthsFor(m, opt)} mo`, "Build time")}
                <div className="flex items-baseline justify-between text-[11px]"><span style={{ color: C.dim }}>Energy</span><span style={{ color: scoreColor(m.energyScore) }}>{stars(m.energyScore)}</span></div>
                <div className="flex items-baseline justify-between text-[11px]"><span style={{ color: C.dim }}>Carbon</span><span style={{ color: scoreColor(carbonFor(m, opt)) }}>{stars(carbonFor(m, opt))}</span></div>
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: basisCol }}>
                <span>{m.basis === "DERIVED" ? "real cost estimate" : "rough estimate"}</span>
                <span style={{ color: C.dim }}>efficiency: estimated</span>
              </div>
              </>)}

              <button data-arch-sim-expand={m.id} onClick={() => toggleExpand(m.id)}
                className="mt-2 w-full rounded border px-2 py-1.5 text-[10px] font-semibold" style={{ borderColor: C.violet, color: C.violet, background: "#1a1030" }}>
                {expanded.has(m.id) ? "▴ Hide details" : "▾ See details"}
              </button>
              {expanded.has(m.id) && (
                <div className="mt-2 space-y-1.5" data-arch-sim-generated={m.id}>
                  {/* the GENERATED environment — drawn with the user's ACTUAL placed furniture from the Design tab (P1) */}
                  <SimEnvironmentView formId={m.id as FormId} opt={opt} size={240} rooms={designRooms} />

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

                  {/* R5f — the catalog preset shows NO calculated cost (its ASSUMED money lines are in the card header above). */}
                  {m.catalogPreset ? (
                    <div data-arch-sim-catalog-costnote className="rounded border p-1.5 text-[9px]" style={{ borderColor: C.border, background: C.ground, color: C.dim }}>
                      Cost: the ASSUMED money lines above — Placed on city utilities <b style={{ color: C.text }}>{usd(catalogSum(m.catalogPreset))}</b>. A catalog preset shows no calculated project cost, $/ft², or star rating.
                    </div>
                  ) : (<>
                  {/* ── COST · Material + Labor + Markup (operator IMG-02/06: see M+L+Markup, adjustable markup, boil it down) ── */}
                  <div data-arch-sim-elements className="rounded border p-1.5" style={{ borderColor: C.border, background: C.ground }}>
                    <div className="mb-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>
                      <span>Cost · Material + Labor + Markup</span><span style={{ color: C.cyan, fontWeight: 700 }}>{usd(cardTotal)}</span>
                    </div>
                    {/* WHO builds — the labour lever (friends/family/veterans ⇒ ≈ $0 labour) */}
                    <div className="flex flex-wrap items-center gap-1 text-[8px]">
                      <span style={{ color: C.dim, width: 38, flexShrink: 0 }}>Labor</span>
                      {(Object.keys(LABOR_MODES) as LaborMode[]).map((lm) => (
                        <button key={lm} data-arch-sim-labor={`${m.id}:${lm}`} title={LABOR_MODES[lm].blurb} onClick={() => setCost(m.id, { laborMode: lm, markup: defaultMarkupFor(lm) })}
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
                            <span style={{ color: C.dim }}>{elemLabel(e.element)}</span>
                            <span style={{ color: C.cyan }}>M {usd(e.material)}</span>
                            <span style={{ color: C.violet }}>L {usd(e.labor)}</span>
                            <span style={{ color: C.gold }}>+{usd(e.markup)}</span>
                            <span style={{ color: C.text, textAlign: "right" }}>{usd(e.usd)}</span>
                          </div>
                        ))}
                        {/* the four un-itemised sections as one honest remainder row — so the rows reconcile EXACTLY to the total */}
                        <div className="grid items-center gap-1 text-[8px]" style={{ gridTemplateColumns: "54px 1fr 1fr 1fr 46px", borderTop: `1px dashed ${C.border}`, paddingTop: 2 }} title="site · permits · drywall · insulation · interior finish · landscaping">
                          <span style={{ color: C.dim }}>Other*</span>
                          <span style={{ color: C.cyan }}>M {usd(rem.material)}</span>
                          <span style={{ color: C.violet }}>L {usd(rem.labor)}</span>
                          <span style={{ color: C.gold }}>+{usd(rem.markup)}</span>
                          <span style={{ color: C.text, textAlign: "right" }}>{usd(rem.usd)}</span>
                        </div>
                        {/* the Tiny's fixed trailer+appliance equipment row — flat, no labour, no markup (a real pass-through) */}
                        {fx && (
                          <div className="grid items-center gap-1 text-[8px]" style={{ gridTemplateColumns: "54px 1fr 1fr 1fr 46px", borderTop: `1px dashed ${C.border}`, paddingTop: 2 }} title="trailer / chassis + appliances — a fixed equipment purchase that volunteer labour does not reduce">
                            <span style={{ color: C.dim }}>Trailer</span>
                            <span style={{ color: C.cyan }}>M {usd(fx.material)}</span>
                            <span style={{ color: C.dim }}>L $0</span>
                            <span style={{ color: C.dim }}>+$0</span>
                            <span style={{ color: C.text, textAlign: "right" }}>{usd(fx.usd)}</span>
                          </div>
                        )}
                        {/* the reconciling subtotal — column sums tie to the waterfall bars and the headline (fleet's top fix) */}
                        <div data-arch-sim-reconcile className="grid items-center gap-1 text-[8px] font-bold" style={{ gridTemplateColumns: "54px 1fr 1fr 1fr 46px", borderTop: `1px solid ${C.border}`, paddingTop: 2 }}>
                          <span style={{ color: C.text }}>Total</span>
                          <span style={{ color: C.cyan }}>M {usd(roll.material)}</span>
                          <span style={{ color: C.violet }}>L {usd(roll.labor)}</span>
                          <span style={{ color: C.gold }}>+{usd(roll.markup)}</span>
                          <span style={{ color: C.text, textAlign: "right" }}>{usd(roll.total)}</span>
                        </div>
                        {/* labour $ = hours × rate — the build steps compliment the Material/Labor/Markup assumptions (operator 2026-10-30) */}
                        <div data-arch-sim-laborrate className="text-[8px]" style={{ color: C.dim }}>Labour {usd(roll.labor)} = <b style={{ color: C.violet }}>{laborHrs.toLocaleString()} h</b> × {cv.laborMode === "volunteer" ? <b style={{ color: C.green }}>$0/h (donated · worth ~${proRate}/h)</b> : <b style={{ color: C.violet }}>${laborRate}/h</b>}.</div>
                        <div className="text-[8px]" style={{ color: C.dim }}>Six major elements + <b style={{ color: C.text }}>Other*</b>{fx ? " + Trailer" : ""} add up EXACTLY to the {usd(roll.total)} total ({usd(perFt2)}/ft²) · {m.basis === "DERIVED" ? "a real market cost estimate" : "a rough estimate"} · labour {LABOR_MODES[cv.laborMode].label.toLowerCase()} · markup {Math.round(cv.markup * 100)}%. Tap <b style={{ color: C.green }}>VOLUNTEER</b> (labour ≈ $0, markup snaps to 0%) for the friends/family/veterans build cost.</div>
                      </div>
                    )}
                    {/* element bars (always visible) — six elements + the Other remainder sum to the headline; each bar is
                        STACKED Material (cyan) · Labor (violet) · Markup (gold) so the per-element M/L/Markup is visible at a glance */}
                    <div className="mt-1.5 space-y-0.5">
                      <div className="flex items-center gap-2 text-[8px]" style={{ color: C.dim }}>
                        <span>cost by element</span>
                        <span style={{ color: C.cyan }}>▮ Material</span><span style={{ color: C.violet }}>▮ Labor</span><span style={{ color: C.gold }}>▮ Markup</span>
                      </div>
                      {barRows.map((b) => (
                        <div key={b.label} className="flex items-center gap-1.5 text-[8px]">
                          <span style={{ color: C.dim, width: 56, flexShrink: 0, fontStyle: b.label === "Other" ? "italic" : "normal" }}>{elemLabel(b.label)}</span>
                          <span className="flex h-2 overflow-hidden rounded-sm" style={{ width: `${Math.max(4, (b.usd / elemMax) * 100)}%` }} title={`${b.label}: Material ${usd(b.material)} · Labor ${usd(b.labor)} · Markup ${usd(b.markup)}`}>
                            {b.usd > 0 ? (<>
                              <span style={{ width: `${(b.material / b.usd) * 100}%`, background: C.cyan }} />
                              <span style={{ width: `${(b.labor / b.usd) * 100}%`, background: C.violet }} />
                              <span style={{ width: `${(b.markup / b.usd) * 100}%`, background: C.gold }} />
                            </>) : <span style={{ width: "100%", background: C.dim }} />}
                          </span>
                          <span style={{ color: C.text, flexShrink: 0 }}>{usd(b.usd)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  </>)}

                  {/* TIME TO BUILD, BY PHASE (calendar months) */}
                  {(() => {
                    const sched = phaseSchedule(m.id, opt);
                    const maxW = Math.max(1, ...sched.map((p) => p.weeks));
                    // option-aware labels so the Framing + Roofing rows name the ACTUAL shell/roof, matching the Build
                    // Instructions panel below (no "Framing" vs "Shell · hex panels" drift on one card — Aset).
                    const phaseName = (id: string, label: string) =>
                      id === "framing" ? (opt.method === "3d-print" ? "Shell·3D-print" : opt.method === "hex-panel" ? "Shell·hex" : `Framing·${opt.frameMaterial}`)
                      : id === "roofing" ? `Roof·${ROOFS[opt.roof].short.toLowerCase()}`
                      : m.id === "tiny" && id === "foundation" ? "Trailer/chassis"   // THOW sits on a trailer, not a foundation (fleet P1#6)
                      : m.id === "tiny" && id === "sewer" ? "Utility hookups"          // a towable tiny uses hookups, not a sewer tie-in
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
                    <span style={{ color: C.dim }}>Overall score</span>
                    <span style={{ color: C.cyan, fontWeight: 700 }}>{avg.toFixed(1)}/5 · passes {passed} of 13</span>
                  </div>
                  <button onClick={() => toggleRow("card:" + m.id)} className="w-full rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: C.green, color: C.green, background: "#0a1f14" }}>
                    {openRows.has("card:" + m.id) ? "▴ Hide the 13 checks" : "▾ See all 13 checks"}
                  </button>
                  {openRows.has("card:" + m.id) && (
                    <div data-arch-sim-strip className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {results.map((r) => (
                        <div key={r.sim} className="flex items-center justify-between text-[9px]" title={SIM_MEANING[r.sim]}>
                          <span style={{ color: C.dim }}>{r.sim}</span>
                          <span style={{ color: r.status === "PASS" ? C.green : C.amber }}>{r.score.toFixed(1)} {stars(r.stars)}</span>
                        </div>
                      ))}
                      <div className="col-span-2 mt-0.5 text-[10px]" style={{ color: C.dim }}>A quick design preview — not a final engineering check.</div>
                    </div>
                  )}

                  {/* BUILD INSTRUCTIONS for this form + option */}
                  <button onClick={() => toggleRow("build:" + m.id)} className="w-full rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: C.violet, color: C.violet, background: "#1a1030" }}>
                    {openRows.has("build:" + m.id) ? "▴ Hide build steps" : "▾ Build steps · for your builder"}
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
          <span className="text-[10px] font-bold tracking-wider" style={{ color: C.cyan }}>THE 13 CHECKS · SIDE BY SIDE</span>
          <span className="text-[9px]" style={{ color: C.dim }}>· every design scored live · tap a check for the details · ✦ = best</span>
        </div>
        <div className="overflow-x-auto" data-arch-sim-matrix>
          <div style={{ minWidth: 300 }}>
            <div className="grid items-end gap-1 pb-1.5" style={{ gridTemplateColumns: cols }}>
              <div className="self-center text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>13 checks · 0–5</div>
              {SIM_MODELS.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-0.5">
                  <span className="rounded border p-1" style={{ borderColor: C.border, background: C.ground }}><FormGlyph id={m.id} size={26} /></span>
                  <span className="text-center text-[9px] font-bold leading-tight" style={{ color: C.cyan }}>{m.label}</span>
                  <span className="text-[8px]" style={{ color: scoreColor(overallScore(m.id, optsBy[m.id])) }}>avg {overallScore(m.id, optsBy[m.id]).toFixed(1)}</span>
                </div>
              ))}
            </div>
            {matrix.map((rw) => {
              const isOpen = openRows.has(rw.sim);
              return (
                <div key={rw.sim} data-arch-sim-row={rw.sim} className="border-t" style={{ borderColor: "#0f1724" }}>
                  <button onClick={() => toggleRow(rw.sim)} title={SIM_MEANING[rw.sim]} className="grid w-full items-center gap-1 py-1 text-left" style={{ gridTemplateColumns: cols }}>
                    <span className="text-[10px]" style={{ color: C.text }}>{isOpen ? "▾ " : "▸ "}{rw.sim}</span>
                    {rw.cells.map((c) => {
                      const win = c.modelId === rw.winnerId;
                      return (
                        <span key={c.modelId} data-arch-sim-cell className="flex flex-col items-center leading-none">
                          <span className="text-[11px] font-semibold" style={{ color: scoreColor(c.score) }}>{win ? "✦ " : ""}{c.score.toFixed(1)}</span>
                          <span className="mt-0.5 text-[8px]" style={{ color: scoreColor(c.stars) }}>{stars(c.stars)}</span>
                        </span>
                      );
                    })}
                  </button>
                  {isOpen && (
                    <div className="pb-1.5">
                      <div className="px-1 pb-1 text-[9px]" style={{ color: C.cyan }}>{SIM_MEANING[rw.sim]}</div>
                      <div className="grid gap-1" style={{ gridTemplateColumns: cols }}>
                        <span className="self-start text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>details <span style={{ color: C.amber }}>· est.</span></span>
                        {rw.cells.map((c) => (
                          <div key={c.modelId} className="space-y-0.5">
                            {c.metrics.map((mt) => (
                              <div key={mt.label} className="text-center text-[8px] leading-tight">
                                <div style={{ color: C.dim }}>{mt.label}</div>
                                <div style={{ color: C.text }}>{mt.value}</div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 space-y-0.5">
          <div className="text-[10px]" style={{ color: C.dim }}>Every design scored 0–5, with the details behind each check. A quick design preview — not a final engineering check.</div>
          <div className="text-[10px]" style={{ color: C.amber }}>⚠ Energy and Carbon are estimates based on the design. Only the Cube&apos;s cost comes from the full cost calculator; the others are rough estimates. Material trade-offs are shown honestly — cement: stronger and fire-resistant, but a bigger upfront climate footprint; composite: stronger, lighter, lower footprint; steel/aluminum: stronger, higher footprint.</div>
        </div>
      </div>

      {/* BUILD INSTRUCTIONS · four-path project timeline (the operator's headline compare) */}
      <BuildTimelineCompare />

      {/* the original 13-sim battery — run on EVERY model */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 text-[9px] uppercase tracking-wider" style={{ color: C.dim }}>The 13 checks · run on every design</div>
        <div className="flex flex-wrap gap-1">
          {SIMS.map((s, i) => (
            <span key={s} data-sim title={SIM_MEANING[s]} className="rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: `${SIM_RAINBOW[i]}66`, color: SIM_RAINBOW[i] }}>{s}</span>
          ))}
        </div>
      </div>

      {/* COMPARE ALL — always live (no run gate) */}
      <button data-arch-sim-compare onClick={() => setCompare((v) => !v)} className="rounded border px-3 py-1 text-[11px] font-semibold"
        style={{ borderColor: compare ? C.gold : C.cyan, color: compare ? C.gold : C.cyan, background: compare ? "#1a1405" : "#07202a" }}>
        {compare ? "✦ Comparing — best starred per measure" : "▸ Compare all 3 — rank by cost · time · energy · carbon · overall"}
      </button>
      {compare && (
        <div className="rounded-lg border p-2 text-[10px]" style={{ borderColor: `${C.gold}55`, background: C.panel }}>
          <div className="mb-1 rounded px-2 py-1.5 text-[11px]" style={{ background: C.ground, border: `1px solid ${C.gold}55` }}>
            <span style={{ color: C.dim }}>Best overall → </span>
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
            <span style={{ color: C.dim }}>Overall (13 checks)</span>
            <span style={{ color: C.gold }}>✦ {rec.label} · {rec.avg.toFixed(1)}</span>
          </div>
          <div className="mt-1 text-[10px]" style={{ color: C.dim }}>Lower cost &amp; time win; higher energy, carbon &amp; overall win. Estimates — not a quote.</div>
        </div>
      )}
    </div>
  );
}
