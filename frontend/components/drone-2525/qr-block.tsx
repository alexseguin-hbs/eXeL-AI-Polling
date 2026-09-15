"use client";

// ONE SCANNABLE CODE BLOCK, used by every panel that hands something to a second person.
//
// A QR is the one FILLED thing on this surface and it has to be: a scannable code is a pattern of filled
// squares, and there is no edges-only version of one. It lives in a panel, never in the arena, so the
// vector law that governs the drawing is untouched. Saying that once, here, is better than saying it twice
// in two panels that will drift.
import { QRCodeSVG } from "qrcode.react";
import { MONO, HUD } from "./ui";

export function QrBlock({ url, size = 160, note }: { url: string; size?: number; note?: string }) {
  return (
    <div data-qr-block style={{ marginBottom: 10 }}>
      <div style={{ background: "#FFFFFF", padding: 12, display: "inline-block" }}>
        <QRCodeSVG value={url} size={size} level="M" />
      </div>
      <div style={{ ...MONO, color: HUD, opacity: 0.55, marginTop: 6, wordBreak: "break-all", maxWidth: 420 }}>{url}</div>
      {note ? <div style={{ ...MONO, color: HUD, opacity: 0.8, marginTop: 4 }}>{note}</div> : null}
    </div>
  );
}
