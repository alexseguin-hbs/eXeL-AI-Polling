"use client";

// MINI QR (operator 2026-10-08: "add QR code on this page at top (mini icon) like we have on divinity guide that opens up to
// qr code directly to range 21 turret operator on Train-Up mode"). Same icon and full-screen overlay pattern as the Divinity
// Guide; same library (qrcode.react). The link opens the playable deck on LANE 21, turret seat, TRAIN UP — play.html reads
// ?range=21&role=turret&mode=train-up on load; without those params nothing changes.
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export const RANGE21_TRAINUP_URL = "https://exel-ai-polling.explore-096.workers.dev/drone-2525/play.html?range=21&role=turret&mode=train-up";

export function DroneQrMini({ hex }: { hex: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button data-drone-qr onClick={() => setOpen(true)} title="QR · Lane 21 turret · Train Up" aria-label="QR code: Lane 21 turret, Train Up"
              style={{ background: "transparent", border: `1px solid ${hex}`, color: hex, padding: "3px 6px", cursor: "pointer", lineHeight: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
          <rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" />
          <rect x="10" y="10" width="2" height="2" /><rect x="13" y="10" width="2" height="2" /><rect x="10" y="13" width="2" height="2" /><rect x="13" y="13" width="2" height="2" />
          <rect x="3" y="3" width="2" height="2" fill="#000" /><rect x="11" y="3" width="2" height="2" fill="#000" /><rect x="3" y="11" width="2" height="2" fill="#000" />
        </svg>
      </button>
      {open && (
        <div data-drone-qr-overlay role="dialog" aria-modal="true" onClick={(e) => e.target === e.currentTarget && setOpen(false)}
             style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 16, textAlign: "center" }}>
          <button onClick={() => setOpen(false)} aria-label="close" style={{ position: "absolute", top: 12, right: 12, minWidth: 44, minHeight: 44, background: "transparent", border: `1px solid ${hex}`, color: hex, fontSize: 18, cursor: "pointer" }}>✕</button>
          <div style={{ fontSize: 16, letterSpacing: "0.18em", color: hex }}>LANE 21 · TURRET · TRAIN UP</div>
          <div style={{ background: "#FFFFFF", padding: 16, borderRadius: 16 }}>
            <QRCodeSVG value={RANGE21_TRAINUP_URL} size={260} level="Q" fgColor="#000000" bgColor="#ffffff" />
          </div>
          <div style={{ fontSize: 10, opacity: 0.7, wordBreak: "break-all", maxWidth: 420 }}>{RANGE21_TRAINUP_URL}</div>
          <button onClick={() => { try { navigator.clipboard.writeText(RANGE21_TRAINUP_URL); } catch { /* no clipboard */ } }}
                  style={{ background: "transparent", border: `1px solid ${hex}`, color: hex, padding: "8px 14px", fontSize: 11, cursor: "pointer" }}>Copy Link</button>
        </div>
      )}
    </>
  );
}
