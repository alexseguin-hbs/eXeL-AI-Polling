"use client";
// ALIAS route — /Celestial-2525 (same as /main/Celestial-2525). Public, zero-login, static-exported —
// so a link like https://<host>/Celestial-2525 opens the family sky reader directly, like Security-2525.
import { CelestialReader } from "@/components/celestial-2525/celestial-reader";
export default function Page() {
  return <CelestialReader />;
}
