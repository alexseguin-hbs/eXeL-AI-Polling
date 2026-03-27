/**
 * Supabase DB sync — globally-consistent session status store.
 *
 * Uses Supabase REST API (HTTP, not WebSocket) so it works even when
 * Supabase Realtime is flaky. This is Layer 4 of the sync stack:
 *   1. Supabase Broadcast (WebSocket, ~50ms)
 *   2. Supabase Presence  (WebSocket, persists for late joiners)
 *   3. CF KV 1s poll      (requires KV binding in CF Pages)
 *   4. Supabase DB 1s poll (THIS FILE — HTTP REST, no CF KV required)
 *
 * Requires a one-time table setup in Supabase SQL editor:
 *   supabase/session_status.sql
 *
 * If the table doesn't exist, all calls silently no-op — other layers cover it.
 */

import { supabase } from "@/lib/supabase";

const TABLE = "session_status";

/**
 * Write session status to Supabase DB.
 * Called by the moderator after every state transition.
 * Fire-and-forget — never throws.
 */
export async function syncStatusToSupabase(
  code: string,
  status: string,
  participantCount: number,
): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from(TABLE).upsert(
      {
        code: code.toUpperCase(),
        status,
        participant_count: participantCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" },
    );
  } catch {
    // Table not created yet, or Supabase down — silent, other layers cover it
  }
}

/**
 * Read session status from Supabase DB.
 * Called by the phone's 1s fallback poll while in the waiting lobby.
 * Returns null on any error — never throws.
 */
export async function fetchStatusFromSupabase(
  code: string,
): Promise<{ status: string; participant_count: number } | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("status, participant_count")
      .eq("code", code.toUpperCase())
      .maybeSingle();
    if (error || !data) return null;
    return data as { status: string; participant_count: number };
  } catch {
    return null;
  }
}
