"use client";

/**
 * One PDF, one page at a time, rendered by pdfjs to a canvas that fits the phone. MARKS live on it:
 * one signature box per file and any number of text marks (a date, a name, a note). Tap an empty
 * spot to place the signature (when there is none yet); drag inside a mark to move it; drag its
 * bottom-right handle to resize it (operator, 2026-09-07). Vertical swipes scroll (`pan-y`); a box
 * is placed on a TAP, never on pointer-down. Boxes are page FRACTIONS so pdf-stamp lands them.
 * The first box FITS the signature line under the thumb when there is one (lib/sign-fit — the rule's
 * width, no taller than the text above it; operator 2026-09-07); a horizontal swipe turns the page,
 * the Divinity Guide reader's gesture (R-CORE reuse), beside the ‹ › buttons.
 */
import { useEffect, useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { openPdf, renderPage } from "@/lib/pdf-render";
import { fitToUnderline } from "@/lib/sign-fit";
import type { StampBox } from "@/lib/pdf-stamp";

export interface Mark extends StampBox { id: string; kind: "sig" | "text"; text?: string; /** how the box got its size: fitted to a rule, or the default */ fit?: "underline" | "default" }
export const SIG_W = 0.4, SIG_H = 0.08, TXT_W = 0.22, TXT_H = 0.035, MIN_W = 0.08, MIN_H = 0.02;

export function PdfPageView({ bytes, marks, onMarks, selectedId, onSelect, preview, readOnly, onPage }: {
  bytes: Uint8Array; marks: Mark[]; onMarks: (m: Mark[]) => void; selectedId: string | null; onSelect: (id: string | null) => void;
  preview?: string | null; readOnly?: boolean; onPage?: (page: number) => void;
}) {
  const { t } = useLexicon();
  const host = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [err, setErr] = useState("");
  const docRef = useRef<Awaited<ReturnType<typeof openPdf>> | null>(null);
  const marksRef = useRef(marks); marksRef.current = marks;
  useEffect(() => { onPage?.(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let live = true;
    (async () => {
      try { const doc = await openPdf(bytes); if (!live) return; docRef.current = doc; setPages(doc.numPages); setPage(1); }
      catch (e) { setErr(String((e as Error).message || e)); }
    })();
    return () => { live = false; };
  }, [bytes]);

  useEffect(() => {
    let live = true;
    (async () => {
      const doc = docRef.current, el = host.current; if (!doc || !el) return;
      const width = Math.min(el.clientWidth || 343, 640);
      try { const r = await renderPage(doc, page, width); if (!live) return; el.querySelectorAll("canvas").forEach((c) => c.remove()); el.insertBefore(r.canvas, el.firstChild); }
      catch (e) { setErr(String((e as Error).message || e)); }
    })();
    return () => { live = false; };
  }, [page, pages]);

  const frac = (cx: number, cy: number) => { const r = host.current!.getBoundingClientRect(); return { x: (cx - r.left) / r.width, y: (cy - r.top) / r.height }; };
  const clampBox = (m: Mark): Mark => ({ ...m, w: Math.min(Math.max(m.w, MIN_W), 1), h: Math.min(Math.max(m.h, MIN_H), 1), x: Math.min(Math.max(m.x, 0), 1 - Math.min(Math.max(m.w, MIN_W), 1)), y: Math.min(Math.max(m.y, 0), 1 - Math.min(Math.max(m.h, MIN_H), 1)) });
  const update = (id: string, patch: Partial<Mark>) => onMarks(marksRef.current.map((m) => (m.id === id ? clampBox({ ...m, ...patch }) : m)));
  const hit = (p: { x: number; y: number }) => [...marksRef.current].reverse().find((m) => m.page === page && p.x >= m.x && p.x <= m.x + m.w && p.y >= m.y && p.y <= m.y + m.h) ?? null;
  const onHandle = (p: { x: number; y: number }, m: Mark) => { const r = host.current!.getBoundingClientRect(); const hx = (m.x + m.w) - p.x, hy = (m.y + m.h) - p.y; return hx * r.width < 44 && hy * r.height < 44 && hx >= -0.02 && hy >= -0.02; };   // 44 px thumb slop (Thoth)

  /** The signature line under the thumb, read from the rendered page's pixels (a scan has no PDF structure). */
  const fitAt = (q: { x: number; y: number }) => {
    try {
      const c = host.current?.querySelector("canvas"); const ctx = c?.getContext("2d", { willReadFrequently: true });
      if (!c || !ctx) return null;
      return fitToUnderline({ width: c.width, height: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data }, q);
    } catch { return null; }
  };
  // Divinity Guide reader gesture: swipe left → next page, swipe right → previous (never from inside a mark)
  const swipe = useRef<{ x: number; y: number; onMark: boolean } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { const t0 = e.touches[0]; swipe.current = { x: t0.clientX, y: t0.clientY, onMark: !!hit(frac(t0.clientX, t0.clientY)) }; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s0 = swipe.current; swipe.current = null; if (!s0 || s0.onMark) return;
    const t1 = e.changedTouches[0]; const dx = t1.clientX - s0.x, dy = t1.clientY - s0.y;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && page < pages) setPage((p) => p + 1); else if (dx > 0 && page > 1) setPage((p) => p - 1);
  };
  const onDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    const p = frac(e.clientX, e.clientY);
    const m = hit(p);
    const resizing = !!(m && onHandle(p, m));
    const start = { x: e.clientX, y: e.clientY }; let moved = false;
    const off = m ? { dx: p.x - m.x, dy: p.y - m.y } : null;
    if (m) onSelect(m.id);
    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) moved = true;
      if (!m) return;
      ev.preventDefault();
      const q = frac(ev.clientX, ev.clientY);
      if (resizing) update(m.id, { w: Math.max(MIN_W, q.x - m.x), h: Math.max(MIN_H, q.y - m.y) });
      else update(m.id, { x: q.x - off!.dx, y: q.y - off!.dy });
    };
    const end = (ev: PointerEvent, cancelled: boolean) => {
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", cancel);
      if (!cancelled && !moved && !m) {
        // a TAP on empty page: place the signature if this file has none yet, else leave the page alone
        if (!marksRef.current.some((k) => k.kind === "sig")) {
          const q = frac(ev.clientX, ev.clientY);
          const fit = fitAt(q);
          const sig = clampBox(fit ? { id: "sig", kind: "sig", page, x: fit.x, y: fit.y, w: fit.w, h: fit.h, fit: "underline" } : { id: "sig", kind: "sig", page, x: q.x - SIG_W / 2, y: q.y - SIG_H / 2, w: SIG_W, h: SIG_H, fit: "default" });
          onMarks([...marksRef.current, sig]); onSelect("sig");
        } else onSelect(null);
      }
    };
    const up = (ev: PointerEvent) => end(ev, false);
    const cancel = (ev: PointerEvent) => end(ev, true);
    document.addEventListener("pointermove", move, { passive: false }); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", cancel);
  };

  const sigHere = marks.some((m) => m.kind === "sig" && m.page === page);
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="min-h-[44px] rounded-md border border-border px-3 disabled:opacity-40" aria-label={t("soi.sign.page_prev")} data-testid="page-prev">‹</button>
        <span>{t("soi.sign.page")} {page} / {pages || "…"}</span>
        <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="min-h-[44px] rounded-md border border-border px-3 disabled:opacity-40" aria-label={t("soi.sign.page_next")} data-testid="page-next">›</button>
      </div>
      <div ref={host} className="relative w-full select-none overflow-hidden rounded-md border border-border bg-white" style={{ touchAction: readOnly ? "auto" : "pan-y" }} onPointerDown={onDown} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} data-testid="pdf-page">
        {marks.filter((m) => m.page === page).map((m) => {
          const sel = m.id === selectedId;
          return (
            <div key={m.id} className={`pointer-events-none absolute rounded ${sel ? "border-[3px] border-cyan-400 shadow-[0_0_0_2px_rgba(0,0,0,.35)]" : "border-2 border-cyan-500/50"} ${m.kind === "sig" ? (sel ? "bg-cyan-400/15" : "border-dashed bg-cyan-400/10") : (sel ? "bg-amber-300/20" : "border-dotted bg-amber-300/10")}`}
              style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, width: `${m.w * 100}%`, height: `${m.h * 100}%` }} data-testid={m.kind === "sig" ? "sig-box" : "text-box"} data-fit={m.fit}>
              {m.kind === "sig" && preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="" className="h-full w-full object-contain" />}
              {m.kind === "text" && <span className="block h-full w-full overflow-hidden whitespace-nowrap px-0.5 text-neutral-900" style={{ fontSize: "min(14px, 100%)", lineHeight: 1.2 }}>{m.text}</span>}
              {sel && !readOnly && <span className="absolute -bottom-2.5 -right-2.5 h-6 w-6 rounded-md border-2 border-white bg-cyan-500 shadow" aria-hidden="true" data-testid="resize-handle" />}
            </div>
          );
        })}
        {err && <p className="p-3 text-xs text-red-500">{err}</p>}
      </div>
      {!readOnly && <p className="mt-1 text-[11px] text-muted-foreground">{sigHere ? t("soi.sign.place_move") : t("soi.sign.place_hint")}</p>}
    </div>
  );
}
