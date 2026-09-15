"use client";

// THE STATIONARY ROUND — the operator's items 1 and 2: "Security Turrets" and "Security Capital", pop-up
// door targets that do not move or fly. One gimbal on a fixed mount, aimed at a door; capture it, then
// shoot it. The same gimbal record and the same slew law will drive the airframe in Pass 1b — this surface
// is how that design gets tested faster, standing still, exactly as the operator asked.
//
// Everything a person reads here is a t() key. Everything drawn is one of the 13, edges only, in the
// arena's OWN camera — there is no second projection and no second world.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { VECTOR_LAW, strokeProps } from "@/lib/wire-core/vector-law";
import { sceneProject } from "@/lib/wire-core/scene-project";
import { canonicalHash } from "@/lib/wire-core/wire-model";
import { DRONE_DOMAIN } from "@/lib/drone-2525/domain.gen";
import {
  initGimbal, command, slew, onTarget, eyeOf, aimAt, inFrame, aimReadout, turretMount,
  type GimbalState, type Mount,
} from "@/lib/drone-2525/gimbal";
import { lineOfSight, losReason, type Prism } from "@/lib/drone-2525/los";
import { buildSchedule, targetsAt, roundLengthMs, targetRole, type TargetView } from "@/lib/drone-2525/targets";
import { initGame, capture, shoot, endRound, score, transcript, type GameState } from "@/lib/drone-2525/game";
import { buildArena } from "@/lib/drone-2525/arena-model";
import { ArenaView, type ArenaCtx } from "./arena-view";
import type { Tier } from "@/lib/wire-core/fidelity";

const SPEC = DRONE_DOMAIN.gimbal as unknown as Parameters<typeof command>[1];
const TSPEC = {
  seed: Number(DRONE_DOMAIN.targets.seed), upMs: Number(DRONE_DOMAIN.targets.upMs),
  downMs: Number(DRONE_DOMAIN.targets.downMs), concurrent: Number(DRONE_DOMAIN.targets.concurrent),
};

