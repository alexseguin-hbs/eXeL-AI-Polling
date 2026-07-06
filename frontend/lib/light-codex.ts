// Light Codex — Double-Helix pixel signature encode/decode.
//
// Faithful browser port of the reference Python (Light Codex Signature + Decode).
// Transmits a short message "in plain sight" by writing tiny B/R/Y/G/C/V/W pixel
// blocks along the top and/or bottom edge of a shared image. The recipient runs
// Decode on the same image to read it back (with reverse verification).
//
// Color order: B R Y G C V W (Black, Red, Yellow, Green, Cyan, Violet, White).
// Three styles:
//   1 Single Helix        — bottom-right only, reversed, transmission framing
//   2 Double Helix        — top-left forward + bottom-right reversed, framing
//   3 Hidden Double Helix — top-right forward + bottom-right reversed, 1px, no framing
//
// PNG in / PNG out — lossless is required for clean decoding (JPEG shifts colors).

export const ALPHA: Record<string, string> = {
  A: "WWCC", B: "RRRR", C: "CWRC", D: "YCCY", E: "CCRR", F: "WRRW",
  G: "YCYC", H: "WWRR", I: "YBBY", J: "CWWC", K: "YYCC", L: "YBYB",
  M: "WCWC", N: "CWCW", O: "RRYY", P: "CCCW", Q: "YYYY", R: "RWWR",
  S: "WWWC", T: "RWCC", U: "RWRW", V: "WRWR", W: "CCRW", X: "WCCW",
  // Space gets its OWN group (was "BBBB", which collides with the digit 0 →
  // spaces decoded as "0"). "WBWB" is unused by any letter/number/frame and
  // has no green (G), so it never trips frame detection.
  Y: "YRYR", Z: "YCRB", " ": "WBWB", ".": "BBBW",
};
export const NUMBERS: Record<string, string> = {
  "0": "BBBB", "1": "WBBB", "2": "WWBB", "3": "WWWB", "4": "WWWW",
  "5": "VBBB", "6": "VWBB", "7": "VWWB", "8": "VWWW", "9": "VVVV",
};
export const TRANSMISSION: Record<string, string> = { "4": "GGGG", "3": "GGGR", "2": "GGRR", "1": "GRRR" };

const COLORS: Record<string, [number, number, number]> = {
  B: [0, 0, 0], R: [255, 0, 0], Y: [255, 255, 0],
  G: [0, 255, 0], C: [0, 255, 255], V: [255, 0, 255], W: [255, 255, 255],
};

// group(4 tokens) → char. Matches the Python: ALPHA first, then NUMBERS wins
// on any overlap (so "BBBB" decodes to "0", not space).
const GROUP_TO_CHAR: Record<string, string> = {};
for (const [ch, grp] of Object.entries(ALPHA)) GROUP_TO_CHAR[grp] = ch;
for (const [ch, grp] of Object.entries(NUMBERS)) GROUP_TO_CHAR[grp] = ch;
const TRANSMISSION_GROUPS = new Set(Object.values(TRANSMISSION));

const framing = (seq: string) => Array.from(seq).map((c) => TRANSMISSION[c]);
const FWD_FRAME_PREFIX = framing("4321");
const FWD_FRAME_SUFFIX = framing("1234");
const REV_FRAME_PREFIX = framing("1234");
const REV_FRAME_SUFFIX = framing("4321");

export type Style = "1" | "2" | "3";
export type BlockSize = 1 | 2 | 4;

export const STYLE_NAME: Record<Style, string> = {
  "1": "single_helix", "2": "double_helix", "3": "hidden_double_helix",
};
export const STYLE_LABEL: Record<Style, string> = {
  "1": "Single Helix", "2": "Double Helix", "3": "Hidden Helix",
};

// Supported message characters — A–Z, digits, space, period (case-insensitive).
export function unsupportedChars(text: string): string[] {
  const bad: string[] = [];
  for (const ch of text) {
    if (/[0-9]/.test(ch)) continue;
    if (Object.prototype.hasOwnProperty.call(ALPHA, ch.toUpperCase())) continue;
    bad.push(ch);
  }
  return bad;
}

function encodeChar(ch: string): string {
  if (/[0-9]/.test(ch)) return NUMBERS[ch];
  const u = ch.toUpperCase();
  if (!(u in ALPHA)) throw new Error(`Unsupported character: ${JSON.stringify(ch)}`);
  return ALPHA[u];
}
function encodeMessage(text: string): string[] {
  return Array.from(text).map(encodeChar);
}
const reverse = (s: string) => Array.from(s).reverse().join("");

// ── ImageData pixel helpers ──────────────────────────────────────────────────
function setPx(d: ImageData, x: number, y: number, rgb: [number, number, number]) {
  if (x < 0 || y < 0 || x >= d.width || y >= d.height) return;
  const i = (y * d.width + x) * 4;
  d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2]; d.data[i + 3] = 255;
}
function getPx(d: ImageData, x: number, y: number): [number, number, number] {
  const i = (y * d.width + x) * 4;
  return [d.data[i], d.data[i + 1], d.data[i + 2]];
}

