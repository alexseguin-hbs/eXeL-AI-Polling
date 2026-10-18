// Completion segments for the Cube-Architecture tile.
//
// This module once also exported `cubeFingerprint()`, a seeded 3×3 bit pattern drawn as nine dots on every
// cube tile. Its header credited that pattern to "the operator's 'unique visual'". It was not his — he said
// so plainly on 2026-10-18 ("when lookin at Cube 1-9 on settings I never asked for dot nomenclature;
// remove", DD-98), and the attribution was mine. The function is retired with the dots: it had exactly two
// consumers, the tile and its own test, and a SEEDED pattern is the thing DD-93 rules out ("lego is
// default, of touching sides so pieces combined form total 3x3x3 cube"), so it is not a primitive the
// Code-pane anatomy can reuse. The AUTHORITATIVE per-section highlight for the workbench comes from the
// backend contract (`sections[].highlight`), as it always did.

/** How many of `n` progress segments are filled for a completion percent (0-100). */
export function progressSegments(completion: number, n = 4): number {
  const c = Math.max(0, Math.min(100, completion));
  return Math.round((c / 100) * n);
}
