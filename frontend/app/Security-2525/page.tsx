"use client";
// DIRECT access route — /Security-2525 (P1.3 FX-16, Thought Master 2026-07-09).
// The dash form the live URL uses: lands on SECURITY-2525 Mission Planning with
// the PLANNING tab highlighted. Aliases: /Security/2525 and /main/Security-2525.
import { SecurityCommandUX1 } from "@/components/security-2525/command-ux1";
export default function Page() {
  return <SecurityCommandUX1 initialTab="PLANNING" />;
}
