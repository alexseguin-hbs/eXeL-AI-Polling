"use client";

// WS-G Admin Simulation Console (operator 2026-09-14: the easter-egg unlock should "simulate the
// features with actual API usage" — generate 100-400-word responses around a question, group
// Theme01→Theme02, and simulate priorities in a ranking round; admin can test 5,000 responses or a
// new question). Admin-gated in app/sim/page.tsx (cube10Access === "admin"). Runs self-contained
// (mock pipeline) now; the SAME driver hits the real backend when NEXT_PUBLIC_MOCK_MODE=false.
//
// P0 (2026-11-08): presets 12/24/48 → theme2_9|6|3, honest connectivity badge, stage timings,
// downloadable review JSON. Optional scope_ref keeps Drone/Security feedback separated.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Play, FlaskConical, Server, MonitorOff, AlertTriangle, Download, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RankedThemes } from "@/components/flower-of-life/ranked-themes";
import { THEME01_LABELS } from "@/lib/adapt-live-themes";
import type { Theme01Label, ThemeInfo } from "@/lib/types";
import {
  runSimConsole,
  buildSimReviewArtifact,
  SIM_PRESETS,
  votingLevelForCount,
  type SimConsoleResult,
} from "@/lib/sim-console-driver";
import {
  probeApiConnectivity,
  connectivityLabel,
  type ApiConnectivityReport,
} from "@/lib/api-connectivity";

type Level = "3" | "6" | "9";

