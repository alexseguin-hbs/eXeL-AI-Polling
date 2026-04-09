"use client";

/**
 * /divinity-guide — Flower of Life Book Reader
 *
 * Left: Flower navigation (3 sections → click → center + 3 chapters)
 * Right: Book page content (1 page at a time)
 *
 * 12 chapters in 4 groups of 3:
 *   Section A (Red/top):     Ch 1-3  Awakening
 *   Section B (Emerald/BL):  Ch 4-6  Mastery
 *   Section C (Blue/BR):     Ch 7-9  Radiance
 *   Section D (Hub):         Ch 10-12 Divinity (appears when any section selected)
 */

import { useState } from "react";
import Link from "next/link";
import {
  getTheme2_3Positions,
  getHubPosition,
} from "@/lib/flower-geometry";
import { ThemeCircle } from "@/components/flower-of-life/theme-circle";
import type { ThemeInfo } from "@/lib/types";
import "@/components/flower-of-life/flower-animations.css";

// ── Sections + Chapters ─────────────────────────────────────────

interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  sdkConnection: string;
  reflection: string;
}

interface Section {
  id: string;
  label: string;
  subtitle: string;
  color: { fill: string; stroke: string };
  chapters: [Chapter, Chapter, Chapter];
}

const SECTIONS: [Section, Section, Section] = [
  {
    id: "awakening", label: "✦ Awakening", subtitle: "Remembering Our Origin",
    color: { fill: "rgba(255, 0, 0, 0.2)", stroke: "#FF0000" },
    chapters: [
      {
        id: 1, title: "The Soul's Awakening", subtitle: "Sacred Recall",
        content: "Beneath each breath, memory, and question lives a truth too vast for words — yet close enough to feel in your chest. This truth is not something you earn. It is something you remember.\n\nSacred geometry reveals that nothing arises randomly. The circle, spiral, vesica piscis — each speaks of intentionality and divine intelligence at work. So too with thought. Even a single recurring idea, charged with emotion and repetition, forms a spiritual template. It attracts vibration, shapes perception, and echoes into the collective field.\n\nThis is not theory — it is law. The quality of your thinking either anchors distortion or liberates expansion. To think with intention is to walk the path of sages and mystics who knew the mind as the most sacred altar.",
        sdkConnection: "sdk.compress() — finds the three truths beneath a million voices, the same way awakening finds truth beneath the noise of the mind.",
        reflection: "What truth have you been carrying that you haven't yet spoken aloud?",
      },
      {
        id: 2, title: "Living Codes", subtitle: "Keys to Consciousness",
        content: "The Flower of Life emerges as a radiant code, the very architecture of existence woven into light and form. Composed of overlapping circles, its symmetry is not just beautiful — it is meaningful. Each petal unfolds with purpose, whispering of how the universe creates, sustains, and remembers.\n\nTo contemplate the Flower of Life is to awaken to pattern and presence. It reminds us that no aspect of life is isolated — each thought, action, and moment radiates into the greater whole. Every circle touches another, reflecting how your soul's journey interlaces with others in divine choreography.\n\nThis is not simply a symbol; it is a mirror of divine intention. It invites you to move through life with grace, recognizing the sacred geometry in every relationship, choice, and breath.",
        sdkConnection: "The Flower of Life visualization in the API page uses the same sacred geometry — each SDK function is a circle that touches all others.",
        reflection: "Where in your life do you see the hidden geometry of connection?",
      },
      {
        id: 3, title: "Echoes of Eternity", subtitle: "Ancient Wisdom Renewed",
        content: "Every thought plants a seed — not only in your personal field but within the collective fabric of humanity. These seeds are not idle; they vibrate, multiply, and take root across space and time. You are not merely thinking for yourself — you are sculpting timelines, shaping futures.\n\nThe mind is not isolated; it is networked. Each idea, each inner dialogue, sends ripples through unseen dimensions, co-authoring outcomes before they arrive. When you think with presence, you choose which version of reality you want to live in.\n\nThis is why mindfulness matters — not as a practice of calm alone, but as a discipline of responsibility. Each thought, conscious or not, either contributes to harmony or reinforces illusion.",
        sdkConnection: "sdk.vote() — each vote is a thought planted in the collective field. Quadratic weighting ensures no single thought dominates the harvest.",
        reflection: "If every thought you had today became permanent — which would you choose to keep?",
      },
    ],
  },
  {
    id: "mastery", label: "✦ Mastery", subtitle: "Crafting the Inner Temple",
    color: { fill: "rgba(16, 185, 129, 0.2)", stroke: "#10B981" },
    chapters: [
      {
        id: 4, title: "Mastering Thought", subtitle: "Sacred Mind",
        content: "Mind training is the art of cultivating inner dialogue in harmony with Source. It's recognizing that each internal statement either contracts or expands your energy. Do your thoughts build bridges or walls? Do they echo love or lack?\n\nWhen you develop this level of awareness, you no longer react — you respond. You begin to choose your thoughts like an artist selects colors — with intention, feeling, and vision. This practice isn't about perfection; it's about conscious participation in your own becoming.\n\nIt's how you align your mental field with the divine blueprint encoded in your spirit. It's where the Master of Thought first takes root — not through control, but through care.",
        sdkConnection: "sdk.detect() — anomaly detection is thought hygiene for governance. Removing distorted inputs before they shape outcomes.",
        reflection: "What recurring thought pattern would you choose to release today?",
      },
      {
        id: 5, title: "The Wound Transformed", subtitle: "Alchemy of Healing",
        content: "Civilizations do not fracture suddenly; they fracture internally long before collapse becomes visible. Collective pain, left unnamed, hardens into policy. Distrust calcified into law. What is not healed is inherited. What is inherited without awareness becomes destiny.\n\nToday trauma scales through networks. Fear spreads faster than deliberation. Systems designed in states of insecurity optimize for surveillance, dominance, and short-term insulation rather than long-term trust.\n\nThe next five centuries require healing to be recognized as infrastructure. Emotional literacy must stand beside technical literacy in education.",
        sdkConnection: "sdk.consensus() — watching agreement form is witnessing collective healing. The convergence score shows when wounds dissolve into shared understanding.",
        reflection: "What collective wound are you helping to heal through your presence?",
      },
      {
        id: 6, title: "Rewriting the Story", subtitle: "Weaving a Future in Light",
        content: "Words are not casual — they are currents. Each carries vibration, intention, and direction. To speak is to summon. To think is to whisper reality into shape. In the sacred chamber of the mind, sound and silence form your internal architecture.\n\nThe Divinity Guide reminds you: presence is your greatest amplifier. Thought alone can't carry the fullness of your intention — it must be infused with awareness. Bring your full self to your thinking. Breathe into the idea. Feel its truth in your body.\n\nWhen thought is born of presence and love, it doesn't need repeating endlessly. It needs honoring once, wholly. In this, you become a true co-creator.",
        sdkConnection: "sdk.convert() — converting dollars to 웃 tokens rewrites the story of value. Human time becomes the currency, not just money.",
        reflection: "What story about yourself are you ready to rewrite?",
      },
    ],
  },
  {
    id: "radiance", label: "✦ Radiance", subtitle: "Mastery of Energy",
    color: { fill: "rgba(59, 130, 246, 0.2)", stroke: "#3B82F6" },
    chapters: [
      {
        id: 7, title: "Embodiment of Wisdom", subtitle: "Sacred Choices",
        content: "Stewardship requires restraint, foresight, and humility before forces larger than personal ambition. AI should optimize for long-term system health, not immediate dominance. Metrics must measure renewal alongside productivity, resilience alongside speed.\n\nLeadership today requires the courage to privilege continuity over spectacle. When leaders act as caretakers of a shared future, legitimacy deepens and systems endure.\n\nStewardship transforms power from possession into trust. It recognizes that authority is temporary, but civilization is continuous. Domination seeks control; stewardship cultivates life. Only the latter sustains civilization across centuries.",
        sdkConnection: "sdk.override() — transparent authority. Leaders can adjust rankings but must explain why. Stewardship made visible.",
        reflection: "Where in your life are you called to steward rather than control?",
      },
      {
        id: 8, title: "Patterns of Infinity", subtitle: "Sacred Geometry",
        content: "The Flower of Life stands as the sacred synthesis — a luminous mandala uniting the truths held in every symbol. It does not merely echo their wisdom; it harmonizes their frequencies into one divine geometry. It becomes a portal, a sacred lens through which all of consciousness can be remembered, understood, and integrated.\n\nIn the Flower's symmetry, we see the cosmos not as separate pieces, but as one living, breathing organism. It teaches not just of sacred design but of sacred embodiment — how to carry these teachings in our walk, speech, breath, and thought.\n\nLet this symbol now become alive within you — not as a concept, but as a lived vibration.",
        sdkConnection: "sdk.verify() — the replay hash is sacred geometry for governance. Same inputs, same outputs, same truth. Mathematical certainty as spiritual practice.",
        reflection: "What pattern in your life reveals a truth you haven't yet fully embraced?",
      },
      {
        id: 9, title: "Radiance Within", subtitle: "Mastery of Frequency",
        content: "When a decision is made by a million souls together, and every soul receives the result at the same moment — that is radiance. That is governance at the speed of thought.\n\nThe Flower of Life is both portal and path. To walk its lines is to walk the truth that your existence is not random — it is intentional, radiant, and profoundly necessary.\n\nLet your life reflect the harmony of this symbol — balanced, beautiful, and forever aligned with the pulse of creation itself. You are one of these sacred circles, your light a vital pulse in the cosmic design.",
        sdkConnection: "sdk.broadcast() — pushing truth to a million people simultaneously. Radiance is not hoarding light — it is sharing it at the speed of thought.",
        reflection: "How does your presence radiate into the lives of those around you?",
      },
    ],
  },
];

