"use client";

/**
 * Cube Developer Simulation (Level-2 · Cube 10) — the Simulation option surface.
 * ====================================================================================
 * Shows Cubes 1-9, lets you inspect a cube's inputs → functions → outputs, PLAY-TEST the
 * whole cube for metrics, and lets a Master Developer check in a candidate for testing
 * (baseline vs candidate → verdict + 3-tier swap decision). Cube 1 is the reference.
 *
 * Backend (reachable at NEXT_PUBLIC_API_URL):
 *   GET  /sim/cubes                 GET  /sim/cube/{id}/contract
 *   POST /sim/cube/{id}/run         POST /sim/cube/{id}/challenge
 * All calls degrade gracefully (a clear message) when the backend isn't reachable.
 */
import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, GitCommitHorizontal, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

type CubeInfo = { cube_id: number; name: string; harness_available: boolean };
type Contract = {
  cube_id: number; name: string;
  io_contract: { inputs: string[]; functions: string[]; outputs: string[] };
};
type RunResult = { metrics: Record<string, number>; determinism_signature: string };
type Verdict = { equivalent: boolean; compare_passed: boolean; faster: boolean; overall_passed: boolean };
type ChallengeResult = { verdict: Verdict; decision: { decision: string; reason: string; tier: string } };

const TIERS = ["manual", "semi", "automated"] as const;