function drawGroup(d: ImageData, x: number, y: number, grp: string, bs: number) {
  for (let i = 0; i < grp.length; i++) {
    const color = COLORS[grp[i]];
    const x0 = x + i * bs;
    for (let yy = y; yy < y + bs; yy++) for (let xx = x0; xx < x0 + bs; xx++) setPx(d, xx, yy, color);
  }
}
function drawLineLeft(d: ImageData, groups: string[], xStart: number, y: number, bs: number, gap: number) {
  let x = xStart;
  for (const grp of groups) { drawGroup(d, x, y, grp, bs); x += 4 * bs + gap; }
}
function drawLineRight(d: ImageData, groups: string[], y: number, bs: number, gap: number) {
  const total = groups.length * (4 * bs) + Math.max(0, groups.length - 1) * gap;
  let x = d.width - total;
  for (const grp of groups) { drawGroup(d, x, y, grp, bs); x += 4 * bs + gap; }
}

/** Write the signature into a copy of `src` and return the signed ImageData. */
export function placeSignature(src: ImageData, signature: string, blockSize: BlockSize, style: Style): ImageData {
  const d = new ImageData(new Uint8ClampedArray(src.data), src.width, src.height);
  const gap = blockSize === 1 ? 0 : 1;
  const topY = 0;
  const bottomY = d.height - blockSize;

  if (style === "1") {
    const rev = [...framing("1234"), ...encodeMessage(reverse(signature)), ...framing("4321")];
    drawLineRight(d, rev, bottomY, blockSize, gap);
  } else if (style === "2") {
    const fwd = [...framing("4321"), ...encodeMessage(signature), ...framing("1234")];
    const rev = [...framing("1234"), ...encodeMessage(reverse(signature)), ...framing("4321")];
    drawLineLeft(d, fwd, 0, topY, blockSize, gap);
    drawLineRight(d, rev, bottomY, blockSize, gap);
  } else {
    // Hidden Double Helix — always 1px, no framing, both lines right-aligned.
    drawLineRight(d, encodeMessage(signature), 0, 1, 0);
    drawLineRight(d, encodeMessage(reverse(signature)), d.height - 1, 1, 0);
  }
  return d;
}

// ── Decode ───────────────────────────────────────────────────────────────────
function nearestToken(rgb: [number, number, number]): string {
  let best = "B", bestDist = Infinity;
  for (const [tok, col] of Object.entries(COLORS)) {
    const dist = (rgb[0] - col[0]) ** 2 + (rgb[1] - col[1]) ** 2 + (rgb[2] - col[2]) ** 2;
    if (dist < bestDist) { bestDist = dist; best = tok; }
  }
  return best;
}
function sampleGroup(d: ImageData, x: number, y: number, bs: number): string | null {
  let out = "";
  for (let i = 0; i < 4; i++) {
    const x0 = x + i * bs;
    if (x0 < 0 || y < 0 || x0 + bs > d.width || y + bs > d.height) return null;
    let r = 0, g = 0, b = 0, n = 0;
    for (let yy = y; yy < y + bs; yy++) for (let xx = x0; xx < x0 + bs; xx++) {
      const p = getPx(d, xx, yy); r += p[0]; g += p[1]; b += p[2]; n++;
    }
    out += nearestToken([Math.floor(r / n), Math.floor(g / n), Math.floor(b / n)]);
  }
  return out;
}
function parseLine(d: ImageData, startX: number, y: number, bs: number, gap: number, maxGroups = 500): string[] {
  const groups: string[] = [];
  let x = startX;
  const gw = 4 * bs;
  for (let k = 0; k < maxGroups; k++) {
    if (x < 0 || x + gw > d.width) break;
    const grp = sampleGroup(d, x, y, bs);
    if (grp === null) break;
    if (!(grp in GROUP_TO_CHAR) && !TRANSMISSION_GROUPS.has(grp)) break;
    groups.push(grp);
    x += gw + gap;
  }
  return groups;
}
const startsWith = (g: string[], seq: string[]) => g.length >= seq.length && seq.every((s, i) => g[i] === s);
const endsWith = (g: string[], seq: string[]) => g.length >= seq.length && seq.every((s, i) => g[g.length - seq.length + i] === s);
const groupsToText = (g: string[]) => g.map((grp) => GROUP_TO_CHAR[grp] ?? "?").join("");

export interface DecodeResult {
  style: string;
  blockSize: number;
  lineHeight: number;
  messageForward: string;
  messageReverseVerify: string;
  topDecoded?: string;
  bottomDecoded?: string;
  verified: boolean;
}

