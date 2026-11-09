// WS-G Admin Simulation Console driver (operator 2026-09-14: the easter-egg SIM should "simulate the
// features with actual API usage" — generate 100-400-word responses around a question, run Theme01→
// Theme02 grouping, then simulate priorities in a ranking round; admin can test 5,000 responses or a
// new question). This driver composes the REAL endpoints (create → inject → theme → rank), so the SAME
// run works self-contained (NEXT_PUBLIC_MOCK_MODE default → mock handlers) or against a hosted backend
// (NEXT_PUBLIC_MOCK_MODE=false + provider key). The console shows which mode it is in.
//
// P0 (2026-11-08 audit): Easter-egg presets 12/24/48 map onto Theme01 + theme2_9|6|3 (Mentimeter-style
// narrowing), stage timings, exportable review JSON, honest mock-vs-live via api-connectivity, optional
// scope_ref so Drone/Security feedback stays separated without inventing new contracts.

import { api, ApiClientError } from "./api";
import { generateSimResponses, simulateBallots } from "./sim-console";
import { adaptLiveThemes, THEME01_LABELS, type LiveThemeRow } from "./adapt-live-themes";
import { ballotThemeRows, levelOf, type BallotLevel } from "./ballot-themes";
import { normalizeRankings, rankingWinner, rankingReplayHash } from "./ranking-shape";
import { isMockMode, type ApiConnectivityReport } from "./api-connectivity";
import type { Session, Question, SessionThemeData, Theme01Label, Theme2VotingLevel } from "./types";

/** Same rule as lib/api.ts — self-contained unless the operator points at a real backend. */
export const SIM_MOCK_MODE = isMockMode();

/** Isolated Easter-egg size presets → Theme02 voting level (existing theme2_9|6|3 contract). */
export const SIM_PRESETS = [
  { count: 12, theme2VotingLevel: "theme2_9" as Theme2VotingLevel, level: "9" as BallotLevel, label: "12 · Theme02×9" },
  { count: 24, theme2VotingLevel: "theme2_6" as Theme2VotingLevel, level: "6" as BallotLevel, label: "24 · Theme02×6" },
  { count: 48, theme2VotingLevel: "theme2_3" as Theme2VotingLevel, level: "3" as BallotLevel, label: "48 · Theme02×3" },
] as const;

export type SimPresetCount = (typeof SIM_PRESETS)[number]["count"];

export function presetForCount(count: number): (typeof SIM_PRESETS)[number] | null {
  return SIM_PRESETS.find((p) => p.count === count) ?? null;
}

export function votingLevelForCount(count: number, fallback: Theme2VotingLevel = "theme2_9"): Theme2VotingLevel {
  return presetForCount(count)?.theme2VotingLevel ?? fallback;
}

export interface SimRankRow { theme_id: string; label: string; rank: number; score: number }

/** One failed stage of a run (Christo, AsM round 1: a failed run must never look clean). */
export interface SimStageError { stage: string; status: number | null; detail: string }

/** Stage wall-clock timings in ms (audit Phase 1). Missing keys mean the stage did not run. */
export interface SimStageTimingsMs {
  create?: number;
  inject?: number;
  theme?: number;
  ballot?: number;
  aggregate?: number;
  total?: number;
}

export interface SimConsoleResult {
  sessionId: string;
  shortCode: string | null;
  mode: "self-contained" | "live-backend";
  /** Honest connectivity snapshot when the caller probed; null when not provided. */
  connectivity: ApiConnectivityReport | null;
  question: string;
  responseCount: number;
  themes: SessionThemeData;
  ranking: SimRankRow[];
  winner: string | null;
  replayHash: string | null;
  /** LIVE: responses whose Phase A summary existed before theming started (null when self-contained). */
  summarized: number | null;
  /** What the ranking round voted on: the Theme02 of one Theme01 category at a level, or (thin run) Theme01. */
  ranked: { kind: "theme02"; category: Theme01Label; level: "3" | "6" | "9" } | { kind: "theme01" } | null;
  /** Every failed stage, in order. Empty only when every call succeeded. */
  errors: SimStageError[];
  /** Wall-clock stage timings (ms). */
  timingsMs: SimStageTimingsMs;
  /** Echo of the session create fields that keep Drone/Security isolation honest. */
  sessionType: "simulation";
  theme2VotingLevel: Theme2VotingLevel;
  theme01Category: "risk" | "support" | "neutral";
  scopeRef: string | null;
  seed: string;
  excludedFromPublicResults: true;
}

