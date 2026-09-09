/**
 * Sign Doc — the pure envelope model (no DOM, no network). One envelope = one or more PDFs and an
 * ordered list of signers; exactly one signer may act at a time. Every signer holds a private
 * `secret` minted with the envelope (Enki + Thor, round 1): the turn is keyed by that secret, never
 * by a contact string two people could share. Contacts are still recorded and normalized so the
 * hand-off message can name the right person. Every function here is proven by
 * tests/sign-envelope.test.mjs; the SQL RPCs in supabase/migrations/036_sign_envelopes.sql enforce
 * the same rules server-side.
 */

export type SignStatus = "awaiting" | "complete" | "revoked" | "expired" | "locked";

export interface Signer {
  name: string;
  contact: string;          // email or phone, as typed
  order: number;            // 0-based signing order
  secret: string;           // per-signer bearer secret, base64url (22 chars)
  signed_at?: string | null;
}

export interface SignFile {
  name: string;
  page_count: number;
  pdf_base64: string;
  sha256: string;
  version: number;          // 0 = as uploaded; +1 per signature pass
}

export interface Envelope {
  token: string;            // envelope bearer token, base64url (22 chars)
  title: string;
  created_by: string;       // creator's contact
  status: SignStatus;
  current_signer_idx: number;
  signers: Signer[];
  files: SignFile[];
  chain: string;            // running hash: sha256(prev + ":" + file shas) after each signature
  expires_at?: string | null;
}

export type SignRefusal = "complete" | "revoked" | "expired" | "locked" | "not_your_turn" | "bad_secret";

export const ENVELOPE_TTL_DAYS = 30;
export const MAX_FILE_BYTES = 3 * 1024 * 1024;     // Thoth, round 1: keep one RPC body under the PostgREST limit
export const MAX_FILES = 5;
export const MAX_ENVELOPE_BYTES = 12 * 1024 * 1024;  // all files together — one RPC body stays bounded (Thoth, wave 3)

/** Email → lower-cased, trimmed. Phone → digits only. Empty → "". No country-code guessing (Sofia). */
export function normalizeContact(c: string): string {
  const v = (c || "").trim();
  if (!v) return "";
  if (v.includes("@")) return v.toLowerCase();
  return v.replace(/\D+/g, "");
}

export function contactKind(c: string): "email" | "phone" | "" {
  const n = normalizeContact(c);
  if (!n) return "";
  return n.includes("@") ? "email" : "phone";
}

export const contactMatches = (a: string, b: string): boolean => {
  const x = normalizeContact(a), y = normalizeContact(b);
  return !!x && x === y;
};

/** "al***@example.com" · "***1250" — enough to recognise, never enough to reuse. */
export function maskContact(c: string): string {
  const n = normalizeContact(c);
  if (!n) return "";
  if (n.includes("@")) { const [u, d] = n.split("@"); return `${u.slice(0, 2)}***@${d}`; }
  return `***${n.slice(-4)}`;
}

export function whoseTurn(env: Envelope): Signer | null {
  if (env.status !== "awaiting") return null;
  return env.signers[env.current_signer_idx] ?? null;
}

export function canSign(env: Envelope, idx: number, secret: string): { ok: true } | { ok: false; reason: SignRefusal } {
  if (env.status === "complete") return { ok: false, reason: "complete" };
  if (env.status === "revoked") return { ok: false, reason: "revoked" };
  if (env.status === "locked") return { ok: false, reason: "locked" };
  if (env.status === "expired" || (env.expires_at && Date.parse(env.expires_at) < Date.now())) return { ok: false, reason: "expired" };
  if (idx !== env.current_signer_idx) return { ok: false, reason: "not_your_turn" };
  const s = env.signers[idx];
  if (!s || !secret || s.secret !== secret) return { ok: false, reason: "bad_secret" };
  return { ok: true };
}

/** A signature pass: the current signer's secret, the stamped files, the time. Returns the next envelope. */
export function applySignature(env: Envelope, idx: number, secret: string, at: string, newFiles: SignFile[], nextChain: string): Envelope {
  const gate = canSign(env, idx, secret);
  if (!gate.ok) throw new Error(gate.reason);
  if (newFiles.length !== env.files.length) throw new Error("file_count_mismatch");
  const signers = env.signers.map((s, j) => (j === idx ? { ...s, signed_at: at } : s));
  const last = idx === env.signers.length - 1;
  return {
    ...env,
    signers,
    files: newFiles.map((f, j) => ({ ...f, version: env.files[j].version + 1 })),
    current_signer_idx: last ? idx : idx + 1,
    status: last ? "complete" : "awaiting",
    chain: nextChain,
  };
}

/** Which signer holds this secret (any turn) — the party check for reading files. */
export function partyIndex(env: Envelope, secret: string): number {
  if (!secret) return -1;
  return env.signers.findIndex((s) => s.secret === secret);
}

/* ── tokens + hashes ─────────────────────────────────────────────────────────── */
const B64URL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/** 16 random bytes → 22 base64url chars (128 bits). Same shape as the pod code: bytes in, never the clock. */
export function randomToken(bytes: Uint8Array): string {
  if (bytes.length < 16) throw new Error("need 16 bytes");
  let bits = 0, acc = 0, out = "";
  for (let i = 0; i < 16; i++) {
    acc = (acc << 8) | bytes[i]; bits += 8;
    while (bits >= 6) { bits -= 6; out += B64URL[(acc >> bits) & 63]; }
  }
  if (bits > 0) out += B64URL[(acc << (6 - bits)) & 63];
  return out;                                                   // 22 chars
}

