// build-fleet-rate-proposal.mjs — the 48-agent fleet's minimum-wage research, as a PROPOSAL sheet. Never the record.
//
// Operator (2026-09-11): "are all official country locations and USA states min wage reflected?" — no; and the decision:
// "Fleet researches, you approve." From this environment no official source is reachable, so every row carries
// verified = no and NOTHING here touches lib/pod-rates.ts or the operator's 114 rows. Output: a .psv in the operator's
// own eight columns plus provenance columns, and a review .md that is the approval surface.
//
//   node scripts/build-fleet-rate-proposal.mjs <fleet.json>
import fs from 'fs';
import path from 'path';
const IN = process.argv[2]; if (!IN) { console.error('usage: build-fleet-rate-proposal.mjs <fleet.json>'); process.exit(2); }
const fleet = JSON.parse(fs.readFileSync(IN, 'utf8'));
const ROOT = path.resolve(process.cwd(), '..');
const OPERATOR = path.join(ROOT, 'docs/asks/2026-09-10_minimum_wage_rate_table.psv');
const OUT_PSV = path.join(ROOT, 'docs/asks/2026-09-11_minimum_wage_rate_table_FLEET_PROPOSAL.psv');
const OUT_MD = path.join(ROOT, 'docs/asks/2026-09-11_minimum_wage_rate_table_FLEET_PROPOSAL.md');
const US_EXTRA = [['DC', 'District of Columbia'], ['PR', 'Puerto Rico'], ['GU', 'Guam'], ['VI', 'U.S. Virgin Islands'], ['AS', 'American Samoa'], ['MP', 'Northern Mariana Islands']];

// The operator's rows — the reference, read only.
const op = fs.readFileSync(OPERATOR, 'utf8').split('\n').filter((l) => l.trim()).map((l) => l.split('|'));
const opByKey = new Map(op.map((r) => [`${r[1]}|${r[2]}`, r]));
const opCountries = new Set(op.map((r) => r[1]));

// ── VALIDATE every proposed row; refuse the sheet on a malformed one ──────────────────────────────────────────────
const errs = []; const rows = [];
for (const p of fleet.packs || []) for (const r of p.rows || []) {
  const where = `${p.region.name}/${r.cc}/${r.jurisdiction}`;
  if (!/^[A-Z]{2}$/.test(r.cc || '')) errs.push(`${where}: country code`);
  if (!/^[A-Z]{3}$/.test(r.currency || '')) errs.push(`${where}: currency code`);
  if (!(r.rate === null || (typeof r.rate === 'number' && r.rate > 0))) errs.push(`${where}: rate must be null or > 0`);
  if (typeof r.official_published !== 'boolean' || typeof r.no_single_rate !== 'boolean') errs.push(`${where}: flags`);
  if (!r.statutory_instrument || !r.as_of || !r.confidence) errs.push(`${where}: provenance (instrument / as_of / confidence)`);
  if (r.rate !== null && r.unit_as_published !== 'hourly' && !/[÷/]/.test(r.conversion_shown || '')) errs.push(`${where}: a converted rate must show its divisor`);
  rows.push({ ...r, region: p.region.name, pod: p.region.pod });
}
if (errs.length) { console.error('REFUSED — malformed rows:'); for (const e of errs.slice(0, 40)) console.error('  ·', e); if (errs.length > 40) console.error(`  · … ${errs.length - 40} more`); process.exit(1); }

// ── CLASSIFY: new / fill (operator NULL) / cross-check (operator has a rate) / blocked (Tier 2/3 until D1/D2) ─────
const section = (r) => {
  const key = `${r.cc}|${r.jurisdiction}`; const o = opByKey.get(key);
  if (!o) return opCountries.has(r.cc) && !/—/.test(r.jurisdiction) ? 'cross-check' : 'new';
  if (o[4] !== 'NULL') return 'cross-check';
  if (o[5] === 'No') return 'blocked-D2';
  if (o[6] === 'Yes') return 'blocked-D1';
  return 'fill';
};
for (const r of rows) r.section = section(r);
// every row: verified = no — there is no path to an official source from here
for (const r of rows) r.verified = 'no — source not reachable from this environment';

// ── TARGET LIST: the union of region_members across the twelve, plus DC and the five territories ─────────────────
const members = new Map();
for (const p of fleet.packs || []) for (const m of p.region_members || []) if (/^[A-Z]{2}$/.test(m.cc || '')) members.set(m.cc, m.name);
const covered = new Set(rows.map((r) => r.cc));
const missingCountries = [...members.entries()].filter(([cc]) => !covered.has(cc) && !opCountries.has(cc));
const usCovered = new Set(rows.filter((r) => r.cc === 'US').map((r) => r.jurisdiction));
const usMissing = US_EXTRA.filter(([, name]) => ![...usCovered].some((j) => j.includes(name)));
const disputed = rows.filter((r) => r.agents_agreed === 'disputed');
const byCc = new Map(); for (const r of rows) byCc.set(r.cc, (byCc.get(r.cc) || 0) + 1);

