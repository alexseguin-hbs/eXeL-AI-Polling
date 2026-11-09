"use client";

/**
 * CRS-22.04 — the moderator's final decision on the winning theme, with transparency.
 *
 *   FinalDecisionBanner (moderator + participants): the adopted theme. When it is NOT the group's #1, it also shows
 *     the group's #1 and the moderator's stated reason — participants always see what the group chose.
 *   FinalDecisionForm (moderator): pick a theme from the group ranking; choosing anything but the group's #1
 *     requires a reason (the backend enforces ≥ 10 characters too). POST /sessions/{id}/rankings/decision; the
 *     backend stores it and broadcasts `final_decision` on session:{short_code}.
 * Every string via t().
 */
import { useMemo, useState } from "react";
import { Gavel, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LiveVoiceDictate } from "@/components/live-voice-dictate";
import { useLexicon } from "@/lib/lexicon-context";
import { api } from "@/lib/api";
import type { FinalDecision, LiveRankingSnapshot, RankingCompletePayload } from "@/lib/use-session-broadcast";

export const MIN_DECISION_REASON = 10;

/** The group's overall #1 from a ranking payload (snapshot group_top, ranking_complete top_theme2_id, else best row). */
export function groupTopOf(r: RankingCompletePayload | LiveRankingSnapshot | null): string | null {
  if (!r) return null;
  const snap = r as LiveRankingSnapshot;
  if (snap.group_top?.theme_id) return snap.group_top.theme_id;
  if (r.top_theme2_id) return r.top_theme2_id;
  const rows = Object.values(r.category_rankings ?? {}).flat();
  return rows.length ? [...rows].sort((a, b) => b.score - a.score)[0].theme_id : null;
}

/** Client-side mirror of the backend rule: a pick other than the group's #1 needs a reason. */
export function decisionError(pick: string | null, groupTop: string | null, reason: string): "pick" | "reason" | null {
  if (!pick) return "pick";
  if (pick !== groupTop && reason.trim().length < MIN_DECISION_REASON) return "reason";
  return null;
}

export function FinalDecisionBanner({ decision }: { decision: FinalDecision | null | undefined }) {
  const { t } = useLexicon();
  if (!decision?.final_theme_id) return null;
  return (
    <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/5 p-3 space-y-1" data-final-decision={decision.final_theme_id}>
      <p className="text-sm font-semibold flex items-center gap-2">
        <Gavel className="h-4 w-4 text-yellow-400" />
        {t("cube7.decision.adopted").replace("{0}", decision.final_theme_label ?? "")}
      </p>
      {decision.differs_from_group ? (
        <>
          <p className="text-xs" data-final-group-top={decision.group_top_theme_id ?? ""}>
            {t("cube7.decision.group_top").replace("{0}", decision.group_top_theme_label ?? "")}
          </p>
          <p className="text-xs text-muted-foreground" data-final-reason>
            {t("cube7.decision.reason_shown").replace("{0}", decision.reason ?? "")}
          </p>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">{t("cube7.decision.matches_group")}</p>
      )}
    </div>
  );
}

export function FinalDecisionForm({
  sessionId,
  ranking,
  onDecided,
}: {
  sessionId: string;
  ranking: RankingCompletePayload | LiveRankingSnapshot | null;
  onDecided: (snap: LiveRankingSnapshot) => void;
}) {
  const { t } = useLexicon();
  const rows = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(ranking?.category_rankings ?? {}).flat()
      .filter((r) => (seen.has(r.theme_id) ? false : (seen.add(r.theme_id), true)));
  }, [ranking]);
  const groupTop = groupTopOf(ranking);
  const [pick, setPick] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!rows.length) return null;
  const chosen = pick ?? groupTop;
  const problem = decisionError(chosen, groupTop, reason);

  const submit = async () => {
    if (problem || !chosen) return;
    setBusy(true);
    setError(null);
    try {
      const snap = await api.post<LiveRankingSnapshot>(`/sessions/${sessionId}/rankings/decision`, {
        theme_id: chosen,
        reason: reason.trim() || null,
      });
      if (snap) onDecided(snap);
    } catch (e) {
      setError((e as { detail?: string })?.detail || t("cube7.decision.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 space-y-2" data-final-decision-form>
      <p className="text-sm font-semibold flex items-center gap-2"><Gavel className="h-4 w-4" />{t("cube7.decision.title")}</p>
      <p className="text-[11px] text-muted-foreground">{t("cube7.decision.help")}</p>
      <select
        className="w-full rounded-md border bg-background px-2 py-1 text-sm"
        value={chosen ?? ""}
        onChange={(e) => setPick(e.target.value || null)}
        aria-label={t("cube7.decision.pick")}
      >
        {rows.map((r) => (
          <option key={r.theme_id} value={r.theme_id}>
            {r.theme_id === groupTop ? t("cube7.decision.option_top").replace("{0}", r.label) : r.label}
          </option>
        ))}
      </select>
      {chosen !== groupTop && (
        <div className="flex gap-2 items-start">
          <textarea
            className="w-full rounded-md border bg-background px-2 py-1 text-sm"
            rows={2}
            maxLength={2000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("cube7.decision.reason_placeholder")}
            aria-label={t("cube7.decision.reason_label")}
          />
          <LiveVoiceDictate
            sessionId={sessionId}
            role="moderator"
            value={reason}
            onChange={setReason}
            disabled={busy}
            size="icon"
          />
        </div>
      )}
      {problem === "reason" && <p className="text-[11px] text-yellow-400">{t("cube7.decision.reason_required")}</p>}
      {error && <p className="text-[11px] text-red-400">{error}</p>}
      <Button size="sm" onClick={submit} disabled={!!problem || busy}>
        {busy && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
        {t("cube7.decision.submit")}
      </Button>
    </div>
  );
}
