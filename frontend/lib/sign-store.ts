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
  /** 037: the NEXT signer's contact, as the creator typed it — so a middle signer can text or e-mail the hand-off (null on the last pass) */
  next_contact?: string | null;
  /** 037: on completion, signer 0's contact — so the finished file can go back to the creator */
  creator_contact?: string | null;
}
export class SignStoreError extends Error {
  code: string;
  constructor(code: string, msg?: string) { super(msg ?? code); this.code = code; }
}

const LOCAL_KEY = (token: string) => `exel-sign:${token}`;
export const storeMode = (): StoreMode => (supabase ? "supabase" : "local");

/** PostgREST's "function not found" — migration 036 has not been applied on this Supabase project. */
export const isMissingRpc = (e: unknown): boolean => {
  const m = ((e as { message?: string })?.message ?? String(e)).toLowerCase();
  const code = String((e as { code?: string })?.code ?? "");
  return code === "PGRST202" || /could not find the function/.test(m);   // ONLY "not found" — a schema-cache reload is transient, never a downgrade (Thor)
};

/** A hanging RPC is a silent failure — bound every call so the page can say "timeout" instead (never silent). */
export const RPC_TIMEOUT_MS = 45_000;
export const withTimeout = <T,>(p: PromiseLike<T>, ms = RPC_TIMEOUT_MS): Promise<T> =>
  new Promise<T>((res, rej) => { const id = setTimeout(() => rej(new SignStoreError("timeout", `No answer from Supabase in ${Math.round(ms / 1000)} s.`)), ms); Promise.resolve(p).then((v) => { clearTimeout(id); res(v); }, (e) => { clearTimeout(id); rej(e); }); });

/** What the "Why can't I sign?" panel shows — a live probe, not an assumption. A refusal such as
 *  bad_token proves the function exists; PGRST202 proves migration 036 is missing on this project. */
export type Probe = "no_supabase" | "rpc_ok" | "rpc_missing" | "unreachable";
/** supabase-js hands a dead network back as an error object, not a throw (fleet, Krishna): "Failed to fetch", "Load failed", "NetworkError". */
export const isNetworkError = (e: unknown): boolean => /failed to fetch|load failed|networkerror|network request failed|fetch failed|ECONN|ENOTFOUND/i.test(((e as { message?: string })?.message ?? String(e)));
export async function probeRpc(): Promise<{ state: Probe; detail: string }> {
  if (!supabase) return { state: "no_supabase", detail: "NEXT_PUBLIC_SUPABASE_URL is not set on this build" };
  try {
    const { error } = await withTimeout(supabase.rpc("sign_envelope_get", { p_token: "probe", p_secret: null, p_ip_hash: null, p_user_agent: "diag" }), 15_000);
    if (!error) return { state: "rpc_ok", detail: "" };
    if (isMissingRpc(error)) return { state: "rpc_missing", detail: error.message };
    if (isNetworkError(error)) return { state: "unreachable", detail: error.message };
    return { state: "rpc_ok", detail: error.message };
  } catch (e) { return { state: "unreachable", detail: String((e as Error).message ?? e) }; }
}

/** The SignStoreError code for an RPC failure — pure, so the mapping is unit-tested (operator 2026-09-09: the signature loop). */
export const rpcErrorCode = (e: unknown): { code: string; message: string } => {
  const m = (e as { message?: string })?.message ?? String(e);
  if (/duplicate key|23505/i.test(m)) return { code: "duplicate", message: m };
  if (isNetworkError(e)) return { code: "unreachable", message: m };
  // 42883 (undefined_function) from INSIDE an RPC: 036 is applied but pgcrypto is off its search_path (038 not pasted) — the migration is
  // incomplete; treated like no_migration so the signing completes on the device instead of failing at "create" on every tap
  if (/42883|does not exist/i.test(m) && /function/i.test(m)) return { code: "migration_incomplete", message: m };
  const code = /timeout|no_migration|not_found|expired|bad_secret|not_your_turn|complete|revoked|locked|file_count_mismatch|file_count|file_too_large|envelope_too_large|bad_token|need_signer/.exec(m)?.[0] ?? "rpc_error";
  return { code, message: m };
};
const rpcError = (e: unknown): never => {
  if (e instanceof SignStoreError) throw e;
  if (isMissingRpc(e)) throw new SignStoreError("no_backend", "This site has not applied migration 036 yet.");
  const { code, message } = rpcErrorCode(e);
  throw new SignStoreError(code, message);
};

