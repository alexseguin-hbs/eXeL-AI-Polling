"use client";

// ONE THUMB STICK. Pure input: it reports a normalised vector and owns no game state, which is what lets
// the same control serve the body and the head without either knowing about the other.
import { useRef, useState } from "react";
import { MONO } from "./ui";

export function Stick({ label, onMove, hex }: { label: string; onMove: (x: number, y: number) => void; hex: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const set = (e: React.PointerEvent) => {
    const r = box.current?.getBoundingClientRect(); if (!r) return;
    const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
    const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
    const m = Math.max(1, Math.hypot(x, y));
    const nx = x / m, ny = y / m;
    setKnob({ x: nx, y: ny }); onMove(nx, ny);
  };
  const clear = () => { setKnob({ x: 0, y: 0 }); onMove(0, 0); };
  return (
    <div style={{ textAlign: "center" }}>
      <div ref={box} data-drone-stick={label}
           onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); set(e); }}
           onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") set(e); }}
           onPointerUp={clear} onPointerCancel={clear}
           style={{ width: 92, height: 92, border: `1px solid ${hex}`, borderRadius: "50%", position: "relative", touchAction: "none", cursor: "grab" }}>
        <div style={{ position: "absolute", width: 26, height: 26, border: `1px solid ${hex}`, borderRadius: "50%",
                      left: 33 + knob.x * 26, top: 33 + knob.y * 26, pointerEvents: "none" }} />
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
            onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); set(true); }}
            onPointerUp={() => set(false)} onPointerCancel={() => set(false)} onPointerLeave={() => set(false)}
            style={{ ...MONO, minWidth: 34, minHeight: 34, padding: "0 8px", color: down ? "#000" : hex, background: down ? hex : "transparent",
                     border: `1px solid ${hex}`, borderRadius: 4, touchAction: "none", cursor: "pointer", userSelect: "none" }}>
      {label}
    </button>
  );
}
