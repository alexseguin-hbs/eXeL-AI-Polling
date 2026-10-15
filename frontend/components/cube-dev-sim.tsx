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
import { cubeGridOrder } from "@/lib/cube-grid";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Boxes, Loader2, Play, GitCommitHorizontal, Maximize2, X, Check, Pencil, Ban, Flag, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useLexicon } from "@/lib/lexicon-context";
import { CubeVoxel3D } from "@/components/2525-core/cube-voxel-3d";
import { runSimPlay, type PlayStep } from "@/lib/sim-play";

type CubeInfo = { cube_id: number; name: string; harness_available: boolean; default_sections?: number };
type SectionIO = { inputs: string[]; functions: string[]; outputs: string[] };
type Section = { key: string; code?: string; label: string; functions: string[]; highlight: Record<string, number[]>; io?: SectionIO };
type Contract = {
  cube_id: number; name: string;
  io_contract: { inputs: string[]; functions: string[]; outputs: string[] };
  sections?: Section[];
};
type SourceBlock = { name: string; section: string; resolved: boolean; path: string | null; source: string | null };
type SecMetrics = { duration_ms: number; row_count: number; loc: number; ssses: { security: number; stability: number; scalability: number; efficiency: number; succinctness: number; measured?: boolean; notes?: string[] } };
type CouncilVariant = { id: string; strategy: string; description: string; projected_efficiency_pct: number; council: { safe: boolean; recommended: boolean; approvals: number; lenses: number } };
type AiCouncil = { enabled: boolean; provider_available: boolean; variants: CouncilVariant[] };
// LIVE (router.sim_cube_submit) sends each side FLAT: {cube_id, role, signature, duration_ms,
// function_calls, db_reads | tests_total, tests_passed}. `metrics` is the older nested form.
type SimSide = { metrics?: Record<string, number>; signature?: string; [k: string]: unknown };
type Verdict = { equivalent: boolean; compare_passed: boolean; faster: boolean; overall_passed: boolean };
type SubmitResult = {
  baseline: SimSide;
  candidate: SimSide;
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


export function CubeDevSim() {
  const { t } = useLexicon();
  const [cubes, setCubes] = useState<CubeInfo[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [sectionKey, setSectionKey] = useState<string | null>(null);
  const [liveBlocks, setLiveBlocks] = useState<SourceBlock[]>([]);
  const [secMetrics, setSecMetrics] = useState<SecMetrics | null>(null);   // SP: real per-block metrics + SSSES
  const [council, setCouncil] = useState<AiCouncil | null>(null);          // SA: Semi/Auto scaffold (DISABLED)
  const [showCouncil, setShowCouncil] = useState(false);
  const [candidate, setCandidate] = useState("");
  const [checkedIn, setCheckedIn] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [maxCode, setMaxCode] = useState<"" | "split" | "live" | "yours">("");
  const [voxelMax, setVoxelMax] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [verdictVote, setVerdictVote] = useState<"pass" | "revise" | "block">("pass");
  const [seconds, setSeconds] = useState(15 * 60);
  const [play, setPlay] = useState<PlayStep | null>(null);   // Demo Play narration banner
  const playing = useRef(false);
  const startDemo = useCallback(() => {
    if (playing.current) { playing.current = false; setPlay(null); return; }
    playing.current = true;
    void runSimPlay(setPlay, () => !playing.current).finally(() => { playing.current = false; });
  }, []);

  // Timer starts on open, counts down; ♡ = ceil(active minutes), ◬ = ♡×5, 웃 = hours × 7.25
  // (TIME-denominated — 웃 is earned by the hour, never converted from a currency amount).
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
    // Always open at the cube's REAL LIVE-code sections (no granularity switching —
    // operator: "we are going off LIVE CODE now").
    const def = cubes.find((c) => c.cube_id === id)?.default_sections ?? 4;
    setSel(id); setErr(""); setExploded(false);
    void loadContract(id, def);
  }, [cubes, loadContract]);

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
  // Decimal code per block index (1.1…1.N) — labels each block in the exploded view.
  const sectionCodes = useMemo(() => sections.map((s, i) => s.code ?? `${i + 1}`), [sections]);
  const curated = !!sectionKey;   // every block now resolves REAL live source → editable

  // SP: fetch REAL per-block metrics + SSSES for the selected block (section-scoped replay
  // duration + rows + source LOC → 5-pillar qualification). Reruns when the block changes.
  useEffect(() => {
    if (!sel || !sectionKey) { setSecMetrics(null); return; }
    let alive = true;
    api.get<SecMetrics>(`/sim/cube/${sel}/section-metrics?section=${sectionKey}&sections=${nSections}`)
      .then((d) => { if (alive) setSecMetrics(d); })
      .catch(() => { if (alive) setSecMetrics(null); });
    return () => { alive = false; };
  }, [sel, sectionKey, nSections]);

  // SA: fetch the Semi/Auto scaffold for the selected block (DISABLED demo surface).
  // Shows what ② Semi-Auto would propose (AI variants + 12-lens SAFE/RECOMMENDED) on the
  // SAME backbone — no autonomous swap runs; enabled stays false until Manual is aligned.
  useEffect(() => {
    if (!sel || !sectionKey) { setCouncil(null); return; }
    let alive = true;
    api.get<AiCouncil>(`/sim/cube/${sel}/ai-council?section=${sectionKey}&sections=${nSections}`)
      .then((d) => { if (alive) setCouncil(d); })
      .catch(() => { if (alive) setCouncil(null); });
    return () => { alive = false; };
  }, [sel, sectionKey, nSections]);

  // FX-B: fetch the REAL live source for the selected section (backend inspect.getsource,
  // whitelisted to app/cubes/**) so the LIVE panel shows the running code — not a
  // placeholder. Prefill YOUR VERSION from it when empty, so the Dev edits from real code.
  useEffect(() => {
    // REAL live source for the selected block — works for curated A-D AND the LIVE·N block
    // keys (B1…BN) so every decimal block shows the actual code running on the platform.
    if (!sel || !sectionKey) { setLiveBlocks([]); return; }
    let alive = true;
    api.get<{ blocks: SourceBlock[] }>(`/sim/cube/${sel}/source?section=${sectionKey}&sections=${nSections}`)
      .then((d) => {
        if (!alive) return;
        const blocks = d.blocks ?? [];
        setLiveBlocks(blocks);
        const src = composeLive(blocks);
        if (src) setCandidate((cur) => (cur ? cur : src));
      })
      .catch(() => { if (alive) setLiveBlocks([]); });
    return () => { alive = false; };
  }, [sel, sectionKey, nSections]);

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
    <div className="mx-auto w-full max-w-4xl space-y-4 overflow-x-clip p-4 pb-48">
      {/* Demo Play narration banner — fixed above the music HUD; tinted by tier. */}
      {play && (
        <div className="fixed inset-x-0 bottom-28 z-40 mx-auto max-w-2xl px-4">
          <div className="flex items-start gap-2 rounded-xl border p-3 text-sm shadow-lg backdrop-blur"
            style={{
              background: "rgba(10,22,40,0.92)",
              borderColor: play.tier === "manual" ? GOOD : play.tier === "semi" ? SI : play.tier === "auto" ? HI : AI,
              color: "#e8eefc",
            }}>
            <Play className="mt-0.5 h-4 w-4 shrink-0"
              style={{ color: play.tier === "manual" ? GOOD : play.tier === "semi" ? SI : play.tier === "auto" ? HI : AI }} />
            <span className="flex-1">{play.text}</span>
            <button onClick={startDemo} className="shrink-0 rounded border px-1.5 text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
        </div>
      )}
      {/* Top bar — title · timer · ♡웃◬ HUD */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2">
          <Boxes className="h-5 w-5" style={{ color: AI }} />
          <div>
            <h2 className="text-sm font-semibold leading-tight">{t("cube10.sim.wb_title")}</h2>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{t("cube10.sim.wb_subtitle")}</p>
          </div>
          <button onClick={startDemo} title={t("cube10.sim.demo_play")}
            className="ml-1 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition"
            style={play ? { background: HI, borderColor: HI, color: "#0a1628" } : { color: AI, borderColor: `${AI}66` }}>
            <Play className="h-3 w-3" />{t("cube10.sim.demo_play")}
          </button>
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
      {/* Always a 3×3 in the cube's REAL positions — (row, col, level) spiral right → down → left → up
          around Session at the centre (lib/cube-grid.ts). A single row of nine would hide the geometry. */}
      <div className="grid max-w-md grid-cols-3 gap-2">
        {cubeGridOrder(1).map((n) => cubes.find((c) => c.cube_id === n)).filter((c): c is CubeInfo => !!c).map((c) => (
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
          {/* LIVE-code section strip — one chip per REAL live-code building block (the
              cube's own functions). Pick one → the voxel lights that block. The decimal
              code (1.1…) is the sole identifier; the real function name rides beside it. */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border bg-card p-3">
            <span className="mr-1 text-xs font-semibold text-muted-foreground">{t("cube10.sim.live_sections")}</span>
            {sections.map((s, i) => (
              <button key={s.key} onClick={() => { setSectionKey(s.key); setResult(null); setCandidate(""); }}
                data-sim-section={s.key} data-sim-level={i + 1}
                className={`flex items-center gap-1.5 rounded-lg border transition ${nSections > 9 ? "px-2 py-1 text-[11px]" : "px-3 py-1.5 text-xs"} ${
                  sectionKey === s.key ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
                style={sectionKey === s.key ? { background: SI, borderColor: SI } : undefined}>
                <span className="font-mono font-bold">{s.code ?? `${i + 1}·${s.key}`}</span>
                {nSections <= 9 && s.functions?.[0] && <span className="font-mono opacity-80">{s.functions[0]}</span>}
              </button>
            ))}
          </div>

          {/* The 3×3×3 is ALWAYS a wireframe outline; the selected block's mini-cubes
              fill solid (ON), the rest stay outline (OFF). Rotate by dragging; Explode
              separates the blocks; ⤢ pops out. Reuses the R-Core camera. */}
          <div className="rounded-xl border bg-card p-4">
            {/* Voxel gets its OWN centered row so the cube is centered at EVERY width
                (mobile + desktop), never pushed off-center by a side panel. */}
            <div className="flex justify-center">
              <div className="relative mx-auto w-fit" data-sim-voxel={sel ?? ""}>
                <CubeVoxel3D lit={litCells} blockOf={blockOf} nSections={nSections} codes={sectionCodes} exploded={exploded} px={200} />
                <button onClick={() => setVoxelMax(true)} title={t("cubeDevSim.pop_out_rotate")}
                  className="absolute right-1 top-1 rounded border bg-background/80 p-1 text-muted-foreground backdrop-blur hover:text-primary">
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {/* LIVE code only — no granularity switching. The blocks ARE the cube's real
                live-code sections; Explode separates them, assemble snaps back. */}
            <div className="mt-3 text-center">
              <div className="text-sm font-semibold">Cube {contract.cube_id} · {contract.name}</div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
                <button onClick={() => setExploded((e) => !e)} title={t("cubeDevSim.explode_assemble_blocks")}
                  className={`rounded border px-2 py-0.5 text-[11px] transition ${exploded ? "text-black" : "text-muted-foreground hover:text-foreground"}`}
                  style={exploded ? { background: HI, borderColor: HI } : undefined}>Explode</button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {nSections} LIVE-code blocks · selected{" "}
                <b style={{ color: SI }}>{activeSection?.code ?? activeSection?.key}</b>
                {activeSection?.functions?.[0] ? <> <span className="font-mono">{activeSection.functions[0]}</span></> : null} — {litCells.size} cubes ON.
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">{t("cubeDevSim.drag_rotate_zoom_explode")}</p>
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
                <span className="text-[11px] text-muted-foreground">{t("cubeDevSim.drag_rotate_zoom")}</span>
                <button onClick={() => setVoxelMax(false)} className="ml-auto rounded border px-2 py-1 text-xs">
                  <X className="mr-1 inline h-3 w-3" />Exit</button>
              </div>
              <div className="flex-1">
                <CubeVoxel3D lit={litCells} blockOf={blockOf} nSections={nSections} codes={sectionCodes} exploded={exploded} px={0} fill />
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

          {/* SP: per-block SSSES qualification (real metrics — section replay + LOC). The
              Vision-2525 qualification bar for THIS building block. */}
          {secMetrics && (
            <div className="rounded-xl border bg-card p-3">
              <div className="mb-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-semibold" style={{ color: AI }}>{t("cube10.sim.ssses")} · <b style={{ color: SI }}>{activeSection?.code}</b></span>
                <span className="font-mono">
                  {secMetrics.ssses.measured ? `${secMetrics.row_count} rows · ${secMetrics.duration_ms.toFixed(0)}ms · ${secMetrics.loc} LOC` : `${secMetrics.loc} LOC`}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {([
                  ["cube10.sim.ssses_security", secMetrics.ssses.security],
                  ["cube10.sim.ssses_stability", secMetrics.ssses.stability],
                  ["cube10.sim.ssses_scalability", secMetrics.ssses.scalability],
                  ["cube10.sim.ssses_efficiency", secMetrics.ssses.efficiency],
                  ["cube10.sim.ssses_succinctness", secMetrics.ssses.succinctness],
                ] as const).map(([k, v]) => {
                  const c = v >= 90 ? GOOD : v >= 70 ? SI : "#ff6b7a";
                  return (
                    <div key={k} className="rounded-lg border p-1.5 text-center" style={{ borderColor: `${c}55` }}>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{t(k)}</div>
                      <div className="text-sm font-bold" style={{ color: c }}>{v}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                <div className="flex min-w-0 flex-col rounded-lg border bg-[#080f1d]">
                  <div className="flex items-center gap-2 border-b px-3 py-2">
                    <span className="rounded border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">LIVE</span>
                    <span className="font-mono text-[11px] text-muted-foreground">{activeSection?.functions[0] ?? "cube"}() · running now</span>
                    <button onClick={() => setMaxCode("live")} className="ml-auto text-muted-foreground hover:text-primary"><Maximize2 className="h-3.5 w-3.5" /></button>
                  </div>
                  <pre className={`flex-1 overflow-auto p-3 font-mono text-[11px] text-muted-foreground ${maxCode === "live" ? "max-h-[80vh]" : "max-h-56"}`}>{liveSource}</pre>
                </div>
              )}
              {maxCode !== "live" && (
                <div className="flex min-w-0 flex-col rounded-lg border" style={{ borderColor: AI }}>
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
            {/* SA — ② Semi-Auto preview (scaffold, DISABLED). Shows what the AI council would
                propose for the selected block on the SAME backbone; no autonomous swap runs. */}
            {sectionKey && council && council.variants.length > 0 && (
              <div className="mt-2 border-t pt-2">
                <button onClick={() => setShowCouncil((v) => !v)}
                  className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: SI }}>
                  <span>② {t("cube10.sim.council_preview")}</span>
                  <span className="rounded px-1 py-0.5 text-[8px] uppercase tracking-wide" style={{ background: `${SI}22`, color: SI }}>
                    {t("cube10.sim.tier_locked")}
                  </span>
                  <span className="text-muted-foreground">{showCouncil ? "▾" : "▸"}</span>
                </button>
                {showCouncil && (
                  <div className="mt-1.5 space-y-1.5">
                    {council.variants.map((v) => (
                      <div key={v.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded border px-2 py-1 text-[11px]"
                        style={{ borderColor: v.council.recommended ? `${GOOD}55` : `${SI}22`, opacity: 0.85 }}>
                        <span className="font-mono font-semibold" style={{ color: SI }}>{v.strategy}</span>
                        <span className="text-muted-foreground">{v.description}</span>
                        <span className="ml-auto font-mono" style={{ color: GOOD }}>~+{v.projected_efficiency_pct}%</span>
                        <span className="font-mono text-[9px]" style={{ color: v.council.safe ? GOOD : "#ff5d6c" }}>
                          {v.council.safe ? "SAFE" : "VETO"} · {v.council.recommended ? "REC" : "—"} · {v.council.approvals}/{v.council.lenses}
                        </span>
                      </div>
                    ))}
                    <p className="text-[9px] text-muted-foreground/70">{t("cube10.sim.council_note")}</p>
                  </div>
                )}
              </div>
            )}
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
              {/* AGG — Community Aggregator readout: a proven win becomes a rankable item
                  in eXeL AI polling (Cube 7), so the community prioritizes which cube/block
                  improvements ship next. Producer for the platform's own governance loop. */}
              {result.optimization?.win && (() => {
                const o = result.optimization!;
                const s = secMetrics?.ssses;
                const sssesAvg = s
                  ? Math.round((s.security + s.stability + s.scalability + s.efficiency + s.succinctness) / 5)
                  : null;
                const code = activeSection?.code ?? `${sel}`;
                return (
                  <div className="rounded-lg border p-3" style={{ borderColor: `${SI}44`, background: `${SI}0c` }}>
                    <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold" style={{ color: SI }}>
                      → {t("cube10.sim.aggregator")}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
                      <span className="rounded px-1.5 py-0.5" style={{ background: `${SI}22`, color: SI }}>{code}</span>
                      <span style={{ color: GOOD }}>+{o.optimization_pct}% · {Math.round((1 - o.cube_scale) * 100)}% smaller</span>
                      {sssesAvg !== null && <span className="text-muted-foreground">SSSES {sssesAvg}</span>}
                      <span className="text-muted-foreground">· {t("cube10.sim.aggregator_pending")}</span>
                    </div>
                    <div className="mt-1.5 text-[11px] text-muted-foreground">{t("cube10.sim.aggregator_note")}</div>
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

function metricCol(title: string, side: SimSide) {
  // The numeric measurements of one side, whichever shape arrives — LIVE's flat fields, or a nested
  // `metrics`. Before this read only `metrics`, so against the real backend both columns rendered EMPTY.
  const rows = side.metrics
    ? Object.entries(side.metrics)
    : Object.entries(side).filter(([k, v]) => typeof v === "number" && k !== "cube_id");
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 text-xs font-semibold">{title}</div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="rounded border p-2">
            <div className="text-muted-foreground">{k}</div>
            <div className="font-mono text-foreground">{String(v)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
