// copy-pdf-worker.mjs — put pdfjs's worker where the static export can serve it.
// `output: 'export'` cannot emit a bare-specifier `new URL(...)` asset reliably (Enlil, round 1),
// so the worker is copied verbatim to public/ and referenced as "/pdf.worker.min.mjs".
// Runs in predev + prebuild. Idempotent; skips when already identical.
import fs from 'fs';
import path from 'path';
const src = path.join('node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs');
const dst = path.join('public', 'pdf.worker.min.mjs');
if (!fs.existsSync(src)) { console.error('copy-pdf-worker: pdfjs-dist not installed'); process.exit(1); }
const a = fs.readFileSync(src);
if (fs.existsSync(dst) && Buffer.compare(a, fs.readFileSync(dst)) === 0) { console.log('pdf worker up to date'); }
else { fs.writeFileSync(dst, a); console.log('pdf worker copied → public/pdf.worker.min.mjs (' + a.length + ' bytes)'); }
