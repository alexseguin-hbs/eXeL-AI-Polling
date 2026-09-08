"use client";

/**
 * One PDF, one page at a time, rendered by pdfjs to a canvas that fits the phone. MARKS live on it:
 * one signature box per file and any number of text marks (a date, a name, a note). Tap an empty
 * spot to place the signature (when there is none yet); drag inside a mark to move it; drag its
 * UPPER-right handle to resize it — the bottom edge, the signature's baseline, never moves (operator,
 * 2026-09-08). Vertical swipes scroll (`pan-y`); a box
 * is placed on a TAP, never on pointer-down. Boxes are page FRACTIONS so pdf-stamp lands them.
 * The first box FITS the signature line under the thumb when there is one (lib/sign-fit — the rule's
 * width, no taller than the text above it; operator 2026-09-07); a horizontal swipe turns the page,
 * the Divinity Guide reader's gesture (R-CORE reuse), beside the ‹ › buttons.
 * A MARK TAKES THE TOUCH (operator 2026-09-08: "I want to move that only, but PDF moves at same time"): every mark is
 * touch-action none and receives pointer events, so a finger that lands on a mark never pans the page or the scroller —
 * marks were pointer-events-none before, the finger hit the canvas (pan-y), and the browser scrolled while the drag moved.
 * ZOOM (operator 2026-09-08: "make sure one can zoom on PDF so signature and text can be centered and
 * aligned"): pinch, double-tap, or − / + zoom the page 1–4× inside a scroller; marks are page FRACTIONS so
 * they stay put at any zoom and a drag at 4× moves a quarter as far. ⌖ snaps the selected mark onto the
 * rule under it (lib/sign-fit again), centred on the line. Arrow keys nudge ¼ % (desktop).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { openPdf, renderPage } from "@/lib/pdf-render";
import { fitToUnderline } from "@/lib/sign-fit";
import type { StampBox } from "@/lib/pdf-stamp";

export interface Mark extends StampBox { id: string; kind: "sig" | "text"; text?: string; /** how the box got its size: fitted to a rule, the default, a placeholder, or the AI */ fit?: "underline" | "default" | "holder" | "ai" | "stamped" }   // "stamped": the signer's OWN text from an earlier pass, loaded back for remove/redo (operator 2026-09-08 22:40)
export const SIG_W = 0.4, SIG_H = 0.08, TXT_W = 0.22, TXT_H = 0.02, MIN_W = 0.08, MIN_H = 0.012;   // TXT_H 0.02 = a 16-pt line on Letter: typed text prints at the document's own size (the live note printed a 27-pt date — operator 2026-09-08)

