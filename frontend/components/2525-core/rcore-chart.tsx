"use client";
/**
 * R-CORE CHART — the one financial/time-series chart every 2525 surface reuses (operator 2026-10-02, addendum 124: "RCORE RESUSE MAXIMIZE
 * OF FINANCIAL CHART"). OUR OWN canvas engine, no third-party chart library (addendum 135: "i said dont use light wight trding view
 * chart"). Financial-2525 is the first consumer ($/min). Everything runs in the browser only (the canvas is touched inside effects; the
 * static export renders an empty frame).
 *
 * Contract:
 * - lines of { t (ms), v } sampled on ONE EVEN clock over a WIDE range (addendum 130 "pinch zoom on table shows more dates · 30D means
 *   cost split into 30 days, not necessarily range of x axis"): the chart opens on `initialRange`; two fingers pinch, the wheel zooms, a
 *   drag pans — nothing is re-computed, the window moves over the lines it was given.
 * - everything is drawn on the one canvas: the step lines on ONE left value scale (addendum 101 "$ on left y axis"); the date marks,
 *   tilted at the Settings angle (addendum 129), in their own strip under the plot; the figures — numbers only, each in its line's colour,
 *   beside the vertical line of the selected instant (addendum 129): the finger's, else the tapped day (addendum 134), else `readoutAt`.
 * - colours from the caller (the 13-colour palette); transparent ground; text and grid from the theme.
 */
import { useEffect, useRef } from "react";
import { layoutMarks, type MarkDot } from "@/lib/2525-core/mark-layout";

export interface RCoreLine { id: string; color: string; points: { t: number; v: number }[]; step?: boolean; dashed?: boolean; width?: 1 | 2 | 3 }
/** A transaction on the chart (addendum 136): every one draws a very thin dotted vertical line; `dot: false` draws only the line
 *  (deposits), otherwise a dot with its label. `value` lets dots that overlap be summed into one label (`formatMarkSum`). */
export interface RCoreMark { t: number; color: string; text?: string; value?: number; dot?: boolean }
export interface RCoreFigure { color: string; text: string }
export type RCoreAngle = 0 | 30 | 45 | 90;
export interface RCoreChartProps {
  lines: RCoreLine[];                       // every line on the SAME even clock (same first instant, same step, same count)
  marks?: RCoreMark[];
  height?: number;
  initialRange?: { from: number; to: number };
  formatValue: (v: number) => string;
  ticksFor: (from: number, to: number) => number[];   // the date marks for the range in view
  formatTick: (ms: number) => string;
  angle?: RCoreAngle;
  tall?: boolean;                           // long labels (a full date) need more room when tilted
  readout?: (ms: number) => RCoreFigure[];
  readoutAt?: number;
  formatSelected?: (ms: number) => string;  // the selected instant's own label, boxed on the date strip (addendum 134)
  formatMarkSum?: (sum: number) => string;  // the label of dots merged because they overlap (addendum 136)
  quietAtRest?: boolean;                    // r.070 (addendum 155): nothing written at rest — a finger, a hover or a tap still shows the figures and the date
  ariaLabel: string;
}

/** Strictly increasing whole seconds; the last value in a second wins. Pure. */
export function toSeconds(points: { t: number; v: number }[]): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  for (const p of [...points].sort((a, b) => a.t - b.t)) {
    if (!Number.isFinite(p.v) || !Number.isFinite(p.t)) continue;
    const s = Math.floor(p.t / 1000);
    if (out.length && out[out.length - 1].time === s) out[out.length - 1].value = p.v; else out.push({ time: s, value: p.v });
  }
  return out;
}
/** The even clock: instant ↔ logical index (fractional allowed). Pure. */
export function clockOf(points: { t: number }[]): { t0: number; step: number; toLogical: (ms: number) => number; toMs: (l: number) => number } {
  const t0 = points.length ? points[0].t : 0;
  const step = points.length > 1 ? (points[points.length - 1].t - t0) / (points.length - 1) : 1;
  return { t0, step, toLogical: (ms) => (ms - t0) / step, toMs: (l) => t0 + l * step };
}
/** The height (px) of the date strip under the plot the tilted marks need — their own strip, so the value scale never runs into it. Pure. */
export function axisPx(angle: RCoreAngle, tall: boolean): number {
  return angle === 0 ? 22 : angle === 90 ? (tall ? 84 : 56) : tall ? (angle === 45 ? 74 : 62) : 46;
}
/** Round value-scale marks (1 · 2 · 5 × 10ⁿ) covering [lo, hi], about `n` of them. Pure. */
export function niceTicks(lo: number, hi: number, n = 5): number[] {
  if (!(hi > lo)) { const d = Math.abs(lo) || 1; lo -= d / 2; hi += d / 2; }
  const raw = (hi - lo) / Math.max(1, n), mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag;
  const step = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * mag;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}