export function newToken(): string {
  const b = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  return randomToken(b);
}

/**
 * SHA-256 in pure TypeScript — the fallback when `crypto.subtle` is absent (H3, AAR class sweep 2026-09-09). A page served
 * over plain http, or opened inside a WebView without a secure origin, has no WebCrypto: the digest used to throw a raw
 * TypeError that made an uploaded file vanish with no message and killed a countersigner mid-stamp. Same output, always.
 */
const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
function sha256Js(bytes: Uint8Array): string {
  const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const len = bytes.length, bitLen = len * 8;
  const withPad = new Uint8Array((((len + 9) >> 6) + 1) << 6);
  withPad.set(bytes); withPad[len] = 0x80;
  const dv = new DataView(withPad.buffer);
  dv.setUint32(withPad.length - 4, bitLen >>> 0); dv.setUint32(withPad.length - 8, Math.floor(bitLen / 4294967296));
  const w = new Uint32Array(64);
  const rr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < withPad.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i - 15], 7) ^ rr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rr(w[i - 2], 17) ^ rr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25), ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22), maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, "0")).join("");
}
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const d = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
      return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
    }
  } catch { /* no WebCrypto here: the pure-JS path below gives the same digest */ }
  return sha256Js(bytes);
}

export const shortHash = (hex: string): string => hex.slice(0, 8);

/** The running chain: each signature pass hashes the previous chain plus the new file hashes (Pangu). */
export async function chainHash(prev: string, fileShas: string[]): Promise<string> {
  return sha256Hex(new TextEncoder().encode(`${prev}:${fileShas.join(",")}`));
}

/* ── hand-off text (Sofia: the message names the sender and the document) ───── */
/** The secret rides in the FRAGMENT: a fragment is never sent to any server, never in a Referer, never in an access log (Thor, wave 3). */
export function signLink(origin: string, token: string, secret: string, file?: string): string {
  // `&file=<sha8>` names ONE file by content (operator 2026-09-09: "saved link to specific file") — the receipt's 8-hex short hash; in the
  // fragment like the secret, so it never reaches a server (Pangu: content outlives ordinals and storage moves)
  return `${origin}/soi-session/sign/?e=${encodeURIComponent(token)}#s=${encodeURIComponent(secret)}${file && /^[0-9a-f]{8}$/i.test(file) ? `&file=${file.toLowerCase()}` : ""}`;
}
/** The record link without any secret — status and the masked roster only; what an outgoing message may carry (Thor). */
export function recordLink(origin: string, token: string): string {
  return `${origin}/soi-session/sign/?e=${encodeURIComponent(token)}`;
}
/** The `file` a saved link points at (an 8-hex short hash), or "" — anything malformed is ignored (Enki). */
export function fileFromLocation(hash: string): string {
  const f = new URLSearchParams(hash.replace(/^#/, "")).get("file") ?? "";
  return /^[0-9a-f]{8}$/i.test(f) ? f.toLowerCase() : "";
}
/** Read a signer link's secret from the fragment (or, for links made before 2026-09-07, the query). */
export function secretFromLocation(search: string, hash: string): string {
  const h = new URLSearchParams(hash.replace(/^#/, "")).get("s");
  if (h) return h;
  return new URLSearchParams(search).get("s") ?? "";
}

export const HANDOFF_TEMPLATE = '{sender} asks you to sign "{title}" on eXeL AI Polling — no account, no fee. This link is yours alone (it holds your key; do not forward it) and it expires in 30 days: {link}';
export function handoffMessage(sender: string, title: string, link: string, template: string = HANDOFF_TEMPLATE): string {
  // function replacers: a title containing "$&" or "$1" must never expand (Enki, wave 2)
  return template.replace("{sender}", () => sender).replace("{title}", () => title).replace("{link}", () => link);
}

/** Build a fresh envelope from the creator's inputs; secrets are minted here, one per signer. */
export function newEnvelope(input: { title: string; created_by: string; signers: { name: string; contact: string }[]; files: SignFile[]; now?: Date }): Envelope {
  if (input.signers.length < 1) throw new Error("need_signer");
  if (input.files.length < 1 || input.files.length > MAX_FILES) throw new Error("file_count");
  if (input.files.reduce((n, f) => n + f.pdf_base64.length, 0) > MAX_ENVELOPE_BYTES * 4 / 3) throw new Error("envelope_too_large");
  const now = input.now ?? new Date();
  const expires = new Date(now.getTime() + ENVELOPE_TTL_DAYS * 86_400_000);
  return {
    token: newToken(),
    title: input.title.trim() || "Untitled",
    created_by: normalizeContact(input.created_by),
    status: "awaiting",
    current_signer_idx: 0,
    signers: input.signers.map((s, i) => ({ name: s.name.trim(), contact: s.contact.trim(), order: i, secret: newToken(), signed_at: null })),
    files: input.files.map((f) => ({ ...f, version: 0 })),
    chain: "",
    expires_at: expires.toISOString(),
  };
}