export type FitAt = (q: { x: number; y: number }) => ReturnType<typeof fitToUnderline>;
export function PdfPageView({ bytes, marks, onMarks, selectedId, onSelect, preview, readOnly, onPage, fitRef, onDelete }: {
  bytes: Uint8Array; marks: Mark[]; onMarks: (m: Mark[]) => void; selectedId: string | null; onSelect: (id: string | null) => void;
  preview?: string | null; readOnly?: boolean; onPage?: (page: number) => void;
  /** lends the pixel fit to the flow (+ Date snaps to the document's own "Date:" line) */ fitRef?: React.MutableRefObject<FitAt | null>;
  /** kept for callers; the delete control lives in the toolbar under the page (operator 02:00: a badge on the box hid the text) */ onDelete?: (id: string) => void;
}) {
  const { t } = useLexicon();
  const host = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [zoom, setZoomState] = useState(1);
  const [base, setBase] = useState(0);                 // the page's CSS width at 1× — the scroller's width, at most 640
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [err, setErr] = useState("");
  const docRef = useRef<Awaited<ReturnType<typeof openPdf>> | null>(null);
  const marksRef = useRef(marks); marksRef.current = marks;
  useEffect(() => { onPage?.(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let live = true;
    (async () => {
      // open on the page that already holds the signature (coming back from Draw), else page 1
      try { const doc = await openPdf(bytes); if (!live) return; docRef.current = doc; setPages(doc.numPages); setPage(Math.min(doc.numPages, Math.max(1, marksRef.current.find((m) => m.kind === "sig")?.page ?? marksRef.current[0]?.page ?? 1))); /* else the first page that holds a mark (edit-own: stamped text, no signature box) */ }
      catch (e) { setErr(String((e as Error).message || e)); }
    })();
    return () => { live = false; };
  }, [bytes]);

  // the 1× width follows the scroller (phone rotation, split view) — never the zoomed host
  useEffect(() => {
    const el = scroller.current; if (!el) return;
    const measure = () => setBase(Math.min(el.clientWidth || 343, 640));
    measure();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null; ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      const doc = docRef.current, el = host.current; if (!doc || !el || !base) return;
      try { const r = await renderPage(doc, page, Math.round(base * zoom)); if (!live) return; el.querySelectorAll("canvas").forEach((c) => c.remove()); el.insertBefore(r.canvas, el.firstChild); }
      catch (e) { setErr(String((e as Error).message || e)); }
    })();
    return () => { live = false; };
  }, [page, pages, base, zoom]);

  /** Zoom to `z` keeping the page point under `at` (page fractions; default: the scroller's centre) where it is. */
  const setZoom = useCallback((z: number, at?: { x: number; y: number }) => {
    const next = Math.min(4, Math.max(1, Math.round(z * 100) / 100));
    const sc = scroller.current;
    setZoomState((prev) => {
      if (sc && base && next !== prev) {
        const w0 = base * prev, w1 = base * next, ratio = sc.scrollHeight ? sc.scrollHeight / (w0 || 1) : 1.3;
        const fx = at ? at.x : (sc.scrollLeft + sc.clientWidth / 2) / (w0 || 1);
        const fy = at ? at.y : (sc.scrollTop + sc.clientHeight / 2) / (w0 * ratio || 1);
        const px = at ? at.x * w0 - sc.scrollLeft : sc.clientWidth / 2, py = at ? at.y * w0 * ratio - sc.scrollTop : sc.clientHeight / 2;
        requestAnimationFrame(() => { sc.scrollLeft = fx * w1 - px; sc.scrollTop = fy * w1 * ratio - py; });
      }
      return next;
    });
  }, [base]);

  const frac = (cx: number, cy: number) => { const r = host.current!.getBoundingClientRect(); return { x: (cx - r.left) / r.width, y: (cy - r.top) / r.height }; };
  // a box shorter than MIN_H grows UPWARD so its bottom (the baseline on the rule) never moves (Enki, plan review)
  const clampBox = (m: Mark): Mark => { const h = Math.min(Math.max(m.h, MIN_H), 1), w = Math.min(Math.max(m.w, MIN_W), 1); const y0 = m.h < MIN_H ? m.y + m.h - h : m.y; return { ...m, w, h, x: Math.min(Math.max(m.x, 0), 1 - w), y: Math.min(Math.max(y0, 0), 1 - h) }; };
  const update = (id: string, patch: Partial<Mark>) => onMarks(marksRef.current.map((m) => (m.id === id ? clampBox({ ...m, ...patch }) : m)));
  const hit = (p: { x: number; y: number }) => [...marksRef.current].reverse().find((m) => m.page === page && p.x >= m.x && p.x <= m.x + m.w && p.y >= m.y && p.y <= m.y + m.h) ?? null;
  // the upper-right handle: within 44 px of the corner (thumb slop, Thoth) AND in the box's upper-right quadrant — a small box
  // (a date line is 10 px tall) is otherwise all handle and can never be moved (plan review, Enki)
  const onHandle = (p: { x: number; y: number }, m: Mark) => { const r = host.current!.getBoundingClientRect(); const hx = (m.x + m.w) - p.x, hy = p.y - m.y; return hx * r.width < 44 && hy * r.height < 44 && hx >= -0.02 && hy >= -0.02 && p.x >= m.x + m.w / 2 && p.y <= m.y + m.h / 2; };

  /** The signature line under the thumb, read from the rendered page's pixels (a scan has no PDF structure). */
  const fitAt = (q: { x: number; y: number }) => {
    try {
      const c = host.current?.querySelector("canvas"); const ctx = c?.getContext("2d", { willReadFrequently: true });
      if (!c || !ctx) return null;
      return fitToUnderline({ width: c.width, height: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data }, q);
    } catch { return null; }
  };
  if (fitRef) fitRef.current = fitAt;
  // Divinity Guide reader gesture: swipe left → next page, swipe right → previous (never from inside a mark)
  const swipe = useRef<{ x: number; y: number; onMark: boolean } | null>(null);
  const pinch = useRef<{ d: number; z: number; at: { x: number; y: number } } | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const dist = (e: React.TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) { const mx = (e.touches[0].clientX + e.touches[1].clientX) / 2, my = (e.touches[0].clientY + e.touches[1].clientY) / 2; pinch.current = { d: dist(e), z: zoom, at: frac(mx, my) }; swipe.current = null; return; }
    const t0 = e.touches[0]; swipe.current = { x: t0.clientX, y: t0.clientY, onMark: !!hit(frac(t0.clientX, t0.clientY)) };
  };
  const onTouchMove = (e: React.TouchEvent) => { const pz = pinch.current; if (pz && e.touches.length === 2) setZoom(pz.z * dist(e) / pz.d, pz.at); };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (pinch.current) { if (e.touches.length < 2) pinch.current = null; swipe.current = null; return; }
    const s0 = swipe.current; swipe.current = null; if (!s0) return;
    const t1 = e.changedTouches[0]; const dx = t1.clientX - s0.x, dy = t1.clientY - s0.y;
    if (Math.hypot(dx, dy) < 12) {                                              // a tap: two within 350 ms toggle 1× ↔ 2.5× under the finger
      const now = Date.now(), lt = lastTap.current; lastTap.current = { t: now, x: t1.clientX, y: t1.clientY };
      if (lt && now - lt.t < 350 && Math.hypot(t1.clientX - lt.x, t1.clientY - lt.y) < 30 && !s0.onMark) { setZoom(zoom > 1 ? 1 : 2.5, frac(t1.clientX, t1.clientY)); lastTap.current = null; }
      return;
    }
    if (s0.onMark || zoom > 1) return;                                          // zoomed: a horizontal swipe scrolls, it does not turn the page
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && page < pages) setPage((p) => p + 1); else if (dx > 0 && page > 1) setPage((p) => p - 1);
  };
  /** ⌖ — the selected mark onto the rule under it: a signature takes the rule's box; a text keeps its height, centred on the line. */
  const snapSelected = () => {
    const m = marksRef.current.find((k) => k.id === selectedId); if (!m || readOnly) return;
    // the rule the box sits on or the next one under it — never the text line above (a moved date snapped up to the
    // printed name until this looked downward first): probe the bottom, then one and two box-heights below, and keep
    // the first line at or under the box's middle; only then any line at all
    const cx = m.x + m.w / 2, mid = m.y + m.h / 2;
    let fit: ReturnType<typeof fitAt> = null;
    for (const dy of [0, m.h, 2 * m.h]) { const f = fitAt({ x: cx, y: Math.min(1, m.y + m.h + dy) }); if (f && f.lineY >= mid) { fit = f; break; } }
    fit = fit ?? fitAt({ x: cx, y: m.y + m.h }) ?? fitAt({ x: cx, y: mid }); if (!fit) return;
    if (m.kind === "sig") update(m.id, { x: fit.x, y: fit.y, w: fit.w, h: fit.h, fit: "underline" });
    else update(m.id, { x: fit.x + Math.max(0, (fit.w - m.w) / 2), y: fit.y + fit.h - m.h, fit: "underline" });
  };
  const onKey = (e: React.KeyboardEvent) => {
    const m = marksRef.current.find((k) => k.id === selectedId); if (!m || readOnly) return;
    const step = 0.0025; const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const v = d[e.key]; if (!v) return; e.preventDefault(); update(m.id, { x: m.x + v[0], y: m.y + v[1] });
  };
  const onDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    const p = frac(e.clientX, e.clientY);
    const m = hit(p);
    const resizing = !!(m && onHandle(p, m));
    const start = { x: e.clientX, y: e.clientY }; let moved = false;
    const off = m ? { dx: p.x - m.x, dy: p.y - m.y } : null;
    if (m) { onSelect(m.id); try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* not capturable */ } }
    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) moved = true;
      if (!m) return;
      ev.preventDefault();
      const q = frac(ev.clientX, ev.clientY);
      // the upper-right handle: width follows the finger, the TOP edge follows the finger, the bottom (baseline) stays
      if (resizing) { const bottom = m.y + m.h; const h = Math.max(MIN_H, bottom - q.y); update(m.id, { w: Math.max(MIN_W, q.x - m.x), h, y: bottom - h }); }
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
        <span className="whitespace-nowrap tabular-nums">{page} / {pages || "…"}</span>
        <div className="flex items-center gap-1" data-testid="zoom-bar">
          <button type="button" disabled={zoom <= 1} onClick={() => setZoom(zoom / 1.5)} className="min-h-[44px] min-w-[44px] rounded-md border border-border disabled:opacity-40" aria-label={t("soi.sign.zoom_out")} data-testid="zoom-out">−</button>
          <button type="button" onClick={() => setZoom(1)} className="min-h-[44px] rounded-md border border-border px-2 tabular-nums" aria-label={t("soi.sign.zoom_reset")} data-testid="zoom-reset">{Math.round(zoom * 100)}%</button>
          <button type="button" disabled={zoom >= 4} onClick={() => setZoom(zoom * 1.5)} className="min-h-[44px] min-w-[44px] rounded-md border border-border disabled:opacity-40" aria-label={t("soi.sign.zoom_in")} data-testid="zoom-in">+</button>
          {!readOnly && <button type="button" disabled={!selectedId} onClick={snapSelected} className="min-h-[44px] min-w-[44px] rounded-md border border-primary/60 text-primary disabled:opacity-40" aria-label={t("soi.sign.snap_line")} title={t("soi.sign.snap_line")} data-testid="snap-line">⌖</button>}
        </div>
        <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="min-h-[44px] rounded-md border border-border px-3 disabled:opacity-40" aria-label={t("soi.sign.page_next")} data-testid="page-next">›</button>
      </div>
      <div ref={scroller} className="w-full max-h-[72vh] overflow-auto rounded-md border border-border" style={{ touchAction: readOnly ? "auto" : zoom > 1 ? "pan-x pan-y" : "pan-y" }} data-testid="pdf-scroller" data-zoom={zoom}>
      <div ref={host} tabIndex={readOnly ? -1 : 0} className="relative select-none overflow-hidden bg-white outline-none" style={{ width: base ? `${Math.round(base * zoom)}px` : "100%" }} onPointerDown={onDown} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onKeyDown={onKey} data-testid="pdf-page">
        {marks.filter((m) => m.page === page).map((m) => {
          const sel = m.id === selectedId;
          return (
            <div key={m.id} draggable={false} onDragStart={(e) => e.preventDefault()} onContextMenu={(e) => e.preventDefault()} className={`absolute rounded ${sel ? "border-[3px] border-primary shadow-[0_0_0_2px_rgba(0,0,0,.35)]" : "border-2 border-primary/50"} ${m.kind === "sig" ? (sel ? "bg-primary/15" : "border-dashed bg-primary/10") : (sel ? "bg-amber-300/20" : m.fit === "stamped" ? "border-solid border-amber-500/80 bg-amber-300/10" : "border-dotted bg-amber-300/10")}`}
              style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, width: `${m.w * 100}%`, height: `${m.h * 100}%`, containerType: "size", touchAction: "none" }} data-testid={m.kind === "sig" ? "sig-box" : "text-box"} data-fit={m.fit}>
              {m.kind === "sig" && preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="" draggable={false} className={`pointer-events-none h-full w-full select-none object-contain ${m.fit === "underline" ? "object-left" : ""}`} />}
              {m.kind === "text" && <span className="block h-full w-full overflow-hidden whitespace-nowrap px-0.5 text-neutral-900" style={{ fontSize: "72cqh", lineHeight: 1.35 }}>{m.text}</span>}
              {sel && !readOnly && <span className="absolute -top-2.5 -end-2.5 h-6 w-6 rounded-md border-2 border-white bg-primary shadow" aria-hidden="true" data-testid="resize-handle" />}
              {/* no delete badge ON the box — it covered the text (operator 02:00); the red Delete sits in the toolbar under the page */}
            </div>
          );
        })}
        {err && <p className="p-3 text-xs text-red-500">{err}</p>}
      </div>
      </div>
      {!readOnly && <p className="mt-1 text-[11px] text-muted-foreground">{sigHere ? t("soi.sign.place_move") : t("soi.sign.place_hint")} {t("soi.sign.zoom_hint")}</p>}
    </div>
  );
}
