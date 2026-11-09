/**
 * CRS-19.09 — measure active typing time for ♡ S.I. credit.
 * Clock runs only between input events; a pause longer than idleCutoffMs stops accrual.
 * Paste marks pasteDetected so the server zeros typing credit.
 */

export const ACTIVE_INPUT_IDLE_CUTOFF_MS = 5_000;

export type ActiveInputSnapshot = {
  active_ms: number;
  paste_detected: boolean;
  input_opened_at: string; // ISO
};

export function createActiveInputTracker(idleCutoffMs: number = ACTIVE_INPUT_IDLE_CUTOFF_MS) {
  let activeMs = 0;
  let lastEventAt: number | null = null;
  let pasteDetected = false;
  const openedAt = Date.now();

  function noteActivity(isPaste = false) {
    const now = Date.now();
    if (isPaste) pasteDetected = true;
    if (lastEventAt != null) {
      const gap = now - lastEventAt;
      if (gap > 0 && gap <= idleCutoffMs) {
        activeMs += gap;
      }
    }
    lastEventAt = now;
  }

  return {
    onKey() {
      noteActivity(false);
    },
    onPaste() {
      noteActivity(true);
    },
    /** Call from onChange when the browser does not fire a separate paste event first. */
    onInput() {
      noteActivity(false);
    },
    snapshot(): ActiveInputSnapshot {
      return {
        active_ms: Math.max(0, Math.round(activeMs)),
        paste_detected: pasteDetected,
        input_opened_at: new Date(openedAt).toISOString(),
      };
    },
    reset() {
      activeMs = 0;
      lastEventAt = null;
      pasteDetected = false;
    },
  };
}

export type ActiveInputTracker = ReturnType<typeof createActiveInputTracker>;
