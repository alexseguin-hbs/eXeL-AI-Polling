"use client";

/**
 * Cube Developer Simulation — Manual SIM Mode • 2525 (§6 workbench).
 * ====================================================================================
 * The earlier-draft workbench, wired to the real backend:
 *   Select Cube → Level dial (3/6/9) → the 27-voxel lights the chosen section →
 *   read LIVE code → write candidate → CHECK IN (version + evidence, nothing runs) →
 *   SUBMIT TO SIMULATE (run vs metrics) → verdict → Human Review → 3-member validators.
 *
 * Backend (mirrored by mock-data under MOCK_MODE):
 *   GET  /sim/cubes                       GET  /sim/cube/{id}/contract  (io + sections)
 *   POST /sim/cube/{id}/check-in          POST /sim/cube/{id}/submit
 *
 * The 27-voxel highlight is the backend's deterministic voxel_highlight (sections[].
 * highlight[level]) — one source, no drift. Reuses the 3/6/9 dial concept from the
 * live theme viz. i18n (§7) routes the strings through t().
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Boxes, Loader2, Play, GitCommitHorizontal, Maximize2, X, Check, Pencil, Ban, Flag, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useLexicon } from "@/lib/lexicon-context";

type CubeInfo = { cube_id: number; name: string; harness_available: boolean };
type Section = { key: string; label: string; functions: string[]; highlight: Record<string, number[]> };
type Contract = {
  cube_id: number; name: string;
  io_contract: { inputs: string[]; functions: string[]; outputs: string[] };
  sections?: Section[];
};
type SourceBlock = { name: string; section: string; resolved: boolean; path: string | null; source: string | null };
type Verdict = { equivalent: boolean; compare_passed: boolean; faster: boolean; overall_passed: boolean };
type SubmitResult = {
  baseline: { metrics?: Record<string, number>; determinism_signature?: string };
  candidate: { metrics?: Record<string, number>; determinism_signature?: string };
  verdict: Verdict;
  decision: { decision: string; reason: string; tier: string };
  replay: { replay_hash: string; scope: string; section_label?: string };
  validation: { validators: number; required: number; state: string };
};

// The 4 code sections partition the 27 voxels; each section IS a level (L1·A … L4·D).
// FULL=9 asks voxel_highlight for the whole section (no 3/6/9 density scaling here —
// the 3/6/9 dial belongs to the theme viz, not the code-section model).
const FULL = 9;
const AI = "#19c8cf", SI = "#ffcf5a", HI = "#b98cff", GOOD = "#3ddc9a";

export function CubeDevSim() {
  const { t } = useLexicon();
  const [cubes, setCubes] = useState<CubeInfo[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [sectionKey, setSectionKey] = useState<string | null>(null);
  const [liveBlocks, setLiveBlocks] = useState<SourceBlock[]>([]);
  const [candidate, setCandidate] = useState("");
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [maxCode, setMaxCode] = useState<"" | "split" | "live" | "yours">("");
  const [verdictVote, setVerdictVote] = useState<"pass" | "revise" | "block">("pass");
  const [seconds, setSeconds] = useState(15 * 60);

  // Timer starts on open, counts down; ♡ = ceil(active minutes), ◬ = ♡×5, 웃 = $/7.25.
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const activeMin = Math.ceil((15 * 60 - seconds) / 60);
  const heart = Math.max(0, activeMin), unity = heart * 5, human = (activeMin * 7.25 / 60) / 7.25;

  useEffect(() => {
    api.get<{ cubes: CubeInfo[] }>("/sim/cubes")
      .then((d) => setCubes(d.cubes))
      .catch(() => setErr("Simulation backend not reachable."));
  }, []);

  const pick = useCallback(async (id: number) => {
    setSel(id); setContract(null); setSectionKey(null); setResult(null); setCheckedIn(null);
    setCandidate(""); setErr(""); setBusy("contract");
    try {
      const c = await api.get<Contract>(`/sim/cube/${id}/contract`);
      setContract(c);
      setSectionKey(c.sections?.[0]?.key ?? null);
    } catch { setErr(`Cube ${id} contract unavailable.`); }
    finally { setBusy(""); }
  }, []);

  const sections = contract?.sections ?? [];
  const activeSection = sections.find((s) => s.key === sectionKey) ?? null;
  const activeIdx = sections.findIndex((s) => s.key === sectionKey);
  const litCells = useMemo(() => {
    const set = new Set(activeSection?.highlight?.[String(FULL)] ?? []);
    return set;
  }, [activeSection]);

  // FX-B: fetch the REAL live source for the selected section (backend inspect.getsource,
  // whitelisted to app/cubes/**) so the LIVE panel shows the running code — not a
  // placeholder. Prefill YOUR VERSION from it when empty, so the Dev edits from real code.
  useEffect(() => {
    if (!sel || !sectionKey) { setLiveBlocks([]); return; }
    let alive = true;
    api.get<{ blocks: SourceBlock[] }>(`/sim/cube/${sel}/source?section=${sectionKey}`)
      .then((d) => {
        if (!alive) return;
        const blocks = d.blocks ?? [];
        setLiveBlocks(blocks);
        const src = composeLive(blocks);
        if (src) setCandidate((cur) => (cur ? cur : src));
      })
      .catch(() => { if (alive) setLiveBlocks([]); });
    return () => { alive = false; };
  }, [sel, sectionKey]);

  const liveSource = useMemo(
    () => composeLive(liveBlocks)
      || `# ${contract?.name ?? "cube"} · section ${activeSection?.key ?? ""}\n# live source unavailable (read-only)`,
    [liveBlocks, contract, activeSection],
  );

  const checkIn = useCallback(async () => {
    if (!sel) return;
    setBusy("checkin"); setErr("");
    try {
      const r = await api.post<{ run_id: string; status: string }>(`/sim/cube/${sel}/check-in`,
        { section: sectionKey, level: FULL, note: candidate.slice(0, 200) || null });
      setCheckedIn(r.run_id);
    } catch { setErr("Check-in failed — sign in as a developer."); }
    finally { setBusy(""); }
  }, [sel, sectionKey, candidate]);

  const submit = useCallback(async (humanApproved: boolean) => {
    if (!sel) return;
    setBusy("submit"); setErr(""); setResult(null);
    try {
      setResult(await api.post<SubmitResult>(`/sim/cube/${sel}/submit`,
        { section: sectionKey, level: FULL, tier: "manual", human_approved: humanApproved,
          run_id: checkedIn }));
    } catch { setErr("Submit failed — check-in first, then submit."); }
    finally { setBusy(""); }
  }, [sel, sectionKey, checkedIn]);

  const clk = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4">
      {/* Top bar — title · timer · ♡웃◬ HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5" style={{ color: AI }} />
          <div>
            <h2 className="text-sm font-semibold leading-tight">{t("cube10.sim.wb_title")}</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t("cube10.sim.wb_subtitle")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-sm">
            <Clock className="h-3.5 w-3.5" style={{ color: GOOD }} /><b>{clk}</b>
          </span>
          <span className="flex gap-1.5 font-mono text-xs">
            <span className="rounded-lg border px-2 py-1"><span style={{ color: SI }}>♡</span> {heart}</span>
            <span className="rounded-lg border px-2 py-1"><span style={{ color: HI }}>웃</span> {human.toFixed(2)}</span>
            <span className="rounded-lg border px-2 py-1"><span style={{ color: AI }}>◬</span> {unity}</span>
          </span>
        </div>
      </div>

      {/* Level 1 cube selector */}
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em]" style={{ color: AI }}>
        <span className="rounded border px-1.5 py-0.5" style={{ borderColor: AI }}>Level 1</span>
        <span className="text-muted-foreground">{t("cube10.sim.pick_cube")}</span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {cubes.map((c) => (
          <button key={c.cube_id} data-cube-sim-select={c.cube_id} onClick={() => pick(c.cube_id)}
            className={`rounded-lg border px-2 py-3 text-center text-xs transition ${
              sel === c.cube_id ? "border-primary bg-primary/10 text-primary" : "hover:border-primary/60"}`}>
            <div className="text-base font-bold">{c.cube_id}</div>
            <div className="mt-0.5 line-clamp-2 leading-tight">{c.name}</div>
          </button>
        ))}
      </div>

      {err && <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">{err}</div>}
      {busy === "contract" && <Loader2 className="h-5 w-5 animate-spin" style={{ color: AI }} />}

      {contract && (
        <>
          {/* Level strip — each of the 4 code sections IS a level (L1·A … L4·D).
              Pick one → the voxel lights that whole section's blocks. No 3/6/9 density
              dial here (that belongs to the theme viz, not the code-section model). */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
            <span className="mr-1 text-xs font-semibold text-muted-foreground">{t("cube10.sim.level")}</span>
            {sections.map((s, i) => (
              <button key={s.key} onClick={() => { setSectionKey(s.key); setResult(null); setCandidate(""); }}
                data-sim-section={s.key} data-sim-level={i + 1}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition ${
                  sectionKey === s.key ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
                style={sectionKey === s.key ? { background: SI, borderColor: SI } : undefined}>
                <span className="font-mono font-bold">L{i + 1}·{s.key}</span>
                <span className="opacity-80">{s.label}</span>
              </button>
            ))}
          </div>

          {/* 27-voxel (3 layers × 9) lit by the deterministic backend highlight */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
            <div className="flex gap-3" data-sim-voxel={sel ?? ""}>
              {[0, 1, 2].map((layer) => (
                <div key={layer} className="text-center">
                  <div className="mb-1 font-mono text-[8px] tracking-widest text-muted-foreground">L{layer + 1}</div>
                  <div className="grid grid-cols-3 gap-[3px]">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((cell) => {
                      const idx = layer * 9 + cell;
                      const on = litCells.has(idx);
                      return <span key={cell} className="h-4 w-4 rounded-[2px] border transition"
                        style={{ background: on ? SI : "transparent", borderColor: on ? SI : "#263a5c",
                          boxShadow: on ? `0 0 7px ${SI}` : "none", opacity: on ? 1 : 0.3 }} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="min-w-[180px] flex-1">
              <div className="text-sm font-semibold">Cube {contract.cube_id} · {contract.name}</div>
              <p className="mt-1 text-xs text-muted-foreground">
                27 blocks · 4 sections · Level <b style={{ color: SI }}>{activeIdx >= 0 ? activeIdx + 1 : "—"}</b> · Section{" "}
                <b style={{ color: SI }}>{activeSection?.key}</b> (<b>{activeSection?.label}</b>) — {litCells.size} blocks.
              </p>
            </div>
          </div>

          {/* Block I·F·O */}
          <div className="grid gap-3 sm:grid-cols-3">
            {col(t("cube10.sim.input"), contract.io_contract.inputs, SI)}
            {col(t("cube10.sim.functions"), activeSection?.functions ?? contract.io_contract.functions, AI)}
            {col(t("cube10.sim.output"), contract.io_contract.outputs, HI)}
          </div>

          {/* LIVE ↔ YOUR VERSION code (maximizable) */}
          <div className={maxCode ? "fixed inset-0 z-50 bg-background p-4 pt-12" : ""}>
            {maxCode && (
              <div className="mb-2 flex items-center gap-2">
                <b className="font-mono text-xs" style={{ color: AI }}>MAXIMIZED</b>
                {(["live", "split", "yours"] as const).map((m) => (
                  <button key={m} onClick={() => setMaxCode(m)}
                    className={`rounded border px-2 py-1 text-xs ${maxCode === m ? "text-black" : "text-muted-foreground"}`}
                    style={maxCode === m ? { background: AI } : undefined}>{m}</button>
                ))}
                <button onClick={() => setMaxCode("")} className="ml-auto rounded border px-2 py-1 text-xs">
                  <X className="mr-1 inline h-3 w-3" />Exit</button>
              </div>
            )}
            <div className={`grid gap-3 ${maxCode === "split" || !maxCode ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {maxCode !== "yours" && (
                <div className="flex flex-col rounded-lg border bg-[#080f1d]">
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">LIVE</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{activeSection?.functions[0] ?? "cube"}() · running now</span>
                    <button onClick={() => setMaxCode("live")} className="ml-auto text-muted-foreground hover:text-primary"><Maximize2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <pre className={`flex-1 overflow-auto p-3 font-mono text-[11px] text-muted-foreground ${maxCode === "live" ? "max-h-[80vh]" : "max-h-56"}`}>{liveSource}</pre>
                </div>
              )}
              {maxCode !== "live" && (
                <div className="flex flex-col rounded-lg border" style={{ borderColor: AI }}>
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <span className="rounded px-1.5 py-0.5 font-mono text-[10px] text-black" style={{ background: AI }}>YOUR VERSION</span>
                    <span className="font-mono text-[11px] text-muted-foreground">editable</span>
                    <button onClick={() => setMaxCode("yours")} className="ml-auto text-muted-foreground hover:text-primary"><Maximize2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <textarea value={candidate} onChange={(e) => setCandidate(e.target.value)}
                    placeholder={`# your improved ${activeSection?.functions[0] ?? "cube"}() — same output, a little faster`}
                    className="max-h-56 min-h-[140px] flex-1 resize-none bg-transparent p-3 font-mono text-[11px] outline-none" />
                </div>
              )}
            </div>
          </div>

          {/* Two distinct actions: Check In → Submit to Simulate */}
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={checkIn} disabled={busy === "checkin"} variant="outline" className="gap-2">
              {busy === "checkin" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCommitHorizontal className="h-4 w-4" />}
              {t("cube10.sim.check_in")} {checkedIn && <Check className="h-3.5 w-3.5" style={{ color: GOOD }} />}
            </Button>
            <Button onClick={() => submit(false)} disabled={busy === "submit" || !checkedIn} className="gap-2">
              {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {t("cube10.sim.submit_simulate")}
            </Button>
            <span className="text-[11px] text-muted-foreground">
              {checkedIn ? t("cube10.sim.checked_in_hint") : t("cube10.sim.check_in_first")}
            </span>
          </div>

          {/* Verdict + validators */}
          {result && (
            <div className="space-y-3 rounded-xl border p-4" style={{ borderColor: `${GOOD}66`, background: `${GOOD}0f` }}>
              <div className="grid gap-3 sm:grid-cols-2">
                {metricCol("LIVE (baseline)", result.baseline)}
                {metricCol("YOUR VERSION", result.candidate)}
              </div>
              <div className="text-sm">
                <b style={{ color: result.decision.decision === "swap" ? GOOD : result.decision.decision === "hold" ? SI : "#ff5d6c" }}>
                  {result.decision.decision.toUpperCase()} · {result.decision.tier}
                </b>{" "}— {result.decision.reason}
                <div className="mt-1 text-[11px] text-muted-foreground">
                  same output: {String(result.verdict.equivalent)} · faster: {String(result.verdict.faster)} · metrics-pass: {String(result.verdict.compare_passed)} · replay: {result.replay.replay_hash.slice(0, 12)}…
                </div>
              </div>
              {/* 3-member outcome validation */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono" style={{ color: HI }}>웃 {t("cube10.sim.validators")} {result.validation.validators}/{result.validation.required}</span>
                <span className="text-muted-foreground">— {t("cube10.sim.validators_note")}</span>
              </div>
              {/* Human review + submit contribution */}
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <span className="text-xs font-semibold text-muted-foreground">{t("cube10.sim.human_review")}</span>
                <button onClick={() => setVerdictVote("pass")} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${verdictVote === "pass" ? "text-black" : ""}`} style={verdictVote === "pass" ? { background: GOOD, borderColor: GOOD } : { color: GOOD, borderColor: `${GOOD}66` }}><Check className="h-3 w-3" />{t("cube10.sim.vote_pass")}</button>
                <button onClick={() => setVerdictVote("revise")} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${verdictVote === "revise" ? "text-black" : ""}`} style={verdictVote === "revise" ? { background: SI, borderColor: SI } : { color: SI, borderColor: `${SI}66` }}><Pencil className="h-3 w-3" />{t("cube10.sim.vote_revise")}</button>
                <button onClick={() => setVerdictVote("block")} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${verdictVote === "block" ? "text-black" : ""}`} style={verdictVote === "block" ? { background: "#ff5d6c", borderColor: "#ff5d6c" } : { color: "#ff5d6c", borderColor: "#ff5d6c66" }}><Ban className="h-3 w-3" />{t("cube10.sim.vote_block")}</button>
                <Button onClick={() => submit(true)} disabled={busy === "submit" || verdictVote !== "pass"} className="ml-auto gap-2" size="sm">
                  <Flag className="h-4 w-4" />{t("cube10.sim.submit_contribution")}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Compose the LIVE panel text from the whitelisted backend source blocks.
function composeLive(blocks: SourceBlock[]): string {
  return blocks
    .filter((b) => b.resolved && b.source)
    .map((b) => `# ${b.path}\n${b.source}`)
    .join("\n\n");
}

function col(title: string, items: string[], color: string) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color }}>{title}</div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {items.map((x) => <li key={x} className="font-mono">{x}</li>)}
      </ul>
    </div>
  );
}

function metricCol(title: string, side: { metrics?: Record<string, number>; determinism_signature?: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 text-xs font-semibold">{title}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {Object.entries(side.metrics ?? {}).map(([k, v]) => (
          <div key={k} className="rounded border p-2">
            <div className="text-muted-foreground">{k}</div>
            <div className="font-mono text-foreground">{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
