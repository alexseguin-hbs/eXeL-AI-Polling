"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Supabase Realtime Broadcast — instant push-based session sync.
 *
 * Unlike KV polling (HTTP GET every 1.5s), Broadcast uses WebSocket push
 * so all 100+ participants receive status changes within ~50ms of the
 * moderator clicking "Start Polling".
 *
 * No database tables required — pure pub/sub via Supabase Realtime.
 *
 * Channel name: `session:<SHORT_CODE>` (shared by moderator + all participants)
 *
 * Events:
 *   "status"         — session status changed (open, polling, ranking, closed)
 *   "presence"       — participant count update
 *   "session"        — full session metadata sync
 *   "session_update" — session update broadcast
 *   "new_response"   — live response from participant
 *   "summary_ready"  — AI summary for a response (Cube 6 Phase A)
 *   "themes_ready"   — full theming pipeline complete (Cube 6 Phase B)
 *   "theme_change"   — moderator changed session color scheme
 */

export interface SessionBroadcastPayload {
  status?: string;
  participant_count?: number;
  ends_at?: string | null;
  question_text?: string | null;
  sessionCode?: string;
  [key: string]: unknown;
}

export interface NewResponsePayload {
  id?: string;
  text: string;
  clean_text?: string;
  submitted_at?: string;
  summary_33?: string;
  count: number;
}

export interface SummaryReadyPayload {
  response_id?: string;
  summary_33?: string;
  cost_usd?: number;
}

export interface ThemesReadyPayload {
  session_id?: string;
  theme_count?: number;
  total_responses?: number;
  replay_hash?: string;
  duration_sec?: number;
}

export interface ThemeChangePayload {
  theme_id?: string;
}

export interface SessionBroadcastCallbacks {
  onStatusChange?: (payload: SessionBroadcastPayload) => void;
  onPresenceChange?: (count: number) => void;
  onNewResponse?: (payload: NewResponsePayload) => void;
  onSummaryReady?: (payload: SummaryReadyPayload) => void;
  onThemesReady?: (payload: ThemesReadyPayload) => void;
  onThemeChange?: (payload: ThemeChangePayload) => void;
}

/**
 * Subscribe to real-time session broadcasts for a given short_code.
 * Returns a `broadcast` function for the moderator to push updates.
 *
 * Uses refs for all callbacks so the channel is NOT torn down and recreated
 * when callback references change — only when shortCode changes.
 */
export function useSessionBroadcast(
  shortCode: string | null | undefined,
  onStatusChange?: (payload: SessionBroadcastPayload) => void,
  onPresenceChange?: (count: number) => void,
  onNewResponse?: (payload: NewResponsePayload) => void,
  onSummaryReady?: (payload: SummaryReadyPayload) => void,
  onThemesReady?: (payload: ThemesReadyPayload) => void,
  onThemeChange?: (payload: ThemeChangePayload) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [connected, setConnected] = useState(false);

  // Store callbacks in refs so channel subscription doesn't re-create
  // every time a callback reference changes (prevents channel thrashing)
  const onStatusChangeRef = useRef(onStatusChange);
  onStatusChangeRef.current = onStatusChange;
  const onPresenceChangeRef = useRef(onPresenceChange);
  onPresenceChangeRef.current = onPresenceChange;
  const onNewResponseRef = useRef(onNewResponse);
  onNewResponseRef.current = onNewResponse;
  const onSummaryReadyRef = useRef(onSummaryReady);
  onSummaryReadyRef.current = onSummaryReady;
  const onThemesReadyRef = useRef(onThemesReady);
  onThemesReadyRef.current = onThemesReady;
  const onThemeChangeRef = useRef(onThemeChange);
  onThemeChangeRef.current = onThemeChange;

  useEffect(() => {
    if (!shortCode || !supabase) return;

    const channel = supabase.channel(`session:${shortCode}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "status" }, ({ payload }) => {
        onStatusChangeRef.current?.(payload as SessionBroadcastPayload);
      })
      .on("broadcast", { event: "presence" }, ({ payload }) => {
        const count = (payload as SessionBroadcastPayload)?.participant_count;
        if (typeof count === "number") {
          onPresenceChangeRef.current?.(count);
        }
      })
      .on("broadcast", { event: "session" }, ({ payload }) => {
        onStatusChangeRef.current?.(payload as SessionBroadcastPayload);
      })
      .on("broadcast", { event: "session_update" }, ({ payload }) => {
        onStatusChangeRef.current?.(payload as SessionBroadcastPayload);
      })
      .on("broadcast", { event: "new_response" }, ({ payload }) => {
        onNewResponseRef.current?.(payload as NewResponsePayload);
      })
      .on("broadcast", { event: "summary_ready" }, ({ payload }) => {
        onSummaryReadyRef.current?.(payload as SummaryReadyPayload);
      })
      .on("broadcast", { event: "themes_ready" }, ({ payload }) => {
        onThemesReadyRef.current?.(payload as ThemesReadyPayload);
      })
      .on("broadcast", { event: "theme_change" }, ({ payload }) => {
        onThemeChangeRef.current?.(payload as ThemeChangePayload);
      })
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase?.removeChannel(channel);
      channelRef.current = null;
      setConnected(false);
    };
  }, [shortCode]); // Only re-subscribe when shortCode changes — callbacks use refs

  /**
   * Broadcast a session update to all subscribers on this channel.
   * Called by the moderator after a state transition.
   */
  const broadcast = useCallback(
    async (event: "status" | "presence" | "session" | "session_update" | "new_response", payload: SessionBroadcastPayload | NewResponsePayload) => {
      const channel = channelRef.current;
      if (!channel) return;
      await channel.send({
        type: "broadcast",
        event,
        payload,
      });
      // Persist polling/ranking state in Presence so late-joining phones receive it on sync
      if (event === "status" || event === "session_update") {
        const p = payload as SessionBroadcastPayload;
        if (p.status === "polling" || p.status === "ranking") {
          channel.track({ status: p.status, ts: Date.now() }).catch(() => {});
        }
      }
    },
    [],
  );

  return { broadcast, connected };
}
