/**
 * Sign Doc store — the four Supabase RPCs from migration 036, plus a single-signer LOCAL mode.
 * A null Supabase client (no NEXT_PUBLIC_SUPABASE_* at build time) is a HARD, visible failure for
 * any multi-signer envelope (Krishna + Athena, round 1): a link minted from a device-local store is a
 * link the other person cannot open. Local mode exists only so one person can sign their own
 * document on their own phone without a backend.
 */
import { supabase } from "@/lib/supabase";
import type { Envelope, SignFile } from "@/lib/sign-envelope";
import { maskContact } from "@/lib/sign-envelope";

export type StoreMode = "supabase" | "local";
export interface PublicSigner { name: string; contact_masked: string; order: number; signed_at: string | null; me: boolean }
export interface PublicEnvelope {
  token: string; title: string; status: string; current_signer_idx: number; signers: PublicSigner[];
  chain: string; expires_at: string | null; party: number; files: SignFile[] | null; mode: StoreMode;
  /** The baton: returned once to the signer who just signed, for the NEXT signer's link. */
  next_secret?: string | null;
}
export class SignStoreError extends Error { constructor(public code: string, msg?: string) { super(msg ?? code); } }

const LOCAL_KEY = (token: string) => `exel-sign:${token}`;
export const storeMode = (): StoreMode => (supabase ? "supabase" : "local");

const rpcError = (e: unknown): never => {
  const m = (e as { message?: string })?.message ?? String(e);
  const code = /not_found|expired|bad_secret|not_your_turn|complete|revoked|locked|file_count|file_too_large|bad_token|need_signer/.exec(m)?.[0] ?? "rpc_error";
  throw new SignStoreError(code, m);
};

/** Persist a fresh envelope. Multi-signer requires Supabase; single-signer may stay on this device. */
export async function createEnvelope(env: Envelope): Promise<{ token: string; mode: StoreMode }> {
  if (!supabase) {
    if (env.signers.length > 1) throw new SignStoreError("no_backend", "Supabase is not configured on this build — a hand-off link cannot be minted.");
    localStorage.setItem(LOCAL_KEY(env.token), JSON.stringify(env));
    return { token: env.token, mode: "local" };
  }
  const { data, error } = await supabase.rpc("sign_envelope_create", {
    p_token: env.token, p_title: env.title, p_created_by: env.created_by,
    p_signers: env.signers.map((s, i) => ({ name: s.name, contact: s.contact, secret: i === 0 ? s.secret : undefined })),
    p_files: env.files.map((f) => ({ name: f.name, page_count: f.page_count, pdf_base64: f.pdf_base64, sha256: f.sha256 })),
    p_expires_at: env.expires_at ?? null,
  });
  if (error) rpcError(error);
  return { token: (data as { token: string }).token, mode: "supabase" };
}

const fromLocal = (token: string, secret: string): PublicEnvelope | null => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(token)); if (!raw) return null;
    const env = JSON.parse(raw) as Envelope;
    const party = env.signers.findIndex((s) => s.secret === secret);
    return {
      token: env.token, title: env.title, status: env.status, current_signer_idx: env.current_signer_idx,
      signers: env.signers.map((s, i) => ({ name: s.name, contact_masked: maskContact(s.contact), order: s.order, signed_at: s.signed_at ?? null, me: i === party })),
      chain: env.chain, expires_at: env.expires_at ?? null, party, files: party >= 0 ? env.files : null, mode: "local",
    };
  } catch { return null; }
};

export async function getEnvelope(token: string, secret: string): Promise<PublicEnvelope> {
  if (!supabase) { const e = fromLocal(token, secret); if (!e) throw new SignStoreError("not_found"); return e; }
  const { data, error } = await supabase.rpc("sign_envelope_get", { p_token: token, p_secret: secret || null, p_ip_hash: null, p_user_agent: navigator.userAgent.slice(0, 300) });
  if (error) rpcError(error);
  return { ...(data as Omit<PublicEnvelope, "mode">), mode: "supabase" };
}

export async function signEnvelope(token: string, idx: number, secret: string, files: SignFile[], chain: string, localNext?: Envelope): Promise<PublicEnvelope> {
  if (!supabase) {
    if (!localNext) throw new SignStoreError("no_backend");
    localStorage.setItem(LOCAL_KEY(token), JSON.stringify(localNext));
    const e = fromLocal(token, secret); if (!e) throw new SignStoreError("not_found");
    return { ...e, next_secret: localNext.status === "awaiting" ? localNext.signers[localNext.current_signer_idx]?.secret ?? null : null };
  }
  const { data, error } = await supabase.rpc("sign_envelope_sign", {
    p_token: token, p_signer_idx: idx, p_secret: secret,
    p_files: files.map((f) => ({ name: f.name, page_count: f.page_count, pdf_base64: f.pdf_base64, sha256: f.sha256 })),
    p_chain: chain, p_ip_hash: null, p_user_agent: navigator.userAgent.slice(0, 300),
  });
  if (error) rpcError(error);
  return { ...(data as Omit<PublicEnvelope, "mode">), mode: "supabase" };
}

export async function revokeEnvelope(token: string, creatorSecret: string): Promise<void> {
  if (!supabase) { localStorage.removeItem(LOCAL_KEY(token)); return; }
  const { error } = await supabase.rpc("sign_envelope_revoke", { p_token: token, p_secret: creatorSecret });
  if (error) rpcError(error);
}
