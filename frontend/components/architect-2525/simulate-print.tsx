"use client";

/**
 * ARCHITECT-2525 · SIMULATE → DOWNLOAD AS PDF (operator 2026-11-03: "ensure simulation tab prints visuals; see PDF
 * downloads from Vision-2525 and SoI-2525 export of S1–S18 to see lessons learned there").
 * =================================================================================================================
 * The on-screen Simulate tab's visuals (the SimEnvironmentView floor-plan mockups + the cost/phase bars + the
 * per-form 13 checks) were collapsed behind "See details" and the shell is a fixed overlay, so a browser Ctrl-P
 * produced ONE page of text. This module adds the proven SoI-2525 S1–S18 export idiom to the Simulate tab:
 *   • ZERO dependencies — the browser's own print engine (`window.print()`), no jsPDF/html2canvas (honours the
 *     Vision-2525 no-runtime-fetch / determinism rule — no server round-trip).
 *   • An OFF-STAGE print-stack portal (ReactDOM.createPortal → document.body), rendered only while printing, so
 *     `body > *:not(.sim-print-stack){display:none}` neutralises the fixed z-[70] overlay (SoI pattern).
 *   • Live INLINE SVG (SimEnvironmentView) prints as vectors — no rasterisation. The cost/phase bars are SOLID
 *     colours, so `print-color-adjust:exact` alone carries them (no flat-undercoat needed — Architect has no
 *     `url(#gradient)` fills, unlike the SoI charts).
 *   • A DECK: a compare page (3 cards + the 13-CHECKS matrix + build-time) then one page per home (Cube / Tiny /
 *     Eco-Sphere) with its big mockup + cost waterfall + element bars + phase bars + its 13 checks.
 *   • RESPONSIVE orientation, user-defined at print (operator: "both should render just like phone vs pc"): `@page`
 *     carries NO orientation keyword, so the user's dialog choice wins, and `@media print and (orientation: …)`
 *     branches reflow the deck (portrait stacks the cards, landscape rows them) — the app's phone↔PC behaviour.
 *
 * PDF == screen by construction: the stack closes over the SAME live state (optsBy/costBy/upperBy/designRooms) and
 * reads the SAME pure engine functions the cards use (costBreakdown/catalogSum/simResult/phaseSchedule/…) — only
 * presentation markup is added; NO number is re-derived, so the $240k one-cost-truth is untouched. FormGlyph and the
 * 13-check meanings are passed in as props to avoid a circular import with simulate-options.tsx.
 *
 * Print colours are authored LIGHT-on-white here (dark `ink`/`dim` text) so the deck reads on paper; the vivid DATA
 * colours (bar cyan/violet/gold, the red→green score scale) and the SVG mockup's own dark ground are kept as-is.
 */
import { useEffect, useState, type JSX } from "react";
import { createPortal } from "react-dom";
import {
  SIMS, ROOFS, costBreakdown, costPerFt2, catalogSum, carbonFor, monthsFor, overallScore, phaseSchedule, simResult,
  type SimModel, type BuildOption, type CostParams, type UpperKind, type MetricRank, type SimMatrixRow, type Recommendation,
} from "@/lib/architect-sim-options";
import { SimEnvironmentView } from "./sim-environment-view";
import { type FormId } from "@/lib/architect-sim-environment";
import { type RoomCell } from "@/lib/room-layout";

