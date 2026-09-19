// ONE UNBIASED SAMPLER for every 2525 surface that mints a human code (seal PINs, lobby team codes, invites).
// `v % max` over a raw 32-bit draw is biased whenever 2^32 is not a multiple of max; rejection sampling
// below the largest multiple removes it. This was a private function inside atlantis-package.ts; it lives
// here now so the Drone-2525 lobby reuses it instead of re-deriving it (R-CORE: one primitive, N consumers).
// Node-safe: uses globalThis.crypto.getRandomValues, which node ≥ 19 and every browser provide.

export function randomIndex(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new Error(`randomIndex: max must be a positive integer, got ${max}`);
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  let v: number;
  do { v = crypto.getRandomValues(buf)[0]; } while (v >= limit);
  return v % max;
}

/** `len` crypto-random decimal digits, as a string (leading zeros allowed). */
export const randomDigits = (len: number): string => {
  let out = "";
  for (let i = 0; i < len; i++) out += String(randomIndex(10));
  return out;
};

/** `n` crypto-random bytes as upper-case hex. */
export function randomHex(n: number): string {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}