// Match a frame sequence at position `at`.
function matchAt(groups: string[], at: number, seq: string[]): boolean {
  if (at + seq.length > groups.length) return false;
  for (let j = 0; j < seq.length; j++) if (groups[at + j] !== seq[j]) return false;
  return true;
}
// Extract the message groups sandwiched between a prefix and suffix frame,
// tolerating background bleed on EITHER side (solid backgrounds decode to valid
// color-groups, so the message is delimited by its green frames, not the line ends).
function extractBetweenFrames(groups: string[], prefix: string[], suffix: string[]): string[] | null {
  for (let p = 0; p + prefix.length <= groups.length; p++) {
    if (!matchAt(groups, p, prefix)) continue;
    for (let s = p + prefix.length; s + suffix.length <= groups.length; s++) {
      if (matchAt(groups, s, suffix)) return groups.slice(p + prefix.length, s);
    }
  }
  return null;
}
// Read a RIGHT-aligned line: groups stepping leftward from the right edge,
// returned left-to-right. The bottom (reversed) line and the Hidden top line are
// right-aligned, so they must be read from the right, not scanned from x=0.
function readRightAligned(d: ImageData, y: number, bs: number, gap: number): string[] {
  const step = 4 * bs + gap;
  const groups: string[] = [];
  for (let x = d.width - 4 * bs; x >= 0; x -= step) {
    const grp = sampleGroup(d, x, y, bs);
    if (grp === null) break;
    if (!(grp in GROUP_TO_CHAR) && !TRANSMISSION_GROUPS.has(grp)) break;
    groups.push(grp);
  }
  groups.reverse();
  return groups;
}

// Framed styles: probe the corners at a given block size. Bottom-right reversed
// line is present in BOTH Single and Double; the top-left forward line marks Double.
function detectFramed(d: ImageData, bs: number): DecodeResult | null {
  const gap = bs === 1 ? 0 : 1;
  const revGroups = extractBetweenFrames(readRightAligned(d, d.height - bs, bs, gap), REV_FRAME_PREFIX, REV_FRAME_SUFFIX);
  if (!revGroups) return null;
  const rev = groupsToText(revGroups);
  // Top-left forward line → Double Helix.
  const fwdGroups = extractBetweenFrames(parseLine(d, 0, 0, bs, gap), FWD_FRAME_PREFIX, FWD_FRAME_SUFFIX);
  if (fwdGroups) {
    const fwd = groupsToText(fwdGroups);
    return {
      style: "Double Helix", blockSize: bs, lineHeight: bs,
      topDecoded: fwd, bottomDecoded: rev,
      messageForward: fwd, messageReverseVerify: rev, verified: rev === reverse(fwd),
    };
  }
  // No forward line → Single Helix (bottom-right reversed only).
  return {
    style: "Single Helix", blockSize: bs, lineHeight: bs,
    bottomDecoded: rev, messageForward: reverse(rev), messageReverseVerify: rev, verified: true,
  };
}

// Hidden Helix: 1px, no framing, both lines right-aligned (top = forward, bottom
// = reversed). Read each row right-to-left and find the largest suffix length K
// where bottom is the exact reverse of top — the two DNA strands verify each other.
function detectHidden(d: ImageData): DecodeResult | null {
  const readRTL = (y: number): string[] => {
    const chars: string[] = [];
    for (let x = d.width - 4; x >= 0; x -= 4) {
      const grp = sampleGroup(d, x, y, 1);
      if (grp === null || !(grp in GROUP_TO_CHAR)) break;
      chars.push(GROUP_TO_CHAR[grp]);
    }
    return chars;
  };
  const topR = readRTL(0), botR = readRTL(d.height - 1);
  const maxK = Math.min(topR.length, botR.length);
  for (let K = maxK; K >= 1; K--) {
    let ok = true;
    for (let i = 0; i < K; i++) if (botR[i] !== topR[K - 1 - i]) { ok = false; break; }
    if (!ok) continue;
    const fwd = topR.slice(0, K).reverse().join("");
    const rev = botR.slice(0, K).reverse().join("");
    if (!fwd.trim()) continue;
    if (K > 3 && new Set(fwd.replace(/\s/g, "")).size < 2) continue; // long uniform run = background
    return {
      style: "Hidden Helix", blockSize: 1, lineHeight: 1,
      topDecoded: fwd, bottomDecoded: rev, messageForward: fwd, messageReverseVerify: rev, verified: true,
    };
  }
  return null;
}

/** Auto-detect block size (1/2/4) and style, then read the message(s). Framed
 *  styles are unambiguous (green transmission markers) so they win first; the
 *  markerless Hidden Helix runs last as a fallback. */
export function decodeImage(d: ImageData): DecodeResult | null {
  for (const bs of [1, 2, 4]) {
    const framed = detectFramed(d, bs);
    if (framed) return framed;
  }
  return detectHidden(d);
}