// Data colours — identical to the screen so the bars/scores match (the one-truth palette, print-safe on white).
const D = { cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", ground: "#070b12" };
// Print ink — authored for a white page (the screen's light-grey text would vanish on paper).
const P = { ink: "#111827", dim: "#475569", line: "#cbd5e1", soft: "#64748b", head: "#0e7490", page: "#ffffff" };
const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const stars = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
const SCORE_COLORS = ["#ef4444", "#ef4444", "#f97316", "#eab308", "#22c55e", "#15803d"]; // 0..5 — same as the screen
const scoreColor = (n: number) => SCORE_COLORS[Math.max(0, Math.min(5, Math.round(n)))];

/** The print stylesheet — the SoI SLIDE_PRINT_CSS idiom, scoped to `.sim-print-*`, with NO pinned orientation so the
 *  user's dialog choice wins, plus both orientation branches so the deck reflows (portrait stacks / landscape rows). */
export const SIM_PRINT_CSS = `
.sim-print-stack { display: none; }
/* off-stage (NOT display:none) so the synchronous print can lay the SVG mockups out and measure them */
.sim-print-offstage { position: fixed; top: 0; left: -30000px; width: 760px; opacity: 0; pointer-events: none; }
@media print {
  @page { size: letter; margin: 0.5in; }          /* REAL paper; NO orientation keyword — the user's dialog choice wins */
  html, body { background: #fff !important; height: auto !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body > *:not(.sim-print-stack) { display: none !important; }   /* kill the fixed z-[70] overlay + the app root (removed from FLOW) */
  .sim-print-stack { position: static !important; display: block !important; left: auto !important; top: auto !important; width: 100% !important; opacity: 1 !important; color: ${P.ink}; }
  .sim-print-stack * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }   /* solid CSS-bg bars survive without the user toggling "Background graphics" */
  .sim-print-stack button, .sim-print-stack [data-noprint] { display: none !important; }  /* no chrome on paper */
  /* one page per section — BOTH modern and legacy break props for WebKit/iOS (operator prints from iOS Chrome) */
  .sim-print-page { position: relative !important; break-inside: avoid; page-break-inside: avoid; break-after: page; page-break-after: always; overflow: hidden; padding-bottom: 6px; }
  .sim-print-page:last-child { break-after: auto; page-break-after: auto; }
  .sim-print-page + .sim-print-page { break-before: page; page-break-before: always; }
  .sim-print-env svg { width: 100% !important; height: auto !important; }
}
/* ONE PAGE PER DESIGN. The 3 compare cards sit three-across; each home is a 2-column card (mockup | details) with
   its 13-CHECKS band — the portrait look the operator approved ("Attachment was perfect"). Portrait pages are tall
   (10in), so that stacks to one page as-is. LANDSCAPE pages are SHORT (7.5in): the per-home page spilled because the
   DETAILS column (headline + cost + phase, ~500px), NOT the mockup, sets the height, and the full-width 13-CHECKS
   band (~145px) then pushed the page over 720px. So shrinking the mockup saved ~0 (the earlier cap was a red herring).
   The fix (operator 2026-11-03 "landscape still has errors") is landscape-ONLY: move the 13-CHECKS into a RIGHT RAIL
   beside the form, reclaiming that band. The mockup is NOT shrunk; PORTRAIT is left byte-identical. The user still
   picks the orientation in the print dialog. */
.sim-print-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.sim-print-form { display: grid; grid-template-columns: 1fr 1.15fr; gap: 14px; align-items: start; }
.sim-print-env { max-width: 100%; margin: 0 auto; }
@media print and (orientation: portrait) {
  .sim-print-cards { gap: 8px; }
  .sim-print-env { max-width: 100%; }   /* the portrait page is tall (10in) — the mockup runs the full column */
}
@media print and (orientation: landscape) {
  /* the per-home page becomes  head / [form | 13-checks rail] / foot , so the checks no longer add a vertical band */
  .sim-print-home { display: grid; grid-template-columns: 1fr 232px; grid-template-areas: "head head" "body rail" "foot foot"; column-gap: 12px; align-items: start; }
  .sim-print-home > .home-head { grid-area: head; }
  .sim-print-home > .sim-print-form { grid-area: body; }
  .sim-print-home > .sim-print-checks { grid-area: rail; margin-top: 0; }
  .sim-print-home > .home-foot { grid-area: foot; }
  .sim-print-home .sim-checks-grid { grid-template-columns: 1fr !important; }   /* the rail is one column of 13 rows */
  /* the COMPARE page is short in landscape too: lay the tall 13-CHECKS matrix BESIDE the best-pick + time-to-build
     (the matrix spans both rows), under the full-width cards — so page 1 is one page as well (measured 748→~540px). */
  .sim-print-compare-lower { display: grid; grid-template-columns: 1fr 1.15fr; grid-template-areas: "best matrix" "time matrix"; column-gap: 10px; align-items: start; }
  .sim-print-compare-lower > .cmp-best { grid-area: best; margin-top: 0 !important; }
  .sim-print-compare-lower > .cmp-time { grid-area: time; margin-top: 8px !important; }
  .sim-print-compare-lower > .cmp-matrix { grid-area: matrix; margin-top: 0 !important; }
}
`;

/** `window.print()` driver — 3×rAF so the off-stage tree is committed before the synchronous print (SoI timing),
 *  and `afterprint` unmounts the stack. */
export function useSimPrint() {
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    const done = () => setPrinting(false);
    if (typeof window !== "undefined") window.addEventListener("afterprint", done);
    return () => { if (typeof window !== "undefined") window.removeEventListener("afterprint", done); };
  }, []);
  const printNow = () => {
    setPrinting(true);
    requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      if (typeof window !== "undefined") window.print();
    })));
  };
  return { printing, printNow };
}

