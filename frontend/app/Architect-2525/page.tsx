"use client";
// CANONICAL route — /Architect-2525 (operator 2026-10-30: the old /main/Architect-2525/ address must post to /Architect-2525/; main
// should never be used anywhere"). The lowercase /architect-2525 301s here (public/_redirects); /Architect/2525 is an
// alias (same component, same initialTab); the Worker 301s /main/* → /*. The feedback lives at /architect-2525/feedback.
import { ArchitectCommandUX1 } from "@/components/architect-2525/command-ux1";
export default function Page() {
  return <ArchitectCommandUX1 initialTab="OVERVIEW" />;
}
