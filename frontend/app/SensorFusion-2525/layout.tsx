import type { Metadata } from "next";
import type { ReactNode } from "react";

// Route-level title override for /SensorFusion-2525 (operator 2026-10-22): the browser tab reads "eXeL Sensor Fusion",
// not the app-wide default "eXeL AI Polling" from app/layout.tsx. A nested server layout sets metadata for this segment;
// the page itself stays a client component.
export const metadata: Metadata = {
  title: "eXeL Sensor Fusion",
};

export default function SensorFusionLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
