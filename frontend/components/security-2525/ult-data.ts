// SECURITY-2525 · ULT — Unit Line-up Table (ADA battery planning SETUP layer).
// Each row is one mission-support evidence object: it establishes WHO is in the
// fight, WHO they report to (LINK), and WHICH radio net they ride (COMM) — the
// ULT is the setup that secures the COMM plan before anything is placed on the map.
// Evidence / classification / replay only — no tactical recommendation logic.
//
// Numbering: 001=ABMOC · 002=Battery CP · 003–008=S1–S6 sensors · 009+=units.
// Hierarchy notation: A=Alpha Battery · A1=Alpha Platoon 1 · A11=Section 1 under A1 ·
//   A11-1A=Avenger system (A) · A12-2P=Patriot system (P). Supervisor uses the same
//   notation (A1 supervises A11). "AB" = Alpha Battery (≡ node "A").
import type { AssetKind } from "@/components/security-2525/asset-icons";
import type { RCoreCoverage } from "@/components/security-2525/rcore";

export interface UltNode {
  id: string;         // "001"
  node: string;       // "ABMOC", "A11-1A"
  desc: string;
  supervisor: string; // "-", "AB", "A1", …
  comm: string;       // radio net (COMM lane)
  personnel: number;
  rifles: number;
  vehicles: number;
  equipment: string;
  notes: string;
}

export const ULT_ROSTER: UltNode[] = [
  { id: "001", node: "ABMOC", desc: "Higher coordination node", supervisor: "-", comm: "ABMOC net", personnel: 12, rifles: 12, vehicles: 3, equipment: "C2 systems", notes: "Air Battle Management Operations Center" },
  { id: "002", node: "Battery CP", desc: "Battery-level command post", supervisor: "-", comm: "Battery command net", personnel: 8, rifles: 8, vehicles: 2, equipment: "4 radios", notes: "Battery Command Post" },
  { id: "003", node: "S1", desc: "Primary sensor support", supervisor: "AB", comm: "Sensor net", personnel: 6, rifles: 6, vehicles: 2, equipment: "1 Sentinel radar", notes: "Primary radar for Alpha Battery" },
  { id: "004", node: "S2", desc: "Sensor support", supervisor: "AB", comm: "Sensor net", personnel: 5, rifles: 5, vehicles: 2, equipment: "1 radar support", notes: "Assigned to A1 Platoon" },
  { id: "005", node: "S3", desc: "Sensor support", supervisor: "AB", comm: "Sensor net", personnel: 5, rifles: 5, vehicles: 2, equipment: "1 radar support", notes: "Additional sensor" },
  { id: "006", node: "S4", desc: "Sensor support", supervisor: "AB", comm: "Sensor net", personnel: 5, rifles: 5, vehicles: 2, equipment: "1 radar support", notes: "Bravo Battery support" },
  { id: "007", node: "S5", desc: "Sensor support", supervisor: "AB", comm: "Sensor net", personnel: 4, rifles: 4, vehicles: 1, equipment: "1 radar support", notes: "Reserve / alternate" },
  { id: "008", node: "S6", desc: "Sensor support", supervisor: "AB", comm: "Sensor net", personnel: 4, rifles: 4, vehicles: 1, equipment: "1 radar support", notes: "Special support node" },
  { id: "009", node: "A", desc: "Alpha Battery overall", supervisor: "A", comm: "Battery command net", personnel: 120, rifles: 120, vehicles: 3, equipment: "Battery support gear", notes: "Alpha Battery overall" },
  { id: "010", node: "A1", desc: "Alpha Platoon 1", supervisor: "A", comm: "Platoon net", personnel: 35, rifles: 35, vehicles: 3, equipment: "Platoon support gear", notes: "Platoon 1" },
  { id: "011", node: "A11", desc: "Section 1 under A1 Platoon", supervisor: "A1", comm: "Section net", personnel: 12, rifles: 12, vehicles: 2, equipment: "Section support gear", notes: "Section under A1" },
  { id: "012", node: "A11-1A", desc: "Avenger system under A11 Section", supervisor: "A11", comm: "Team comms", personnel: 3, rifles: 3, vehicles: 1, equipment: "Avenger system", notes: "Assigned to platoon leader FIRES team" },
  { id: "013", node: "A12", desc: "Section 2 under A1 Platoon", supervisor: "A1", comm: "Section net", personnel: 12, rifles: 12, vehicles: 2, equipment: "Section support gear", notes: "Section under A1" },
  { id: "014", node: "A12-2P", desc: "Patriot system under A12 Section", supervisor: "A12", comm: "Team comms", personnel: 4, rifles: 4, vehicles: 1, equipment: "Patriot launcher", notes: "Patriot system example" },
  { id: "015", node: "B", desc: "Bravo Battery overall", supervisor: "B", comm: "Battery command net", personnel: 120, rifles: 120, vehicles: 3, equipment: "Battery support gear", notes: "Bravo Battery overall" },
  { id: "016", node: "B1", desc: "Bravo Platoon 1", supervisor: "B", comm: "Platoon net", personnel: 35, rifles: 35, vehicles: 3, equipment: "Platoon support gear", notes: "Platoon 1" },
  { id: "017", node: "B31", desc: "Section 1 under B3 Platoon", supervisor: "B3", comm: "Section net", personnel: 12, rifles: 12, vehicles: 2, equipment: "Section support gear", notes: "Example section" },
  { id: "018", node: "B31-1A", desc: "Avenger system under B31 Section", supervisor: "B31", comm: "Team comms", personnel: 3, rifles: 3, vehicles: 1, equipment: "Avenger system", notes: "Assigned to platoon leader FIRES team" },
];