// ── EMIT the .psv (operator columns first, provenance after) ──────────────────────────────────────────────────────
const yn = (b) => (b ? 'Yes' : 'No');
const psvHead = 'Language|Country Code|Country / Jurisdiction|Currency Code|Hourly Wage Rate|Official Published|No Single National Rate|Notes|section|statutory_instrument|source_url|as_of|unit_as_published|conversion_shown|confidence|agents_agreed|disputed_values|verified|region';
const psv = [psvHead, ...rows.map((r) => [r.language, r.cc, r.jurisdiction, r.currency, r.rate === null ? 'NULL' : r.rate.toFixed(3), yn(r.official_published), yn(r.no_single_rate), r.notes, r.section, r.statutory_instrument, r.source_url, r.as_of, r.unit_as_published, r.conversion_shown, r.confidence, r.agents_agreed, r.disputed_values || '', r.verified, r.region].map((x) => String(x ?? '').replace(/\|/g, '/').replace(/\n/g, ' ')).join('|'))].join('\n');
fs.writeFileSync(OUT_PSV, psv + '\n');

// ── EMIT the review .md — the approval surface ────────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? '').replace(/\|/g, '/').replace(/\n/g, ' ');
const table = (rs) => rs.length ? `| Approve | Language | CC | Jurisdiction | Cur | Hourly | Pub | NoSingle | Instrument · as of | Conversion | Conf | A/B | Notes |\n|:-:|---|---|---|---|---:|:-:|:-:|---|---|:-:|:-:|---|\n` +
  rs.map((r) => `| ☐ | ${esc(r.language)} | ${r.cc} | ${esc(r.jurisdiction)} | ${r.currency} | ${r.rate === null ? '—' : r.rate.toFixed(3)} | ${yn(r.official_published)} | ${yn(r.no_single_rate)} | ${esc(r.statutory_instrument)} · ${esc(r.as_of)} | ${esc(r.conversion_shown)} | ${r.confidence} | ${r.agents_agreed}${r.disputed_values ? ` — ${esc(r.disputed_values)}` : ''} | ${esc(r.notes)} |`).join('\n') : '_none_';
const sec = (k) => rows.filter((r) => r.section === k).sort((a, b) => a.cc.localeCompare(b.cc) || a.jurisdiction.localeCompare(b.jurisdiction));
const md = `# Minimum-wage floors — the fleet's PROPOSAL for the operator's approval

> **NOT LOADED. NOT VERIFIED.** Every figure below was researched by the 48-agent fleet from what it knows; **no official
> source is reachable from this environment**, so nothing has been checked live. This sheet is the approval surface: tick
> a row to approve it; a ticked row is loaded in a separate step, in a dated companion file beside the operator's 114 rows,
> which are never changed. A figure without a named instrument and a date is not a figure — such rows show —.

**Generated 2026-09-11 by \`scripts/build-fleet-rate-proposal.mjs\` from the fleet run.** 12 AsMs × (2 researchers + 1 voter) + 12 MoT completeness coordinators.

## Coverage

| | Count |
|---|---:|
| Rows proposed | ${rows.length} |
| Jurisdictions proposed (by country code) | ${byCc.size} |
| — new (not in the operator's table) | ${sec('new').length} |
| — fills for the operator's NULL rows (his row untouched) | ${sec('fill').length} |
| — cross-checks beside an operator rate (his figure stands) | ${sec('cross-check').length} |
| — blocked until D1 is ruled (Tier 2) | ${sec('blocked-D1').length} |
| — blocked until D2 is ruled (Tier 3) | ${sec('blocked-D2').length} |
| Rows where the two researchers disagreed (shown, never averaged) | ${disputed.length} |
| Target list (union of the twelve regions' members) | ${members.size} |
| Target countries with NO row from any region | ${missingCountries.length}${missingCountries.length ? ` — ${missingCountries.map(([cc, n]) => `${n} (${cc})`).join(', ')}` : ''} |
| DC + the five US territories still missing | ${usMissing.length}${usMissing.length ? ` — ${usMissing.map(([, n]) => n).join(', ')}` : ''} |

## 1 · New jurisdictions — DC, the territories, and countries not in the table

${table(sec('new'))}

## 2 · Fills for the operator's "rate exists, not yet loaded" rows

${table(sec('fill'))}

## 3 · Cross-checks — the fleet's figure beside an operator rate (his stands; a difference is for him to see)

${table(sec('cross-check'))}

## 4 · Blocked until D1 is ruled — no single national rate (the fleet's findings, not loadable)

${table(sec('blocked-D1'))}

## 5 · Blocked until D2 is ruled — no official rate (the fleet's findings, not loadable)

${table(sec('blocked-D2'))}

## Coordinators' completeness notes

${(fleet.packs || []).map((p) => `- **${p.region.name}** (${p.region.pod}): ${esc(p.coord?.note ?? '')}${p.coord?.rows_without_instrument?.length ? ` · rows without an instrument: ${p.coord.rows_without_instrument.join(', ')}` : ''}`).join('\n')}
`;
fs.writeFileSync(OUT_MD, md);
console.log(`written ${OUT_PSV}\nwritten ${OUT_MD}\nrows ${rows.length} · countries ${byCc.size} · new ${sec('new').length} · fill ${sec('fill').length} · cross-check ${sec('cross-check').length} · blocked ${sec('blocked-D1').length + sec('blocked-D2').length} · disputed ${disputed.length} · target ${members.size} · missing ${missingCountries.length} · US extra missing ${usMissing.length}`);
