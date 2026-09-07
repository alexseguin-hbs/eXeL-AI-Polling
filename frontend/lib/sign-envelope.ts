/**
 * Sign Doc — the pure envelope model (no DOM, no network). One envelope = one or more PDFs and an
 * ordered list of signers; exactly one signer may act at a time. Every signer holds a private
 * `secret` minted with the envelope (Enki + Thor, round 1): the turn is keyed by that secret, never
 * by a contact string two people could share. Contacts are still recorded and normalized so the
 * hand-off message can name the right person. Every function here is proven by
 * tests/sign-envelope.test.mjs; the SQL RPCs in supabase/migrations/036_sign_envelopes.sql enforce
 * the same rules server-side.
 */

export type SignStatus = "awaiting" | "complete" | "revoked" | "expired";

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

export type SignRefusal = "complete" | "revoked" | "expired" | "not_your_turn" | "bad_secret";

export const ENVELOPE_TTL_DAYS = 30;
export const MAX_FILE_BYTES = 3 * 1024 * 1024;     // Thoth, round 1: keep one RPC body under the PostgREST limit
export const MAX_FILES = 5;

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

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(d), (x) => x.toString(16).padStart(2, "0")).join("");
}

export const shortHash = (hex: string): string => hex.slice(0, 8);

/** The running chain: each signature pass hashes the previous chain plus the new file hashes (Pangu). */
export async function chainHash(prev: string, fileShas: string[]): Promise<string> {
  return sha256Hex(new TextEncoder().encode(`${prev}:${fileShas.join(",")}`));
}

/* ── hand-off text (Sofia: the message names the sender and the document) ───── */
export function signLink(origin: string, token: string, secret: string): string {
  return `${origin}/soi-session/sign/?e=${encodeURIComponent(token)}&s=${encodeURIComponent(secret)}`;
}

export function handoffMessage(sender: string, title: string, link: string): string {
  return `${sender} asks you to sign "${title}" on eXeL — no account, no fee. Open: ${link}`;
}

/** Build a fresh envelope from the creator's inputs; secrets are minted here, one per signer. */
export function newEnvelope(input: { title: string; created_by: string; signers: { name: string; contact: string }[]; files: SignFile[]; now?: Date }): Envelope {
  if (input.signers.length < 1) throw new Error("need_signer");
  if (input.files.length < 1 || input.files.length > MAX_FILES) throw new Error("file_count");
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
