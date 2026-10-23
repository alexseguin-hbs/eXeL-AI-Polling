"use client";

/**
 * ARCHITECT-2525 · ITERATE / SHARE / QUALIFY panels (MASTER_SPEC §8, §12c, §11/§14).
 * ================================================================================
 * PRODUCT TRUTH (Block E 2/n, 2026-10-23): the project is at PLAN · REVIEWABLE. No iteration has been approved,
 * no review recorded, no automated check run, no gate certified, no on-chain approval written. These panels read
 * their honest state; the iteration strip is an illustrative concept marked as such. See
 * docs/architecture-2525/PRODUCT_TRUTH_MIGRATION.md.
 *  - IteratePanel  — iteration concept, — / 33 (not started), illustrative glyph strip.
 *  - SharePanel    — open-share link + a real post box; no seeded comments, 0 learning points.
 *  - QualifyPanel  — automated checks NOT RUN + the stage gates with only the canonical stage marked + NO APPROVAL RECORDED.
 */
import { useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", red: "#ef4444" };

function HouseGlyph({ color, o = 1 }: { color: string; o?: number }) {
  return <svg viewBox="0 0 24 18" className="w-full"><polyline points="3,15 3,8 12,3 21,8 21,15" fill="none" stroke={color} strokeWidth="1" opacity={o} /><rect x="10" y="10" width="4" height="5" fill="none" stroke={color} strokeWidth="0.7" opacity={o} /></svg>;
}

export function IteratePanel() {
  const { t } = useLexicon();
  // PRODUCT TRUTH: iteration is — / 33, not started. The strip is an illustrative preview of the iterate concept;
  // no iteration is selected-as-real and none is APPROVED (the ribbon reads "— / 33").
  const iters = Array.from({ length: 14 }, (_, i) => 20 + i);
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>ITERATION ENGINE <span style={{ color: C.dim }}>· — / 33 · not started (illustrative)</span></div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {iters.map((n) => (
          <div key={n} data-iter={n} className="rounded-lg border p-1.5 text-left" style={{ borderColor: C.border, background: C.panel }}>
            <div className="flex items-center justify-between text-[10px]"><span className="font-bold tabular-nums" style={{ color: C.dim }}>{n}</span></div>
            <HouseGlyph color={C.dim} o={0.35} />
          </div>
        ))}
      </div>
      <div className="rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel, color: C.dim }}>
        No iteration has been run or approved for this project. {t("arch.panels.each_pass_intelligence_cycle")}
      </div>
    </div>
  );
}

export function SharePanel() {
  const { t } = useLexicon();
  // PRODUCT TRUTH: no comments recorded, no learning points earned. The post box is a real interaction; the link
  // is an illustrative project share link (project id is illustrative — see ASSUMPTION_REGISTER).
  const [comments, setComments] = useState<{ who: string; text: string; delta: boolean }[]>([]);
  const [draft, setDraft] = useState("");
  const [points, setPoints] = useState(0);
  const add = () => { if (!draft.trim()) return; setComments((c) => [...c, { who: "You", text: draft.trim(), delta: true }]); setDraft(""); setPoints((p) => p + 5); };
  const deltas = comments.filter((c) => c.delta).length;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>OPEN SHARE</div>
        <div className="flex items-center gap-2 rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border }}>
          <span style={{ color: C.dim }}>link</span><span className="truncate" style={{ color: C.cyan }}>exel.ai/architect/V2525-000842</span>
        </div>
        <div className="text-[9px]" style={{ color: C.dim }}>{t("arch.panels.anyone_view_walk_comment")}</div>
        <div className="flex gap-1">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder={t("arch.panels.add_comment_placeholder")} className="flex-1 rounded border bg-transparent px-2 py-1 text-[11px]" style={{ borderColor: C.border, color: C.text }} />
          <button onClick={add} className="rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.violet }}>post</button>
        </div>
      </div>
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="flex items-center justify-between text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>
          <span>COMMENTS → DELTAS ({deltas})</span><span style={{ color: C.gold }}>{points} learning pts</span>
        </div>
        <div data-share-comments className="max-h-40 space-y-1 overflow-y-auto">
          {comments.length === 0 ? (
            <div className="rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>No comments recorded yet.</div>
          ) : comments.map((c, i) => (
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
  const { t } = useLexicon();
  const checks = ["Structural", "Electrical", "Energy Efficiency", "Safety", "Code Compliance", "Budget Alignment", "Environmental Impact"];
  const gates = ["G0 Vision", "G1 Req", "G2 Site", "G3 Concept", "G4 Struct", "G5 Cost", "G6 Permit", "G7 Build-Ready", "G8 Construct", "G9 Inspect", "G10 Occupy", "G11 Maintain", "G12 Renovate", "G13 Replay"];
  // PRODUCT TRUTH: the project is at the canonical PLAN stage (G2). No gate is marked "passed" (none is certified);
  // only the current stage is highlighted. No automated check has run. No approval recorded.
  const current = 2;
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>AUTOMATED CHECKS <span style={{ color: C.dim }}>· NOT RUN</span></div>
        <div className="grid grid-cols-2 gap-1">
          {checks.map((k) => <div key={k} className="flex items-center gap-1 rounded border px-2 py-1 text-[10px]" style={{ borderColor: C.border, color: C.dim }}><span style={{ color: C.dim }}>○</span>{k}</div>)}
        </div>
        <div className="text-[9px]" style={{ color: C.dim }}>{t("arch.panels.guidance_only_not_certified")}</div>
      </div>
      <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>STAGE GATES · G0–G13</div>
        <div className="flex flex-wrap gap-1">
          {gates.map((g, i) => <span key={g} className="rounded border px-1.5 py-0.5 text-[9px]" style={{ borderColor: C.border, color: i === current ? C.gold : C.dim, background: i === current ? "#221833" : "transparent" }}>{g}</span>)}
        </div>
        <div className="mt-1 rounded-lg border p-2 text-[10px]" style={{ borderColor: C.border }}>
          <div className="font-bold" style={{ color: C.dim }}>APPROVAL RECORD</div>
          <div style={{ color: C.dim }}>NO APPROVAL RECORDED · the project is at PLAN · REVIEWABLE</div>
        </div>
      </div>
    </div>
  );
}
