"use client";

/**
 * /atlantis — direct deep-link to The Atlantis Accords reader.
 *
 * The QR inside the Accords viewer encodes this URL, so a scan lands straight
 * on the Accords (unlocked view) instead of the homepage — exactly as if the
 * user opened Settings → The Atlantis Accords. Global providers (lexicon,
 * theme, Easter-egg) come from the root layout.
 */

import { AtlantisAccordsStandalone } from "@/components/atlantis-accord-viewer";

export default function AtlantisPage() {
  return <AtlantisAccordsStandalone />;
}
