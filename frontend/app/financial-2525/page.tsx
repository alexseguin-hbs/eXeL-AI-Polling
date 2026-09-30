"use client";

// Financial-2525 — the MoT Financial System (operator 2026-09-30, v.000_r.001). One component, mounted here and at
// the CANONICAL address (operator addendum 15: "web site must be …/financial-2525"); /main/Financial-2525 is the alias (the two route bodies are identical, the Drone-2525 route pattern).
import { FinancialCommandUX1 } from "@/components/financial-2525/command-ux1";

export default function FinancialPage() {
  return <FinancialCommandUX1 />;
}
