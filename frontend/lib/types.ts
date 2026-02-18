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

export interface Participant {
  id: string;
  session_id: string;
  user_id: string | null;
  display_name: string | null;
  is_anonymous: boolean;
  language: string;
  joined_at: string;
  is_active: boolean;
  has_paid: boolean;
  results_opt_in: boolean;
}

export interface Question {
  id: string;
  session_id: string;
  question_text: string;
  question_number: number;
  is_active: boolean;
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
