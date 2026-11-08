"use client";
// ARCHITECT-2525 · 3D ASSET LAB route — /Architect-2525/library (operator 2026-11-08: a rotate-on-select 3D viewer
// "like the two files", the sexy cyan/violet recreations). three.js is loaded ONLY through this dynamic({ssr:false})
// import, so it never enters the SVG walk / plan / voxel bundle (the E3-Hybrid engine ruling). Same precedent as
// app/divinity-guide/page.tsx:34.
import dynamic from "next/dynamic";
import Link from "next/link";

const AssetLab = dynamic(() => import("@/components/architect-2525/asset-lab"), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "#89a8b6", background: "#04101a" }}>
      Loading the 3D Asset Lab…
    </div>
  ),
});

export default function Page() {
  return (
    <div style={{ minHeight: "100dvh", background: "#04101a" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "10px 14px 0" }}>
        <Link href="/Architect-2525/design" style={{ color: "#16e5e8", fontSize: 13, textDecoration: "none" }}>← Back to Design</Link>
      </div>
      <AssetLab />
    </div>
  );
}
