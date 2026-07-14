"use client";

/**
 * ARCHITECT-2525 · ITERATE / SHARE / QUALIFY panels (MASTER_SPEC §8, §12c, §11/§14).
 * ================================================================================
 * Lighter functional slices (Phase-3 stretch), self-contained:
 *  - IteratePanel  — the 20→33 iteration gallery + per-iteration artifacts (ARC-15/21).
 *  - SharePanel    — open link + universal comments → candidate deltas + homeowner
 *                    consolidation via eXeL polling + volunteer/learning points (ARC-25/26/27/33).
 *  - QualifyPanel  — automated checks + stage gates G0–G13 + on-chain approval record (ARC-24).
 */
import { useState } from "react";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", red: "#ef4444" };

function HouseGlyph({ color, o = 1 }: { color: string; o?: number }) {
  return <svg viewBox="0 0 24 18" className="w-full"><polyline points="3,15 3,8 12,3 21,8 21,15" fill="none" stroke={color} strokeWidth="1" opacity={o} /><rect x="10" y="10" width="4" height="5" fill="none" stroke={color} strokeWidth="0.7" opacity={o} /></svg>;
}

export function IteratePanel() {
  const [sel, setSel] = useState(33);
  const iters = Array.from({ length: 14 }, (_, i) => 20 + i);
  const artifacts = ["Replay Package", "Qualification Report", "Delta Changes", "Time Ledger (MoT + $/min)", "Token Ledger (◬ ♡ 웃)", "Digital-Twin Snapshot"];
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>11–33 ITERATION ENGINE <span style={{ color: C.dim }}>· each pass = an intelligence cycle</span></div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {iters.map((n) => (
          <button key={n} data-iter={n} onClick={() => setSel(n)} className="rounded-lg border p-1.5 text-left"
            style={{ borderColor: n === sel ? C.violet : C.border, background: n === sel ? "#221833" : C.panel }}>
            <div className="flex items-center justify-between text-[10px]"><span className="font-bold tabular-nums" style={{ color: n === 33 ? C.green : C.cyan }}>{n}</span>{n === 33 && <span style={{ color: C.green }}>✓</span>}</div>
            <HouseGlyph color={n === 33 ? C.green : C.cyan} o={0.4 + (n - 20) / 26} />
          </button>
        ))}
      </div>
      <div className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[11px] font-bold" style={{ color: sel === 33 ? C.green : C.cyan }}>Iteration {sel}{sel === 33 ? " · APPROVED" : ""}</div>
        <div className="mt-1 grid grid-cols-2 gap-1 sm:grid-cols-3">
          {artifacts.map((a) => <div key={a} className="rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}><span style={{ color: C.green }}>✓</span> {a}</div>)}
        </div>
      </div>
    </div>
  );
}

export function SharePanel() {
  const [comments, setComments] = useState<{ who: string; text: string; delta: boolean }[]>([
    { who: "Architect · Maria L.", text: "Rotate great-room 8° for winter sun.", delta: true },
    { who: "Neighbor", text: "Love the porch depth.", delta: false },
  ]);
  const [draft, setDraft] = useState("");
  const [points, setPoints] = useState(120);
  const add = () => { if (!draft.trim()) return; setComments((c) => [...c, { who: "You", text: draft.trim(), delta: true }]); setDraft(""); setPoints((p) => p + 5); };
  const deltas = comments.filter((c) => c.delta).length;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>OPEN SHARE</div>
        <div className="flex items-center gap-2 rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border }}>
          <span style={{ color: C.dim }}>link</span><span className="truncate" style={{ color: C.cyan }}>exel.ai/architect/V2525-000842</span>
        </div>
        <div className="text-[9px]" style={{ color: C.dim }}>Anyone can view, walk, and comment. Comments become candidate deltas the homeowner consolidates via eXeL polling.</div>
        <div className="flex gap-1">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a comment…" className="flex-1 rounded border bg-transparent px-2 py-1 text-[11px]" style={{ borderColor: C.border, color: C.text }} />
          <button onClick={add} className="rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.violet }}>post</button>
        </div>
      </div>
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="flex items-center justify-between text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>
          <span>COMMENTS → DELTAS ({deltas})</span><span style={{ color: C.gold }}>{points} learning pts</span>
        </div>
        <div data-share-comments className="max-h-40 space-y-1 overflow-y-auto">
          {comments.map((c, i) => (
            <div key={i} className="rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border }}>
              <span style={{ color: c.delta ? C.gold : C.dim }}>{c.delta ? "△ delta" : "· note"}</span> <span style={{ color: C.cyan }}>{c.who}</span><div style={{ color: C.text }}>{c.text}</div>
            </div>
          ))}
        </div>
        <button className="w-full rounded border px-2 py-1 text-[10px] font-bold" style={{ borderColor: C.violet, color: C.violet }}>Consolidate {deltas} deltas via eXeL polling →</button>
      </div>
    </div>
  );
}

export function QualifyPanel() {
  const checks = ["Structural", "Electrical", "Energy Efficiency", "Safety", "Code Compliance", "Budget Alignment", "Environmental Impact"];
  const gates = ["G0 Vision", "G1 Req", "G2 Site", "G3 Concept", "G4 Struct", "G5 Cost", "G6 Permit", "G7 Build-Ready", "G8 Construct", "G9 Inspect", "G10 Occupy", "G11 Maintain", "G12 Renovate", "G13 Replay"];
  const current = 6;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>AUTOMATED CHECKS</div>
        <div className="grid grid-cols-2 gap-1">
          {checks.map((k) => <div key={k} className="flex items-center gap-1 rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }}><span style={{ color: C.green }}>✓</span>{k}</div>)}
        </div>
        <div className="text-[9px]" style={{ color: C.dim }}>Guidance only — NOT certified plan approval (ARC-09).</div>
      </div>
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>STAGE GATES · G0–G13</div>
        <div className="flex flex-wrap gap-1">
          {gates.map((g, i) => <span key={g} className="rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, color: i < current ? C.green : i === current ? C.gold : C.dim, background: i === current ? "#221833" : "transparent" }}>{g}</span>)}
        </div>
        <div className="mt-1 rounded-lg border p-2 text-[10px]" style={{ borderColor: C.border }}>
          <div className="font-bold" style={{ color: C.green }}>APPROVAL RECORD · on-chain</div>
          <div style={{ color: C.dim }}>Project <span style={{ color: C.text }}>V2525-000842</span> · Hash <span style={{ color: C.cyan }}>a7f3c9e2…7d91b3f4</span></div>
          <div style={{ color: C.dim }}>VERIFIED · IMMUTABLE · TRUSTED · fee <span style={{ color: C.green }}>$25.00</span></div>
        </div>
      </div>
    </div>
  );
}
