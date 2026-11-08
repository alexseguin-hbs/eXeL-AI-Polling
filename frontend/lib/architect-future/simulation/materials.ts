// ARCHITECT-2525 / FUTURE · simulation/materials — the wall-system take-off BRANCHES by construction method
// (plan §18, FCRS-21). FRAME lists studs / plates / sheathing; PRINT lists printed cementitious wall material and
// NEVER a "2×6 stud" line (T-MATERIAL); UNDECIDED lists nothing until a method is chosen. Every line carries its
// method, calculation and evidence. Quantities are ASSUMED illustrative — derived from the shell perimeter, not a quote.
import type { ArchitectProjectV2 } from "../domain/project";
import type { TakeoffLine } from "../domain/construction";
import { ftFromUm } from "../domain/geometry";

/** Shell outer extent in feet, derived from the project's own spaces (not a constant). */
function shellFt(project: ArchitectProjectV2): number {
  let m = 0;
  for (const s of project.spaces) {
    m = Math.max(m, ftFromUm(s.outer_x_um + s.outer_width_um), ftFromUm(s.outer_y_um + s.outer_depth_um));
  }
  return m;
}

const STOREY_HEIGHT_FT = 10; // ASSUMED storey clear height (matches the project's "storey-height" assumption)
const STUD_SPACING_IN = 16;  // on-centre
const SHEET_FT2 = 32;        // one 4×8 sheet
const PRINT_WALL_THICK_FT = 0.67; // ASSUMED printed wall thickness (~8 in)

export function materialTakeoff(project: ArchitectProjectV2): TakeoffLine[] {
  const method = project.construction.method;
  if (method === "UNDECIDED") return [];

  const shell = shellFt(project);
  const perimeterFt = shell * 4;
  const wallAreaFt2 = perimeterFt * STOREY_HEIGHT_FT;

  if (method === "FRAME") {
    const studs = Math.ceil((perimeterFt * 12) / STUD_SPACING_IN) + 4 * 3; // o.c. run + corner/opening allowance
    const plateFt = perimeterFt * 3;      // bottom plate + double top plate
    const sheets = Math.ceil(wallAreaFt2 / SHEET_FT2);
    return [
      { item: `2×6 wall studs @ ${STUD_SPACING_IN} in o.c.`, qty: studs, unit: "ea", method, calculation: `${perimeterFt} ft exterior perimeter × 12 ÷ ${STUD_SPACING_IN} in o.c. + corners`, evidence: "ASSUMED" },
      { item: "2×6 plate lumber (bottom + double top)", qty: plateFt, unit: "lin ft", method, calculation: `${perimeterFt} ft perimeter × 3 plates`, evidence: "ASSUMED" },
      { item: "Wall sheathing (4×8 OSB)", qty: sheets, unit: "sheet", method, calculation: `${wallAreaFt2} ft² wall area ÷ ${SHEET_FT2} ft²/sheet`, evidence: "ASSUMED" },
    ];
  }

  // PRINT — no studs, plates or sheathing; printed cementitious wall by volume + reinforcement.
  const wallVolFt3 = Math.round(perimeterFt * STOREY_HEIGHT_FT * PRINT_WALL_THICK_FT);
  const rebarFt = perimeterFt * 4; // horizontal courses, ASSUMED
  return [
    { item: "Printed wall material (cementitious)", qty: wallVolFt3, unit: "ft³", method, calculation: `${perimeterFt} ft perimeter × ${STOREY_HEIGHT_FT} ft × ${PRINT_WALL_THICK_FT} ft wall`, evidence: "ASSUMED" },
    { item: "Wall reinforcement (rebar)", qty: rebarFt, unit: "lin ft", method, calculation: `${perimeterFt} ft perimeter × 4 courses`, evidence: "ASSUMED" },
  ];
}
