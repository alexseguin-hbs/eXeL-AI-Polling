"use client";
// Canonical lowercase route — /architect-2525 (matches /financial-2525, /drone-2525, /vision-2525). Same component
// + initialTab as the capital aliases (/Architect-2525, /main/Architect-2525). The feedback lives at /architect-2525/feedback.
import { ArchitectCommandUX1 } from "@/components/architect-2525/command-ux1";
export default function Page() {
  return <ArchitectCommandUX1 initialTab="OVERVIEW" />;
}
