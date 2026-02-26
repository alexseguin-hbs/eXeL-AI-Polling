// Session types matching backend schemas
export type SessionStatus =
  | "draft"
  | "open"
  | "polling"
  | "ranking"
  | "closed"
  | "archived";

export type AnonymityMode = "identified" | "anonymous" | "pseudonymous";

export type CycleMode = "single" | "multi";

export type RankingMode = "auto" | "manual";

export type AIProvider = "openai" | "grok" | "gemini";

export type PricingTier = "free" | "moderator_paid" | "cost_split";

export type SessionType = "polling" | "peer_volunteer" | "team_collaboration";

export type PollingMode = "single_round" | "multi_round_deep_dive";

export type PollingModeType = "live_interactive" | "static_poll";

export type TimerDisplayMode = "day" | "flex" | "both";

export type Theme2VotingLevel = "theme2_9" | "theme2_6" | "theme2_3";

export interface Session {
  id: string;
  short_code: string;
  created_by: string;
  status: SessionStatus;
  title: string;
  description: string | null;
  anonymity_mode: AnonymityMode;
  cycle_mode: CycleMode;
  max_cycles: number;
  current_cycle: number;
  ranking_mode: RankingMode;
  language: string;
  max_response_length: number;
  ai_provider: AIProvider;
  // New Cube 1 fields
  session_type: SessionType;
  polling_mode: PollingMode;
  pricing_tier: PricingTier;
  max_participants: number | null;
  fee_amount_cents: number;
  cost_splitting_enabled: boolean;
  reward_enabled: boolean;
  reward_amount_cents: number;
  theme2_voting_level: Theme2VotingLevel;
  live_feed_enabled: boolean;
  polling_mode_type: PollingModeType;
  static_poll_duration_days: number | null;
  ends_at: string | null;
  timer_display_mode: TimerDisplayMode;
  // Existing fields
  is_paid: boolean;
  qr_url: string | null;
  join_url: string | null;
  opened_at: string | null;
  closed_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  participant_count: number;
}

export type PaymentStatus = "unpaid" | "paid" | "lead_exempt";

export interface Participant {
  id: string;
  session_id: string;
  user_id: string | null;
  display_name: string | null;
  device_type: string | null;
  language_code: string;
  results_opt_in: boolean;
  payment_status: PaymentStatus;
  joined_at: string;
  is_active: boolean;
}

export interface Question {
  id: string;
  session_id: string;
  cycle_id: number;
  question_text: string;
  order_index: number;
  status: string;
  created_at: string;
}

export interface User {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  roles: string[];
}

export interface SessionJoinResponse {
  session_id: string;
  participant_id: string;
  short_code: string;
  title: string;
  status: SessionStatus;
  display_name: string | null;
  theme_id: string;
  custom_accent_color: string | null;
  polling_mode_type: PollingModeType;
  ends_at: string | null;
  timer_display_mode: TimerDisplayMode;
}

// Cube 2 — Text response returned after submission (matches backend ResponseRead)
export interface TextResponseRead {
  id: string;
  session_id: string;
  question_id: string;
  participant_id: string;
  source: string;
  char_count: number;
  language_code: string;
  submitted_at: string;
  is_flagged: boolean;
  pii_detected: boolean;
  profanity_detected: boolean;
  clean_text: string | null;
  heart_tokens_earned: number;
  unity_tokens_earned: number;
  response_hash: string | null;
}

// Cube 3 — Voice response returned after submission (matches backend VoiceSubmissionRead)
export interface VoiceSubmissionRead {
  id: string;
  session_id: string;
  question_id: string;
  participant_id: string;
  source: "voice";
  char_count: number;
  language_code: string;
  submitted_at: string;
  is_flagged: boolean;
  audio_duration_sec: number;
  stt_provider: string;
  transcript_text: string;
  transcript_confidence: number;
  pii_detected: boolean;
  profanity_detected: boolean;
  clean_text: string | null;
  heart_tokens_earned: number;
  unity_tokens_earned: number;
  response_hash: string | null;
}

// ── Flower of Life Theme Visualization Types ────────────────────

export type Theme01Label =
  | "Risk & Concerns"
  | "Supporting Comments"
  | "Neutral Comments";

export interface ThemeInfo {
  label: string;
  count: number;
  avgConfidence: number;
  summary33: string;
}

export interface ThemedResponse {
  id: string;
  userHash: string;
  rawText: string;
  summary33: string;
  summary111: string;
  summary333: string;
  theme1: Theme01Label;
  theme1Confidence: number;
  theme2_9: string;
  theme2_6: string;
  theme2_3: string;
  theme2Confidence: number;
}

export interface SessionThemeData {
  sessionId: string;
  totalResponses: number;
  theme1: Record<Theme01Label, ThemeInfo>;
  theme2: Record<
    Theme01Label,
    {
      level3: ThemeInfo[];
      level6: ThemeInfo[];
      level9: ThemeInfo[];
    }
  >;
  responses: ThemedResponse[];
}

// ── Simulation Theme Type (used by Cube 7 ranking + Cube 10 SIM) ──

export interface SimTheme {
  id: string;
  name: string;
  confidence: number;
  responseCount: number;
  color: string;
  icon: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
