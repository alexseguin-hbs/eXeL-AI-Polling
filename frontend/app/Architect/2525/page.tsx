"use client";
// Alias route — /Architect/2525 (shareable deep-link). Same component + initialTab as /main/Architect-2525.
import { ArchitectCommandUX1 } from "@/components/architect-2525/command-ux1";
export default function Page() {
  return <ArchitectCommandUX1 initialTab="OVERVIEW" />;
}
