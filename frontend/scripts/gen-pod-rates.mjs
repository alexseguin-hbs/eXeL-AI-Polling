// gen-pod-rates.mjs — regenerate the two data blocks in lib/pod-rates.ts from files the operator can check. The record
// is DATA, transcribed once; nothing in either array is typed by hand.
//
//   sources (in order, never edited here):
//     docs/asks/2026-09-10_minimum_wage_rate_table.psv          — the operator's 114 rows (8 columns)      → REGION_RATES
//     docs/asks/2026-09-11_minimum_wage_rate_table_approved.psv — rows he approved under Rule B (8 + provenance) → REGION_RATES
//     docs/asks/2026-09-12_exel_ai_global_minimum_wage_master_2026.csv — the TRACEABLE DATASET (operator 2026-09-12,
//       "use this traceable data set"), 19 semicolon-separated columns, quoted fields, BOM        → DATASET_ROWS
//
//   node scripts/gen-pod-rates.mjs
import fs from 'fs';
import path from 'path';
const ROOT = path.resolve(process.cwd(), '..');
const SOURCES = [
  ['operator-2026-09-10', path.join(ROOT, 'docs/asks/2026-09-10_minimum_wage_rate_table.psv')],
  ['approved-2026-09-11', path.join(ROOT, 'docs/asks/2026-09-11_minimum_wage_rate_table_approved.psv')],
];
const DATASET = path.join(ROOT, 'docs/asks/2026-09-12_exel_ai_global_minimum_wage_master_2026.csv');
const TARGET = path.join(process.cwd(), 'lib/pod-rates.ts');
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const refuse = (why) => { console.error(`REFUSED — ${why}`); process.exit(1); };

// ── REGION_RATES: the operator's rows and the rows he approved ─────────────────────────────────────────────────────
const lines = []; const counts = {};
for (const [tag, file] of SOURCES) {
  if (!fs.existsSync(file)) { counts[tag] = 0; continue; }
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.trim()).map((l) => l.split('|'));
  const body = rows[0][0] === 'Language' ? rows.slice(1) : rows;            // the approved file carries a header
  counts[tag] = body.length;
  for (const r of body) {
    const [lang, cc, name, cur, rate, pub, nosingle, notes] = r;
    if (!/^[A-Z]{2}$/.test(cc) || !/^[A-Z]{3}$/.test(cur) || !(rate === 'NULL' || Number(rate) > 0) || !['Yes', 'No'].includes(pub) || !['Yes', 'No'].includes(nosingle)) {
      refuse(`malformed row in ${tag}: ${r.join('|').slice(0, 90)}`);
    }
    lines.push(`  { lang: "${esc(lang)}", cc: "${cc}", name: "${esc(name)}", currency: "${cur}", rate: ${rate === 'NULL' ? 'null' : rate}, published: ${pub === 'Yes'}, noSingleRate: ${nosingle === 'Yes'}, note: "${esc(notes)}"${tag === 'approved-2026-09-11' ? ', approved: "2026-09-11"' : ''} },`);
  }
}

// ── DATASET_ROWS: the traceable dataset, every row, every column that decides something ───────────────────────────
// A real CSV parser for one dialect: ';' separator, '"' quoting with '""' escapes, CRLF or LF, optional BOM.
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; continue; }
    if (c === '"') q = true;
    else if (c === ';') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const EXPECTED_HEADER = 'record_type;country_code;subdivision_code;jurisdiction;exel_languages;currency_code;hourly_wage_rate;effective_floor_hourly;candidate_hourly_rate;official_published;no_single_national_rate;source_verified;effective_date;rate_scope;source_rate;source_period;source_url;notes;as_of_date';
