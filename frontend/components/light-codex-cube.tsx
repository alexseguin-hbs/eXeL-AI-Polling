"use client";

/**
 * Light Codex Cube — transmit short messages in plain sight inside shared images.
 *
 * An unlocked feature (Easter-egg gated) that runs the Light Codex flow in the
 * browser: Encode writes a Double-Helix pixel signature onto an uploaded image
 * and downloads the signed PNG; Decode reads it back with reverse verification.
 * This is the carrier for Clearance Level 7 messages — the code is passed one
 * way, the image another.
 *
 * Engine: lib/light-codex.ts (faithful port of the reference Python).
 */

import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Download, ScanLine, PenLine, Check, AlertTriangle } from "lucide-react";
import {
  placeSignature, decodeImage, unsupportedChars, STYLE_LABEL,
  type Style, type BlockSize, type DecodeResult,
} from "@/lib/light-codex";
import { useEasterEgg } from "@/lib/easter-egg-context";

// File → ImageData (via an offscreen canvas).
async function fileToImageData(file: File): Promise<ImageData> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read image"));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function imageDataToCanvas(d: ImageData): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = d.width;
  canvas.height = d.height;
  canvas.getContext("2d")!.putImageData(d, 0, 0);
  return canvas;
}

type Mode = "encode" | "decode";

