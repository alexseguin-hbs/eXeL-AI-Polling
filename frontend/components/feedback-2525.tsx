"use client";
/**
 * FEEDBACK-2525 — the operator's reader for the feedback repository (operator 2026-10-02, addendum 132: "supabase is repo of feedback;
 * accessible by Easter egg unlock in admin console: Feedback-2525").
 *
 * Shown only inside the easter-egg admin console (/sim, cube10Access === "admin"). Every Feedback button on every sub-site writes a row
 * to product_feedback tagged with its sub-site (addendum 128); the public can write but never read. This console reads through the
 * guarded database functions of migration 039, which answer only for an admin key whose hash is on file — the key is typed here once
 * and remembered on this device only. Newest first, filter by sub-site, mark resolved, download CSV.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { feedbackCsv, feedbackError, siteName, type FeedbackRow } from "@/lib/feedback-2525";
import { Button } from "@/components/ui/button";

const KEY_STORE = "feedback-2525-key";

export function Feedback2525() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<FeedbackRow[] | null>(null);
  const [site, setSite] = useState("all");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { try { setKey(localStorage.getItem(KEY_STORE) ?? ""); } catch { /* no storage: type it each visit */ } }, []);
  const load = useCallback(async (k: string) => {
    if (!supabase) { setMsg("The feedback repository is not configured on this build."); return; }
    if (!k.trim()) { setMsg("Enter the admin key."); return; }
    setBusy(true); setMsg("");
    const { data, error } = await supabase.rpc("product_feedback_list", { p_key: k.trim(), p_screen: null, p_limit: 1000 });
    setBusy(false);
    if (error) { setRows(null); setMsg(feedbackError(error.message)); return; }
    setRows((data ?? []) as FeedbackRow[]);
    try { localStorage.setItem(KEY_STORE, k.trim()); } catch { /* remembered for this visit only */ }
  }, []);
  const resolve = async (r: FeedbackRow) => {
    if (!supabase) return;
    const { error } = await supabase.rpc("product_feedback_resolve", { p_key: key.trim(), p_id: r.id, p_resolved: !r.is_resolved });
    if (error) { setMsg(feedbackError(error.message)); return; }
    setRows((rs) => (rs ?? []).map((x) => (x.id === r.id ? { ...x, is_resolved: !x.is_resolved } : x)));
  };
  const counts = useMemo(() => { const c: Record<string, number> = {}; for (const r of rows ?? []) c[r.screen] = (c[r.screen] ?? 0) + 1; return c; }, [rows]);
  const shown = (rows ?? []).filter((r) => site === "all" || r.screen === site);
  const download = () => {
    const blob = new Blob([feedbackCsv(shown)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `feedback-2525${site === "all" ? "" : "-" + site}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <section data-feedback-2525 className="mx-auto w-full max-w-4xl space-y-3 px-4 py-4">
      <h2 className="text-lg font-semibold">Feedback-2525</h2>
      <p className="text-xs text-muted-foreground">Every Feedback button on every sub-site, newest first. Only an admin key reads it.</p>
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); void load(key); }}>
        <input id="feedback-2525-key" data-feedback-2525-key type="password" autoComplete="off" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Admin key" aria-label="Admin key" className="h-9 min-w-0 flex-1 rounded-md border border-border bg-background px-2 font-mono text-sm" />
        <Button type="submit" size="sm" disabled={busy} data-feedback-2525-open>{busy ? "Opening…" : rows ? "Refresh" : "Open"}</Button>
      </form>
      {msg && <p data-feedback-2525-msg className="text-sm text-red-500">{msg}</p>}
      {rows && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select data-feedback-2525-site value={site} onChange={(e) => setSite(e.target.value)} aria-label="Sub-site" className="h-8 rounded-md border border-border bg-background px-2">
              <option value="all">All sites · {rows.length}</option>
              {Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([s, n]) => <option key={s} value={s}>{siteName(s)} · {n}</option>)}
            </select>
            <Button type="button" variant="outline" size="sm" onClick={download} disabled={!shown.length} data-feedback-2525-csv>Download CSV</Button>
          </div>
          {shown.length === 0 && <p className="text-sm text-muted-foreground">No feedback yet.</p>}
          <ul className="space-y-2">
            {shown.map((r) => (
              <li key={r.id} data-feedback-2525-row className={`rounded-md border border-border p-3 ${r.is_resolved ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{siteName(r.screen)}</span>
                  <span>{r.category} · {r.device_type ?? "—"} · {new Date(r.created_at).toLocaleString()}</span>
                  <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => void resolve(r)}>{r.is_resolved ? "Reopen" : "Resolved"}</Button>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">{r.feedback_text}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
