// THE REFERENCE STREAM — what the unit is trying to hold (operator 2026-09-15, via the mirror round).
//
// 1920×1080 at 30 Hz is the standard. Everything the calibrator does is in service of holding it, and when
// it cannot, it says which rung of this ladder it fell to and why. A silent drop to 480p is the defect
// this ladder exists to prevent.
export interface StreamSpec { id: string; w: number; h: number; hz: number; pixelsPerSecond: number }

const mk = (id: string, w: number, h: number, hz: number): StreamSpec =>
  ({ id, w, h, hz, pixelsPerSecond: w * h * hz });

/** Best first. Index 0 is the reference; a higher index is a degradation, and is always named on screen. */
export const STREAMS: StreamSpec[] = [
  mk("1080p30", 1920, 1080, 30),
  mk("720p30", 1280, 720, 30),
  mk("480p30", 854, 480, 30),
  mk("480p15", 854, 480, 15),      // last resort: frame rate is surrendered only after resolution
];
export const REFERENCE_STREAM = STREAMS[0];
export const streamAt = (i: number): StreamSpec => STREAMS[Math.max(0, Math.min(STREAMS.length - 1, i))];
export const isReference = (i: number): boolean => i === 0;

/** How much of the reference this stream still carries, 0..1 — the honest headline number. */
export const fractionOfReference = (i: number): number =>
  streamAt(i).pixelsPerSecond / REFERENCE_STREAM.pixelsPerSecond;

export const streamLabel = (i: number): string => {
  const s = streamAt(i);
  return isReference(i) ? `${s.id} · holding the reference` : `${s.id} · ${Math.round(fractionOfReference(i) * 100)}% of reference`;
};
