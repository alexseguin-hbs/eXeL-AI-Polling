"use client";

/**
 * ARCHITECT-2525 · SIMULATE — ALTERNATIVE DESIGN OPTIONS ("Compare Cards" + side-by-side matrix, operator 2026-10-25).
 * Three design models (Cube · Tiny Home · Eco-Sphere) drawn as mini forms, each scored 0–5 across the SAME original
 * 13-sim battery with detailed metrics; the TEST MATRIX scores all three SIDE BY SIDE under a mini drawing of each form,
 * per-row winner starred; COMPARE ALL ranks the headline metrics + gives ONE balanced recommendation.
 *
 * ONE honest story (12-master review fix): everything is a deterministic ESTIMATE/preview shown openly — the matrix is
 * the always-on comparison, a card's button just expands that model's per-sim DETAIL (never a fake "run" that implies the
 * scores don't exist yet). The Cube's cost/time are DERIVED from the real estimate engine; Tiny + Eco-Sphere are ASSUMED
 * parametric. Energy/Carbon (and the eco-sims they weight) are DESIGN ASSUMPTIONS, not derived — disclosed below.
 */
import { useMemo, useState } from "react";
import { SIM_MODELS, SIMS, compareModels, overallScore, recommendation, runBattery, simMatrix } from "@/lib/architect-sim-options";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b", red: "#f87171", ground: "#070b12" };
const usd = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const stars = (n: number) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);

