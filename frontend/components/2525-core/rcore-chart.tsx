"use client";
/**
 * R-CORE CHART — the one financial/time-series chart every 2525 surface reuses (operator 2026-10-02, addendum 124: "RCORE RESUSE MAXIMIZE
 * OF FINANCIAL CHART; you need … way better charting engine"; his pick: TradingView Lightweight Charts). Financial-2525 is the first
 * consumer ($/min). Loaded in the browser only (a dynamic import inside an effect: the static export never touches a canvas).
 *
 * Contract: lines of { t (ms), v } sampled on an EVEN clock (the engine spaces points evenly), on ONE left value scale (addendum 101
 * "$ on left y axis"), drawn as steps or straight, with optional marks. The date axis is the surface's own — HTML under the plot,
 * tilted at the angle the person picked in Settings (addendum 129 "remember text tilts per settings"). The readout is FIGURES ONLY,
 * each in its line's colour, beside the vertical line of the selected instant (addendum 129 "have numbers only in same color as line
 * … just figures near vertical line on selected date"): the finger's instant while touching, else `readoutAt` (now).
 * Colours come from the caller (the 13-colour palette); the ground is transparent so the card's theme shows through.
 */
import { useEffect, useRef, useState } from "react";

export interface RCoreLine { id: string; color: string; points: { t: number; v: number }[]; step?: boolean; dashed?: boolean; width?: 1 | 2 | 3 }
export interface RCoreMark { t: number; color: string; text?: string }
export interface RCoreFigure { color: string; text: string }
export type RCoreAngle = 0 | 30 | 45 | 90;
export interface RCoreChartProps {
  lines: RCoreLine[];
  marks?: RCoreMark[];
  height?: number;
  formatValue: (v: number) => string;
  ticks: number[];                         // the instants the date axis labels (the surface chooses how many fit)
  formatTick: (ms: number) => string;
  angle?: RCoreAngle;                      // the Settings angle for the date text
  tall?: boolean;                          // long labels (a full date) need more room when tilted
  readout?: (ms: number) => RCoreFigure[]; // the figures beside the selected instant's line
  readoutAt?: number;                      // the instant shown when nothing is touched (now)
  onCrosshair?: (ms: number | null) => void;
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
/** x of an instant between two known (instant, x) anchors — the points are on an even clock, so time maps linearly. Pure. */
export function xBetween(ms: number, a: { t: number; x: number }, b: { t: number; x: number }): number {
  return b.t === a.t ? a.x : a.x + ((ms - a.t) / (b.t - a.t)) * (b.x - a.x);
}

function cssColor(el: HTMLElement, prop: string, fallback: string): string {
  try { const v = getComputedStyle(el).getPropertyValue(prop).trim(); return v ? (v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl") ? v : `hsl(${v})`) : fallback; } catch { return fallback; }
}

export function RCoreChart({ lines, marks = [], height = 200, formatValue, ticks, formatTick, angle = 0, tall = false, readout, readoutAt, onCrosshair, ariaLabel }: RCoreChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const fmt = useRef({ formatValue, onCrosshair });
  fmt.current = { formatValue, onCrosshair };
  // the two anchors that map time → x (first and last sample), re-read whenever the plot moves or resizes
  const [geo, setGeo] = useState(null as null | { a: { t: number; x: number }; b: { t: number; x: number }; w: number });
  const [cross, setCross] = useState(null as null | { ms: number; x: number });
  const key = JSON.stringify([lines.map((l) => [l.id, l.color, l.step, l.dashed, l.width, l.points.length, l.points[0]?.t, l.points[l.points.length - 1]?.t, l.points.reduce((a, p) => a + p.v, 0)]), marks, height]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    let dead = false; let cleanup = () => {};
    void import("lightweight-charts").then((lw) => {
      if (dead || !box.current) return;
      const text = cssColor(el, "--muted-foreground", "#94a3b8"), grid = cssColor(el, "--border", "#334155");
      const chart = lw.createChart(el, {
        width: el.clientWidth || 340, height,
        layout: { background: { type: lw.ColorType.Solid, color: "transparent" }, attributionLogo: false, textColor: text, fontSize: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
        grid: { vertLines: { color: grid }, horzLines: { color: grid } },
        leftPriceScale: { visible: true, borderColor: grid, scaleMargins: { top: 0.32, bottom: 0.08 } },   // the top third stays clear for the figures beside the selected line
        rightPriceScale: { visible: false },
        timeScale: { visible: false, fixLeftEdge: true, fixRightEdge: true, minBarSpacing: 0.2 },   // the date axis is ours (tilts per Settings)
        localization: { priceFormatter: (v: number) => fmt.current.formatValue(v) },
        crosshair: { mode: lw.CrosshairMode.Normal, horzLine: { visible: false, labelVisible: false }, vertLine: { labelVisible: false } },
        handleScroll: { vertTouchDrag: false },
      } as never);
      const made: ReturnType<typeof chart.addSeries>[] = [];
      const all = lines.flatMap((l) => toSeconds(l.points));
      for (const l of lines) {
        const s = chart.addSeries(lw.LineSeries, { color: l.color, lineWidth: l.width ?? 2, lineType: l.step ? lw.LineType.WithSteps : lw.LineType.Simple, lineStyle: l.dashed ? lw.LineStyle.Dashed : lw.LineStyle.Solid, priceScaleId: "left", lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: true } as never);
        s.setData(toSeconds(l.points) as never);
        made.push(s);
      }
      const anchor = made[0];
      if (anchor && marks.length) lw.createSeriesMarkers(anchor, marks.map((m) => ({ time: Math.floor(m.t / 1000), position: "aboveBar", color: m.color, shape: "circle", text: m.text })).sort((a, b) => a.time - b.time) as never);
      chart.timeScale().fitContent();
      const t0 = all.length ? Math.min(...all.map((p) => p.time)) : 0, t1 = all.length ? Math.max(...all.map((p) => p.time)) : 0;
      const measure = () => {
        const ts = chart.timeScale(); const x0 = ts.timeToCoordinate(t0 as never), x1 = ts.timeToCoordinate(t1 as never);
        const off = chart.priceScale("left").width();
        if (x0 !== null && x1 !== null) setGeo({ a: { t: t0 * 1000, x: Number(x0) + off }, b: { t: t1 * 1000, x: Number(x1) + off }, w: el.clientWidth });
      };
      requestAnimationFrame(measure);
      chart.timeScale().subscribeVisibleLogicalRangeChange(() => requestAnimationFrame(measure));
      chart.subscribeCrosshairMove((p: { time?: unknown; point?: { x: number } }) => {
        const ms = typeof p.time === "number" ? p.time * 1000 : null;
        setCross(ms !== null && p.point ? { ms, x: p.point.x + chart.priceScale("left").width() } : null);
        fmt.current.onCrosshair?.(ms);
      });
      const ro = new ResizeObserver(() => { if (box.current) { chart.applyOptions({ width: box.current.clientWidth }); requestAnimationFrame(measure); } });
      ro.observe(el);
      cleanup = () => { ro.disconnect(); chart.remove(); };
    }).catch(() => { /* the engine failed to load: the surface's own numbers still stand */ });
    return () => { dead = true; cleanup(); };
  }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  const xOf = (ms: number): number | null => (geo ? xBetween(ms, geo.a, geo.b) : null);
  const selMs = cross?.ms ?? readoutAt ?? null;
  const selX = cross?.x ?? (readoutAt !== undefined ? xOf(readoutAt) : null);
  const figures = readout && selMs !== null ? readout(selMs) : [];
  const flip = !!geo && selX !== null && selX > geo.w * 0.55;   // past the middle, the figures sit on the line's LEFT
  const axisH = angle === 0 ? 16 : angle === 90 ? (tall ? 64 : 40) : tall ? (angle === 45 ? 56 : 44) : 32;
  return (
    <div data-rcore-chart-wrap className="relative">
      <div ref={box} data-rcore-chart role="img" aria-label={ariaLabel} style={{ height, width: "100%" }} />
      {/* the selected instant: a thin line when nothing is touched (the engine draws its own while the finger is down) */}
      {!cross && selX !== null && <div data-rcore-sel-line aria-hidden className="pointer-events-none absolute top-0 w-px bg-muted-foreground" style={{ left: selX, height, opacity: 0.6 }} />}
      {figures.length > 0 && selX !== null && (
        <div data-rcore-figures aria-live="polite" className="pointer-events-none absolute top-1 z-10 font-mono text-[11px] font-semibold leading-tight tabular-nums" style={flip ? { right: `calc(100% - ${selX - 6}px)`, textAlign: "right" } : { left: selX + 6 }}>
          {figures.map((f, i) => <div key={i} style={{ color: f.color }}>{f.text}</div>)}
        </div>
      )}
      {/* the date axis, tilted per Settings (0° · 30° · 45° · 90°) */}
      <div data-rcore-date-axis data-rcore-angle={angle} aria-hidden className="relative font-mono text-[10px] text-muted-foreground" style={{ height: axisH }}>
        {geo && ticks.map((tk) => { const x = xOf(tk); if (x === null) return null; const f = x / Math.max(1, geo.w); return <span key={tk} className="absolute top-0.5 whitespace-nowrap" style={{ left: x, transform: angle === 0 ? (f < 0.12 ? "translateX(0)" : f > 0.88 ? "translateX(-100%)" : "translateX(-50%)") : angle === 90 ? "translateX(-100%) rotate(-90deg)" : `translateX(-100%) rotate(-${angle}deg)`, transformOrigin: angle === 0 ? "50% 0" : "100% 0" }}>{formatTick(tk)}</span>; })}
      </div>
      {/* the engine's licence asks for its attribution on the page: a quiet credit line instead of a logo over the lines */}
      <a data-rcore-chart-credit href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="block text-right font-mono text-[9px] text-muted-foreground opacity-60">Lightweight Charts™ · TradingView</a>
    </div>
  );
}
