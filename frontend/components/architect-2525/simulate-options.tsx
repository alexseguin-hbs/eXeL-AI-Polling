"use client";

/**
 * ARCHITECT-2525 · SIMULATE — ALTERNATIVE DESIGN OPTIONS (operator 2026-10-25/27).
 * The SAME 900 ft² home, three ways — Cube (3×3) · Tiny Home (open) · Eco-Sphere (7-hex dome) — all carrying the same
 * nine rooms + conserved furniture. Pressing a form's SIMULATE **creates that environment** (renders the real furnished
 * floor-plan mockup) AND runs the original 13-sim battery (0–5 + metrics). A framing toggle converts each form to
 * 3D-PRINTED CEMENT (the ICON hook; hex is native), re-costing + re-scoring honestly. The TEST MATRIX scores the
 * simulated forms side by side; COMPARE (once all three are simulated) gives one balanced pick.
 *
 * ONE honest story: nothing is scored until you SIMULATE it (the button is the generator, not decorative). Cube cost is
 * DERIVED; Tiny + Eco ASSUMED; every result is a deterministic ESTIMATE/preview, not an engineering analysis.
 */
import { useMemo, useState } from "react";
import { SIM_MODELS, SIMS, FRAMING, compareModels, costFor, monthsFor, overallScore, recommendation, simResult, type Framing } from "@/lib/architect-sim-options";
import { SimEnvironmentView } from "./sim-environment-view";
import type { FormId } from "@/lib/architect-sim-environment";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", red: "#f87171", ground: "#070b12", cement: "#9aa7b4" };
const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const stars = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);

