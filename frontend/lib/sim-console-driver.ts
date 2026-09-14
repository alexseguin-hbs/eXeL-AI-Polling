// WS-G Admin Simulation Console driver (operator 2026-09-14: the easter-egg SIM should "simulate the
// features with actual API usage" — generate 100-400-word responses around a question, run Theme01→
// Theme02 grouping, then simulate priorities in a ranking round; admin can test 5,000 responses or a
// new question). This driver composes the REAL endpoints (create → inject → theme → rank), so the SAME
// run works self-contained (NEXT_PUBLIC_MOCK_MODE default → mock handlers) or against a hosted backend
// (NEXT_PUBLIC_MOCK_MODE=false + provider key). The console shows which mode it is in.

import { api } from "./api";
import { generateSimResponses, simulateBallots } from "./sim-console";
import { adaptLiveThemes, THEME01_LABELS, type LiveThemeRow } from "./adapt-live-themes";
import { normalizeRankings, rankingWinner, rankingReplayHash } from "./ranking-shape";
import type { Session, Question, SessionThemeData } from "./types";

/** Same rule as lib/api.ts — self-contained unless the operator points at a real backend. */
export const SIM_MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE !== "false";

export interface SimRankRow { theme_id: string; label: string; rank: number; score: number }

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

/**
 * Run the whole pipeline end-to-end and return the REAL results (themes + ranked priorities).
 * Deterministic in self-contained mode for a fixed (question, count, seed).
 */
export async function runSimConsole(params: SimConsoleParams): Promise<SimConsoleResult> {
  const { question, count } = params;
  const seed = params.seed ?? "sim";
  const voters = params.voters ?? Math.min(Math.max(count, 3), 50);
  const progress = params.onProgress ?? (() => {});

  // 1) Create the session (real Cube-1 create).
  progress(0.02, "Creating session");
  const session = await api.post<Session>("/sessions", {
    title: question,
    description: "Admin Simulation Console run (AI-written supplemental responses)",
    polling_mode_type: "live_interactive",
    ai_provider: "openai",
  });
  const sessionId = session!.id;
  const shortCode = session!.short_code ?? null;

  // Resolve the question id (mock auto-creates one; live returns the session's questions).
  let questionId = "";
  try {
    const qs = await api.getSessionQuestions(sessionId);
    questionId = (qs as Question[])?.[0]?.id ?? "";
  } catch { /* fall through — the response endpoint tolerates a generated id */ }

  // 2) Generate + inject the responses (the AI + HI supplemented-input option).
  progress(0.08, "Generating responses");
  const responses = generateSimResponses(question, count, seed);
  const CHUNK = 25;
  for (let i = 0; i < responses.length; i += CHUNK) {
    const batch = responses.slice(i, i + CHUNK);
    await Promise.all(
      batch.map((r) =>
        api.submitTextResponse(sessionId, questionId || r.id, r.participant_id, r.raw_text, r.language_code).catch(() => null),
      ),
    );
    progress(0.08 + 0.52 * ((i + batch.length) / responses.length), `Injecting responses (${i + batch.length}/${responses.length})`);
  }

  // 3) Theme them (real Cube-6 when live; grounded mock when self-contained).
  progress(0.62, "Theming (Theme01 → Theme02)");
  await api.post(`/sessions/${sessionId}/ai/run`, { provider: "openai" }).catch(() => null);
  for (let poll = 0; poll < 30; poll++) {
    const st = await api.get<{ status?: string }>(`/sessions/${sessionId}/ai/status`).catch(() => null);
    if (st?.status === "completed" || st?.status === "done") break;
    await wait(SIM_MOCK_MODE ? 0 : 1000);
    if (SIM_MOCK_MODE) break; // mock completes synchronously
  }
  const rows = (await api.get<LiveThemeRow[]>(`/sessions/${sessionId}/themes`).catch(() => [])) ?? [];
  const themes = adaptLiveThemes(sessionId, rows);

  // 4) Simulate the ranking round over the Theme01 categories (the priorities).
  progress(0.8, "Simulating ranking round");
  const themeIds = THEME01_LABELS
    .map((label) => rows.find((r) => (r.theme_level == null) && r.label && themeLabelMatches(r, label)))
    .filter(Boolean)
    .map((r) => (r as LiveThemeRow).id);
  // Fall back to any parent rows if the label match is thin.
  const parentIds = themeIds.length ? themeIds : rows.filter((r) => r.theme_level == null).map((r) => r.id);

  let ranking: SimRankRow[] = [];
  let winner: string | null = null;
  let replayHash: string | null = null;
  if (parentIds.length >= 2) {
    const ballots = simulateBallots(parentIds, voters, seed);
    for (const b of ballots) await api.post(`/sessions/${sessionId}/rankings`, { ranked_theme_ids: b }).catch(() => null);
    // Aggregate (object) or the live read (bare list) — one shape via lib/ranking-shape.ts.
    let agg: unknown = await api.post<unknown>(`/sessions/${sessionId}/rankings/aggregate`, {}).catch(() => null);
    let rowsRanked = normalizeRankings(agg);
    if (!rowsRanked.length) { agg = await api.get<unknown>(`/sessions/${sessionId}/rankings`).catch(() => null); rowsRanked = normalizeRankings(agg); }
    const labelOf = (id: string) => rows.find((r) => r.id === id)?.label ?? id;
    ranking = rowsRanked.map((r) => ({ theme_id: r.theme_id, label: labelOf(r.theme_id), rank: r.rank, score: r.score }));
    winner = rankingWinner(agg, rowsRanked);
    replayHash = rankingReplayHash(agg);
  }

  progress(1, "Complete");
  return {
    sessionId, shortCode, mode: SIM_MOCK_MODE ? "self-contained" : "live-backend",
    question, responseCount: responses.length, themes, ranking, winner, replayHash,
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
