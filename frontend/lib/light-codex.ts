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
  Y: "YRYR", Z: "YCRB", " ": "BBBB", ".": "BBBW",
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
  "1": "Single Helix", "2": "Double Helix", "3": "Hidden Double Helix",
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

function detectSingle(d: ImageData, bs: number): DecodeResult | null {
  const gap = bs === 1 ? 0 : 1;
  const y = d.height - bs;
  const scan = Math.max(1, Math.min(16, d.width));
  for (let sx = 0; sx < scan; sx++) {
    const g = parseLine(d, sx, y, bs, gap);
    if (startsWith(g, REV_FRAME_PREFIX) && endsWith(g, REV_FRAME_SUFFIX)) {
      const reversed = groupsToText(g.slice(4, -4));
      const forward = reverse(reversed);
      return {
        style: "Single Helix", blockSize: bs, lineHeight: bs,
        bottomDecoded: groupsToText(g), messageForward: forward, messageReverseVerify: reversed, verified: true,
      };
    }
  }
  return null;
}
function detectDouble(d: ImageData, bs: number): DecodeResult | null {
  const gap = bs === 1 ? 0 : 1;
  const bottomY = d.height - bs;
  const top = parseLine(d, 0, 0, bs, gap);
  if (!(startsWith(top, FWD_FRAME_PREFIX) && endsWith(top, FWD_FRAME_SUFFIX))) return null;
  const forward = groupsToText(top.slice(4, -4));
  const scan = Math.max(1, Math.min(16, d.width));
  for (let sx = 0; sx < scan; sx++) {
    const bottom = parseLine(d, sx, bottomY, bs, gap);
    if (startsWith(bottom, REV_FRAME_PREFIX) && endsWith(bottom, REV_FRAME_SUFFIX)) {
      const rev = groupsToText(bottom.slice(4, -4));
      if (rev === reverse(forward)) {
        return {
          style: "Double Helix", blockSize: bs, lineHeight: bs,
          topDecoded: groupsToText(top), bottomDecoded: groupsToText(bottom),
          messageForward: forward, messageReverseVerify: rev, verified: true,
        };
      }
    }
  }
  return null;
}
function detectHiddenDouble(d: ImageData): DecodeResult | null {
  const collect = (y: number) => {
    const cands: { g: string[]; text: string }[] = [];
    for (let sx = Math.max(0, d.width - 500); sx < d.width; sx++) {
      const g = parseLine(d, sx, y, 1, 0);
      if (g.length) { const text = groupsToText(g); if (!text.includes("?") && text.trim()) cands.push({ g, text }); }
    }
    return cands;
  };
  const top = collect(0), bottom = collect(d.height - 1);
  if (!top.length || !bottom.length) return null;
  const topBest = top.reduce((a, b) => (b.g.length > a.g.length ? b : a));
  const sorted = bottom.slice().sort((a, b) => b.g.length - a.g.length);
  for (const bt of sorted) {
    if (bt.text === reverse(topBest.text)) {
      return {
        style: "Hidden Double Helix", blockSize: 1, lineHeight: 1,
        topDecoded: topBest.text, bottomDecoded: bt.text,
        messageForward: topBest.text, messageReverseVerify: bt.text, verified: true,
      };
    }
  }
  return null;
}

/** Auto-detect block size (1/2/4) and style, then read the message(s). */
export function decodeImage(d: ImageData): DecodeResult | null {
  const hidden = detectHiddenDouble(d);
  if (hidden) return hidden;
  for (const bs of [1, 2, 4]) {
    const dbl = detectDouble(d, bs);
    if (dbl) return dbl;
    const sgl = detectSingle(d, bs);
    if (sgl) return sgl;
  }
  return null;
}
