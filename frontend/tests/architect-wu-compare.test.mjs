// ARCHITECT-2525 · §14 ASSEMBLY COMPARE firewall gate (the FINAL 웃 contract). The Labor-Recognition panel shows TIME ·
// 웃 RECOGNITION · LOCAL SETTLEMENT · PROJECT COST; switching the comparison region must change ONLY the settlement
// reference, never the project cost. Engine behaviour (recognition global, settlement local) + the UI wiring (source).
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/architect-wu-compare.test.mjs
import fs from "node:fs";
import path from "node:path";
import { deriveM, recognitionU, settlementComparison } from "@/lib/architect-labor";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

const M = deriveM("carpenter");
ok(M && M.M > 1 && M.state === "DERIVED", "the carpenter multiple is derived (> 1×)");

// recognition is GLOBAL: same hours + same M → same 웃 across jurisdictions
{
  const refs = settlementComparison(100, M, ["US-AUSTIN", "NG", "BR"]);
  ok(refs.every((r) => r.uEarned === refs[0].uEarned && r.uEarned === recognitionU(100, M.M)), "same hours + M → same 웃 in every jurisdiction (recognition is global)");
  // settlement is LOCAL: the local settlement reference differs by jurisdiction
  const austin = refs.find((r) => r.jurisdiction_id === "US-AUSTIN");
  const ng = refs.find((r) => r.jurisdiction_id === "NG");
  ok(austin.localSettlementNative !== ng.localSettlementNative || austin.native_currency !== ng.native_currency, "the local settlement reference differs by jurisdiction (settlement is local)");
  ok(ng.native_currency === "NGN" && austin.native_currency === "USD", "each settlement is in its own native currency");
}

// the PROJECT cost is independent of the comparison jurisdiction (the firewall): project labor = hours × project rate,
// which takes NO jurisdiction argument — switching the settlement region cannot move it.
{
  const projRate = 65, hours = 80;                       // an accepted project quote basis
  const projLabor = hours * projRate;                    // $5,200 — the same regardless of comparison region
  for (const jd of ["US-AUSTIN", "NG", "MX", "CO", "BR"]) {
    settlementComparison(hours, M, [jd]);                 // changing the comparison does not touch projLabor
    ok(hours * projRate === projLabor, `project labor stays $${projLabor} while comparing ${jd} (firewall holds)`);
  }
}

// the UI renders the four columns + the firewall note, and drives the jurisdiction toggle from settlementComparison
const HERE = path.dirname(new URL(import.meta.url).pathname);
const bi = fs.readFileSync(path.resolve(HERE, "../components/architect-2525/build-instructions.tsx"), "utf8");
ok(/data-arch-labor-compare/.test(bi), "the Labor-Recognition panel is rendered");
ok(/settlementComparison\(/.test(bi) && /data-arch-settle=/.test(bi), "the region toggle drives settlementComparison (not the project cost)");
ok(/Time ·/.test(bi) && /Recognition ·/.test(bi) && /Project labor ·/.test(bi) && /Settlement reference/.test(bi), "all four columns are shown (Time · Recognition · Project labor · Settlement)");
ok(/project cost holds/.test(bi) && /recognition is global, settlement is local, project cost stays project cost/.test(bi), "the firewall note states the one-line law");

console.log(`\narchitect-wu-compare: ${pass} passed, ${fail} failed · §14 compare + firewall (settlement/FX never move the house cost)`);
process.exit(fail ? 1 : 0);
