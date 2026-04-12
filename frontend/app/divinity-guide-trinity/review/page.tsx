"use client";

/**
 * /divinity-guide-trinity/review — 12 Trinity examples
 *
 * Uses the reusable <SoITrinity> component with different words and colors.
 * Circle geometry is LOCKED. Only words, colors, and text styling vary.
 *
 * Draw order: Son → Aset → Asar → Unity → Words LAST
 * Text at 0° (12), 120° (4), 240° (8) o'clock — centered in ring band.
 */

import { SoITrinity } from "@/components/soi-trinity";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

// Most important word at TOP for each trinity
const EXAMPLES: {
  labels: [string, string, string];
  color: string;
  title: string;
}[] = [
  { labels: ["WISDOM", "HARMONY", "CONNECTION"], color: "#10B981", title: "Consciousness" },
  { labels: ["LEADERSHIP", "ADAPTATION", "INTEGRATION"], color: "#F59E0B", title: "Governance" },
  { labels: ["LOVE", "SAFETY", "LOSS"], color: "#EF4444", title: "Human" },
  { labels: ["ACTION", "FEELING", "THOUGHT"], color: "#6366F1", title: "Intelligence" },
  { labels: ["H.I.", "S.I.", "A.I."], color: "#3B82F6", title: "Core Trinity" },
  { labels: ["TRUTH", "BEAUTY", "GOODNESS"], color: "#14B8A6", title: "Platonic" },
  { labels: ["TRANSFORM", "CREATE", "SUSTAIN"], color: "#EC4899", title: "Evolution" },
  { labels: ["MIND", "SPIRIT", "BODY"], color: "#8B5CF6", title: "Wholeness" },
  { labels: ["PRESENT", "FUTURE", "PAST"], color: "#F97316", title: "Temporal" },
  { labels: ["SON", "MOTHER", "FATHER"], color: "#A855F7", title: "Sacred Family" },
  { labels: ["OBSERVE", "DECIDE", "ACT"], color: "#84CC16", title: "OODA Loop" },
  { labels: ["SHARE", "GIVE", "RECEIVE"], color: "#22D3EE", title: "Abundance" },
];

export default function TrinityReviewPage() {
  const { currentTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/divinity-guide-trinity" className="flex items-center gap-2 hover:opacity-80">
          <span className="text-sm font-bold" style={{ color: currentTheme.swatch }}>eXeL</span>
          <span className="text-sm font-light" style={{ color: currentTheme.swatch, opacity: 0.7 }}>AI</span>
          <span className="text-xs text-muted-foreground ml-2">/ Trinity Review</span>
        </Link>
      </div>

      <div className="text-center pt-6 pb-2 px-6">
        <h1 className="text-2xl font-bold" style={{ color: currentTheme.swatch }}>
          12 Trinity Examples
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Same circle geometry — different words, different colors, different truths
        </p>
        <p className="text-[9px] text-muted-foreground/50 mt-0.5">
          Son (top) → Mother Aset (BR) → Father Asar (BL) → Unity → Words
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-6 pb-12">
        {EXAMPLES.map((ex, i) => (
          <div key={i} className="flex flex-col items-center">
            <SoITrinity
              labels={ex.labels}
              color={ex.color}
              size={220}
            />
            <p className="text-xs font-semibold mt-2">{ex.title}</p>
            <p className="text-[8px] text-muted-foreground/60">
              {ex.labels.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center pb-8">
        <p className="text-[9px] text-muted-foreground/40 italic">
          A.I. + H.I. — Where Shared Intention moves at the Speed of Thought
        </p>
      </div>
    </div>
  );
}
