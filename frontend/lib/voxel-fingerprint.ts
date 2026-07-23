// §5 — Deterministic per-cube identity fingerprint for the Cube-Architecture tile.
// A lightweight 3×3 (9-cell) mirror of the backend 27-voxel signature: unique per
// cube, no randomness, no hand-artwork. The AUTHORITATIVE per-section highlight for
// the workbench comes from the backend contract (`sections[].highlight`); this is the
// at-a-glance tile identity so no two cubes look alike (the operator's "unique visual").

/** Deterministic bit pattern of `cells` booleans seeded by cubeId (FNV-1a style). */
export function cubeFingerprint(cubeId: number, cells = 9): boolean[] {
  const out: boolean[] = [];
  let h = (2166136261 ^ Math.imul(cubeId, 2654435761)) >>> 0;
  for (let i = 0; i < cells; i++) {
    h = Math.imul(h ^ (i + 1), 16777619) >>> 0;
    out.push(((h >>> ((i % 13) + 2)) & 1) === 1);
  }
  // Visual balance: never all-off / all-on (still deterministic per cube).
  const on = out.filter(Boolean).length;
  if (on === 0) out[cubeId % cells] = true;
  if (on === cells) out[(cubeId * 7) % cells] = false;
  return out;
}

/** How many of `n` progress segments are filled for a completion percent (0-100). */
export function progressSegments(completion: number, n = 4): number {
  const c = Math.max(0, Math.min(100, completion));
  return Math.round((c / 100) * n);
}
