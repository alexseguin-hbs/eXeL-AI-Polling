"use client";

// ONE THUMB STICK. Pure input: it reports a normalised vector and owns no game state, which is what lets
// the same control serve the body and the head without either knowing about the other.
//
// r.052/r.068 hardening: the knob parks at the box's TRUE centre and travels 0.92 of the way to the rim
// (measured from the real size, not a hard-coded 26 px); a press stops propagating so the arena's orbit-drag
// never also fires under it; and the stick releases on lost-pointer-capture AND on window blur — the two
// paths iOS takes that never send a pointerup, which otherwise leave an axis pinned when the thumb is gone.
import { useEffect, useRef, useState } from "react";
import { MONO } from "./ui";

export function Stick({ label, onMove, hex, size = 92 }: { label: string; onMove: (x: number, y: number) => void; hex: string; size?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const knobSize = Math.round(size * 0.28);
  const centre = (size - knobSize) / 2;
  const travel = centre * 0.92;                                  // r.068: park at true centre, travel 0.92
  const set = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect(); if (!r) return;
    const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const m = Math.max(1, Math.hypot(x, y));
    const nx = x / m, ny = y / m;
    setKnob({ x: nx, y: ny }); onMove(nx, ny);
  };
  const clear = () => { setKnob({ x: 0, y: 0 }); onMove(0, 0); };
  // Losing the window (tab switch, iOS gesture) never sends a pointerup — the blur is the release.
  useEffect(() => { const b = () => clear(); window.addEventListener("blur", b); return () => window.removeEventListener("blur", b); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return (
    <div style={{ textAlign: "center" }}>
      <div ref={box} data-drone-stick={label}
           onPointerDown={(e) => { e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId); set(e); }}
           onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") set(e); }}
           onPointerUp={clear} onPointerCancel={clear} onLostPointerCapture={clear}
           style={{ width: size, height: size, border: `1px solid ${hex}`, borderRadius: "50%", position: "relative", touchAction: "none", cursor: "grab" }}>
        <div style={{ position: "absolute", width: knobSize, height: knobSize, border: `1px solid ${hex}`, borderRadius: "50%",
                      left: centre + knob.x * travel, top: centre + knob.y * travel, pointerEvents: "none" }} />
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10, color: hex, opacity: 0.8, marginTop: 4, letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}

/**
 * ONE HOLD BUTTON. Reports down/up and nothing else — the touch form of a held key. With the R stick now
 * the head (EXEL-2525-CONTROLS-1), the airframe's yaw and climb need a thumb equivalent of Q/E and U/J,
 * and a button that is true while pressed is exactly that. 34px so a thumb can find it.
 */
export function HoldButton({ id, label, onHold, hex }: { id: string; label: string; onHold: (down: boolean) => void; hex: string }) {
  const [down, setDown] = useState(false);
  const set = (d: boolean) => { if (d !== down) { setDown(d); onHold(d); } };
  return (
    <button data-drone-hold={id} aria-pressed={down}
            onPointerDown={(e) => { e.stopPropagation(); (e.target as Element).setPointerCapture?.(e.pointerId); set(true); }}
            onPointerUp={() => set(false)} onPointerCancel={() => set(false)} onPointerLeave={() => set(false)} onLostPointerCapture={() => set(false)}
            style={{ ...MONO, minWidth: 34, minHeight: 34, padding: "0 8px", color: down ? "#000" : hex, background: down ? hex : "transparent",
                     border: `1px solid ${hex}`, borderRadius: 4, touchAction: "none", cursor: "pointer", userSelect: "none" }}>
      {label}
    </button>
  );
}
