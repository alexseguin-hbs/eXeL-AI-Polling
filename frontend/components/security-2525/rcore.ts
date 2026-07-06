// SECURITY-2525 · R-CORE — the five cross-cutting capability lanes threaded
// through every 2525 object and the Vision 2525 governance wrapper.
// Canonical nomenclature confirmed 2026-07-06 (operator ruling):
//   COMM = radios / transmitters (data transmission)
//   EDGE = sensors, radars, on-equipment compute / neural nets (sensing + inference)
//   SYNC = recording→replay layer + common operating picture (everyone on one page)
//   LINK = relationships + comms updating the whole real-time position net (track net)
//   UCRS = MGRS / LLV-DMS / UCRS coordinates + planned tracks for movement
// This is the R-CORE "language of code" — the stable contract every Level-3 domain
// (Security-2525, Architect-2525, …) speaks.
export type RCoreLane = "COMM" | "EDGE" | "SYNC" | "LINK" | "UCRS";

export interface RCoreLaneDef {
  key: RCoreLane;
  label: string;
  color: string;
  def: string;
}

export const RCORE_LANES: RCoreLaneDef[] = [
  { key: "COMM", label: "COMM", color: "#19c8cf", def: "Radios + transmitters — the equipment that transmits data across the net." },
  { key: "EDGE", label: "EDGE", color: "#22c55e", def: "Sensors, radars + on-equipment compute (neural nets) — the sensing / edge-inference layer." },
  { key: "SYNC", label: "SYNC", color: "#a78bfa", def: "Recording→replay layer; the common operating picture that gets everyone on the same page." },
  { key: "LINK", label: "LINK", color: "#f59e0b", def: "Relationships + comms that update the whole net of real-time positions (live track net, hierarchy)." },
  { key: "UCRS", label: "UCRS", color: "#ffd400", def: "MGRS · LLV-DMS · UCRS coordinates + planned tracks for troop / vehicle / asset movement." },
];

/** Per-object R-CORE lane coverage flags (all optional; default = not asserted). */
export type RCoreCoverage = Partial<Record<RCoreLane, boolean>>;
