"use client";
/**
 * R-CORE CHART — the one financial/time-series chart every 2525 surface reuses (operator 2026-10-02, addendum 124: "RCORE RESUSE MAXIMIZE
 * OF FINANCIAL CHART; you need … way better charting engine"; his pick: TradingView Lightweight Charts). Financial-2525 is the first
 * consumer ($/min). Loaded in the browser only (a dynamic import inside an effect: the static export never touches a canvas).
 *
 * Contract:
 * - lines of { t (ms), v } sampled on ONE EVEN clock over a WIDE range (addendum 130 "pinch zoom on table shows more dates · 30D means
 *   cost split into 30 days, not necessarily range of x axis"): the chart opens on `initialRange` and the person pinches / drags to see
 *   more or fewer dates; nothing is re-computed, the engine just moves its window.
 * - everything written on the plot is drawn BY THE ENGINE on its canvas, inside its own frame (addendum 130 "use more advanced table
 *   from html to js that best supports interactive nature of real-time charts"): the date marks, tilted at the Settings angle
 *   (addendum 129 "remember text tilts per settings"), re-chosen for whatever range is in view; and the figures — numbers only, each in
 *   its line's colour, beside the vertical line of the selected instant (addendum 129) — the finger's instant, else `readoutAt` (now).
 * - ONE left value scale (addendum 101 "$ on left y axis"). Colours from the caller (the 13-colour palette); transparent ground.
 */
import { useEffect, useRef } from "react";

export interface RCoreLine { id: string; color: string; points: { t: number; v: number }[]; step?: boolean; dashed?: boolean; width?: 1 | 2 | 3 }
export interface RCoreMark { t: number; color: string; text?: string }
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
  ariaLabel: string;
}

/** Strictly increasing whole seconds (the engine's rule); the last value in a second wins. Pure. */
export function toSeconds(points: { t: number; v: number }[]): { time: number; value: number }[] {
  const out: { time: number; value: number }[] = [];
  for (const p of [...points].sort((a, b) => a.t - b.t)) {
    if (!Number.isFinite(p.v) || !Number.isFinite(p.t)) continue;
    const s = Math.floor(p.t / 1000);
    if (out.length && out[out.length - 1].time === s) out[out.length - 1].value = p.v; else out.push({ time: s, value: p.v });
  }
  return out;
}
/** The even clock: instant ↔ logical index (fractional allowed), so any instant maps to the engine's x. Pure. */
export function clockOf(points: { t: number }[]): { t0: number; step: number; toLogical: (ms: number) => number; toMs: (l: number) => number } {
  const t0 = points.length ? points[0].t : 0;
  const step = points.length > 1 ? (points[points.length - 1].t - t0) / (points.length - 1) : 1;
  return { t0, step, toLogical: (ms) => (ms - t0) / step, toMs: (l) => t0 + l * step };
}
/** The height (px) of the date strip under the plot the tilted marks need — their own strip, so the value scale never runs into it. Pure. */
export function axisPx(angle: RCoreAngle, tall: boolean): number {
  return angle === 0 ? 22 : angle === 90 ? (tall ? 84 : 56) : tall ? (angle === 45 ? 74 : 62) : 46;
}

