"use client";

/**
 * /divinity-guide-trinity — 12 SoI Trinity Examples
 *
 * Circle geometry LOCKED. Each Trinity has unique words, color, and Ascended Master.
 * Draw order: Son → Mother Aset → Father Asar → Unity → Words LAST
 */

import { SoITrinity } from "@/components/soi-trinity";
import { useTheme } from "@/lib/theme-context";
import Link from "next/link";

const EXAMPLES: {
  labels: [string, string, string];
  color: string;
  title: string;
  master: string;
}[] = [
  { labels: ["LEADERSHIP", "INTEGRATION", "ADAPTATION"],  color: "#FF00FF", title: "Governance",        master: "Athena" },
  { labels: ["CHILD",      "MOTHER",      "FATHER"],      color: "#7F00FF", title: "Sacred Family",     master: "Aset" },
  { labels: ["SPIRIT",     "BODY",        "MIND"],        color: "#0000FF", title: "Wholeness",         master: "Krishna" },
  { labels: ["H.I.",       "S.I.",        "A.I."],        color: "#007FFF", title: "Trinity Framework",  master: "Asar" },
  { labels: ["WISDOM",     "HARMONY",     "CONNECTION"],  color: "#00FFFF", title: "Consciousness",     master: "Christo" },
  { labels: ["TRUTH",      "BEAUTY",      "GOODNESS"],    color: "#00FF91", title: "Platonic",          master: "Sofia" },
  { labels: ["ACT",        "DECIDE",      "OBSERVE"],     color: "#00FF24", title: "OODA Loop",         master: "Enlil" },
  { labels: ["SHARE",      "GIVE",        "RECEIVE"],     color: "#48FF00", title: "Abundance",         master: "Pangu" },
  { labels: ["PRESENT",    "FUTURE",      "PAST"],        color: "#B6FF00", title: "Temporal",          master: "Odin" },
  { labels: ["ACTION",     "FEELING",     "THOUGHT"],     color: "#FFDA00", title: "Intelligence",      master: "Thoth" },
  { labels: ["TRANSFORM",  "SUSTAIN",     "CREATE"],      color: "#FF6D00", title: "Evolution",         master: "Enki" },
  { labels: ["LOVE",       "SAFETY",      "LOSS"],        color: "#FF0000", title: "Human",             master: "Thor" },
];

export default function DivinityGuideTrinityPage() {
  const { currentTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <Link href="/divinity-guide" className="flex items-center gap-2 hover:opacity-80">
          <span className="text-sm font-bold" style={{ color: currentTheme.swatch }}>eXeL</span>
          <span className="text-sm font-light" style={{ color: currentTheme.swatch, opacity: 0.7 }}>AI</span>
          <span className="text-xs text-muted-foreground ml-2">/ Divinity Guide / Trinity</span>
        </Link>
        <Link href="/" className="text-xs text-muted-foreground hover:text-primary">Home</Link>
      </div>

      <div className="text-center pt-8 pb-4 px-6">
        <h1 className="text-3xl font-bold mb-2" style={{ color: currentTheme.swatch }}>
          The SoI Trinity
        </h1>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto">
          Three overlapping circles. Three intelligences. One shared intention.
          Every combination reveals a different facet of wholeness.
        </p>
        <p className="text-[9px] text-muted-foreground/50 mt-2">
          Son (top) → Mother Aset (right) → Father Asar (left) → Unity → Words
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 max-w-5xl mx-auto px-6 pb-12">
        {EXAMPLES.map((ex, i) => (
          <div key={i} className="flex flex-col items-center rounded-2xl border bg-card p-4 hover:shadow-lg transition-shadow">
            <SoITrinity
              labels={ex.labels}
              color={ex.color}
              size={220}
            />
            <h2 className="text-sm font-semibold mt-3">{ex.title}</h2>
            <p className="text-[9px] text-muted-foreground mt-0.5">{ex.master}</p>
            <p className="text-[8px] text-muted-foreground/50 mt-0.5">
              {ex.labels.join(" · ")}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center pb-8">
        <p className="text-[9px] text-muted-foreground/40 italic">
          From The Divinity Guide: The Return to Wholeness and Living Divinity
        </p>
        <p className="text-[9px] text-muted-foreground/40 mt-1 italic">
          Where Shared Intention moves at the Speed of Thought
        </p>
      </div>
    </div>
  );
}