/** Keep a view window inside the data and between the smallest and widest spans allowed. Pure. */
export function clampView(from: number, to: number, lo: number, hi: number, minSpan: number): { from: number; to: number } {
  const full = Math.max(minSpan, hi - lo);
  let span = Math.min(full, Math.max(minSpan, to - from));
  let f = from + (to - from - span) / 2;
  f = Math.max(lo, Math.min(hi - span, f));
  if (hi - lo < span) { f = lo; span = hi - lo || span; }
  return { from: f, to: f + span };
}
/** The value of a line at instant ms (the last sample at or before it for a step line; linear otherwise). Pure. */
export function valueAt(points: { t: number; v: number }[], ms: number, step = true): number | null {
  if (!points.length || ms < points[0].t) return null;
  let lo = 0, hi = points.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (points[m].t <= ms) lo = m; else hi = m - 1; }
  const a = points[lo], b = points[lo + 1];
  return step || !b ? a.v : a.v + ((ms - a.t) / (b.t - a.t)) * (b.v - a.v);
}

export { layoutMarks, type MarkDot, type MarkLabel } from "@/lib/2525-core/mark-layout";   // r.073: the mark rule lives in a pure module (addendum 171)

function cssColor(el: HTMLElement, prop: string, fallback: string): string {
  try { const v = getComputedStyle(el).getPropertyValue(prop).trim(); return v ? (v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl") ? v : `hsl(${v})`) : fallback; } catch { return fallback; }
}
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

export function RCoreChart({ lines, marks = [], height = 280, initialRange, formatValue, ticksFor, formatTick, angle = 0, tall = false, readout, readoutAt, formatSelected, formatMarkSum, quietAtRest = false, ariaLabel }: RCoreChartProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ lines, marks, height, formatValue, ticksFor, formatTick, angle, tall, readout, readoutAt, formatSelected, formatMarkSum, quietAtRest });
  live.current = { lines, marks, height, formatValue, ticksFor, formatTick, angle, tall, readout, readoutAt, formatSelected, formatMarkSum, quietAtRest };
  const view = useRef<{ from: number; to: number } | null>(null);
  const cross = useRef<number | null>(null);
  const pinned = useRef<number | null>(null);   // addendum 134 "click on map to see a specific day": a tap pins the day until the next tap
  const draw = useRef<() => void>(() => {});
  const plot = useRef({ x0: 40, x1: 300 });   // the plot's left and right edge in px, written by the painter, read by the gestures
  const pts0 = lines[0]?.points ?? [];
  const dataLo = pts0.length ? pts0[0].t : 0, dataHi = pts0.length ? pts0[pts0.length - 1].t : 1;
  const minSpan = pts0.length > 1 ? Math.max(60_000, ((dataHi - dataLo) / (pts0.length - 1)) * 4) : 60_000;
  // a new data range or a new opening window puts the view back where the caller asked
  const viewKey = JSON.stringify([dataLo, dataHi, initialRange?.from, initialRange?.to]);
  const lastRange = useRef<{ from: number; to: number } | null>(null);
  const userView = useRef(false);   // the person moved or zoomed the view
  useEffect(() => {
    const nf = initialRange?.from ?? dataLo, nt = initialRange?.to ?? dataHi, prev = lastRange.current;
    lastRange.current = { from: nf, to: nt };
    // r.070 (AsM review — the class of the clock reset: the card chart lost a tap every second, the main chart every minute): a window
    // that only slides or grows with time keeps what the person did — their tapped day and their zoom; another span or card starts fresh
    const drift = !!prev && (Math.abs((nt - nf) - (prev.to - prev.from)) < 1 || (nf === prev.from && nt >= prev.to));
    if (drift && view.current && (userView.current || pinned.current !== null)) {
      view.current = clampView(view.current.from, view.current.to, dataLo, dataHi, minSpan);
      if (pinned.current !== null && (pinned.current < dataLo || pinned.current > dataHi)) pinned.current = null;
      draw.current();
      return;
    }
    userView.current = false;
    view.current = clampView(nf, nt, dataLo, dataHi, minSpan);
    pinned.current = null;
    draw.current();
  }, [viewKey]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const g0 = cv.getContext("2d"); if (!g0) return;
    const g = g0;
    let frame = 0;
    const paint = () => {
      frame = 0;
      const p = live.current, W = cv.clientWidth || 340, H = p.height, dpr = window.devicePixelRatio || 1;
      if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
      const v = view.current; const pts = p.lines[0]?.points ?? [];
      if (!v || !pts.length) return;
      const text = cssColor(cv, "--muted-foreground", "#94a3b8"), grid = cssColor(cv, "--border", "#334155");
      const strip = axisPx(p.angle, p.tall), plotH = H - strip;
      // value scale over what is in view (the top 30% kept clear for the figures, as before)
      let lo = Infinity, hi = -Infinity;
      for (const l of p.lines) for (let i = 0; i < l.points.length; i++) {
        const q = l.points[i], nx = l.points[i + 1];
        if ((nx ? nx.t : q.t) < v.from || q.t > v.to) continue;
        if (q.v < lo) lo = q.v; if (q.v > hi) hi = q.v;
      }
      if (!Number.isFinite(lo)) { lo = 0; hi = 1; }
      if (hi === lo) { const d = Math.abs(hi) || 1; lo -= d * 0.5; hi += d * 0.5; }
      const top = plotH * 0.3, bottom = plotH - plotH * 0.08;
      const ticksV = niceTicks(lo, hi, 4);
      g.font = `10px ${MONO}`;
      const scaleW = Math.ceil(Math.max(...ticksV.map((t) => g.measureText(p.formatValue(t)).width), 24)) + 10;
      const x0 = scaleW, x1 = W - 4;
      const X = (ms: number) => x0 + ((ms - v.from) / (v.to - v.from)) * (x1 - x0);
      const Y = (val: number) => bottom - ((val - lo) / (hi - lo)) * (bottom - top);
      // grid + left value scale
      g.strokeStyle = grid; g.lineWidth = 1; g.fillStyle = text; g.textAlign = "right"; g.textBaseline = "middle";
      for (const t of ticksV) { const y = Math.round(Y(t)) + 0.5; if (y < 2 || y > plotH - 2) continue; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); g.fillText(p.formatValue(t), x0 - 6, y); }
      g.beginPath(); g.moveTo(x0 + 0.5, 0); g.lineTo(x0 + 0.5, plotH); g.moveTo(x0, plotH + 0.5); g.lineTo(x1, plotH + 0.5); g.stroke();
      // the lines (clipped to the plot)
      g.save(); g.beginPath(); g.rect(x0 + 1, 0, x1 - x0 - 1, plotH); g.clip();
      for (const l of p.lines) {
        const L = l.points; if (!L.length) continue;
        let i = 0; while (i < L.length - 1 && L[i + 1].t < v.from) i++;
        g.beginPath(); g.strokeStyle = l.color; g.lineWidth = l.width ?? 2; g.setLineDash(l.dashed ? [5, 4] : []); g.lineJoin = "round";
        let first = true, py = 0;
        for (; i < L.length; i++) {
          const x = X(L[i].t), y = Y(L[i].v);
          if (first) { g.moveTo(x, y); first = false; } else if (l.step !== false) { g.lineTo(x, py); g.lineTo(x, y); } else g.lineTo(x, y);
          py = y;
          if (L[i].t > v.to) break;
        }
        g.stroke();
      }
      g.setLineDash([]);
      // the transactions (addendum 136): a very thin dotted vertical line at every one, deposits and spends alike
      g.save(); g.lineWidth = 0.75; g.setLineDash([1, 3]); g.globalAlpha = 0.7;
      for (const m of p.marks) {
        if (m.t < v.from || m.t > v.to) continue;
        const x = Math.round(X(m.t)) + 0.5;
        g.strokeStyle = m.color; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, plotH); g.stroke();
      }
      g.restore();
      // their dots and labels: overlapping dots merge into one, close ones place their labels around them
      g.font = `10px ${MONO}`;
      const R = 3.5, dots: MarkDot[] = [];
      for (const m of p.marks) {
        if (m.dot === false || m.t < v.from || m.t > v.to) continue;
        const val = valueAt(pts, m.t, p.lines[0]?.step !== false); if (val === null) continue;
        const text = m.text ?? "";
        dots.push({ x: X(m.t), y: Math.max(16, Y(val) - 10), text, w: g.measureText(text).width, value: m.value, color: m.color });
      }
      const placed = layoutMarks(dots, R, p.formatMarkSum);
      for (const lb of placed) { g.fillStyle = lb.color; g.beginPath(); g.arc(lb.dotX, lb.dotY, R, 0, Math.PI * 2); g.fill(); }
      g.restore();
      // r.066: the labels are drawn OUTSIDE the plot's clip and kept on the canvas — r.065 cut "−$14.69" to "69" at the left edge
      g.font = `10px ${MONO}`;
      for (const lb of placed) {
        if (!lb.text) continue;
        const w = g.measureText(lb.text).width;
        const left = lb.align === "right" ? lb.x - w : lb.align === "center" ? lb.x - w / 2 : lb.x;
        const shift = Math.max(2 - left, Math.min(0, W - 2 - (left + w)));
        g.fillStyle = lb.color; g.textAlign = lb.align; g.textBaseline = lb.base; g.fillText(lb.text, lb.x + shift, lb.y);
      }
      // the selected instant: the finger's (solid), the tapped day or now (dashed) — and its figures beside the line
      const sel = cross.current ?? pinned.current ?? p.readoutAt ?? null;
      const quiet = p.quietAtRest && cross.current === null && pinned.current === null;   // r.070: at rest, the line only
      if (sel !== null && p.readout) {
        const x = X(sel);
        if (x >= x0 && x <= x1) {
          g.save(); g.strokeStyle = text; g.globalAlpha = cross.current === null ? 0.6 : 0.9; g.setLineDash(cross.current === null ? [3, 3] : []);
          g.beginPath(); g.moveTo(Math.round(x) + 0.5, 0); g.lineTo(Math.round(x) + 0.5, plotH); g.stroke(); g.restore();
          g.save(); g.font = `600 11px ${MONO}`; g.textBaseline = "top";
          const flip = x > x0 + (x1 - x0) * 0.55; g.textAlign = flip ? "right" : "left";
          if (!quiet) p.readout(sel).forEach((f, i) => { g.fillStyle = f.color; g.fillText(f.text, flip ? x - 6 : x + 6, 4 + i * 14); });
          g.restore();
        }
      }
      // the date strip: marks tilted per Settings, re-chosen for the range in view
      const a = (p.angle * Math.PI) / 180, base = plotH + 6;
      g.save(); g.font = `10px ${MONO}`; g.fillStyle = text; g.strokeStyle = grid; g.lineWidth = 1;
      for (const tk of p.ticksFor(v.from, v.to)) {
        const x = X(tk); if (x < x0 - 2 || x > x1 + 2) continue;
        g.beginPath(); g.moveTo(Math.round(x) + 0.5, plotH); g.lineTo(Math.round(x) + 0.5, plotH + 4); g.stroke();
        const label = p.formatTick(tk);
        if (p.angle !== 0 && x - g.measureText(label).width * Math.cos(a) < 0) continue;   // a tilted date that would run off the left edge is skipped, never cut
        g.save(); g.translate(x, base);
        if (p.angle === 0) { const w = g.measureText(label).width; g.textAlign = x - w / 2 < 0 ? "left" : x + w / 2 > W ? "right" : "center"; g.textBaseline = "top"; g.fillText(label, 0, 0); }
        else { g.rotate(-a); g.textAlign = "right"; g.textBaseline = "middle"; g.fillText(label, 0, 0); }
        g.restore();
      }
      g.restore();
      // the selected instant's date, boxed and upright on the strip
      if (sel !== null && p.formatSelected && !quiet) {
        const x = X(sel);
        if (x >= x0 && x <= x1) {
          g.save(); g.font = `600 10px ${MONO}`;
          const label = p.formatSelected(sel), w = g.measureText(label).width + 8, h = 15, left = Math.max(0, Math.min(W - w, x - w / 2));
          // r.067 (addendum 149 "ensure day label does not cover x axis label · place above x axis with a 5-10 pixel gap"): the box sits
          // ABOVE the axis line, 7 px clear of it — the date marks in the strip below stay readable
          const top = plotH - 7 - h;
          g.fillStyle = cssColor(cv, "--background", "#0b0f14"); g.fillRect(left, top, w, h);
          g.strokeStyle = text; g.strokeRect(left + 0.5, top + 0.5, w - 1, h - 1);
          g.fillStyle = cssColor(cv, "--foreground", "#e5e7eb"); g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(label, left + 4, top + h / 2);
          g.restore();
        }
      }
      plot.current = { x0, x1 };
    };
    draw.current = () => { if (!frame) frame = requestAnimationFrame(paint); };
    paint();
    const ro = new ResizeObserver(() => draw.current());
    ro.observe(cv);
    return () => { ro.disconnect(); if (frame) cancelAnimationFrame(frame); draw.current = () => {}; };
  }, []);
  useEffect(() => { draw.current(); });

  // ── the gestures: drag pans · two fingers pinch · wheel zooms · tap pins a day · a mouse hovering shows its instant ──
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: "pan" | "pinch"; x: number; d: number; from: number; to: number; t: number; moved: boolean } | null>(null);
  const msAt = (clientX: number) => {
    const cv = canvas.current, v = view.current; if (!cv || !v) return null;
    const r = cv.getBoundingClientRect(), { x0, x1 } = plot.current, x = clientX - r.left;
    if (x < x0 || x > x1) return null;
    return v.from + ((x - x0) / (x1 - x0)) * (v.to - v.from);
  };
  const zoomAbout = (anchorMs: number, factor: number, base = view.current) => {
    if (!base) return;
    const f = anchorMs - (anchorMs - base.from) * factor, t = anchorMs + (base.to - anchorMs) * factor;
    view.current = clampView(f, t, dataLo, dataHi, minSpan);
    draw.current();
  };
  useEffect(() => {
    const cv = canvas.current; if (!cv) return;
    const onWheel = (e: WheelEvent) => {
      const at = msAt(e.clientX); if (at === null || !view.current) return;
      e.preventDefault(); userView.current = true;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        const v = view.current, shift = (e.deltaX / Math.max(1, plot.current.x1 - plot.current.x0)) * (v.to - v.from);
        view.current = clampView(v.from + shift, v.to + shift, dataLo, dataHi, minSpan); draw.current();
      } else zoomAbout(at, Math.exp(e.deltaY * 0.0015));
    };
    cv.addEventListener("wheel", onWheel, { passive: false });
    return () => cv.removeEventListener("wheel", onWheel);
  });
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* capture is a nicety */ }
    const v = view.current; if (!v) return;
    const ps = Array.from(ptrs.current.values());
    if (ps.length >= 2) gesture.current = { kind: "pinch", x: (ps[0].x + ps[1].x) / 2, d: Math.max(8, Math.abs(ps[0].x - ps[1].x)), from: v.from, to: v.to, t: e.timeStamp, moved: true };
    else gesture.current = { kind: "pan", x: e.clientX, d: 0, from: v.from, to: v.to, t: e.timeStamp, moved: false };
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const gs = gesture.current;
    if (!gs) { if (e.pointerType === "mouse") { cross.current = msAt(e.clientX); draw.current(); } return; }
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = Array.from(ptrs.current.values()), span = plot.current.x1 - plot.current.x0;
    if (gs.kind === "pinch" && ps.length >= 2) {
      userView.current = true;
      const d = Math.max(8, Math.abs(ps[0].x - ps[1].x)), mid = (ps[0].x + ps[1].x) / 2;
      const anchor = gs.from + ((gs.x - (canvas.current?.getBoundingClientRect().left ?? 0) - plot.current.x0) / span) * (gs.to - gs.from);
      const pan = ((mid - gs.x) / span) * ((gs.to - gs.from) * (gs.d / d));
      zoomAbout(anchor, gs.d / d, { from: gs.from - pan, to: gs.to - pan });
    } else if (gs.kind === "pan") {
      const dx = e.clientX - gs.x;
      if (Math.abs(dx) > 6) gs.moved = true;
      if (gs.moved) { userView.current = true; const shift = (-dx / span) * (gs.to - gs.from); view.current = clampView(gs.from + shift, gs.to + shift, dataLo, dataHi, minSpan); }
      if (e.pointerType === "mouse") cross.current = msAt(e.clientX);
      draw.current();
    }
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const gs = gesture.current;
    ptrs.current.delete(e.pointerId);
    if (gs?.kind === "pan" && !gs.moved && e.type === "pointerup") { const at = msAt(e.clientX); if (at !== null) { pinned.current = at; draw.current(); } }
    if (ptrs.current.size === 0) gesture.current = null;
    else if (gs?.kind === "pinch") { const v = view.current, q = Array.from(ptrs.current.values())[0]; if (v && q) gesture.current = { kind: "pan", x: q.x, d: 0, from: v.from, to: v.to, t: e.timeStamp, moved: true }; }
  };
  return (
    <div data-rcore-chart-wrap className="relative">
      <canvas ref={canvas} data-rcore-chart role="img" aria-label={ariaLabel} style={{ height, width: "100%", display: "block", touchAction: "pan-y" }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        onPointerLeave={(e) => { if (e.pointerType === "mouse" && !gesture.current) { cross.current = null; draw.current(); } }} />
    </div>
  );
}
