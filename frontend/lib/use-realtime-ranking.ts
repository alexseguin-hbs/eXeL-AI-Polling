"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * CRS-12.03 / CRS-17: Subscribe to Cube 7's live ranking broadcasts.
 *
 * The aggregator broadcasts three Supabase Broadcast events on the
 * `session:{short_code}` channel (see backend cube7_ranking):
 *   - `ranking_progress`  → {session_id, submissions, cycle_id} after each ballot
 *   - `ranking_complete`  → full aggregation contract (top theme, algorithm,
 *                            replay_hash, participant_count, …)
 *   - `ranking_override`  → a Lead/Developer governance override landed
 *
 * This hook only LISTENS — it never sends. That keeps it clear of the Trinity
 * Redundancy delivery paths (which own the `responses` channel), so a results
 * surface can subscribe to live ranking updates without touching sacred code.
 *
 * Degrades gracefully to a no-op when Supabase isn't configured. A results
 * surface should still fetch `GET /sessions/{id}/rankings` on mount for the
 * initial snapshot and use these events to stay live.
 */
export interface RankingProgressPayload {
  session_id: string;
  submissions: number;
  cycle_id: number;
}

export interface RankingCompletePayload {
  session_id: string;
  short_code: string;
  cycle_id: number;
  algorithm: string;
  participant_count: number;
  theme01_category: string | null;
  theme_level: string | null;
  top_theme2_id: string | null;
  top_theme2_label: string | null;
  replay_hash: string | null;
  anomaly_count: number;
  excluded_participants: string[];
  contract_version: string;
}

export function useRealtimeRanking(
  shortCode: string | null | undefined,
  handlers: {
    onProgress?: (payload: RankingProgressPayload) => void;
    onComplete?: (payload: RankingCompletePayload) => void;
    onOverride?: (payload: Record<string, unknown>) => void;
  },
) {
  const { onProgress, onComplete, onOverride } = handlers;

  useEffect(() => {
    if (!shortCode || !supabase) return;

    const channel = supabase.channel(`session:${shortCode}`);

    channel
      .on(
        "broadcast" as never,
        { event: "ranking_progress" },
        (msg: { payload: RankingProgressPayload }) => {
          if (onProgress && msg.payload) onProgress(msg.payload);
        },
      )
      .on(
        "broadcast" as never,
        { event: "ranking_complete" },
        (msg: { payload: RankingCompletePayload }) => {
          if (onComplete && msg.payload) onComplete(msg.payload);
        },
      )
      .on(
        "broadcast" as never,
        { event: "ranking_override" },
        (msg: { payload: Record<string, unknown> }) => {
          if (onOverride && msg.payload) onOverride(msg.payload);
        },
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [shortCode, onProgress, onComplete, onOverride]);
}
