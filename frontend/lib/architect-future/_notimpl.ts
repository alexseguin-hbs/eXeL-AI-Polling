// ARCHITECT-2525 / FUTURE · shared stub helper. Phase 0 scaffolds signatures only; Phase 1+ implements them.
// A behavioural contract test loads the real module, reaches its assertion, and fails here — a legitimate red-first.
// The thrown error carries a typed marker (notImplemented === true) so the expected-red runner distinguishes
// "pending" from a wrong-reason throw by a structured flag, not a message substring.

export interface NotImplementedError extends Error {
  notImplemented: true;
  phase: number;
}

export function notImplemented(what: string, phase: number): never {
  const err = new Error(`architect-future: ${what} is not implemented yet (Phase ${phase})`) as NotImplementedError;
  err.notImplemented = true;
  err.phase = phase;
  throw err;
}
