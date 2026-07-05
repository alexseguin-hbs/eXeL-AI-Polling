"use client";

/**
 * /Atlantis-Accords — direct deep-link to The Atlantis Accords reader.
 *
 * Canonical page URL (replaces /atlantis, which now redirects here). The QR
 * inside the Accords viewer encodes this URL, so a scan lands straight on the
 * Accords (unlocked view) instead of the homepage — exactly as if the user
 * opened Settings → The Atlantis Accords. Global providers (lexicon, theme,
 * Easter-egg) come from the root layout.
 *
 * Sealed short links live one segment deeper — /Atlantis-Accords/<7-hash> —
 * served by functions/Atlantis-Accords/[hash].js (302 → /seal.html#<hash>).
 */

import { AtlantisAccordsStandalone } from "@/components/atlantis-accord-viewer";

export default function AtlantisAccordsPage() {
  return <AtlantisAccordsStandalone />;
}
