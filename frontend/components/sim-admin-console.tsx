"use client";

// WS-G Admin Simulation Console (operator 2026-09-14: the easter-egg unlock should "simulate the
// features with actual API usage" — generate 100-400-word responses around a question, group
// Theme01→Theme02, and simulate priorities in a ranking round; admin can test 5,000 responses or a
// new question). Admin-gated in app/sim/page.tsx (cube10Access === "admin"). Runs self-contained
// (mock pipeline) now; the SAME driver hits the real backend when NEXT_PUBLIC_MOCK_MODE=false.

import { useCallback, useMemo, useState } from "react";
import { Loader2, Play, FlaskConical, Server, MonitorOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankedThemes } from "@/components/flower-of-life/ranked-themes";
import { THEME01_LABELS } from "@/lib/adapt-live-themes";
import type { Theme01Label, ThemeInfo } from "@/lib/types";
import { runSimConsole, type SimConsoleResult } from "@/lib/sim-console-driver";

type Level = "3" | "6" | "9";

export function SimAdminConsole() {
  const [question, setQuestion] = useState("Should AI systems be governed by shared human intent?");
  const [count, setCount] = useState(200);
  const [voters, setVoters] = useState(25);
  const [seed, setSeed] = useState("sim");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [result, setResult] = useState<SimConsoleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("3");
  const [category, setCategory] = useState<Theme01Label>("Risk & Concerns");

  const run = useCallback(async (q: string, n: number, v: number, s: string) => {
    setRunning(true); setError(null); setResult(null); setProgress(0); setPhase("Starting");
    try {
      const res = await runSimConsole({
        question: q, count: n, voters: v, seed: s,
        onProgress: (f, p) => { setProgress(f); setPhase(p); },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }, []);

  // Preset: the 5,000-response stress run around the current question.
  const run5000 = () => { setCount(5000); run(question, 5000, Math.min(voters, 50), seed); };

  // Ranked Theme01 priorities → the order the RankedThemes panel renders (winner first).
  const priorityOrder = useMemo(() => (result?.ranking ?? []).map((r) => r.label), [result]);
  const theme1List: ThemeInfo[] = useMemo(
    () => (result ? THEME01_LABELS.map((l) => result.themes.theme1[l]).filter((t) => t && !t.isEmpty) : []),
    [result],
  );
  const theme2List: ThemeInfo[] = useMemo(() => {
    if (!result) return [];
    const bucket = result.themes.theme2[category];
    const arr = level === "3" ? bucket?.level3 : level === "6" ? bucket?.level6 : bucket?.level9;
    return (arr ?? []).filter((t) => t && !t.isEmpty);
  }, [result, category, level]);

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "16px", display: "flex", flexDirection: "column", gap: 16 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <FlaskConical className="h-5 w-5 text-primary" />
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Admin Simulation Console</h2>
        <ModeBadge />
      </header>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>
        Generate 100–400-word responses around a question, run Theme 01 → Theme 02 grouping through the
        real pipeline, then simulate a ranking round of priorities. Responses are AI-written supplemental
        input, labelled as such. Deterministic for a fixed question + count + seed.
      </p>

      {/* Controls */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>
          Question
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={2}
            disabled={running}
            style={{ width: "100%", marginTop: 4, padding: 8, borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, resize: "vertical" }}
          />
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <NumField label="Responses" value={count} min={10} max={5000} step={10} onChange={setCount} disabled={running} />
          <NumField label="Voters" value={voters} min={3} max={50} step={1} onChange={setVoters} disabled={running} />
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", display: "flex", flexDirection: "column", gap: 4 }}>
            Seed
            <input value={seed} onChange={(e) => setSeed(e.target.value)} disabled={running}
              style={{ width: 110, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, fontFamily: "monospace" }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button size="sm" onClick={() => run(question, count, voters, seed)} disabled={running || !question.trim()} className="gap-1">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Running…" : "Run simulation"}
          </Button>
          <Button size="sm" variant="outline" onClick={run5000} disabled={running} className="gap-1">
            <FlaskConical className="h-4 w-4" /> Test 5,000 responses
          </Button>
        </div>
      </div>

      {/* Progress */}
      {running && (
        <div aria-live="polite">
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted-foreground)", marginBottom: 4 }}>
            <span>{phase}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(progress * 100)}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: "var(--muted)", overflow: "hidden" }}>
            <div style={{ width: `${Math.round(progress * 100)}%`, height: "100%", background: "#00E5CC", transition: "width .2s" }} />
          </div>
        </div>
      )}

      {error && <div style={{ fontSize: 13, color: "#e5484d", border: "1px solid #e5484d55", borderRadius: 8, padding: 10 }}>{error}</div>}

      {/* Results */}
      {result && !running && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--muted-foreground)" }}>
            <Stat label="Responses" value={result.responseCount.toLocaleString()} />
            <Stat label="Categories" value={String(theme1List.length)} />
            <Stat label="Top priority" value={result.ranking[0]?.label ?? "—"} />
            {result.replayHash && <Stat label="Replay" value={result.replayHash.slice(0, 10)} mono />}
          </div>

          {/* Theme 01 priorities (ordered by the simulated ranking round) + 33/111/333 toggle */}
          <section>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>Theme 01 · priorities (from the ranking round)</h3>
            <RankedThemes themes={theme1List} order={priorityOrder} isPaidTier accentColor="#00E5CC" />
          </section>

          {/* Theme 02 sub-themes at 3/6/9 */}
          <section>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Theme 02 · sub-themes</h3>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Segmented options={THEME01_LABELS.filter((l) => !result.themes.theme1[l].isEmpty)} value={category} onChange={(v) => setCategory(v as Theme01Label)} />
                <Segmented options={["3", "6", "9"]} value={level} onChange={(v) => setLevel(v as Level)} />
              </div>
            </div>
            {theme2List.length ? (
              <RankedThemes themes={theme2List} isPaidTier accentColor="#8b5cf6" />
            ) : (
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>No sub-themes for this category at this level.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ModeBadge() {
  // Read the same env the driver reads (build-time inlined by Next).
  const live = process.env.NEXT_PUBLIC_MOCK_MODE === "false";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>
      {live ? <Server className="h-3 w-3" /> : <MonitorOff className="h-3 w-3" />}
      {live ? "live backend" : "self-contained"}
    </span>
  );
}

function NumField({ label, value, min, max, step, onChange, disabled }: { label: string; value: number; min: number; max: number; step: number; onChange: (n: number) => void; disabled?: boolean }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", display: "flex", flexDirection: "column", gap: 4 }}>
      {label}
      <input type="number" value={value} min={min} max={max} step={step} disabled={disabled}
        onChange={(e) => onChange(Math.max(min, Math.min(max, Number(e.target.value) || min)))}
        style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, fontVariantNumeric: "tabular-nums" }} />
    </label>
  );
}

function Segmented({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div role="group" style={{ display: "inline-flex", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)} aria-pressed={value === o}
          style={{ padding: "3px 10px", fontSize: 12, border: "none", cursor: "pointer", background: value === o ? "#00E5CC" : "transparent", color: value === o ? "#04121a" : "var(--muted-foreground)" }}>
          {o}
        </button>
      ))}
    </div>
  );
}

function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <span style={{ display: "inline-flex", flexDirection: "column" }}>
      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".04em", opacity: 0.7 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: mono ? "monospace" : undefined }}>{value}</span>
    </span>
  );
}