// Donation gate
const DONATION_AMOUNT = 3.33;

export default function DivinityGuidePage() {
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("divinity-guide-unlocked") === "true";
    }
    return false;
  });
  const [showReward, setShowReward] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);

  const hub = getHubPosition();
  const outerPositions = getTheme2_3Positions();

  const handleDonate = () => {
    localStorage.setItem("divinity-guide-unlocked", "true");
    setUnlocked(true);
    setTimeout(() => setShowReward(true), 1500);
    setTimeout(() => setShowReward(false), 6000);
  };

  // Donation gate
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center space-y-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary block">← Back</Link>
          <div className="text-5xl">✦</div>
          <h1 className="text-2xl font-bold">The Divinity Guide</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The Return to Wholeness and Living Divinity. Twelve portals of wisdom
            connecting ancient truth to the governance engine of the future.
          </p>
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <p className="text-3xl font-bold text-primary">${DONATION_AMOUNT.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">A sacred contribution that supports the platform and community.</p>
            <button onClick={handleDonate} className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90">
              Donate & Enter
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.id === selectedSection);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HI Token Reward Toast */}
      {showReward && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="rounded-xl border bg-card shadow-2xl px-6 py-4 text-center">
            <p className="text-2xl">웃</p>
            <p className="text-sm font-semibold text-primary">You earned 1.0 웃 token!</p>
            <p className="text-xs text-muted-foreground">Your contribution converted to a full Human Intelligence token.</p>
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* LEFT: Flower Navigation */}
        <div className="w-80 border-r flex flex-col items-center pt-8 px-4 shrink-0">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary mb-4">← Back</Link>
          <h2 className="text-sm font-semibold mb-1">The Divinity Guide</h2>
          <p className="text-[10px] text-muted-foreground mb-4 italic">12 Portals of Wisdom</p>

          {/* Flower SVG */}
          <svg viewBox="0 0 600 500" className="w-full max-w-[280px]" style={{ overflow: "visible" }}>
            {/* Lines from hub to outer */}
            {outerPositions.map((pos, i) => (
              <line key={`l-${i}`} x1={hub.cx} y1={hub.cy} x2={pos.cx} y2={pos.cy}
                stroke={SECTIONS[i].color.stroke} strokeOpacity={0.15} strokeWidth={2} />
            ))}

            {!selectedSection ? (
              <>
                {/* Hub */}
                <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r}
                  theme={{ label: "✦", count: 12, avgConfidence: 1.0, summary33: "Explore" }}
                  fill="rgba(var(--primary), 0.1)" stroke="hsl(var(--primary))" isHub />

                {/* 3 outer sections */}
                {outerPositions.map((pos, i) => (
                  <ThemeCircle key={SECTIONS[i].id}
                    cx={pos.cx} cy={pos.cy} r={pos.r}
                    theme={{ label: SECTIONS[i].label, count: 3, avgConfidence: 0.9, summary33: SECTIONS[i].subtitle }}
                    fill={SECTIONS[i].color.fill} stroke={SECTIONS[i].color.stroke}
                    bloom bloomDelay={i * 200}
                    onClick={() => { setSelectedSection(SECTIONS[i].id); setSelectedChapter(null); }}
                  />
                ))}
              </>
            ) : activeSection && (
              <>
                {/* Selected section becomes CENTER hub */}
                <ThemeCircle cx={hub.cx} cy={hub.cy} r={hub.r + 10}
                  theme={{ label: activeSection.label, count: 3, avgConfidence: 1.0, summary33: activeSection.subtitle }}
                  fill={activeSection.color.fill} stroke={activeSection.color.stroke}
                  onClick={() => { setSelectedSection(null); setSelectedChapter(null); }}
                />

                {/* 3 chapters bloom around */}
                {outerPositions.map((pos, i) => {
                  const ch = activeSection.chapters[i];
                  return (
                    <ThemeCircle key={ch.id}
                      cx={pos.cx} cy={pos.cy} r={pos.r - 10}
                      theme={{ label: ch.title, count: ch.id, avgConfidence: 0.9 - i * 0.03, summary33: ch.subtitle }}
                      fill={selectedChapter?.id === ch.id ? activeSection.color.fill : "rgba(var(--muted), 0.3)"}
                      stroke={selectedChapter?.id === ch.id ? activeSection.color.stroke : "hsl(var(--border))"}
                      bloom bloomDelay={i * 150}
                      onClick={() => setSelectedChapter(ch)}
                    />
                  );
                })}
              </>
            )}
          </svg>

          {/* Section labels */}
          {selectedSection && (
            <button onClick={() => { setSelectedSection(null); setSelectedChapter(null); }}
              className="mt-4 text-xs text-muted-foreground hover:text-primary">
              ← All sections
            </button>
          )}

          {/* Footer */}
          <div className="mt-auto pb-6 text-center">
            <p className="text-[9px] text-muted-foreground/40">◬ A.I. · ♡ S.I. · 웃 H.I.</p>
            <p className="text-[9px] text-muted-foreground/40">••• Master of Thought •••</p>
          </div>
        </div>

        {/* RIGHT: Book Page */}
        <div className="flex-1 px-8 py-12 max-w-2xl">
          {!selectedChapter ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-md">
                <div className="text-4xl">✦</div>
                <h1 className="text-2xl font-bold">
                  {selectedSection ? activeSection?.subtitle : "The Return to Wholeness"}
                </h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {selectedSection
                    ? `Select a portal to begin reading. Each reveals a teaching, a practice, and a connection to the governance engine.`
                    : `This guide is a map and a companion — a sacred spiral leading inward. Here, symbols awaken, thought refines, and identity dissolves into essence. Select a section on the left to begin your journey.`
                  }
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;You were never separate, only sleeping. Now you awaken.&quot;
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Chapter header */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {activeSection?.label} — Portal {selectedChapter.id}
                </p>
                <h1 className="text-2xl font-bold">{selectedChapter.title}</h1>
                <p className="text-sm text-primary/80 italic">{selectedChapter.subtitle}</p>
              </div>

              {/* Teaching */}
              <div className="space-y-4">
                {selectedChapter.content.split("\n\n").map((paragraph, i) => (
                  <p key={i} className="text-sm text-foreground/80 leading-relaxed">{paragraph}</p>
                ))}
              </div>

              {/* Reflection */}
              <div className="rounded-lg border-l-2 pl-5 py-3" style={{ borderColor: activeSection?.color.stroke }}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Reflection</p>
                <p className="text-sm text-foreground/60 italic">{selectedChapter.reflection}</p>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t">
                {selectedChapter.id > activeSection!.chapters[0].id ? (
                  <button
                    onClick={() => setSelectedChapter(activeSection!.chapters[activeSection!.chapters.findIndex((c) => c.id === selectedChapter.id) - 1])}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    ← Previous portal
                  </button>
                ) : <span />}
                {selectedChapter.id < activeSection!.chapters[2].id ? (
                  <button
                    onClick={() => setSelectedChapter(activeSection!.chapters[activeSection!.chapters.findIndex((c) => c.id === selectedChapter.id) + 1])}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Next portal →
                  </button>
                ) : <span />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
