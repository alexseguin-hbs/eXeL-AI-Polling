"use client";

// Financial-2525 — the MoT Financial System (operator 2026-09-30, v.000_r.001). One component, mounted here and at
// /financial-2525 (the two route bodies are identical, the Drone-2525 route pattern).
import { FinancialCommandUX1 } from "@/components/financial-2525/command-ux1";

export default function FinancialPage() {
  return <FinancialCommandUX1 />;
}
