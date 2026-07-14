"use client";

/**
 * ARCHITECT-2525 · BUILD — 4D day-by-day construction sequence (MASTER_SPEC §12a / ARC-29, 29.01, 30).
 * =================================================================================================
 * Scrub a day timeline and watch each 2×4 / beam / plumbing / electrical run appear in build order
 * (from the U-WF-06 replay-bundle idea), with "who does what when" trade lanes (ARC-30) and the
 * "wire from power to home" utilities routing (ARC-29.01). Reuses the play-test scrubber pattern.
 * Self-contained SVG; pure client. Mounted conditionally (play pauses when the tab is hidden).
 */
import { useEffect, useRef, useState } from "react";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc" };
const TRADE_COLOR: Record<string, string> = { Concrete: "#8a8f98", Framing: "#19c8cf", Plumbing: "#38bdf8", Electrical: "#ffd400", Finish: "#22c55e" };
const TRADES = ["Concrete", "Framing", "Plumbing", "Electrical", "Finish"];

interface Step { s: number; e: number; trade: string; label: string; kind: string; }
const SEQ: Step[] = [
  { s: 1, e: 2, trade: "Concrete", label: "Footings + Slab", kind: "foundation" },
  { s: 3, e: 6, trade: "Framing", label: "2×4 Stud Walls", kind: "studs" },
  { s: 6, e: 8, trade: "Framing", label: "Beams + Roof Trusses", kind: "beams" },
  { s: 9, e: 11, trade: "Plumbing", label: "Plumbing Rough-in", kind: "plumbing" },
  { s: 12, e: 14, trade: "Electrical", label: "Electrical Rough-in — wire from power", kind: "electrical" },
  { s: 15, e: 17, trade: "Framing", label: "Sheathing + Roof Deck", kind: "sheathing" },
  { s: 18, e: 20, trade: "Finish", label: "Windows + Doors", kind: "openings" },
];
const TOTAL = 20;

const shown = (day: number, k: string) => SEQ.some((x) => x.kind === k && day >= x.s);
const ramp = (day: number, k: string) => { const x = SEQ.find((s) => s.kind === k); if (!x) return 0; return Math.max(0, Math.min(1, (day - x.s + 1) / (x.e - x.s + 1))); };

