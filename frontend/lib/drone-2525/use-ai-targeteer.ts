"use client";

// THE MACHINE TARGETEER — it aims and then it ASKS. There is no branch here that fires.
//
// Extracted from round.tsx (Round 12 P0-5) so the round reads as a round and stays under the size gate.
// The live world is read through a ref, not the effect's dependencies: `views` is recomputed every
// animation frame, so listing it would tear the interval down and rebuild it sixty times a second and it
// could never reach its 2.6-second tick (the walkthrough capture found exactly that). The effect depends
// only on `running` and `isAI`; everything fast is read through the ref at tick time.
import { useEffect, useRef } from "react";
import { autoTargeteer, requestShot, type ApprovalState } from "./ai-crew";
import { command, aimAt, type GimbalState, type GimbalSpec } from "./gimbal";
import { openCall } from "./si-pod";
import type { TargetView } from "./targets";
import type { Prism } from "./los";
import type { Vec3 } from "@/lib/wire-core/wire-model";
import type { SiState } from "./si-pod";

export interface AiTargeteerLive {
  eye: Vec3; gim: GimbalState; views: readonly TargetView[]; world: { ground: (e: number, n: number) => number }; prisms: readonly Prism[];
  t: (k: string) => string;
}

export interface UseAiTargeteerOptions extends AiTargeteerLive {
  running: boolean;
  isAI: boolean;
  spec: GimbalSpec;
  tMsRef: React.MutableRefObject<number>;
  setGim: (fn: (g: GimbalState) => GimbalState) => void;
  setNote: (s: string) => void;
  setApproval: (fn: (ap: ApprovalState) => ApprovalState) => void;
  setAskedFor: (id: string) => void;
  setSi: (fn: (s: SiState) => SiState) => void;
}

/** Mount once. The AI aims every 2.6 s and, when it has a target, ASKS — it never fires. */
export function useAiTargeteer(o: UseAiTargeteerOptions): void {
  const live = useRef<AiTargeteerLive>({ eye: o.eye, gim: o.gim, views: o.views, world: o.world, prisms: o.prisms, t: o.t });
  live.current.eye = o.eye; live.current.gim = o.gim; live.current.views = o.views;
  live.current.world = o.world; live.current.prisms = o.prisms; live.current.t = o.t;
  const spec = o.spec, tMsRef = o.tMsRef;
  const setGim = o.setGim, setNote = o.setNote, setApproval = o.setApproval, setAskedFor = o.setAskedFor, setSi = o.setSi;

  useEffect(() => {
    if (!o.running || !o.isAI) return;
    const id = window.setInterval(() => {
      const L = live.current;
      const aim = autoTargeteer(L.eye, L.gim, L.views, L.world.ground, L.prisms, { nearM: Number(spec.nearM), rangeM: Number(spec.rangeM) });
      if (!aim.level) { setNote(L.t("drone.crew.ai_looking")); return; }
      setGim((g) => command(g, spec, aim.az, aim.el));
      setNote(`${L.t("drone.crew.ai_aiming")} ${aim.why}`);
      const target = aim.level;
      setApproval((ap) => {
        if (ap.pending) return ap;
        const reqId = `r${target.door.id}-${Math.round(tMsRef.current)}`;
        setAskedFor(reqId);
        // SI takes the decision the round already has. It does not invent one to vote on.
        setSi((s0) => openCall(s0, reqId, `${L.t("si.question")} ${target.door.label}?`, tMsRef.current));
        return requestShot(ap, {
          id: reqId, doorId: target.door.id, doorLabel: target.door.label, askedAtMs: tMsRef.current,
          az: aim.az, el: aim.el, rangeM: aimAt(L.eye, target.door.at).rangeM,
          claim: L.t("drone.crew.ai_claim"),
        });
      });
    }, 2600);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [o.running, o.isAI]);
}
