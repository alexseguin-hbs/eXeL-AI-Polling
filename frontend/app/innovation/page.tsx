"use client";
// /innovation is retired (operator, 2026-08-07): /SoI-2525 is the ONLY home of the
// System of Innovation. This stub forwards the legacy URL and renders nothing else,
// so there is exactly one area and no duplicate to drift. Parity was guaranteed
// before the move: /main/SoI-2525 had re-exported the same component since H21.
import { useEffect } from "react";

export default function InnovationRedirect() {
  useEffect(() => { window.location.replace("/SoI-2525/"); }, []);
  return null;
}