function cssColor(el: HTMLElement, prop: string, fallback: string): string {
  try { const v = getComputedStyle(el).getPropertyValue(prop).trim(); return v ? (v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl") ? v : `hsl(${v})`) : fallback; } catch { return fallback; }
}

export function RCoreChart({ lines, marks = [], height = 280, initialRange, formatValue, ticksFor, formatTick, angle = 0, tall = false, readout, readoutAt, formatSelected, ariaLabel }: RCoreChartProps) {
  const box = useRef<HTMLDivElement>(null);
  // the latest props, read by the canvas painter every frame (so a new format or figure set never rebuilds the chart)
  const live = useRef({ formatValue, ticksFor, formatTick, angle, tall, readout, readoutAt, formatSelected });
  live.current = { formatValue, ticksFor, formatTick, angle, tall, readout, readoutAt, formatSelected };
  const redraw = useRef<() => void>(() => {});
  useEffect(() => { redraw.current(); });
  const key = JSON.stringify([lines.map((l) => [l.id, l.color, l.step, l.dashed, l.width, l.points.length, l.points[0]?.t, l.points[l.points.length - 1]?.t, l.points.reduce((a, p) => a + p.v, 0)]), marks, height, initialRange, angle, tall]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    let dead = false; let cleanup = () => {};
    void import("lightweight-charts").then((lw) => {
      if (dead || !box.current) return;
      const text = cssColor(el, "--muted-foreground", "#94a3b8"), grid = cssColor(el, "--border", "#334155");
      const chart = lw.createChart(el, {
        width: el.clientWidth || 340, height,
        layout: { background: { type: lw.ColorType.Solid, color: "transparent" }, attributionLogo: false, textColor: text, fontSize: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
        grid: { vertLines: { visible: false }, horzLines: { color: grid } },
        leftPriceScale: { visible: true, borderColor: grid, scaleMargins: { top: 0.3, bottom: 0.08 } },   // the top third for the figures
        rightPriceScale: { visible: false },
        timeScale: { visible: true, borderColor: grid, minimumHeight: axisPx(angle, tall), tickMarkFormatter: () => "", minBarSpacing: 0.05, rightOffset: 0 },   // the strip is ours: the engine draws no labels in it, our painter draws the tilted dates
        localization: { priceFormatter: (v: number) => live.current.formatValue(v) },
        crosshair: { mode: lw.CrosshairMode.Normal, horzLine: { visible: false, labelVisible: false }, vertLine: { labelVisible: false } },
        handleScroll: { vertTouchDrag: false, horzTouchDrag: true, mouseWheel: true, pressedMouseMove: true },
        handleScale: { pinch: true, mouseWheel: true, axisPressedMouseMove: false },
      } as never);
      const clock = clockOf(lines[0]?.points ?? []);
      const made: ReturnType<typeof chart.addSeries>[] = [];
      for (const l of lines) {
        const s = chart.addSeries(lw.LineSeries, { color: l.color, lineWidth: l.width ?? 2, lineType: l.step ? lw.LineType.WithSteps : lw.LineType.Simple, lineStyle: l.dashed ? lw.LineStyle.Dashed : lw.LineStyle.Solid, priceScaleId: "left", lastValueVisible: false, priceLineVisible: false } as never);
        s.setData(toSeconds(l.points) as never);
        made.push(s);
      }
      const anchor = made[0];
      if (anchor && marks.length) lw.createSeriesMarkers(anchor, marks.map((m) => ({ time: Math.floor(m.t / 1000), position: "aboveBar", color: m.color, shape: "circle", text: m.text })).sort((a, b) => a.time - b.time) as never);
      const ts = chart.timeScale();
      if (initialRange) ts.setVisibleLogicalRange({ from: clock.toLogical(initialRange.from), to: clock.toLogical(initialRange.to) });
      else ts.fitContent();
      // THE PAINTER — the date marks and the figures, drawn by the engine inside its own frame on every pan, pinch and finger move
      let cross: number | null = null;
      let pinned: number | null = null;   // addendum 134 "click on map to see a specific day": a tap pins the day until the next tap
      let request = () => {};
      // instant → x: the nearest sample's own coordinate, plus the fraction of a bar (time-to-coordinate is exact for a sampled instant)
      const secs = toSeconds(lines[0]?.points ?? []).map((q) => q.time);
      const xAt = (ms: number) => {
        if (!secs.length) return null;
        const l = clock.toLogical(ms), i = Math.max(0, Math.min(secs.length - 2, Math.floor(l)));
        const a = ts.timeToCoordinate(secs[i] as never), b = ts.timeToCoordinate(secs[i + 1] as never);
        if (a === null || b === null) return null;
        return Number(a) + (l - i) * (Number(b) - Number(a));
      };
      const painter = {
        draw(target: { useMediaCoordinateSpace: <T>(f: (s: { context: CanvasRenderingContext2D; mediaSize: { width: number; height: number } }) => T) => T }) {
          target.useMediaCoordinateSpace(({ context: g, mediaSize: { width: W, height: H } }) => {
            const p = live.current, vr = ts.getVisibleLogicalRange();
            if (!vr) return;
            // the selected instant: the finger's, else now — a thin line (the engine draws its own under the finger) and the figures
            const base = H;
            const sel = cross ?? pinned ?? p.readoutAt ?? null; if (sel === null || !p.readout) return;
            const x = xAt(sel); if (x === null || x < 0 || x > W) return;
            if (cross === null) { g.save(); g.strokeStyle = text; g.globalAlpha = 0.6; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, base - 8); g.stroke(); g.restore(); }
            const figs = p.readout(sel);
            g.save(); g.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace"; g.textBaseline = "top";
            const flip = x > W * 0.55; g.textAlign = flip ? "right" : "left";
            figs.forEach((f, i) => { g.fillStyle = f.color; g.fillText(f.text, flip ? x - 6 : x + 6, 4 + i * 14); });
            g.restore();
          });
        },
      };
      const axisPainter = {
        draw(target: { useMediaCoordinateSpace: <T>(f: (s: { context: CanvasRenderingContext2D; mediaSize: { width: number; height: number } }) => T) => T }) {
          target.useMediaCoordinateSpace(({ context: g, mediaSize: { width: W } }) => {
            const p = live.current, vr = ts.getVisibleLogicalRange();
            if (!vr) return;
            const from = clock.toMs(Number(vr.from)), to = clock.toMs(Number(vr.to));
            // the dates, tilted per Settings
            const base = 6, a = (p.angle * Math.PI) / 180;
            g.save(); g.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace"; g.fillStyle = text; g.strokeStyle = grid; g.lineWidth = 1;
            const tks = p.ticksFor(from, to);
            for (const tk of tks) {
              const x = xAt(tk); if (x === null || x < -2 || x > W + 2) continue;
              g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, 4); g.stroke();
              const label = p.formatTick(tk);
              if (p.angle !== 0 && x - g.measureText(label).width * Math.cos(a) < 0) continue;   // a tilted date that would run off the left edge is skipped, never cut
              g.save(); g.translate(x, base);
              if (p.angle === 0) { const w = g.measureText(label).width; g.textAlign = x - w / 2 < 0 ? "left" : x + w / 2 > W ? "right" : "center"; g.textBaseline = "top"; g.fillText(label, 0, 0); }
              else { g.rotate(-a); g.textAlign = "right"; g.textBaseline = "middle"; g.fillText(label, 0, 0); }
              g.restore();
            }
            g.restore();
            // the selected instant's date, boxed and upright on the strip — the finger's, the tapped day, else now
            const sel = cross ?? pinned ?? p.readoutAt ?? null;
            if (sel !== null && p.formatSelected) {
              const x = xAt(sel);
              if (x !== null && x >= 0 && x <= W) {
                g.save(); g.font = "600 10px ui-monospace, SFMono-Regular, Menlo, monospace";
                const label = p.formatSelected(sel), w = g.measureText(label).width + 8, h = 15;
                const left = Math.max(0, Math.min(W - w, x - w / 2));
                g.fillStyle = cssColor(el, "--background", "#0b0f14"); g.fillRect(left, 2, w, h);
                g.strokeStyle = text; g.lineWidth = 1; g.strokeRect(left + 0.5, 2.5, w - 1, h - 1);
                g.fillStyle = cssColor(el, "--foreground", "#e5e7eb"); g.textAlign = "left"; g.textBaseline = "middle"; g.fillText(label, left + 4, 2 + h / 2);
                g.restore();
              }
            }
          });
        },
      };
      const primitive = {
        attached: (prm: { requestUpdate: () => void }) => { request = prm.requestUpdate; },
        detached: () => { request = () => {}; },
        updateAllViews: () => {},
        paneViews: () => [{ zOrder: () => "top", renderer: () => painter }],
        timeAxisPaneViews: () => [{ zOrder: () => "top", renderer: () => axisPainter }],
      };
      anchor?.attachPrimitive(primitive as never);
      redraw.current = () => request();
      chart.subscribeCrosshairMove((pr: { time?: unknown; logical?: number }) => { cross = typeof pr.logical === "number" ? clock.toMs(pr.logical) : typeof pr.time === "number" ? pr.time * 1000 : null; request(); });
      ts.subscribeVisibleLogicalRangeChange(() => request());
      chart.subscribeClick((pr: { logical?: number; time?: unknown }) => { pinned = typeof pr.logical === "number" ? clock.toMs(pr.logical) : typeof pr.time === "number" ? pr.time * 1000 : pinned; request(); });
      const ro = new ResizeObserver(() => { if (box.current) chart.applyOptions({ width: box.current.clientWidth }); });
      ro.observe(el);
      cleanup = () => { ro.disconnect(); redraw.current = () => {}; chart.remove(); };
    }).catch(() => { /* the engine failed to load: the surface's own numbers still stand */ });
    return () => { dead = true; cleanup(); };
  }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div data-rcore-chart-wrap className="relative">
      <div ref={box} data-rcore-chart role="img" aria-label={ariaLabel} style={{ height, width: "100%", touchAction: "pan-y" }} />
      {/* the engine's licence asks for its attribution on the page: a quiet credit line instead of a logo over the lines */}
      <a data-rcore-chart-credit href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="block text-right font-mono text-[9px] text-muted-foreground opacity-60">Lightweight Charts™ · TradingView</a>
    </div>
  );
}
