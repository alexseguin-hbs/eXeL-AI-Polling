// build-pod-asm-inputs.mjs — validate the fleet's simulated member inputs against the SHIPPED record and persist them.
//
// Operator 2026-09-12: "simulate their contributions and inputs (have 4AsM assist each of the 3 members)". Twelve
// reviewer lenses, four per seat, drafted and reconciled the inputs (Workflow run wf_dd2f18d8-670). Nothing here is
// typed by hand: this script reads the fleet's JSON (argv[2]), REFUSES anything a phone could not type — a place that is
// not in the record, an M that is not a published band, a comment that is not 111 words — and writes:
//   docs/asks/2026-09-12_pod_simulated_inputs_asm.json   — the member inputs the showcase types (INPUTS=…)
//   docs/assessments/2026-09-12_pod_asm_assist.md         — who advised what, all twelve comments
//
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs scripts/build-pod-asm-inputs.mjs <fleet.json>
import fs from 'fs'; import path from 'path';
import { COUNTRIES, localitiesOf, defaultForCountry } from '../lib/pod-rates.ts';
import { BANDS } from '../lib/pod-yug.ts';
const ROOT = path.resolve(process.cwd(), '..');
const IN = process.argv[2]; if (!IN) { console.error('usage: build-pod-asm-inputs.mjs <fleet.json>'); process.exit(1); }
const fleet = JSON.parse(fs.readFileSync(IN, 'utf8'));
const OUT_JSON = path.join(ROOT, 'docs/asks/2026-09-12_pod_simulated_inputs_asm.json');
const OUT_MD = path.join(ROOT, 'docs/assessments/2026-09-12_pod_asm_assist.md');
const wc = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const refusals = [];
const refuse = (who, why) => refusals.push(`${who}: ${why}`);

// a place a phone can elect: the country from the first select, the locality (exact text) from the second, if any
function resolvePlace(who, cc, locality) {
  const country = defaultForCountry(cc);
  if (!country) { refuse(who, `country code "${cc}" is not in the record`); return null; }
  const locs = localitiesOf(cc);
  if (!locality) {
    if (country.rate === null) refuse(who, `${country.name} publishes no rate — the receipt would show no figure (allowed, but say so)`);
    return { cc, locality: '', id: country.id, name: country.name, rate: country.rate, currency: country.currency };
  }
  const j = locs.find((x) => x.locality === locality);
  if (!j) { refuse(who, `locality "${locality}" is not offered under ${country.country} — offered: ${locs.map((x) => x.locality ?? 'national').join(' · ')}`); return null; }
  return { cc, locality, id: j.id, name: j.name, rate: j.rate, currency: j.currency };
}
const seats = {};
for (const seat of fleet.seats) {
  const f = seat.final; const who = `${seat.name} (${seat.key})`;
  if (!f) { refuse(who, 'no reconciled input set'); continue; }
  const drafts = seat.drafts || [];
  if (drafts.length !== 3) refuse(who, `${drafts.length} drafts, expected 3`);
  for (const d of [...drafts, f]) if (wc(d.comment) !== 111) refuse(`${who} · ${d.asm}`, `comment is ${wc(d.comment)} words, not 111`);
  const place = resolvePlace(`${who} place`, f.placeCc, f.placeLocality);
  const out = {
    name: seat.name, place, gps: f.gpsLat && f.gpsLon ? { lat: f.gpsLat, lon: f.gpsLon } : null,
    ownOutcome: String(f.ownOutcome || '').trim(), audit: { hours: Number(f.auditHours), did: String(f.auditDid || '').trim() },
    record: String(f.record || '').trim(),
  };
  if (!out.ownOutcome) refuse(who, 'empty own outcome');
  if (!(out.audit.hours > 0)) refuse(who, `audit hours ${f.auditHours} not > 0`);
  if (!out.audit.did) refuse(who, 'empty "what you did"');
  if (wc(out.record) > 40) refuse(who, `record is ${wc(out.record)} words, over 40`);
  if (seat.key === 'lead') {
    if (!String(f.intent || '').trim() || !String(f.outcome || '').trim()) refuse(who, 'lead without intent or outcome');
    if (!(f.planHours > 0)) refuse(who, `plan hours ${f.planHours}`);
    if (!BANDS.some((b) => b.m === f.planM)) refuse(who, `M ${f.planM} is not a published band (${BANDS.map((b) => b.m).join(', ')})`);
    const podPlace = resolvePlace(`${who} pod place`, f.podPlaceCc, f.podPlaceLocality);
    Object.assign(out, { intent: String(f.intent).trim(), outcome: String(f.outcome).trim(), plan: { hours: f.planHours, m: f.planM, reason: String(f.planReason || '').trim() }, podPlace });
  } else if (seat.key === 'lead' ? false : (f.gpsLat || f.gpsLon) && seat.key !== 'ana') refuse(who, 'only Ana takes a GPS fix');
  seats[seat.key] = out;
  seats[seat.key].assist = { drafts: drafts.map((d) => ({ asm: d.asm, lens: d.power, comment: d.comment, words: wc(d.comment), proposed: { place: `${d.placeCc}${d.placeLocality ? ' · ' + d.placeLocality : ''}`, ownOutcome: d.ownOutcome, auditHours: d.auditHours, ...(seat.key === 'lead' ? { intent: d.intent, plan: `${d.planHours} h × ${d.planM}`, podPlace: `${d.podPlaceCc}${d.podPlaceLocality ? ' · ' + d.podPlaceLocality : ''}` } : {}) } })), reconciler: { asm: f.asm, lens: f.power, comment: f.comment, words: wc(f.comment) } };
}
if (refusals.length) { console.error('REFUSED —\n  ' + refusals.join('\n  ')); process.exit(1); }
fs.writeFileSync(OUT_JSON, JSON.stringify({ source: 'Workflow wf_dd2f18d8-670 — 12 reviewer lenses, 4 per seat (3 draft + 1 reconcile)', validatedAgainst: 'lib/pod-rates.ts JURISDICTIONS · lib/pod-yug.ts BANDS', seats }, null, 2));
const md = [`# The three members' contributions, as advised by four reviewers each — 2026-09-12`, '',
  `> simulate their contributions and inputs (have 4AsM assist each of the 3 members).`, '',
  `Twelve reviewer lenses in one Workflow run (\`wf_dd2f18d8-670\`): for every seat, three drafted the member's inputs independently and a fourth reconciled them into one voice. Every input below was validated against the shipped record — a place a phone can elect, an M from the published bands, hours above zero, a comment of exactly 111 words — and is typed into the real pod page by the emulated phones (\`INPUTS=docs/asks/2026-09-12_pod_simulated_inputs_asm.json npm run pod:showcase\`). The app takes no AI input.`, ''];
