"use client";
// THE ADDRESS THE OPERATOR GAVE OUT — /drone-2525 (operator 2026-09-16, twice in one message: "ensure
// https://exel-ai-polling.explore-096.workers.dev/drone-2525/ is active" and "ensure draft of game is here").
//
// The domain already answered at /main/Drone-2525, alongside its Architect and Celestial siblings. That
// route stays — links to it exist and a URL that has been shared is a promise. This is a second door to the
// same room: one component, two routes, no fork. `tests/drone-route.test.mjs` asserts both are exported and
// that this file renders the same surface, so the two can never drift into two different games.
import { DroneCommandUX1 } from "@/components/drone-2525/command-ux1";
export default function Page() {
  return <DroneCommandUX1 />;
}
