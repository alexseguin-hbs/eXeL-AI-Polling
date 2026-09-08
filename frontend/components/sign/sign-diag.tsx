"use client";

/**
 * "Why can't I sign?" — the Sign Doc page diagnoses itself (operator, 2026-09-07: "I still cannot sign"
 * from a phone, with no screen to look at). Six rows, each a live check, then ONE sentence that says
 * what to do: build SHA · storage mode · the 036 RPC probe · the pdf worker · the login state · the
 * step and its error. Opens by the link under the rail, and by itself on any error state.
 */
import { Fragment, useEffect, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { probeRpc, type Probe, type StoreMode } from "@/lib/sign-store";

export type AuthState = "guarded" | "bypassed" | "in";
export interface DiagInput { mode: StoreMode; auth: AuthState; authName?: string; multi: boolean; err: string; step: string }

export const BUILD_SHA = (process.env.NEXT_PUBLIC_GIT_SHA ?? "dev").slice(0, 7);

export function SignDiag({ d, open, onToggle }: { d: DiagInput; open: boolean; onToggle: () => void }) {
  const { t } = useLexicon();
  const [rpc, setRpc] = useState<{ state: Probe | "checking"; detail: string }>({ state: "checking", detail: "" });
  const [worker, setWorker] = useState<"checking" | "ok" | "missing">("checking");
  useEffect(() => {
    if (!open) return;
    let live = true;
    setRpc({ state: "checking", detail: "" }); setWorker("checking");
    probeRpc().then((r) => { if (live) setRpc(r); });
    fetch("/pdf.worker.min.mjs", { method: "HEAD" }).then((r) => { if (live) setWorker(r.ok ? "ok" : "missing"); }).catch(() => { if (live) setWorker("missing"); });
    return () => { live = false; };
  }, [open]);
  const checking = rpc.state === "checking" || worker === "checking";
  const todo = worker === "missing" ? t("soi.sign.diag.todo.worker")
    : checking ? t("soi.sign.diag.checking")
    : rpc.state === "no_supabase" ? t(d.multi ? "soi.sign.diag.todo.no_supabase" : "soi.sign.diag.todo.solo")
    : rpc.state === "rpc_missing" ? t(d.multi ? "soi.sign.diag.todo.rpc_missing" : "soi.sign.diag.todo.solo")
    : rpc.state === "unreachable" ? t("soi.sign.diag.todo.unreachable")
    : d.err ? t("soi.sign.diag.todo.err") : t("soi.sign.diag.todo.ok");
  const rows: [string, string, string][] = [
    [t("soi.sign.diag.build"), BUILD_SHA, "diag-build"],
    [t("soi.sign.diag.storage"), t(`soi.sign.diag.storage.${d.mode}`), "diag-storage"],
    [t("soi.sign.diag.rpc"), rpc.state === "checking" ? t("soi.sign.diag.checking") : t(`soi.sign.diag.rpc.${rpc.state}`), "diag-rpc"],
    [t("soi.sign.diag.worker"), t(`soi.sign.diag.worker.${worker}`), "diag-worker"],
    [t("soi.sign.diag.auth"), t(`soi.sign.diag.auth.${d.auth}`) + (d.authName ? ` · ${d.authName}` : ""), "diag-auth"],
    [t("soi.sign.diag.step"), t(`soi.sign.step.${d.step === "saving" || d.step === "login" ? "sign" : d.step === "loading" || d.step === "waiting" || d.step === "not_party" ? "open" : d.step}`) + (d.err ? ` · ${d.err}` : ""), "diag-step"],
  ];
  const copy = () => { try { void navigator.clipboard.writeText(rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n${todo}\n${rpc.detail}\n${navigator.userAgent}`); } catch { /* no clipboard */ } };
  // the fix itself, from the phone: the migration's SQL to the clipboard → Supabase → SQL editor → Run → reload
  const [sqlState, setSqlState] = useState<"" | "copied" | "failed">("");
  const copySql = async () => { try { const r = await fetch("/sql/036_sign_envelopes.sql"); if (!r.ok) throw new Error(String(r.status)); await navigator.clipboard.writeText(await r.text()); setSqlState("copied"); } catch { setSqlState("failed"); } };
  return (
    <div className="mb-3 text-xs" data-testid="sign-diag">
      <button type="button" onClick={onToggle} className="min-h-[36px] text-cyan-400 underline-offset-2 hover:underline" aria-expanded={open} data-testid="diag-toggle">{open ? "▾" : "▸"} {t("soi.sign.diag.link")}</button>
      {open && (
        <div className="mt-1 rounded-md border border-border bg-background p-2" data-testid="diag-panel">
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            {rows.map(([k, v, id]) => <Fragment key={id}><dt className="text-muted-foreground">{k}</dt><dd className="break-words" data-testid={id}>{v}</dd></Fragment>)}
          </dl>
          <p className="mt-2 font-medium text-foreground" data-testid="diag-todo" aria-live="polite">{todo}</p>
          <button type="button" onClick={copy} className="mt-2 min-h-[36px] rounded-md border border-border px-3">{t("soi.sign.diag.copy")}</button>
          {rpc.state === "rpc_missing" && (
            <div className="mt-3 rounded-md border border-cyan-400/40 p-2" data-testid="diag-fix">
              <div className="font-medium text-foreground">{t("soi.sign.diag.fix_title")}</div>
              <p className="mt-1 text-muted-foreground">{t("soi.sign.diag.sql_how")}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={copySql} className="min-h-[36px] rounded-md bg-primary px-3 text-primary-foreground" data-testid="diag-copy-sql">{sqlState === "copied" ? t("soi.sign.diag.sql_copied") : sqlState === "failed" ? t("soi.sign.diag.sql_failed") : t("soi.sign.diag.copy_sql")}</button>
                <a href="/sql/036_sign_envelopes.sql" target="_blank" rel="noreferrer" className="min-h-[36px] rounded-md border border-border px-3 leading-[36px]" data-testid="diag-open-sql">{t("soi.sign.diag.open_sql")}</a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