export interface SimConsoleParams {
  question: string;
  count: number;         // number of responses to generate/inject
  voters?: number;       // ballots in the ranking round (default = min(count, 50))
  seed?: string;
  /** Override Theme02 voting level; default follows SIM_PRESETS for 12/24/48 else theme2_9. */
  theme2VotingLevel?: Theme2VotingLevel;
  /** Existing SessionCreate.scope_ref — keep Drone vs Security feedback separated. */
  scopeRef?: string | null;
  theme01Category?: "risk" | "support" | "neutral";
  /** Optional pre-probed connectivity report (ModeBadge / review JSON). */
  connectivity?: ApiConnectivityReport | null;
  /** progress: 0..1 with a human phase label, so the UI can show a live bar. */
  onProgress?: (fraction: number, phase: string) => void;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Turn any thrown value into a stage error (HTTP status + detail when the API gave one). */
export function stageError(stage: string, e: unknown): SimStageError {
  if (e instanceof ApiClientError) return { stage, status: e.status, detail: String(e.detail || e.message).slice(0, 300) };
  const err = e as { status?: number; detail?: string; message?: string } | null;
  return { stage, status: typeof err?.status === "number" ? err.status : null, detail: String(err?.detail || err?.message || e || "failed").slice(0, 300) };
}

/**
 * Build the downloadable external-review artifact (audit §8). Pure — no network.
 */
export function buildSimReviewArtifact(result: SimConsoleResult): Record<string, unknown> {
  const themeCount =
    (result.themes?.theme1
      ? THEME01_LABELS.reduce((n, l) => n + (result.themes.theme1[l] && !result.themes.theme1[l].isEmpty ? 1 : 0), 0)
      : 0);
  return {
    artifact_version: "1",
    mode: result.mode === "self-contained" ? "offline-baseline" : "live-backend",
    session_type: result.sessionType,
    input_n: result.responseCount,
    requested_n: undefined as number | undefined, // filled by caller if needed
    theme_level: result.ranked && result.ranked.kind === "theme02" ? result.ranked.level : levelOf(result.theme2VotingLevel),
    theme2_voting_level: result.theme2VotingLevel,
    theme01_category: result.theme01Category,
    scope_ref: result.scopeRef,
    seed: result.seed,
    session_id: result.sessionId,
    short_code: result.shortCode,
    connectivity: result.connectivity
      ? {
          buildMode: result.connectivity.buildMode,
          probe: result.connectivity.probe,
          detail: result.connectivity.detail,
          httpStatus: result.connectivity.httpStatus,
          contentType: result.connectivity.contentType,
        }
      : null,
    timings_ms: {
      inject: result.timingsMs.inject ?? null,
      theme: result.timingsMs.theme ?? null,
      ballot: result.timingsMs.ballot ?? null,
      aggregate: result.timingsMs.aggregate ?? null,
      create: result.timingsMs.create ?? null,
      total: result.timingsMs.total ?? null,
    },
    observed: {
      theme_count: themeCount,
      winner_label: result.winner,
      replay_hash: result.replayHash,
      ranking: result.ranking.map((r) => ({ theme_id: r.theme_id, label: r.label, rank: r.rank, score: r.score })),
      summarized: result.summarized,
    },
    errors: result.errors,
    excluded_from_public_results: true,
  };
}

/**
 * Run the whole pipeline end-to-end and return the REAL results (themes + ranked priorities).
 * Deterministic in self-contained mode for a fixed (question, count, seed).
 */
export async function runSimConsole(params: SimConsoleParams): Promise<SimConsoleResult> {
  const { question, count } = params;
  const seed = params.seed ?? "sim";
  const voters = params.voters ?? Math.min(Math.max(count, 3), 50);
  const theme2VotingLevel = params.theme2VotingLevel ?? votingLevelForCount(count);
  const theme01Category = params.theme01Category ?? "risk";
  const scopeRef = params.scopeRef ?? null;
  const ballotLevel = levelOf(theme2VotingLevel);
  const progress = params.onProgress ?? (() => {});
  const errors: SimStageError[] = [];
  const timingsMs: SimStageTimingsMs = {};
  const tRun0 = Date.now();
  /** Run one stage; on failure record it (stage + status/detail) and return null — never swallow it. */
  const step = async <T,>(stage: string, call: () => Promise<T>): Promise<T | null> => {
    try { return await call(); } catch (e) { errors.push(stageError(stage, e)); return null; }
  };

  // 1) Create the session (real Cube-1 create).
  progress(0.02, "Creating session");
  const tCreate0 = Date.now();
  const createBody: Record<string, unknown> = {
    title: question,
    description: "Admin Simulation Console run (AI-written supplemental responses)",
    polling_mode_type: "live_interactive",
    ai_provider: "openai",
    // HP-21: a simulation session (the backend seeds its responses and simulated voters only for this type) that
    // votes on the Theme02 themes of one Theme01 category — the operator's model (addendum 5).
    session_type: "simulation",
    theme2_voting_level: theme2VotingLevel,
    theme01_category: theme01Category,
  };
  if (scopeRef) createBody.scope_ref = scopeRef;
  const session = await api.post<Session>("/sessions", createBody);
  timingsMs.create = Date.now() - tCreate0;
  const sessionId = session!.id;
  const shortCode = session!.short_code ?? null;

  // Resolve the question id. Self-contained: the mock auto-creates one. LIVE: a new session has no question and
  // is still a draft, so add the question and open it for polling (draft → open → polling), as a moderator would.
  let questionId = "";
  if (!SIM_MOCK_MODE) {
    const q = await step("add question", () => api.post<Question>(`/sessions/${sessionId}/questions`, { question_text: question.slice(0, 500) }));
    questionId = q?.id ?? "";
    await step("open session", () => api.post(`/sessions/${sessionId}/open`, {}));
    await step("start polling", () => api.post(`/sessions/${sessionId}/poll`, {}));
  } else {
    try {
      const qs = await api.getSessionQuestions(sessionId);
      questionId = (qs as Question[])?.[0]?.id ?? "";
    } catch { /* fall through — the mock response endpoint tolerates a generated id */ }
  }

  // 2) Generate + inject the responses (the AI + HI supplemented-input option).
  progress(0.08, "Generating responses");
  const responses = generateSimResponses(question, count, seed);
  const CHUNK = 25;
  // Count what the backend ACCEPTED, not what was sent — a LIVE run whose submissions are refused (422/409)
  // used to report "Responses 200" over an empty result. The panel never claims more than happened.
  let accepted = 0;
  let summarized: number | null = null;
  let refusedTotal = 0;
  const tInject0 = Date.now();
  if (!SIM_MOCK_MODE) {
    summarized = 0;
    // LIVE: each response from its own simulated participant, seeded server-side through the real cube2 service
    // (the public join + submit are limited to 100/min per address — a 5,000 run would take an hour).
    const SEED = 500;
    for (let i = 0; i < responses.length; i += SEED) {
      const batch = responses.slice(i, i + SEED).map((r) => ({ text: r.raw_text, language_code: r.language_code || "en" }));
      // The backend waits (bounded) for the Phase A summaries it triggered and reports `summarized`, so theming
      // below never starts over responses that have no summary yet (Krishna, AsM round 1).
      const out = await step(`inject responses ${i + 1}-${i + batch.length}`, () =>
        api.post<{ accepted: number; summarized?: number; refused_count?: number; phase_a_complete?: boolean }>(
          `/sessions/${sessionId}/sim/responses`, { question_id: questionId, responses: batch }));
      accepted += out?.accepted ?? 0;
      summarized += out?.summarized ?? 0;
      refusedTotal += out?.refused_count ?? 0;
      if (out && out.phase_a_complete === false) {
        errors.push({ stage: `summaries ${i + 1}-${i + batch.length}`, status: null, detail: `Phase A still running when the wait ended (${out.summarized ?? 0}/${out.accepted} summarized)` });
      }
      progress(0.08 + 0.52 * ((i + batch.length) / responses.length), `Injecting responses (${i + batch.length}/${responses.length})`);
    }
  }
  for (let i = 0; SIM_MOCK_MODE && i < responses.length; i += CHUNK) {
    const batch = responses.slice(i, i + CHUNK);
    await Promise.all(
      batch.map((r) =>
        api.submitTextResponse(sessionId, questionId || r.id, r.participant_id, r.raw_text, r.language_code).then(() => { accepted++; }, () => { refusedTotal++; }),
      ),
    );
    progress(0.08 + 0.52 * ((i + batch.length) / responses.length), `Injecting responses (${i + batch.length}/${responses.length})`);
  }
  timingsMs.inject = Date.now() - tInject0;

  if (refusedTotal) errors.push({ stage: "inject responses", status: null, detail: `${refusedTotal} of ${responses.length} responses refused` });
  if (summarized != null && summarized < accepted) {
    errors.push({ stage: "summaries", status: null, detail: `${accepted - summarized} of ${accepted} responses have no Phase A summary; theming covers only the summarized ones` });
  }

  // 3) Theme them (real Cube-6 when live; grounded mock when self-contained). The backend runs a simulation
  // session on the OFFLINE provider unless an HI-approved cost estimate is recorded (addendum 4).
  progress(0.62, "Theming (Theme01 → Theme02)");
  const tTheme0 = Date.now();
  await step("theming (ai/run)", () => api.post(`/sessions/${sessionId}/ai/run`, {}));
  let themed = false;
  for (let poll = 0; poll < 30; poll++) {
    const st = await step("theming status", () => api.get<{ status?: string }>(`/sessions/${sessionId}/ai/status`));
    if (st?.status === "completed" || st?.status === "done") { themed = true; break; }
    if (!st) break; // the failure is recorded; polling a failing endpoint 30 times adds nothing
    await wait(SIM_MOCK_MODE ? 0 : 1000);
    if (SIM_MOCK_MODE) break; // mock completes synchronously
  }
  if (!themed && !errors.some((e) => e.stage.startsWith("theming"))) {
    errors.push({ stage: "theming status", status: null, detail: "Theming did not report completed" });
  }
  const rows = (await step("read themes", () => api.get<LiveThemeRow[]>(`/sessions/${sessionId}/themes`))) ?? [];
  const themes = adaptLiveThemes(sessionId, rows);
  timingsMs.theme = Date.now() - tTheme0;

  // 4) Simulate the ranking round over the Theme01 categories (the priorities).
  progress(0.8, "Simulating ranking round");
  const themeIds = THEME01_LABELS
    .map((label) => rows.find((r) => (r.theme_level == null) && r.label && themeLabelMatches(r, label)))
    .filter(Boolean)
    .map((r) => (r as LiveThemeRow).id);
  // Fall back to any parent rows if the label match is thin.
  const parentIds = themeIds.length ? themeIds : rows.filter((r) => r.theme_level == null).map((r) => r.id);
  // The ballot is the Theme02 themes of the session's category at the chosen level — what the backend's
  // submit_user_ranking accepts at theme2_*. Parents only when no children exist (a thin self-contained run).
  const ballot = ballotThemeRows(rows, ballotLevel, theme01Category).map((r) => r.id);
  const pool = ballot.length >= 2 ? ballot : parentIds;
  const ranked: SimConsoleResult["ranked"] = ballot.length >= 2
    ? { kind: "theme02", category: THEME01_LABELS[0], level: ballotLevel }
    : (parentIds.length >= 2 ? { kind: "theme01" } : null);
  if (!ranked) errors.push({ stage: "ranking", status: null, detail: "Fewer than two themes to rank — no ranking round ran" });

  let ranking: SimRankRow[] = [];
  let winner: string | null = null;
  let replayHash: string | null = null;
  const tBallot0 = Date.now();
  if (pool.length >= 2) {
    const ballots = simulateBallots(pool, voters, seed);
    if (!SIM_MOCK_MODE) {
      // LIVE: ranking opens (polling → ranking), then each ballot from its own simulated voter through the real
      // cube7 service — one admin login cannot cast fifty votes on the public endpoint, by design.
      await step("open ranking", () => api.post(`/sessions/${sessionId}/rank`, {}));
      const out = await step("cast ballots", () => api.post<{ accepted: number; refused_count?: number; refused?: { reason: string }[] }>(`/sessions/${sessionId}/sim/ballots`, { ballots }));
      if (out && out.refused_count) {
        errors.push({ stage: "cast ballots", status: null, detail: `${out.refused_count} of ${ballots.length} ballots refused${out.refused?.[0] ? `: ${out.refused[0].reason}` : ""}` });
      }
    } else {
      const fails: SimStageError[] = [];
      for (const b of ballots) {
        await api.post(`/sessions/${sessionId}/rankings`, { ranked_theme_ids: b }).catch((e) => { fails.push(stageError("cast ballots", e)); });
      }
      if (fails.length) errors.push({ ...fails[0], detail: `${fails.length} of ${ballots.length} ballots refused: ${fails[0].detail}` });
    }
    timingsMs.ballot = Date.now() - tBallot0;
    // Aggregate (object) or the live read (bare list) — one shape via lib/ranking-shape.ts. The console's seed
    // pins the tie-break (backend: `?seed=` → SHA-256(theme_id:seed)), so a fixed seed replays identically.
    const tAgg0 = Date.now();
    let agg: unknown = await step("aggregate", () => api.post<unknown>(`/sessions/${sessionId}/rankings/aggregate?seed=${encodeURIComponent(seed)}`, {}));
    let rowsRanked = normalizeRankings(agg);
    if (!rowsRanked.length) { agg = await step("read rankings", () => api.get<unknown>(`/sessions/${sessionId}/rankings`)); rowsRanked = normalizeRankings(agg); }
    const labelOf = (id: string) => rows.find((r) => r.id === id)?.label ?? id;
    ranking = rowsRanked.map((r) => ({ theme_id: r.theme_id, label: labelOf(r.theme_id), rank: r.rank, score: r.score }));
    winner = rankingWinner(agg, rowsRanked);
    replayHash = rankingReplayHash(agg);
    timingsMs.aggregate = Date.now() - tAgg0;
  } else {
    timingsMs.ballot = Date.now() - tBallot0;
  }

  timingsMs.total = Date.now() - tRun0;
  progress(1, errors.length ? `Finished with ${errors.length} error${errors.length === 1 ? "" : "s"}` : "Complete");
  return {
    sessionId, shortCode,
    mode: SIM_MOCK_MODE ? "self-contained" : "live-backend",
    connectivity: params.connectivity ?? null,
    question, responseCount: accepted, themes, ranking, winner, replayHash, summarized, ranked, errors,
    timingsMs,
    sessionType: "simulation",
    theme2VotingLevel,
    theme01Category,
    scopeRef,
    seed,
    excludedFromPublicResults: true,
  };
}

/** Match a parent row to a Theme01 bucket label (handles "Risk & Concerns" ↔ mock "Risk & Concerns"). */
function themeLabelMatches(row: LiveThemeRow, label: string): boolean {
  const a = (row.label || "").toLowerCase();
  const b = label.toLowerCase();
  if (a === b) return true;
  const key = b.split(/[&\s]/)[0]; // "risk", "supporting", "neutral"
  return a.startsWith(key) || (row.theme01_category != null && b.startsWith(row.theme01_category));
}