/** "Security Capital" plays the whole block; "Security Turrets" is the same round on one mount at a time. */
export function TurretGame({ mode, tierCap }: { mode: "turrets" | "capital"; tierCap: Tier }) {
  const { t } = useLexicon();
  const mounts = useMemo<Mount[]>(() => DRONE_DOMAIN.turrets.map(turretMount), []);
  const [mountIdx, setMountIdx] = useState(0);
  const mount = mounts[mode === "capital" ? 0 : mountIdx];

  const [gim, setGim] = useState<GimbalState>(() => initGimbal(mount));
  const [game, setGame] = useState<GameState>(() => initGame(0));
  const [tMs, setTMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState<string>("");

  // ONE WORLD. The door positions and the terrain come from the footprints, not from the curve budget, so
  // this build agrees with whatever the renderer chose to paint at the current tier — and the HAL gate holds
  // it to that, asserting 14 doors at every tier. Nothing here is a second source of truth.
  const world = useMemo(() => {
    const a = buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: "game" });
    return { doors: a.doors, ground: a.ground, hash: canonicalHash(a.model) };
  }, []);
  const prisms = useMemo<Prism[]>(() => {
    return DRONE_DOMAIN.buildings.map((b) => {
      const base = world.ground(b.footprint[0][0], b.footprint[0][1]);
      return { id: b.id, footprint: b.footprint, baseU: base, topU: base + b.heightM };
    });
  }, [world]);

  const schedule = useMemo(() => buildSchedule(world.doors, TSPEC), [world]);
  const roundMs = useMemo(() => roundLengthMs(schedule), [schedule]);
  const views = useMemo(() => targetsAt(world.doors, schedule, game.tags, tMs), [world, schedule, game.tags, tMs]);
  const eye = useMemo(() => eyeOf(mount, world.ground), [world, mount]);

  // The target the sensor is actually looking at: up (or already captured) and inside the cone.
  const framed: TargetView | null = useMemo(() => {
    const live = views.filter((v) => v.phase === "up" || v.phase === "captured");
    let best: { v: TargetView; off: number } | null = null;
    for (const v of live) {
      const f = inFrame(eye, gim, SPEC, v.door.at);
      if (!f.inFrame) continue;
      const off = Math.hypot(f.dAz, f.dEl);
      if (!best || off < best.off) best = { v, off };
    }
    return best?.v ?? null;
  }, [views, gim, eye]);

  const los = useMemo(() => {
    if (!framed) return null;
    return lineOfSight(eye, framed.door.at, world.ground, prisms, { ignore: framed.door.buildingId });
  }, [eye, framed, world, prisms]);

  // The clock. Deterministic where it matters: every event records the tMs it happened at, so a replay
  // reconstructs the round from the log rather than from wall time.
  useEffect(() => {
    if (!running) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      setTMs((v) => v + dt * 1000);
      setGim((g) => slew(g, SPEC, dt));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    if (running && roundMs > 0 && tMs > roundMs) { setRunning(false); setGame((g) => endRound(g, tMs)); }
  }, [running, tMs, roundMs]);

  const nextTarget = useCallback(() => {
    const live = views.filter((v) => v.phase === "up" || v.phase === "captured");
    if (!live.length) { setNote(t("drone.game.no_target")); return; }
    // Nearest by turn angle, so pressing it twice walks the block rather than jumping about.
    const ranked = live
      .map((v) => ({ v, a: aimAt(eye, v.door.at) }))
      .sort((p, q) => Math.abs(p.a.az - gim.az) - Math.abs(q.a.az - gim.az));
    const pick = ranked.find(({ v }) => v.door.id !== framed?.door.id) ?? ranked[0];
    setGim((g) => command(g, SPEC, pick.a.az, pick.a.el));
    setNote(pick.v.door.label);
  }, [views, eye, gim.az, framed, t]);

  const doCapture = useCallback(() => {
    setGame((g) => {
      const next = capture(g, { tMs, target: framed, los, edges: framed ? 480 : 0, az: gim.az, el: gim.el });
      setNote(next.events.at(-1)?.why ?? "");
      return next;
    });
  }, [tMs, framed, los, gim]);

  const doShoot = useCallback(() => {
    setGame((g) => {
      const next = shoot(g, {
        tMs, target: framed, los, onTarget: onTarget(gim), az: gim.az, el: gim.el,
        reason: los && !los.clear ? losReason(los, (id) => DRONE_DOMAIN.buildings.find((b) => b.id === id)?.label ?? id) : undefined,
      });
      setNote(next.events.at(-1)?.why ?? "");
      return next;
    });
  }, [tMs, framed, los, gim]);

  const reset = useCallback(() => {
    setGame(initGame(0)); setTMs(0); setRunning(false); setNote("");
    setGim(initGimbal(mount));
  }, [mount]);
  useEffect(() => { reset(); }, [mount, reset]);

  const s = score(game);
  const hudFont = { fontFamily: "ui-monospace, monospace", fontSize: "clamp(9px, 2.4vw, 11px)", letterSpacing: "0.06em" };
  const btn = (on: boolean, hex: string, enabled = true) => ({
    background: "transparent", border: `1px solid ${on ? hex : "#2a2a2a"}`, color: enabled ? (on ? hex : "#8a8a8a") : "#4a4a4a",
    padding: "7px clamp(9px, 2.4vw, 14px)", ...hudFont, textTransform: "uppercase" as const,
    cursor: enabled ? "pointer" : "not-allowed", borderRadius: 2, minHeight: 34,
  });

  // The overlay: targets, the sensor cone, and the sight line — drawn in the arena's camera, edges only.
  const overlay = useCallback((ctx: ArenaCtx) => {
    const p = (v: [number, number, number]) => sceneProject(v, ctx.cam);
    const marks: React.ReactNode[] = [];
    for (const v of views) {
      const q = p(v.door.at);
      if (q.behind) continue;                                  // dropped, never clamped
      const role = targetRole(v.phase);
      const r = v.phase === "up" ? 7 + 5 * (1 - v.progress) : 5;
      const hex = semanticHex(role);
      // A target is a diamond of four segments — a closed ring, no fill (the vector law).
      const d = `M${q.x} ${q.y - r}L${q.x + r} ${q.y}L${q.x} ${q.y + r}L${q.x - r} ${q.y}Z`;
      marks.push(<path key={v.door.id} d={d} {...strokeProps(hex, VECTOR_LAW.stroke.normal)} />);
    }
    if (framed) {
      const a = p(eye), b = p(framed.door.at);
      if (!a.behind && !b.behind) {
        const hex = semanticHex(los && !los.clear ? "blocked" : "ray");
        marks.push(<path key="sight" d={`M${a.x} ${a.y}L${b.x} ${b.y}`} {...strokeProps(hex, VECTOR_LAW.stroke.hairline)} />);
      }
    }
    return (
      <svg width={ctx.cam.pw} height={ctx.cam.ph} viewBox={`0 0 ${ctx.cam.pw} ${ctx.cam.ph}`} style={{ display: "block" }} aria-hidden>
        {marks}
      </svg>
    );
  }, [views, eye, framed, los]);

  return (
    <div data-drone-game>
      <ArenaView
        source={DRONE_DOMAIN}
        tierCap={tierCap}
        overlay={overlay}
        hudLeft={<span style={{ ...hudFont, color: semanticHex("mount") }} data-drone-aim>{aimReadout(gim, los?.rangeM)}</span>}
        hudRight={
          <span style={{ ...hudFont, color: semanticHex("tagged") }} data-drone-score>
            {t("drone.game.tagged")} {s.tagged}/{world.doors.length} · {t("drone.game.captured")} {s.captured}
          </span>
        }
      />

      {/* Controls — one thumb, 34px touch targets, wrapping at phone width */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "10px 0" }}>
        <button data-drone-run onClick={() => setRunning((r) => !r)} style={btn(running, semanticHex("tree"))}>
          {running ? t("drone.game.pause") : t("drone.game.start")}
        </button>
        <button data-drone-next onClick={nextTarget} style={btn(false, semanticHex("door"))}>{t("drone.game.next_target")}</button>
        <button data-drone-capture onClick={doCapture} disabled={!framed} style={btn(false, semanticHex("frustum"), Boolean(framed))}>
          {t("drone.game.capture")}
        </button>
        <button data-drone-shoot onClick={doShoot} disabled={!framed} style={btn(false, semanticHex("ray"), Boolean(framed))}>
          {t("drone.game.shoot")}
        </button>
        <button data-drone-reset onClick={reset} style={btn(false, semanticHex("contour"))}>{t("drone.game.reset")}</button>
        {mode === "turrets" ? (
          <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
            <span style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.6 }}>{t("drone.game.turret")}</span>
            {mounts.map((m, i) => (
              <button key={m.id} data-drone-mount={m.id} onClick={() => setMountIdx(i)} style={btn(i === mountIdx, semanticHex("mount"))}>
                {m.id.replace("t-", "")}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* What just happened, in words — never a silent press */}
      <div style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.8, minHeight: 18 }} data-drone-note>
        {note || (framed ? framed.door.label : t("drone.game.no_target"))}
      </div>
      <div style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.5, marginTop: 4 }}>
        {t("drone.game.accuracy")} {(s.accuracy * 100).toFixed(0)}% · {t("drone.game.clock")} {(tMs / 1000).toFixed(0)}s / {(roundMs / 1000).toFixed(0)}s
      </div>

      {/* The round's own working — the log the score rests on */}
      {game.events.length > 1 ? (
        <details style={{ marginTop: 10 }}>
          <summary style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.7, cursor: "pointer" }}>{t("drone.game.log")}</summary>
          <pre style={{ ...hudFont, color: semanticHex("hud"), opacity: 0.65, whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
            {transcript(game).slice(-12).join("\n")}
          </pre>
        </details>
      ) : null}

    </div>
  );
}
