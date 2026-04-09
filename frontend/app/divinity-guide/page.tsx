"use client";

/**
 * /divinity-guide — The Flower of Life as a Reading Experience
 *
 * No chapter numbers. No linear order. Pure exploration.
 * Each petal is a portal — click to expand a teaching.
 * Each teaching connects to an SDK function and a human truth.
 *
 * 3 petals → 6 petals → 9 petals (same Flower geometry as /api)
 * The reader discovers at their own pace.
 */

import { useState } from "react";
import Link from "next/link";
import {
  getTheme2Positions,
  getHubPosition,
} from "@/lib/flower-geometry";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

// ── 9 Portals — no chapter numbers, just essence ───────────────

const PORTALS = [
  {
    label: "✦ Awakening",
    tagline: "You are not broken. You are becoming.",
    teaching: "Beneath each breath, memory, and question lives a truth too vast for words — yet close enough to feel in your chest. This truth is not something you earn. It is something you remember. The journey of governance begins the same way: before systems can govern wisely, individuals must learn to govern themselves.",
    sdk: "compress",
    sdkConnection: "Theme Compression reads a million voices and finds the three truths underneath — the same way awakening finds the truth beneath the noise of the mind.",
    color: { fill: "rgba(0, 255, 255, 0.15)", stroke: "#00FFFF" },
  },
  {
    label: "✦ Sacred Choice",
    tagline: "Every thought plants a seed — not only in your personal field but within the collective fabric.",
    teaching: "To think consciously is to remember your role as co-creator. When you choose a thought aligned with peace, love, or truth, you reinforce the architecture of the New Earth. Each moment becomes a chance to think again, choose again, and realign. Voting is the collective expression of this sacred choice.",
    sdk: "vote",
    sdkConnection: "Quadratic Governance ensures every sacred choice counts — but no single choice dominates. The weight follows the square root, just as wisdom follows humility.",
    color: { fill: "rgba(0, 255, 255, 0.15)", stroke: "#00FFFF" },
  },
  {
    label: "✦ Living Value",
    tagline: "You are not at the mercy of fate; you are at the threshold of choice.",
    teaching: "Economies endure when value circulates rather than concentrates. The ancients understood this through ritual redistribution. Surplus stored for winter, shared in famine. When we value human time — truly value it, at the rate of dignified labor — we create an economy of meaning, not just transaction.",
    sdk: "convert",
    sdkConnection: "Every dollar becomes tokenized human intelligence. $7.25 = 1 hour = 1.0 웃. This is not currency — it is recognition of time, effort, and presence.",
    color: { fill: "rgba(0, 255, 255, 0.15)", stroke: "#00FFFF" },
  },
  {
    label: "✦ Purification",
    tagline: "The Wound Transformed — seeing wounds as gateways to awakening.",
    teaching: "Civilizations do not fracture suddenly; they fracture internally long before collapse becomes visible. Collective pain, left unnamed, hardens into policy. What is not healed is inherited. The first step of governance is purification — removing what distorts before counting what remains.",
    sdk: "detect",
    sdkConnection: "Anomaly Exclusion removes coordinated manipulation before the math happens. Like purifying the heart before weighing it against the feather of Ma'at.",
    color: { fill: "rgba(255, 255, 0, 0.15)", stroke: "#FFFF00" },
  },
  {
    label: "✦ Convergence",
    tagline: "The world does not need more noise. It needs your coherence.",
    teaching: "When the mind quiets, something ancient reawakens — the memory of your soul's place within the greater pattern. Consensus is not compromise. It is the moment when many minds discover they were always pointing toward the same truth, approaching it from different angles of experience.",
    sdk: "consensus",
    sdkConnection: "Live Consensus Detection shows the mathematical moment when a million minds align — a convergence score that rises from 0 to 1 as agreement crystallizes.",
    color: { fill: "rgba(255, 255, 0, 0.15)", stroke: "#FFFF00" },
  },
  {
    label: "✦ Truth Proven",
    tagline: "Verification is the modern ritual through which power proves its legitimacy.",
    teaching: "In ancient Egypt, Ma'at weighed the heart against a feather. Not to punish, but to calibrate. Every governance decision must answer the same question: can this result be verified? Can it be reproduced? Can any citizen, anywhere, independently confirm that the process was honest?",
    sdk: "verify",
    sdkConnection: "Determinism Proof re-runs the entire aggregation and produces a SHA-256 hash. Same inputs, same outputs. Always. Trust verified by mathematics, not authority.",
    color: { fill: "rgba(255, 255, 0, 0.15)", stroke: "#FFFF00" },
  },
  {
    label: "✦ Evolution",
    tagline: "The software evolves itself. The community guides the evolution.",
    teaching: "Civilizations survive not by force alone but by encoding order into consciousness. The modern ME must be visible, reviewable, and revisable without losing integrity. When the platform itself can be improved by its users — tested, voted on, and deployed — technology becomes a living organism.",
    sdk: "challenge",
    sdkConnection: "The Challenge System lets anyone submit improved code. 12 AI agents test it. The community votes. The admin deploys. The platform grows like consciousness itself — through practice, correction, and collective will.",
    color: { fill: "rgba(255, 0, 255, 0.15)", stroke: "#FF00FF" },
  },
  {
    label: "✦ Sacred Authority",
    tagline: "Authority without limit devours itself.",
    teaching: "Power was never self-justifying; it answered to decree. The ruler's heart would be weighed against the feather of Ma'at. Constraint was not weakness. It was the architecture of endurance. Modern leadership requires the same transparency — the courage to decide, and the humility to explain.",
    sdk: "override",
    sdkConnection: "Transparent Override lets leaders adjust rankings — but MUST justify why. The justification is permanent, public, and immutable. Power with accountability.",
    color: { fill: "rgba(255, 0, 255, 0.15)", stroke: "#FF00FF" },
  },
  {
    label: "✦ Radiance",
    tagline: "Your life reflects the harmony of this symbol — balanced, beautiful, and forever aligned.",
    teaching: "The Flower of Life is both portal and path. To walk its lines is to know that your existence is not random — it is intentional, radiant, and profoundly necessary. When a decision is made by a million souls together, and every soul receives the result at the same moment — that is radiance. That is governance at the speed of thought.",
    sdk: "broadcast",
    sdkConnection: "Planetary Broadcast pushes results to 1M+ connected humans simultaneously. 100 shards, <500ms. Every soul, at the same moment, receives the truth they co-created.",
    color: { fill: "rgba(255, 0, 255, 0.15)", stroke: "#FF00FF" },
  },
];

