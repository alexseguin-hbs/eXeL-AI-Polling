"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Subscribe to Supabase Realtime for session status changes.
 * When the session row is updated (e.g. draft→open, open→polling),
 * the callback fires with the new status so the UI can auto-advance.
 *
 * Falls back gracefully to no-op if Supabase is not configured or
 * the sessions table doesn't exist yet.
 */
export function useRealtimeStatus(
  shortCode: string | null | undefined,
  onStatusChange: (newStatus: string, payload: Record<string, unknown>) => void,
) {
  useEffect(() => {
    if (!shortCode || !supabase) return;

    const channel = supabase.channel(`session-status:${shortCode}`);

    channel
      .on(
        "postgres_changes" as never,
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `short_code=eq.${shortCode}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const newStatus = payload.new?.status;
          if (typeof newStatus === "string") {
            onStatusChange(newStatus, payload.new);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shortCode, onStatusChange]);
}
