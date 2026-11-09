/**
 * SensorFusion-2525 anonymous display seats (CRS-05.04, CRS-24.03).
 * Uses Supabase anonymous auth uid + unique canonical display name per project.
 * Authorization always keys off uid — display names are non-authoritative.
 */
import { sameMember } from "./workflow";

export const SF_SEAT_KEYS = {
  anonymousChoose: "sf.seat.anonymous_choose",
  displayName: "sf.seat.display_name",
  nameTaken: "sf.seat.name_taken",
  oauthOptional: "sf.seat.oauth_optional",
  joinFailed: "sf.seat.join_failed",
  tokensHud: "sf.tokens.hud",
} as const;

export type SeatJoinInput = {
  projectId: string;
  displayName: string;
  isAnonymous: boolean;
};

export type SeatJoinResult =
  | { ok: true; member_id: string; display_name: string; is_anonymous: boolean; already: boolean }
  | { ok: false; reason: "missing_name" | "name_taken" | "no_session" | "rpc_error"; detail?: string };

/** Client-side pre-check before calling sensor_fusion_join_seat. */
export function validateSeatName(
  displayName: string,
  takenNames: readonly string[],
): { ok: true; name: string } | { ok: false; reason: "missing_name" | "name_taken" } {
  const name = (displayName || "").trim();
  if (!name) return { ok: false, reason: "missing_name" };
  if (takenNames.some((t) => sameMember(t, name))) return { ok: false, reason: "name_taken" };
  return { ok: true, name };
}

/**
 * Join path (browser):
 * 1) supabase.auth.signInAnonymously() when isAnonymous and no session
 * 2) rpc('sensor_fusion_join_seat', { p_project_id, p_display_name, p_is_anonymous })
 * Pure helper here builds the RPC args; I/O stays in the caller.
 */
export function joinSeatRpcArgs(input: SeatJoinInput): {
  p_project_id: string;
  p_display_name: string;
  p_is_anonymous: boolean;
} {
  return {
    p_project_id: input.projectId,
    p_display_name: input.displayName.trim(),
    p_is_anonymous: Boolean(input.isAnonymous),
  };
}

export function parseJoinSeatPayload(data: unknown): SeatJoinResult {
  if (!data || typeof data !== "object") return { ok: false, reason: "rpc_error", detail: "empty" };
  const row = data as Record<string, unknown>;
  if (row.ok !== true || !row.member_id) return { ok: false, reason: "rpc_error", detail: "not_ok" };
  return {
    ok: true,
    member_id: String(row.member_id),
    display_name: String(row.display_name || ""),
    is_anonymous: Boolean(row.is_anonymous),
    already: Boolean(row.already),
  };
}