type GlyphComp = (p: { id: string; size?: number }) => JSX.Element;

// ── small print-native presentational helpers (read the engine's values; derive no cost) ──────────────────────
function Row({ label, value, win }: { label: string; value: string; win?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 12, padding: "1px 0" }}>
      <span style={{ color: P.dim }}>{label}</span>
      <span style={{ color: win ? "#b45309" : P.ink, fontWeight: win ? 700 : 500 }}>{win ? "✦ " : ""}{value}</span>
    </div>
  );
}
/** One stacked Material/Labor/Markup bar (same shape as the screen's element bars), sized by `usd/max`. */
function StackBar({ label, material, labor, markup, usd: amt, max }: { label: string; material: number; labor: number; markup: number; usd: number; max: number }) {
  const w = Math.max(4, (amt / max) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, padding: "1px 0" }}>
      <span style={{ color: P.dim, width: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ display: "flex", height: 8, width: `${w}%`, overflow: "hidden", borderRadius: 2, border: `1px solid ${P.line}` }}>
        {amt > 0 ? (<>
          <span style={{ width: `${(material / amt) * 100}%`, background: D.cyan }} />
          <span style={{ width: `${(labor / amt) * 100}%`, background: D.violet }} />
          <span style={{ width: `${(markup / amt) * 100}%`, background: D.gold }} />
        </>) : <span style={{ width: "100%", background: P.line }} />}
      </span>
      <span style={{ color: P.ink, flexShrink: 0 }}>{usd(amt)}</span>
    </div>
  );
}
/** One 13-CHECKS score cell whose NUMBER keeps its column whether or not the ✦ best-marker is in front (operator
 *  2026-11-03: "ensure numbers are aligned top to bottom even though PDF HAS * in front for best"). A fixed-width
 *  marker slot (blank when not best) + tabular-nums + a centred [marker | number] pair = the number sits at the same
 *  x in every row. */
function MatrixScore({ score, win }: { score: number; win: boolean }) {
  return (
    <span style={{ display: "grid", gridTemplateColumns: "0.8em auto", justifyContent: "center", columnGap: 2, alignItems: "baseline", fontSize: 10, fontVariantNumeric: "tabular-nums", color: scoreColor(score), fontWeight: win ? 700 : 400 }}>
      <span aria-hidden style={{ textAlign: "right" }}>{win ? "✦" : ""}</span>
      <span>{score.toFixed(1)}</span>
    </span>
  );
}
function PageFoot({ n, of }: { n: number; of: number }) {
  // date only, no clock math — a component render may read the wall clock
  const d = new Date().toISOString().slice(0, 10);
  return (
    <div style={{ marginTop: 8, paddingTop: 4, borderTop: `1px solid ${P.line}`, display: "flex", justifyContent: "space-between", fontSize: 8, color: P.soft }}>
      <span>ARCHITECT-2525 · Simulate — three ways to build your home · estimates, not a quote</span>
      <span>p{n}/{of} · {d}</span>
    </div>
  );
}

