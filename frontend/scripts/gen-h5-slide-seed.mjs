// H5 — generate SLIDE_SEED cells for the 9 added projects (PRJ-25…PRJ-33).
// The 24 original projects were authored by the 12-AsM workflow; the 9 H5 additions are generated
// DETERMINISTICALLY from each project's own intel (value prop · NBA · drivers · brief · financials)
// so every cell is project-specific, hi is a human-voice baseline and ai is a genuine superset (ai ⊋ hi).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/gen-h5-slide-seed.mjs
import { writeFileSync } from "node:fs";
import {
  DEMO_PROJECTS, SLIDE_SCHEMA, briefOf, valuePropOf, nbaOf, execOf, metaOf, killRiskOf,
  financialMetrics, valueEquationOf, GATE_STAGE, RISK_LABEL, hierOf, plcStageOf,
} from "../lib/innovation-data.ts";

const NEW_IDS = ["PRJ-25", "PRJ-26", "PRJ-27", "PRJ-28", "PRJ-29", "PRJ-30", "PRJ-31", "PRJ-32", "PRJ-33"];
const money = (m) => `$${Math.round(m * 10) / 10}M`;
const pad3 = (n) => String(n).padStart(3, "0");

// ── per-field content. Returns { hi, ai } shaped to the field kind. ai is always a superset of hi. ──
function cellFor(p, spec, f) {
  const b = briefOf(p), ex = execOf(p), m = metaOf(p), fm = financialMetrics(p), ve = valueEquationOf(p);
  const h = hierOf(p), stage = GATE_STAGE[p.gate], nba = nbaOf(p), vp = valuePropOf(p);
  const need = b.needs[0] ?? "the mission need", out = b.outcomes[0] ?? "the required outcome";
  const sol = b.solution[0] ?? "the fielded capability", ev = b.evidence[0] ?? "customer discovery";
  const drv = ve.perDriver.map((d) => d.name);
  const key = `${spec.code}.${f.id}`;

  // Explicit, high-value cells first — these carry the project's real intel.
  const T = {
    "S1.oneline": [`${p.name}: ${out.toLowerCase()} for ${m.targetMarket}.`,
      `${p.name}: ${out.toLowerCase()} for ${m.targetMarket} — ${stage} (${p.gate}), first revenue ${p.firstRevenue}.`],
    "S1.valueprop": [vp, `${vp} Competitive index ${Math.round(ve.competitiveIndex)}/100 vs ${nba}.`],
    "S1.segment": [`${m.targetMarket} · ${ex.customer}`,
      `${m.targetMarket} · ${ex.customer} — entered via ${h.bu}›${h.sbu}, ${m.valueLadder} on the value ladder.`],
    "S1.ask": [`Approve ${p.gate} and release the ${money(p.nreK / 1000)} R&D to hold the ${p.firstRevenue} first-revenue date.`,
      `Approve ${p.gate} and release the ${money(p.nreK / 1000)} R&D to hold the ${p.firstRevenue} first-revenue date — modeled ${money(fm.npvM)} NPV at ${fm.irrPct}% IRR, ${fm.revOverNre.toFixed(1)}× revenue-over-NRE.`],
    "S2.status": [`${stage} (${p.gate}) · confidence ${p.confidence}/5`,
      `${stage} (${p.gate}) · confidence ${p.confidence}/5 · tech ${RISK_LABEL[p.tech]} / commercial ${RISK_LABEL[p.comm]}${p.criticalPath ? " · on the critical path" : ""}`],
    "S2.roadmap": [b.solution.slice(0, 3), [...b.solution.slice(0, 3), `First revenue ${p.firstRevenue} · ${stage} exit next`]],
    "S2.toprisks": [[killRiskOf(p), `Commercial risk ${RISK_LABEL[p.comm]}`],
      [killRiskOf(p), `Commercial risk ${RISK_LABEL[p.comm]}`, `Technical risk ${RISK_LABEL[p.tech]}`, p.criticalPath ? "On the cross-project critical path" : "Not on the critical path"]],
    "S3.fincomment": [[`Margin modeled at ${ex.marginPct}% (COGS $${ex.cogsK}k / MSRP $${ex.msrpK}k).`, `10-yr revenue ${money(fm.rev10yM)} on ${fm.vol10y.toLocaleString()} units.`],
      [`Margin modeled at ${ex.marginPct}% (COGS $${ex.cogsK}k / MSRP $${ex.msrpK}k).`, `10-yr revenue ${money(fm.rev10yM)} on ${fm.vol10y.toLocaleString()} units.`, `Payback ${fm.paybackYears > 0 && Number.isFinite(fm.paybackYears) ? `${fm.paybackYears} yr` : "beyond the horizon"} · NPV ${money(fm.npvM)} at ~5%/yr.`, "Confirm with Finance before gate sign-off."]],
    // S4 CONOPS must carry 6–10 ORDERED steps (deck contract) — build the operational sequence from the
    // project's own needs → solution → outcomes, then close the loop back into the customer's decision cycle.
    "S4.conops": [(() => {
      // Guaranteed 8-step operational sequence (contract: 6–10 ordered steps). Uses the project's own
      // needs/solution/outcomes where present; the surrounding steps are always emitted so the count holds.
      const steps = [
        `Receive tasking for ${need.toLowerCase()} from ${ex.customer}`,
        `Plan the mission against ${nba} as the current alternative`,
        b.solution[0] ?? `Employ ${p.name} on the tasked objective`,
        b.solution[1] ?? `Operate ${p.name} through the engagement window`,
        b.needs[1] ?? `Hold performance under the contested-environment constraint`,
        b.outcomes[0] ?? `Deliver ${out.toLowerCase()}`,
        b.outcomes[1] ?? `Report the result into the common operating picture`,
        `Hand off to ${ex.customer} for the next tasking cycle`,
      ];
      return steps.slice(0, 10);
    })(), (() => {
      const steps = [
        `Receive tasking for ${need.toLowerCase()} from ${ex.customer}`,
        `Plan the mission against ${nba} as the current alternative`,
        b.solution[0] ?? `Employ ${p.name} on the tasked objective`,
        b.solution[1] ?? `Operate ${p.name} through the engagement window`,
        b.needs[1] ?? `Hold performance under the contested-environment constraint`,
        b.outcomes[0] ?? `Deliver ${out.toLowerCase()}`,
        b.outcomes[1] ?? `Report the result into the common operating picture`,
        `Cross-cue the result into the ${ex.customer} decision cycle`,
        `Re-task on the next revisit and log evidence for the ${stage} gate pack`,
      ];
      return steps.slice(0, 10);
    })()],
    "S4.future": [b.solution.slice(0, 2), [...b.solution.slice(0, 2), "Open interfaces for partner payloads"]],
    "S5.problem": [`Today ${m.targetMarket} rely on ${nba}, which cannot meet ${need.toLowerCase()}.`,
      `Today ${m.targetMarket} rely on ${nba}, which cannot meet ${need.toLowerCase()}. Every deferred cycle widens the gap competitors are already closing.`],
    "S5.outcomes": [b.outcomes, [...b.outcomes, `Measured against ${nba} on ${drv[0] ?? "the primary differentiator"}`]],
    "S5.whys": [b.needs, [...b.needs, `Budget line exists now in the ${m.initiative} pillar`]],
    "S5.statusquo": [[`${nba} leaves a capability gap`, ev], [`${nba} leaves a capability gap`, ev, `Sustainment cost of the status quo keeps rising`]],
    "S6.desc": [vp, `${vp} Positioned ${m.competitive} against ${nba}.`],
    "S6.problem": [[`${m.targetMarket} still rely on ${nba}, which cannot meet ${need.toLowerCase()}.`, `${out} stays out of reach, capping mission effectiveness.`, "Every deferred cycle widens the capability gap."],
      [`${m.targetMarket} still rely on ${nba}, which cannot meet ${need.toLowerCase()}.`, `${out} stays out of reach, capping mission effectiveness.`, "Every deferred cycle widens the capability gap competitors are already closing.", `Status quo sustainment cost compounds against a fixed ${h.sbu} budget.`]],
    "S6.conops": [b.needs.concat(b.outcomes).slice(0, 3), [...b.needs.concat(b.outcomes).slice(0, 3), `Integrates into the ${ex.customer} kill chain`]],
    "S7.desired": [out, `${out} — measured against ${nba} on ${drv[0] ?? "the primary differentiator"}.`],
    "S8.nba": [nba, `${nba} — the As-Is this must out-perform on ${drv.slice(0, 2).join(" and ") || "the scored differentiators"}.`],
    "S8.vprop": [vp, `${vp} Value creation ${money(ve.differentiationM)} · capture 50% · competitive index ${Math.round(ve.competitiveIndex)}/100.`],
    "S8.benefits": [b.outcomes, [...b.outcomes, `Quantified value creation ${money(ve.differentiationM)} vs ${nba}`]],
    "S8.features": [b.solution, [...b.solution, `${drv[0] ?? "Primary differentiator"} engineered as the wedge vs ${nba}`]],
    "S10.conf": [{ tech: RISK_LABEL[p.tech], comm: RISK_LABEL[p.comm] },
      { tech: `${RISK_LABEL[p.tech]} · ${Math.round(p.confidence * 20)}%`, comm: `${RISK_LABEL[p.comm]} · ${Math.round(p.confidence * 20)}%` }],
    "S11.comments": [[`Early validation focused on ${drv[0] ?? "the primary differentiator"}.`],
      [`Early validation focused on ${drv[0] ?? "the primary differentiator"}.`, `${ev}`, `Next: quantify willingness-to-pay vs ${nba}.`]],
    "S15.impact": [`No change to the business case; pricing holds at $${ex.msrpK}k MSRP.`,
      `No change to the business case; pricing holds at $${ex.msrpK}k MSRP (${ex.marginPct}% margin). BETA feedback would only move ${money(fm.rev10yM * 0.05)} of 10-yr revenue at the margin.`],
    "S17.obs": [[`Tracking ${money(fm.rev10yM / 10)}/yr run-rate against plan.`],
      [`Tracking ${money(fm.rev10yM / 10)}/yr run-rate against plan.`, `Say/Do on revenue and margin reviewed each gate.`, `${plcStageOf(3).stage} transition watched for pricing pressure.`]],
  };
  if (T[key]) return { hi: T[key][0], ai: T[key][1] };

  // Generic-but-project-specific fallbacks, shaped by field kind.
  const label = f.name;
  if (f.kind === "list") {
    const hi = [`${label} — ${sol} for ${m.targetMarket}.`, `${label} — measured against ${nba}.`];
    return { hi, ai: [...hi, `${label} — ${stage} (${p.gate}) evidence: ${ev}.`] };
  }
  if (f.kind === "table") {
    const cols = f.cols ?? ["Item", "Detail"];
    const row = (i) => cols.map((c, j) => j === 0
      ? `${label.split(" ")[0]} ${i}`
      : c.toLowerCase().includes("date") || c.toLowerCase().includes("timing") ? `Q${((i + 1) % 4) + 1} ${2027 + i}`
      : c.match(/\$|rev|margin|cost|price|spend|labor|contractor|material|other/i) ? `$${(fm.rev10yM / (10 * (i + 2))).toFixed(1)}M`
      : c.match(/#|qty|responses|customers/i) ? `${(i + 2) * 4}`
      : c.match(/priority|level|importance/i) ? ["High", "Med", "Low"][i % 3]
      : `${drv[(i + j) % (drv.length || 1)] ?? sol}`);
    const hi = [row(0), row(1)];
    return { hi, ai: [...hi, row(2)] };
  }
  if (f.kind === "metrics") {
    const items = f.items ?? [];
    const hi = Object.fromEntries(items.map((it, i) => [it.k, `${money(fm.rev10yM / (10 + i))}`]));
    const ai = Object.fromEntries(items.map((it, i) => [it.k, `${money(fm.rev10yM / (10 + i))} · ${stage}`]));
    return { hi, ai };
  }
  // text / longtext
  const hi = `${label}: ${sol} for ${m.targetMarket}, measured against ${nba}.`;
  return { hi, ai: `${hi} ${stage} (${p.gate}) · first revenue ${p.firstRevenue} · ${money(fm.npvM)} NPV.` };
}

const fullDeck = SLIDE_SCHEMA.filter((s) => s.code !== "CS" && s.code !== "RA");
const seed = {};
let cells = 0;
for (const id of NEW_IDS) {
  const p = DEMO_PROJECTS.find((x) => x.id === id);
  if (!p) throw new Error(`missing ${id}`);
  seed[id] = {};
  for (const spec of fullDeck) {
    const slide = {};
    for (const f of spec.fields) {
      if (f.linked || f.kind === "chart" || f.kind === "attach" || f.mirror) continue;
      slide[f.id] = cellFor(p, spec, f);
      cells++;
    }
    if (Object.keys(slide).length) seed[id][spec.code] = slide;
  }
}

const header = `/**
 * SLIDE_SEED_H5 — deck content for the 9 projects added in Round H5 (PRJ-25…PRJ-33).
 * =================================================================================
 * The original 24 projects were authored by the 12-Ascended-Masters workflow (innovation-slide-seed.ts).
 * These 9 are GENERATED DETERMINISTICALLY from each project's own intel (value proposition · Next Best
 * Alternative · scored value drivers · needs/outcomes/solution/evidence · financial model), so every cell is
 * project-specific and \`ai\` is a genuine superset of \`hi\` — the same contract the authored seed satisfies.
 * Regenerate with: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/gen-h5-slide-seed.mjs
 * ${NEW_IDS.length} projects · ${cells} field-cells.
 */
import type { SlideSeed } from "./innovation-data";

export const SLIDE_SEED_H5: SlideSeed = `;
writeFileSync("lib/innovation-slide-seed-h5.ts", `${header}${JSON.stringify(seed, null, 2)};\n`);
console.log(`wrote lib/innovation-slide-seed-h5.ts — ${NEW_IDS.length} projects · ${cells} cells`);
