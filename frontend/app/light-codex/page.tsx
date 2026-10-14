"use client";

/**
 * /light-codex — direct entry to the Light Codex cube (encode/decode images).
 *
 * Available to anyone with the link (the tool itself hides messages in plain
 * sight, so the page is public); the Settings entry stays Easter-egg gated.
 * Closing returns to the homepage.
 *
 * R-CORE (DD-55, operator 2026-10-14: "each innovation project gets its own rcore panel
 * (drone, security, light codex, Vision-2525, etc)"; asked which Light Codex he meant,
 * "The /light-codex world" — this route, not the comms module inside the Drone deck).
 * The badge is mounted on the PAGE SHELL, below the cube, and not inside LightCodexCube:
 * the cube renders through createPortal into document.body as a full-screen modal
 * (light-codex-cube.tsx:320), so a badge inside it would be an overlay on the tool —
 * exactly what the shared rule forbids (rcore-revisions.test.mjs:107, operator 2026-09-25).
 * Accent #e879f9 is the colour this world already carries on the Vision-2525 worlds page.
 */

import { useMemo } from "react";
import { LightCodexCube } from "@/components/light-codex-cube";
import { RCoreBadge } from "@/components/2525-core/rcore-badge"; // R-CORE · version-history badge (bottom-centre, two-click)
import { fromLedgerJson } from "@/lib/2525-core/revisions";
import { LIGHT_CODEX_LEDGER } from "@/lib/2525-core/light-codex-ledger.gen"; // Light Codex append-only traceability ledger

export default function LightCodexPage() {
  const history = useMemo(() => fromLedgerJson(LIGHT_CODEX_LEDGER), []);
  return (
    <div className="min-h-screen bg-[#07090c]">
      <LightCodexCube
        onClose={() => {
          if (typeof window !== "undefined") window.location.href = "/";
        }}
      />
      {/* Mounted LAST, in normal flow at the bottom of the page — never a fixed overlay on the cube. */}
      <RCoreBadge history={history} accent="#e879f9" />
    </div>
  );
}
