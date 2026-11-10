import type { Metadata } from "next";
import type { ReactNode } from "react";

// Route-level title override for the /Security/2525 alias (operator 2026-11-10, URGENT): the browser tab reads
// "eXeL Security-2525", matching the primary /Security-2525 route and distinct from the SensorFusion-2525 app.
export const metadata: Metadata = {
  title: "eXeL Security-2525",
};

export default function SecuritySegmentLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
