// manta-bounds.mjs — first-principles BOUNDING calculators for the Manta family.
//
//   Bounding estimate only; not design evidence.
//
// Every number this prints is arithmetic on stated assumptions. None of it is a hydrostatic
// model, a structural design, certification evidence, a safety case, or an operational
// authorization. External-pressure hulls are governed by collapse, buckling, stiffeners,
// endcaps, penetrations, welds, fatigue, inspection and class rules — none of which appear
// in the equation below. (Handoff §9, §11.)
//
// Usage:
//   node scripts/manta-bounds.mjs displacement --dry 33 --payload 1.8 --ballast 10.2
//   node scripts/manta-bounds.mjs pressure --depth 33 [--radius 4 --sf 2.5 --sigma 500]
//   node scripts/manta-bounds.mjs oxygen --crew 4 --hours 24
//   node scripts/manta-bounds.mjs battery --need-kwh 16.8 --capacity-kwh 350
//   node scripts/manta-bounds.mjs --reproduce      recompute every table in the handoff and
//                                                  report where the handoff's own numbers drift
import fs from 'fs';

const WARN = 'Bounding estimate only; not design evidence.';
const BOUNDARY = 'This output is for conceptual critique only. It is not a design baseline, safety case, certification approval, procurement authority, construction authorization, operational doctrine, hurricane-safety advice, or human-test plan. All safety-critical domains remain Red until validated by qualified human experts.';

const M = JSON.parse(fs.readFileSync('docs/manta-2525/manta-trinity.v1.7.1.json', 'utf8'));
const RHO = M.hydrostatics.rho_sw_kg_m3;                       // kg/m³ seawater
const { sigma_y_MPa: SIGMA, safety_factor: SF, radius_m: R, g_m_s2: G } = M.pressure_hull.assumptions;
const { o2_L_per_person_hour: O2_LPH, kwh_per_m3_o2_base: KWH_M3, margin: MARGIN } = M.life_support.constants_reverse_engineered_from_table;

/* ── the four calculators (pure) ───────────────────────────────────────────── */
export const displacement = ({ dry_t, payload_t = 0, ballast_t = 0 }) => {
  const total_t = dry_t + payload_t + ballast_t;
  return { total_t, volume_m3: (total_t * 1000) / RHO, equation: 'ρ_sw · V_d = M_dry + M_ballast + M_payload' };
};
export const pressure = ({ depth_m, radius_m = R, sf = SF, sigma_MPa = SIGMA }) => {
  const P_MPa = (RHO * G * depth_m) / 1e6;                     // gauge pressure from the water column
  return { depth_m, P_MPa, t_mm: ((P_MPa * radius_m * sf) / sigma_MPa) * 1000, equation: 't_min = (P · R · SF) / σ_y' };
};
export const oxygen = ({ crew, hours }) => {
  const o2_L = crew * hours * O2_LPH;
  return { crew, hours, o2_L, energy_kwh: (o2_L / 1000) * KWH_M3 * MARGIN, note: `${O2_LPH} L/person/h · ${KWH_M3} kWh/m³ · ×${MARGIN} margin` };
};
export const battery = ({ need_kwh, capacity_kwh }) => ({ need_kwh, capacity_kwh, percent: (need_kwh / capacity_kwh) * 100 });

