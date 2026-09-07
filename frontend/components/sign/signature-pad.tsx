"use client";

/**
 * Signature pad — draw with a finger or mouse, or upload a PNG. Pointer events with document-level
 * move/up/cancel cleanup (the touch-freeze fix from mission-planning.tsx); `touch-action: none` so
 * the page does not scroll under the stroke. Emits a transparent PNG data URL, or null when empty.
 */
import { useEffect, useRef, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { signedDataURL } from "@/lib/image-library";

export function SignaturePad({ onChange, height = 160 }: { onChange: (png: string | null) => void; height?: number }) {
  const { t } = useLexicon();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [empty, setEmpty] = useState(true);
  const [uploaded, setUploaded] = useState<string | null>(null);

  const setup = () => {
    const c = canvasRef.current; if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const w = c.clientWidth || 300;
    c.width = Math.round(w * dpr); c.height = Math.round(height * dpr);
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.scale(dpr, dpr); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#0b1a2a";
  };
  useEffect(() => { setup(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const pos = (e: PointerEvent | React.PointerEvent) => {
    const c = canvasRef.current!; const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  // Export the ink's bounding box (+ margin), not the whole pad: stamped into a wide signature line, a full-pad
  // PNG shrank the stroke to a third of its size (seen in the rendered proof, wave 5). Falls back to the pad.
  const emit = () => {
    const c = canvasRef.current; if (!c) return;
    try {
      const ctx = c.getContext("2d")!; const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let i = 3; i < d.length; i += 4) if (d[i] > 30) { const px = (i >> 2) % c.width, py = Math.floor((i >> 2) / c.width); if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; }
      if (x1 < 0) { onChange(c.toDataURL("image/png")); return; }
      const m = Math.round(6 * Math.min(window.devicePixelRatio || 1, 3));
      x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(c.width - 1, x1 + m); y1 = Math.min(c.height - 1, y1 + m);
      const o = document.createElement("canvas"); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1;
      o.getContext("2d")!.drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
      onChange(o.toDataURL("image/png"));
    } catch { onChange(c.toDataURL("image/png")); }
  };

  const onDown = (e: React.PointerEvent) => {
    if (uploaded) return;
    e.preventDefault(); drawing.current = true; last.current = pos(e);
    const move = (ev: PointerEvent) => {
      if (!drawing.current) return;
      const c = canvasRef.current; const ctx = c?.getContext("2d"); if (!c || !ctx || !last.current) return;
      const p = pos(ev); ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last.current = p;
      if (empty) setEmpty(false);
    };
    const up = () => { drawing.current = false; last.current = null; document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up); emit(); };
    document.addEventListener("pointermove", move); document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
    // a tap without movement still leaves a dot
    const ctx = canvasRef.current?.getContext("2d"); if (ctx) { const p = last.current; ctx.beginPath(); ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2); ctx.fillStyle = "#0b1a2a"; ctx.fill(); setEmpty(false); }
  };

  const clear = () => {
    const c = canvasRef.current; const ctx = c?.getContext("2d"); if (c && ctx) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height); ctx.restore(); }
    setEmpty(true); setUploaded(null); onChange(null);
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    // Bound the image before it is decoded into a canvas: a 30,000 × 30,000 PNG is a tab-sized
    // allocation (Thor, wave 3). 4 MB on disk, 4,096 px a side.
    if (f.size > 4 * 1024 * 1024) return;
    const dims = await new Promise<{ w: number; h: number } | null>((res) => { const im = new Image(); im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight }); im.onerror = () => res(null); im.src = URL.createObjectURL(f); });
    if (!dims || dims.w > 4096 || dims.h > 4096) return;
    const url = await signedDataURL(f, "exel-sign");
    if (!url) return;
    setUploaded(url); setEmpty(false); onChange(url);
  };

  return (
    <div>
      <div className="relative rounded-md border border-border bg-white" style={{ height }}>
        {uploaded ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={uploaded} alt="" className="h-full w-full object-contain" />
        ) : (
          <canvas ref={canvasRef} className="h-full w-full touch-none" style={{ touchAction: "none" }} onPointerDown={onDown} aria-label={t("soi.sign.draw")} />
        )}
        {empty && <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-xs text-neutral-400">{t("soi.sign.draw_hint")}</span>}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={clear} className="min-h-[44px] rounded-md border border-border px-3 text-sm">{t("soi.sign.clear")}</button>
        <label className="flex min-h-[44px] cursor-pointer items-center rounded-md border border-border px-3 text-sm">
          {t("soi.sign.upload_png")}
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}
