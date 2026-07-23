import type {
  Session,
  Participant,
  Question,
  SessionJoinResponse,
  PaginatedResponse,
} from "./types";
import { SPIRAL_TEST_WAVES } from "./sim-data/spiral-test-100-users";
import { supabase } from "@/lib/supabase";

// ── Test Moderator ──────────────────────────────────────────────
export const MOCK_MODERATOR_ID = "google-oauth2|mock-moderator-001";

/** Clear stale localStorage mock state.
 *  Called on join/session page load for non-moderator (general user) visits
 *  to ensure phone users always get fresh data from KV/URL params. */
export function clearStaleMockState(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("exel_mock_state");
  } catch {
    // localStorage unavailable
  }
}

// ── Cross-Tab State Sync via localStorage ───────────────────────
// Enables moderator (Tab 1) state changes to propagate to user (Tab 2).
const STORAGE_KEY = "exel_mock_state";

interface MockResponse {
  id: string;
  session_id: string;
  clean_text: string;
  submitted_at: string;
  participant_id: string;
  language_code: string;
  summary_333?: string;
  summary_111?: string;
  summary_33?: string;
}

/** Cube 6 Phase A stub: cascading summarization (333→111→33 words).
 *  Extracts key sentences to fit target word counts.
 *  Will be replaced by real AI summarization when pipeline is live. */
function summarizeCascade(text: string): { summary_333: string; summary_111: string; summary_33: string } {
  const words = text.split(/\s+/);
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  function extractToWordLimit(limit: number): string {
    if (words.length <= limit) return text;
    let result = "";
    let count = 0;
    for (const sentence of sentences) {
      const sWords = sentence.trim().split(/\s+/);
      if (count + sWords.length > limit && count > 0) break;
      result += (result ? " " : "") + sentence.trim();
      count += sWords.length;
    }
    // If first sentence exceeds limit, hard-cut
    if (count > limit || count === 0) {
      return words.slice(0, limit).join(" ") + "...";
    }
    return result;
  }

  return {
    summary_333: extractToWordLimit(333),
    summary_111: extractToWordLimit(111),
    summary_33: extractToWordLimit(33),
  };
}

interface StoredMockState {
  sessions: Record<string, Partial<Session>>;
  questions: Record<string, Question[]>;
  counts: Record<string, number>;
  newSessions: Session[];
  responses: Record<string, MockResponse[]>;
}

function saveMockState(): void {
  if (typeof window === "undefined") return;
  try {
    const state: StoredMockState = {
      sessions: {},
      questions: {},
      counts: { ...mockParticipantCount },
      newSessions: [],
      responses: { ...mockResponses },
    };
    for (const s of MOCK_SESSIONS) {
      state.sessions[s.id] = {
        status: s.status,
        opened_at: s.opened_at,
        closed_at: s.closed_at,
        ends_at: s.ends_at,
        updated_at: s.updated_at,
        participant_count: s.participant_count,
      };
    }
    // Store questions for dynamically created sessions
    for (const [sid, qs] of Object.entries(MOCK_QUESTIONS)) {
      if (!DEFAULT_SESSION_IDS.has(sid)) {
        state.questions[sid] = qs;
      }
    }
    // Store full data for sessions created in this tab (not in defaults)
    for (const s of MOCK_SESSIONS) {
      if (!DEFAULT_SESSION_IDS.has(s.id)) {
        state.newSessions.push(s);
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (SSR, quota exceeded, etc.)
  }
}

function loadMockState(): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const state: StoredMockState = JSON.parse(raw);

    // Merge status overrides into existing sessions
    for (const s of MOCK_SESSIONS) {
      const stored = state.sessions[s.id];
      if (stored && stored.updated_at && stored.updated_at > (s.updated_at || "")) {
        if (stored.status) s.status = stored.status as Session["status"];
        if (stored.opened_at !== undefined) s.opened_at = stored.opened_at;
        if (stored.closed_at !== undefined) s.closed_at = stored.closed_at;
        if (stored.ends_at !== undefined) s.ends_at = stored.ends_at;
        s.updated_at = stored.updated_at;
        if (stored.participant_count !== undefined) s.participant_count = stored.participant_count;
      }
    }

    // Load sessions created in other tabs
    if (state.newSessions) {
      for (const ns of state.newSessions) {
        if (!MOCK_SESSIONS.find((s) => s.id === ns.id)) {
          MOCK_SESSIONS.push(ns);
        }
      }
    }

    // Load questions for sessions created in other tabs
    if (state.questions) {
      for (const [sid, qs] of Object.entries(state.questions)) {
        if (!MOCK_QUESTIONS[sid]) {
          MOCK_QUESTIONS[sid] = qs;
        }
      }
    }

    // Merge participant counts
    if (state.counts) {
      for (const [sid, count] of Object.entries(state.counts)) {
        if (count > (mockParticipantCount[sid] || 0)) {
          mockParticipantCount[sid] = count;
        }
      }
    }

    // Merge responses from other tabs
    if (state.responses) {
      for (const [sid, resps] of Object.entries(state.responses)) {
        if (!mockResponses[sid]) mockResponses[sid] = [];
        for (const r of resps) {
          if (!mockResponses[sid].find((e) => e.id === r.id)) {
            mockResponses[sid].push(r);
          }
        }
      }
    }
  } catch {
    // localStorage unavailable or corrupt — use in-memory defaults
  }
}

// ── Test Sessions ───────────────────────────────────────────────
const now = new Date().toISOString();
const oneHourLater = new Date(Date.now() + 3600000).toISOString();