export type Battery = "HQ" | "A" | "B";
export const BATTERY_COLOR: Record<Battery, string> = { HQ: "#f59e0b", A: "#38bdf8", B: "#22c55e" };
export const BATTERY_LABEL: Record<Battery, string> = { HQ: "HQ · SENSORS", A: "ALPHA BATTERY", B: "BRAVO BATTERY" };

/** ABMOC / Battery CP / S1–S6 → HQ; else by leading letter of the node token. */
export function ultBattery(n: UltNode): Battery {
  if (n.node.startsWith("A")) return "A";
  if (n.node.startsWith("B")) return "B";
  return "HQ";
}

/** Hierarchy depth for indent: ABMOC/CP/S*=0, A=1, A1=2, A11=3, A11-1A=4. */
export function ultDepth(n: UltNode): number {
  if (!/^[AB]/.test(n.node)) return 0;
  const base = n.node.split("-")[0];
  return n.node.includes("-") ? base.length + 1 : base.length;
}

/** Weapon-system nodes map onto a placeable asset icon; others are personnel/C2. */
export function ultAssetKind(n: UltNode): AssetKind | null {
  if (n.node.includes("-1A") || n.node.includes("-A")) return "avenger";
  if (n.node.includes("-2P") || n.node.includes("-P")) return "patriot";
  if (/^S\d/.test(n.node)) return "sentinel";
  return null;
}

/** Resolve the supervising node's id for LINK edges (null = top of net). */
export function ultParentId(n: UltNode): string | null {
  const sup = n.supervisor;
  if (!sup || sup === "-") return null;
  if (sup === n.node) return "001"; // battery reports up to ABMOC
  const key = sup === "AB" ? "A" : sup;
  return ULT_ROSTER.find((r) => r.node === key)?.id ?? "001";
}

/** R-CORE lanes every ULT node asserts: COMM (net) · LINK (supervisor) · UCRS (coords). */
export function ultRcore(): RCoreCoverage {
  return { COMM: true, LINK: true, UCRS: true };
}

/** Distinct COMM nets present in a set of nodes → the secured comm plan. */
export function commPlan(nodes: UltNode[]): { net: string; members: string[] }[] {
  const map = new Map<string, string[]>();
  for (const n of nodes) {
    const arr = map.get(n.comm) ?? [];
    arr.push(n.node);
    map.set(n.comm, arr);
  }
  return Array.from(map.entries()).map(([net, members]) => ({ net, members }));
}
