// ARCHITECT-2525 · SIMULATE PRINTS ITS VISUALS (operator 2026-11-03: "ensure simulation tab prints visuals; see PDF
// downloads from Vision-2525 and SoI-2525 export of S1–S18 to see lessons learned there"). Source-scan gate (like
// architect-sim-ux) over the new print deck + its wiring. INVARIANTS: the deck is the proven SoI window.print() idiom
// (off-stage portal + print-color-adjust:exact + per-page breaks), orientation is user-defined (no pinned @page
// orientation) with BOTH responsive branches, the mockups + matrix are mounted so the PDF carries the visuals, and
// the numbers come from the SAME engine (no re-derivation — the $240k one-cost-truth is untouched).
// Run: node tests/architect-sim-print.test.mjs
import fs from "node:fs";
import path from "node:path";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.resolve(HERE, p), "utf8");
const print = read("../components/architect-2525/simulate-print.tsx");
const opts = read("../components/architect-2525/simulate-options.tsx");

// ── the print CSS: the SoI idiom, print-color-adjust, per-page breaks, off-stage, no chrome ──
ok(/print-color-adjust:\s*exact/.test(print) && /-webkit-print-color-adjust:\s*exact/.test(print), "SIM_PRINT_CSS forces print-color-adjust: exact (+ webkit) — the solid CSS-bg bars survive without the user toggling Background graphics");
ok(/@page\s*\{[^}]*size:\s*letter/.test(print), "a REAL @page { size: letter } (not a px custom size)");
ok(!/size:\s*letter\s+(portrait|landscape)/.test(print), "the @page does NOT pin an orientation — the user's print-dialog choice wins (operator: 'render just like phone vs pc')");
ok(/@media\s+print\s+and\s*\(orientation:\s*portrait\)/.test(print) && /@media\s+print\s+and\s*\(orientation:\s*landscape\)/.test(print), "BOTH responsive orientation branches exist (portrait stacks the cards, landscape rows them)");
ok(/break-after:\s*page/.test(print) && /page-break-after:\s*always/.test(print), "per-page break-after + legacy page-break-after (WebKit/iOS)");
ok(/break-before:\s*page/.test(print) && /page-break-before:\s*always/.test(print), "per-page break-before + legacy page-break-before (WebKit/iOS)");
ok(/left:\s*-30000px/.test(print) && /opacity:\s*0/.test(print), "the stack is OFF-STAGE (left:-30000px; opacity:0) so the synchronous print can lay out/measure it — NOT display:none");
ok(/body\s*>\s*\*:not\(\.sim-print-stack\)\s*\{[^}]*display:\s*none/.test(print), "body > *:not(.sim-print-stack){display:none} kills the fixed overlay + app root on paper");
ok(/\[data-noprint\]\s*\{[^}]*display:\s*none/.test(print), "[data-noprint] chrome is hidden on paper");

