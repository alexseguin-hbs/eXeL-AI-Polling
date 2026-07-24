"use client";
/**
 * Cube 10 Manual SIM — in-app DEMO PLAY (mirrors security-2525/play-test.ts).
 * ====================================================================================
 * A scripted, splash-driven walkthrough that drives the REAL workbench via DOM events so a
 * first-time user SEES the whole loop: pick a cube → pick a LIVE-code block (1.1…) → read
 * LIVE source → Check-In → Submit-to-Simulate → verdict (YOURS beats LIVE, cube shrinks) →
 * Explode to see every block. It then NARRATES the three autonomy tiers (Manual → Semi-Auto
 * → Full-Auto, one backbone) and how proven wins feed the community polling aggregator
 * (eXeL AI polling). No new API — clicks the real buttons; a cyan click-splash marks every
 * tap. `onStep(step)` streams narration to a banner in the workbench.
 */
export type PlayTier = "manual" | "semi" | "auto" | "info";
export type PlayStep = { text: string; tier: PlayTier };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Expanding cyan ring at (x,y) so the user SEES each scripted click (demo cue).
const splash = (x: number, y: number, color = "#19c8cf") => {
  if (typeof document === "undefined" || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const d = document.createElement("div");
  d.style.cssText = `position:fixed;left:${x}px;top:${y}px;width:18px;height:18px;margin:-9px 0 0 -9px;border:2px solid ${color};border-radius:50%;z-index:99999;pointer-events:none;opacity:.95;box-shadow:0 0 10px ${color};transition:transform .5s ease-out,opacity .5s ease-out`;
  document.body.appendChild(d);
  requestAnimationFrame(() => { d.style.transform = "scale(3.8)"; d.style.opacity = "0"; });
  setTimeout(() => d.remove(), 560);
};
const visible = (el: Element) => (el as HTMLElement).offsetParent !== null;
const splashEl = (el?: Element | null, c?: string) => {
  if (!el) return; (el as HTMLElement).scrollIntoView?.({ behavior: "smooth", block: "center" });
  const r = el.getBoundingClientRect(); splash(r.x + r.width / 2, r.y + r.height / 2, c);
};
const bySel = (s: string) => Array.from(document.querySelectorAll(s)).find(visible) as HTMLElement | undefined;
const byText = (t: string) => Array.from(document.querySelectorAll("button")).find(
  (b) => visible(b) && (b.textContent || "").includes(t),
) as HTMLButtonElement | undefined;

async function clickSel(s: string, c?: string): Promise<boolean> {
  const el = bySel(s); if (!el) return false; splashEl(el, c); await sleep(240); el.click(); return true;
}
async function clickText(t: string, c?: string): Promise<boolean> {
  const el = byText(t); if (!el || (el as HTMLButtonElement).disabled) return false; splashEl(el, c); await sleep(240); el.click(); return true;
}

/**
 * Run the demo. `onStep` renders the narration banner (null = done). Aborts when
 * `shouldStop()` returns true. Deterministic ordering; safe if a target is missing (skips).
 */
export async function runSimPlay(
  onStep: (s: PlayStep | null) => void,
  shouldStop: () => boolean = () => false,
): Promise<void> {
  const step = async (text: string, tier: PlayTier, ms = 2600) => {
    if (shouldStop()) throw new Error("stopped");
    onStep({ text, tier }); await sleep(ms);
  };
  try {
    await step("Manual SIM • 2525 — improve a LIVE cube and PROVE it beats what's live.", "info", 2400);
    await step("① MANUAL: you drive every step and approve every swap. Watch.", "manual", 2200);
    if (await clickSel("[data-cube-sim-select]")) await step("Pick a cube — its real LIVE code loads as building blocks.", "manual");
    await sleep(500);
    if (await clickSel("[data-sim-section]", "#ffcf5a")) await step("Block 1.1 is the FOUNDATION — the most foundational live function, at the cube's base.", "manual");
    await step("The LIVE source is the real running code. Write a faster version — SAME output.", "manual", 2800);
    if (await clickText("Check In", "#3ddc9a")) await step("CHECK-IN versions your candidate + writes replay evidence — nothing runs yet (audit-first).", "manual", 2800);
    if (await clickText("Submit to Simulate", "#19c8cf")) await step("SUBMIT simulates your candidate vs LIVE → side-by-side verdict.", "manual", 2800);
    await step("A ≥10% win SHRINKS your cube: an 8×8×8 that replaces 10×10×10 — same result, less compute.", "manual", 3000);
    if (await clickText("Explode", "#b98cff")) await step("Explode shows every block 1.1…1.N — each a real code unit you can improve.", "manual", 2600);
    await step("② SEMI-AUTO: AI proposes variants + a council reviews (SAFE+RECOMMENDED); you SELECT — same engine.", "semi", 3200);
    await step("③ FULL-AUTO: AI evolves candidates under guardrails; the community SI vote approves; human override + replay permanent.", "auto", 3200);
    await step("Every proven win feeds the COMMUNITY POLLING AGGREGATOR — eXeL AI polling ranks which cube improvements ship next.", "info", 3200);
    await step("Manual → Semi → Full-Auto: one backbone, autonomy earned per cube. Vision • 2525.", "info", 3000);
    onStep(null);
  } catch { onStep(null); }
}
