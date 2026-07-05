"use client";

/**
 * /light-codex — direct entry to the Light Codex cube (encode/decode images).
 *
 * Available to anyone with the link (the tool itself hides messages in plain
 * sight, so the page is public); the Settings entry stays Easter-egg gated.
 * Closing returns to the homepage.
 */

import { LightCodexCube } from "@/components/light-codex-cube";

export default function LightCodexPage() {
  return (
    <LightCodexCube
      onClose={() => {
        if (typeof window !== "undefined") window.location.href = "/";
      }}
    />
  );
}
