"use client";
// Review route — direct access to the SECURITY-2525 command UX for UX review.
// Lands on OVERVIEW; click PLANNING to reach Mission Planning. Not linked in nav.
import { SecurityCommandUX1 } from "@/components/security-2525/command-ux1";
export default function Page() {
  return <SecurityCommandUX1 />;
}
