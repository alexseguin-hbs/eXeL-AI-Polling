"use client";

// THE SELF-TEST — point this at a new board or a new sensor and it tells you which rung of the ladder that
// machine actually holds at 1080p30 (operator 2026-09-15: "test new compute and sensor for self test of edge
// compute and edge sensor for robotics and complex systems with a self calibration goal of 6 - 15 minutes").
//
// The measurement is real: each rung is drawn at its own segment budget and curve resolution, for a dwell
// long enough to be a sustained rate rather than a peak, and the frames are counted the same way the
// Security-2525 speed test counts them. Nothing here reports a number the machine did not produce.
//
// The run takes minutes by design, so it is never silent: the rung being measured, the frames it made, the
// verdict and the reason all appear as they happen, and STOP returns what has been learned so far.
import { useCallback, useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { buildArena } from "@/lib/drone-2525/arena-model";
import { DRONE_DOMAIN } from "@/lib/drone-2525/domain.gen";
import { canonicalHash, selectLod } from "@/lib/wire-core/wire-model";
import { motSpec, type MotLevel } from "@/lib/wire-core/mot-ladder";
import { REFERENCE_STREAM } from "@/lib/wire-core/stream";
import { planSelfCal, SELF_CAL_MIN_MINUTES, SELF_CAL_MAX_MINUTES } from "@/lib/wire-core/calibrate";
import { runSelfCal, selfCalPack, type SelfCalProgress } from "@/lib/wire-core/self-cal-runner";
import type { SelfCalReport } from "@/lib/wire-core/calibrate";
import type { HalChoice } from "@/lib/wire-core/hal";

export function SelfCalPanel({ level, hal }: { level: MotLevel; hal: HalChoice }) {
  const { t } = useLexicon();
  const [minutes, setMinutes] = useState(SELF_CAL_MIN_MINUTES);
  const [prog, setProg] = useState<SelfCalProgress | null>(null);
  const [report, setReport] = useState<SelfCalReport | null>(null);
  const [running, setRunning] = useState(false);
  const signal = useRef<{ aborted: boolean }>({ aborted: false });
  const plan = planSelfCal(minutes);

  const start = useCallback(async () => {
    if (running) return;
    signal.current = { aborted: false };
    setRunning(true); setReport(null); setProg(null);
    // Real load: build and cull the arena at the rung under test, exactly as the arena itself does.
    const load = {
      paint: (l: MotLevel) => {
        const s = motSpec(l);
        const a = buildArena(DRONE_DOMAIN, { ngonSides: s.ngonSides, contourStepM: 2, stamp: "selfcal" });
        selectLod(a.model, s.maxLod, s.segments);
      },
    };
    try {
      const r = await runSelfCal(load, { budgetMinutes: minutes, hal, onProgress: setProg, signal: signal.current });
      setReport(r);
    } finally { setRunning(false); }
  }, [running, minutes, hal]);

  const stop = useCallback(() => { signal.current.aborted = true; }, []);

  const save = useCallback(() => {
    if (!report) return;
    const a = buildArena(DRONE_DOMAIN, { ngonSides: 13, contourStepM: 2, stamp: "selfcal" });
    const pack = selfCalPack(report, {
      version: DRONE_DOMAIN.project.version, revision: DRONE_DOMAIN.project.revision, modelHash: canonicalHash(a.model),
    });
    const url = URL.createObjectURL(new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" }));
    const el = document.createElement("a");
    el.href = url; el.download = `drone-2525-selfcal-${report.ceiling ?? "none"}.json`; el.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const mono = { fontFamily: "ui-monospace, monospace", fontSize: "clamp(9px, 2.3vw, 11px)", letterSpacing: "0.05em" };
  const hud = semanticHex("hud");
  const btn = (on: boolean, hex: string, enabled = true) => ({
    background: "transparent", border: `1px solid ${on ? hex : "#2a2a2a"}`, color: enabled ? (on ? hex : "#8a8a8a") : "#4a4a4a",
    padding: "6px clamp(9px, 2.4vw, 14px)", ...mono, textTransform: "uppercase" as const,
    cursor: enabled ? "pointer" : "not-allowed", borderRadius: 2, minHeight: 34,
  });

  return (
    <section data-drone-selfcal style={{ padding: "0 14px 18px", maxWidth: 900 }}>
      <div style={{ ...mono, color: semanticHex("mount"), marginBottom: 6 }}>{t("drone.selfcal.title")}</div>
      <p style={{ ...mono, color: hud, opacity: 0.6, lineHeight: 1.7, margin: "0 0 8px" }}>{t("drone.selfcal.lead")}</p>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
        <button data-selfcal-run onClick={start} disabled={running} style={btn(false, semanticHex("tree"), !running)}>
          {t("drone.selfcal.start")}
        </button>
        <button data-selfcal-stop onClick={stop} disabled={!running} style={btn(false, semanticHex("ray"), running)}>
          {t("drone.selfcal.stop")}
        </button>
        <label style={{ ...mono, color: hud, opacity: 0.7, display: "flex", gap: 6, alignItems: "center" }}>
          {t("drone.selfcal.budget")}
          <input data-selfcal-minutes type="range" min={SELF_CAL_MIN_MINUTES} max={SELF_CAL_MAX_MINUTES} value={minutes}
                 disabled={running} onChange={(e) => setMinutes(Number(e.target.value))}
                 style={{ accentColor: semanticHex("tree"), width: 120 }} />
          <span style={{ color: semanticHex("mount") }}>{minutes} {t("drone.selfcal.minutes")}</span>
        </label>
        {report ? <button data-selfcal-save onClick={save} style={btn(false, semanticHex("contour"))}>{t("drone.selfcal.save")}</button> : null}
      </div>

      {/* What the run will do, said BEFORE it starts — nobody waits fifteen minutes on an unexplained bar. */}
      <div style={{ ...mono, color: hud, opacity: 0.55, marginBottom: 6 }}>
        {t("drone.selfcal.plan")} {plan.rungs.length} × {plan.dwellS}s · {plan.worstCaseMinutes} {t("drone.selfcal.minutes")} · {t("drone.selfcal.reference")} {REFERENCE_STREAM.id}
      </div>

      {prog ? (
        <div data-selfcal-progress style={{ ...mono, color: semanticHex("door"), marginBottom: 6 }}>
          {prog.rung}/{prog.total} · {prog.line} · {t("drone.selfcal.elapsed")} {prog.elapsedS}s
        </div>
      ) : null}

      {report ? (
        <div data-selfcal-report style={{ border: `1px solid ${semanticHex("contour")}`, padding: 10 }}>
          <div style={{ ...mono, color: semanticHex("tagged"), marginBottom: 6 }}>{report.headline}</div>
          <div style={{ ...mono, color: hud, opacity: 0.7, marginBottom: 8 }}>
            {report.hal} · {t("drone.selfcal.tried")} {report.tried} · {t("drone.selfcal.held")} {report.passed} · {report.elapsedS}s
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 4 }}>
            {report.results.map((r) => (
              <div key={r.level} style={{ ...mono, color: r.pass ? semanticHex("tree") : semanticHex("blocked"), opacity: 0.9 }}>
                {r.level} · {r.measuredFps} fps · {r.pass ? t("drone.selfcal.held") : t("drone.selfcal.failed")}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ ...mono, color: hud, opacity: 0.45, marginTop: 8, lineHeight: 1.7 }}>
        {t("drone.selfcal.asked")} {level} · {motSpec(level).bandName} · {motSpec(level).sensors.join("·")}
      </div>
    </section>
  );
}
