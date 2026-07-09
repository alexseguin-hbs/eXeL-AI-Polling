"use client";
// Shareable deep-link — /Security/2525 lands directly on the SECURITY-2525 Mission Planning
// section (PLANNING tab). Mirrors the Atlantis-Accords readable-route pattern; static-exported
// (output: 'export') so Cloudflare Workers serves it with no dynamic route needed.
import { SecurityCommandUX1 } from "@/components/security-2525/command-ux1";
export default function Page() {
  return <SecurityCommandUX1 initialTab="PLANNING" />;
}
