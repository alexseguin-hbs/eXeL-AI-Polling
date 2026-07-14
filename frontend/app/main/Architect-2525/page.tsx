"use client";
// DIRECT access route — /main/Architect-2525 (Vision 2525 · Architect-2525, autonomous build 2026-07-14).
// Not Easter-egg gated: linked from the launcher (ARCHITECT-2525 tile) and lands on the OVERVIEW tab.
// Aliases: /Architect-2525 and /Architect/2525 (same component, same initialTab) — static-exported.
import { ArchitectCommandUX1 } from "@/components/architect-2525/command-ux1";
export default function Page() {
  return <ArchitectCommandUX1 initialTab="OVERVIEW" />;
}
