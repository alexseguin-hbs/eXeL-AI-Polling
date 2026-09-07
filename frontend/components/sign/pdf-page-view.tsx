"use client";

/**
 * One PDF, one page at a time, rendered by pdfjs to a canvas that fits the phone. A tap places the
 * signature box (40% × 8% of the page); a drag moves it. The box is kept as page FRACTIONS so
 * pdf-stamp lands it on the real page. Page arrows step through the document.
 */
import { useEffect, useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { openPdf, renderPage } from "@/lib/pdf-render";
import type { StampBox } from "@/lib/pdf-stamp";

const BOX_W = 0.4, BOX_H = 0.08;

export function PdfPageView({ bytes, box, onBox, preview, readOnly }: {
  bytes: Uint8Array; box: StampBox | null; onBox: (b: StampBox) => void; preview?: string | null; readOnly?: boolean;
}) {
  const { t } = useLexicon();
  const host = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [err, setErr] = useState("");
  const docRef = useRef<Awaited<ReturnType<typeof openPdf>> | null>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const doc = await openPdf(bytes); if (!live) return;
        docRef.current = doc; setPages(doc.numPages); setPage(1);
      } catch (e) { setErr(String((e as Error).message || e)); }
    })();
    return () => { live = false; };
  }, [bytes]);

  useEffect(() => {
    let live = true;
    (async () => {
      const doc = docRef.current, el = host.current; if (!doc || !el) return;
      const width = Math.min(el.clientWidth || 343, 640);
      try {
        const r = await renderPage(doc, page, width); if (!live) return;
        el.querySelectorAll("canvas").forEach((c) => c.remove());
        el.insertBefore(r.canvas, el.firstChild);
      } catch (e) { setErr(String((e as Error).message || e)); }
    })();
    return () => { live = false; };
  }, [page, pages]);

  const frac = (e: React.PointerEvent) => {
    const r = host.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const clamp = (x: number, y: number): StampBox => ({ page, x: Math.min(Math.max(x, 0), 1 - BOX_W), y: Math.min(Math.max(y, 0), 1 - BOX_H), w: BOX_W, h: BOX_H });

  const onDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    const p = frac(e);
    const inside = box && box.page === page && p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
    drag.current = inside ? { dx: p.x - box!.x, dy: p.y - box!.y } : { dx: BOX_W / 2, dy: BOX_H / 2 };
    onBox(clamp(p.x - drag.current.dx, p.y - drag.current.dy));
    const move = (ev: PointerEvent) => {
      const r = host.current!.getBoundingClientRect(); const x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
      onBox(clamp(x - drag.current!.dx, y - drag.current!.dy));
    };
    const up = () => { drag.current = null; document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="min-h-[44px] rounded-md border border-border px-3 disabled:opacity-40">‹</button>
        <span>{t("soi.sign.page")} {page} / {pages || "…"}</span>
        <button type="button" disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="min-h-[44px] rounded-md border border-border px-3 disabled:opacity-40">›</button>
      </div>
      <div ref={host} className="relative w-full select-none overflow-hidden rounded-md border border-border bg-white" style={{ touchAction: readOnly ? "auto" : "none" }} onPointerDown={onDown} data-testid="pdf-page">
        {box && box.page === page && (
          <div className="pointer-events-none absolute rounded border-2 border-dashed border-cyan-500 bg-cyan-400/10" style={{ left: `${box.x * 100}%`, top: `${box.y * 100}%`, width: `${box.w * 100}%`, height: `${box.h * 100}%` }} data-testid="sig-box">
            {preview && /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview} alt="" className="h-full w-full object-contain" />}
          </div>
        )}
        {err && <p className="p-3 text-xs text-red-500">{err}</p>}
      </div>
      {!readOnly && <p className="mt-1 text-[11px] text-muted-foreground">{box && box.page === page ? t("soi.sign.place_move") : t("soi.sign.place_hint")}</p>}
    </div>
  );
}