export function CubeDevSim() {
  const [cubes, setCubes] = useState<CubeInfo[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [run, setRun] = useState<RunResult | null>(null);
  const [busy, setBusy] = useState<string>("");
  const [err, setErr] = useState<string>("");

  // Master-Dev check-in state
  const [candSig, setCandSig] = useState("");
  const [candMs, setCandMs] = useState("");
  const [tier, setTier] = useState<(typeof TIERS)[number]>("manual");
  const [verdict, setVerdict] = useState<ChallengeResult | null>(null);

  useEffect(() => {
    api.get<{ cubes: CubeInfo[] }>("/sim/cubes")
      .then((d) => setCubes(d.cubes))
      .catch(() => setErr("Simulation backend not reachable (set NEXT_PUBLIC_API_URL)."));
  }, []);

  const pick = useCallback(async (id: number) => {
    setSel(id); setContract(null); setRun(null); setVerdict(null); setErr("");
    setBusy("contract");
    try {
      setContract(await api.get<Contract>(`/sim/cube/${id}/contract`));
    } catch {
      setErr(`Cube ${id} has no stand-alone harness yet — Cube 1 is the reference.`);
    } finally { setBusy(""); }
  }, []);

  const playTest = useCallback(async () => {
    if (!sel) return;
    setBusy("run"); setErr("");
    try {
      const r = await api.post<RunResult>(`/sim/cube/${sel}/run`);
      setRun(r); setCandSig(r.determinism_signature); setCandMs(String(r.metrics.wall_time_ms));
    } catch { setErr("Play-test failed — is the backend running + are you signed in?"); }
    finally { setBusy(""); }
  }, [sel]);

  const checkIn = useCallback(async () => {
    if (!sel) return;
    setBusy("challenge"); setErr(""); setVerdict(null);
    try {
      setVerdict(await api.post<ChallengeResult>(`/sim/cube/${sel}/challenge`, {
        candidate: { signature: candSig, duration_ms: Number(candMs) || 0 },
        tier, human_approved: tier === "manual", human_selected: tier === "semi",
      }));
    } catch { setErr("Check-in failed — requires an admin / lead-developer session."); }
    finally { setBusy(""); }
  }, [sel, candSig, candMs, tier]);

  const col = (title: string, items: string[]) => (
    <div className="rounded-lg border bg-card p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">{title}</div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {items.map((x) => <li key={x} className="font-mono">{x}</li>)}
      </ul>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5 p-4">
      <div className="flex items-center gap-2">
        <Boxes className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Cube Developer Simulation · Cubes 1–9</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Inspect a cube&apos;s inputs → functions → outputs, play-test it for metrics, and check in an
        optimized version. A candidate that keeps the same determinism signature (same functionality)
        and isn&apos;t slower can be swapped in — an 8×8×8 replacing a 10×10×10.
      </p>

      {/* Cube 1-9 selector */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {cubes.map((c) => (
          <button
            key={c.cube_id}
            data-cube-sim-select={c.cube_id}
            onClick={() => pick(c.cube_id)}
            disabled={!c.harness_available}
            title={c.name}
            className={`rounded-lg border px-2 py-3 text-center text-xs transition ${
              sel === c.cube_id ? "border-primary bg-primary/10 text-primary"
              : c.harness_available ? "hover:border-primary/60"
              : "cursor-not-allowed opacity-40"}`}
          >
            <div className="text-base font-bold">{c.cube_id}</div>
            <div className="mt-0.5 line-clamp-2 leading-tight">{c.name}</div>
          </button>
        ))}
      </div>

      {err && <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300">{err}</div>}

      {/* I/O contract */}
      {busy === "contract" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
      {contract && (
        <div className="space-y-3">
          <div className="text-sm font-semibold">Cube {contract.cube_id} · {contract.name} — I/O contract</div>
          <div className="grid gap-3 sm:grid-cols-3">
            {col("Inputs", contract.io_contract.inputs)}
            {col("Functions", contract.io_contract.functions)}
            {col("Outputs", contract.io_contract.outputs)}
          </div>
          <Button onClick={playTest} disabled={busy === "run"} className="gap-2">
            {busy === "run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Play-test — run the whole cube
          </Button>
        </div>
      )}

      {/* Metrics */}
      {run && (
        <div className="rounded-lg border bg-card p-4">
          <div className="mb-2 text-sm font-semibold">Metrics baseline (LIVE cube)</div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            {Object.entries(run.metrics).map(([k, v]) => (
              <div key={k} className="rounded border p-2">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-mono text-sm text-foreground">{String(v)}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 break-all font-mono text-[11px] text-muted-foreground">
            determinism_signature: {run.determinism_signature}
          </div>
        </div>
      )}

      {/* Master-Dev check-in */}
      {run && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GitCommitHorizontal className="h-4 w-4 text-primary" /> Master Developer — check in for testing
          </div>
          <p className="text-xs text-muted-foreground">
            Run your optimized cube&apos;s harness, then paste its determinism signature + wall-time here.
            Identical signature = same functionality; ≤120% duration passes. (Prefilled with the live baseline —
            edit to submit a real candidate.)
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input value={candSig} onChange={(e) => setCandSig(e.target.value)} placeholder="candidate signature (64-hex)"
              className="rounded border bg-background px-2 py-1.5 font-mono text-xs" />
            <input value={candMs} onChange={(e) => setCandMs(e.target.value)} placeholder="candidate wall_time_ms"
              className="rounded border bg-background px-2 py-1.5 font-mono text-xs" />
          </div>
          <div className="flex items-center gap-2">
            <select value={tier} onChange={(e) => setTier(e.target.value as (typeof TIERS)[number])}
              className="rounded border bg-background px-2 py-1.5 text-xs">
              {TIERS.map((tt) => <option key={tt} value={tt}>{tt}</option>)}
            </select>
            <Button onClick={checkIn} disabled={busy === "challenge"} className="gap-2">
              {busy === "challenge" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitCommitHorizontal className="h-4 w-4" />}
              Check in
            </Button>
          </div>
          {verdict && (
            <div className={`rounded-md border p-3 text-sm ${
              verdict.decision.decision === "swap" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
              : verdict.decision.decision === "hold" ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border-red-500/40 bg-red-500/10 text-red-300"}`}>
              <div className="font-semibold uppercase">{verdict.decision.decision} · {verdict.decision.tier}</div>
              <div className="mt-1 text-xs">{verdict.decision.reason}</div>
              <div className="mt-1 text-[11px] opacity-80">
                equivalent: {String(verdict.verdict.equivalent)} · faster: {String(verdict.verdict.faster)} · metrics-pass: {String(verdict.verdict.compare_passed)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
