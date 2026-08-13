/**
 * POD projects & default tasks (Vision 2525 · Task • Outcome).
 * ===========================================================
 * The POD working session starts from a small, concrete list. Three default
 * Domain-Play projects, each with three ready-made tasks, plus a volunteer item
 * that lets the pod brainstorm a task not on the list. "+ New Project" lets a
 * lead register another Domain Play.
 *
 * Learnings folded in (operator): the Polling session's QR-join + consensus
 * mechanics and the Security-2525 gate discipline. Tasks are phrased as an
 * intent + a measurable outcome so a pod can adopt one and go.
 */

export interface PodTask {
  id: string;
  title: string;
  outcome: string;      // the measurable "done" for this task
}

export interface PodProject {
  id: string;
  name: string;
  blurb: string;
  tasks: PodTask[];
}

/** The volunteer/brainstorm item every project carries — the pod writes its own. */
export const BRAINSTORM_TASK: PodTask = {
  id: "brainstorm",
  title: "Brainstorm a task not on this list",
  outcome: "The pod agrees one new intent + a measurable outcome, together.",
};

export const DEFAULT_PROJECTS: PodProject[] = [
  {
    id: "architect-2525",
    name: "Architect-2525",
    blurb: "Design, model, and de-risk the built environment.",
    tasks: [
      { id: "arc-1", title: "Draft a modular building spec", outcome: "One spec slug validated against the baseline HAL, reviewed by all 3." },
      { id: "arc-2", title: "Validate a CAD / 3D model", outcome: "Model passes the baseline check with zero blocking defects." },
      { id: "arc-3", title: "Estimate cost & timeline", outcome: "P10 / P50 / P90 estimate produced and agreed by the pod." },
    ],
  },
  {
    id: "security-2525",
    name: "Security-2525",
    blurb: "Threat-model, audit, and harden a deployment.",
    tasks: [
      { id: "sec-1", title: "Threat-model a deployment", outcome: "Top-5 threats listed with a mitigation each, agreed by all 3." },
      { id: "sec-2", title: "Run an SSSES security pass", outcome: "Security pillar scored 0–100 with cited evidence for each finding." },
      { id: "sec-3", title: "Draft an incident-response playbook", outcome: "A runbook the pod can execute end-to-end, reviewed by all 3." },
    ],
  },
  {
    id: "manta-2525",
    name: "Manta-2525",
    blurb: "Plan and de-risk an autonomous drone mission.",
    tasks: [
      { id: "man-1", title: "Plan a survey mission", outcome: "A flight plan with waypoints + objective, agreed by the pod." },
      { id: "man-2", title: "Validate the safety envelope", outcome: "Flight-path safety envelope checked; no exceedances." },
      { id: "man-3", title: "Estimate mission cost & duration", outcome: "Cost + duration estimate produced and agreed by all 3." },
    ],
  },
];

/** Every project's task menu = its three defaults + the brainstorm item. */
export const projectTasks = (p: PodProject): PodTask[] => [...p.tasks, BRAINSTORM_TASK];

export const findProject = (id: string): PodProject | undefined =>
  DEFAULT_PROJECTS.find((p) => p.id === id);

/** How outcomes get recorded when the pod stops (operator's three ways). */
export type RecordMethod = "video" | "written" | "voice";
export const RECORD_METHODS: { id: RecordMethod; label: string; hint: string }[] = [
  { id: "video", label: "Video link", hint: "An unlisted YouTube link of the session outcome." },
  { id: "written", label: "Written", hint: "Type the outcome in words." },
  { id: "voice", label: "Voice → text", hint: "Speak it — the polling tool's voice-to-text captures it." },
];

/** The synchronized-start window: all pod members must start within this many seconds. */
export const SYNC_START_SECONDS = 15;

/**
 * POD is exactly three — the minimum that lets two people witness a third.
 * One lead + two invited. Fewer than three cannot cross-review; more than three
 * is a different instrument. (Living document: unit.witness, D5 two-tier anti-sybil.)
 */
export const POD_SIZE = 3;

/** The pod runs on free tools — nothing here needs a purchase to witness an outcome. */
export const FREE_TOOLS_NOTE =
  "The pod runs on free tools: the polling tool's voice-to-text, an unlisted video link, or plain text. " +
  "No purchase is needed to witness and record an outcome — the Seed is membership, not a paywall on contribution.";

/**
 * TOK-17 — the eight-step witnessed-hours evidence chain (POD of 3) that mints 웃.
 * Clock-in → cross-review. The last three steps (self-audit, cross-review, mint) are
 * what turn a finished task into evidence a settlement can stand on: no hour counts as
 * 웃 until the two other members have witnessed it. MoT records the actual minutes
 * separately from the 웃 that settle.
 */
export const EVIDENCE_CHAIN: { step: number; key: string; label: string; note: string }[] = [
  { step: 1, key: "clockin",     label: "Clock-in",         note: "All three lock one shared start time." },
  { step: 2, key: "intent",      label: "Intent + outcome", note: "One measurable outcome is declared before work begins." },
  { step: 3, key: "work",        label: "Work",             note: "The pod does the task together." },
  { step: 4, key: "clockout",    label: "Clock-out",        note: "Any member stops the session for all three." },
  { step: 5, key: "record",      label: "Record",           note: "The outcome is captured — video, written, or voice." },
  { step: 6, key: "selfaudit",   label: "Self-audit",       note: "Each member states their own hours and what they did." },
  { step: 7, key: "crossreview", label: "Cross-review",     note: "The other two witness each claim — a self-attestation alone counts for nothing." },
  { step: 8, key: "mint",        label: "Settle 웃",         note: "Witnessed hours × M settle as 웃 under the 9,999/yr ceiling; MoT keeps the actual minutes." },
];

/** TOK-26 — one ledger record, read four ways. The receipt a contribution leaves behind. */
export interface ReceiptArtefacts {
  transcript: string;   // what happened, in order
  portfolio: string;    // a profile blurb (Cube-6 33-word tier in production)
  governance: string;   // who witnessed, who signed, which AI-authority state
  settlement: string;   // the 웃 / ◬ that settle, under the ceiling, at the local rate
}

/** The 333-word (3 × 111) synthesis, in the three sections the operator asked for. */
export interface Synthesis333 {
  results: string;      // 111 — what the pod produced
  changed: string;      // 111 — what changed because of it
  next: string;         // 111 — what happens next
}
