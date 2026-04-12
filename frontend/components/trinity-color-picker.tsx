"use client";

import { useState, useCallback } from "react";

// ─── Color conversion helpers ────────────────────────────────────

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// ─── Preset palette (matches existing 8 + expanded) ─────────────

const GRID_COLORS = [
  // Row 1: Rainbow core
  "#FF0000", "#FF6D00", "#FFDA00", "#48FF00", "#00FF24", "#00FF91",
  "#00FFFF", "#007FFF", "#0000FF", "#7F00FF", "#FF00FF", "#FF1493",
  // Row 2: Pastels & neutrals
  "#FF6B6B", "#FFA07A", "#FFD93D", "#90EE90", "#87CEEB", "#DDA0DD",
  "#F5F5DC", "#D2B48C", "#808080", "#333333", "#FFFFFF", "#000000",
];

type PickerMode = "grid" | "spectrum" | "sliders";

interface TrinityColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
}

export function TrinityColorPicker({ value, onChange }: TrinityColorPickerProps) {
  const [mode, setMode] = useState<PickerMode>("grid");
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(value));

  const updateFromHsl = useCallback((h: number, s: number, l: number) => {
    setHsl([h, s, l]);
    onChange(hslToHex(h, s, l));
  }, [onChange]);

  const handleExternalChange = useCallback((hex: string) => {
    setHsl(hexToHsl(hex));
    onChange(hex);
  }, [onChange]);

  const modes: { key: PickerMode; label: string }[] = [
    { key: "grid", label: "Grid" },
    { key: "spectrum", label: "Spectrum" },
    { key: "sliders", label: "Sliders" },
  ];

  return (
    <div className="w-full space-y-2">
      {/* Mode tabs */}
      <div className="flex rounded-md border overflow-hidden text-[10px]">
        {modes.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={`flex-1 py-1 transition-colors ${
              mode === m.key
                ? "bg-primary text-primary-foreground font-medium"
                : "bg-muted/30 text-muted-foreground hover:bg-accent"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Grid mode — preset swatches */}
      {mode === "grid" && (
        <div className="grid grid-cols-6 gap-1.5">
          {GRID_COLORS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => handleExternalChange(hex)}
              className={`w-full aspect-square rounded-md border-2 transition-all ${
                value.toUpperCase() === hex.toUpperCase()
                  ? "border-white scale-110 ring-1 ring-primary"
                  : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: hex }}
              title={hex}
            />
          ))}
        </div>
      )}

      {/* Spectrum mode — 2D hue/lightness gradient with click */}
      {mode === "spectrum" && (
        <div className="space-y-2">
          {/* Hue × Lightness canvas */}
          <div
            className="relative w-full h-32 rounded-md cursor-crosshair overflow-hidden border"
            style={{
              background: `linear-gradient(to bottom, #fff, transparent, #000),
                           linear-gradient(to right,
                             hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%),
                             hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))`,
            }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
              const h = Math.round(x * 360);
              const l = Math.round((1 - y) * 100);
              updateFromHsl(h, hsl[1], l);
            }}
          >
            {/* Crosshair indicator */}
            <div
              className="absolute w-3 h-3 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(hsl[0] / 360) * 100}%`,
                top: `${(1 - hsl[2] / 100) * 100}%`,
                backgroundColor: value,
              }}
            />
          </div>
          {/* Saturation slider */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-5">S</span>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl[1]}
              onChange={(e) => updateFromHsl(hsl[0], Number(e.target.value), hsl[2])}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${hsl[0]},0%,${hsl[2]}%), hsl(${hsl[0]},100%,${hsl[2]}%))`,
              }}
            />
            <span className="text-[9px] text-muted-foreground w-6 text-right">{hsl[1]}%</span>
          </div>
        </div>
      )}

      {/* Sliders mode — H, S, L individual sliders */}
      {mode === "sliders" && (
        <div className="space-y-2">
          {/* Hue */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-5">H</span>
            <input
              type="range"
              min={0}
              max={360}
              value={hsl[0]}
              onChange={(e) => updateFromHsl(Number(e.target.value), hsl[1], hsl[2])}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: "linear-gradient(to right, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))",
              }}
            />
            <span className="text-[9px] text-muted-foreground w-6 text-right">{hsl[0]}°</span>
          </div>
          {/* Saturation */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-5">S</span>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl[1]}
              onChange={(e) => updateFromHsl(hsl[0], Number(e.target.value), hsl[2])}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${hsl[0]},0%,${hsl[2]}%), hsl(${hsl[0]},100%,${hsl[2]}%))`,
              }}
            />
            <span className="text-[9px] text-muted-foreground w-6 text-right">{hsl[1]}%</span>
          </div>
          {/* Lightness */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground w-5">L</span>
            <input
              type="range"
              min={0}
              max={100}
              value={hsl[2]}
              onChange={(e) => updateFromHsl(hsl[0], hsl[1], Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(${hsl[0]},${hsl[1]}%,0%), hsl(${hsl[0]},${hsl[1]}%,50%), hsl(${hsl[0]},${hsl[1]}%,100%))`,
              }}
            />
            <span className="text-[9px] text-muted-foreground w-6 text-right">{hsl[2]}%</span>
          </div>
        </div>
      )}

      {/* Current color preview + hex */}
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-md border"
          style={{ backgroundColor: value }}
        />
        <span className="text-[10px] font-mono text-muted-foreground">{value.toUpperCase()}</span>
      </div>
    </div>
  );
}