/** The tiny form glyph for the 70px matrix column heads (the big furnished mockups live in the cards). */
function FormGlyph({ id, size = 26 }: { id: string; size?: number }) {
  const st = { width: size, height: size, display: "block" } as const;
  if (id === "tiny") {
    return (
      <svg viewBox="0 0 32 32" style={st} fill="none" stroke={C.cyan} strokeWidth={1.5} aria-hidden>
        <path d="M6 15 L16 6 L26 15" vectorEffect="non-scaling-stroke" />
        <rect x="8" y="15" width="16" height="12" vectorEffect="non-scaling-stroke" />
        <rect x="13" y="19" width="6" height="8" stroke={C.violet} vectorEffect="non-scaling-stroke" />
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
  const [framingBy, setFramingBy] = useState<Record<string, Framing>>(() => Object.fromEntries(SIM_MODELS.map((m) => [m.id, m.framing])) as Record<string, Framing>);
  const [compare, setCompare] = useState(false);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());

  const allSimulated = SIM_MODELS.every((m) => simulated.has(m.id));
  const ranks = useMemo(() => compareModels(), []);
  const rec = useMemo(() => recommendation(), []);
  const winnerOf = (metric: string) => ranks.find((r) => r.metric === metric)?.winnerId;
  const cols = `minmax(66px,1.1fr) repeat(${SIM_MODELS.length}, minmax(70px,1fr))`;

  // matrix: scores per model at its CURRENT framing; a cell reads "—" until that model is simulated (one honest story)
  const matrix = useMemo(() => SIMS.map((sim) => {
    const cells = SIM_MODELS.map((m) => { const r = simResult(m.id, sim, framingBy[m.id]); return { modelId: m.id, label: m.label, score: r.score, stars: r.stars, status: r.status, metrics: r.metrics }; });
    const simd = cells.filter((c) => simulated.has(c.modelId));
    const winnerId = simd.length >= 2 ? simd.reduce((a, b) => (b.score > a.score ? b : a)).modelId : null;
    return { sim, cells, winnerId };
  }), [framingBy, simulated]);

  const simulate = (id: string) => setSimulated((s) => new Set(s).add(id));
  const simulateAll = () => setSimulated(new Set(SIM_MODELS.map((m) => m.id)));
  const setFraming = (id: string, f: Framing) => setFramingBy((s) => ({ ...s, [id]: f }));
  const toggleRow = (s: string) => setOpenRows((prev) => { const n = new Set(prev); if (n.has(s)) n.delete(s); else n.add(s); return n; });

  return (
    <div className="space-y-3" data-arch-sim-options>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>SIMULATE · ALTERNATIVE DESIGN OPTIONS</div>
        <span className="text-[9px]" style={{ color: C.dim }}>· the same 900 ft² home, three ways — press SIMULATE to build each environment + score it</span>
        {!allSimulated && (
          <button data-arch-sim-all onClick={simulateAll} className="rounded border px-2 py-0.5 text-[9px] font-semibold" style={{ borderColor: C.violet, color: C.violet, background: "#1a1030" }}>◉ SIMULATE ALL</button>
        )}
      </div>

      {/* 3 model cards — press SIMULATE to CREATE the environment + run the battery */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SIM_MODELS.map((m) => {
          const fr = framingBy[m.id];
          const isSim = simulated.has(m.id);
          const cement = fr === "3d-printed-cement";
          const results = isSim ? SIMS.map((s) => simResult(m.id, s, fr)) : [];
          const passed = results.filter((r) => r.status === "PASS").length;
          const avg = overallScore(m.id, fr);
          const basisCol = m.basis === "DERIVED" ? C.green : C.amber;
          const open = openRows.has("card:" + m.id);
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
                {row("Area", `${m.areaFt2.toLocaleString()} ft² · ${m.rooms} rm`)}
                {row("Cost", usd(costFor(m, fr)), "Cost")}
                {row("Build", `${monthsFor(m, fr)} mo`, "Build time")}
                {row("Energy", stars(m.energyScore), "Energy")}
                {row("Carbon", stars(m.carbonScore), "Carbon")}
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
                  {/* the GENERATED environment — the home's furniture placed in this form */}
                  <SimEnvironmentView formId={m.id as FormId} framing={fr} size={240} />
                  {/* framing toggle — convert to 3D-printed cement (the ICON hook) */}
                  <div className="flex items-center gap-1 text-[9px]">
                    <span style={{ color: C.dim }}>Framing</span>
                    {(["stick-framed", "3d-printed-cement"] as Framing[]).map((f) => (
                      <button key={f} data-arch-sim-framing={`${m.id}:${f}`} onClick={() => setFraming(m.id, f)}
                        className="rounded border px-1.5 py-0.5 font-semibold"
                        style={{ borderColor: fr === f ? (f === "3d-printed-cement" ? C.cement : C.cyan) : C.border, color: fr === f ? (f === "3d-printed-cement" ? C.cement : C.cyan) : C.dim, background: fr === f ? "#0b1220" : "transparent" }}>
                        {FRAMING[f].short}{f === "3d-printed-cement" && m.cementNative ? "·native" : ""}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center justify-between rounded px-1.5 py-1 text-[10px]" style={{ background: C.ground }}>
                    <span style={{ color: C.dim }}>13-sim avg</span>
                    <span style={{ color: C.cyan, fontWeight: 700 }}>{avg.toFixed(1)}/5 · {passed}/13 pass</span>
                  </div>
                  <button onClick={() => toggleRow("card:" + m.id)} className="w-full rounded border px-2 py-1 text-[10px] font-semibold" style={{ borderColor: C.green, color: C.green, background: "#0a1f14" }}>
                    {open ? "▴ HIDE 13-SIM DETAIL" : "▾ 13-SIM DETAIL · per-sim scores"}
                  </button>
                  {open && (
                    <div data-arch-sim-strip className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                      {results.map((r) => (
                        <div key={r.sim} className="flex items-center justify-between text-[9px]">
                          <span style={{ color: C.dim }}>{r.sim}</span>
                          <span style={{ color: r.status === "PASS" ? C.green : C.amber }}>{r.score.toFixed(1)} {stars(r.stars)}</span>
                        </div>
                      ))}
                      <div className="col-span-2 mt-0.5 text-[10px]" style={{ color: C.dim }}>deterministic estimate (a design preview, not an engineering result){cement ? " · 3D-printed cement" : ""}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SIDE-BY-SIDE TEST MATRIX — the 13 sims, 0–5, under each form's mini glyph; "—" until a form is simulated */}
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
                  <span className="text-[8px]" style={{ color: simulated.has(m.id) ? C.dim : C.amber }}>{simulated.has(m.id) ? `avg ${overallScore(m.id, framingBy[m.id]).toFixed(1)}` : "NOT_RUN"}</span>
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
                      <span className="self-start text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>metrics</span>
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
          <div className="text-[10px]" style={{ color: C.amber }}>⚠ Energy/Carbon — and the sims they weight — are DESIGN ASSUMPTIONS. Only the Cube's cost is engine-derived. 3D-printed cement is modelled honestly (faster/stronger, higher embodied carbon).</div>
        </div>
      </div>

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
            <span style={{ color: C.dim }}>Balanced pick → </span>
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