/* ── CLI ───────────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? Number(args[i + 1]) : d; };
const banner = () => { console.log('\n' + WARN + '\n' + BOUNDARY + '\n'); };
const fmt = (n, d = 1) => Number(n).toLocaleString('en-US', { maximumFractionDigits: d });

if (args.includes('--reproduce')) {
  banner();
  let drift = 0;
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  // Relative tolerance for the big tables: the handoff rounds O₂ litres before multiplying, which
  // moves the largest rows by ~0.1 % — that is rounding, not drift. 0.5 % separates the two.
  const rel = (a, b, p) => Math.abs(a - b) <= Math.abs(b) * p;

  console.log('HYDROSTATICS — does dry + payload + ballast equal the stated displacement?');
  for (const b of M.hydrostatics.bounds) {
    if (b.ballast_t == null) { console.log(`  ${b.platform.padEnd(14)} ballast "variable" — cannot close the sum; ${b.displacement_t} − ${b.dry_t} − ${b.payload_t} leaves ${fmt(b.displacement_t - b.dry_t - b.payload_t)} t for ballast`); continue; }
    const d = displacement({ dry_t: b.dry_t, payload_t: b.payload_t, ballast_t: b.ballast_t });
    const ok = rel(d.total_t, b.displacement_t, 0.001);
    if (!ok) drift++;
    console.log(`  ${b.platform.padEnd(14)} sum ${fmt(d.total_t)} t vs stated ${fmt(b.displacement_t)} t  ${ok ? 'ok' : 'DRIFT ' + fmt(b.displacement_t - d.total_t) + ' t unaccounted'}   (V_d ≈ ${fmt(d.volume_m3)} m³)`);
  }

  console.log('\nPRESSURE HULL — t = P·R·SF/σ with P = ρ·g·depth  (R ' + R + ' m, SF ' + SF + ', σ ' + SIGMA + ' MPa)');
  for (const b of M.pressure_hull.bounds) {
    const p = pressure({ depth_m: b.depth_m });
    const okP = near(p.P_MPa, b.pressure_MPa, 0.06), okT = near(p.t_mm, b.thickness_mm, 1.0);
    if (!okT) drift++;
    console.log(`  ${String(b.depth_m).padStart(5)} m  P ${fmt(p.P_MPa, 2)} MPa (stated ${b.pressure_MPa})  t ${fmt(p.t_mm, 1)} mm (stated ~${b.thickness_mm})  ${okP && okT ? 'ok' : 'DRIFT'}`);
  }

  console.log('\nLIFE SUPPORT — O₂ energy with the constants that reproduce the table (' + O2_LPH + ' L/p/h · ' + KWH_M3 + ' kWh/m³ · ×' + MARGIN + ')');
  for (const b of M.life_support.bounds) {
    const lo = oxygen({ crew: b.crew[0], hours: b.duration_h }), hi = oxygen({ crew: b.crew[1], hours: b.duration_h });
    const ok = rel(lo.o2_L, b.o2_L[0], 0.005) && rel(hi.o2_L, b.o2_L[1], 0.005) && rel(lo.energy_kwh, b.energy_kwh[0], 0.005) && rel(hi.energy_kwh, b.energy_kwh[1], 0.005);
    if (!ok) drift++;
    console.log(`  ${b.platform.padEnd(14)} O₂ ${fmt(lo.o2_L, 0)}–${fmt(hi.o2_L, 0)} L (stated ${fmt(b.o2_L[0], 0)}–${fmt(b.o2_L[1], 0)})  energy ${fmt(lo.energy_kwh, 1)}–${fmt(hi.energy_kwh, 1)} kWh (stated ${b.energy_kwh[0]}–${b.energy_kwh[1]})  ${ok ? 'ok' : 'DRIFT'}`);
  }

  console.log('\nBATTERY — refuge O₂ energy as a share of the stated pack');
  for (const b of M.life_support.bounds) {
    const p = M.platforms.find((x) => x.id === b.platform);
    const cap = Array.isArray(p.battery_kwh) ? p.battery_kwh[0] : p.battery_kwh;
    const pct = battery({ need_kwh: b.energy_kwh[1], capacity_kwh: cap });
    console.log(`  ${b.platform.padEnd(14)} ${b.energy_kwh[1]} kWh of ${fmt(cap, 0)} kWh = ${fmt(pct.percent, 2)} %   (O₂ generation alone; CO₂, thermal, hotel loads NOT included)`);
  }

  console.log(`\n${drift === 0 ? 'Every table in the handoff reproduces from its own equations.' : drift + ' row(s) in the handoff do not reproduce from the handoff\'s own equations — see CRITIQUE.'}`);
  console.log('\n' + WARN);
  process.exit(0);
}

const cmd = args[0];
banner();
if (cmd === 'displacement') { const r = displacement({ dry_t: opt('dry', 0), payload_t: opt('payload', 0), ballast_t: opt('ballast', 0) }); console.log(r.equation); console.log(`  M_total ${fmt(r.total_t, 2)} t → V_d ${fmt(r.volume_m3, 2)} m³ at ρ_sw ${RHO} kg/m³`); }
else if (cmd === 'pressure') { const r = pressure({ depth_m: opt('depth', 33), radius_m: opt('radius', R), sf: opt('sf', SF), sigma_MPa: opt('sigma', SIGMA) }); console.log(r.equation); console.log(`  ${r.depth_m} m → P ${fmt(r.P_MPa, 3)} MPa → t_min ${fmt(r.t_mm, 1)} mm`); console.log('  NOT in this equation: ' + M.pressure_hull.governed_by_not_the_equation.join(', ')); }
else if (cmd === 'oxygen') { const r = oxygen({ crew: opt('crew', 4), hours: opt('hours', 24) }); console.log(`  ${r.crew} crew × ${r.hours} h → O₂ ${fmt(r.o2_L, 0)} L → ${fmt(r.energy_kwh, 1)} kWh  (${r.note})`); console.log('  NOT solved: ' + M.life_support.not_solved.join(', ')); }
else if (cmd === 'battery') { const r = battery({ need_kwh: opt('need-kwh', 0), capacity_kwh: opt('capacity-kwh', 1) }); console.log(`  ${r.need_kwh} kWh of ${r.capacity_kwh} kWh = ${fmt(r.percent, 2)} %`); }
else { console.log('usage: displacement | pressure | oxygen | battery | --reproduce'); }
console.log('\n' + WARN);
