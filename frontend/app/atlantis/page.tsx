"use client";

/**
 * /atlantis — legacy alias. The canonical page is /Atlantis-Accords; QRs and
 * links printed before the rename land here and are forwarded so no issued
 * link ever dies (Council of Twelve mandate).
 */

import { useEffect } from "react";

export default function AtlantisLegacyRedirect() {
  useEffect(() => {
    window.location.replace("/Atlantis-Accords/");
  }, []);
  return null;
}