export const MOCK_SESSIONS: Session[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
    short_code: "DEMO2026",
    created_by: MOCK_MODERATOR_ID,
    status: "polling",
    title: "eXeL AI Polling - Strategy Alignment",
    description: "Gather team input on strategic priorities using AI-powered governance.",
    anonymity_mode: "anonymous",
    cycle_mode: "single",
    max_cycles: 1,
    current_cycle: 1,
    ranking_mode: "auto",
    language: "en",
    max_response_length: 3333,
    ai_provider: "openai",
    session_type: "polling",
    polling_mode: "single_round",
    pricing_tier: "free",
    max_participants: null,
    fee_amount_cents: 0,
    cost_splitting_enabled: false,
    reward_enabled: false,
    reward_amount_cents: 0,
    theme2_voting_level: "theme2_9",
    live_feed_enabled: false,
    polling_mode_type: "live_interactive",
    static_poll_duration_days: null,
    ends_at: null,
    timer_display_mode: "flex",
    is_paid: false,
    qr_url: null,
    join_url: null,
    opened_at: now,
    closed_at: null,
    expires_at: oneHourLater,
    created_at: now,
    updated_at: now,
    participant_count: 3,
  },
  {
    id: "b2c3d4e5-f6a7-8901-bcde-222222222222",
    short_code: "PAST0001",
    created_by: MOCK_MODERATOR_ID,
    status: "closed",
    title: "Collaborative Thoughts on AI Governance",
    description: "How should AI shape collective decision-making? Review theme visualizations and share insights.",
    anonymity_mode: "pseudonymous",
    cycle_mode: "single",
    max_cycles: 1,
    current_cycle: 1,
    ranking_mode: "auto",
    language: "en",
    max_response_length: 3333,
    ai_provider: "openai",
    session_type: "polling",
    polling_mode: "single_round",
    pricing_tier: "free",
    max_participants: null,
    fee_amount_cents: 0,
    cost_splitting_enabled: false,
    reward_enabled: false,
    reward_amount_cents: 0,
    theme2_voting_level: "theme2_9",
    live_feed_enabled: false,
    polling_mode_type: "live_interactive",
    static_poll_duration_days: null,
    ends_at: null,
    timer_display_mode: "flex",
    is_paid: false,
    qr_url: null,
    join_url: null,
    opened_at: new Date(Date.now() - 172800000).toISOString(),
    closed_at: new Date(Date.now() - 86400000).toISOString(),
    expires_at: new Date(Date.now() - 86400000).toISOString(),
    created_at: new Date(Date.now() - 172800000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    participant_count: 5000,
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-333333333333",
    short_code: "STATIC01",
    created_by: MOCK_MODERATOR_ID,
    status: "polling",
    title: "Team Innovation Challenge",
    description: "Share your innovative ideas for team collaboration. Static poll — 3 days to respond.",
    anonymity_mode: "identified",
    cycle_mode: "single",
    max_cycles: 1,
    current_cycle: 1,
    ranking_mode: "auto",
    language: "en",
    max_response_length: 3333,
    ai_provider: "openai",
    session_type: "polling",
    polling_mode: "single_round",
    pricing_tier: "free",
    max_participants: null,
    fee_amount_cents: 0,
    cost_splitting_enabled: false,
    reward_enabled: false,
    reward_amount_cents: 0,
    theme2_voting_level: "theme2_9",
    live_feed_enabled: false,
    polling_mode_type: "static_poll",
    static_poll_duration_days: 3,
    ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    timer_display_mode: "both",
    is_paid: false,
    qr_url: null,
    join_url: null,
    opened_at: new Date(Date.now() - 3600000).toISOString(),
    closed_at: null,
    expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
    participant_count: 15,
  },
];

// IDs of default sessions (used to distinguish from dynamically created ones)
export const DEFAULT_SESSION_IDS = new Set(MOCK_SESSIONS.map((s) => s.id));

// Strategy Alignment session ID — gets 100-User Spiral Test + Ranking DnD
// Strategy Alignment session — gets 100-User Spiral Test + ranking simulation
export const PRODUCT_FEEDBACK_SESSION_ID = "a1b2c3d4-e5f6-7890-abcd-111111111111";

// ── Snapshot of original default sessions for demo reset ───────────
// Deep-copy the 4 hardcoded sessions so we can restore them on every dashboard load.
const DEFAULT_SESSION_SNAPSHOTS: Record<string, Session> = {};
const DEFAULT_PARTICIPANT_COUNTS: Record<string, number> = {};
for (const s of MOCK_SESSIONS) {
  DEFAULT_SESSION_SNAPSHOTS[s.id] = { ...s };
  DEFAULT_PARTICIPANT_COUNTS[s.id] = s.participant_count;
}

/** Reset a single default demo session to its original hardcoded state.
 *  Called from the dashboard "Reset Demo" button. */
export function resetSingleSession(sessionId: string): Session | null {
  const session = MOCK_SESSIONS.find((s) => s.id === sessionId);
  if (!session || !DEFAULT_SESSION_IDS.has(sessionId)) return null;
  const snap = DEFAULT_SESSION_SNAPSHOTS[sessionId];
  if (!snap) return null;
  // Restore mutable fields
  session.status = snap.status;
  session.opened_at = snap.opened_at;
  session.closed_at = snap.closed_at;
  session.ends_at = snap.ends_at;
  session.updated_at = snap.updated_at;
  session.participant_count = snap.participant_count;
  // Reset participant count and responses
  mockParticipantCount[sessionId] = DEFAULT_PARTICIPANT_COUNTS[sessionId] ?? 0;
  delete mockResponses[sessionId];
  // Clear localStorage overrides for this session
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state: StoredMockState = JSON.parse(raw);
        delete state.sessions[sessionId];
        delete state.counts[sessionId];
        delete state.responses[sessionId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch { /* localStorage unavailable */ }
  }
  prePopulateExistingResponses();
  return { ...session };
}

/** Reset the 3 default test sessions to their original hardcoded state.
 *  Called on every dashboard load (GET /sessions) so demos always start fresh.
 *  User-created sessions (4th+) are preserved via localStorage. */
