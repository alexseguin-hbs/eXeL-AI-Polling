import type {
  Session,
  Participant,
  Question,
  SessionJoinResponse,
  PaginatedResponse,
} from "./types";

// ── Test Moderator ──────────────────────────────────────────────
export const MOCK_MODERATOR_ID = "google-oauth2|mock-moderator-001";

// ── Test Sessions ───────────────────────────────────────────────
const now = new Date().toISOString();
const oneHourLater = new Date(Date.now() + 3600000).toISOString();

export const MOCK_SESSIONS: Session[] = [
  {
    id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
    short_code: "12345678",
    created_by: MOCK_MODERATOR_ID,
    status: "open",
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
];

// ── Test Questions ──────────────────────────────────────────────
export const MOCK_QUESTIONS: Record<string, Question[]> = {
  "a1b2c3d4-e5f6-7890-abcd-111111111111": [
    {
      id: "q1-111111",
      session_id: "a1b2c3d4-e5f6-7890-abcd-111111111111",
      question_text:
        "What is the single most important feature we should build next?",
      question_number: 1,
      is_active: true,
      created_at: now,
    },
  ],
};

// ── Mock Participant Counter ────────────────────────────────────
let mockParticipantCount: Record<string, number> = {
  "a1b2c3d4-e5f6-7890-abcd-111111111111": 3,
  "b2c3d4e5-f6a7-8901-bcde-222222222222": 0,
  "c3d4e5f6-a7b8-9012-cdef-333333333333": 47,
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
  // GET /sessions (list)
  if (method === "GET" && path === "/sessions") {
    return {
      items: MOCK_SESSIONS,
      total: MOCK_SESSIONS.length,
      limit: 50,
      offset: 0,
    } as T;
  }

  // POST /sessions (create)
  if (method === "POST" && path === "/sessions") {
    const payload = body as Record<string, unknown>;
    sessionCounter++;
    const newSession: Session = {
      id: generateId(),
      short_code: generateShortCode(),
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
      polling_mode_type: "live_interactive",
      static_poll_duration_days: null,
      is_paid: false,
      qr_url: null,
      join_url: `${typeof window !== "undefined" ? window.location.origin : ""}/join/?code=${generateShortCode()}`,
      opened_at: null,
      closed_at: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participant_count: 0,
    } as Session;
    MOCK_SESSIONS.unshift(newSession);
    mockParticipantCount[newSession.id] = 0;
    return newSession as T;
  }

  // GET /sessions/code/{code}
  const codeMatch = path.match(/^\/sessions\/code\/(.+)$/);
  if (method === "GET" && codeMatch) {
    const session = findSessionByCode(codeMatch[1]);
    if (!session) return null; // will trigger 404
    return session as T;
  }

  // GET /sessions/{id}
  const idMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})$/
  );
  if (method === "GET" && idMatch) {
    const session = findSessionById(idMatch[1]);
    if (!session) return null;
    return session as T;
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
    // Simulate slowly growing participant count
    if (findSessionById(presenceMatch[1])?.status === "open") {
      mockParticipantCount[presenceMatch[1]] = count + Math.floor(Math.random() * 2);
    }
    return {
      session_id: presenceMatch[1],
      active_count: mockParticipantCount[presenceMatch[1]] || count,
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
    return {
      session_id: session.id,
      participant_id: participantId,
      short_code: session.short_code,
      title: session.title,
      status: session.status,
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

  // State transitions: open, poll, rank, close, archive
  const transitionMatch = path.match(
    /^\/sessions\/([0-9a-f-]{36})\/(open|poll|rank|close|archive)$/
  );
  if (method === "POST" && transitionMatch) {
    const session = findSessionById(transitionMatch[1]);
    if (!session) return null;
    const stateMap: Record<string, string> = {
      open: "open",
      poll: "polling",
      rank: "ranking",
      close: "closed",
      archive: "archived",
    };
    session.status = stateMap[transitionMatch[2]] as Session["status"];
    session.updated_at = new Date().toISOString();
    if (transitionMatch[2] === "open") {
      session.opened_at = new Date().toISOString();
    }
    if (transitionMatch[2] === "close") {
      session.closed_at = new Date().toISOString();
    }
    return session as T;
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
