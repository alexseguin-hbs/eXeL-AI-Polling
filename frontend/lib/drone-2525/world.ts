// ONE WORLD, BUILT ONCE, SHARED BY EVERY CONSUMER ON THE SCREEN.
//
// The audit found `buildArena` called from two places on the same screen with different curve budgets and
// different stamps — so the round and the picture held two different worlds with two different hashes,
// while the round's own comment claimed "ONE WORLD … nothing here is a second source of truth". It was not
// causing a visible bug because the door positions happen not to vary with the curve budget. That is luck,
// not design, and luck is what this module removes.
//
// A tiny cache, keyed by what actually changes the world. Curve resolution is the only thing a rung varies,
// so two consumers asking for the same resolution get the SAME object — same identity, so every memo keyed
// on it stops recomputing, and the same hash, so the HUD and the game agree about which world they are in.
import { buildArena, type Arena, type DomainSource } from "./arena-model";

const cache = new Map<string, Arena>();

/**
 * The world at a given curve resolution. The stamp is deliberately NOT part of the key: it is provenance
 * printed on the model, not geometry, and letting it fork the cache is how two worlds appeared in the
 * first place.
 */
export function worldAt(src: DomainSource, ngonSides: number, stamp: string, contourStepM = 2): Arena {
  const key = `${ngonSides}:${contourStepM}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const built = buildArena(src, { ngonSides, contourStepM, stamp });
  cache.set(key, built);
  return built;
}

/** Only a test needs this. Production builds one world per resolution and keeps it. */
export const forgetWorlds = (): void => { cache.clear(); };
export const worldsHeld = (): number => cache.size;
