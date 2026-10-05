"use client";

/** FITNESS-2525 · Command UX 1 — NUTRITION · vitamin-rich fueling panel. */
import type { CSSProperties } from "react";
import { C } from "./ux-helpers";
import { Panel } from "./ux-widgets";

export function NutritionPanel({
  coachBusy, runCoach, btnGhost,
}: {
  coachBusy: boolean;
  runCoach: (focus: "workout" | "nutrition" | "both") => void;
  btnGhost: CSSProperties;
}) {
  return (
    <Panel title="NUTRITION · VITAMIN-RICH FUELING" accent={C.amber}>
      <>
        <p className="text-[11px]" style={{ color: C.text }}>
          Eggs + oats + fruit + electrolytes (post-swim / post-ride). Dinner: lean protein + quinoa/rice + vegetables. No calorie numbers invented.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" style={btnGhost} disabled={coachBusy} onClick={() => runCoach("nutrition")}>Ask AI (nutrition)</button>
          <button type="button" style={btnGhost} disabled={coachBusy} onClick={() => runCoach("both")}>Ask AI (full day)</button>
        </div>
      </>
    </Panel>
  );
}