const dsLines = []; let dsCount = 0;
if (fs.existsSync(DATASET)) {
  const rows = parseCsv(fs.readFileSync(DATASET, 'utf8').replace(/^﻿/, ''));
  if (rows[0].join(';') !== EXPECTED_HEADER) refuse(`dataset header changed — the transcription rules were written for 19 named columns:\n${rows[0].join(';')}`);
  const H = rows[0];
  const num = (s, what, r) => { if (s === '') return null; const n = Number(s); if (!(n > 0)) refuse(`${what} is not a positive number in ${r.jurisdiction}: "${s}"`); return n; };
  const yn = (s, what, r) => { if (s === '') return null; if (s !== 'Yes' && s !== 'No') refuse(`${what} is neither Yes, No nor empty in ${r.jurisdiction}: "${s}"`); return s === 'Yes'; };
  for (const raw of rows.slice(1)) {
    if (raw.length !== H.length) refuse(`row has ${raw.length} fields, header has ${H.length}: ${raw.join(';').slice(0, 80)}`);
    const r = Object.fromEntries(H.map((k, i) => [k, raw[i]]));
    if (!['Country', 'US State', 'US District'].includes(r.record_type)) refuse(`unknown record_type "${r.record_type}"`);
    if (!/^[A-Z]{2}$/.test(r.country_code)) refuse(`country_code "${r.country_code}" for ${r.jurisdiction}`);
    if (r.record_type !== 'Country' && !/^US-[A-Z]{2}$/.test(r.subdivision_code)) refuse(`subdivision_code "${r.subdivision_code}" for ${r.jurisdiction}`);
    if (r.currency_code !== '' && !/^[A-Z]{3}$/.test(r.currency_code)) refuse(`currency_code "${r.currency_code}" for ${r.jurisdiction}`);
    if (r.source_verified !== 'Yes' && r.source_verified !== 'No') refuse(`source_verified "${r.source_verified}" for ${r.jurisdiction}`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(r.as_of_date)) refuse(`as_of_date "${r.as_of_date}" for ${r.jurisdiction}`);
    const hourly = num(r.hourly_wage_rate, 'hourly_wage_rate', r), floor = num(r.effective_floor_hourly, 'effective_floor_hourly', r), cand = num(r.candidate_hourly_rate, 'candidate_hourly_rate', r);
    if (floor !== null && r.source_verified !== 'Yes') refuse(`a floor without a verified source would settle people on a guess: ${r.jurisdiction}`);
    if (cand !== null && (hourly !== null || floor !== null)) refuse(`a row is either a floor or a candidate, never both: ${r.jurisdiction}`);
    if (floor !== null && r.currency_code === '') refuse(`a floor with no currency: ${r.jurisdiction}`);
    const langs = r.exel_languages === '' ? [] : r.exel_languages.split('|');
    dsCount++;
    dsLines.push(`  { type: "${r.record_type}", cc: "${r.country_code}", sub: "${r.subdivision_code}", name: "${esc(r.jurisdiction)}", langs: [${langs.map((l) => `"${esc(l)}"`).join(', ')}], currency: ${r.currency_code === '' ? 'null' : `"${r.currency_code}"`}, hourly: ${hourly ?? 'null'}, floor: ${floor ?? 'null'}, candidate: ${cand ?? 'null'}, published: ${yn(r.official_published, 'official_published', r) ?? 'null'}, noSingleRate: ${yn(r.no_single_national_rate, 'no_single_national_rate', r) ?? 'null'}, verified: ${r.source_verified === 'Yes'}, effective: "${esc(r.effective_date)}", scope: "${esc(r.rate_scope)}", sourceRate: "${esc(r.source_rate)}", sourcePeriod: "${esc(r.source_period)}", sourceUrl: "${esc(r.source_url)}", note: "${esc(r.notes)}", asOf: "${r.as_of_date}" },`);
  }
}

// ── FX_TO_USD: dated, sourced exchange rates — the only way a USA equivalent may be computed ─────────────────────
const FX = path.join(ROOT, 'docs/asks/2026-09-12_fx_to_usd.psv');
const fxLines = [];
if (fs.existsSync(FX)) {
  const rows = fs.readFileSync(FX, 'utf8').split('\n').filter((l) => l.trim()).map((l) => l.split('|'));
  if (rows[0].join('|') !== 'Currency|Units per USD|As of|Source') refuse('fx file header changed');
  for (const [cur, per, asOf, source] of rows.slice(1)) {
    if (!/^[A-Z]{3}$/.test(cur) || !(Number(per) > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(asOf) || !source) refuse(`fx row without currency, positive rate, date and source: ${cur}|${per}|${asOf}|${source}`);
    fxLines.push(`  { currency: "${cur}", perUsd: ${per}, asOf: "${asOf}", source: "${esc(source)}" },`);
  }
}

// ── write the blocks ───────────────────────────────────────────────────────────────────────────────────────────────
let src = fs.readFileSync(TARGET, 'utf8');
function replaceBlock(head) {
  const start = src.indexOf(head);
  if (start < 0) refuse(`${head.slice(0, 40)} block not found`);
  const end = src.indexOf('\n]', start) + 2;
  return [start, end];
}
{
  const [s, e] = replaceBlock('export const REGION_RATES: RegionRate[] = [');
  src = src.slice(0, s) + 'export const REGION_RATES: RegionRate[] = [\n' + lines.join('\n') + '\n]' + src.slice(e);
}
{
  const [s, e] = replaceBlock('export const DATASET_ROWS: DatasetRow[] = [');
  src = src.slice(0, s) + 'export const DATASET_ROWS: DatasetRow[] = [\n' + dsLines.join('\n') + '\n]' + src.slice(e);
}
{
  const [s, e] = replaceBlock('export const FX_TO_USD: FxRow[] = [');
  src = src.slice(0, s) + 'export const FX_TO_USD: FxRow[] = [\n' + fxLines.join('\n') + '\n]' + src.slice(e);
}
fs.writeFileSync(TARGET, src);
console.log(`FX_TO_USD regenerated: ${fxLines.length} rows (docs/asks/2026-09-12_fx_to_usd.psv)`);
console.log(`REGION_RATES regenerated: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(' + ')} = ${lines.length} rows`);
console.log(`DATASET_ROWS regenerated: dataset-2026-09-12 ${dsCount} rows`);
