// copy-migration.mjs — serve the Sign Doc migrations as ONE static file so the "Why can't I sign?" panel can hand them to the
// operator on the phone (copy → Supabase SQL editor → Run) when the hosted project has not applied them (operator 2026-09-08:
// "fix after download enabled"). 036 and every later 03x_sign* migration (037 …) are concatenated in order, so one paste applies
// them all; each is idempotent (create or replace). Runs in predev + prebuild; idempotent.
import fs from 'fs';
import path from 'path';
const dir = path.join('..', 'supabase', 'migrations');
const dst = path.join('public', 'sql', '036_sign_envelopes.sql');
if (!fs.existsSync(dir)) {
  // a frontend-only checkout (a scratch build copy) has no ../supabase — keep the copy already in public/, fail only if there is none
  if (fs.existsSync(dst)) { console.log('copy-migration: source absent, keeping public/sql/036_sign_envelopes.sql'); process.exit(0); }
  console.error('copy-migration: ' + dir + ' missing and no public copy'); process.exit(1);
}
const files = fs.readdirSync(dir).filter((f) => /^03[6-9]_sign.*\.sql$/.test(f)).sort();
const a = Buffer.from(files.map((f) => `-- ===== ${f} =====\n` + fs.readFileSync(path.join(dir, f), 'utf8').trimEnd() + '\n').join('\n'));
fs.mkdirSync(path.dirname(dst), { recursive: true });
if (fs.existsSync(dst) && Buffer.compare(a, fs.readFileSync(dst)) === 0) console.log(`migrations up to date (${files.join(' + ')})`);
else { fs.writeFileSync(dst, a); console.log(`migrations copied → public/sql/036_sign_envelopes.sql (${files.join(' + ')}, ${a.length} bytes)`); }
