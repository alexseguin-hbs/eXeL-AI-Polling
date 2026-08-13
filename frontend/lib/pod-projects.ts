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