/** A tiny static drawing of each build form (never VoxelHouse — it has no dome geometry and its 3D gestures fight the card). */
function FormGlyph({ id, size = 28 }: { id: string; size?: number }) {
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
  // cube / 3×3 grid (the 9 rooms, with a depth cap so it reads as a cube)
  return (
    <svg viewBox="0 0 32 32" style={st} fill="none" stroke={C.cyan} strokeWidth={1.5} aria-hidden>
      <path d="M9 10 L13 6 L29 6 L25 10 M29 6 L29 22 L25 26" stroke={C.violet} strokeWidth={1} vectorEffect="non-scaling-stroke" />
      <rect x="9" y="10" width="16" height="16" vectorEffect="non-scaling-stroke" />
      <path d="M14.33 10 L14.33 26 M19.66 10 L19.66 26 M9 15.33 L25 15.33 M9 20.66 L25 20.66" strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function SimulateOptions() {
  const [openDetail, setOpenDetail] = useState<Set<string>>(new Set());
  const [compare, setCompare] = useState(false);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  // deterministic — compute once (Sofia: memoize)
  const matrix = useMemo(() => simMatrix(), []);
  const ranks = useMemo(() => compareModels(), []);
  const avgById = useMemo(() => Object.fromEntries(SIM_MODELS.map((m) => [m.id, overallScore(m.id)])) as Record<string, number>, []);
  const batteryById = useMemo(() => Object.fromEntries(SIM_MODELS.map((m) => [m.id, runBattery(m.id)])), []);
  const rec = useMemo(() => recommendation(), []);
  const winnerOf = (metric: string) => ranks.find((r) => r.metric === metric)?.winnerId;
  const cols = `minmax(66px,1.1fr) repeat(${SIM_MODELS.length}, minmax(70px,1fr))`;
  const toggleRow = (s: string) => setOpenRows((prev) => { const n = new Set(prev); if (n.has(s)) n.delete(s); else n.add(s); return n; });
  const toggleDetail = (id: string) => setOpenDetail((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-3" data-arch-sim-options>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>SIMULATE · ALTERNATIVE DESIGN OPTIONS</div>
        <span className="text-[9px]" style={{ color: C.dim }}>· your home, three ways — the 13 sims scored 0–5 on each, side by side</span>
      </div>

      {/* 3 model cards — each always shows its sim summary (deterministic); the button expands that model's detail */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {SIM_MODELS.map((m) => {
          const res = batteryById[m.id];
          const passed = res.filter((r) => r.status === "PASS").length;
          const open = openDetail.has(m.id);
          const basisCol = m.basis === "DERIVED" ? C.green : C.amber;
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
              <div className="mt-1.5 space-y-0.5">
                {row("Area", `${m.areaFt2.toLocaleString()} ft² · ${m.rooms} rm`)}
                {row("Cost", usd(m.costUsd), "Cost")}
                {row("Build", `${m.buildMonths} mo`, "Build time")}
                {row("Energy", `${stars(m.energyScore)}`, "Energy")}
                {row("Carbon", `${stars(m.carbonScore)}`, "Carbon")}
              </div>
              <div className="mt-1 flex items-center justify-between text-[8px] uppercase tracking-wider" style={{ color: basisCol }}>
                <span>{m.basis === "DERIVED" ? "cost/time · derived · engine" : "cost/time · assumed · parametric"}</span>
                <span style={{ color: C.dim }}>envelope: assumed</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded px-1.5 py-1 text-[10px]" style={{ background: C.ground }}>
                <span style={{ color: C.dim }}>13-sim avg</span>
                <span style={{ color: C.cyan, fontWeight: 700 }}>{avgById[m.id].toFixed(1)}/5 · {passed}/13 pass</span>
              </div>
              <button data-arch-sim-run={m.id} onClick={() => toggleDetail(m.id)}
                className="mt-1.5 w-full rounded border px-2 py-1 text-[10px] font-semibold"
                style={{ borderColor: open ? C.green : C.violet, color: open ? C.green : C.violet, background: open ? "#0a1f14" : "#1a1030" }}>
                {open ? "▴ HIDE 13-SIM DETAIL" : "▾ 13-SIM DETAIL · per-sim scores"}
              </button>
              {open && (
                <div data-arch-sim-strip className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {res.map((r) => (
                    <div key={r.sim} className="flex items-center justify-between text-[9px]">
                      <span style={{ color: C.dim }}>{r.sim}</span>
                      <span style={{ color: r.status === "PASS" ? C.green : C.amber }}>{r.score.toFixed(1)} {stars(r.stars)}</span>
                    </div>
                  ))}
                  <div className="col-span-2 mt-0.5 text-[10px]" style={{ color: C.dim }}>deterministic estimate (a design preview, not an engineering result)</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SIDE-BY-SIDE TEST MATRIX — the 13 sims scored 0–5 across all three, under a mini drawing of each form.
          (operator: "Cube vs Tiny Home vs Eco Sphere can be scored and viewed Side by aside with mini version of those
          designs in the tests") — the always-on comparison; all three are auto-estimated previews. */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider" style={{ color: C.cyan }}>TEST MATRIX · the 13 sims, side by side</span>
          <span className="text-[9px]" style={{ color: C.dim }}>· all three auto-estimated (deterministic preview) · tap a sim for detail · ✦ = best per sim</span>
        </div>
        <div className="overflow-x-auto" data-arch-sim-matrix>
          <div style={{ minWidth: 300 }}>
            {/* column header — the mini designs */}
            <div className="grid items-end gap-1 pb-1.5" style={{ gridTemplateColumns: cols }}>
              <div className="self-center text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>13 sims · 0–5</div>
              {SIM_MODELS.map((m) => (
                <div key={m.id} className="flex flex-col items-center gap-0.5">
                  <span className="rounded border p-1" style={{ borderColor: C.border, background: C.ground }}><FormGlyph id={m.id} size={26} /></span>
                  <span className="text-center text-[9px] font-bold leading-tight" style={{ color: C.cyan }}>{m.label}</span>
                  <span className="text-[8px]" style={{ color: C.dim }}>avg {avgById[m.id].toFixed(1)}</span>
                </div>
              ))}
            </div>
            {/* one row per sim */}
            {matrix.map((rw) => {
              const isOpen = openRows.has(rw.sim);
              return (
                <div key={rw.sim} data-arch-sim-row={rw.sim} className="border-t" style={{ borderColor: "#0f1724" }}>
                  <button onClick={() => toggleRow(rw.sim)} className="grid w-full items-center gap-1 py-1 text-left" style={{ gridTemplateColumns: cols }}>
                    <span className="text-[10px]" style={{ color: C.text }}>{isOpen ? "▾ " : "▸ "}{rw.sim}</span>
                    {rw.cells.map((c) => {
                      const win = c.modelId === rw.winnerId;
                      return (
                        <span key={c.modelId} data-arch-sim-cell className="flex flex-col items-center leading-none">
                          <span className="text-[11px] font-semibold" style={{ color: win ? C.gold : c.status === "PASS" ? C.green : C.amber }}>{win ? "✦ " : ""}{c.score.toFixed(1)}</span>
                          <span className="mt-0.5 text-[8px]" style={{ color: win ? C.gold : C.dim }}>{stars(c.stars)}</span>
                        </span>
                      );
                    })}
                  </button>
                  {isOpen && (
                    <div className="grid gap-1 pb-1.5" style={{ gridTemplateColumns: cols }}>
                      <span className="self-start text-[8px] uppercase tracking-wider" style={{ color: C.dim }}>metrics</span>
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
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-1.5 space-y-0.5">
          <div className="text-[10px]" style={{ color: C.dim }}>Initial 0–5 score + detailed metrics · deterministic estimate (a design preview, not an engineering analysis).</div>
          <div className="text-[10px]" style={{ color: C.amber }}>⚠ Energy/Carbon — and the Thermal · Solar · HVAC · Carbon · Lifecycle sims they weight — are DESIGN ASSUMPTIONS, not derived. Only the Cube's cost + build time are engine-derived.</div>
        </div>
      </div>

      {/* the original 13-sim battery — run on EVERY model (operator: "3 options have tests to run like original") */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        <div className="mb-1 text-[9px] uppercase tracking-wider" style={{ color: C.dim }}>The 13-sim battery · run on every model</div>
        <div className="flex flex-wrap gap-1">
          {SIMS.map((s) => (
            <span key={s} data-sim className="rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>{s}</span>
          ))}
        </div>
      </div>

      {/* COMPARE ALL */}
      <button data-arch-sim-compare onClick={() => setCompare((v) => !v)} className="rounded border px-3 py-1 text-[11px] font-semibold"
        style={{ borderColor: compare ? C.gold : C.cyan, color: compare ? C.gold : C.cyan, background: compare ? "#1a1405" : "#07202a" }}>
        {compare ? "✦ COMPARING — winner starred per metric" : "▸ COMPARE ALL 3 — rank by cost · time · energy · carbon · sim avg"}
      </button>
      {compare && (
        <div className="rounded-lg border p-2 text-[10px]" style={{ borderColor: `${C.gold}55`, background: C.panel }}>
          {/* one reconciled recommendation (Asar) — not just a per-axis scoreboard */}
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
