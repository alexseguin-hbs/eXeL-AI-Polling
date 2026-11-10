import type { Metadata } from "next";
import type { ReactNode } from "react";

// Route-level title override for /Security-2525 (operator 2026-11-10, URGENT): the browser tab reads "eXeL Security-2525",
// not the app-wide default "eXeL AI Polling" from app/layout.tsx (and NOT "eXeL Sensor Fusion" — that is the sibling
// SensorFusion-2525 app). Mirrors app/SensorFusion-2525/layout.tsx: a nested server layout sets metadata for this
// segment while the page itself stays a client component.
export const metadata: Metadata = {
  title: "eXeL Security-2525",
};

export default function Security2525Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
