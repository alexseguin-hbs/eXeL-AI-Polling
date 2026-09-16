"use client";

// THE ARENA — the Texas Capitol lawn, drawn as edges, with the fidelity tier and what it dropped always on
// screen (U-WF-09: a cap is never silent). R-CORE interaction: drag rotates and tilts, wheel zooms — the same
// model every other 2525 surface speaks (lib/rcore-gestures.ts).
import { fill } from "@/lib/2525-core/fill";
import { classifyPress, isDoubleTap, type PointerSample } from "@/lib/drone-2525/tap-target";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type DomainSource } from "@/lib/drone-2525/arena-model";
import { worldAt } from "@/lib/drone-2525/world";
import { selectLod } from "@/lib/wire-core/wire-model";
import { motSpec, motLabel, type MotLevel } from "@/lib/wire-core/mot-ladder";
import { resolveHal, type HalChoice } from "@/lib/wire-core/hal";
import { initCal, calStep, calLinePrefix } from "@/lib/wire-core/calibrate";
import { streamAt, streamLabelParts, isReference } from "@/lib/wire-core/stream";
import { canonicalHash } from "@/lib/wire-core/wire-model";
import { semanticHex } from "@/lib/wire-core/palette";
import { VECTOR_LAW } from "@/lib/wire-core/vector-law";
import { fitToPane } from "@/lib/wire-core/scene-project";
import { RCORE_CFG, clamp, rightDrag, wheelZoom } from "@/lib/rcore-gestures";
import { useLexicon } from "@/lib/lexicon-context";
import { versionStamp } from "@/lib/2525-core/version-stamp";
import { WireSvg } from "./wire-svg";

/** What a layer drawn on top of the arena is given — the same world and the same camera, never a copy. */
export interface ArenaCtx {
  model: ReturnType<typeof worldAt>["model"];
  doors: ReturnType<typeof worldAt>["doors"];
  ground: ReturnType<typeof worldAt>["ground"];
  cam: { pw: number; ph: number; pitchDeg: number; bearingRad: number; pxPerM: number; originX?: number; originY?: number };
  stroke: (w: number) => number;
}

/**
 * A stroke-width scaler that is the SAME FUNCTION every render. It was written inline as `fw={(w) => w}`,
 * which gave it a new identity sixty times a second — and it is a dependency of WireSvg's projection memo,
 * so the memo never hit once and the full projection over every edge in the model re-ran every frame. A
 * one-line lambda was costing more than everything it was passed to.
 */
const SAME_WIDTH = (w: number) => w;

