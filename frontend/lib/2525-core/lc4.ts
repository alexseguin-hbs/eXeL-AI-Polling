// LIGHT-4 · TEAM CODE — the keyed Light Codex the Drone-2525 lobby uses (operator deck r.128, lines ~2490–2547),
// mirrored BIT-FOR-BIT so a token made on the deck decodes in the repo and vice versa.
//
//   Each A–Z / 0–9 character becomes four base-4 "colour digits". Changing the 6-digit team secret
//   deterministically scrambles which four-digit token represents each character: the secret seeds an LCG,
//   which seeds an xorshift32, which drives a Fisher–Yates shuffle of the 36-character alphabet. A character's
//   token is the base-4 expansion of its index in the shuffled alphabet.
//
// The deck says it plainly and so do we: this is a fictional game coding layer, not a real guidance code.
// The 6 digits AUTHORISE two humans; they are never the encryption key (r.104 → r.128: ECDH → HKDF → AES-GCM
// does that). Pure — no DOM, no clock, no Math.random — so the same code gives the same alphabet on every node,
// which is the whole point: a team that shares a secret shares a codex.
//
// Interop is GATED, not assumed: tests/lobby-2525.test.mjs evaluates the deck's own lc4 functions out of the
// carried r.128 HTML and asserts they agree with these for many codes.

export const LC4_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** 6 digits → a 32-bit seed. Non-digits are stripped; short codes are right-padded with zeros. */
export function lc4Seed(code: string | number | null | undefined): number {
  const s = String(code ?? "000000").replace(/\D/g, "").padEnd(6, "0").slice(0, 6);
  let x = 0x6d2b79f5;
  for (let i = 0; i < s.length; i++) x = ((x ^ ((s.charCodeAt(i) - 48) + i * 17)) * 1664525 + 1013904223) >>> 0;
  return x || 1;
}

/** xorshift32 step on a mutable state; returns a float in [0, 1). */
export function lc4Rand(st: { x: number }): number {
  let x = st.x >>> 0;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  st.x = x >>> 0;
  return (st.x >>> 0) / 4294967296;
}

/** The 36-character alphabet, Fisher–Yates-shuffled by the team secret. */
export function lc4Alphabet(code: string | number | null | undefined): string[] {
  const a = LC4_CHARS.split("");
  const r = { x: lc4Seed(code) };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(lc4Rand(r) * (i + 1));
    const t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

export type Lc4Digits = [number, number, number, number];

/** 0..255 → four base-4 digits, most significant first. */
export function lc4Digits(n: number): Lc4Digits {
  const m = Math.max(0, Math.min(255, Number(n) || 0));
  return [Math.floor(m / 64) % 4, Math.floor(m / 16) % 4, Math.floor(m / 4) % 4, m % 4];
}

/** One character's token under a team secret, or null if the character is not in the alphabet. */
export function lc4Token(ch: string, code: string | number | null | undefined): Lc4Digits | null {
  const c = String(ch ?? "").toUpperCase();
  const idx = lc4Alphabet(code).indexOf(c);
  return idx < 0 ? null : lc4Digits(idx);
}

export interface Lc4Row { ch: string; d: Lc4Digits | null }

/** Text → rows. Spaces pass through as `{ch:" ", d:null}`; unsupported characters are dropped (deck rule). */
export function lc4Encode(text: string, code: string | number | null | undefined): Lc4Row[] {
  const s = String(text ?? "").toUpperCase();
  const alphabet = lc4Alphabet(code);                       // one shuffle per message, not per character
  const out: Lc4Row[] = [];
  for (const ch of s) {
    if (ch === " ") { out.push({ ch: " ", d: null }); continue; }
    const idx = alphabet.indexOf(ch);
    if (idx >= 0) out.push({ ch, d: lc4Digits(idx) });
  }
  return out;
}

/** Rows → text under the same secret. A token outside the alphabet decodes to "?". */
export function lc4Decode(rows: readonly Lc4Row[], code: string | number | null | undefined): string {
  const alphabet = lc4Alphabet(code);
  return rows.map((x) => {
    if (!x || x.ch === " " || !x.d) return " ";
    const n = x.d[0] * 64 + x.d[1] * 16 + x.d[2] * 4 + x.d[3];
    return alphabet[n] ?? "?";
  }).join("");
}
