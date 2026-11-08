// ARCHITECT-2525 / FUTURE · state/authority-machine — Submit ≠ Review ≠ Approve ≠ build-ready (plan §13, FCRS-01/32/33).
// The ladder: DRAFT → SUBMITTED → REVIEWED → APPROVED → BUILD_READY. A person (authenticated or not) may submit and
// review; APPROVE / BUILD-READY / QUALIFY require an AUTHENTICATED human, enforced HERE (the reducer), not only in a UI
// helper, and ALSO on replay (rcore/replay). No AI/SYSTEM actor can ever reach APPROVED. Pure.
import type { ArchitectProjectV2 } from "../domain/project";
import type { ActorRef, AuthenticatedHumanActor } from "../domain/actors";
import type { ProjectQualification } from "../domain/ratings";
import type { PlanAuthority } from "../domain/project";
import { isAuthenticatedHuman } from "../domain/actors";

export interface AuthorityResult {
  project: ArchitectProjectV2;
  accepted: boolean;
  rejected_reason?: string;
}

function isHuman(a: ActorRef): boolean {
  return a != null && (a.kind === "AUTHENTICATED_HUMAN" || a.kind === "UNAUTHENTICATED_HUMAN");
}
function withAuthority(project: ArchitectProjectV2, plan: PlanAuthority, actor: ActorRef, now: string): ArchitectProjectV2 {
  return { ...project, authority: { plan, by: actor, at: now } };
}

/** DRAFT → SUBMITTED. A person may submit a draft; an AI/SYSTEM may not. */
export function submit(project: ArchitectProjectV2, actor: ActorRef, now = ""): AuthorityResult {
  if (!isHuman(actor)) return { project, accepted: false, rejected_reason: "only a person may submit a plan" };
  if (project.authority.plan !== "DRAFT") return { project, accepted: false, rejected_reason: `only a draft can be submitted (it is ${project.authority.plan.toLowerCase()})` };
  return { project: withAuthority(project, "SUBMITTED", actor, now), accepted: true };
}

/** SUBMITTED → REVIEWED. A person may review; an AI/SYSTEM may not. */
export function review(project: ArchitectProjectV2, actor: ActorRef, now = ""): AuthorityResult {
  if (!isHuman(actor)) return { project, accepted: false, rejected_reason: "only a person may review a plan" };
  if (project.authority.plan !== "SUBMITTED") return { project, accepted: false, rejected_reason: `a plan must be submitted before review (it is ${project.authority.plan.toLowerCase()})` };
  return { project: withAuthority(project, "REVIEWED", actor, now), accepted: true };
}

/** REVIEWED → APPROVED. REQUIRES an AUTHENTICATED human (T-ACTOR-AUTH); an AI/SYSTEM or unauthenticated person is rejected. */
export function approve(project: ArchitectProjectV2, actor: ActorRef, now = ""): AuthorityResult {
  if (!isAuthenticatedHuman(actor)) return { project, accepted: false, rejected_reason: "approval needs a signed-in person — the plan stays as it is" };
  if (project.authority.plan !== "REVIEWED") return { project, accepted: false, rejected_reason: `a plan must be reviewed before approval (it is ${project.authority.plan.toLowerCase()})` };
  return { project: withAuthority(project, "APPROVED", actor, now), accepted: true };
}

/** APPROVED → BUILD_READY. REQUIRES an AUTHENTICATED human. */
export function declareBuildReady(project: ArchitectProjectV2, actor: ActorRef, now = ""): AuthorityResult {
  if (!isAuthenticatedHuman(actor)) return { project, accepted: false, rejected_reason: "declaring build-ready needs a signed-in person" };
  if (project.authority.plan !== "APPROVED") return { project, accepted: false, rejected_reason: `a plan must be approved before build-ready (it is ${project.authority.plan.toLowerCase()})` };
  return { project: withAuthority(project, "BUILD_READY", actor, now), accepted: true };
}

export interface QualifyResult {
  qualification: ProjectQualification | null;
  accepted: boolean;
  rejected_reason?: string;
}
/**
 * Build a ProjectQualification. REQUIRES project-specific evidence AND an authenticated human (FCRS-31/32). A heuristic
 * score can never produce one: without evidence, or without an authenticated human, it is rejected (no qualification).
 */
export function qualify(label: string, qualifiedValue: string, evidence: string, actor: ActorRef, now = ""): QualifyResult {
  if (!isAuthenticatedHuman(actor)) return { qualification: null, accepted: false, rejected_reason: "qualifying needs a signed-in person" };
  if (!evidence || !evidence.trim()) return { qualification: null, accepted: false, rejected_reason: "a qualification needs project-specific evidence" };
  const by: AuthenticatedHumanActor = actor;
  return {
    qualification: { qualification_id: `qual-${now}`, label, qualified_value: qualifiedValue, qualification_evidence: evidence, qualified_by: by, qualified_at: now },
    accepted: true,
  };
}
