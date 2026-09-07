/**
 * The pod's phases as one table (RCORE_LANES shape) — label, glyph, what the phase earns. Colour comes
 * from the theme (lib/theme-hue.ts), never from here: one scheme, the moderator's.
 * The rail, the explainer line and the phone strip all read from here, never from prose.
 */
export type PodPhaseKey = "compose" | "invite" | "sync" | "active" | "record" | "audit" | "closed";
export interface PodPhaseDef { key: PodPhaseKey; labelKey: string; earnsKey: string; glyph: "◬" | "♡" | "웃" }

export const POD_PHASES: PodPhaseDef[] = [
  { key: "compose", labelKey: "soi.pod.phase.compose", earnsKey: "soi.pod.earns.compose", glyph: "◬" },
  { key: "invite",  labelKey: "soi.pod.phase.invite",  earnsKey: "soi.pod.earns.invite", glyph: "◬" },
  { key: "sync",    labelKey: "soi.pod.phase.sync",    earnsKey: "soi.pod.earns.sync", glyph: "♡" },
  { key: "active",  labelKey: "soi.pod.phase.active",  earnsKey: "soi.pod.earns.active", glyph: "♡" },
  { key: "record",  labelKey: "soi.pod.phase.record",  earnsKey: "soi.pod.earns.record", glyph: "♡" },
  { key: "audit",   labelKey: "soi.pod.phase.audit",   earnsKey: "soi.pod.earns.audit", glyph: "웃" },
  { key: "closed",  labelKey: "soi.pod.phase.closed",  earnsKey: "soi.pod.earns.closed", glyph: "웃" },
];
export const phaseIndex = (k: string): number => POD_PHASES.findIndex((p) => p.key === k);
