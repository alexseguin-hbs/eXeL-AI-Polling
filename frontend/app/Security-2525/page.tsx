"use client";
// DIRECT access route — /Security-2525 (P1.3 FX-16, Thought Master 2026-07-09).
// The dash form the live URL uses: lands on SECURITY-2525 Mission Planning with
// the PLANNING tab highlighted. Alias: /Security/2525 (R5: the old /main/Security-2525 address is 301'd here by the Worker).
import { SecurityCommandUX1 } from "@/components/security-2525/command-ux1";
export default function Page() {
  return <SecurityCommandUX1 initialTab="PLANNING" />;
}
