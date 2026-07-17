/**
 * VISION-2525 · SHARED ASSET SCHEMA (canonical, DeepSeek §3.1).
 * =================================================================================================
 * The common Asset Intelligence record for EVERY 2525 domain — Architect · Manta · Drone · Security.
 * Built once here, reused everywhere; each domain provides a producer that emits this shape (Architect's
 * is `lib/architect-assets.ts`). Date fields are epoch-ms `number`s so records are deterministic + JSON-safe.
 */

export type DigitalTwinPhase =
  | "designed" | "reviewed" | "approved" | "quoted" | "ordered" | "fabricated" | "delivered"
  | "installed" | "inspected" | "commissioned" | "verified" | "operational" | "maintained" | "renovated" | "retired";
export const DIGITAL_TWIN_PHASES: DigitalTwinPhase[] = [
  "designed", "reviewed", "approved", "quoted", "ordered", "fabricated", "delivered",
  "installed", "inspected", "commissioned", "verified", "operational", "maintained", "renovated", "retired",
];

export type AaceClass = "1" | "2" | "3" | "4" | "5";
export type Risk = "low" | "medium" | "high";
export type SssesState = "pending" | "in-progress" | "approved" | "failed";
export type DeliveryStatus = "ordered" | "shipped" | "received" | "installed";
export type HumanReviewStatus = "unreviewed" | "reviewed" | "needs-correction";

export interface Qualification {
  security: SssesState; stability: SssesState; scalability: SssesState; efficiency: SssesState; succinctness: SssesState;
}

export interface Asset {
  id: string;
  templateId: string;
  category: string;            // Layer Tree scope/system
  subcategory: string;
  name: string;
  manufacturer: string;
  model: string;
  version: string;
  geometry: { building: string; floor: string; room: string; coordinates: [number, number, number]; orientation: [number, number, number] };
  quantities: { count: number; area: number; length: number; volume: number; weight: number };
  cost: { material: number; labor: number; equipment: number; subcontract: number; installed: number; maintenance: number; replacement: number; lifecycle: number };
  schedule: { engineering: number; procurement: number; fabrication: number; shipping: number; installation: number; inspection: number; commissioning: number }; // days
  procurement: { preferredSupplier: string; alternateSuppliers: string[]; unitPrice: number; leadTime: number; deliveryStatus: DeliveryStatus };
  status: { phase: DigitalTwinPhase; confidence: number; aaceClass: AaceClass; risk: Risk; qualification: Qualification };
  dependencies: string[];
  successors: string[];
  documents: string[];
  simulations: string[];
  reviews: string[];
  replay: string[];
  economy: { mot: number; timeCapital: number; trinityTokens: number; budget: number };
  lifecycle: {
    maintenance: { frequency: string; lastService: number; nextService: number };
    warranty: { provider: string; expires: number; extended: boolean };
    serviceHistory: Array<{ date: number; type: string; description: string; cost: number }>;
  };
  metadata: { sourceFile: string; sourceHash: string; sourceType: string; importTimestamp: number; humanReviewStatus: HumanReviewStatus };
}

// Total engineering→commissioning duration (days) of an asset's schedule.
export function assetTotalDays(a: Asset): number {
  const s = a.schedule;
  return s.engineering + s.procurement + s.fabrication + s.shipping + s.installation + s.inspection + s.commissioning;
}
