"use client";

/**
 * ARCHITECT-2525 · SYSTEM OF INTELLIGENCE (SoI) — editable Tri-Coin framework (Sprint 6).
 * =====================================================================================
 * The mission: encourage INTELLIGENCE GROWTH and REIMAGINE INNOVATION INCENTIVES. The framework text now
 * lives in one editable store (lib/soi-framework.ts); this panel edits the DRAFT and PUBLISHES it to the
 * main eXeL AI Polling app (/dashboard, logged-in). Live ♡/웃/◬ mint still comes from architect-economy.
 * ♡ fuels the WHY, 웃 powers the HOW, ◬ scales the WHAT. Self-contained.
 */
import { useEffect, useState } from "react";
import type { EconomyResult } from "./architect-economy";
import { fmtUsd } from "./architect-economy";
import { loadSoI, saveSoI, publishSoI, subscribeSoI, type SoiFramework } from "@/lib/soi-framework";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", red: "#ef4444" };
// SoI Tri-Coin colours (operator spec): ♡ heart / S.I. = sunset yellow · ◬ / A.I. = eXeL AI cyan · 웃 human / H.I. = 13-Trinity violet
const COIN_C: Record<string, string> = { SI: C.gold, HI: C.violet, AI: C.cyan };

export function ArchitectSoI({ econ }: { econ: EconomyResult }) {
  const [soi, setSoi] = useState<SoiFramework>(() => loadSoI());
  const [editing, setEditing] = useState(false);
  const [published, setPublished] = useState(false);
  useEffect(() => subscribeSoI(() => setSoi(loadSoI())), []);

  const update = (next: SoiFramework) => { setSoi(next); saveSoI(next); setPublished(false); };
  const liveFor = (key: string) => key === "SI" ? `${econ.trinity.heart} ♡` : key === "HI" ? fmtUsd(econ.trinity.human) : `${econ.trinity.unity} ◬`;
  const doPublish = () => { publishSoI(soi); setPublished(true); };

  return (
    <div data-soi className="space-y-3 rounded-lg border p-3" style={{ borderColor: C.violet, background: C.panel }}>
      <div className="flex flex-wrap items-baseline justify-between gap-1">
        <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>SYSTEM OF INTELLIGENCE · TRI-COIN INCENTIVE FRAMEWORK</div>
        <div className="flex items-center gap-2">
          <span className="text-[9px]" style={{ color: C.dim }}>encourage intelligence growth · reimagine innovation incentives</span>
          <button data-soi-edit onClick={() => setEditing((e) => !e)} className="rounded border px-2 py-0.5 text-[9px]" style={{ borderColor: C.border, color: editing ? C.gold : C.dim }}>{editing ? "done" : "edit"}</button>
          <button data-soi-publish onClick={doPublish} className="rounded border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: C.violet, color: published ? C.green : C.violet }}>{published ? "published ✓" : "publish → /main"}</button>
        </div>
      </div>

      {/* thesis */}
      {editing ? (
        <input data-soi-thesis value={soi.thesis} onChange={(e) => update({ ...soi, thesis: e.target.value })}
          className="w-full rounded border bg-transparent px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.text }} />
      ) : (
        <div className="text-[10px]" style={{ color: C.dim }}>{soi.thesis}</div>
      )}

      {/* Tri-Coin — text from the store, live values from the economy */}
      <div className="grid gap-2 sm:grid-cols-3">
        {soi.coins.map((c, i) => (
          <div key={c.key} data-soi-coin className="rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold" style={{ color: COIN_C[c.key] || C.text }}>{c.sym} {c.key}</span>
              <span className="text-[11px] font-bold tabular-nums" style={{ color: COIN_C[c.key] || C.text }}>{liveFor(c.key)}</span>
            </div>
            <div className="text-[9px]" style={{ color: C.text }}>{c.name}</div>
            <div className="mt-1 rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, color: COIN_C[c.key] || C.text }}>{c.law}</div>
            {editing ? (
              <input value={c.purpose} onChange={(e) => { const coins = soi.coins.map((x, j) => j === i ? { ...x, purpose: e.target.value } : x); update({ ...soi, coins }); }}
                className="mt-1 w-full rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.dim }} />
            ) : (
              <div className="mt-1 text-[9px]" style={{ color: C.dim }}>{c.purpose}</div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {/* value conversion + flow */}
        <div className="space-y-1 rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
          <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>VALUE CONVERSION + FLOW</div>
          {soi.flow.map((f) => (
            <div key={f.k} data-soi-flow className="flex items-baseline gap-2 text-[9px]">
              <span className="w-14 shrink-0 font-bold" style={{ color: C.gold }}>{f.k}</span><span style={{ color: C.dim }}>{f.d}</span>
            </div>
          ))}
        </div>
        {/* contribution reputation (live) */}
        <div className="space-y-1 rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
          <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>CONTRIBUTION REPUTATION <span style={{ color: C.dim }}>· portable identity of service</span></div>
          <div className="flex items-baseline gap-2 text-[9px]"><span className="w-4" style={{ color: C.gold }}>♡</span><span style={{ color: C.dim }}>presence — how you show up ({econ.trinity.heart})</span></div>
          <div className="flex items-baseline gap-2 text-[9px]"><span className="w-4" style={{ color: C.violet }}>웃</span><span style={{ color: C.dim }}>skill — professional value ({fmtUsd(econ.trinity.human)})</span></div>
          <div className="flex items-baseline gap-2 text-[9px]"><span className="w-4" style={{ color: C.cyan }}>◬</span><span style={{ color: C.dim }}>scalability — leverage created ({econ.trinity.unity})</span></div>
          <div className="border-t pt-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>Time Capital <span style={{ color: C.gold }}>{fmtUsd(econ.timeCapitalUsd)}</span> · Learning pts <span style={{ color: C.violet }}>{econ.learningPoints}</span>.</div>
        </div>
      </div>

      {/* NOSE frame */}
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: "#0c1420" }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>NOSE</div>
        <div className="mt-1 grid gap-1 sm:grid-cols-2">
          {soi.nose.map((n, i) => (
            <div key={n.k} data-soi-nose className="text-[9px]">
              <span className="font-bold" style={{ color: C.cyan }}>{n.k}</span>{" "}
              {editing ? (
                <input value={n.d} onChange={(e) => { const nose = soi.nose.map((x, j) => j === i ? { ...x, d: e.target.value } : x); update({ ...soi, nose }); }}
                  className="w-full rounded border bg-transparent px-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }} />
              ) : (
                <span style={{ color: C.dim }}>— {n.d}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
