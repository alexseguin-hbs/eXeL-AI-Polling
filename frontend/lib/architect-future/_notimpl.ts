// ARCHITECT-2525 / FUTURE · shared stub helper. Phase 0 scaffolds signatures only; Phase 1+ implements them.
// A behavioural contract test loads the real module, reaches its assertion, and fails here — a legitimate red-first.
export function notImplemented(what: string, phase: number): never {
  throw new Error(`architect-future: ${what} is not implemented yet (Phase ${phase})`);
}
