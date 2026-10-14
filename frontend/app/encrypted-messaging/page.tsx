"use client";

/**
 * /encrypted-messaging — ENCRYPTED MESSAGING (ATLANTIS-2525) composer.
 * Compose a plain/markdown/HTML message and seal it into a 4-digit HTML
 * download or shareable link (Atlantis single-layer engine, Level 1).
 *
 * R-CORE (DD-55, operator 2026-10-14: "each innovation project gets its own rcore panel
 * (drone, security, light codex, Vision-2525, etc)"). Mounted LAST, in normal flow at the
 * bottom of the page — never a fixed overlay (operator 2026-09-25). Accent #22d3ee is the
 * shared default; this world has no colour of its own on the worlds page yet.
 */
import { useMemo } from "react";
import { EncryptedMessagingComposer } from "@/components/encrypted-messaging-composer";
import { RCoreBadge } from "@/components/2525-core/rcore-badge"; // R-CORE · version-history badge (bottom-centre, two-click)
import { fromLedgerJson } from "@/lib/2525-core/revisions";
import { ENCRYPTED_MESSAGING_LEDGER } from "@/lib/2525-core/encrypted-messaging-ledger.gen"; // its append-only traceability ledger

export default function EncryptedMessagingPage() {
  const history = useMemo(() => fromLedgerJson(ENCRYPTED_MESSAGING_LEDGER), []);
  return (
    <>
      <EncryptedMessagingComposer />
      <RCoreBadge history={history} accent="#22d3ee" />
    </>
  );
}