const DONATION_AMOUNT = 3.33;
const HI_REWARD = 1.0; // Full HI token — surprise reward for donors

export default function DivinityGuidePage() {
  const [level, setLevel] = useState<3 | 6 | 9>(3);
  const [selectedPortal, setSelectedPortal] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [showReward, setShowReward] = useState(false);

  // Check localStorage for prior unlock
  useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("divinity-guide-unlocked");
      if (saved === "true") setUnlocked(true);
    }
  });

  const handleDonate = () => {
    // In production: Stripe payment → on success → unlock + award HI token
    // For now: simulate donation
    localStorage.setItem("divinity-guide-unlocked", "true");
    setUnlocked(true);
    // Surprise: show HI token reward after 1.5s
    setTimeout(() => setShowReward(true), 1500);
    setTimeout(() => setShowReward(false), 6000);
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary block">
            ← Back
          </Link>
          <div className="text-5xl">✦</div>
          <h1 className="text-2xl font-bold">The Divinity Guide</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Return to Wholeness and Living Divinity. Nine portals of wisdom
            connecting ancient truth to the governance engine of the future.
          </p>
          <p className="text-xs text-muted-foreground italic">
            &quot;You hold in your hands more than a book — you hold a mirror to your own divine becoming.&quot;
          </p>
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <p className="text-sm font-medium">Unlock the 9 Portals</p>
            <p className="text-3xl font-bold text-primary">${DONATION_AMOUNT.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              A sacred contribution that supports the platform and the community building it.
            </p>
            <button
              onClick={handleDonate}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Donate & Enter
            </button>
            <p className="text-[10px] text-muted-foreground/50">
              Powered by the SoI Trinity: ◬ A.I. · ♡ S.I. · 웃 H.I.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const hub = getHubPosition();
  const positions = getTheme2Positions(level);
  const visiblePortals = PORTALS.slice(0, level);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary mb-4 block">
            ← Back to eXeL AI Polling
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">The Divinity Guide</h1>
          <p className="text-lg text-muted-foreground mt-2">
            The Return to Wholeness and Living Divinity
          </p>
          <p className="text-sm text-primary/80 mt-1 italic">
            &quot;Let wisdom guide technology, and let technology amplify connection and love.&quot;
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Level Selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {([3, 6, 9] as const).map((l) => (
            <button
              key={l}
              onClick={() => { setLevel(l); setSelectedPortal(null); }}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                level === l
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {l === 3 ? "3 Portals" : l === 6 ? "6 Portals" : "9 Portals — Full Bloom"}
            </button>
          ))}
        </div>

        {/* Flower of Life SVG */}
        <svg
          viewBox="0 0 600 500"
          className="w-full max-w-lg mx-auto mb-8"
          style={{ overflow: "visible" }}
        >
          {/* Connecting lines */}
          {positions.slice(0, level).map((pos, i) => (
            <line
              key={`line-${i}`}
              x1={hub.cx} y1={hub.cy}
              x2={pos.cx} y2={pos.cy}
              stroke="currentColor" strokeOpacity={0.08} strokeWidth={1}
            />
          ))}

          {/* Hub */}
          <ThemeCircle
            cx={hub.cx} cy={hub.cy} r={hub.r}
            theme={{ label: "✦", count: level, avgConfidence: 1.0, summary33: "Explore" }}
            fill="rgba(var(--primary), 0.1)"
            stroke="hsl(var(--primary))"
            isHub
          />

          {/* Portal circles */}
          {positions.slice(0, level).map((pos, i) => {
            if (i >= visiblePortals.length) return null;
            const portal = visiblePortals[i];
            return (
              <ThemeCircle
                key={`portal-${i}`}
                cx={pos.cx} cy={pos.cy} r={pos.r}
                theme={{
                  label: portal.label,
                  count: i + 1,
                  avgConfidence: 0.9 - i * 0.02,
                  summary33: portal.tagline.slice(0, 40),
                }}
                fill={portal.color.fill}
                stroke={portal.color.stroke}
                bloom bloomDelay={i * 150}
                onClick={() => setSelectedPortal(selectedPortal === i ? null : i)}
              />
            );
          })}
        </svg>

        {/* Selected Portal — Expanded Teaching */}
        {selectedPortal !== null && selectedPortal < visiblePortals.length && (
          <div className="rounded-xl border bg-card overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-5 border-b" style={{ borderColor: visiblePortals[selectedPortal].color.stroke + "33" }}>
              <h2 className="text-xl font-semibold">{visiblePortals[selectedPortal].label}</h2>
              <p className="text-sm text-primary/80 italic mt-1">{visiblePortals[selectedPortal].tagline}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-foreground/80 leading-relaxed">
                {visiblePortals[selectedPortal].teaching}
              </p>
              <div className="rounded-lg bg-muted/30 border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Connected SDK Function: <code className="text-primary">sdk.{visiblePortals[selectedPortal].sdk}()</code>
                </p>
                <p className="text-sm text-foreground/70">
                  {visiblePortals[selectedPortal].sdkConnection}
                </p>
                <Link
                  href="/api"
                  className="inline-block mt-2 text-xs text-primary hover:underline"
                >
                  → Explore this function in the API
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Surprise HI Token Reward */}
        {showReward && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="rounded-xl border bg-card shadow-2xl px-6 py-4 text-center space-y-2">
              <p className="text-2xl">웃</p>
              <p className="text-sm font-semibold text-primary">You earned 1.0 웃 token!</p>
              <p className="text-xs text-muted-foreground">
                Your ${DONATION_AMOUNT.toFixed(2)} contribution has been converted to a full Human Intelligence token.
                This recognizes your investment in the community.
              </p>
            </div>
          </div>
        )}

        {/* Footer Invitation */}
        <div className="text-center mt-8 space-y-3">
          <p className="text-sm text-muted-foreground">
            This is a sacred collaboration between Artificial Intelligence (◬), Spiritual Intelligence (♡), and Human Intelligence (웃).
          </p>
          <p className="text-xs text-muted-foreground italic">
            &quot;You were never separate, only sleeping. Now you awaken. Welcome home.&quot;
          </p>
          <p className="text-[10px] text-muted-foreground/50">
            ••• Master of Thought •••
          </p>
        </div>
      </div>
    </div>
  );
}
