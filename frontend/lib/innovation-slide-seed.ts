/**
 * SLIDE_SEED — 12-Ascended-Masters authored slide content (System of Innovation · Digital slide show).
 * ===================================================================================================
 * Per project: S1–S3 + the current-stage and next-gate slides (see `slidesForProject`). Non-linked fields only
 * (linked return-profile / revenue / R&D-chart fields stay live from the project record). Each cell carries:
 *   • hi — the human baseline (shown by default, mode "hi")
 *   • ai — an ENHANCED, more-comprehensive superset built off the hi (shown when the field / present toggle → AI)
 * Static committed data → the tool stays deterministic. Authored by the 12-agent workflow; MoT decided the final
 * AI per field. Value shapes match SlideField.kind: text→string · longtext→string · list→string[] ·
 * table→string[][] · metrics→Record<string,string>.
 */
import type { SlideSeed } from "./innovation-data";

// Populated by the 12-AsM authoring workflow (fan-out HI → enhanced-AI → MoT merge). Projects without an entry
// fall back to the deterministic AI draft (aiSlideField) + blank HI, exactly as before.
export const SLIDE_SEED: SlideSeed = {};
