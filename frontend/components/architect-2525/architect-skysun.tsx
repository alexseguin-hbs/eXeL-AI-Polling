"use client";

/**
 * ARCHITECT-2525 · SUN·SKY — celestial engine + window optimization (MASTER_SPEC §12b / ARC-31, 32).
 * =================================================================================================
 * From the house CORNER coordinates (lat/lon — reuse the Security mgrs.ts coordinate world), plot the
 * deterministic sun path across the year on a sky dome, plus Polaris (true north, el≈lat) and a marker
 * for Orion. Score each cardinal facing for seasonal daylight → window-placement recommendation. Pure
 * client math (deterministic → replayable, U-WF-08). Self-contained SVG.
 */
import { useState } from "react";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e" };
const RAD = Math.PI / 180;

// Deterministic solar position (solar time; equation-of-time/longitude omitted for v1).
function sunPos(lat: number, dayOfYear: number, hour: number) {
  const decl = 23.44 * Math.sin(RAD * 360 * (284 + dayOfYear) / 365);
  const H = 15 * (hour - 12);
  const sinEl = Math.sin(RAD * lat) * Math.sin(RAD * decl) + Math.cos(RAD * lat) * Math.cos(RAD * decl) * Math.cos(RAD * H);
  const el = Math.asin(Math.max(-1, Math.min(1, sinEl))) / RAD;
  const cosAz = (Math.sin(RAD * decl) - Math.sin(RAD * el) * Math.sin(RAD * lat)) / (Math.cos(RAD * el) * Math.cos(RAD * lat) || 1e-6);
  let az = Math.acos(Math.max(-1, Math.min(1, cosAz))) / RAD;
  if (H > 0) az = 360 - az;
  return { az, el };
}

// Ecliptic (λ,β) → equatorial (RA, dec), obliquity ε.
function eclToRaDec(lonDeg: number, latDeg: number) {
  const e = 23.4397 * RAD, l = lonDeg * RAD, b = latDeg * RAD;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l)) / RAD;
  const dec = Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l)) / RAD;
  return { ra, dec };
}
// Deterministic low-precision MOON position (alt-az) + illuminated fraction, sharing the sun's solar-time
// convention so the sky is self-consistent. Approximate (main periodic terms only) — labeled as such in UI.
function moonSky(lat: number, dayOfYear: number, hour: number, year = 2025) {
  const d = (year - 2000) * 365.25 + dayOfYear + hour / 24 - 1.5; // days since J2000 (approx)
  const Ms = 357.529 + 0.98560028 * d;                 // sun mean anomaly
  const Ls = 280.459 + 0.98564736 * d;                 // sun mean longitude
  const lamSun = Ls + 1.915 * Math.sin(Ms * RAD) + 0.020 * Math.sin(2 * Ms * RAD);
  const Lm = 218.316 + 13.176396 * d;                  // moon mean longitude
  const Mm = 134.963 + 13.064993 * d;                  // moon mean anomaly
  const Fm = 93.272 + 13.229350 * d;                   // moon argument of latitude
  const lamMoon = Lm + 6.289 * Math.sin(Mm * RAD);     // ecliptic longitude
  const betMoon = 5.128 * Math.sin(Fm * RAD);          // ecliptic latitude
  const sun = eclToRaDec(lamSun, 0), moon = eclToRaDec(lamMoon, betMoon);
  const Hs = 15 * (hour - 12);                          // sun hour angle (solar time)
  let Hm = Hs - (moon.ra - sun.ra);                     // moon hour angle (shared LST)
  Hm = ((Hm + 180) % 360 + 360) % 360 - 180;
  const decR = moon.dec * RAD, latR = lat * RAD, HmR = Hm * RAD;
  const el = Math.asin(Math.max(-1, Math.min(1, Math.sin(decR) * Math.sin(latR) + Math.cos(decR) * Math.cos(latR) * Math.cos(HmR)))) / RAD;
  const az = (Math.atan2(-Math.cos(decR) * Math.sin(HmR), Math.sin(decR) * Math.cos(latR) - Math.cos(decR) * Math.sin(latR) * Math.cos(HmR)) / RAD + 360) % 360;
  const elong = ((lamMoon - lamSun) % 360 + 360) % 360; // elongation → phase
  const illum = (1 - Math.cos(elong * RAD)) / 2;        // fraction illuminated
  const phase = elong < 22.5 || elong >= 337.5 ? "New" : elong < 67.5 ? "Waxing crescent" : elong < 112.5 ? "First quarter" : elong < 157.5 ? "Waxing gibbous" : elong < 202.5 ? "Full" : elong < 247.5 ? "Waning gibbous" : elong < 292.5 ? "Last quarter" : "Waning crescent";
  return { az, el, illum, phase };
}

// Sky-dome projection: zenith at centre, horizon at radius R. az 0=N (top), clockwise.
const R = 44, CX = 50, CY = 50;
const dome = (az: number, el: number) => {
  const r = R * Math.max(0, (90 - el)) / 90;
  return [CX + r * Math.sin(RAD * az), CY - r * Math.cos(RAD * az)] as const;
};

