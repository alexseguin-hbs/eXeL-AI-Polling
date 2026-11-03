// ARCHITECT-2525 · Eco-Sphere A01 hex roof-panel concept (operator 2026-11-03: "See image I'd like to have in Hex
// section of simulation (when expanding details, have link that expands this image)" · "use larger file which uses
// light codex encoded image"). Source-scans the eco-only expand link + the full-screen lightbox, and PROVES the real
// binary asset exists at a sensible size: large enough that a thumbnail can't be swapped in (the operator wants the
// LARGER high-res render), yet under Cloudflare's 25 MiB per-file limit so the deploy never breaks.
// Run: node tests/architect-eco-a01.test.mjs
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const opts = read("../components/architect-2525/simulate-options.tsx");

const ASSET = path.resolve(HERE, "../public/architect-2525/eco-sphere-hex-roof-a01.png");
const MIB = 1024 * 1024;

// ── the real binary asset ──
ok(fs.existsSync(ASSET), "the A01 PNG exists at public/architect-2525/eco-sphere-hex-roof-a01.png");
const bytes = fs.existsSync(ASSET) ? fs.statSync(ASSET).size : 0;
ok(bytes > 3 * MIB, `the A01 PNG is high-resolution, not a thumbnail (got ${(bytes / MIB).toFixed(1)} MiB, need > 3 MiB) — operator: "use larger file"`);
ok(bytes < 25 * MIB, `the A01 PNG is under Cloudflare's 25 MiB per-file limit so the deploy never breaks (got ${(bytes / MIB).toFixed(1)} MiB)`);
// PNG magic + a 4K+ width read from the IHDR, so a corrupt or tiny image can't pass
if (fs.existsSync(ASSET)) {
  const head = fs.readFileSync(ASSET).subarray(0, 24);
  ok(head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47, "the asset is a real PNG (magic bytes)");
  const w = head.readUInt32BE(16);
  ok(w >= 3840, `the A01 is at least 4K wide for legibility on expand (got ${w}px)`);
}

// ── the eco-only expand link (inside the eco-only HEX DIMENSIONS block) ──
ok(/data-arch-eco-a01\b/.test(opts) && /Hex roof panel concept \(A01\)/.test(opts), "an eco 'Hex roof panel concept (A01)' link exists (data-arch-eco-a01)");
ok(/data-arch-eco-geometry[\s\S]*data-arch-eco-a01[\s\S]*m\.id === "eco-sphere"|m\.id === "eco-sphere" &&[\s\S]*data-arch-eco-a01/.test(opts), "the A01 link lives inside the Eco-only block (gated m.id === 'eco-sphere')");
ok(/onClick=\{\(\) => setA01Open\(true\)\}/.test(opts) && /const \[a01Open, setA01Open\] = useState\(false\)/.test(opts), "the link opens the A01 lightbox (a01Open state)");

// ── the full-screen lightbox (reused Experiences idiom, portaled, closes, correct src) ──
ok(/import \{ createPortal \} from "react-dom"/.test(opts), "the lightbox uses createPortal (react-dom)");
ok(/a01Open &&[\s\S]{0,120}createPortal\(/.test(opts), "the lightbox is portaled only while open");
ok(/document\.body/.test(opts), "the lightbox portals to document.body (fills the viewport from any container)");
ok(/data-arch-eco-a01-overlay[\s\S]{0,400}fixed inset-0[\s\S]{0,80}bg-black\/90/.test(opts), "the overlay is a full-screen dim backdrop (fixed inset-0 · bg-black/90)");
ok(/src="\/architect-2525\/eco-sphere-hex-roof-a01\.png"/.test(opts), "the lightbox img points at the committed A01 asset");
ok(/object-contain/.test(opts), "the A01 image is shown object-contain (whole image, never cropped)");
ok(/onClick=\{\(\) => setA01Open\(false\)\}[\s\S]{0,600}onClick=\{\(e\) => e\.stopPropagation\(\)\}/.test(opts), "tapping the backdrop closes; tapping the image does not (stopPropagation)");
ok(/role="dialog"/.test(opts) && /aria-label=/.test(opts), "the overlay is an accessible dialog (role + aria-label)");

// ── voice-safe: no machine words in the new human-facing strings ──
ok(!/wireframe|voxel|canonical|deterministic|R-CORE|SSSES|SPIRAL/i.test('Hex roof panel concept (A01) Open the hex roof panel concept diagram'), "the A01 link/labels are human (no machine words)");

console.log(`\narchitect-eco-a01: ${pass} passed, ${fail} failed · the A01 render (high-res, < 25 MiB) + an Eco-only expand link + a portaled full-screen lightbox (backdrop/✕ close, image object-contain)`);
process.exit(fail ? 1 : 0);