export function SimAdminConsole() {
  const [question, setQuestion] = useState("Should AI systems be governed by shared human intent?");
  const [count, setCount] = useState(12);
  const [voters, setVoters] = useState(5);
  const [seed, setSeed] = useState("sim");
  const [scopeRef, setScopeRef] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [result, setResult] = useState<SimConsoleResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>("3");
  const [category, setCategory] = useState<Theme01Label>("Risk & Concerns");
  const [connectivity, setConnectivity] = useState<ApiConnectivityReport | null>(null);

  useEffect(() => {
    let cancelled = false;
    probeApiConnectivity().then((r) => { if (!cancelled) setConnectivity(r); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const run = useCallback(async (q: string, n: number, v: number, s: string, scope?: string) => {
    setRunning(true); setError(null); setResult(null); setProgress(0); setPhase("Starting");
    try {
      let conn = connectivity;
      try { conn = await probeApiConnectivity(); setConnectivity(conn); } catch { /* keep prior */ }
      const res = await runSimConsole({
        question: q, count: n, voters: v, seed: s,
        theme2VotingLevel: votingLevelForCount(n),
        scopeRef: scope?.trim() || null,
        connectivity: conn,
        onProgress: (f, p) => { setProgress(f); setPhase(p); },
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Simulation failed");
    } finally {
      setRunning(false);
    }
  }, [connectivity]);

  // Preset: the 5,000-response stress run around the current question.
  const run5000 = () => { setCount(5000); run(question, 5000, Math.min(voters, 50), seed, scopeRef); };

  const runPreset = (n: number) => {
    setCount(n);
    setVoters(Math.min(Math.max(Math.floor(n / 2), 3), 50));
    run(question, n, Math.min(Math.max(Math.floor(n / 2), 3), 50), seed, scopeRef);
  };

  const downloadReview = () => {
    if (!result) return;
    const artifact = buildSimReviewArtifact(result);
    (artifact as { requested_n?: number }).requested_n = count;
    const blob = new Blob([JSON.stringify(artifact, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sim-review-${result.sessionId.slice(0, 8)}-${result.seed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // The ranking round's order (winner first). Christo (AsM round 1): the round ranks the Theme02 of
  // Risk & Concerns at the chosen level, so its panel shows THOSE themes in that order; Theme01 keeps its own panel by count.
  const priorityOrder = useMemo(() => (result?.ranking ?? []).map((r) => r.label), [result]);
  const theme1List: ThemeInfo[] = useMemo(
    () => (result ? THEME01_LABELS.map((l) => result.themes.theme1[l]).filter((t) => t && !t.isEmpty) : []),
    [result],
  );
  const rankedList: ThemeInfo[] = useMemo(() => {
    if (!result?.ranked) return [];
    if (result.ranked.kind === "theme01") return theme1List;
    const bucket = result.themes.theme2[result.ranked.category];
    const arr = result.ranked.level === "3" ? bucket?.level3 : result.ranked.level === "6" ? bucket?.level6 : bucket?.level9;
    return (arr ?? []).filter((t) => t && !t.isEmpty);
  }, [result, theme1List]);
  const rankedHeading = !result?.ranked
    ? "Priorities · no ranking round ran"
    : result.ranked.kind === "theme02"
      ? `${result.ranked.category} · Theme 02 priorities (${result.ranked.level}, from the ranking round)`
      : "Theme 01 · priorities (from the ranking round)";
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
        <ModeBadge connectivity={connectivity} />
      </header>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0, lineHeight: 1.5 }}>
        Generate 100–400-word responses around a question, run Theme 01 → Theme 02 grouping through the
        real pipeline, then simulate a ranking round of priorities. Presets 12 / 24 / 48 map to Theme02
        voting levels 9 / 6 / 3 (existing session_type=simulation + HP-21). Responses are AI-written
        supplemental input, labelled as such. Deterministic for a fixed question + count + seed. Optional
        scope_ref keeps Drone vs Security feedback separated on the same contracts.
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
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)", display: "flex", flexDirection: "column", gap: 4 }}>
            scope_ref
            <input value={scopeRef} onChange={(e) => setScopeRef(e.target.value)} disabled={running}
              placeholder="Project→… (optional)"
              style={{ width: 180, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)", fontSize: 13, fontFamily: "monospace" }} />
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button size="sm" onClick={() => run(question, count, voters, seed, scopeRef)} disabled={running || !question.trim()} className="gap-1">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? "Running…" : "Run simulation"}
          </Button>
          {SIM_PRESETS.map((p) => (
            <Button key={p.count} size="sm" variant="outline" onClick={() => runPreset(p.count)} disabled={running} className="gap-1">
              <FlaskConical className="h-4 w-4" /> {p.label}
            </Button>
          ))}
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
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12, color: "var(--muted-foreground)", alignItems: "flex-end" }}>
            <Stat label="Responses" value={result.responseCount.toLocaleString()} />
            {result.summarized != null && <Stat label="Summarized" value={result.summarized.toLocaleString()} />}
            <Stat label="Categories" value={String(theme1List.length)} />
            <Stat label="Top priority" value={result.ranking[0]?.label ?? "—"} />
            {result.replayHash && <Stat label="Replay" value={result.replayHash.slice(0, 10)} mono />}
            <Stat label="Errors" value={String(result.errors.length)} />
            <Stat label="theme2" value={result.theme2VotingLevel} mono />
            {result.scopeRef && <Stat label="scope_ref" value={result.scopeRef} mono />}
            <Stat label="inject ms" value={String(result.timingsMs.inject ?? "—")} />
            <Stat label="theme ms" value={String(result.timingsMs.theme ?? "—")} />
            <Stat label="ballot ms" value={String(result.timingsMs.ballot ?? "—")} />
            <Stat label="agg ms" value={String(result.timingsMs.aggregate ?? "—")} />
            <Button size="sm" variant="outline" onClick={downloadReview} className="gap-1">
              <Download className="h-4 w-4" /> Review JSON
            </Button>
          </div>

          {/* Christo (AsM round 1): every failed stage, named with its HTTP status — a failed run never looks clean. */}
          {result.errors.length > 0 && (
            <section data-testid="sim-console-errors" role="alert" style={{ border: "1px solid #e5484d55", borderRadius: 8, padding: 10 }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#e5484d", margin: "0 0 6px" }}>
                <AlertTriangle className="h-4 w-4" /> {result.errors.length} stage{result.errors.length === 1 ? "" : "s"} failed — results below are incomplete
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--foreground)", lineHeight: 1.5 }}>
                {result.errors.slice(0, 12).map((e, i) => (
                  <li key={i} style={{ overflowWrap: "anywhere" }}>
                    <strong>{e.stage}</strong>{e.status != null ? ` · HTTP ${e.status}` : ""} — {e.detail}
                  </li>
                ))}
                {result.errors.length > 12 && <li>… {result.errors.length - 12} more</li>}
              </ul>
            </section>
          )}

          {/* The ranking round's priorities: the themes that were actually voted on, in the aggregate order. */}
          <section data-testid="sim-console-ranked">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>{rankedHeading}</h3>
            {result.ranking.length > 0 && (
              <ol style={{ margin: "4px 0 0", paddingLeft: 20, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
                {result.ranking.map((r) => (
                  <li key={r.theme_id}><span style={{ color: "var(--foreground)" }}>{r.label}</span> · {r.score} pts</li>
                ))}
              </ol>
            )}
            <RankedThemes themes={rankedList} order={priorityOrder} isPaidTier accentColor="#00E5CC" />
          </section>

          {/* Theme 01 categories by response count (not the vote) + 33/111/333 toggle */}
          <section data-testid="sim-console-theme01">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>Theme 01 · categories (by response count)</h3>
            <RankedThemes themes={theme1List} isPaidTier accentColor="#00E5CC" />
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

function ModeBadge({ connectivity }: { connectivity: ApiConnectivityReport | null }) {
  // Prefer probed connectivity; fall back to build-time mock fold.
  const liveConfigured = process.env.NEXT_PUBLIC_MOCK_MODE === "false";
  const probe = connectivity?.probe;
  const label = connectivity ? connectivityLabel(connectivity) : (liveConfigured ? "live-configured (probing…)" : "self-contained (mock)");
  const ok = probe === "live-ok";
  const mock = probe === "mock-folded" || (!connectivity && !liveConfigured);
  const Icon = mock ? MonitorOff : ok ? Wifi : probe === "live-unreachable" || probe === "live-non-json" ? WifiOff : Server;
  return (
    <span
      title={connectivity?.detail || undefined}
      style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
    >
      <Icon className="h-3 w-3" />
      {label}
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
