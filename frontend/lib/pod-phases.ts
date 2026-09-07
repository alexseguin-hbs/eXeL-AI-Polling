/**
 * The pod's phases as one table (RCORE_LANES shape) — label, colour, what the phase earns.
 * The rail, the explainer line and the phone strip all read from here, never from prose.
 */
import { TRINITY_COLORS } from "@/lib/trinity-palette";

export type PodPhaseKey = "compose" | "invite" | "sync" | "active" | "record" | "audit" | "closed";
export interface PodPhaseDef { key: PodPhaseKey; labelKey: string; earnsKey: string; color: string }

export const POD_PHASES: PodPhaseDef[] = [
  { key: "compose", labelKey: "soi.pod.phase.compose", earnsKey: "soi.pod.earns.compose", color: TRINITY_COLORS.consciousness },
  { key: "invite",  labelKey: "soi.pod.phase.invite",  earnsKey: "soi.pod.earns.invite",  color: TRINITY_COLORS.consciousness },
  { key: "sync",    labelKey: "soi.pod.phase.sync",    earnsKey: "soi.pod.earns.sync",    color: TRINITY_COLORS.temporal },
  { key: "active",  labelKey: "soi.pod.phase.active",  earnsKey: "soi.pod.earns.active",  color: TRINITY_COLORS.temporal },
  { key: "record",  labelKey: "soi.pod.phase.record",  earnsKey: "soi.pod.earns.record",  color: TRINITY_COLORS.temporal },
  { key: "audit",   labelKey: "soi.pod.phase.audit",   earnsKey: "soi.pod.earns.audit",   color: TRINITY_COLORS.family },
  { key: "closed",  labelKey: "soi.pod.phase.closed",  earnsKey: "soi.pod.earns.closed",  color: TRINITY_COLORS.family },
];
export const phaseIndex = (k: string): number => POD_PHASES.findIndex((p) => p.key === k);
