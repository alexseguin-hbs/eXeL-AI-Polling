// ARCHITECT-2525 / FUTURE · domain/actors — who did a thing, and what authority they carry (plan §13, FCRS-01/32/33).
// AI can never approve, qualify or declare build-ready. Approve/qualify/build-ready REQUIRE an authenticated human.
// Node strip-types: const-array + union, pure types only.

export const ACTOR_KINDS = ["AUTHENTICATED_HUMAN", "UNAUTHENTICATED_HUMAN", "SYSTEM"] as const;
export type ActorKind = (typeof ACTOR_KINDS)[number];

export interface AuthenticatedHumanActor {
  kind: "AUTHENTICATED_HUMAN";
  /** opaque identity token (e.g. an auth subject id) — never a display name. */
  id: string;
}
export interface UnauthenticatedHumanActor {
  kind: "UNAUTHENTICATED_HUMAN";
  /** a stable draft id so drafts are attributable without authentication. */
  id: string;
}
export interface SystemActor {
  kind: "SYSTEM";
  id: string;
}

export type ActorRef = AuthenticatedHumanActor | UnauthenticatedHumanActor | SystemActor;

/** A human actor (authenticated or not) — never SYSTEM/AI. Used where only a human may author (e.g. a design target). */
export type HumanActor = AuthenticatedHumanActor | UnauthenticatedHumanActor;

export const DRAFT_ACTOR: UnauthenticatedHumanActor = {
  kind: "UNAUTHENTICATED_HUMAN",
  id: "unauthenticated-human",
};

/** The gate for approve / qualify / build-ready / sign (plan §13, FCRS-01/32). */
export function isAuthenticatedHuman(a: ActorRef | null | undefined): a is AuthenticatedHumanActor {
  return !!a && a.kind === "AUTHENTICATED_HUMAN" && typeof a.id === "string" && a.id.length > 0;
}