for (const key of ['lead', 'ana', 'bo']) {
  const s = seats[key]; if (!s) continue;
  md.push(`## ${s.name} — ${key === 'lead' ? 'the lead' : key === 'ana' ? 'seat 2' : 'seat 3'}`, '');
  if (key === 'lead') md.push(`- **Intent:** ${s.intent}`, `- **Measurable outcome:** ${s.outcome}`, `- **Plan:** ${s.plan.hours} h × ${s.plan.m} — ${s.plan.reason}`, `- **Pod place:** ${s.podPlace?.name} (${s.podPlace?.rate} ${s.podPlace?.currency}/h)`);
  md.push(`- **Own place:** ${s.place?.name} (${s.place?.rate ?? 'no rate'} ${s.place?.currency ?? ''}/h)${s.gps ? ` · GPS ${s.gps.lat}, ${s.gps.lon}` : ''}`, `- **Shared record proposed:** ${s.record}`, `- **Own outcome:** ${s.ownOutcome}`, `- **Self-audit:** ${s.audit.hours} h — ${s.audit.did}`, '');
  md.push(`### Advised by`, '');
  for (const d of s.assist.drafts) md.push(`**${d.asm}** (${d.lens}) proposed ${d.proposed.plan ? `plan ${d.proposed.plan}, pod place ${d.proposed.podPlace}, ` : ''}place ${d.proposed.place}, ${d.proposed.auditHours} h claimed. *${d.words} words:*`, '', d.comment, '');
  md.push(`**${s.assist.reconciler.asm}** (${s.assist.reconciler.lens}) reconciled. *${s.assist.reconciler.words} words:*`, '', s.assist.reconciler.comment, '');
}
fs.writeFileSync(OUT_MD, md.join('\n'));
console.log(`written ${path.relative(ROOT, OUT_JSON)} and ${path.relative(ROOT, OUT_MD)} — ${Object.keys(seats).length} seats, 0 refusals`);
