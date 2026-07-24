/**
 * Cube 10 SIM — the voxel PARTITION, byte-identical to the backend.
 * ====================================================================================
 * This is the ONE frontend source for how the 27 mini-cubes split into building blocks,
 * mirroring `backend/app/cubes/cube10_simulation/sections.py` EXACTLY (same SHA-256 seed,
 * same face-connected region-grow, same base-first ordering, same decimal codes). Both
 * `mock-data.ts` (MOCK_MODE render) and the parity test import this — no forked copy, no
 * drift (locked by `tests/sim-partition-parity.test.mjs` against a Python-generated oracle).
 */

// ── SHA-256 (FIPS 180-4), sync, lowercase hex — matches Python hashlib.sha256().hexdigest()
const _K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function _sha256hex(msg: string): string {
  const bytes = new TextEncoder().encode(msg);
  const l = bytes.length;
  const withOne = l + 1;
  const total = withOne + ((56 - (withOne % 64) + 64) % 64) + 8; // pad to 64-byte blocks
  const buf = new Uint8Array(total);
  buf.set(bytes);
  buf[l] = 0x80;
  const bits = l * 8;
  // 64-bit big-endian length (message length < 2^32 bits here, so high word = 0)
  buf[total - 4] = (bits >>> 24) & 0xff;
  buf[total - 3] = (bits >>> 16) & 0xff;
  buf[total - 2] = (bits >>> 8) & 0xff;
  buf[total - 1] = bits & 0xff;

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let off = 0; off < total; off += 64) {
    for (let i = 0; i < 16; i++) {
      const j = off + i * 4;
      w[i] = ((buf[j] << 24) | (buf[j + 1] << 16) | (buf[j + 2] << 8) | buf[j + 3]) >>> 0;
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + _K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }
  const hex = (x: number) => x.toString(16).padStart(8, "0");
  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
}

/** int(hexdigest, 16) % m over the full 256-bit value (JS Number can't hold it directly). */
function _hexMod(hex: string, m: number): number {
  let acc = 0;
  for (let i = 0; i < hex.length; i++) acc = (acc * 16 + parseInt(hex[i], 16)) % m;
  return acc;
}

// ── partition (mirror of sections.py) ────────────────────────────────────────────────
function _faceNeighbors(i: number): number[] {
  const x = i % 3, y = Math.floor(i / 3) % 3, z = Math.floor(i / 9), o: number[] = [];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const nx = x + dx, ny = y + dy, nz = z + dz;
    if (nx >= 0 && nx < 3 && ny >= 0 && ny < 3 && nz >= 0 && nz < 3) o.push(nz * 9 + ny * 3 + nx);
  }
  return o;
}

/** Deterministic permutation of 0..26 seeded by cube_id — sorted by the SHA-256 hexdigest
 *  string of `${cube}:${c}` (exactly Python's `_seeded_order`). */
function _seededOrder(cubeId: number): number[] {
  const dig: Record<number, string> = {};
  for (let c = 0; c < 27; c++) dig[c] = _sha256hex(`${cubeId}:${c}`);
  return Array.from({ length: 27 }, (_, c) => c).sort((a, b) => (dig[a] < dig[b] ? -1 : dig[a] > dig[b] ? 1 : 0));
}

function _slabAxis(cubeId: number): number {
  return _hexMod(_sha256hex(`${cubeId}:axis`), 3);
}

function _axisSlabs(cubeId: number, n: number): number[][] {
  const axis = _slabAxis(cubeId);
  const xyz = (i: number) => [i % 3, Math.floor(i / 3) % 3, Math.floor(i / 9)];
  if (n === 3) {
    const g: number[][] = [[], [], []];
    for (let i = 0; i < 27; i++) g[xyz(i)[axis]].push(i);
    return g;
  }
  const cols: Record<string, number[]> = {}; const keys: string[] = [];
  for (let i = 0; i < 27; i++) {
    const c = xyz(i); c[axis] = 0; const key = c.join(",");
    if (!(key in cols)) { cols[key] = []; keys.push(key); }
    cols[key].push(i);
  }
  return keys.map((k) => cols[k]);
}

/** n FACE-CONNECTED building blocks (Lego rule), byte-identical to Python `partition`. */
export function connectedPartition(cubeId: number, n: number): number[][] {
  if (n <= 1) return [Array.from({ length: 27 }, (_, i) => i)];
  if (n >= 27) return Array.from({ length: 27 }, (_, i) => [i]);
  if ((n === 3 || n === 9) && _hexMod(_sha256hex(`${cubeId}:style`), 2) === 0) return _axisSlabs(cubeId, n);
  const order = _seededOrder(cubeId);
  const pos: Record<number, number> = {}; order.forEach((c, i) => { pos[c] = i; });
  const seeds = order.slice(0, n); const owner: Record<number, number> = {};
  const members = seeds.map((s) => [s]); const assigned = new Set(seeds); seeds.forEach((s, k) => { owner[s] = k; });
  let remaining = 27 - n;
  while (remaining > 0) {
    let progressed = false;
    for (let k = 0; k < n; k++) {
      const cands = new Set<number>();
      for (const m of members[k]) for (const nb of _faceNeighbors(m)) if (!assigned.has(nb)) cands.add(nb);
      if (cands.size) {
        const nb = Array.from(cands).sort((a, b) => pos[a] - pos[b])[0];
        owner[nb] = k; assigned.add(nb); members[k].push(nb); remaining -= 1; progressed = true;
        if (remaining === 0) break;
      }
    }
    if (!progressed) { for (let c = 0; c < 27; c++) if (!assigned.has(c)) { owner[c] = pos[c] % n; assigned.add(c); } remaining = 0; }
  }
  const groups: number[][] = Array.from({ length: n }, () => []);
  for (let c = 0; c < 27; c++) groups[owner[c]].push(c);
  return groups.map((g) => g.sort((a, b) => a - b));
}

/** Blocks reordered BASE-FIRST (smallest min-z, then smallest cell index) so block 0 /
 *  section .1 (the foundation) anchors the bottom — mirror of Python `_ordered_partition`. */
export function orderedPartition(cubeId: number, n: number): number[][] {
  return connectedPartition(cubeId, n).slice().sort((a, b) => {
    const az = Math.min(...a.map((i) => Math.floor(i / 9))), bz = Math.min(...b.map((i) => Math.floor(i / 9)));
    return az - bz || a[0] - b[0];
  });
}

/** The parity surface: base-first blocks with their decimal codes ({cube}.{k+1}). */
export function partitionSections(cubeId: number, count: number): { code: string; cells: number[] }[] {
  return orderedPartition(cubeId, count).map((cells, k) => ({ code: `${cubeId}.${k + 1}`, cells }));
}

export { _sha256hex };
