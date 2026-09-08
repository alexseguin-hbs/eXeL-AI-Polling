// copy-migration.mjs — serve migration 036 as a static file so the "Why can't I sign?" panel can hand it to
// the operator on the phone (copy → Supabase SQL editor → Run) when the hosted project has not applied it
// (operator 2026-09-08: "fix after download enabled"). Runs in predev + prebuild; idempotent.
import fs from 'fs';
import path from 'path';
const src = path.join('..', 'supabase', 'migrations', '036_sign_envelopes.sql');
const dst = path.join('public', 'sql', '036_sign_envelopes.sql');
if (!fs.existsSync(src)) {
  // a frontend-only checkout (a scratch build copy) has no ../supabase — keep the copy already in public/, fail only if there is none
  if (fs.existsSync(dst)) { console.log('copy-migration: source absent, keeping public/sql/036_sign_envelopes.sql'); process.exit(0); }
  console.error('copy-migration: ' + src + ' missing and no public copy'); process.exit(1);
}
fs.mkdirSync(path.dirname(dst), { recursive: true });
const a = fs.readFileSync(src);
if (fs.existsSync(dst) && Buffer.compare(a, fs.readFileSync(dst)) === 0) console.log('migration 036 up to date');
else { fs.writeFileSync(dst, a); console.log('migration 036 copied → public/sql/036_sign_envelopes.sql (' + a.length + ' bytes)'); }