/** Persist a fresh envelope. Multi-signer requires Supabase; single-signer may stay on this device. */
export async function createEnvelope(env: Envelope, opts: { localMulti?: boolean } = {}): Promise<{ token: string; mode: StoreMode }> {
  // Without a shared store a multi-signer envelope refuses BY NAME (no_backend: no Supabase on the build;
  // no_migration: Supabase answers but 036 is missing) — unless the caller asks for the offline path
  // (localMulti): the envelope lives on this device, the partly-signed file travels by hand (operator 00:39).
  const local = (why: "no_backend" | "no_migration" | "migration_incomplete") => {
    if (env.signers.length > 1 && !opts.localMulti) throw new SignStoreError(why, why === "no_migration" ? "This site has not applied migration 036 yet." : why === "migration_incomplete" ? "This site's migration is incomplete (paste the served SQL again: 036+037+038)." : "No Supabase on this build.");
    localStorage.setItem(LOCAL_KEY(env.token), JSON.stringify(env));
    return { token: env.token, mode: "local" as StoreMode };
  };
  if (!supabase) return local("no_backend");
  const { data, error } = await withTimeout(supabase.rpc("sign_envelope_create", {
    p_token: env.token, p_title: env.title, p_created_by: env.created_by,
    p_signers: env.signers.map((s, i) => ({ name: s.name, contact: s.contact, secret: i === 0 ? s.secret : undefined })),
    p_files: env.files.map((f) => ({ name: f.name, page_count: f.page_count, pdf_base64: f.pdf_base64, sha256: f.sha256 })),
    p_expires_at: env.expires_at ?? null,
  }));
  if (error) {
    if (isMissingRpc(error)) return local("no_migration");                                  // one signer signs alone even before 036
    if (rpcErrorCode(error).code === "migration_incomplete") return local("migration_incomplete");   // 036 applied, 038 not: pgcrypto off the RPC's path (operator 2026-09-09, the loop)
    rpcError(error);
  }
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
  const l = fromLocal(token, secret);                        // a locally-kept envelope is answered from this device
  if (!supabase || l) { if (!l) throw new SignStoreError("not_found"); return l; }
  const { data, error } = await withTimeout(supabase.rpc("sign_envelope_get", { p_token: token, p_secret: secret || null, p_ip_hash: null, p_user_agent: navigator.userAgent.slice(0, 300) }));
  if (error) rpcError(error);
  if ((data as { error?: string } | null)?.error) rpcError(new Error((data as { error: string }).error));   // 037: a wrong secret is returned, not raised, so the lock counter commits
  return { ...(data as Omit<PublicEnvelope, "mode">), mode: "supabase" };
}

export async function signEnvelope(token: string, idx: number, secret: string, files: SignFile[], chain: string, localNext?: Envelope, marks?: unknown): Promise<PublicEnvelope> {
  if (!supabase || (localNext && localStorage.getItem(LOCAL_KEY(token)))) {
    if (!localNext) throw new SignStoreError("no_backend");
    localStorage.setItem(LOCAL_KEY(token), JSON.stringify(localNext));
    const e = fromLocal(token, secret); if (!e) throw new SignStoreError("not_found");
    const done = localNext.status !== "awaiting";
    return { ...e, next_secret: !done ? localNext.signers[localNext.current_signer_idx]?.secret ?? null : null, next_contact: !done ? localNext.signers[localNext.current_signer_idx]?.contact ?? null : null, creator_contact: done ? localNext.signers[0]?.contact ?? null : null };   // parity with 037
  }
  const { data, error } = await withTimeout(supabase.rpc("sign_envelope_sign", {
    p_token: token, p_signer_idx: idx, p_secret: secret,
    p_files: files.map((f) => ({ name: f.name, page_count: f.page_count, pdf_base64: f.pdf_base64, sha256: f.sha256 })),
    p_chain: chain, p_ip_hash: null, p_user_agent: navigator.userAgent.slice(0, 300), p_marks: marks ?? null,
  }));
  if (error) rpcError(error);
  if ((data as { error?: string } | null)?.error) rpcError(new Error((data as { error: string }).error));   // 037: a wrong secret is returned, not raised, so the lock counter commits
  return { ...(data as Omit<PublicEnvelope, "mode">), mode: "supabase" };
}

export async function revokeEnvelope(token: string, creatorSecret: string): Promise<void> {
  if (!supabase) { localStorage.removeItem(LOCAL_KEY(token)); return; }
  const { error } = await withTimeout(supabase.rpc("sign_envelope_revoke", { p_token: token, p_secret: creatorSecret }));
  if (error) rpcError(error);
}