const FACINGS = [{ k: "S", az: 180 }, { k: "E", az: 90 }, { k: "W", az: 270 }, { k: "N", az: 0 }];

export function ArchitectSkySun() {
  const [lat, setLat] = useState(30.27);   // demo: Austin (matches a Security AO)
  const [lon, setLon] = useState(-97.74);
  const [doy, setDoy] = useState(172);     // ~summer solstice
  const [hour, setHour] = useState(12);
  const [year, setYear] = useState(2025);

  const sun = sunPos(lat, doy, hour);
  const dayPath = Array.from({ length: 29 }, (_, i) => 5 + i * 0.5).map((h) => sunPos(lat, doy, h)).filter((p) => p.el > -2);
  const arcs = [{ d: 172, c: C.gold, n: "Jun" }, { d: 80, c: C.cyan, n: "Mar/Sep" }, { d: 355, c: "#7dd3fc", n: "Dec" }]
    .map((a) => ({ ...a, pts: Array.from({ length: 29 }, (_, i) => 5 + i * 0.5).map((h) => sunPos(lat, a.d, h)).filter((p) => p.el > 0) }));
  const polaris = { az: 0, el: Math.max(1, Math.abs(lat)) }; // Polaris altitude ≈ observer latitude (N hemi)

  // window optimization: cardinal solar-gain score across daylight.
  const exposure = FACINGS.map((f) => {
    let s = 0;
    for (let h = 5; h <= 19; h += 0.5) { const p = sunPos(lat, doy, h); if (p.el <= 0) continue; const inc = Math.cos(RAD * (p.az - f.az)); if (inc > 0) s += inc * Math.sin(RAD * p.el); }
    return { ...f, score: Math.round(s * 10) / 10 };
  }).sort((a, b) => b.score - a.score);
  const best = exposure[0], worst = exposure[exposure.length - 1];

  const moon = moonSky(lat, doy, hour, year);
  const moonPath = Array.from({ length: 29 }, (_, i) => 5 + i * 0.5).map((h) => moonSky(lat, doy, h, year)).filter((p) => p.el > -2);

  const path = (pts: { az: number; el: number }[]) => pts.map((p, i) => { const [x, y] = dome(p.az, p.el); return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`; }).join(" ");
  const [sx, sy] = dome(sun.az, sun.el);
  const [mx, my] = dome(moon.az, moon.el);
  const [px, py] = dome(polaris.az, polaris.el);
  const dateObj = new Date(year, 0, doy);
  const monthDay = dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const isoDate = new Date(Date.UTC(year, 0, doy)).toISOString().slice(0, 10);
  const setFromDate = (iso: string) => { const d = new Date(iso + "T00:00:00Z"); if (isNaN(d.getTime())) return; setYear(d.getUTCFullYear()); const start = Date.UTC(d.getUTCFullYear(), 0, 0); setDoy(Math.round((d.getTime() - start) / 86400000)); };
  const season = ((): string => { const m = dateObj.getMonth(); return m < 2 || m === 11 ? "Winter" : m < 5 ? "Spring" : m < 8 ? "Summer" : "Autumn"; })();

  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
      <div className="relative rounded-lg border p-2" style={{ borderColor: C.border, background: C.panel }}>
        {/* CALENDAR — upper-right of the sky dome: pick any date to scrub sun + moon across the year */}
        <div data-arch-calendar className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1 rounded-md border p-1.5" style={{ borderColor: C.border, background: "rgba(12,20,32,0.8)", backdropFilter: "blur(2px)" }}>
          <input type="date" data-cal-input value={isoDate} onChange={(e) => setFromDate(e.target.value)} className="rounded border bg-transparent px-1 py-0.5 text-[9px]" style={{ borderColor: C.border, color: C.text }} />
          <span className="text-[9px]" style={{ color: C.dim }}>{season} · <span style={{ color: "#e5e7eb" }}>☾ {(moon.illum * 100).toFixed(0)}%</span> {moon.phase}</span>
        </div>
        <svg data-arch-sky viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" className="w-full rounded" style={{ background: "#05070d", aspectRatio: "1 / 1" }}>
          <circle cx={CX} cy={CY} r={R} fill="#070c16" stroke="#233043" strokeWidth="0.4" />
          <circle cx={CX} cy={CY} r={R * 2 / 3} fill="none" stroke="#16202e" strokeWidth="0.2" />
          <circle cx={CX} cy={CY} r={R / 3} fill="none" stroke="#16202e" strokeWidth="0.2" />
          {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([k, a]) => { const [x, y] = dome(a as number, 0); return <text key={k as string} x={x} y={y} fontSize="3" fill={C.dim} textAnchor="middle" dominantBaseline="middle" style={{ fontFamily: "monospace" }}>{k}</text>; })}
          {/* seasonal solar arcs */}
          {arcs.map((a) => a.pts.length > 1 && <path key={a.n} data-el="arc" d={path(a.pts)} fill="none" stroke={a.c} strokeWidth="0.4" opacity="0.5" />)}
          {/* selected-day sun path + sun */}
          {dayPath.length > 1 && <path data-el="sunpath" d={path(dayPath)} fill="none" stroke={C.gold} strokeWidth="0.7" />}
          {sun.el > 0 && <circle data-el="sun" cx={sx} cy={sy} r="2" fill={C.gold} />}
          {/* selected-day MOON path + moon disc (approx lunar model; brightness ≈ illuminated fraction) */}
          {moonPath.length > 1 && <path data-el="moonpath" d={path(moonPath)} fill="none" stroke="#cbd5e1" strokeWidth="0.4" opacity="0.5" strokeDasharray="1 0.7" />}
          {moon.el > 0 && <circle data-el="moon" cx={mx} cy={my} r="1.6" fill="#e5e7eb" fillOpacity={0.3 + 0.7 * moon.illum} stroke="#cbd5e1" strokeWidth="0.2" />}
          {/* Polaris (true north) + Orion marker */}
          <circle data-el="polaris" cx={px} cy={py} r="0.9" fill="#fff" /><text x={px + 2} y={py} fontSize="2.4" fill="#fff" style={{ fontFamily: "monospace" }}>Polaris</text>
          {(() => { const [ox, oy] = dome(135, Math.max(10, 40 - Math.abs(lat) / 2)); return <><circle cx={ox} cy={oy} r="0.7" fill="#9fd" /><circle cx={ox + 2} cy={oy + 1} r="0.7" fill="#9fd" /><circle cx={ox + 4} cy={oy + 2} r="0.7" fill="#9fd" /><text x={ox} y={oy - 2} fontSize="2.2" fill="#9fd" style={{ fontFamily: "monospace" }}>Orion</text></>; })()}
        </svg>
        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
          <label className="flex items-center justify-between gap-1" style={{ color: C.text }}>Lat<input type="number" value={lat} step={0.5} onChange={(e) => setLat(parseFloat(e.target.value) || 0)} className="w-20 rounded border bg-transparent px-1 text-right" style={{ borderColor: C.border }} /></label>
          <label className="flex items-center justify-between gap-1" style={{ color: C.text }}>Lon<input type="number" value={lon} step={0.5} onChange={(e) => setLon(parseFloat(e.target.value) || 0)} className="w-20 rounded border bg-transparent px-1 text-right" style={{ borderColor: C.border }} /></label>
          <label className="col-span-2 flex items-center gap-2" style={{ color: C.dim }}>Day <input type="range" min={1} max={365} value={doy} onChange={(e) => setDoy(+e.target.value)} className="flex-1" /><span style={{ color: C.gold }}>{monthDay}</span></label>
          <label className="col-span-2 flex items-center gap-2" style={{ color: C.dim }}>Hour <input type="range" min={0} max={24} step={0.5} value={hour} onChange={(e) => setHour(+e.target.value)} className="flex-1" /><span style={{ color: C.cyan }}>{hour}:00 · {sun.el > 0 ? `el ${sun.el.toFixed(0)}°` : "night"}</span></label>
        </div>
      </div>
      <div className="space-y-2 rounded-lg border p-3 text-[11px]" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>WINDOW OPTIMIZATION</div>
        <div className="text-[9px]" style={{ color: C.dim }}>Seasonal solar-gain by facing ({monthDay}):</div>
        {exposure.map((e) => (
          <div key={e.k} className="flex items-center gap-2">
            <span className="w-4" style={{ color: C.text }}>{e.k}</span>
            <div className="h-2 flex-1 rounded" style={{ background: "#0c1420" }}><div className="h-2 rounded" style={{ width: `${Math.min(100, (e.score / (best.score || 1)) * 100)}%`, background: C.gold }} /></div>
            <span className="w-8 text-right tabular-nums" style={{ color: C.dim }}>{e.score}</span>
          </div>
        ))}
        <div className="border-t pt-1 text-[10px]" style={{ borderColor: C.border }}>
          <div><span style={{ color: C.green }}>Best light:</span> <span style={{ color: C.text }}>{best.k}-facing</span> — primary living windows.</div>
          <div><span style={{ color: C.gold }}>Manage:</span> <span style={{ color: C.text }}>{worst.k === "N" ? "N (low gain)" : worst.k}</span> — shade/minimize glare.</div>
          <div className="mt-1"><span style={{ color: "#e5e7eb" }}>☾ Moon:</span> <span style={{ color: C.text }}>{moon.phase}</span> · {(moon.illum * 100).toFixed(0)}% lit · {moon.el > 0 ? `el ${moon.el.toFixed(0)}°` : "below horizon"}</div>
          <div className="mt-1 text-[9px]" style={{ color: C.dim }}>Polaris ≈ {polaris.el.toFixed(0)}° (latitude). Sun exact; moon is an approximate model. Deterministic → replayable.</div>
        </div>
      </div>
    </div>
  );
}