function resetDefaultSessions(): void {
  for (const s of MOCK_SESSIONS) {
    if (!DEFAULT_SESSION_IDS.has(s.id)) continue;
    const snap = DEFAULT_SESSION_SNAPSHOTS[s.id];
    if (!snap) continue;
    // Restore mutable fields to original values
    s.status = snap.status;
    s.opened_at = snap.opened_at;
    s.closed_at = snap.closed_at;
    s.ends_at = snap.ends_at;
    s.updated_at = snap.updated_at;
    s.participant_count = snap.participant_count;
  }
  // Reset participant counts and responses for default sessions
  const defaultIds = Array.from(DEFAULT_SESSION_IDS);
  defaultIds.forEach((id) => {
    mockParticipantCount[id] = DEFAULT_PARTICIPANT_COUNTS[id] ?? 0;
    delete mockResponses[id];
  });
  // Clear localStorage overrides for default sessions so loadMockState() won't re-merge stale state
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const state: StoredMockState = JSON.parse(raw);
        defaultIds.forEach((id) => {
          delete state.sessions[id];
          delete state.counts[id];
          delete state.responses[id];
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch { /* localStorage unavailable */ }
  }
  // Re-populate canned responses for sessions that start in polling/closed state
  prePopulateExistingResponses();
}

// ── Test Questions ──────────────────────────────────────────────
export const MOCK_QUESTIONS: Record<string, Question[]> = {
  "a1b2c3d4-e5f6-7890-abcd-111111111111": [
    {
      id: "q1-222222",
      session_id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
      question_text:
        "What should be our top strategic priority?",
      cycle_id: 1,
      order_index: 0,
      status: "active",
      created_at: now,
    },
  ],
  "b2c3d4e5-f6a7-8901-bcde-222222222222": [
    {
      id: "q1-333333",
      session_id: "b2c3d4e5-f6a7-8901-bcde-222222222222",
      question_text:
        "How should AI shape collective decision-making?",
      cycle_id: 1,
      order_index: 0,
      status: "active",
      created_at: now,
    },
  ],
  "c3d4e5f6-a7b8-9012-cdef-333333333333": [
    {
      id: "q1-444444",
      session_id: "c3d4e5f6-a7b8-9012-cdef-333333333333",
      question_text:
        "What innovative tools or processes could improve our team collaboration?",
      cycle_id: 1,
      order_index: 0,
      status: "active",
      created_at: now,
    },
  ],
};

// ── Mock Participant Counter ────────────────────────────────────
let mockParticipantCount: Record<string, number> = {
  "a1b2c3d4-e5f6-7890-abcd-111111111111": 3,
  "b2c3d4e5-f6a7-8901-bcde-222222222222": 5000,
  "c3d4e5f6-a7b8-9012-cdef-333333333333": 15,
};

// ── Submitted Responses (cross-tab via localStorage) ─────────────
const mockResponses: Record<string, MockResponse[]> = {};

// ── Per-Session Mock Responses (auto-generated when poll starts) ──
// Only the 3 default sessions get mock data. New user-created polls (4th+) use only live HI data.
const MOCK_SESSION_RESPONSES: Record<string, string[]> = {
  // Strategy Alignment — "What should be our top strategic priority?"
  "a1b2c3d4-e5f6-7890-abcd-111111111111": [
    "Customer retention should be priority number one. We are acquiring users but churn is too high. Fix the leaky bucket before pouring more in.",
    "Focus on enterprise sales. Our product-market fit is strongest with teams of fifty plus and that is where the revenue growth is.",
    "Invest in developer experience and API documentation. Our SDK adoption is low because the docs are incomplete.",
    "Build a self-serve analytics dashboard. Customers keep asking for usage reports they can generate themselves.",
    "We need to nail the onboarding experience. Time-to-value is too long. Users should see results in under five minutes.",
    "International expansion. We have inbound demand from LATAM and EU but no localization or regional pricing.",
    "Technical debt reduction. Our deployment velocity has slowed forty percent in the last quarter due to accumulated shortcuts.",
  ],
  // Poll 3: AI Governance — "How should AI shape collective decision-making?"
  "b2c3d4e5-f6a7-8901-bcde-222222222222": [
    "AI can democratize decision-making by processing millions of voices simultaneously, something human-only systems can't achieve at scale.",
    "My biggest concern is algorithmic bias. If the training data reflects historical biases, the AI will perpetuate inequality in governance.",
    "Transparency is key. Every AI governance decision should have an explainable audit trail that citizens can review and challenge.",
    "We need hybrid systems — AI processes data and identifies patterns, but humans make final governance decisions with that intelligence.",
    "The speed of AI analysis means governance can become truly real-time. Policies can adapt to citizen feedback within hours, not years.",
    "Privacy is my #1 concern. Governance AI systems will have access to massive amounts of citizen data. We need iron-clad protections.",
    "AI governance should start with low-stakes decisions like urban planning priorities before scaling to critical policy areas.",
  ],
  // Poll 4: Team Innovation Challenge — "What innovative tools or processes could improve our team collaboration?"
  "c3d4e5f6-a7b8-9012-cdef-333333333333": [
    "Async video updates instead of meetings. Record 3-minute Loom-style updates that teammates watch on their own time.",
    "Shared digital whiteboards that persist between sessions. Our brainstorming dies when the meeting ends and the board is erased.",
    "Rotating pair programming across teams. Engineers from different squads pair for a day — it spreads knowledge and breaks silos.",
    "A company-wide 'office hours' system where any employee can book 15 minutes with any leader, no manager approval needed.",
    "Structured retrospectives with anonymous voting on what to change. People hold back in public retros but speak freely anonymously.",
    "Cross-functional innovation sprints — 48 hours, mixed teams, real prototypes. Our best ideas came from hackathons, not planning meetings.",
    "Internal knowledge base with AI search. We waste hours looking for decisions, docs, and context scattered across Slack, Notion, and email.",
  ],
};

/** Auto-inject 7 mock participants + progressive responses when polling starts.
 *  Only fires for the 3 default sessions. New user-created polls get live HI data only. */
function startMockPollingResponses(sessionId: string): void {
  if (typeof window === "undefined") return;
  // Only inject mock data for default sessions
  const responses = MOCK_SESSION_RESPONSES[sessionId];
  if (!responses) return; // User-created poll — live HI data only
  if (!mockResponses[sessionId]) mockResponses[sessionId] = [];

  responses.forEach((text, i) => {
    setTimeout(() => {
      const pid = generateId();
      mockParticipantCount[sessionId] = (mockParticipantCount[sessionId] || 0) + 1;
      const session = findSessionById(sessionId);
      if (session) session.participant_count = mockParticipantCount[sessionId];
      mockResponses[sessionId].push({
        id: generateId(),
        session_id: sessionId,
        clean_text: text,
        submitted_at: new Date().toISOString(),
        participant_id: pid,
        language_code: "en",
        ...summarizeCascade(text),
      });
      saveMockState();
    }, 2000 + i * 2500); // Staggered: 2s, 4.5s, 7s, 9.5s, 12s, 14.5s, 17s
  });
}

// ── Pre-populate responses for sessions already in polling/closed state ──────
function prePopulateExistingResponses(): void {
  for (const session of MOCK_SESSIONS) {
    if (["polling", "ranking", "closed", "archived"].includes(session.status)) {
      const canned = MOCK_SESSION_RESPONSES[session.id];
      if (canned && (!mockResponses[session.id] || mockResponses[session.id].length === 0)) {
        mockResponses[session.id] = canned.map((text) => ({
          id: generateId(),
          session_id: session.id,
          clean_text: text,
          submitted_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          participant_id: generateId(),
          language_code: "en",
          ...summarizeCascade(text),
        }));
      }
    }
  }
}
prePopulateExistingResponses();

// ── Session counter for new sessions ────────────────────────────
let sessionCounter = MOCK_SESSIONS.length;

// ── Mock API Handlers ───────────────────────────────────────────

function findSessionByCode(code: string): Session | undefined {
  return MOCK_SESSIONS.find(
    (s) => s.short_code.toUpperCase() === code.toUpperCase()
  );
}

function findSessionById(id: string): Session | undefined {
  return MOCK_SESSIONS.find((s) => s.id === id);
}

function generateId(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function generateShortCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (!MOCK_SESSIONS.some((s) => s.short_code === code)) return code;
  }
  // Fallback: timestamp-based code (guaranteed unique)
  return `X${Date.now().toString(36).toUpperCase().slice(-7)}`;
}

/** Fetch session metadata from Cloudflare KV via the /api/sessions CF Function.
 *  Returns the stored metadata or null if unavailable.
 *  Uses cache-busting to ensure cross-device status transitions are seen immediately. */
