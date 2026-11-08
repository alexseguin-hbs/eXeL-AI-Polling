// ARCHITECT-2525 / FUTURE · domain/intent — the journey starts with the human (plan §14, FCRS-10).
// A furniture catalog never appears before intent. A stated budget is USER_STATED, never cost authority.

import type { ConstructionMethod } from "./construction";

export interface HumanIntent {
  project_type: "CUSTOM_RESIDENCE";
  occupants?: number;
  needs: string[];
  accessibility_needs: string[];
  priorities: string[];
  construction_preference: ConstructionMethod;
  budget_intent?: {
    amount_usd: number;
    authority: "USER_STATED";
  };
}

export function emptyIntent(): HumanIntent {
  return {
    project_type: "CUSTOM_RESIDENCE",
    needs: [],
    accessibility_needs: [],
    priorities: [],
    construction_preference: "UNDECIDED",
  };
}