export function ArenaView({ source, level = "1.1", hal = "auto", reserve = 0, overlay, hudRight, hudLeft, onTap, drag: dragMode = "orbit", onLook }: {
  source: DomainSource;
  /** The rung being ASKED for, 1.1 … 5.5. Calibration may go below it and never above it. */
  level?: MotLevel;
  /** Which machine this is, or "auto" to let it decide from its own measured frame rate. */
  hal?: HalChoice;
  /**
   * Segments already spoken for by something drawn on top — the aircraft. ONE BUDGET, TWO CONSUMERS: in an
   * engagement the aircraft are the world, so they take their share first and the Capitol block gets what
   * is left. At a poor rung that means the block thins rather than the aircraft vanishing.
   */
  reserve?: number;
  /** Drawn in the arena's own camera, above the world and below the HUD. */
  overlay?: (ctx: ArenaCtx) => React.ReactNode;
  hudRight?: React.ReactNode;
  hudLeft?: React.ReactNode;
  /** A press that did not move: pixel position in the box, the camera it was made in, and whether it doubled. */
  onTap?: (px: number, py: number, ctx: ArenaCtx, double: boolean) => void;
  /** Who owns a drag. The schema's `dragView: 'gimbal look if HI'` — the aiming seat looks, anyone else orbits. */
  drag?: "orbit" | "look";
  onLook?: (dxPx: number, dyPx: number) => void;
}) {
  const { t } = useLexicon();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });
  const [pitch, setPitch] = useState(58);
  const [bearing, setBearing] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [cal, setCal] = useState(() => initCal(level, level));
  const [measuredFps, setMeasuredFps] = useState(0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  // Where the press began and the last tap, for tap-vs-drag and double-tap (tap-target.ts decides).
  const press = useRef<PointerSample | null>(null);
  const lastTap = useRef<PointerSample | null>(null);
  const machine = useMemo(() => resolveHal(hal, measuredFps), [hal, measuredFps]);
  const spec = useMemo(() => motSpec(cal.level), [cal.level]);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver((es) => { for (const e of es) setSize({ w: Math.max(280, e.contentRect.width), h: Math.max(320, e.contentRect.height) }); });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // A PERSON PICKING A RUNG GETS THAT RUNG. The first draft only raised the ceiling and let calibration
  // climb one step at a time, so choosing 5.5 showed 1.2 and the control looked broken. Asking is not
  // negotiating: the rung is set, and calibration may pull it back down if this machine cannot hold it —
  // which it will then say, in words, on the line below.
  useEffect(() => {
    setCal((s) => ({ ...s, cap: level, level, sensors: [...motSpec(level).sensors], streamIdx: 0, held: 0, reason: `asked for MoT ${level}` }));
  }, [level]);

  // The model is built once per curve budget — a tier changes what is DRAWN, never what is true.
  const { model, doors, ground } = useMemo(() => worldAt(source, spec.ngonSides, versionStamp()), [source, spec.ngonSides]);
  const hash = useMemo(() => canonicalHash(model), [model]);
  const worldBudget = Math.max(0, spec.segments - reserve);
  const lod = useMemo(() => selectLod(model, spec.maxLod, worldBudget), [model, spec.maxLod, worldBudget]);

  // Measure our own draw time and let the ladder decide — after the sensor's reserve is taken out.
  // Stamped in place rather than through an effect with no dependency array, which re-ran every render.
  const t0 = useRef(0);
  t0.current = typeof performance !== "undefined" ? performance.now() : t0.current;
  useEffect(() => {
    if (typeof performance === "undefined") return;
    const ms = performance.now() - t0.current;
    const id = window.setTimeout(() => {
      setMeasuredFps(ms > 0 ? 1000 / ms : 0);
      setCal((s) => calStep(s, { hal: machine, frameMs: ms }).state);
    }, 250);
    return () => window.clearTimeout(id);
  }, [model, lod, machine, pitch, bearing, zoom]);

  // Frame the world, then let the operator's zoom act on top of that frame — so a phone and a laptop both
  // open on the whole block rather than on whatever fraction of it a fixed scale happened to leave visible.
  const cam = useMemo(() => {
    const base = { pw: size.w, ph: size.h, pitchDeg: pitch, bearingRad: (bearing * Math.PI) / 180,
                   pxPerM: Math.min(size.w, size.h) / (source.arena.radiusM * 2.2) };
    // Reserve the bands the HUD actually occupies, measured in pixels rather than guessed as a fraction:
    // the text is the same height on a phone as on a laptop, so on a short pane it eats a far larger share.
    // Only the overlay needs dodging. Below the threshold the bands are in the flow and the drawing gets
    // the whole box, which is why the phone still shows a city block rather than a postage stamp.
    const band = size.w < 520 ? 0 : 46;
    const marginY = Math.max(0.5, Math.min(0.9, 1 - (band * 2) / Math.max(1, size.h)));
    const fit = fitToPane(model.vertices, base, 0.9, 2, marginY);
    return { ...fit, pxPerM: fit.pxPerM * zoom };
  }, [size, pitch, bearing, zoom, source.arena.radiusM, model]);

  const onDown = useCallback((e: React.PointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY };
    press.current = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }, []);
  const onMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x, dy = e.clientY - drag.current.y;
    // A press still inside the tap threshold is not a drag yet: do not orbit or look on a finger's wobble.
    if (press.current && classifyPress(press.current, { x: e.clientX, y: e.clientY, t: press.current.t }) === "tap") return;
    drag.current = { x: e.clientX, y: e.clientY };
    if (dragMode === "look") { onLook?.(dx, dy); return; }
    const d = rightDrag(dx, dy, size.w);
    setBearing((b) => b + (d.dBearing * 180) / Math.PI);
    setPitch((p) => clamp(p + d.dPitch, RCORE_CFG.minPitch, RCORE_CFG.maxPitch));
  }, [size.w, dragMode, onLook]);
  const onUp = useCallback((e: React.PointerEvent) => {
    drag.current = null;
    const start = press.current; press.current = null;
    if (!start || !onTap) return;
    const up = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    if (classifyPress(start, up) !== "tap") return;
    const r = box.current?.getBoundingClientRect(); if (!r) return;
    const double = isDoubleTap(lastTap.current, up);
    lastTap.current = double ? null : up;                     // a triple is a new first tap, not a second double
    onTap(up.x - r.left, up.y - r.top, { model, doors, ground, cam, stroke: SAME_WIDTH }, double);
  }, [onTap, model, doors, ground, cam]);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoom((z) => clamp(z * wheelZoom(e.deltaY), RCORE_CFG.minZoom, RCORE_CFG.maxZoom)); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const hud = { color: semanticHex("hud"), fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.08em" };

  // ON A PHONE THE HUD GOES UNDER THE DRAWING, NOT OVER IT. On a laptop each band is one line and an overlay
  // is the right answer: the numbers sit in the corners of the world they describe. At 390 px the same
  // content wraps to five lines and takes half the box, so an overlay puts text straight through the
  // Capitol. Shrinking the drawing to make room would leave a city block the size of a postage stamp.
  // Below a threshold the bands become ordinary content in the flow, which is what they are at that width.
  const narrow = size.w < 520;
  const topRow = (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <span style={hud}>{t("drone.hud.arena")}</span>
      {hudLeft}
      <span style={{ ...hud, color: semanticHex("mount") }} data-drone-fidelity>
        {motLabel(spec)} · {lod.kept} drawn{lod.dropped ? `, ${lod.dropped} dropped` : ""}{reserve ? ` · ${reserve} to the aircraft` : ""}
      </span>
    </div>
  );
  const sp = streamLabelParts(cal.streamIdx);
  const bottomRow = (
    <div style={{ display: "flex", justifyContent: "space-between", gap: narrow ? 8 : 12, flexWrap: "wrap", alignItems: narrow ? "flex-start" : "flex-end" }}>
      <span style={{ ...hud, color: semanticHex("door") }}>{t("drone.hud.doors")} {doors.length}</span>
      <span style={{ ...hud, opacity: 0.75 }}>{t("drone.arena.hand_authored")}</span>
      {/* The live video standard gets its OWN field, not a clause inside a sentence: a drop from
          1080p30 is the single fact a person must never have to go looking for. */}
      <span style={{ ...hud, color: isReference(cal.streamIdx) ? semanticHex("frustum") : semanticHex("pending") }} data-drone-stream>
        {fill(t(sp.reference ? "drone.stream.reference" : "drone.stream.fraction"), { a: sp.id, b: sp.pct })}
      </span>
      <span style={{ ...hud, color: semanticHex("frustum"), opacity: 0.8 }} data-drone-cal>
        {calLinePrefix(cal, machine)}{fill(t(`drone.cal.${cal.why.k}`), cal.why)}
      </span>
      {hudRight}
      <span style={{ ...hud, opacity: 0.6 }}>{hash.slice(0, 12)}</span>
    </div>
  );

  const world = (
    <div ref={box} data-drone-arena style={{ position: "relative", width: "100%", height: narrow ? "min(52vh, 66vw)" : "min(62vh, max(300px, 80vw))", background: VECTOR_LAW.ground, overflow: "hidden", touchAction: "none" }}
         onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <WireSvg model={model} cam={cam} maxLod={spec.maxLod} segmentBudget={worldBudget} bloom={spec.bloom} fw={SAME_WIDTH} />
      {overlay ? (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {overlay({ model, doors, ground, cam, stroke: SAME_WIDTH })}
        </div>
      ) : null}
      {/* HUD — drawn in the same stroke language, at the same weight, as the world (the vector law) */}
      {narrow ? null : (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", padding: 10, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          {topRow}
          {bottomRow}
        </div>
      )}
    </div>
  );

  if (!narrow) return world;
  return (
    <div style={{ background: VECTOR_LAW.ground }}>
      <div style={{ padding: "6px 10px 4px" }}>{topRow}</div>
      {world}
      <div style={{ padding: "6px 10px 2px" }}>{bottomRow}</div>
    </div>
  );

}
