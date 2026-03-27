"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface RealtimePayload {
  table: string;
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

/**
 * Hook to subscribe to real-time session updates via WebSocket.
 * Connects to the backend WebSocket relay that bridges Supabase Realtime.
 */
export function useRealtimeSession(sessionCode: string | null) {
  const [liveResponses, setLiveResponses] = useState<RealtimePayload[]>([]);
  const [liveThemes, setLiveThemes] = useState<RealtimePayload[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const clearData = useCallback(() => {
    setLiveResponses([]);
    setLiveThemes([]);
  }, []);

  useEffect(() => {
    if (!sessionCode) return;

    const wsUrl =
      process.env.NEXT_PUBLIC_WS_URL ||
      (typeof window !== "undefined"
        ? `wss://${window.location.host}`
        : "ws://localhost:8000");

    const socket = new WebSocket(`${wsUrl}/ws/session/${sessionCode}`);
    wsRef.current = socket;

    socket.onopen = () => setConnected(true);
    socket.onclose = () => setConnected(false);
    socket.onerror = () => setConnected(false);

    socket.onmessage = (event) => {
      try {
        const data: RealtimePayload = JSON.parse(event.data);
        if (data.table === "responses") {
          setLiveResponses((prev) => [...prev, data]);
        } else if (data.table === "themes") {
          setLiveThemes((prev) => [...prev, data]);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    return () => {
      socket.close();
      wsRef.current = null;
      setConnected(false);
    };
  }, [sessionCode]);

  return { liveResponses, liveThemes, connected, clearData };
}
