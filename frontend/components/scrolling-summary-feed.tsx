"use client";

import { useEffect, useRef, useState } from "react";

interface FeedItem {
  summary33: string;
  userHash: string;
}

interface ScrollingSummaryFeedProps {
  responses: FeedItem[];
  height?: number;
}

export function ScrollingSummaryFeed({
  responses,
  height = 200,
}: ScrollingSummaryFeedProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<(FeedItem & { key: number })[]>([]);
  const counterRef = useRef(0);

  useEffect(() => {
    if (responses.length === 0) return;

    // Seed initial items
    const initial = responses.slice(0, 3).map((r, i) => ({
      ...r,
      key: i,
    }));
    counterRef.current = initial.length;
    setVisibleItems(initial);

    const interval = setInterval(() => {
      const idx = counterRef.current % responses.length;
      const newItem = { ...responses[idx], key: counterRef.current };
      counterRef.current++;

      setVisibleItems((prev) => {
        const next = [...prev, newItem];
        // Keep max 8 items visible — only slice when exceeding limit
        return next.length > 8 ? next.slice(-8) : next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [responses]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{ height }}
    >
      <div className="absolute inset-0 flex flex-col justify-end px-4 pb-2 gap-1">
        {visibleItems.map((item, i) => {
          const isNewest = i === visibleItems.length - 1;
          return (
            <div
              key={item.key}
              className="text-sm leading-snug transition-all duration-500"
              style={{
                animation: isNewest ? "feed-slide-in 0.5s ease-out" : undefined,
                opacity: Math.max(0.3, (i + 1) / visibleItems.length),
              }}
            >
              <span className="font-mono text-xs text-primary/60 mr-2">
                {item.userHash}
              </span>
              <span className="text-muted-foreground">{item.summary33}</span>
            </div>
          );
        })}
      </div>
      {/* Fade gradient at top */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-8"
        style={{
          background:
            "linear-gradient(to bottom, hsl(var(--card)), transparent)",
        }}
      />
      <style jsx global>{`
        @keyframes feed-slide-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
