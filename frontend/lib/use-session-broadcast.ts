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
 *   "status"     — session status changed (open, polling, ranking, closed)
 *   "presence"   — participant count update
 *   "session"    — full session metadata sync
 */

export interface SessionBroadcastPayload {
  status?: string;
  participant_count?: number;
  ends_at?: string | null;
  question_text?: string | null;
  [key: string]: unknown;
}

/**
 * Subscribe to real-time session broadcasts for a given short_code.
 * Returns a `broadcast` function for the moderator to push updates.
 */
export function useSessionBroadcast(
  shortCode: string | null | undefined,
  onStatusChange?: (payload: SessionBroadcastPayload) => void,
  onPresenceChange?: (count: number) => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!shortCode || !supabase) return;

    const channel = supabase.channel(`session:${shortCode}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "status" }, ({ payload }) => {
        onStatusChange?.(payload as SessionBroadcastPayload);
      })
      .on("broadcast", { event: "presence" }, ({ payload }) => {
        const count = (payload as SessionBroadcastPayload)?.participant_count;
        if (typeof count === "number") {
          onPresenceChange?.(count);
        }
      })
      .on("broadcast", { event: "session" }, ({ payload }) => {
        onStatusChange?.(payload as SessionBroadcastPayload);
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
  }, [shortCode, onStatusChange, onPresenceChange]);

  /**
   * Broadcast a session update to all subscribers on this channel.
   * Called by the moderator after a state transition.
   */
  const broadcast = useCallback(
    async (event: "status" | "presence" | "session", payload: SessionBroadcastPayload) => {
      const channel = channelRef.current;
      if (!channel) return;
      await channel.send({
        type: "broadcast",
        event,
        payload,
      });
    },
    [],
  );

  return { broadcast, connected };
}