/** The five headline rows for one home — the SAME values the on-screen card shows (catalog-honest cost for the Tiny). */
function HeadlineRows({ m, opt, cv, winCost }: { m: SimModel; opt: BuildOption; cv: CostParams; winCost?: boolean }) {
  const preset = m.catalogPreset;
  const headlineCost = preset ? catalogSum(preset) : costBreakdown(m, opt, cv).total.total;
  const perFt2 = preset ? (m.areaFt2 > 0 ? Math.round(catalogSum(preset) / m.areaFt2) : 0) : costPerFt2(m, opt, cv);
  const basisLabel = preset ? "catalog stock plan" : m.basis === "DERIVED" ? "real cost estimate" : "rough estimate";
  return (
    <div>
      <Row label="Area" value={`${m.areaFt2.toLocaleString()} ft² · ${m.layoutLabel}`} />
      <Row label="Cost" value={`${usd(headlineCost)} · ${usd(perFt2)}/ft²`} win={winCost} />
      <Row label="Build" value={`${monthsFor(m, opt)} mo`} />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0" }}><span style={{ color: P.dim }}>Energy</span><span style={{ color: scoreColor(m.energyScore) }}>{stars(m.energyScore)}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "1px 0" }}><span style={{ color: P.dim }}>Carbon</span><span style={{ color: scoreColor(carbonFor(m, opt)) }}>{stars(carbonFor(m, opt))}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.5, color: basisLabel === "real cost estimate" ? "#15803d" : P.soft, marginTop: 2 }}>
        <span>{basisLabel}</span><span>efficiency: estimated</span>
      </div>
    </div>
  );
}

