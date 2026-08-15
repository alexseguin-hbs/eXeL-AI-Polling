// Upload Vision 2525 per-language block maps into Supabase (table: vision2525_i18n).
// Source of truth = docs/i18n/vision2525.<lang>.json  { block_id: html }.
// English is the static base and is NOT uploaded.
//
// Usage:
//   node scripts/vision2525-i18n-upload.mjs            # all non-en language JSONs present
//   node scripts/vision2525-i18n-upload.mjs fr de zh   # specific languages
//
// Env (required): NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY.
// Writes use the service-role key (bypasses RLS). Upsert on (lang, block_id, doc_version).
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const ROOT = '/home/user/eXeL-AI-Polling';
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY'); process.exit(2); }

// doc_version = the current #dlrel2 in the living document.
const doc = readFileSync(`${ROOT}/docs/SOI_VISION2525_LIVING_DOCUMENT.html`, 'utf8');
const DOC_VERSION = parseInt((doc.match(/id="dlrel2">(\d+)</) || [])[1] || '208', 10);

const i18nDir = `${ROOT}/docs/i18n`;
let langs = process.argv.slice(2);
if (!langs.length) {
  langs = readdirSync(i18nDir)
    .map((f) => (f.match(/^vision2525\.([a-z]{2})\.json$/) || [])[1])
    .filter((c) => c && c !== 'en');
}

const endpoint = `${URL.replace(/\/$/, '')}/rest/v1/vision2525_i18n`;
async function upsertBatch(rows) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: KEY, Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${(await res.text()).slice(0, 300)}`);
}

let grand = 0;
for (const lang of langs) {
  const p = `${i18nDir}/vision2525.${lang}.json`;
  if (!existsSync(p)) { console.log(`skip ${lang}: no json`); continue; }
  const map = JSON.parse(readFileSync(p, 'utf8'));
  const rows = Object.keys(map)
    .filter((id) => typeof map[id] === 'string' && map[id].length)
    .map((id) => ({ lang, block_id: id, html: map[id], doc_version: DOC_VERSION }));
  // batch to keep request bodies sane (giant blocks are large)
  const BATCH = 25;
  for (let i = 0; i < rows.length; i += BATCH) {
    let attempt = 0;
    for (;;) {
      try { await upsertBatch(rows.slice(i, i + BATCH)); break; }
      catch (e) {
        if (++attempt > 4) throw e;
        await new Promise((r) => setTimeout(r, 500 * 2 ** attempt)); // backoff on transient/429
      }
    }
  }
  grand += rows.length;
  console.log(`${lang}: upserted ${rows.length} rows (doc_version ${DOC_VERSION})`);
}
console.log(`DONE — ${grand} rows across ${langs.length} language(s) into vision2525_i18n @ v${DOC_VERSION}`);
