import type {
  Session,
  Participant,
  Question,
  SessionJoinResponse,
  PaginatedResponse,
} from "./types";

// ── Test Moderator ──────────────────────────────────────────────
export const MOCK_MODERATOR_ID = "google-oauth2|mock-moderator-001";

// ── Cross-Tab State Sync via localStorage ───────────────────────
// Enables moderator (Tab 1) state changes to propagate to user (Tab 2).
// Each tab has its own in-memory MOCK_SESSIONS. localStorage bridges them.
const STORAGE_KEY = "exel_mock_state";

interface StoredMockState {
  sessions: Record<string, Partial<Session>>;
  questions: Record<string, Question[]>;
  counts: Record<string, number>;
  newSessions: Session[];
}

function saveMockState(): void {
  if (typeof window === "undefined") return;
  try {
    const state: StoredMockState = {
      sessions: {},
      questions: {},
      counts: { ...mockParticipantCount },
      newSessions: [],
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
    short_code: "12345678",
    created_by: MOCK_MODERATOR_ID,
    status: "polling",
    title: "Test Poll: Product Feedback",
    description:
      "What features should we prioritize for the next quarter? Share your thoughts.",
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
    short_code: "DEMO2024",
    created_by: MOCK_MODERATOR_ID,
    status: "draft",
    title: "Q1 Strategy Alignment",
    description: "Gather team input on strategic priorities for Q1.",
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
    opened_at: null,
    closed_at: null,
    expires_at: oneHourLater,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    participant_count: 0,
  },
  {
    id: "c3d4e5f6-a7b8-9012-cdef-333333333333",
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
    participant_count: 47,
  },
  {
    id: "d4e5f6a7-b8c9-0123-defg-444444444444",
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
const DEFAULT_SESSION_IDS = new Set(MOCK_SESSIONS.map((s) => s.id));

// ── Test Questions ──────────────────────────────────────────────
export const MOCK_QUESTIONS: Record<string, Question[]> = {
  "a1b2c3d4-e5f6-7890-abcd-111111111111": [
    {
      id: "q1-111111",
      session_id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
      question_text:
        "What is the single most important feature we should build next?",
      cycle_id: 1,
      order_index: 0,
      status: "active",
      created_at: now,
    },
  ],
  "b2c3d4e5-f6a7-8901-bcde-222222222222": [
    {
      id: "q1-222222",
      session_id: "b2c3d4e5-f6a7-8901-bcde-222222222222",
      question_text:
        "What should be our top strategic priority for Q1?",
      cycle_id: 1,
      order_index: 0,
      status: "active",
      created_at: now,
    },
  ],
  "c3d4e5f6-a7b8-9012-cdef-333333333333": [
    {
      id: "q1-333333",
      session_id: "c3d4e5f6-a7b8-9012-cdef-333333333333",
      question_text:
        "How should AI shape collective decision-making?",
      cycle_id: 1,
      order_index: 0,
      status: "active",
      created_at: now,
    },
  ],
  "d4e5f6a7-b8c9-0123-defg-444444444444": [
    {
      id: "q1-444444",
      session_id: "d4e5f6a7-b8c9-0123-defg-444444444444",
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
  "b2c3d4e5-f6a7-8901-bcde-222222222222": 0,
  "c3d4e5f6-a7b8-9012-cdef-333333333333": 47,
  "d4e5f6a7-b8c9-0123-defg-444444444444": 15,
};

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
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function handleMockRequest<T>(
  method: string,
  path: string,
  body?: unknown
): T | null {
  // ── Sync from localStorage (cross-tab state) on every read ────
  loadMockState();

  // GET /sessions (list)
  if (method === "GET" && path === "/sessions") {
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
      max_response_length: 3333,
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
    return newSession as T;
  }

  // GET /sessions/code/{code} — shallow copy for React re-render
  const codeMatch = path.match(/^\/sessions\/code\/(.+)$/);
  if (method === "GET" && codeMatch) {
    const session = findSessionByCode(codeMatch[1]);
    if (!session) return null; // will trigger 404
    return { ...session } as T;
  }

  // GET /sessions/{id} — return shallow copy to trigger React re-render on state changes
  const idMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})$/
  );
  if (method === "GET" && idMatch) {
    const session = findSessionById(idMatch[1]);
    if (!session) return null;
    return { ...session } as T;
  }

  // GET /sessions/{id}/questions
  const questionsMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/questions$/
  );
  if (method === "GET" && questionsMatch) {
    return (MOCK_QUESTIONS[questionsMatch[1]] || []) as T;
  }

  // GET /sessions/{id}/presence
  const presenceMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/presence$/
  );
  if (method === "GET" && presenceMatch) {
    const count = mockParticipantCount[presenceMatch[1]] || 0;
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
    return {
      id: generateId(),
      session_id: responseMatch[1],
      question_id: (payload?.question_id as string) || generateId(),
      participant_id: (payload?.participant_id as string) || generateId(),
      source: "text",
      char_count: ((payload?.raw_text as string) || "").length,
      language_code: (payload?.language_code as string) || "en",
      submitted_at: new Date().toISOString(),
      is_flagged: false,
      pii_detected: false,
      profanity_detected: false,
      clean_text: (payload?.raw_text as string) || "",
      heart_tokens_earned: 1,
      unity_tokens_earned: 5,
      response_hash: null,
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
    if (transitionMatch[2] === "poll" && session.polling_mode_type === "static_poll") {
      const days = session.static_poll_duration_days ?? 3;
      session.ends_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }
    if (transitionMatch[2] === "close") {
      session.closed_at = new Date().toISOString();
    }
    saveMockState();
    return { ...session } as T;
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
