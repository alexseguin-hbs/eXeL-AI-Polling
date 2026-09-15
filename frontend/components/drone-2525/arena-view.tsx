"use client";

// THE ARENA — the Texas Capitol lawn, drawn as edges, with the fidelity tier and what it dropped always on
// screen (U-WF-09: a cap is never silent). R-CORE interaction: drag rotates and tilts, wheel zooms — the same
// model every other 2525 surface speaks (lib/rcore-gestures.ts).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildArena, type DomainSource } from "@/lib/drone-2525/arena-model";
import { selectLod } from "@/lib/wire-core/wire-model";
import { TIERS, SENSOR_PROFILES, initFidelity, stepFidelity, applyCap, fidelityLabel, type Tier } from "@/lib/wire-core/fidelity";
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
  model: ReturnType<typeof buildArena>["model"];
  doors: ReturnType<typeof buildArena>["doors"];
  ground: ReturnType<typeof buildArena>["ground"];
  cam: { pw: number; ph: number; pitchDeg: number; bearingRad: number; pxPerM: number; originX?: number; originY?: number };
  stroke: (w: number) => number;
}

export function ArenaView({ source, tierCap = "ultra", overlay, hudRight, hudLeft }: {
  source: DomainSource; tierCap?: Tier;
  /** Drawn in the arena's own camera, above the world and below the HUD. */
  overlay?: (ctx: ArenaCtx) => React.ReactNode;
  hudRight?: React.ReactNode;
  hudLeft?: React.ReactNode;
}) {
  const { t } = useLexicon();
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 900, h: 560 });
  const [pitch, setPitch] = useState(58);
  const [bearing, setBearing] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [fid, setFid] = useState(() => initFidelity(tierCap, "med"));
  const drag = useRef<{ x: number; y: number } | null>(null);
  const sensor = SENSOR_PROFILES[(source as unknown as { sensor?: { profile?: string } }).sensor?.profile ?? "pi-baseline"] ?? SENSOR_PROFILES["pi-baseline"];
  const spec = TIERS[fid.tier];

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver((es) => { for (const e of es) setSize({ w: Math.max(280, e.contentRect.width), h: Math.max(320, e.contentRect.height) }); });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // The operator moved the ceiling — lowering it takes effect at once, raising it only permits an upgrade.
  useEffect(() => { setFid((s) => applyCap(s, tierCap)); }, [tierCap]);

  // The model is built once per curve budget — a tier changes what is DRAWN, never what is true.
  const { model, doors, ground } = useMemo(() => buildArena(source, { ngonSides: spec.ngonSides, contourStepM: 2, stamp: versionStamp() }), [source, spec.ngonSides]);
  const hash = useMemo(() => canonicalHash(model), [model]);
  const lod = useMemo(() => selectLod(model, spec.maxLod, spec.segments), [model, spec.maxLod, spec.segments]);

  // Measure our own draw time and let the ladder decide — after the sensor's reserve is taken out.
  const t0 = useRef(0);
  useEffect(() => { t0.current = typeof performance !== "undefined" ? performance.now() : 0; });
  useEffect(() => {
    if (typeof performance === "undefined") return;
    const ms = performance.now() - t0.current;
    const id = window.setTimeout(() => setFid((s) => stepFidelity(s, ms, sensor, performance.now()).state), 250);
    return () => window.clearTimeout(id);
  }, [model, lod, sensor, pitch, bearing, zoom]);

  // Frame the world, then let the operator's zoom act on top of that frame — so a phone and a laptop both
  // open on the whole block rather than on whatever fraction of it a fixed scale happened to leave visible.
  const cam = useMemo(() => {
    const base = { pw: size.w, ph: size.h, pitchDeg: pitch, bearingRad: (bearing * Math.PI) / 180,
                   pxPerM: Math.min(size.w, size.h) / (source.arena.radiusM * 2.2) };
    const fit = fitToPane(model.vertices, base);
    return { ...fit, pxPerM: fit.pxPerM * zoom };
  }, [size, pitch, bearing, zoom, source.arena.radiusM, model]);

  const onDown = useCallback((e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; (e.target as Element).setPointerCapture?.(e.pointerId); }, []);
  const onMove = useCallback((e: React.PointerEvent) => {
    if (!drag.current) return;
    const d = rightDrag(e.clientX - drag.current.x, e.clientY - drag.current.y, size.w);
    drag.current = { x: e.clientX, y: e.clientY };
    setBearing((b) => b + (d.dBearing * 180) / Math.PI);
    setPitch((p) => clamp(p + d.dPitch, RCORE_CFG.minPitch, RCORE_CFG.maxPitch));
  }, [size.w]);
  const onUp = useCallback(() => { drag.current = null; }, []);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setZoom((z) => clamp(z * wheelZoom(e.deltaY), RCORE_CFG.minZoom, RCORE_CFG.maxZoom)); };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const hud = { color: semanticHex("hud"), fontFamily: "ui-monospace, monospace", fontSize: 11, letterSpacing: "0.08em" };
  return (
    <div ref={box} data-drone-arena style={{ position: "relative", width: "100%", height: "min(62vh, max(300px, 80vw))", background: VECTOR_LAW.ground, overflow: "hidden", touchAction: "none" }}
         onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <WireSvg model={model} cam={cam} maxLod={spec.maxLod} segmentBudget={spec.segments} bloom={spec.bloom} fw={(w) => w} />
      {overlay ? (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {overlay({ model, doors, ground, cam, stroke: (w) => w })}
        </div>
      ) : null}

      {/* HUD — drawn in the same stroke language, at the same weight, as the world (the vector law) */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", padding: 10, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={hud}>{t("drone.hud.arena")}</span>
          {hudLeft}
          <span style={{ ...hud, color: semanticHex("mount") }} data-drone-fidelity>{fidelityLabel(fid, sensor, lod)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <span style={{ ...hud, color: semanticHex("door") }}>{t("drone.hud.doors")} {doors.length}</span>
          <span style={{ ...hud, opacity: 0.75 }}>{t("drone.arena.hand_authored")}</span>
          {hudRight}
          <span style={{ ...hud, opacity: 0.6 }}>{hash.slice(0, 12)}</span>
        </div>
      </div>
    </div>
  );
}
