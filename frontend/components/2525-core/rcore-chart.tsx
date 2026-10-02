"use client";
/**
 * R-CORE CHART — the one financial/time-series chart every 2525 surface reuses (operator 2026-10-02, addendum 124: "RCORE RESUSE MAXIMIZE
 * OF FINANCIAL CHART; you need … way better charting engine"; his pick: TradingView Lightweight Charts). Financial-2525 is the first
 * consumer ($/min). Loaded in the browser only (a dynamic import inside an effect: the static export never touches a canvas).
 *
 * Contract: lines of { t (ms), v } on ONE left value scale (addendum 101 "$ on left y axis"), drawn as steps or straight, with optional
 * marks; time labels and values formatted by the caller (so CST dates, A.B..C, any currency stay the surface's own); every crosshair
 * move reports the instant under the finger so the surface's numbers in the upper right can follow it (addendum 123, Security-2525 style).
 * Colours come from the caller (the 13-colour palette); the ground is transparent so the card's theme shows through.
 */
import { useEffect, useRef } from "react";

export interface RCoreLine { id: string; color: string; points: { t: number; v: number }[]; step?: boolean; dashed?: boolean; width?: 1 | 2 | 3 }
export interface RCoreMark { t: number; color: string; text?: string }
export interface RCoreChartProps {
  lines: RCoreLine[];
  marks?: RCoreMark[];
  height?: number;
  formatValue: (v: number) => string;
  formatTime: (ms: number) => string;     // crosshair label
  formatTick: (ms: number, intraday: boolean) => string;     // axis tick label (intraday = the engine is marking hours, not days)
  onCrosshair?: (ms: number | null) => void;
  ariaLabel: string;
  now?: number;                           // a thin vertical NOW line
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

function cssColor(el: HTMLElement, prop: string, fallback: string): string {
  try { const v = getComputedStyle(el).getPropertyValue(prop).trim(); return v ? (v.startsWith("#") || v.startsWith("rgb") || v.startsWith("hsl") ? v : `hsl(${v})`) : fallback; } catch { return fallback; }
}

export function RCoreChart({ lines, marks = [], height = 200, formatValue, formatTime, formatTick, onCrosshair, ariaLabel, now }: RCoreChartProps) {
  const box = useRef<HTMLDivElement>(null);
  const fmt = useRef({ formatValue, formatTime, formatTick, onCrosshair });
  fmt.current = { formatValue, formatTime, formatTick, onCrosshair };
  const key = JSON.stringify([lines.map((l) => [l.id, l.color, l.step, l.dashed, l.width, l.points.length, l.points[0]?.t, l.points[l.points.length - 1]?.t, l.points.reduce((a, p) => a + p.v, 0)]), marks, now, height]);
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
        leftPriceScale: { visible: true, borderColor: grid, scaleMargins: { top: 0.4, bottom: 0.08 } },   // room at the top for the numbers in the upper right
        rightPriceScale: { visible: false },
        timeScale: { borderColor: grid, timeVisible: true, secondsVisible: false, fixLeftEdge: true, fixRightEdge: true, minBarSpacing: 0.2, tickMarkFormatter: (time: number, kind: number) => fmt.current.formatTick(Number(time) * 1000, kind >= 3) },
        localization: { priceFormatter: (v: number) => fmt.current.formatValue(v), timeFormatter: (time: number) => fmt.current.formatTime(Number(time) * 1000) },
        crosshair: { mode: lw.CrosshairMode.Normal },
        handleScroll: { vertTouchDrag: false },
      } as never);
      const made: ReturnType<typeof chart.addSeries>[] = [];
      for (const l of lines) {
        const s = chart.addSeries(lw.LineSeries, { color: l.color, lineWidth: l.width ?? 2, lineType: l.step ? lw.LineType.WithSteps : lw.LineType.Simple, lineStyle: l.dashed ? lw.LineStyle.Dashed : lw.LineStyle.Solid, priceScaleId: "left", lastValueVisible: false, priceLineVisible: false } as never);
        s.setData(toSeconds(l.points) as never);
        made.push(s);
      }
      const anchor = made[0];
      if (anchor) {
        const ms = [...marks, ...(now ? [{ t: now, color: text, text: "" }] : [])];
        if (ms.length) lw.createSeriesMarkers(anchor, ms.map((m) => ({ time: Math.floor(m.t / 1000), position: "aboveBar", color: m.color, shape: m.text === "" ? "arrowDown" : "circle", text: m.text })).sort((a, b) => a.time - b.time) as never);
      }
      chart.timeScale().fitContent();
      chart.subscribeCrosshairMove((p: { time?: unknown }) => fmt.current.onCrosshair?.(typeof p.time === "number" ? p.time * 1000 : null));
      const ro = new ResizeObserver(() => { if (box.current) chart.applyOptions({ width: box.current.clientWidth }); });
      ro.observe(el);
      cleanup = () => { ro.disconnect(); chart.remove(); };
    }).catch(() => { /* the engine failed to load: the surface's numbers still stand */ });
    return () => { dead = true; cleanup(); };
  }, [key]);   // eslint-disable-line react-hooks/exhaustive-deps
  // the engine's licence asks for its attribution on the page: a quiet credit line under the plot instead of a logo over the lines
  return (
    <div data-rcore-chart-wrap>
      <div ref={box} data-rcore-chart role="img" aria-label={ariaLabel} style={{ height, width: "100%" }} />
      <a data-rcore-chart-credit href="https://www.tradingview.com/" target="_blank" rel="noopener noreferrer" className="block text-right font-mono text-[9px] text-muted-foreground opacity-60">Lightweight Charts™ · TradingView</a>
    </div>
  );
}