export async function fetchSessionFromKV(
  shortCode: string,
): Promise<Record<string, unknown> | null> {
  try {
    // Cache-bust: append timestamp to bypass browser/CDN caching of stale status
    const cacheBust = `&_t=${Date.now()}`;
    const res = await fetch(`/api/sessions?code=${shortCode.toUpperCase()}${cacheBust}`, {
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // KV unavailable — fall through
  }
  return null;
}

/** Sync session metadata to Cloudflare KV with 1 retry on failure.
 *  Called on session create and state transitions. */
async function syncSessionToKV(session: Session): Promise<void> {
  const questionText = MOCK_QUESTIONS[session.id]?.[0]?.question_text || null;
  const payload = {
    id: session.id,
    short_code: session.short_code,
    title: session.title,
    description: session.description,
    status: session.status,
    polling_mode_type: session.polling_mode_type,
    static_poll_duration_days: session.static_poll_duration_days,
    ends_at: session.ends_at,
    timer_display_mode: session.timer_display_mode,
    anonymity_mode: session.anonymity_mode,
    theme2_voting_level: session.theme2_voting_level,
    ai_provider: session.ai_provider,
    max_response_length: session.max_response_length,
    participant_count: session.participant_count,
    question_text: questionText,
  };
  const doFetch = () =>
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  try {
    await doFetch();
  } catch {
    // Retry once after 500ms
    try {
      await new Promise((r) => setTimeout(r, 500));
      await doFetch();
    } catch {
      // KV unavailable — continue without sync
    }
  }
}

/** Hydrate a session from QR URL params when it doesn't exist locally.
 *  Enables cross-device QR scanning in mock mode by reconstructing
 *  the session from the encoded title + status in the URL.
 *  Extended params: sid (UUID), pm (polling_mode_type), dur (static_poll_duration_days). */
export function hydrateSessionFromParams(
  code: string,
  title?: string | null,
  status?: string | null,
  sid?: string | null,
  pm?: string | null,
  dur?: string | null,
): Session | null {
  // Already exists locally
  const existing = findSessionByCode(code);
  if (existing) return existing;

  // No params to reconstruct from
  if (!title) return null;

  const now = new Date().toISOString();
  const resolvedStatus = (status || "open") as Session["status"];
  const pollingModeType = (pm || "live_interactive") as Session["polling_mode_type"];
  const staticDays = dur ? parseInt(dur, 10) : null;
  const endsAt = pollingModeType === "static_poll" && staticDays
    ? new Date(Date.now() + staticDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const newSession: Session = {
    id: sid || generateId(),
    short_code: code.toUpperCase(),
    created_by: MOCK_MODERATOR_ID,
    status: resolvedStatus,
    title,
    description: null,
    anonymity_mode: "identified",
    cycle_mode: "single",
    max_cycles: 1,
    current_cycle: 1,
    ranking_mode: "auto",
    language: "en",
    max_response_length: 3333,
    ai_provider: "openai",
    session_type: "polling",
    polling_mode: "single_round",
    pricing_tier: "free",
    max_participants: null,
    fee_amount_cents: 0,
    cost_splitting_enabled: false,
    reward_enabled: false,
    reward_amount_cents: 0,
    theme2_voting_level: "theme2_9",
    live_feed_enabled: false,
    polling_mode_type: pollingModeType,
    static_poll_duration_days: staticDays,
    ends_at: endsAt,
    timer_display_mode: pollingModeType === "static_poll" ? "both" : "flex",
    is_paid: false,
    qr_url: null,
    join_url: null,
    opened_at: resolvedStatus !== "draft" ? now : null,
    closed_at: null,
    expires_at: new Date(Date.now() + 86400000).toISOString(),
    created_at: now,
    updated_at: now,
    participant_count: 0,
  } as Session;

  MOCK_SESSIONS.push(newSession);
  mockParticipantCount[newSession.id] = 0;
  MOCK_QUESTIONS[newSession.id] = [
    {
      id: generateId(),
      session_id: newSession.id,
      question_text: `What are your thoughts on: ${title.replace(/[?.]$/, "")}?`,
      cycle_id: 1,
      order_index: 0,
      status: "active",
      created_at: now,
    },
  ];
  saveMockState();
  return newSession;
}

/** Hydrate session from KV metadata (richer data than URL params).
 *  Merges KV data into an existing hydrated session or creates a new one. */
export function hydrateSessionFromKV(
  code: string,
  kvData: Record<string, unknown>,
): Session {
  const existing = findSessionByCode(code);
  if (existing) {
    // Update existing session with KV data (KV is source of truth for status)
    if (kvData.status) existing.status = kvData.status as Session["status"];
    if (kvData.title) existing.title = kvData.title as string;
    if (kvData.description !== undefined) existing.description = kvData.description as string | null;
    if (kvData.polling_mode_type) existing.polling_mode_type = kvData.polling_mode_type as Session["polling_mode_type"];
    if (kvData.static_poll_duration_days !== undefined) existing.static_poll_duration_days = kvData.static_poll_duration_days as number | null;
    if (kvData.ends_at !== undefined) existing.ends_at = kvData.ends_at as string | null;
    if (kvData.participant_count !== undefined) existing.participant_count = kvData.participant_count as number;
    if (kvData.id && existing.id !== kvData.id) existing.id = kvData.id as string;
    existing.updated_at = new Date().toISOString();
    saveMockState();
    return existing;
  }

  // Create from KV data
  return hydrateSessionFromParams(
    code,
    (kvData.title as string) || "Shared Session",
    (kvData.status as string) || "open",
    (kvData.id as string) || null,
    (kvData.polling_mode_type as string) || null,
    kvData.static_poll_duration_days ? String(kvData.static_poll_duration_days) : null,
  )!;
}

// ── Cube Simulation mock fixtures ───────────────────────────────────────────
const _SIM_CUBES: Record<number, { name: string; io: { inputs: string[]; functions: string[]; outputs: string[] } }> = {
  1: { name: "Session", io: { inputs: ["config", "moderator_id", "capacity"], functions: ["create_session", "generate_qr", "transition_state"], outputs: ["short_code", "qr_png", "session_id"] } },
  2: { name: "Text Submission", io: { inputs: ["raw_text", "session_id", "participant", "language", "max_length"], functions: ["validate_and_fit", "detect_pii", "scrub_pii", "compute_response_hash"], outputs: ["clean_text", "pii_found", "response_hash", "replay_hash"] } },
  3: { name: "Voice", io: { inputs: ["audio", "language", "provider"], functions: ["transcribe", "failover", "to_text_pipeline"], outputs: ["transcript", "confidence", "provider_used"] } },
  4: { name: "Collector", io: { inputs: ["response", "session_id", "participant"], functions: ["aggregate", "track_presence", "persist"], outputs: ["response_count", "presence", "stored"] } },
  5: { name: "Gateway", io: { inputs: ["session_id", "active_minutes", "action"], functions: ["calculate_tokens", "orchestrate_pipeline", "mot_cost_chart"], outputs: ["heart", "human", "unity", "dollars_per_min"] } },
  6: { name: "AI Theming", io: { inputs: ["responses", "provider", "sample"], functions: ["embed", "cluster", "summarize", "assign_theme"], outputs: ["theme01", "theme02", "summaries", "replay_hash"] } },
  7: { name: "Ranking", io: { inputs: ["ranked_ids", "votes", "level"], functions: ["borda", "anti_sybil", "aggregate"], outputs: ["ranking", "confidence", "winner"] } },
  8: { name: "Tokens", io: { inputs: ["amount", "jurisdiction", "action"], functions: ["dollars_to_hi", "mint", "transition_lifecycle"], outputs: ["hi_tokens", "ledger_entry", "lifecycle_state"] } },
  9: { name: "Reports", io: { inputs: ["session_id", "tier", "format"], functions: ["build_csv", "compute_export_hash", "distribute"], outputs: ["csv", "export_hash", "recipients"] } },
};
const _SIM_SECTIONS: Record<string, string> = { A: "Clean & fit", B: "Find private info", C: "Hide it", D: "Fingerprint" };
const _SIM_SECTION_KEYS = ["A", "B", "C", "D"] as const;
const _SIM_SECTION_LABELS: Record<number, string[]> = {
  1: ["Make the session", "QR & join link", "Fingerprint", "Open / close"],
  2: ["Clean & fit", "Find private info", "Hide it", "Fingerprint"],
  3: ["Listen (audio in)", "Turn speech to text", "Backup provider", "Send to pipeline"],
  4: ["Gather answers", "Who's here", "Save it", "Read the room"],
  5: ["Count the time", "Kick off the AI", "Cost per minute", "Profit math"],
  6: ["Sort into buckets", "Pick samples", "Write the summary", "Tag each answer"],
  7: ["Score the votes", "Stop cheating", "Add it all up", "Break ties"],
  8: ["Dollars to tokens", "Mint the tokens", "Lifecycle", "Fix mistakes"],
  9: ["Build the CSV", "Fingerprint export", "Filter by tier", "Hand out results"],
};
// Mirror the backend segment_cells (FX-G): a section is a COHERENT contiguous slab of
// cells (z-major), NOT a random scatter. n=3 → the 3 levels, n=4 → 4 stacked slabs,
// n=9 → rows, n=27 → each mini-cube. Same coherent shape for every cube.
const _SIM_ALLOWED_COUNTS = Array.from({ length: 26 }, (_, i) => i + 2); // 2..27
// Mirror the backend partition (FX-I): each building block is FACE-CONNECTED (Lego rule),
// varied per cube. n=3 → layers, n=9 → columns, n=27 → singletons, else seeded region-grow.
function _faceNeighbors(i: number): number[] {
  const x = i % 3, y = Math.floor(i / 3) % 3, z = Math.floor(i / 9), o: number[] = [];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3 && nz >= 0 && nz < 3) o.push(nz * 9 + ny * 3 + nx);
  }
  return o;
}
function _connectedPartition(seed: number, n: number): number[][] {
  if (n <= 1) return [Array.from({ length: 27 }, (_, i) => i)];
  if (n >= 27) return Array.from({ length: 27 }, (_, i) => [i]);
  const key = (c: number) => { let h = (2166136261 ^ Math.imul(seed + 1, 2654435761)) >>> 0; h = Math.imul(h ^ (c + 1), 16777619) >>> 0; return h; };
  const order = Array.from({ length: 27 }, (_, c) => c).sort((a, b) => key(a) - key(b));
  const pos: Record<number, number> = {}; order.forEach((c, i) => { pos[c] = i; });
  const seeds = order.slice(0, n); const owner: Record<number, number> = {};
  const members = seeds.map((s) => [s]); const assigned = new Set(seeds); seeds.forEach((s, k) => { owner[s] = k; });
  let remaining = 27 - n;
  while (remaining > 0) {
    let progressed = false;
    for (let k = 0; k < n; k++) {
      const cands = new Set<number>();
      for (const m of members[k]) for (const nb of _faceNeighbors(m)) if (!assigned.has(nb)) cands.add(nb);
      if (cands.size) {
        const nb = Array.from(cands).sort((a, b) => pos[a] - pos[b])[0];
        owner[nb] = k; assigned.add(nb); members[k].push(nb); remaining -= 1; progressed = true;
        if (remaining === 0) break;
      }
    }
    if (!progressed) { for (let c = 0; c < 27; c++) if (!assigned.has(c)) { owner[c] = pos[c] % n; assigned.add(c); } remaining = 0; }
  }
  const groups: number[][] = Array.from({ length: n }, () => []);
  for (let c = 0; c < 27; c++) groups[owner[c]].push(c);
  return groups.map((g) => g.sort((a, b) => a - b));
}
function _mockSections(cubeId: number, count = 4) {
  const cio = _SIM_CUBES[cubeId]?.io ?? { inputs: [], functions: [], outputs: [] };
  const groups = _connectedPartition(cubeId, count);
  if (count === 4) {
    const labels = _SIM_SECTION_LABELS[cubeId] ?? ["Section A", "Section B", "Section C", "Section D"];
    const io = cio.functions ?? [];
    return _SIM_SECTION_KEYS.map((key, i) => {
      const cells = groups[i];
      const fns = io.length ? [io[i % io.length]] : [`fn_${key.toLowerCase()}`];
      return { key, label: labels[i], functions: fns, highlight: { "3": cells, "6": cells, "9": cells },
        io: { inputs: cio.inputs, functions: fns, outputs: cio.outputs } };
    });
  }
  const out = [];
  const allf = cio.functions ?? [];
  for (let k = 0; k < count; k++) {
    const cells = groups[k];
    const fns = allf.filter((_, j) => j % count === k);   // mirror real code across blocks
    out.push({ key: `B${k + 1}`, label: `Block ${k + 1}`,
      functions: fns, highlight: { "3": cells, "6": cells, "9": cells },
      io: { inputs: cio.inputs, functions: fns, outputs: cio.outputs } });
  }
  return out;
}

function _mockHash(seed: string): string {
  let h = 2166136261;
  const out: string[] = [];
  for (let i = 0; i < 64; i++) {
    h = (h ^ (seed.charCodeAt((i + seed.length) % (seed.length || 1)) + i * 131)) >>> 0;
    h = (h * 16777619) >>> 0;
    out.push(((h >>> (i % 24)) & 15).toString(16));
  }
  return out.join("");
}

function handleSimMock(method: string, rawPath: string, body?: unknown): unknown {
  const [path, query] = rawPath.split("?");
  const qs = new URLSearchParams(query || "");
  if (method === "GET" && path === "/sim/cubes") {
    // Mirror the backend shape exactly: {cube_id, name, harness_available}. All 9 have harnesses.
    return { cubes: Object.entries(_SIM_CUBES).map(([id, c]) => ({ cube_id: Number(id), name: c.name, harness_available: true })) };
  }
  const m = path.match(/^\/sim\/cube\/(\d+)\/(contract|run|challenge|replay|check-in|submit|source)$/);
  if (!m) return undefined;
  const id = Number(m[1]);
  const action = m[2];
  const cube = _SIM_CUBES[id] || { name: `Cube ${id}`, io: { inputs: [], functions: [], outputs: [] } };
  if (method === "GET" && action === "contract") {
    const count = _SIM_ALLOWED_COUNTS.includes(Number(qs.get("sections"))) ? Number(qs.get("sections")) : 4;
    return { cube_id: id, name: cube.name, io_contract: cube.io, sections: _mockSections(id, count) };
  }
  if (method === "GET" && action === "source") {
    // FX-B: LIVE source (representative real snippets under MOCK_MODE; the real backend
    // returns inspect.getsource whitelisted to app/cubes/**).
    const want = qs.get("section");
    const secs = _mockSections(id).filter((s) => !want || s.key === want);
    const blocks = secs.flatMap((s) =>
      s.functions.map((fn) => ({
        name: fn, section: s.key, resolved: true,
        path: `app/cubes/cube${id}_.../service.py`,
        source: `# ${cube.name} · section ${s.key} (${s.label})\nasync def ${fn}(self, *args, **kwargs):\n    """Live cube code running the platform (representative mock snippet).\n    The real backend returns the exact source via inspect.getsource."""\n    result = await self._run(*args, **kwargs)\n    return result`,
      })),
    );
    return { cube_id: id, section: want || null, blocks };
  }
  if (method === "POST" && action === "check-in") {
    const b = (body as { section?: string; level?: number } | undefined) || {};
    return { run_id: _mockHash(`checkin:${id}:${b.section || ""}`).slice(0, 32), cube_id: id,
      section: b.section ?? null, level: b.level ?? 9, proposed_version: `cand-${id}`, status: "checked_in", persisted: false };
  }
  if (method === "POST" && action === "submit") {
    const b = (body as { section?: string; level?: number; tier?: string; human_approved?: boolean } | undefined) || {};
    const tier = b.tier || "manual";
    if (!["manual", "semi", "automated"].includes(tier)) return { __status: 400 };
    const sig = _mockHash(`run:${id}`);
    const metrics = { wall_time_ms: 388, function_calls: cube.io.functions.length * 100, db_execute_calls: 300 };
    const verdict = { equivalent: true, compare_passed: true, faster: true, overall_passed: true };
    const decision = b.human_approved
      ? { tier, decision: "swap", reason: "human approved the swap", tally: null }
      : { tier, decision: "hold", reason: "awaiting human approval", tally: null };
    const rsig = _mockHash(`replay:${id}:${b.section || "cube"}`);
    return {
      cube_id: id, section: b.section ?? null, level: b.level ?? 9,
      baseline: { metrics, determinism_signature: sig },
      candidate: { metrics: { ...metrics, wall_time_ms: 365 }, determinism_signature: sig },
      verdict, decision,
      replay: { replay_hash: rsig, scope: b.section ? "block" : "cube", section_label: b.section ? (_SIM_SECTIONS[b.section] || b.section) : "whole cube" },
      validation: { validators: 0, required: 3, state: "pending_validation" },
    };
  }
  if (method === "POST" && action === "run") {
    const sig = _mockHash(`run:${id}`);
    return { cube_id: id, metrics: { wall_time_ms: 388, function_calls: cube.io.functions.length * 100, db_execute_calls: 300 }, outputs: { total: 300, replay_hash: sig }, determinism_signature: sig };
  }
  if (method === "GET" && action === "replay") {
    const section = qs.get("section");
    const sig = _mockHash(`replay:${id}:${section || "cube"}`);
    // Mirror the backend replay_against_dataset return shape (full keys).
    return {
      case_id: "demo", response_count: 300, cube_id: id, function_name: "",
      section: section || null, section_label: section ? (_SIM_SECTIONS[section] || section) : "whole cube",
      scope: section ? "block" : "cube", status: "replayed",
      signature: sig, replay_hash: sig, row_count: 300, duration_ms: 42.0, replay_hash_match: true,
    };
  }
  if (method === "POST" && action === "challenge") {
    // Mirror run_challenge: {baseline, candidate, verdict, decision:{tier, decision, reason, tally}}.
    const tier = (body as { tier?: string } | undefined)?.tier || "manual";
    const sig = _mockHash(`run:${id}`);
    const metrics = { wall_time_ms: 388, function_calls: cube.io.functions.length * 100, db_execute_calls: 300 };
    const verdict = { equivalent: true, compare_passed: true, faster: true, overall_passed: true };
    const decision = tier === "manual"
      ? { tier, decision: "hold", reason: "awaiting human approval", tally: null }
      : { tier, decision: "swap", reason: "equivalent + faster (mock)", tally: null };
    return {
      baseline: { metrics, determinism_signature: sig },
      candidate: { metrics: { ...metrics, wall_time_ms: 365 }, determinism_signature: sig },
      verdict, decision,
    };
  }
  return undefined;
}

export async function handleMockRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T | null> {
  // ── Sync from localStorage (cross-tab state) on every read ────
  loadMockState();

  // ── Cube Simulation (Dev-Sim / Manual Vision • 2525) mock fixtures ──────────
  // Without these, /sim/* 404s under MOCK_MODE (the default deploy) and the
  // workbench is inert. Real hashes/metrics come from the backend when
  // NEXT_PUBLIC_MOCK_MODE=false. Deterministic so the UI is stable.
  if (path.startsWith("/sim/")) {
    const simRes = handleSimMock(method, path, body);
    if (simRes !== undefined) return simRes as T;
  }

  // GET /sessions (list) — reset 3 default test polls on every dashboard load
  if (method === "GET" && path === "/sessions") {
    resetDefaultSessions();
    return {
      items: MOCK_SESSIONS.map((s) => ({ ...s })),
      total: MOCK_SESSIONS.length,
      limit: 50,
      offset: 0,
    } as T;
  }

  // POST /sessions (create)
  if (method === "POST" && path === "/sessions") {
    const payload = body as Record<string, unknown>;
    sessionCounter++;
    const shortCode = generateShortCode();
    const pollingModeType = ((payload?.polling_mode_type as string) || "live_interactive") as Session["polling_mode_type"];
    const staticPollDays = pollingModeType === "static_poll"
      ? ((payload?.static_poll_duration_days as number) || 3)
      : null;
    const newSession: Session = {
      id: generateId(),
      short_code: shortCode,
      created_by: MOCK_MODERATOR_ID,
      status: "draft",
      title: (payload?.title as string) || `Session #${sessionCounter}`,
      description: (payload?.description as string) || null,
      anonymity_mode: "identified",
      cycle_mode: ((payload?.cycle_mode as string) || "single") as Session["cycle_mode"],
      max_cycles: 1,
      current_cycle: 1,
      ranking_mode: "auto",
      language: "en",
      max_response_length: (payload?.max_response_length as number) || 3333,
      ai_provider: (payload?.ai_provider as string) || "openai",
      session_type: (payload?.session_type as string) || "polling",
      polling_mode: (payload?.polling_mode as string) || "single_round",
      pricing_tier: (payload?.pricing_tier as string) || "free",
      max_participants: (payload?.max_participants as number) || null,
      fee_amount_cents: (payload?.fee_amount_cents as number) || 0,
      cost_splitting_enabled: (payload?.cost_splitting_enabled as boolean) || false,
      reward_enabled: (payload?.reward_enabled as boolean) || false,
      reward_amount_cents: (payload?.reward_amount_cents as number) || 0,
      theme2_voting_level: (payload?.theme2_voting_level as string) || "theme2_9",
      live_feed_enabled: (payload?.live_feed_enabled as boolean) || false,
      polling_mode_type: pollingModeType,
      static_poll_duration_days: staticPollDays,
      timer_display_mode: ((payload?.timer_display_mode as string) || "flex") as Session["timer_display_mode"],
      is_paid: false,
      qr_url: null,
      join_url: `${typeof window !== "undefined" ? window.location.origin : ""}/join/?code=${shortCode}`,
      opened_at: null,
      closed_at: null,
      ends_at: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participant_count: 0,
    } as Session;
    MOCK_SESSIONS.unshift(newSession);
    mockParticipantCount[newSession.id] = 0;
    // Auto-create a default question so the polling flow works end-to-end
    MOCK_QUESTIONS[newSession.id] = [
      {
        id: generateId(),
        session_id: newSession.id,
        question_text: (payload?.title as string)
          ? `What are your thoughts on: ${(payload.title as string).replace(/[?.]$/, "")}?`
          : "What are your thoughts?",
        cycle_id: 1,
        order_index: 0,
        status: "active",
        created_at: new Date().toISOString(),
      },
    ];
    saveMockState();
    // Cross-device: sync session metadata to KV (fire-and-forget for create)
    syncSessionToKV(newSession).catch(() => {});
    return newSession as T;
  }

  // GET /sessions/code/{code} — shallow copy for React re-render
  const codeMatch = path.match(/^\/sessions\/code\/(.+)$/);
  if (method === "GET" && codeMatch) {
    const session = findSessionByCode(codeMatch[1]);
    if (!session) return null; // will trigger 404
    return { ...session } as T;
  }

  // GET /sessions/{id} — return session with cross-device KV status merge
  const idMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})$/
  );
  if (method === "GET" && idMatch) {
    const session = findSessionById(idMatch[1]);
    if (!session) return null;
    // Cross-device: merge KV status so phone sees moderator's transitions
    if (session.short_code) {
      try {
        const kvData = await fetchSessionFromKV(session.short_code);
        if (kvData && !("error" in kvData) && kvData.status && kvData.status !== session.status) {
          session.status = kvData.status as Session["status"];
          if (kvData.ends_at) session.ends_at = kvData.ends_at as string;
          if (kvData.participant_count != null) {
            session.participant_count = kvData.participant_count as number;
          }
          session.updated_at = new Date().toISOString();
          saveMockState();
        }
      } catch {
        // KV unavailable — use local data
      }
    }
    return { ...session } as T;
  }

  // GET /sessions/{id}/questions
  const questionsMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/questions$/
  );
  if (method === "GET" && questionsMatch) {
    return (MOCK_QUESTIONS[questionsMatch[1]] || []) as T;
  }

  // GET /sessions/{id}/presence — merge local count with KV for cross-device accuracy
  const presenceMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/presence$/
  );
  if (method === "GET" && presenceMatch) {
    let count = mockParticipantCount[presenceMatch[1]] || 0;
    // Cross-device: check KV for a higher participant count
    const presenceSession = findSessionById(presenceMatch[1]);
    if (presenceSession?.short_code) {
      try {
        const kvData = await fetchSessionFromKV(presenceSession.short_code);
        if (kvData && !("error" in kvData) && typeof kvData.participant_count === "number") {
          count = Math.max(count, kvData.participant_count as number);
        }
      } catch {
        // KV unavailable — use local count
      }
    }
    return {
      session_id: presenceMatch[1],
      active_count: count,
      participants: [],
    } as T;
  }

  // POST /sessions/join/{code}
  const joinMatch = path.match(/^\/sessions\/join\/(.+)$/);
  if (method === "POST" && joinMatch) {
    const session = findSessionByCode(joinMatch[1]);
    if (!session) return null;
    const participantId = generateId();
    mockParticipantCount[session.id] =
      (mockParticipantCount[session.id] || 0) + 1;
    session.participant_count = mockParticipantCount[session.id];
    saveMockState();
    // Cross-device: sync updated participant count to KV (fire-and-forget for join)
    syncSessionToKV(session).catch(() => {});
    return {
      session_id: session.id,
      participant_id: participantId,
      short_code: session.short_code,
      title: session.title,
      status: session.status,
      display_name: (body as Record<string, unknown>)?.display_name || null,
      theme_id: "exel-cyan",
      custom_accent_color: null,
      polling_mode_type: session.polling_mode_type,
      ends_at: session.ends_at,
      timer_display_mode: session.timer_display_mode,
    } as T;
  }

  // POST /sessions/{id}/responses
  const responseMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/responses$/
  );
  if (method === "POST" && responseMatch) {
    const payload = body as Record<string, unknown>;
    const sid = responseMatch[1];
    const responseId = generateId();
    const cleanText = (payload?.raw_text as string) || "";
    const submittedAt = new Date().toISOString();
    const pid = (payload?.participant_id as string) || generateId();
    const langCode = (payload?.language_code as string) || "en";

    // Cube 6 Phase A: generate cascading summaries (333→111→33 words)
    const summaries = summarizeCascade(cleanText);

    // Store response with summaries for cross-tab live feed
    if (!mockResponses[sid]) mockResponses[sid] = [];
    mockResponses[sid].push({
      id: responseId,
      session_id: sid,
      clean_text: cleanText,
      submitted_at: submittedAt,
      participant_id: pid,
      language_code: langCode,
      ...summaries,
    });
    saveMockState();

    // ── Cross-device: also POST to KV-backed /api/responses ──
    const session = findSessionById(sid);
    if (session?.short_code) {
      fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_code: session.short_code,
          text: cleanText,
          participant_id: pid,
          language_code: langCode,
          summary_333: summaries.summary_333,
          summary_111: summaries.summary_111,
          summary_33: summaries.summary_33,
        }),
      }).catch(() => {}); // fire-and-forget
    }

    return {
      id: responseId,
      session_id: sid,
      question_id: (payload?.question_id as string) || generateId(),
      participant_id: pid,
      source: "text",
      char_count: cleanText.length,
      language_code: langCode,
      submitted_at: submittedAt,
      is_flagged: false,
      pii_detected: false,
      profanity_detected: false,
      clean_text: cleanText,
      heart_tokens_earned: 1,
      unity_tokens_earned: 5,
      response_hash: null,
    } as T;
  }

  // GET /sessions/{id}/responses (for moderator live feed)
  // Merges local mock data + cross-device KV data
  const getResponsesMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/responses$/
  );
  if (method === "GET" && getResponsesMatch) {
    const sid = getResponsesMatch[1];
    const localItems = mockResponses[sid] || [];

    // ── Cross-device: also fetch from KV-backed /api/responses ──
    const session = findSessionById(sid);
    if (session?.short_code) {
      try {
        const res = await fetch(`/api/responses?session=${session.short_code}`);
        if (res.ok) {
          const kvData = await res.json();
          const kvItems: MockResponse[] = (kvData.items || []).map((r: MockResponse) => ({
            ...r,
            session_id: sid, // normalize to session UUID
          }));
          // Merge: deduplicate by participant_id + text prefix (handles different users with identical text)
          const localSet = new Set(localItems.map((r) => `${r.participant_id}::${r.clean_text.slice(0, 50)}`));
          for (const kvItem of kvItems) {
            const key = `${kvItem.participant_id}::${kvItem.clean_text.slice(0, 50)}`;
            if (!localSet.has(key)) {
              localItems.push(kvItem);
              localSet.add(key);
            }
          }
        }
      } catch {
        // KV unavailable — use local only
      }
    }

    return {
      items: localItems,
      total: localItems.length,
    } as T;
  }

  // State transitions: start, open, poll, rank, close, archive
  const transitionMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/(start|open|poll|rank|close|archive)$/
  );
  if (method === "POST" && transitionMatch) {
    const session = findSessionById(transitionMatch[1]);
    if (!session) return null;
    const stateMap: Record<string, string> = {
      start: "open",
      open: "open",
      poll: "polling",
      rank: "ranking",
      close: "closed",
      archive: "archived",
    };
    session.status = stateMap[transitionMatch[2]] as Session["status"];
    session.updated_at = new Date().toISOString();
    if (transitionMatch[2] === "open" || transitionMatch[2] === "start") {
      session.opened_at = new Date().toISOString();
    }
    if (transitionMatch[2] === "poll") {
      // Static polls: compute ends_at deadline
      if (session.polling_mode_type === "static_poll") {
        const days = session.static_poll_duration_days ?? 3;
        session.ends_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }
      // Auto-inject mock participants + responses for live demo
      startMockPollingResponses(session.id);
    }
    if (transitionMatch[2] === "close") {
      session.closed_at = new Date().toISOString();
    }
    saveMockState();
    // Cross-device: await KV sync on transitions (critical path for cross-device)
    await syncSessionToKV(session);
    return { ...session } as T;
  }

  // DELETE /sessions/{id}
  const deleteMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})$/
  );
  if (method === "DELETE" && deleteMatch) {
    const idx = MOCK_SESSIONS.findIndex((s) => s.id === deleteMatch[1]);
    if (idx === -1) return null;
    const [removed] = MOCK_SESSIONS.splice(idx, 1);
    delete mockParticipantCount[removed.id];
    delete MOCK_QUESTIONS[removed.id];
    delete mockResponses[removed.id];
    saveMockState();
    return { deleted: true } as T;
  }

  // GET /sessions/{id}/participants
  const participantsMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/participants$/
  );
  if (method === "GET" && participantsMatch) {
    return [] as T;
  }

  return null;
}

