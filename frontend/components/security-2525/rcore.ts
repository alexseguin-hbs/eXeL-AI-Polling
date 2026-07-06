// SECURITY-2525 · R-CORE — the five cross-cutting capability lanes threaded
// through every 2525 object and the Vision 2525 governance wrapper.
// Canonical nomenclature confirmed 2026-07-06 (Council of Twelve ruling):
// COMM · EDGE · SYNC · LINK · UCRS. This is the R-CORE "language of code" — the
// stable contract every Level-3 domain (Security-2525, Architect-2525, …) speaks.
export type RCoreLane = "COMM" | "EDGE" | "SYNC" | "LINK" | "UCRS";

export interface RCoreLaneDef {
  key: RCoreLane;
  label: string;
  color: string;
  def: string;
}

export const RCORE_LANES: RCoreLaneDef[] = [
  { key: "COMM", label: "COMM", color: "#19c8cf", def: "Communication nets + data-path redundancy (Trinity send/receive)." },
  { key: "EDGE", label: "EDGE", color: "#22c55e", def: "Modularity — capability-detected hot-swap (Vision 2525 HAL slots)." },
  { key: "SYNC", label: "SYNC", color: "#a78bfa", def: "Determinism, replay integrity, realtime shared state (top↔bottom sync)." },
  { key: "LINK", label: "LINK", color: "#f59e0b", def: "Hierarchy + dependency edges (Supervisor→child, cube dep-graph)." },
  { key: "UCRS", label: "UCRS", color: "#ffd400", def: "Universal Coordinate System — base-3600 (UCRS-2525)." },
];

/** Per-object R-CORE lane coverage flags (all optional; default = not asserted). */
export type RCoreCoverage = Partial<Record<RCoreLane, boolean>>;
