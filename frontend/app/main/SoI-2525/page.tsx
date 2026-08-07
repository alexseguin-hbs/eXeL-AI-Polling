"use client";
// Legacy path — /SoI-2525 is the ONLY home of the System of Innovation (operator,
// 2026-08-07). This stub forwards the old /main/SoI-2525 URL; nothing renders here.
import { useEffect } from "react";

export default function MainSoIRedirect() {
  useEffect(() => { window.location.replace("/SoI-2525/"); }, []);
  return null;
}
