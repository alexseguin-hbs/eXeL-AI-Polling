"use client";

// MINI QR (operator 2026-10-08: "add QR code on this page at top (mini icon) like we have on divinity guide that opens up to
// qr code directly to range 21 turret operator on Train-Up mode"). Same icon and full-screen overlay pattern as the Divinity
// Guide; same library (qrcode.react). The link opens the playable deck on LANE 21, turret seat, TRAIN UP — play.html reads
// ?range=21&role=turret&mode=train-up on load; without those params nothing changes.
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export const RANGE21_TRAINUP_URL = "https://exel-ai-polling.explore-096.workers.dev/drone-2525/play?range=21&role=turret&mode=train-up"; // 2026-10-08e: the short clean form (the Worker serves /drone-2525/play as play.html)

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
        // 2026-10-08e (operator): the Divinity Guide QR modal, line for line (app/divinity-guide/page.tsx) — title "The Range".
        <div data-drone-qr-overlay role="dialog" aria-modal="true" aria-label="The Range QR code" onClick={(e) => e.target === e.currentTarget && setOpen(false)}
             className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200 font-sans text-foreground"
             style={{ letterSpacing: "normal", textTransform: "none" }}>
          <button onClick={() => setOpen(false)} aria-label="close" className="absolute top-4 right-4 p-2 rounded-full hover:bg-accent transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          <h2 className="text-2xl font-bold mb-1" style={{ color: "#00FFFF" }}>
            The Range
          </h2>
          <p className="text-sm text-muted-foreground mb-6 italic">
            Lane 21 · Turret · Mode: Train - Up
          </p>

          <div className="bg-white rounded-2xl p-6 shadow-2xl">
            <QRCodeSVG value={RANGE21_TRAINUP_URL} size={280} level="Q" fgColor="#000000" bgColor="#ffffff" className="rounded-lg" style={{ width: "min(280px, calc(100vw - 96px), 50vh)", height: "auto" }} />
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            Scan to share The Range
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1 break-all px-4">
            {RANGE21_TRAINUP_URL}
          </p>

          <button
            onClick={() => {
              if (typeof navigator !== "undefined") {
                navigator.clipboard.writeText(RANGE21_TRAINUP_URL);
              }
            }}
            className="mt-4 px-4 py-2 text-xs rounded-full bg-muted hover:bg-accent transition-colors"
          >
            Copy Link
          </button>
        </div>
      )}
    </>
  );
}
