#!/usr/bin/env node
/**
 * ATLANTIS QR — MAXIMIZED IS A TRUE OPAQUE FULL-SCREEN OVERLAY (operator 2026-11-06: "qr code maximized does
 * not match and is not full screen"; MoT overnight rulings).
 *
 * The maximized ("⤢") state of the Atlantis Accords website QR must be a clean, opaque, full-viewport overlay:
 * no page bleed-through, QR + caption + exit control always in view, backdrop tap / Escape un-maximize (never a
 * full close), and the exit label is i18n'd (no hardcoded English literal). This gate reads the component source
 * and locks those invariants so the fix cannot silently regress.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const FRONTEND = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = readFileSync(path.join(FRONTEND, "components", "atlantis-accord-viewer.tsx"), "utf8");

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// Isolate the maximized branch: `{showQr && ( qrMax ? ( …maximized… ) : ( …card… ) )}`
const start = src.indexOf("qrMax ? (");
const elseAt = src.indexOf(") : (", start);
ok(start > 0 && elseAt > start, "maximized branch (`qrMax ? ( … ) : (`) is present");
const maxSlice = start > 0 && elseAt > start ? src.slice(start, elseAt) : "";

// The maximized overlay's own className is the FIRST className in the branch (the full-screen ground div).
const groundMatch = maxSlice.match(/className="([^"]*)"/);
const ground = groundMatch ? groundMatch[1] : "";
ok(ground.length > 0, "maximized overlay has a className");

// 1) OPAQUE GROUND — a solid theme color, no alpha-suffixed background, no backdrop blur.
ok(/\bbg-background\b/.test(ground), "maximized ground is opaque bg-background");
ok(!/\bbg-[\w-]+\/\d+\b/.test(ground), "maximized ground has NO alpha-suffixed background (no bg-*/<alpha> bleed-through)");
ok(!/backdrop-blur/.test(ground), "maximized ground has NO backdrop-blur (true opaque, not a dim)");

// 2) Z-INDEX >= 80 — sits above all page chrome.
const zMatch = ground.match(/z-\[(\d+)\]/);
ok(zMatch && Number(zMatch[1]) >= 80, `maximized ground z-index >= 80 (found ${zMatch ? zMatch[1] : "none"})`);

// 3) i18n EXIT LABEL — the visible exit control uses t(), never a hardcoded "Exit full screen" literal.
ok(!/Exit full screen/.test(src), "no hardcoded 'Exit full screen' string literal anywhere in the component");
ok(maxSlice.includes('/> {t("atlantis.exit_fullscreen_qr")}'), "visible exit label uses t('atlantis.exit_fullscreen_qr')");

// 4) BACKDROP TAP UN-MAXIMIZES (not a full close) — ground onClick → setQrMax(false), never closeQr.
ok(!/onClick=\{closeQr\}/.test(maxSlice), "maximized backdrop is NOT wired to closeQr (full close)");
ok(/onClick=\{\(\) => setQrMax\(false\)\}/.test(maxSlice), "maximized backdrop onClick un-maximizes via setQrMax(false)");

// 5) ESCAPE UN-MAXIMIZES — a keydown handler maps Escape to setQrMax(false).
ok(/addEventListener\("keydown"/.test(src) && /e\.key === "Escape"/.test(src) && /setQrMax\(false\)/.test(src),
  "Escape keydown un-maximizes (setQrMax(false))");

// 6) FITS IN LANDSCAPE — column scrolls, honors the safe area, QR tile sized to the viewport.
ok(/overflow-y-auto/.test(ground), "maximized column is overflow-y-auto (exit control reachable in landscape)");
ok(/pb-\[env\(safe-area-inset-bottom\)\]/.test(ground), "maximized column pads the bottom safe-area inset");
ok(/60dvh/.test(maxSlice), "QR tile is sized against the dynamic viewport (60dvh)");

console.log(`\nATLANTIS-QR-FULLSCREEN ${pass}/${pass + fail} passed — maximized QR is a true opaque full-screen overlay`);
if (fail > 0) process.exit(1);
