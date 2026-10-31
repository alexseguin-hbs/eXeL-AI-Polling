"use client";
// DEEP-LINK route — /Architect-2525/design → Architect-2525 landing on the DESIGN tab (Model).
// Target of the homepage "Sacred Family Framework" easter-egg hyperlink (Thought Master: "home is where
// the heart, mind and spirit of a child grow — central and critical for family"). Same component as the
// canonical /Architect-2525 route, only the initialTab differs. Static-exported. (R5: was /main/Architect-2525/design —
// /main is never used; the Worker 301s every /main/* to /*.)
import { ArchitectCommandUX1 } from "@/components/architect-2525/command-ux1";
export default function Page() {
  return <ArchitectCommandUX1 initialTab="DESIGN" />;
}
