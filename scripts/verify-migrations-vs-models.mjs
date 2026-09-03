// verify-migrations-vs-models.mjs — every table the backend declares must be created by a
// migration. One verdict; exits 1 on any orphan.
//
// WHY: the 2026-09-02 gap assessment found four tables (usage_records, blockchain_records,
// arx_items, arx_transactions) that were mounted, queried and unit-tested — and did not exist
// in the deployed schema, because no migration ever created them. Nothing compared the two
// sides. This does, so an orphan table can never ship silently again.
//
// Run: node scripts/verify-migrations-vs-models.mjs
import fs from 'fs';
import path from 'path';

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!/node_modules|__pycache__|\.venv/.test(e.name)) walk(p, out); }
    else if (e.name.endsWith('.py')) out.push(p);
  }
  return out;
};

// Every `__tablename__ = "x"` in the backend, with the file that declares it.
const models = new Map();
for (const f of walk('backend/app')) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/__tablename__\s*=\s*["']([a-z_0-9]+)["']/g)) models.set(m[1], f);
}

// Every table a migration creates (case-insensitive, optional IF NOT EXISTS / schema prefix).
const created = new Set();
for (const f of fs.readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql'))) {
  const sql = fs.readFileSync(path.join('supabase/migrations', f), 'utf8');
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?"?([a-z_0-9]+)"?/gi)) created.add(m[1].toLowerCase());
}

const orphans = [...models.keys()].filter((t) => !created.has(t)).sort();
for (const t of [...models.keys()].sort()) console.log(`${created.has(t) ? 'ok     ' : 'ORPHAN '} ${t.padEnd(32)} ${models.get(t)}`);
console.log(`\n${models.size} model table(s) · ${created.size} created by migrations · ${orphans.length} orphan(s)`);
if (orphans.length) {
  console.error('\nA table the backend declares has no migration — it does not exist in the deployed schema:');
  for (const t of orphans) console.error('  ' + t);
  process.exit(1);
}