// ── MoT (Master of Thought) Spiral Test Orchestrator ────────────────
// Dispatches 100 responses across 12 agent waves with staggered timing.
// Each response POSTs to /api/responses (Cloudflare) for cross-device
// visibility AND pushes to local mockResponses[] for immediate feed.

export interface SpiralTestProgress {
  wave: number;
  waveName: string;
  totalWaves: number;
  responsesDelivered: number;
  totalResponses: number;
  isComplete: boolean;
}

export type SpiralTestProgressCallback = (progress: SpiralTestProgress) => void;

/**
 * Start the 100-user spiral test for the given session.
 * Returns a cancel function to abort mid-test.
 */
export interface SpiralTestResponse {
  id: string;
  clean_text: string;
  submitted_at: string;
  summary_33: string;
}

export function startSpiralTest(
  sessionId: string,
  onProgress?: SpiralTestProgressCallback,
  onResponse?: (resp: SpiralTestResponse) => void,
): () => void {
  const session = findSessionById(sessionId);
  if (!session) return () => {};
  if (!mockResponses[sessionId]) mockResponses[sessionId] = [];

  let cancelled = false;
  const timers: ReturnType<typeof setTimeout>[] = [];
  let delivered = 0;
  const totalResponses = 100;
  const totalWaves = 12;

  for (const wave of SPIRAL_TEST_WAVES) {
    for (const resp of wave.responses) {
      const timer = setTimeout(() => {
        if (cancelled) return;

        // Increment participant count
        mockParticipantCount[sessionId] = (mockParticipantCount[sessionId] || 0) + 1;
        if (session) session.participant_count = mockParticipantCount[sessionId];

        // Cube 6 Phase A: generate cascading summaries
        const respSummaries = summarizeCascade(resp.text);

        // Push to local mock store
        const responseId = generateId();
        mockResponses[sessionId].push({
          id: responseId,
          session_id: sessionId,
          clean_text: resp.text,
          submitted_at: new Date().toISOString(),
          participant_id: resp.participant_id,
          language_code: resp.language_code,
          ...respSummaries,
        });
        saveMockState();

        // Direct callback to dashboard — same-tab, instant, no network needed
        if (onResponse) {
          onResponse({
            id: responseId,
            clean_text: resp.text,
            submitted_at: new Date().toISOString(),
            summary_33: respSummaries.summary_33,
          });
        }

        // Supabase DB insert — persist for cross-device + postgres_changes backup
        if (supabase && session?.short_code) {
          supabase.from("responses").insert({
            id: responseId,
            session_code: session.short_code,
            participant_id: resp.participant_id,
            content: resp.text,
          }).then(() => {}, () => {});
        }

        // Path C: CF KV backup (cross-device, fire-and-forget)
        if (session?.short_code) {
          fetch("/api/responses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              short_code: session.short_code,
              text: resp.text,
              participant_id: resp.participant_id,
              language_code: resp.language_code,
              summary_333: respSummaries.summary_333,
              summary_111: respSummaries.summary_111,
              summary_33: respSummaries.summary_33,
            }),
          }).catch(() => {});
        }

        delivered++;

        // Report progress
        if (onProgress) {
          onProgress({
            wave: wave.wave,
            waveName: wave.agent_name,
            totalWaves,
            responsesDelivered: delivered,
            totalResponses,
            isComplete: delivered >= totalResponses,
          });
        }
      }, resp.delay_ms);

      timers.push(timer);
    }
  }

  // Return cancel function
  return () => {
    cancelled = true;
    for (const t of timers) clearTimeout(t);
  };
}
