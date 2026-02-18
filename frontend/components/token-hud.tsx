"use client";

import { useEffect, useState, useRef } from "react";
import { useTimer } from "@/lib/timer-context";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function AnimatedNumber({ value, color }: { value: string | number; color: string }) {
  const [flash, setFlash] = useState(false);
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      setFlash(true);
      prevRef.current = value;
      const t = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(t);
    }
  }, [value]);

  return (
    <span
      className="transition-all duration-300"
      style={{
        color,
        textShadow: flash ? `0 0 8px ${color}40` : "none",
        transform: flash ? "scale(1.15)" : "scale(1)",
        display: "inline-block",
      }}
    >
      {value}
    </span>
  );
}

function FloatUp({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <span
      className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs font-bold pointer-events-none"
      style={{
        animation: "float-up 0.8s ease-out forwards",
        color: "#22C55E",
      }}
    >
      +1
    </span>
  );
}

export function TokenHUD() {
  const { elapsed, isRunning, tokens, lastEarnAt } = useTimer();
  const [showFloat, setShowFloat] = useState(false);

  useEffect(() => {
    if (lastEarnAt > 0) {
      setShowFloat(true);
      const t = setTimeout(() => setShowFloat(false), 800);
      return () => clearTimeout(t);
    }
  }, [lastEarnAt]);

  // Don't render if timer hasn't been started and no tokens beyond default
  if (!isRunning && elapsed === 0 && tokens.hearts <= 1) return null;

  return (
    <>
      {/* CSS for float-up animation */}
      <style jsx global>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateX(-50%) translateY(0); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-16px); }
        }
      `}</style>

      <div className="flex items-center gap-1.5">
        {/* Timer pill */}
        {isRunning && (
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-foreground">
              {formatTime(elapsed)}
            </span>
          </div>
        )}

        {/* ◬ Unity pill */}
        <div className="relative flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
          <span className="text-xs font-bold" style={{ color: "#00D7E4" }}>◬</span>
          <AnimatedNumber value={tokens.unity} color="#00D7E4" />
          <FloatUp visible={showFloat} />
        </div>

        {/* ♡ Hearts pill */}
        <div className="relative flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
          <span className="text-xs font-bold" style={{ color: "#D3B20F" }}>♡</span>
          <AnimatedNumber value={tokens.hearts} color="#D3B20F" />
        </div>

        {/* 웃 Human pill */}
        <div className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1">
          <span className="text-xs font-bold" style={{ color: "#8D516F" }}>웃</span>
          <AnimatedNumber value={`$${tokens.human.toFixed(2)}`} color="#8D516F" />
        </div>
      </div>
    </>
  );
}
