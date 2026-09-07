"use client";

/**
 * The Light Codex 2×2 strip for a signatory row: "NAME YYYYMMDDHHMMSS" written as a Double-Helix
 * pixel signature (lib/light-codex, block size 2, style "2") onto a small white canvas, returned as
 * a PNG data URL for pdf-stamp's signatory block. Characters the codex alphabet lacks are dropped.
 */
import { placeSignature, unsupportedChars } from "@/lib/light-codex";

export function codexText(name: string, isoDate: string): string {
  const d = new Date(isoDate); const p = (n: number) => String(n).padStart(2, "0");
  const raw = `${name.toUpperCase()} ${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}`;
  const bad = new Set(unsupportedChars(raw));
  return Array.from(raw).filter((c) => !bad.has(c)).join("").slice(0, 40);
}

export function codexStripPng(text: string): string | undefined {
  try {
    const blocks = text.length * 4 + 16;                 // 4 blocks per char + framing, generous
    const w = blocks * 3 + 6, h = 12;                    // block 2 + gap 1 → 3 px per block
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true }); if (!ctx) return undefined;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
    const out = placeSignature(ctx.getImageData(0, 0, w, h), text, 2, "2");
    ctx.putImageData(out, 0, 0);
    return c.toDataURL("image/png");
  } catch { return undefined; }
}
