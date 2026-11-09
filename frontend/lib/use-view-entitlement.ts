"use client";
// React hook over GET /sessions/{id}/view-entitlement — fail closed (LOCKED) until the server answers.
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { LOCKED, normalizeEntitlement, type ViewEntitlement } from "@/lib/view-entitlement";

export function useViewEntitlement(sessionId: string | null | undefined, refreshKey?: unknown): ViewEntitlement {
  const [ent, setEnt] = useState<ViewEntitlement>(LOCKED);
  useEffect(() => {
    if (!sessionId) { setEnt(LOCKED); return; }
    let cancelled = false;
    api.get<unknown>(`/sessions/${sessionId}/view-entitlement`)
      .then((r) => { if (!cancelled) setEnt(normalizeEntitlement(r)); })
      .catch(() => { if (!cancelled) setEnt(LOCKED); });
    return () => { cancelled = true; };
  }, [sessionId, refreshKey]);
  return ent;
}
