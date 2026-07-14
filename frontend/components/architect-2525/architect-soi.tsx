"use client";

/**
 * ARCHITECT-2525 · SYSTEM OF INTELLIGENCE (SoI) — Tri-Coin incentive framework (operator concept doc).
 * =====================================================================================================
 * The mission all along: encourage INTELLIGENCE GROWTH and REIMAGINE INNOVATION INCENTIVES. This surface
 * makes the SoI Tri-Coin explicit inside Architect-2525 — the same ♡/웃/◬ law that `architect-economy.ts`
 * already mints from the $/min economy — plus its value-conversion flow, the living contribution-reputation
 * profile, and the NOSE frame. Presence is valued, not just production: ♡ fuels the WHY, 웃 powers the HOW,
 * ◬ scales the WHAT. Domain-neutral (drives Manta-2525 / Drone-2525 / Atlantis / Vision-2525 the same way);
 * client = optimistic preview, the audited Cube 8 ledger reconciles on sync. Self-contained, pure render.
 */
import type { EconomyResult } from "./architect-economy";
import { fmtUsd } from "./architect-economy";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", red: "#ef4444" };

export function ArchitectSoI({ econ }: { econ: EconomyResult }) {
  // The three coins — definition · valuation law · purpose · LIVE mint from the current $/min economy.
  const coins = [
    { sym: "♡", key: "SI", name: "Shared Intention", color: C.red,
      law: "1 min contributed = 1 ♡", purpose: "Purpose-driven, goodwill time — builds trust + decentralized participation.",
      live: `${econ.trinity.heart} ♡` },
    { sym: "웃", key: "HI", name: "Human Intelligence", color: C.green,
      law: "min-wage $7.25/hr → 1 hr ≈ 7.25 웃", purpose: "Compensated skill + decision-making — sustains professionals, treasury-backed.",
      live: fmtUsd(econ.trinity.human) },
    { sym: "◬", key: "AI", name: "Artificial Intelligence", color: C.cyan,
      law: "1 min SI = 5 ◬ (5× acceleration)", purpose: "Time saved/expanded by tools + automation — rewards leverage + shared intelligence.",
      live: `${econ.trinity.unity} ◬` },
  ];
  const flow = [
    { k: "Redeem", d: "웃 HI → cash on treasury availability" },
    { k: "Exchange", d: "internal — services · tools · mentoring" },
    { k: "Stake", d: "governance · bonuses · future access" },
    { k: "Amplify", d: "♡ SI → ◬ AI when a task becomes a reusable tool" },
  ];
  const nose = [
    { k: "Need", d: "Legacy systems fail to value non-monetary contribution + scalable tools." },
    { k: "Outcome", d: "Decisions go from days → minutes, with transparent, fair rewards." },
    { k: "Solution", d: "Fast polling + AI clustering + tokenized Tri-Coin value." },
    { k: "Evidence", d: "SoI test deployments live 2026; echoed by Deloitte + Gartner." },
  ];
  return (
    <div data-soi className="space-y-3 rounded-lg border p-3" style={{ borderColor: C.violet, background: C.panel }}>
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>
          SYSTEM OF INTELLIGENCE · TRI-COIN INCENTIVE FRAMEWORK
        </div>
        <div className="text-[9px]" style={{ color: C.dim }}>encourage intelligence growth · reimagine innovation incentives</div>
      </div>
      <div className="text-[10px]" style={{ color: C.dim }}>
        Value <span style={{ color: C.text }}>presence, not just production</span>. <span style={{ color: C.red }}>♡ fuels the why</span> · <span style={{ color: C.green }}>웃 powers the how</span> · <span style={{ color: C.cyan }}>◬ scales the what</span>.
      </div>
      {/* Tri-Coin definitions + valuation law + live mint */}
      <div className="grid gap-2 sm:grid-cols-3">
        {coins.map((c) => (
          <div key={c.key} data-soi-coin className="rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold" style={{ color: c.color }}>{c.sym} {c.key}</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: c.color }}>{c.live}</span>
            </div>
            <div className="text-[9px]" style={{ color: C.text }}>{c.name}</div>
            <div className="mt-1 rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, color: c.color }}>{c.law}</div>
            <div className="mt-1 text-[9px]" style={{ color: C.dim }}>{c.purpose}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-2 lg:grid-cols-2">
        {/* Value conversion + flow */}
        <div className="space-y-1 rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
          <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>VALUE CONVERSION + FLOW</div>
          {flow.map((f) => (
            <div key={f.k} data-soi-flow className="flex items-baseline gap-2 text-[9px]">
              <span className="w-14 shrink-0 font-bold" style={{ color: C.gold }}>{f.k}</span>
              <span style={{ color: C.dim }}>{f.d}</span>
            </div>
          ))}
        </div>
        {/* Living contribution-reputation profile */}
        <div className="space-y-1 rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
          <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>CONTRIBUTION REPUTATION <span style={{ color: C.dim }}>· portable identity of service</span></div>
          <div className="flex items-baseline gap-2 text-[9px]"><span className="w-4" style={{ color: C.red }}>♡</span><span style={{ color: C.dim }}>presence — how you show up ({econ.trinity.heart})</span></div>
          <div className="flex items-baseline gap-2 text-[9px]"><span className="w-4" style={{ color: C.green }}>웃</span><span style={{ color: C.dim }}>skill — professional value ({fmtUsd(econ.trinity.human)})</span></div>
          <div className="flex items-baseline gap-2 text-[9px]"><span className="w-4" style={{ color: C.cyan }}>◬</span><span style={{ color: C.dim }}>scalability — leverage created ({econ.trinity.unity})</span></div>
          <div className="border-t pt-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>Time Capital <span style={{ color: C.gold }}>{fmtUsd(econ.timeCapitalUsd)}</span> · Learning pts <span style={{ color: C.violet }}>{econ.learningPoints}</span> — a living signature reusable across future projects.</div>
        </div>
      </div>
      {/* NOSE frame */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>NOSE</div>
        <div className="mt-1 grid gap-1 sm:grid-cols-2">
          {nose.map((n) => (
            <div key={n.k} data-soi-nose className="text-[9px]"><span className="font-bold" style={{ color: C.cyan }}>{n.k}</span> <span style={{ color: C.dim }}>— {n.d}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
