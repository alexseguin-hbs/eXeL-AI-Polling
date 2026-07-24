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
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import {
  Boxes, Loader2, Play, GitCommitHorizontal, Maximize2, X, Check, Pencil, Ban, Flag, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useLexicon } from "@/lib/lexicon-context";
import { useRCoreGestures } from "@/components/architect-2525/use-rcore-gestures";

type CubeInfo = { cube_id: number; name: string; harness_available: boolean; default_sections?: number };
type SectionIO = { inputs: string[]; functions: string[]; outputs: string[] };
type Section = { key: string; code?: string; label: string; functions: string[]; highlight: Record<string, number[]>; io?: SectionIO };
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
  optimization?: { optimization_pct: number; win: boolean; cube_scale: number; live_scale?: number; basis?: string; threshold_pct?: number };
};

// Code sections partition the 27 voxels; each is labelled by a decimal code
// ({cube}.{k} — e.g. 2.1 … 2.8), with .1 the foundational block anchored at the base
// (the L1·A naming collided with the Level tiers L1/L2/L3 = Cubes 1-9/10-18/19-27).
// FULL=9 asks voxel_highlight for the whole section (no 3/6/9 density scaling here —
// the 3/6/9 dial belongs to the theme viz, not the code-section model).
const FULL = 9;
const AI = "#19c8cf", SI = "#ffcf5a", HI = "#b98cff", GOOD = "#3ddc9a";

// Per-block palette (FX-I) — Trinity colors first (AI·SI·HI·GOOD), then distinct hues
// so up to 27 building blocks each read as a different color (operator: "trinity colors
// first then more if 13+ sections").
const BLOCK_PAL = [AI, SI, HI, GOOD, "#ff6b6b", "#4dabf7", "#f783ac", "#ffa94d", "#a9e34b",
  "#63e6be", "#748ffc", "#ffd43b", "#e599f7", "#66d9e8", "#ff8787", "#b2f2bb"];
