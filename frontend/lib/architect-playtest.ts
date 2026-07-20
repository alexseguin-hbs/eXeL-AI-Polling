/**
 * ARCHITECT-2525 · GUIDED PLAY-TEST (S9) — a scripted, narrated demo that walks a user through the FULL Architect
 * capability set, not just room layout (operator: "a series of steps to demo what is possible with plumbing,
 * electrical, sewer/water, air/HVAC and structural in addition to room layout"). Modeled on the Security-2525
 * play-test pattern: a deterministic step list + an engine that replays it, accumulating placed objects and computing
 * each step's expected system render + quantitative totals by REUSING lib/mep-runs and lib/room-objects (no new math).
 * Pure + replayable (no Math.random, no network) so a pure-node test can lock every step's outcome. The UI runner just
 * renders frame[i] and its narration; polish comes later — this is the engine + script.
 */
import { placeObject, type PlacedObject, type ObjectKind } from "./room-objects";
import { waterRuns, sewerRuns, ductRuns, electricSpecs } from "./mep-runs";

export type PlaySystem = "layout" | "structural" | "electric" | "water" | "sewer" | "hvac";

/** Which systems are visible on the plan/voxel at a given step (mirrors RoomDesigner's show* props + structural). */
export interface PlayToggles { structural: boolean; electric: boolean; water: boolean; sewer: boolean; hvac: boolean }
const NO_TOGGLES: PlayToggles = { structural: false, electric: false, water: false, sewer: false, hvac: false };

/** One narrated demo step: what it turns on and what it places. */
export interface PlayStep {
  id: string;
  system: PlaySystem;
  title: string;                       // the "what is possible" callout
  detail: string;                      // one-line explanation
  place: { kind: ObjectKind; gx: number; gy: number }[]; // objects added this step (accumulate)
  toggles: Partial<PlayToggles>;       // systems switched ON this step (accumulate)
}

/** The canonical guided-demo script — room layout first, then each building system in turn. */
export const PLAYTEST_STEPS: PlayStep[] = [
  { id: "layout", system: "layout",
    title: "Design the room", detail: "Place & arrange furniture on the 10×10 grid; doors and windows slide along their wall.",
    place: [{ kind: "bed", gx: 2, gy: 2 }, { kind: "door", gx: 5, gy: 9 }, { kind: "window", gx: 8, gy: 0 }], toggles: {} },
  { id: "structural", system: "structural",
    title: "Reveal the steel shell", detail: "Show the structural beams, studs and shell panels the room is built from.",
    place: [{ kind: "shell", gx: 0, gy: 4 }], toggles: { structural: true } },
  { id: "electric", system: "electric",
    title: "Wire the outlets", detail: "Draw every outlet's run back to the panel — total wire length, circuits and service amps.",
    place: [], toggles: { electric: true } },
  { id: "water", system: "water",
    title: "Run the water supply", detail: "Route the water source to each fixture; the total supply pipe length is computed.",
    place: [{ kind: "sink", gx: 1, gy: 8 }, { kind: "toilet", gx: 3, gy: 8 }], toggles: { water: true } },
  { id: "sewer", system: "sewer",
    title: "Run the sewer / DWV", detail: "Route waste from each fixture to the stack; the total sewer pipe length is computed.",
    place: [], toggles: { sewer: true } },
  { id: "hvac", system: "hvac",
    title: "Add air / HVAC", detail: "Lay overhead ductwork to condition the space; the total duct run is computed.",
    place: [], toggles: { hvac: true } },
];

/** A replayed frame: the step, the accumulated objects/toggles at that point, and the computed system totals. */
export interface PlayFrame {
  step: PlayStep;
  index: number;
  objects: PlacedObject[];
  toggles: PlayToggles;
  totals: { waterFt: number; sewerFt: number; wireFt: number; circuits: number; amps: number; ductFt: number };
}

/**
 * Replay the guided script deterministically. Objects and toggles ACCUMULATE across steps; totals for each active
 * system are computed from the same libs the live RoomDesigner uses, so the demo's numbers equal the real ones.
 */
export function runPlaytest(steps: PlayStep[] = PLAYTEST_STEPS, outlets = 4): PlayFrame[] {
  let objects: PlacedObject[] = [];
  let toggles: PlayToggles = { ...NO_TOGGLES };
  const frames: PlayFrame[] = [];
  steps.forEach((step, index) => {
    for (const p of step.place) objects = placeObject(objects, p.kind, p.gx, p.gy);
    toggles = { ...toggles, ...step.toggles };
    const wSpec = toggles.electric ? electricSpecs(outlets) : null;
    frames.push({
      step, index, objects, toggles,
      totals: {
        waterFt: toggles.water ? waterRuns(objects).totalFt : 0,
        sewerFt: toggles.sewer ? sewerRuns(objects).totalFt : 0,
        wireFt: wSpec ? wSpec.wireFt : 0,
        circuits: wSpec ? wSpec.circuits : 0,
        amps: wSpec ? wSpec.amps : 0,
        ductFt: toggles.hvac ? ductRuns().totalFt : 0,
      },
    });
  });
  return frames;
}

/** The distinct systems the guided demo covers, in order (for the progress dots / narration index). */
export const PLAYTEST_SYSTEMS: PlaySystem[] = ["layout", "structural", "electric", "water", "sewer", "hvac"];
