// WS-G Admin Simulation Console driver (operator 2026-09-14: the easter-egg SIM should "simulate the
// features with actual API usage" — generate 100-400-word responses around a question, run Theme01→
// Theme02 grouping, then simulate priorities in a ranking round; admin can test 5,000 responses or a
// new question). This driver composes the REAL endpoints (create → inject → theme → rank), so the SAME
// run works self-contained (NEXT_PUBLIC_MOCK_MODE default → mock handlers) or against a hosted backend
// (NEXT_PUBLIC_MOCK_MODE=false + provider key). The console shows which mode it is in.

import { api, ApiClientError } from "./api";
import { generateSimResponses, simulateBallots } from "./sim-console";
import { adaptLiveThemes, THEME01_LABELS, type LiveThemeRow } from "./adapt-live-themes";
import { ballotThemeRows } from "./ballot-themes";
import { normalizeRankings, rankingWinner, rankingReplayHash } from "./ranking-shape";
import type { Session, Question, SessionThemeData, Theme01Label } from "./types";

/** Same rule as lib/api.ts — self-contained unless the operator points at a real backend. */
export const SIM_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== "false";

export interface SimRankRow { theme_id: string; label: string; rank: number; score: number }

/** One failed stage of a run (Christo, AsM round 1: a failed run must never look clean). */
export interface SimStageError { stage: string; status: number | null; detail: string }

export interface SimConsoleResult {
  sessionId: string;
  shortCode: string | null;
  mode: "self-contained" | "live-backend";
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
}

export interface SimConsoleParams {
  question: string;
  count: number;         // number of responses to generate/inject
  voters?: number;       // ballots in the ranking round (default = min(count, 50))
  seed?: string;
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
 * Run the whole pipeline end-to-end and return the REAL results (themes + ranked priorities).
 * Deterministic in self-contained mode for a fixed (question, count, seed).
 */
export async function runSimConsole(params: SimConsoleParams): Promise<SimConsoleResult> {
  const { question, count } = params;
  const seed = params.seed ?? "sim";
  const voters = params.voters ?? Math.min(Math.max(count, 3), 50);
  const progress = params.onProgress ?? (() => {});
  const errors: SimStageError[] = [];
  /** Run one stage; on failure record it (stage + status/detail) and return null — never swallow it. */
  const step = async <T,>(stage: string, call: () => Promise<T>): Promise<T | null> => {
    try { return await call(); } catch (e) { errors.push(stageError(stage, e)); return null; }
  };

  // 1) Create the session (real Cube-1 create).
  progress(0.02, "Creating session");
  const session = await api.post<Session>("/sessions", {
    title: question,
    description: "Admin Simulation Console run (AI-written supplemental responses)",
    polling_mode_type: "live_interactive",
    ai_provider: "openai",
    // HP-21: a simulation session (the backend seeds its responses and simulated voters only for this type) that
    // votes on the nine Theme02 themes of one Theme01 category — the operator's model (addendum 5).
    session_type: "simulation",
    theme2_voting_level: "theme2_9",
    theme01_category: "risk",
  });
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

  if (refusedTotal) errors.push({ stage: "inject responses", status: null, detail: `${refusedTotal} of ${responses.length} responses refused` });
  if (summarized != null && summarized < accepted) {
    errors.push({ stage: "summaries", status: null, detail: `${accepted - summarized} of ${accepted} responses have no Phase A summary; theming covers only the summarized ones` });
  }

  // 3) Theme them (real Cube-6 when live; grounded mock when self-contained). The backend runs a simulation
  // session on the OFFLINE provider unless an HI-approved cost estimate is recorded (addendum 4).
  progress(0.62, "Theming (Theme01 → Theme02)");
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

  // 4) Simulate the ranking round over the Theme01 categories (the priorities).
  progress(0.8, "Simulating ranking round");
  const themeIds = THEME01_LABELS
    .map((label) => rows.find((r) => (r.theme_level == null) && r.label && themeLabelMatches(r, label)))
    .filter(Boolean)
    .map((r) => (r as LiveThemeRow).id);
  // Fall back to any parent rows if the label match is thin.
  const parentIds = themeIds.length ? themeIds : rows.filter((r) => r.theme_level == null).map((r) => r.id);
  // The ballot is the nine Theme02 themes of the session's category (Risk & Concerns) — what the backend's
  // submit_user_ranking accepts at theme2_9. Parents only when no children exist (a thin self-contained run).
  const nine = ballotThemeRows(rows, "9", "risk").map((r) => r.id);
  const pool = nine.length >= 2 ? nine : parentIds;
  const ranked: SimConsoleResult["ranked"] = nine.length >= 2
    ? { kind: "theme02", category: THEME01_LABELS[0], level: "9" }
    : (parentIds.length >= 2 ? { kind: "theme01" } : null);
  if (!ranked) errors.push({ stage: "ranking", status: null, detail: "Fewer than two themes to rank — no ranking round ran" });

  let ranking: SimRankRow[] = [];
  let winner: string | null = null;
  let replayHash: string | null = null;
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
    // Aggregate (object) or the live read (bare list) — one shape via lib/ranking-shape.ts. The console's seed
    // pins the tie-break (backend: `?seed=` → SHA-256(theme_id:seed)), so a fixed seed replays identically.
    let agg: unknown = await step("aggregate", () => api.post<unknown>(`/sessions/${sessionId}/rankings/aggregate?seed=${encodeURIComponent(seed)}`, {}));
    let rowsRanked = normalizeRankings(agg);
    if (!rowsRanked.length) { agg = await step("read rankings", () => api.get<unknown>(`/sessions/${sessionId}/rankings`)); rowsRanked = normalizeRankings(agg); }
    const labelOf = (id: string) => rows.find((r) => r.id === id)?.label ?? id;
    ranking = rowsRanked.map((r) => ({ theme_id: r.theme_id, label: labelOf(r.theme_id), rank: r.rank, score: r.score }));
    winner = rankingWinner(agg, rowsRanked);
    replayHash = rankingReplayHash(agg);
  }

  progress(1, errors.length ? `Finished with ${errors.length} error${errors.length === 1 ? "" : "s"}` : "Complete");
  return {
    sessionId, shortCode, mode: SIM_MOCK_MODE ? "self-contained" : "live-backend",
    question, responseCount: accepted, themes, ranking, winner, replayHash, summarized, ranked, errors,
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