// ── the stack mounts the VISUALS, as a deck, from the same engine ──
ok(/createPortal\(/.test(print) && /document\.body/.test(print), "the stack is a portal to document.body (sibling of the app root — the SoI pattern)");
ok(/className="sim-print-stack sim-print-offstage"/.test(print), "the portal root is .sim-print-stack .sim-print-offstage");
ok((print.match(/<SimEnvironmentView\b/g) || []).length >= 1 && /models\.map\(/.test(print), "the stack renders a <SimEnvironmentView> per home (the floor-plan mockups the screen hides) over models.map");
ok(/matrix\.map\(/.test(print), "the compare page renders the 13-CHECKS matrix (matrix.map)");
ok((print.match(/className="sim-print-page/g) || []).length >= 2, "the deck has at least a compare page + per-form pages (multiple .sim-print-page)");
ok(/phaseSchedule\(/.test(print), "the per-form page renders the Time-to-build phase bars (phaseSchedule)");
ok(/simResult\(/.test(print), "the per-form page renders the 13 checks (simResult)");

// ── ONE SOURCE / one-cost-truth: numbers come from the imported engine, never re-derived here ──
ok(/from\s+"@\/lib\/architect-sim-options"/.test(print), "the print deck imports the engine from @/lib/architect-sim-options");
ok(/\bcostBreakdown\b/.test(print) && /\bcatalogSum\b/.test(print), "it reads costBreakdown + catalogSum (the same cost source as the card)");
ok(!/function\s+costBreakdown\b/.test(print) && !/function\s+catalogSum\b/.test(print) && !/function\s+costFor\b/.test(print), "it does NOT re-define any cost engine (no fabricated numbers — the $240k one-cost-truth is untouched)");

// ── the trigger + mount in the Simulate tab ──
ok(/import\s*\{\s*SIM_PRINT_CSS,\s*SimulatePrintStack,\s*useSimPrint\s*\}\s*from\s*"\.\/simulate-print"/.test(opts), "simulate-options imports SIM_PRINT_CSS + SimulatePrintStack + useSimPrint");
ok(/const\s*\{\s*printing,\s*printNow\s*\}\s*=\s*useSimPrint\(\)/.test(opts), "it calls useSimPrint()");
ok(/<style>\{SIM_PRINT_CSS\}<\/style>/.test(opts), "it injects the print stylesheet");
ok(/data-arch-sim-print/.test(opts) && /Download as PDF/.test(opts), "the Simulate header carries a human 'Download as PDF' trigger (data-arch-sim-print)");
ok(/\{printing\s*&&\s*\(?\s*\n?\s*<SimulatePrintStack/.test(opts) || /\{printing && <SimulatePrintStack/.test(opts), "the print stack mounts only while printing");
ok(/FormGlyph=\{FormGlyph\}/.test(opts) && /simMeaning=\{SIM_MEANING\}/.test(opts), "FormGlyph + SIM_MEANING are passed as props (no circular import)");

// ── the window.print() timing (3×rAF before the synchronous print, afterprint teardown) ──
ok((print.match(/requestAnimationFrame/g) || []).length >= 3, "printNow waits 3× requestAnimationFrame so the off-stage tree is committed before window.print()");
ok(/window\.print\(\)/.test(print), "it calls window.print() (zero-dependency — no jsPDF/html2canvas, honours the no-runtime-fetch rule)");
ok(/addEventListener\("afterprint"/.test(print), "an afterprint listener unmounts the stack");

// ── the trigger label stays human (architect-voice) ──
ok(!/\bExport deck\b|\bserialize\b|\bDOM\b/.test("Download as PDF"), "the button label is human (Download as PDF), not machine");

// ── R1 · LANDSCAPE one-page-per-design via the 13-CHECKS RIGHT RAIL (operator 2026-11-03: "landscape still has errors") ──
const portraitBlock = (print.match(/@media\s+print\s+and\s*\(orientation:\s*portrait\)\s*\{[\s\S]*?\n\}/) || [""])[0];
const landscapeBlock = (print.match(/@media\s+print\s+and\s*\(orientation:\s*landscape\)\s*\{[\s\S]*?\n\}/) || [""])[0];
ok(/grid-template-areas:[^;]*"body rail"/.test(landscapeBlock), "landscape: the per-home page is a grid that moves the 13-CHECKS into a right RAIL (grid-template-areas … 'body rail') — so the checks no longer add a vertical band and each design is ONE page");
ok(/\.sim-print-home\s*>\s*\.sim-print-checks\s*\{[^}]*grid-area:\s*rail/.test(landscapeBlock) && /className="sim-print-checks"/.test(print), "the per-home 13-CHECKS panel (.sim-print-checks) is the landscape rail (grid-area: rail) and is mounted on the per-home page");
ok(/\.sim-print-home\s*\.sim-checks-grid\s*\{[^}]*grid-template-columns:\s*1fr/.test(landscapeBlock) && /className="sim-checks-grid"/.test(print), "in the rail the checks collapse to one column (.sim-checks-grid → 1fr)");
ok(portraitBlock.length > 0 && !/\.sim-print-home/.test(portraitBlock), "the rail is LANDSCAPE-ONLY — the portrait branch does not re-grid .sim-print-home (portrait stays byte-identical, the operator approved it)");
ok(/className="sim-print-page sim-print-home"/.test(print), "the per-home pages carry .sim-print-home (the compare page does not), so the rail grid targets only them");

// ── R1 · the 13-CHECKS number keeps its column whether or not the ✦ best-marker is in front (operator 2026-11-03) ──
ok(/function\s+MatrixScore\b/.test(print) && /fontVariantNumeric:\s*"tabular-nums"/.test(print), "the PDF matrix uses MatrixScore with tabular-nums (the number does not jump when the ✦ is present)");
ok(/gridTemplateColumns:\s*"0\.8em auto"/.test(print) && /gridTemplateColumns:\s*"0\.8em auto"/.test(opts), "both matrices use a FIXED-WIDTH ✦ marker slot (0.8em) so the number column aligns top-to-bottom (PDF + on-screen)");
ok(/fontVariantNumeric:\s*"tabular-nums"/.test(opts), "the on-screen side-by-side matrix also uses tabular-nums for aligned digits");
ok(!/\{win \? "✦ " : ""\}\{c\.score/.test(print) && !/\{win \? "✦ " : ""\}\{c\.score/.test(opts), "the old inline '✦ '+number (which shifted the digit) is gone from both matrices");

// ── R1 · the compact one-line Download control uses the Vision-2525 download glyph (operator: "make one line, so download doesn't take up so much space") ──
ok(/import\s*\{\s*DownloadGlyph\s*\}\s*from\s*"@\/components\/download-icon"/.test(opts) && /<DownloadGlyph\b/.test(opts), "the Download control reuses the Vision-2525 download glyph (DownloadGlyph), not the word alone");
ok(/data-arch-sim-print[^>]*inline-flex[^>]*shrink-0/.test(opts) || /inline-flex[^>]*shrink-0[^>]*data-arch-sim-print/.test(opts) || /data-arch-sim-print[\s\S]{0,200}inline-flex[\s\S]{0,120}shrink-0/.test(opts), "the Download control is a compact inline chip (inline-flex · shrink-0) that rides the title line");

console.log(`\narchitect-sim-print: ${pass} passed, ${fail} failed · Simulate prints a visual deck (compare + per-home) · off-stage window.print() · orientation user-defined + responsive · landscape one-page via the 13-CHECKS rail · ✦ never shifts the number · same engine (no re-derivation)`);
process.exit(fail ? 1 : 0);
