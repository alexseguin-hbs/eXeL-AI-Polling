"use client";
// DIRECT access route — /main/Security-2525 (P1.2, Thought Master 2026-07-09).
// Not Easter-egg gated: linked from the landing page and lands directly on the
// SECURITY-2525 Mission Planning section with the PLANNING tab highlighted.
// Alias of /Security/2525 (same component, same initialTab) — static-exported.
import { SecurityCommandUX1 } from "@/components/security-2525/command-ux1";
export default function Page() {
  return <SecurityCommandUX1 initialTab="PLANNING" />;
}