export function LightCodexCube({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("encode");

  // Encode state
  const [signature, setSignature] = useState("");
  const [style, setStyle] = useState<Style>("2");
  const [blockSize, setBlockSize] = useState<BlockSize>(2);
  const [srcName, setSrcName] = useState<string | null>(null);
  const [srcData, setSrcData] = useState<ImageData | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Decode state
  const [decoded, setDecoded] = useState<DecodeResult | null | "none">(null);
  const [decodeName, setDecodeName] = useState<string | null>(null);

  const bad = unsupportedChars(signature);
  const effBlock: BlockSize = style === "3" ? 1 : blockSize;

  const loadSource = useCallback(async (file: File) => {
    setErr(null);
    try {
      const d = await fileToImageData(file);
      setSrcData(d);
      setSrcName(file.name);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read image");
    }
  }, []);

  const signAndDownload = async () => {
    if (!srcData || !signature.trim() || bad.length) return;
    setBusy(true);
    setErr(null);
    try {
      const signed = placeSignature(srcData, signature.trim(), effBlock, style);
      const canvas = imageDataToCanvas(signed);
      // Show the signed preview.
      if (previewRef.current) {
        previewRef.current.innerHTML = "";
        canvas.className = "max-h-[42vh] w-auto max-w-full rounded-lg border border-border";
        previewRef.current.appendChild(canvas.cloneNode(true) as HTMLCanvasElement);
      }
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const base = (srcName ?? "image").replace(/\.[^.]+$/, "");
      a.href = url;
      a.download = `${base}_light_codex_${STYLE_LABEL[style].replace(/ /g, "_").toLowerCase()}_${effBlock}x${effBlock}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Encoding failed");
    } finally {
      setBusy(false);
    }
  };

  const runDecode = async (file: File) => {
    setDecoded(null);
    setDecodeName(file.name);
    setErr(null);
    try {
      const d = await fileToImageData(file);
      const result = decodeImage(d);
      setDecoded(result ?? "none");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not read image");
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-background/98 backdrop-blur-md flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-border p-2 text-primary"><ScanLine className="h-4 w-4" /></div>
          <div>
            <h2 className="text-lg font-semibold">Light Codex</h2>
            <p className="text-[11px] text-muted-foreground">Transmit short messages in plain sight — inside a shared image</p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-accent/50"><X className="h-5 w-5" /></button>
      </div>

      {/* Mode tabs */}
      <div className="flex justify-center gap-2 border-b px-4 py-3">
        {([["encode", "Encode", PenLine], ["decode", "Decode", ScanLine]] as const).map(([id, label, Icon]) => (
          <button key={id} onClick={() => { setMode(id); setErr(null); }}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
              mode === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
        {err && (
          <div className="mx-auto mb-4 flex max-w-lg items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {err}
          </div>
        )}

        {mode === "encode" ? (
          <div className="mx-auto max-w-lg space-y-4">
            {/* Signature */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Digital signature / message</label>
              <input value={signature} onChange={(e) => setSignature(e.target.value)}
                placeholder="Enter message here"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm" />
              <p className="mt-1 text-[10px] text-muted-foreground">A–Z, digits, space, period. {signature.length} chars.</p>
              {bad.length > 0 && (
                <p className="mt-1 text-[10px] text-destructive">Unsupported: {Array.from(new Set(bad)).map((c) => JSON.stringify(c)).join(" ")}</p>
              )}
            </div>

            {/* Style */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">Signature type</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["1", "2", "3"] as Style[]).map((s) => (
                  <button key={s} onClick={() => setStyle(s)}
                    className="rounded-md border p-2 text-center transition-all"
                    style={{ borderColor: style === s ? "hsl(var(--primary))" : "hsl(215 15% 25%)", background: style === s ? "hsl(var(--primary) / 0.12)" : "transparent" }}>
                    <div className="text-xs font-semibold">{STYLE_LABEL[s]}</div>
                    <div className="text-[9px] text-muted-foreground">
                      {s === "1" ? "bottom, reversed" : s === "2" ? "top + bottom" : "hidden 1px"}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Block size */}
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted-foreground">
                Pixel block size {style === "3" && <span className="opacity-60">(Hidden = 1×1)</span>}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {([1, 2, 4] as BlockSize[]).map((b) => (
                  <button key={b} disabled={style === "3"} onClick={() => setBlockSize(b)}
                    className="rounded-md border p-2 text-xs font-semibold transition-all disabled:opacity-30"
                    style={{ borderColor: effBlock === b ? "hsl(var(--primary))" : "hsl(215 15% 25%)", background: effBlock === b ? "hsl(var(--primary) / 0.12)" : "transparent" }}>
                    {b}×{b}
                  </button>
                ))}
              </div>
            </div>

            {/* Image picker */}
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-6 text-sm text-muted-foreground hover:bg-accent/30">
              <Upload className="h-5 w-5" />
              {srcName ? <span className="text-foreground">{srcName} — {srcData?.width}×{srcData?.height}</span> : <span>Choose an image (PNG recommended)</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) loadSource(f); }} />
            </label>

            <button onClick={signAndDownload} disabled={busy || !srcData || !signature.trim() || bad.length > 0}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40">
              <Download className="h-4 w-4" /> {busy ? "Signing…" : "Sign & download PNG"}
            </button>
            <p className="text-center text-[10px] text-muted-foreground/70">Keep it PNG — JPEG shifts colors and breaks decoding.</p>
            <div ref={previewRef} className="flex justify-center" />
          </div>
        ) : (
          <div className="mx-auto max-w-lg space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-6 text-sm text-muted-foreground hover:bg-accent/30">
              <Upload className="h-5 w-5" />
              {decodeName ? <span className="text-foreground">{decodeName}</span> : <span>Choose a signed image to read</span>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) runDecode(f); }} />
            </label>

            {decoded === "none" && (
              <div className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                No Light Codex signature detected. Decoding needs a lossless (PNG) copy.
              </div>
            )}
            {decoded && decoded !== "none" && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {decoded.verified && <Check className="h-4 w-4 text-green-500" />}
                  {decoded.style} · {decoded.blockSize}×{decoded.blockSize}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Message</div>
                  <div className="mt-0.5 break-words font-mono text-lg text-foreground">{decoded.messageForward}</div>
                </div>
                <div className="border-t border-border/50 pt-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Reverse verification</div>
                  <div className="mt-0.5 break-words font-mono text-xs text-muted-foreground">{decoded.messageReverseVerify}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Gated Settings row (only visible once the Easter-egg is unlocked) ─────────
export function LightCodexSettingsRow() {
  const { easterEggUnlocked } = useEasterEgg();
  const [open, setOpen] = useState(false);
  if (!easterEggUnlocked) return null;

  return (
    <section>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
      >
        <div className="flex items-center gap-3">
          <ScanLine className="h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm font-semibold text-foreground">Light Codex</div>
        </div>
        <span className="text-xs text-muted-foreground">Unlocked</span>
      </button>
      {open && typeof document !== "undefined" &&
        createPortal(<LightCodexCube onClose={() => setOpen(false)} />, document.body)}
    </section>
  );
}