function blockColor(k: number): string {
  if (k < BLOCK_PAL.length) return BLOCK_PAL[k];
  // Past the named palette (13+ blocks): golden-angle hue PLUS lightness/saturation that
  // alternate by index parity, so adjacent blocks stay distinct all the way to 27.
  const hue = Math.round((k * 137.508) % 360);
  const light = k % 2 === 0 ? 63 : 48;
  const sat = k % 3 === 0 ? 78 : 62;
  return `hsl(${hue} ${sat}% ${light}%)`;
}

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
  const [voxelMax, setVoxelMax] = useState(false);
  const [secCount, setSecCount] = useState(4);   // FX-G granularity: 3 | 4 | 9 | 27
  const [exploded, setExploded] = useState(false);
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

  // Load a cube's contract at a chosen block granularity (FX-G): 4 = curated function
  // sections · 3/9/27 = coherent block-segments. The backend sections_for is the source.
  const loadContract = useCallback(async (id: number, count: number) => {
    setContract(null); setSectionKey(null); setResult(null); setCheckedIn(null);
    setCandidate(""); setBusy("contract");
    try {
      const c = await api.get<Contract>(`/sim/cube/${id}/contract?sections=${count}`);
      setContract(c);
      setSectionKey(c.sections?.[0]?.key ?? null);
    } catch { setErr(`Cube ${id} contract unavailable.`); }
    finally { setBusy(""); }
  }, []);

  const pick = useCallback((id: number) => {
    // Default to the cube's REAL code-unit count (its LIVE code needed to run SIM),
    // not a fixed 4 (operator: "use reality, do not default to 4").
    const def = cubes.find((c) => c.cube_id === id)?.default_sections ?? 4;
    setSel(id); setErr(""); setSecCount(def); setExploded(false);
    void loadContract(id, def);
  }, [cubes, loadContract]);

  const changeCount = useCallback((n: number) => {
    setSecCount(n);
    if (sel) void loadContract(sel, n);
  }, [sel, loadContract]);

  const sections = contract?.sections ?? [];
  const activeSection = sections.find((s) => s.key === sectionKey) ?? null;
  const litCells = useMemo(() => {
    const set = new Set(activeSection?.highlight?.[String(FULL)] ?? []);
    return set;
  }, [activeSection]);

  const nSections = sections.length;
  // Which block each of the 27 cells belongs to — drives the exploded-view offset.
  const blockOf = useMemo(() => {
    const arr = new Array(27).fill(0);
    sections.forEach((s, i) => (s.highlight?.[String(FULL)] ?? []).forEach((c) => { arr[c] = i; }));
    return arr;
  }, [sections]);
  const curated = !!sectionKey && /^[A-D]$/.test(sectionKey);   // Fn·4 view = editable source

  // FX-B: fetch the REAL live source for the selected section (backend inspect.getsource,
  // whitelisted to app/cubes/**) so the LIVE panel shows the running code — not a
  // placeholder. Prefill YOUR VERSION from it when empty, so the Dev edits from real code.
  useEffect(() => {
    // LIVE source is per curated function section (A-D). In block view (B1..BN) a block
    // spans functions, so we skip the fetch and show the block's function list instead.
    if (!sel || !sectionKey || !curated) { setLiveBlocks([]); return; }
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

  const liveSource = useMemo(() => {
    const src = composeLive(liveBlocks);
    if (src) return src;
    const fns = activeSection?.functions ?? [];
    if (fns.length) {
      return `# ${activeSection?.label ?? "block"} · ${activeSection?.key ?? ""}\n`
        + `# this block spans: ${fns.join(", ")}\n`
        + `# switch to the Fn·4 view to read & edit a single function's live source`;
    }
    return `# ${contract?.name ?? "cube"} · section ${activeSection?.key ?? ""}\n# live source unavailable (read-only)`;
  }, [liveBlocks, contract, activeSection]);

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

  // pb-48 on the root reserves space for the fixed easter-egg music HUD (3 Seed
  // track-switchers + play/volume transport, all interactive) so the workbench
  // Check In / Submit / Feedback controls always scroll clear of it (FX-C).
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 pb-48">
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
          {/* Section strip — one chip per section at the chosen granularity. Pick one →
              the voxel lights that whole COHERENT block. Compact for many blocks. */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-3">
            <span className="mr-1 text-xs font-semibold text-muted-foreground">{t("cube10.sim.level")}</span>
            {sections.map((s, i) => (
              <button key={s.key} onClick={() => { setSectionKey(s.key); setResult(null); setCandidate(""); }}
                data-sim-section={s.key} data-sim-level={i + 1}
                className={`flex items-center gap-1.5 rounded-lg border transition ${nSections > 9 ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"} ${
                  sectionKey === s.key ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
                style={sectionKey === s.key ? { background: SI, borderColor: SI } : undefined}>
                <span className="font-mono font-bold">{s.code ?? `${i + 1}·${s.key}`}</span>
                {nSections <= 9 && <span className="opacity-80">{s.label}</span>}
              </button>
            ))}
          </div>

          {/* The 3×3×3 is ALWAYS a wireframe outline; the selected block's mini-cubes
              fill solid (ON), the rest stay outline (OFF). Rotate by dragging; Explode
              separates the blocks; ⤢ pops out. Reuses the R-Core camera. */}
          <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
            <div className="relative" data-sim-voxel={sel ?? ""}>
              <CubeVoxel3D lit={litCells} blockOf={blockOf} nSections={nSections} exploded={exploded} px={200} />
              <button onClick={() => setVoxelMax(true)} title="Pop out & rotate"
                className="absolute right-1 top-1 rounded border bg-background/80 p-1 text-muted-foreground backdrop-blur hover:text-primary">
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="min-w-[180px] flex-1">
              <div className="text-sm font-semibold">Cube {contract.cube_id} · {contract.name}</div>
              {/* Granularity + Explode — how many building blocks the 27 mini-cubes group into. */}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {(() => {
                  const liveN = cubes.find((c) => c.cube_id === sel)?.default_sections ?? 4;
                  const opts = [liveN, 2, 3, 4, 6, 9, 27].filter((n, i, a) => a.indexOf(n) === i);
                  return opts.map((n) => (
                    <button key={n} onClick={() => changeCount(n)} disabled={busy === "contract"}
                      className={`rounded border px-2 py-0.5 font-mono text-[11px] transition ${secCount === n ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
                      style={secCount === n ? { background: AI, borderColor: AI } : undefined}>
                      {n === liveN ? `Live·${n}` : n === 4 ? "Fn·4" : String(n)}</button>
                  ));
                })()}
                <button onClick={() => setExploded((e) => !e)} title="Explode / assemble the blocks"
                  className={`ml-1 rounded border px-2 py-0.5 text-[11px] transition ${exploded ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
                  style={exploded ? { background: HI, borderColor: HI } : undefined}>Explode</button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                27 mini-cubes · {nSections} {secCount === 4 ? "sections" : "blocks"} · selected{" "}
                <b style={{ color: SI }}>{activeSection?.code ?? activeSection?.key}</b> (<b>{activeSection?.label}</b>) — {litCells.size} cubes ON.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">Drag to rotate · pinch/scroll to zoom · Explode separates the blocks.</p>
            </div>
          </div>

          {/* Pop-out: a large rotatable/explodable view of the same cube. */}
          {voxelMax && (
            <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-4 pt-12 backdrop-blur">
              <div className="mb-2 flex items-center gap-2">
                <b className="font-mono text-xs" style={{ color: AI }}>CUBE {contract.cube_id} · {contract.name} · {nSections} BLOCKS</b>
                <button onClick={() => setExploded((e) => !e)}
                  className={`rounded border px-2 py-0.5 text-[11px] ${exploded ? "text-black" : "text-muted-foreground"}`}
                  style={exploded ? { background: HI, borderColor: HI } : undefined}>Explode</button>
                <span className="text-[11px] text-muted-foreground">— drag to rotate · pinch/scroll to zoom</span>
                <button onClick={() => setVoxelMax(false)} className="ml-auto rounded border px-2 py-1 text-xs">
                  <X className="mr-1 inline h-3 w-3" />Exit</button>
              </div>
              <div className="flex-1">
                <CubeVoxel3D lit={litCells} blockOf={blockOf} nSections={nSections} exploded={exploded} px={0} fill />
              </div>
            </div>
          )}

          {/* Block I·F·O — the SELECTED building block's own inputs·functions·outputs
              (FX-H), falling back to the whole-cube contract. */}
          <div className="grid gap-3 sm:grid-cols-3">
            {col(t("cube10.sim.input"), activeSection?.io?.inputs ?? contract.io_contract.inputs, SI)}
            {col(t("cube10.sim.functions"), activeSection?.io?.functions ?? activeSection?.functions ?? contract.io_contract.functions, AI)}
            {col(t("cube10.sim.output"), activeSection?.io?.outputs ?? contract.io_contract.outputs, HI)}
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

          {/* One backbone · three autonomy tiers — Manual is live; Semi/Auto plug agents
              into the SAME check-in→simulate→compare→decide engine once Manual is aligned. */}
          <div className="rounded-xl border p-3" style={{ borderColor: `${AI}33` }}>
            <div className="mb-2 text-[11px] font-semibold text-muted-foreground">{t("cube10.sim.tier_backbone")}</div>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { n: "①", label: t("cube10.sim.tier_manual"), active: true, color: GOOD },
                { n: "②", label: t("cube10.sim.tier_semi"), active: false, color: SI },
                { n: "③", label: t("cube10.sim.tier_auto"), active: false, color: HI },
              ].map((tr) => (
                <div key={tr.n} className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs"
                  style={tr.active
                    ? { background: `${tr.color}22`, borderColor: tr.color, color: tr.color }
                    : { opacity: 0.5 }}>
                  <span className="font-mono font-bold">{tr.n}</span>
                  <span className="font-semibold">{tr.label}</span>
                  <span className="text-[9px] uppercase tracking-wide">
                    {tr.active ? t("cube10.sim.tier_active") : t("cube10.sim.tier_locked")}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground/70">{t("cube10.sim.tier_note")}</p>
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
              {/* Parity+efficiency proof — LIVE vs candidate cube: on a ≥10% win the
                  candidate renders that % SMALLER than Live (8×8×8 replaces 10×10×10). */}
              {result.optimization && (() => {
                const o = result.optimization!;
                const smallerPct = Math.round((1 - o.cube_scale) * 100);
                return (
                  <div className="rounded-lg border p-3" style={{ borderColor: o.win ? `${GOOD}66` : `${AI}33` }}>
                    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                      <b style={{ color: o.win ? GOOD : SI }}>
                        {o.win ? "⬢ WIN" : "PARITY"} · {o.optimization_pct >= 0 ? "+" : ""}{o.optimization_pct}% efficiency
                      </b>
                      <span className="text-muted-foreground">
                        {o.win
                          ? `candidate cube ${smallerPct}% smaller — same output, less compute`
                          : `beat LIVE by ≥${o.threshold_pct ?? 10}% to earn a smaller cube (8×8×8 for 10×10×10)`}
                      </span>
                    </div>
                    <div className="flex items-end justify-center gap-8">
                      <div className="text-center">
                        <CubeVoxel3D lit={litCells} blockOf={blockOf} nSections={nSections} px={120} />
                        <div className="mt-1 text-[10px] text-muted-foreground">LIVE · 100%</div>
                      </div>
                      <div className="text-center">
                        <div style={{ transform: `scale(${o.cube_scale})`, transformOrigin: "center bottom", width: 120, height: 120 }}>
                          <CubeVoxel3D lit={litCells} blockOf={blockOf} nSections={nSections} px={120} />
                        </div>
                        <div className="mt-1 text-[10px]" style={{ color: o.win ? GOOD : undefined }}>
                          YOURS · {Math.round(o.cube_scale * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
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

// 27 stackable sub-cube BLOCKS in real CSS-3D (no WebGL), rotatable via the shared
// Vision-2525 R-Core camera. Reuses the voxel-house pattern (preserve-3d + perspective +
// rotateX(pitch)/rotateZ(bearing)). Lit blocks glow (SI); the rest read as a dim lattice
// so the whole 3×3×3 identity fingerprint is visible while the worked section stands out.
function CubeVoxel3D({ lit, blockOf, nSections, exploded = false, px = 200, fill = false }: {
  lit: Set<number>; blockOf: number[]; nSections: number; exploded?: boolean; px?: number; fill?: boolean;
}) {
  const cam = useRCoreGestures({
    initialBearing: -0.6, initialPitch: 60, initialZoom: 1, touchOrbit: true, pan: false,
    cfg: { minPitch: 8, maxPitch: 86, minZoom: 0.5, maxZoom: 3.5 },
  });
  const { bearing, pitch, zoom } = cam;
  // Minimal 1px seam so mini-cubes read as ONE solid object (faces touch, Lego rule)
  // while a thin black line still shows the divisions (FX-N); smaller cells so the
  // exploded spread fits.
  const cell = fill ? 40 : 24, gap = 1, step = cell + gap;
  // Each building block is a DIFFERENT color (FX-I). The selected block fills solid +
  // bright; the other blocks show in their own color, dimmer (so all distinct blocks
  // read at a glance). Exploded → each block moves as a RIGID group along its centroid
  // direction (blocks stay together, clear spacing between them). Memoized (not per-frame).
  const blocks = useMemo<ReactNode[]>(() => {
    const at = (t: string): CSSProperties => ({ position: "absolute", left: "50%", top: "50%", transform: `translate(-50%,-50%) ${t}` });
    const face = (t: string, w: number, h: number, hex: string, alpha: string): CSSProperties =>
      ({ ...at(t), width: w, height: h, border: `1px solid ${hex}`, background: `${hex}${alpha}` });
    // Per-block centroid (cell-space, centered at 0) → the rigid explode direction.
    const sums: Record<number, [number, number, number, number]> = {};
    for (let i = 0; i < 27; i++) {
      const k = blockOf[i] ?? 0, x = i % 3, y = Math.floor(i / 3) % 3, z = Math.floor(i / 9);
      const s = (sums[k] ||= [0, 0, 0, 0]); s[0] += x; s[1] += y; s[2] += z; s[3] += 1;
    }
    // Explode direction: NORMALIZE each block's centroid-from-center to a unit vector so
    // every block clears its neighbors by a full step regardless of shape; a block centred
    // on the middle (|dir|≈0) would never separate, so fall back to a golden-angle direction
    // by index. A small per-index radius nudge separates blocks that share a direction.
    const dir: Record<number, [number, number, number]> = {};
    const keys = Object.keys(sums).map(Number).sort((a, b) => a - b);
    keys.forEach((k, idx) => {
      const s = sums[k];
      let dx = s[0] / s[3] - 1, dy = s[1] / s[3] - 1, dz = s[2] / s[3] - 1;
      const norm = Math.hypot(dx, dy, dz);
      if (norm > 0.2) { dx /= norm; dy /= norm; dz /= norm; }
      else {
        const a = idx * 2.399963;                       // golden angle (rad)
        dx = Math.cos(a); dy = Math.sin(a); dz = Math.cos(a * 1.7) * 0.7;
        const n2 = Math.hypot(dx, dy, dz) || 1; dx /= n2; dy /= n2; dz /= n2;
      }
      const r = 0.85 + 0.5 * (idx / Math.max(1, keys.length - 1));   // per-index radius spread
      dir[k] = [dx * r, dy * r, dz * r];
    });
    const exStep = fill ? step * 3.0 : step * 2.4;   // much more spacing between blocks (FX-M)
    const out: ReactNode[] = [];
    for (let i = 0; i < 27; i++) {
      const layer = Math.floor(i / 9), c9 = i % 9, row = Math.floor(c9 / 3), col = c9 % 3;
      const k = blockOf[i] ?? 0, d = dir[k] ?? [0, 0, 0];
      const ox = exploded ? d[0] * exStep : 0, oy = exploded ? d[1] * exStep : 0, oz = exploded ? d[2] * exStep : 0;
      const x = (col - 1) * step + ox, y = (row - 1) * step + oy, z = (layer - 1) * step + oz;
      const on = lit.has(i);
      const hex = blockColor(k);
      // EVERY mini-cube is a solid voxel CUBE in all views (operator: "always cubes like
      // voxel · show each building block"). The three face brightnesses (top>side>far)
      // give each cube its 3D shading; the SELECTED block is brightest, the others are
      // dimmer but still fully solid cubes (never flat squares).
      const [tA, sA, s2A, op] = on ? ["ee", "bb", "99", 1] : ["82", "5a", "3e", 0.92];
      out.push(
        <div key={i} style={{ ...at(`translate3d(${x}px,${y}px,${z}px)`), transformStyle: "preserve-3d", opacity: op }}>
          <div style={face(`translate3d(0px,0px,${cell / 2}px)`, cell, cell, hex, tA)} />
          <div style={face(`translate3d(0px,0px,${-cell / 2}px)`, cell, cell, hex, s2A)} />
          <div style={face(`translate3d(0px,${-cell / 2}px,0px) rotateX(90deg)`, cell, cell, hex, sA)} />
          <div style={face(`translate3d(0px,${cell / 2}px,0px) rotateX(90deg)`, cell, cell, hex, sA)} />
          <div style={face(`translate3d(${-cell / 2}px,0px,0px) rotateY(90deg)`, cell, cell, hex, s2A)} />
          <div style={face(`translate3d(${cell / 2}px,0px,0px) rotateY(90deg)`, cell, cell, hex, s2A)} />
        </div>,
      );
    }
    return out;
  }, [lit, blockOf, nSections, exploded, cell, step, fill]);
  return (
    <div className="relative touch-none select-none overflow-hidden rounded-lg"
      style={{ width: fill ? "100%" : px, height: fill ? "100%" : px, minWidth: fill ? undefined : px }}
      {...cam.handlers} onPointerLeave={cam.handlers.onPointerUp}>
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d", transformOrigin: "center 55%",
        transform: `perspective(900px) rotateX(${pitch}deg) scale(${(exploded ? 0.5 : 0.9) * zoom})` }}>
        <div className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d", transform: `rotateZ(${bearing}rad)` }}>
          {blocks}
        </div>
      </div>
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