export function ArchitectBuild() {
  const [day, setDay] = useState(1);
  const [playing, setPlaying] = useState(false);
  const raf = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!playing) return;
    raf.current = setInterval(() => setDay((d) => { if (d >= TOTAL) { setPlaying(false); return d; } return d + 1; }), 600);
    return () => { if (raf.current) clearInterval(raf.current); };
  }, [playing]);

  const activeToday = SEQ.filter((x) => day >= x.s && day <= x.e);
  const gx = (d: number) => (d / TOTAL) * 100;

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div className="rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        {/* progressive build schematic */}
        <svg data-arch-build viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" className="w-full rounded" style={{ background: "#070b12", aspectRatio: "5 / 3" }}>
          <line x1="6" y1="52" x2="94" y2="52" stroke="#233043" strokeWidth="0.4" />
          {/* foundation */}
          {shown(day, "foundation") && <rect data-el="foundation" x="26" y="48" width="48" height="4" fill="#2a2f38" opacity={ramp(day, "foundation")} />}
          {/* 2×4 stud walls */}
          {shown(day, "studs") && Array.from({ length: 13 }, (_, i) => 27 + i * 3.7).map((x, i) => (
            <line key={i} data-el="studs" x1={x} y1="48" x2={x} y2="30" stroke={TRADE_COLOR.Framing} strokeWidth="0.5" opacity={ramp(day, "studs")} />
          ))}
          {/* beams + roof trusses */}
          {shown(day, "beams") && <polyline data-el="beams" points="24,30 50,18 76,30" fill="none" stroke={TRADE_COLOR.Framing} strokeWidth="0.7" opacity={ramp(day, "beams")} />}
          {/* plumbing runs */}
          {shown(day, "plumbing") && <path data-el="plumbing" d="M34,48 L34,40 L44,40 L44,48 M60,48 L60,38" fill="none" stroke={TRADE_COLOR.Plumbing} strokeWidth="0.6" opacity={ramp(day, "plumbing")} />}
          {/* electrical — WIRE FROM POWER (pole) TO HOME (ARC-29.01) */}
          {shown(day, "electrical") && (
            <g data-el="electrical" opacity={ramp(day, "electrical")}>
              <line x1="10" y1="20" x2="10" y2="52" stroke="#556" strokeWidth="0.5" />
              <polyline points="10,22 18,26 12,30 20,34 26,38 26,44" fill="none" stroke={TRADE_COLOR.Electrical} strokeWidth="0.6" />
              <rect x="25" y="42" width="3" height="4" fill="none" stroke={TRADE_COLOR.Electrical} strokeWidth="0.4" />
            </g>
          )}
          {/* sheathing outline */}
          {shown(day, "sheathing") && <polyline data-el="sheathing" points="24,48 24,30 50,18 76,30 76,48" fill="none" stroke="#3a4a5f" strokeWidth="0.6" opacity={ramp(day, "sheathing")} />}
          {/* windows + doors */}
          {shown(day, "openings") && <g data-el="openings" opacity={ramp(day, "openings")}><rect x="46" y="40" width="4" height="8" fill="#1a2a1f" stroke="#22c55e" strokeWidth="0.3" /><rect x="34" y="34" width="5" height="5" fill="none" stroke="#ffd400" strokeWidth="0.3" /></g>}
        </svg>
        {/* day scrubber */}
        <div className="mt-2 flex items-center gap-2">
          <button onClick={() => setPlaying((p) => !p)} className="rounded border px-2 py-0.5 text-[10px]" style={{ borderColor: C.border, color: playing ? C.violet : C.dim }}>{playing ? "❚❚" : "▶"}</button>
          <input type="range" min={1} max={TOTAL} value={day} onChange={(e) => { setPlaying(false); setDay(+e.target.value); }} className="flex-1" />
          <span className="w-20 text-right text-[11px] tabular-nums" style={{ color: C.cyan }}>Day {day}/{TOTAL}</span>
        </div>
      </div>
      {/* trade coordination — who does what when */}
      <div className="space-y-2 rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>TRADE COORDINATION</div>
        <svg viewBox="0 0 100 40" className="w-full" style={{ aspectRatio: "5 / 2" }}>
          {TRADES.map((t, row) => (
            <g key={t}>
              <text x="0" y={row * 8 + 5} fontSize="3" fill={TRADE_COLOR[t]} style={{ fontFamily: "monospace" }}>{t.slice(0, 5)}</text>
              {SEQ.filter((x) => x.trade === t).map((x, i) => (
                <rect key={i} x={22 + gx(x.s - 1) * 0.78} y={row * 8 + 2} width={gx(x.e - x.s + 1) * 0.78} height="4" rx="0.6" fill={TRADE_COLOR[t]} opacity={day >= x.s ? 0.9 : 0.25} />
              ))}
            </g>
          ))}
          <line x1={22 + gx(day) * 0.78} y1="0" x2={22 + gx(day) * 0.78} y2="40" stroke={C.cyan} strokeWidth="0.4" strokeDasharray="1 1" />
        </svg>
        <div className="border-t pt-1 text-[10px]" style={{ borderColor: C.border }}>
          <div className="font-bold" style={{ color: C.dim }}>TODAY · DAY {day}</div>
          {activeToday.length ? activeToday.map((x, i) => (
            <div key={i} className="flex items-center gap-1"><span style={{ color: TRADE_COLOR[x.trade] }}>●</span><span style={{ color: C.text }}>{x.trade}</span><span style={{ color: C.dim }}>— {x.label}</span></div>
          )) : <div style={{ color: C.dim }}>—</div>}
        </div>
      </div>
    </div>
  );
}
