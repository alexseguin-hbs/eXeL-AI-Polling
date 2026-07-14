"use client";

/**
 * ARCHITECT-2525 · SIMULATE / REVIEW / TWIN / REPLAY panels (MASTER_SPEC §12 / §10).
 * ===============================================================================
 * Light functional slices completing the 12-tab shell (Phase-3):
 *  - SimulatePanel — simulation catalog + selected result (ARC-22).
 *  - ReviewPanel   — Global Architect Network + multi-agent AI votes + explainability (ARC-18/19).
 *  - TwinPanel     — the 5 synchronized digital twins (ARC-17).
 *  - ReplayPanel   — replay cards + Knowledge-Graph teaser (ARC-21/20).
 */
import { useState } from "react";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b" };

export function SimulatePanel() {
  const sims = [
    { k: "Structural", r: "PASS · deflection L/480" }, { k: "Wind", r: "PASS · 130 mph" }, { k: "Flood", r: "REVIEW · +0.3 m grade" },
    { k: "Fire", r: "PASS · 2 hr sep" }, { k: "Earthquake", r: "PASS · Sd 0.4g" }, { k: "Thermal", r: "PASS · R-30 env" },
    { k: "Solar", r: "PASS · 8.2 kWp" }, { k: "Water Flow", r: "PASS" }, { k: "HVAC", r: "PASS · ACH 0.35" },
    { k: "Evacuation", r: "PASS · 90 s" }, { k: "Accessibility", r: "PASS · ADA" }, { k: "Carbon", r: "REVIEW · 42 t CO₂e" }, { k: "Lifecycle", r: "PASS · 60 yr" },
  ];
  const [sel, setSel] = useState(0);
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>SIMULATION ENGINE</div>
      <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 lg:grid-cols-7">
        {sims.map((s, i) => (
          <button key={s.k} data-sim onClick={() => setSel(i)} className="rounded border px-2 py-1 text-[10px]"
            style={{ borderColor: i === sel ? C.violet : C.border, color: s.r.startsWith("REVIEW") ? C.amber : C.green, background: i === sel ? "#221833" : C.panel }}>{s.k}</button>
        ))}
      </div>
      <div className="rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel }}>
        <div className="font-bold" style={{ color: C.cyan }}>{sims[sel].k}</div>
        <div style={{ color: sims[sel].r.startsWith("REVIEW") ? C.amber : C.green }}>{sims[sel].r}</div>
        <div className="mt-1 text-[9px]" style={{ color: C.dim }}>Deterministic (U-WF-08) → replayable. Feeds the qualification report + SSSES.</div>
      </div>
    </div>
  );
}

export function ReviewPanel() {
  const experts = [{ n: "Maria L.", role: "Architect", v: "approve" }, { n: "K. Osei", role: "Structural", v: "approve" }, { n: "R. Diaz", role: "MEP", v: "revise" }, { n: "S. Park", role: "Sustainability", v: "approve" }];
  const agents = [{ n: "Structural AI", v: "approve", c: 0.94 }, { n: "Energy AI", v: "approve", c: 0.88 }, { n: "Cost Analyst AI", v: "revise", c: 0.72 }, { n: "Safety AI", v: "approve", c: 0.91 }];
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-1 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>GLOBAL ARCHITECT NETWORK</div>
        {experts.map((e) => (
          <div key={e.n} data-expert className="flex items-center justify-between text-[11px]"><span style={{ color: C.text }}>{e.n} <span style={{ color: C.dim }}>· {e.role}</span></span><span style={{ color: e.v === "approve" ? C.green : C.amber }}>{e.v}</span></div>
        ))}
        <div className="border-t pt-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>Time donated → $/min + Trinity tokens + recognition.</div>
      </div>
      <div className="space-y-1 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>MULTI-AGENT AI · votes + explainability</div>
        {agents.map((a) => (
          <div key={a.n} className="flex items-center justify-between text-[11px]"><span style={{ color: C.text }}>{a.n}</span><span style={{ color: a.v === "approve" ? C.green : C.amber }}>{a.v} · {(a.c * 100).toFixed(0)}%</span></div>
        ))}
        <div className="mt-1 rounded border p-2 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
          <span style={{ color: C.cyan }}>Why:</span> south glazing raises cooling load. <span style={{ color: C.cyan }}>Alt:</span> 0.5 m overhang. <span style={{ color: C.cyan }}>Risk:</span> low. <span style={{ color: C.cyan }}>Confidence:</span> 0.72.
        </div>
      </div>
    </div>
  );
}

export function TwinPanel() {
  const twins = [{ k: "Construction", c: C.cyan }, { k: "Maintenance", c: C.green }, { k: "Emergency", c: C.amber }, { k: "Insurance", c: C.violet }, { k: "Renovation", c: C.gold }];
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>DIGITAL TWINS <span style={{ color: C.dim }}>· synchronized</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {twins.map((t) => (
          <div key={t.k} data-twin className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
            <div className="text-[11px] font-bold" style={{ color: t.c }}>{t.k}</div>
            <div className="mt-1 flex items-center gap-1 text-[9px]" style={{ color: C.green }}><span>●</span> synced</div>
            <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>Twin</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReplayPanel() {
  const cards = [
    { t: "2025-05-15 14:32", who: "Homeowner", why: "Approve iteration 33", d: "iter 32 → 33", hash: "a7f3c9e2" },
    { t: "2025-05-14 09:11", who: "Architect · Maria L.", why: "Rotate great-room 8°", d: "az 172 → 180", hash: "3b91d0aa" },
    { t: "2025-05-12 16:40", who: "Cost Analyst AI", why: "Swap cladding", d: "$0.8M → $0.81M", hash: "c204f7e1" },
  ];
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>REPLAY ENGINE <span style={{ color: C.dim }}>· every decision recorded</span></div>
      {cards.map((c) => (
        <div key={c.hash} data-replay className="rounded-lg border p-2 text-[10px]" style={{ borderColor: C.border, background: C.panel }}>
          <div className="flex items-center justify-between"><span style={{ color: C.cyan }}>{c.who}</span><span style={{ color: C.dim }}>{c.t}</span></div>
          <div style={{ color: C.text }}>{c.why} <span style={{ color: C.gold }}>· {c.d}</span></div>
          <div style={{ color: C.dim }}>hash <span style={{ color: C.green }}>{c.hash}…</span></div>
        </div>
      ))}
      <div className="rounded-lg border p-2 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>
        <span style={{ color: C.violet }}>Knowledge Graph</span> — each project improves the next (reusable design learning).
      </div>
    </div>
  );
}
