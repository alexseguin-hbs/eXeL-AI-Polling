"use client";

/**
 * /encrypted-messaging — ENCRYPTED MESSAGING (ATLANTIS-2525) composer.
 * Compose a plain/markdown/HTML message and seal it into a 4-digit HTML
 * download or shareable link (Atlantis single-layer engine, Level 1).
 */
import { EncryptedMessagingComposer } from "@/components/encrypted-messaging-composer";

export default function EncryptedMessagingPage() {
  return <EncryptedMessagingComposer />;
}
