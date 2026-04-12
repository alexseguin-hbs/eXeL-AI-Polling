"use client";

/**
 * /divinity-guide-trinity — SoI Trinity Review Page
 *
 * Displays 4 Trinity variations from The Divinity Guide:
 *   1. H.I. / A.I. / S.I. — The Core Trinity
 *   2. Leadership / Integration / Adaptation
 *   3. Wisdom / Connection / Harmony
 *   4. Love / Loss / Safety
 */

import { SoITrinity } from "@/components/soi-trinity";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

const TRINITIES: {
  labels: [string, string, string];
  title: string;
  subtitle: string;
}[] = [
  {
    labels: ["H.I.", "A.I.", "S.I."],
    title: "The Core Trinity",
    subtitle: "Human Intelligence, Artificial Intelligence, Shared Intent",
  },
  {
    labels: ["LEADERSHIP", "INTEGRATION", "ADAPTATION"],
    title: "The Governance Trinity",
    subtitle: "Lead with purpose, integrate with care, adapt with wisdom",
  },
  {
    labels: ["WISDOM", "CONNECTION", "HARMONY"],
    title: "The Consciousness Trinity",
    subtitle: "Know deeply, connect truly, harmonize fully",
  },
  {
    labels: ["LOVE", "LOSS", "SAFETY"],
    title: "The Human Trinity",
    subtitle: "Love without condition, grieve without shame, protect without fear",
  },
];

export default function DivinityGuideTrinityPage() {
  const { currentTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <Link
          href="/divinity-guide"
          className="flex items-center gap-2 hover:opacity-80"
        >
          <span
            className="text-sm font-bold"
            style={{ color: currentTheme.swatch }}
          >
            eXeL
          </span>
          <span
            className="text-sm font-light"
            style={{ color: currentTheme.swatch, opacity: 0.7 }}
          >
            AI
          </span>
          <span className="text-xs text-muted-foreground ml-2">
            / Divinity Guide / Trinity
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-primary"
        >
          Home
        </Link>
      </div>

      {/* Title */}
      <div className="text-center pt-8 pb-4 px-6">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: currentTheme.swatch }}
        >
          The SoI Trinity
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Three overlapping circles. Three intelligences. One shared intention.
          Every combination reveals a different facet of wholeness.
        </p>
      </div>

      {/* 4 Trinity Variations — 2×2 grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6 pb-12">
        {TRINITIES.map((trinity, i) => (
          <div
            key={i}
            className="flex flex-col items-center rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow"
          >
            <SoITrinity
              labels={trinity.labels}
              size={280}
              color={currentTheme.swatch}
              textColor="white"
              ringWidth={14}
            />
            <h2 className="text-lg font-semibold mt-4">{trinity.title}</h2>
            <p className="text-xs text-muted-foreground text-center mt-1 max-w-xs">
              {trinity.subtitle}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pb-8">
        <p className="text-[9px] text-muted-foreground/40">
          From The Divinity Guide: The Return to Wholeness and Living Divinity
        </p>
        <p className="text-[9px] text-muted-foreground/40 mt-1 italic">
          Where Shared Intention moves at the Speed of Thought
        </p>
      </div>
    </div>
  );
}
