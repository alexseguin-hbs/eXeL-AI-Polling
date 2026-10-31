"use client";
// CANONICAL route — /Celestial-2525 (R5: /main/* is 301'd here by the Worker; app/main is gone). Public, zero-login, static-exported —
// so a link like https://<host>/Celestial-2525 opens the family sky reader directly, like Security-2525.
import { CelestialReader } from "@/components/celestial-2525/celestial-reader";
export default function Page() {
  return <CelestialReader />;
}
