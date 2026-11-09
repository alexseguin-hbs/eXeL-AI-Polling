/**
 * SensorFusion-2525 append-only work traceability (CRS-19.07–19.08, CRS-24.03, CRS-25.02, CRS-32.04).
 * ♡/◬ reuse Cube 5 / workflow.siTokens: ♡=ceil(minutes), ◬=5×♡, 웃=0 while HI unfunded.
 */
import { siTokens } from "./workflow";

/** Default unity multiplier from Cube 5 config (UNITY_HEART_MULTIPLIER=5). Do not invent. */
export const UNITY_HEART_MULTIPLIER = 5;

/** Login/join ♡ from Cube 5 LOGIN_HEART_TOKENS=1. */
export const LOGIN_HEART_TOKENS = 1;

export type WorkEventType =
  | "label_create"
  | "label_edit"
  | "correction"
  | "review_l2"
  | "class_merge"
  | "session_start"
  | "session_stop"
  | "class_reuse"
  | "class_create";

export type WorkEventDraft = {
  project_id: string;
  actor_uid: string;
  display_name?: string;
  is_anonymous?: boolean;
  picture_id?: string;
  label_id?: string;
  event_type: WorkEventType;
  class_id?: string;
  class_name?: string;
  before_box?: Record<string, unknown> | null;
  after_box?: Record<string, unknown> | null;
  at?: string;
  duration_ms?: number;
  time_entry_id?: string;
  /** When true (default for session_stop), derive ♡/◬ from duration_ms. */
  credit_time?: boolean;
};

export type WorkEventRow = WorkEventDraft & {
  delta_heart: number;
  delta_unity: number;
  delta_human: number;
};

/** ♡ from active seconds; ◬ = 5×♡; 웃 always 0 here (human_enabled=false). */
export function heartCreditFromSeconds(seconds: number): { heart: number; unity: number; human: number } {
  const heart = siTokens(seconds);
  return { heart, unity: heart * UNITY_HEART_MULTIPLIER, human: 0 };
}

export function heartCreditFromDurationMs(durationMs: number | undefined): { heart: number; unity: number; human: number } {
  if (!durationMs || durationMs <= 0) return { heart: 0, unity: 0, human: 0 };
  return heartCreditFromSeconds(durationMs / 1000);
}

export function loginJoinCredit(): { heart: number; unity: number; human: number } {
  return { heart: LOGIN_HEART_TOKENS, unity: LOGIN_HEART_TOKENS * UNITY_HEART_MULTIPLIER, human: 0 };
}

/** Build an append-only row. actor_uid must be auth.uid(); server trigger re-stamps. */
export function buildWorkEvent(draft: WorkEventDraft): WorkEventRow {
  const creditTime = draft.credit_time !== false && (draft.event_type === "session_stop" || (draft.duration_ms || 0) > 0);
  const tokens = creditTime ? heartCreditFromDurationMs(draft.duration_ms) : { heart: 0, unity: 0, human: 0 };
  if (draft.event_type === "session_start" && draft.credit_time === true) {
    const join = loginJoinCredit();
    return {
      ...draft,
      delta_heart: join.heart,
      delta_unity: join.unity,
      delta_human: 0,
      at: draft.at || new Date().toISOString(),
    };
  }
  return {
    ...draft,
    delta_heart: tokens.heart,
    delta_unity: tokens.unity,
    delta_human: 0,
    at: draft.at || new Date().toISOString(),
  };
}

/** CSV export header (CRS-32.04). */
export const WORK_EVENT_CSV_HEADER =
  "event_id,project_id,actor_uid,display_name,is_anonymous,picture_id,label_id,event_type,class_id,class_name,at,duration_ms,delta_heart,delta_unity,delta_human";

export function workEventsToCsv(
  rows: ReadonlyArray<
    WorkEventRow & { event_id?: string }
  >,
): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [WORK_EVENT_CSV_HEADER];
  for (const r of rows) {
    lines.push(
      [
        r.event_id || "",
        r.project_id,
        r.actor_uid,
        r.display_name || "",
        r.is_anonymous ? "true" : "false",
        r.picture_id || "",
        r.label_id || "",
        r.event_type,
        r.class_id || "",
        r.class_name || "",
        r.at || "",
        r.duration_ms ?? "",
        r.delta_heart,
        r.delta_unity,
        r.delta_human,
      ]
        .map(esc)
        .join(","),
    );
  }
  return lines.join("\n");
}
