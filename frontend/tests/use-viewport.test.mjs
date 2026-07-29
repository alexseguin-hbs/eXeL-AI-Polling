// F6 — responsive viewport classifier locks. The pure classifier must map real device/monitor sizes to the
// right resolution CLASS (16:9 · 1080p · 4K · other) + orientation, so all three 2525 apps adapt to one contract.
import { classifyViewport } from "../lib/use-viewport.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ── resolution classes ───────────────────────────────────────────────────────────────────
ok(classifyViewport(1920, 1080).aspectClass === "1080p", "1920×1080 → 1080p");
ok(classifyViewport(3840, 2160).aspectClass === "4k", "3840×2160 → 4k");
ok(classifyViewport(2560, 1440).aspectClass === "1080p", "2560×1440 (QHD 16:9) → 1080p-class (FHD-band 16:9)");
ok(classifyViewport(1280, 720).aspectClass === "16:9", "1280×720 → 16:9");
ok(classifyViewport(1440, 900).aspectClass === "other", "1440×900 (16:10 laptop) → other");
ok(classifyViewport(375, 812).aspectClass === "other", "iPhone 375×812 → other (not 16:9)");
ok(classifyViewport(7680, 4320).aspectClass === "4k", "8K 7680×4320 → 4k-class (≥3200 long edge)");

// ── orientation ──────────────────────────────────────────────────────────────────────────
ok(classifyViewport(375, 812).orientation === "portrait", "phone tall → portrait");
ok(classifyViewport(812, 375).orientation === "landscape", "phone wide → landscape");
ok(classifyViewport(1920, 1080).orientation === "landscape", "desktop → landscape");

// ── phone detection (narrow side < 768) ───────────────────────────────────────────────────
ok(classifyViewport(375, 812).isPhone === true, "375-wide → phone");
ok(classifyViewport(768, 1024).isPhone === false, "iPad 768 short-side → not phone (>=768)");
ok(classifyViewport(1920, 1080).isPhone === false, "desktop → not phone");

// ── determinism: same inputs → identical output (CLAUDE.md rule) ──────────────────────────
ok(JSON.stringify(classifyViewport(1920, 1080)) === JSON.stringify(classifyViewport(1920, 1080)), "classifier deterministic");
// ── safety: zero height never throws / NaN aspect ─────────────────────────────────────────
ok(classifyViewport(1000, 0).aspect === 0, "h=0 → aspect 0 (no divide-by-zero)");

console.log(`\nUSE-VIEWPORT ${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
