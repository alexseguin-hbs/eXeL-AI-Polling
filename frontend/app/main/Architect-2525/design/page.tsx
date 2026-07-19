"use client";
// DEEP-LINK route — /main/Architect-2525/design → Architect-2525 landing on the DESIGN tab (Model).
// Target of the homepage "Sacred Family Framework" easter-egg hyperlink (Thought Master: "home is where
// the heart, mind and spirit of a child grow — central and critical for family"). Same component as the
// main Architect route, only the initialTab differs. Static-exported.
import { ArchitectCommandUX1 } from "@/components/architect-2525/command-ux1";
export default function Page() {
  return <ArchitectCommandUX1 initialTab="DESIGN" />;
}
