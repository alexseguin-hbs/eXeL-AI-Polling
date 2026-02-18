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
    max_response_length: 500,
    ai_provider: "openai",
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
    max_response_length: 500,
    ai_provider: "openai",
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
    title: "UX Research Session #4",
    description: "Completed user experience feedback session.",
    anonymity_mode: "pseudonymous",
    cycle_mode: "single",
    max_cycles: 1,
    current_cycle: 1,
    ranking_mode: "auto",
    language: "en",
    max_response_length: 500,
    ai_provider: "openai",
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
      max_response_length: 500,
      ai_provider: "openai",
      is_paid: false,
      qr_url: null,
      join_url: null,
      opened_at: null,
      closed_at: null,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      participant_count: 0,
    };
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
    return { id: generateId(), status: "submitted" } as T;
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