export function SimulatePrintStack({ models, optsBy, costBy, upperBy, designRooms, ranks, rec, matrix, FormGlyph, simMeaning }: {
  models: SimModel[];
  optsBy: Record<string, BuildOption>;
  costBy: Record<string, CostParams>;
  upperBy: Record<string, UpperKind>;
  designRooms?: RoomCell[] | null;
  ranks: MetricRank[];
  rec: Recommendation;
  matrix: SimMatrixRow[];
  FormGlyph: GlyphComp;
  simMeaning: Record<string, string>;
}) {
  if (typeof document === "undefined") return null;
  const costWinner = ranks.find((r) => r.metric === "Cost")?.winnerId;
  const pageCount = models.length + 1;
  const panel = { border: `1px solid ${P.line}`, borderRadius: 8, padding: 8, background: P.page } as const;

  return createPortal(
    <div className="sim-print-stack sim-print-offstage" aria-hidden style={{ background: "#fff", color: P.ink, padding: 0 }}>
      {/* ── PAGE 1 · COMPARE ── */}
      <section className="sim-print-page" style={{ padding: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: 1, color: P.head }}>THREE WAYS TO BUILD YOUR HOME</div>
        <div style={{ fontSize: 10, color: P.dim, marginBottom: 8 }}>Cube · Tiny Home · Eco-Sphere — each scored live from your 3×3 design. Estimates, not a quote.</div>
        <div className="sim-print-cards">
          {models.map((m) => (
            <div key={m.id} style={panel}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ border: `1px solid ${P.line}`, borderRadius: 4, padding: 2, background: D.ground }}><FormGlyph id={m.id} size={22} /></span>
                <span style={{ fontSize: 13, fontWeight: 700, color: P.head }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 9, color: P.soft, marginBottom: 4 }}>{m.form}</div>
              <HeadlineRows m={m} opt={optsBy[m.id]} cv={costBy[m.id]} winCost={costWinner === m.id} />
            </div>
          ))}
        </div>

        {/* best-overall + the 13-CHECKS matrix + time-to-build — stacked in portrait, a 2-col grid in landscape */}
        <div className="sim-print-compare-lower">
        {/* best overall */}
        <div className="cmp-best" style={{ ...panel, marginTop: 8, borderColor: "#f59e0b" }}>
          <span style={{ color: P.dim, fontSize: 11 }}>Best overall → </span>
          <span style={{ color: "#b45309", fontWeight: 700, fontSize: 12 }}>✦ {rec.label}</span>
          <div style={{ fontSize: 9, color: P.dim, marginTop: 2 }}>{rec.reason}</div>
        </div>

        {/* the 13 checks, side by side */}
        <div className="cmp-matrix" style={{ ...panel, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: P.head, marginBottom: 4 }}>THE 13 CHECKS · SIDE BY SIDE <span style={{ color: P.soft, fontWeight: 400 }}>· ✦ = best · 0–5</span></div>
          <div style={{ display: "grid", gridTemplateColumns: `minmax(90px,1.3fr) repeat(${models.length}, 1fr)`, alignItems: "end", gap: 4, paddingBottom: 4, borderBottom: `1px solid ${P.line}` }}>
            <span style={{ fontSize: 8, color: P.soft, textTransform: "uppercase" }}>check</span>
            {models.map((m) => (
              <span key={m.id} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: P.head }}>{m.label.split(" ")[0]}</span>
            ))}
          </div>
          {matrix.map((rw) => (
            <div key={rw.sim} style={{ display: "grid", gridTemplateColumns: `minmax(90px,1.3fr) repeat(${models.length}, 1fr)`, gap: 4, alignItems: "center", padding: "2px 0", borderTop: `1px solid #eef2f7` }} title={simMeaning[rw.sim]}>
              <span style={{ fontSize: 10, color: P.ink }}>{rw.sim}</span>
              {rw.cells.map((c) => (
                <MatrixScore key={c.modelId} score={c.score} win={c.modelId === rw.winnerId} />
              ))}
            </div>
          ))}
        </div>

        {/* time to build — all three */}
        <div className="cmp-time" style={{ ...panel, marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: P.head, marginBottom: 4 }}>TIME TO BUILD</div>
          {(() => {
            const mo = models.map((m) => ({ m, months: monthsFor(m, optsBy[m.id]) }));
            const max = Math.max(1, ...mo.map((x) => x.months));
            return mo.map(({ m, months }) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, padding: "1px 0" }}>
                <span style={{ color: P.dim, width: 96, flexShrink: 0 }}>{m.label}</span>
                <span style={{ height: 8, borderRadius: 2, background: D.violet, width: `${Math.max(4, (months / max) * 100)}%` }} />
                <span style={{ color: P.ink, flexShrink: 0 }}>{months} mo</span>
              </div>
            ));
          })()}
        </div>
        </div>
        <PageFoot n={1} of={pageCount} />
      </section>

      {/* ── PAGES 2..N · ONE PER HOME ── */}
      {models.map((m, i) => {
        const opt = optsBy[m.id]; const cv = costBy[m.id];
        const preset = m.catalogPreset;
        const bd = costBreakdown(m, opt, cv); const roll = bd.total;
        const barRows = [
          ...bd.elements.map((e) => ({ label: e.element as string, material: e.material, labor: e.labor, markup: e.markup, usd: e.usd })),
          { label: "Other", material: bd.remainder.material, labor: bd.remainder.labor, markup: bd.remainder.markup, usd: bd.remainder.usd },
          ...(bd.fixed ? [{ label: bd.fixed.label, material: bd.fixed.material, labor: bd.fixed.labor, markup: bd.fixed.markup, usd: bd.fixed.usd }] : []),
        ];
        const elemMax = Math.max(...barRows.map((b) => b.usd), 1);
        const sched = phaseSchedule(m.id, opt);
        const schedMax = Math.max(1, ...sched.map((p) => p.weeks));
        const results = SIMS.map((s) => simResult(m.id, s, opt));
        const avg = overallScore(m.id, opt);
        const passed = results.filter((r) => r.status === "PASS").length;
        const upper = (upperBy[m.id] ?? preset?.upperDefault) as UpperKind | undefined;
        return (
          <section className="sim-print-page sim-print-home" key={m.id} style={{ padding: 4 }}>
            <div className="home-head" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ border: `1px solid ${P.line}`, borderRadius: 4, padding: 3, background: D.ground }}><FormGlyph id={m.id} size={30} /></span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: P.head }}>{m.label}</div>
                <div style={{ fontSize: 9, color: P.soft }}>{m.form}</div>
              </div>
            </div>
            <div className="sim-print-form">
              {/* the generated floor-plan mockup — live inline SVG */}
              <div className="sim-print-env" style={{ marginBottom: 8 }}>
                <SimEnvironmentView formId={m.id as FormId} opt={opt} size={520} rooms={designRooms} />
                <div style={{ fontSize: 8, color: P.soft, marginTop: 2 }}>The home drawn from your 3×3 design — furniture from the Design tab.</div>
              </div>
              <div>
                <div style={{ ...panel, marginBottom: 8 }}><HeadlineRows m={m} opt={opt} cv={cv} /></div>

                {/* COST — the catalog money block for a preset, else the waterfall + element bars */}
                {preset ? (
                  <div style={{ ...panel, marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: P.head, marginBottom: 2 }}>Catalog stock plan — ASSUMED</div>
                    <Row label="House" value={`${usd(preset.money.house)} · ASSUMED`} />
                    <Row label="Hookups" value={`${usd(preset.money.hookups)} · ASSUMED`} />
                    <Row label="Delivery" value={`${usd(preset.money.delivery)} · ASSUMED`} />
                    <div style={{ borderTop: `1px solid ${P.line}`, marginTop: 3, paddingTop: 3, fontSize: 11, color: P.ink }}>Placed on city utilities · <b>{usd(catalogSum(preset))}</b> · house + hookups + delivery</div>
                    <div style={{ fontSize: 8, color: P.soft, marginTop: 2 }}>Upper half: {upper === "second-floor" ? "SECOND FLOOR · 140 ft² (not calculated — house includes a loft)" : "LOFT · 140 ft²"}. Not a quote; your main home&apos;s plan is untouched.</div>
                  </div>
                ) : (
                  <div style={{ ...panel, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: P.head, marginBottom: 3 }}><span>Cost · Material + Labor + Markup</span><span>{usd(roll.total)}</span></div>
                    <div style={{ fontSize: 8, color: P.soft, marginBottom: 3 }}><span style={{ color: D.cyan }}>▮ Material</span> <span style={{ color: D.violet }}>▮ Labor</span> <span style={{ color: D.gold }}>▮ Markup</span></div>
                    {barRows.map((b) => <StackBar key={b.label} label={m.id === "tiny" && b.label === "Foundation" ? "Trailer/chassis" : b.label} material={b.material} labor={b.labor} markup={b.markup} usd={b.usd} max={elemMax} />)}
                    <div style={{ fontSize: 8, color: P.soft, marginTop: 3 }}>Six major elements + Other{bd.fixed ? " + Trailer" : ""} add up to {usd(roll.total)} ({usd(costPerFt2(m, opt, cv))}/ft²) · {m.basis === "DERIVED" ? "a real market cost estimate" : "a rough estimate"}.</div>
                  </div>
                )}

                {/* TIME TO BUILD — by phase */}
                <div style={{ ...panel, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: P.head, marginBottom: 3 }}><span>Time to build · by phase</span><span>{monthsFor(m, opt)} mo total</span></div>
                  {sched.map((p) => (
                    <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9, padding: "1px 0" }}>
                      <span style={{ color: P.dim, width: 80, flexShrink: 0 }}>
                        {p.id === "framing" ? (opt.method === "3d-print" ? "Shell·3D-print" : opt.method === "hex-panel" ? "Shell·hex" : `Wall·${opt.frameMaterial}`)
                          : p.id === "roofing" ? `Roof·${ROOFS[opt.roof].short.toLowerCase()}`
                          : m.id === "tiny" && p.id === "foundation" ? "Trailer/chassis"
                          : m.id === "tiny" && p.id === "sewer" ? "Utility hookups" : p.label}
                      </span>
                      <span style={{ height: 8, borderRadius: 2, background: p.color, width: `${Math.max(3, (p.weeks / schedMax) * 100)}%` }} />
                      <span style={{ color: p.color, flexShrink: 0 }}>{p.weeks}w</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* the 13 checks for this home — a right rail in landscape (one column), the full-width band in portrait */}
            <div className="sim-print-checks" style={{ ...panel }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontWeight: 700, color: P.head, marginBottom: 3 }}><span>The 13 checks</span><span>{avg.toFixed(1)}/5 · passes {passed} of 13</span></div>
              <div className="sim-checks-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 16px" }}>
                {results.map((r) => (
                  <div key={r.sim} style={{ display: "flex", justifyContent: "space-between", fontSize: 9 }} title={simMeaning[r.sim]}>
                    <span style={{ color: P.dim }}>{r.sim}</span>
                    <span style={{ color: r.status === "PASS" ? D.green : D.amber }}>{r.score.toFixed(1)} {stars(r.stars)}</span>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 8, color: P.soft, marginTop: 2 }}>A quick design preview — not a final engineering check.</div>
            </div>
            <div className="home-foot"><PageFoot n={i + 2} of={pageCount} /></div>
          </section>
        );
      })}
    </div>,
    document.body,
  );
}
