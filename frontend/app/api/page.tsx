"use client";

import { useState } from "react";
import Link from "next/link";
import { useLexicon } from "@/lib/lexicon-context";

/**
 * /api — The Governance Engine Developer Hub
 *
 * 3 Free APIs + 9 Paid SDK Functions
 * Each links to a sub-page with full docs, demos, and Ascended Master examples.
 */

const CORE_APIS = [
  {
    id: "create-session",
    name: "Create Poll",
    icon: "🌐",
    cost: "0.75 ◬ per session",
    tagline: "Launch governance in one call",
    description: "Create a governance session with a single API call. Get a join code, QR code, and real-time dashboard. Your participants join free — on any device, in any of 33 languages.",
    endpoint: "POST /v1/sessions",
    master: "Enki",
    masterTitle: "Sumerian Creator — sparked civilization",
    example: `const session = await fetch('/api/v1/sessions', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer exel_pk_...' },
  body: JSON.stringify({
    title: "What should our team focus on next quarter?",
    pricing_tier: "free",
    theme2_voting_level: "theme2_3"
  })
});
// → { id: "abc-123", short_code: "DEMO2026", qr_url: "..." }`,
  },
  {
    id: "submit-response",
    name: "Submit Voice or Text",
    icon: "💬",
    cost: "0.15 ◬ per response",
    tagline: "Every voice, any language, instantly processed",
    description: "Submit text in any of 33 languages, or send audio for real-time voice-to-text transcription. Each response is automatically summarized to 333 → 111 → 33 words, translated to English, and checked for PII.",
    endpoint: "POST /v1/sessions/{id}/responses",
    master: "Krishna",
    masterTitle: "Hindu Unifier — connects across boundaries",
    example: `// Text in any language
await fetch('/api/v1/sessions/abc-123/responses', {
  method: 'POST',
  body: JSON.stringify({
    text: "La inteligencia artificial puede democratizar las decisiones",
    language_code: "es"
  })
});
// → Auto-translated to English, summarized to 33 words, PII checked`,
  },
  {
    id: "export-results",
    name: "Export Results",
    icon: "📊",
    cost: "1.5 ◬ per 1K rows",
    tagline: "Complete intelligence, ready to act on",
    description: "Download the complete 16-column CSV with themes, confidence scores, and summaries. Auto-streams for large datasets (10K+ rows) — no memory limits. The same format used by the 5,000-response AI Governance demo.",
    endpoint: "GET /v1/sessions/{id}/export/csv",
    master: "Thoth",
    masterTitle: "Egyptian Scribe — guardian of data integrity",
    example: `const csv = await fetch('/api/v1/sessions/abc-123/export/csv', {
  headers: { 'Authorization': 'Bearer exel_pk_...' }
});
// → Streams 16-column CSV:
// Q_Number, Question, User, Detailed_Results, Response_Language,
// 333_Summary, 111_Summary, 33_Summary,
// Theme01, Theme01_Confidence, Theme2_9, Theme2_9_Confidence,
// Theme2_6, Theme2_6_Confidence, Theme2_3, Theme2_3_Confidence`,
  },
];

const PAID_SDKS = [
  {
    id: "compress",
    name: "Theme Compression",
    icon: "🧠",
    tagline: "Give it a million voices. Get back three truths.",
    description: "The Reader for Humanity. Any text corpus — citizen feedback, research papers, social media, customer reviews — compressed into a hierarchy of meaning: 9 themes → 6 → 3. Not summarization. Understanding.",
    cost: "5 ◬ per 1,000 texts",
    master: "Pangu",
    masterTitle: "Chinese Creator — broke open the new",
    example: `const themes = await sdk.compress([
  "AI can democratize governance...",
  "Privacy is my biggest concern...",
  // ...10,000 more citizen comments
]);
console.log(themes.themes_3);
// → ["AI-Powered Innovation", "Risk & Accountability", "Balanced Governance"]`,
  },
  {
    id: "vote",
    name: "Quadratic Governance",
    icon: "🗳️",
    tagline: "Democracy where every voice counts, but no single voice dominates.",
    description: "Vote weight = √(tokens staked). A user with 10,000× more tokens only gets 100× more influence — not 10,000×. Built-in anti-sybil catches coordinated attacks. 66.6% supermajority ensures real consensus.",
    cost: "0.01 ◬ per vote",
    master: "Christo",
    masterTitle: "Unity Consciousness — builds consensus",
    example: `// Odin stakes 10,000 tokens but quadratic caps his influence
await sdk.vote(session, ["theme_a", "theme_b", "theme_c"], {
  tokens_staked: 10000
});
// Weight = √10000 = 100 (not 10,000!)
// With 15% influence cap: max 15% of total vote weight`,
  },
  {
    id: "convert",
    name: "HI Token Conversion",
    icon: "웃",
    tagline: "Value human time, not just currency.",
    description: "Every dollar invested becomes tokenized human intelligence. $7.25 = 1 hour of minimum wage = 1.0 웃 token. When the platform pays out, contributors receive at THEIR local minimum wage — $7.25 in Texas, $16.28 in Washington, $0.34 in Nigeria.",
    cost: "Free — the payment IS the product",
    master: "Sofia",
    masterTitle: "Sophia — wisdom through many lenses",
    example: `const receipt = await sdk.convert(50.00, "donation");
// → { hi_tokens: 6.897, reason: "$50.00 ÷ $7.25/hr = 6.897 웃" }
// These 6.897 웃 represent 6.897 hours of compensated contribution
// Paid out at the contributor's LOCAL minimum wage`,
  },
  {
    id: "detect",
    name: "Anomaly Exclusion",
    icon: "🛡️",
    tagline: "Remove bad actors before the math happens.",
    description: "Most systems count all votes then flag bad ones. We detect coordinated patterns — 3 identical rankings in 2 seconds, rapid-fire bot submissions — and EXCLUDE them before aggregation. The result is always mathematically clean.",
    cost: "1 ◬ per scan",
    master: "Thor",
    masterTitle: "Norse Protector — guardian against threats",
    example: `const scan = await sdk.detect(session);
// → { anomaly_count: 1, type: "identical_ranking_burst",
//    excluded_participants: ["bot_001", "bot_002", "bot_003"],
//    message: "3 votes excluded before aggregation" }`,
  },
  {
    id: "consensus",
    name: "Live Consensus",
    icon: "📊",
    tagline: "Watch the moment a million minds agree.",
    description: "While voting is still happening, a live convergence score (0 → 1) shows how strongly the crowd agrees. An emerging leader reveals which direction is winning. The moderator sees consensus forming in real time.",
    cost: "0.5 ◬ per check",
    master: "Odin",
    masterTitle: "Norse All-Father — sees the future forming",
    example: `const live = await sdk.consensus(session);
// → { convergence: 0.73,
//    leader: { label: "Renewable Energy", score: 4250.0 },
//    submissions: 8347 }
// "73% converged — the crowd is aligning on renewables"`,
  },
  {
    id: "verify",
    name: "Determinism Proof",
    icon: "🔐",
    tagline: "Trust nothing. Verify everything. It's free.",
    description: "Re-run the entire aggregation on the same inputs. Get a SHA-256 hash. If it matches the original, the result is provably identical. No black boxes. No 'trust us.' Mathematical certainty. Any citizen can verify independently.",
    cost: "Free — trust should never have a price",
    master: "Aset",
    masterTitle: "Egyptian Isis — restorer of truth",
    example: `const proof = await sdk.verify(session);
// → { match: true,
//    replay_hash: "a3f8c2e1d4b5...",
//    existing_order: ["theme_1", "theme_2", "theme_3"],
//    recomputed_order: ["theme_1", "theme_2", "theme_3"] }
// Same inputs. Same outputs. Always.`,
  },
  {
    id: "challenge",
    name: "Challenge System",
    icon: "⚡",
    tagline: "The software evolves itself. The community guides it.",
    description: "Submit improved code for any function. It's tested against real production data by 12 AI agents. If 66.6% of token holders vote yes, an admin deploys it live. AI and humans compete — the best implementation wins.",
    cost: "10 ◬ per submission",
    master: "Asar",
    masterTitle: "Egyptian Osiris — synthesis of meaning",
    example: `const challenge = await sdk.challenge(7, {
  function: "aggregate_rankings",
  code: myImprovedBordaCode,
  title: "Streaming accumulator for 10M voters"
});
// → { portal_url: "https://sim-abc123.workers.dev/",
//    status: "testing",
//    message: "12 Ascended Masters verifying your code..." }`,
  },
  {
    id: "override",
    name: "Transparent Override",
    icon: "⚖️",
    tagline: "Authority exists. But it answers to everyone.",
    description: "A leader can change a ranking — but must explain why. The justification is permanent, public, and immutable. Everyone sees who changed what. Power with accountability. Leadership with transparency.",
    cost: "2 ◬ per override",
    master: "Athena",
    masterTitle: "Greek Strategist — wisdom in action",
    example: `await sdk.override(session, "theme_risk", 1, {
  justification: "Board intelligence indicates regulatory deadline "
    + "in Q3 — risk mitigation must take immediate priority."
});
// → Broadcast to ALL participants:
// "Ranking adjusted by Athena (Lead)"
// "Reason: Board intelligence indicates..."`,
  },
  {
    id: "broadcast",
    name: "Planetary Broadcast",
    icon: "📡",
    tagline: "Every connected human, at the same moment.",
    description: "Push results, theme reveals, or governance decisions to 1M+ simultaneous clients. 100 broadcast shards ensure no channel is overwhelmed. Whether you have 10 participants or 10 million, everyone gets the result at the same time.",
    cost: "1 ◬ per 10,000 recipients",
    master: "Enlil",
    masterTitle: "Sumerian Commander — builder of order",
    example: `await sdk.broadcast(session, {
  event: "ranking_complete",
  top_theme: "Renewable Energy Transition",
  approval: "87.3%",
  voter_count: 1000000
});
// → 100 shards × ~10K each = 1M devices notified < 500ms`,
  },
];

export default function ApiPage() {
  const { t } = useLexicon();
  const [activeTab, setActiveTab] = useState<"free" | "paid">("free");

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <Link href="/" className="text-xs text-muted-foreground hover:text-primary mb-4 block">
            ← Back to eXeL AI Polling
          </Link>
          <h1 className="text-3xl font-bold tracking-tight">Governance Engine API</h1>
          <p className="text-lg text-muted-foreground mt-2">
            9 functions that change how decisions are made. 3 that are always free.
          </p>
          <p className="text-sm text-primary/80 mt-1 italic">
            &quot;Where Shared Intention moves at the Speed of Thought.&quot;
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6 flex gap-0">
          <button
            onClick={() => setActiveTab("free")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "free"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            3 Core APIs
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "paid"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            9 SDK Functions
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {activeTab === "free" && (
          <div className="space-y-8">
            <p className="text-sm text-muted-foreground">
              These three calls power the core governance workflow. Each consumes ◬ tokens
              proportional to the compute and intelligence your session requires.
            </p>
            {CORE_APIS.map((api) => (
              <div key={api.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-6 py-5 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{api.icon}</span>
                    <div>
                      <h2 className="text-xl font-semibold">{api.name}</h2>
                      <p className="text-sm text-muted-foreground">{api.tagline}</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {api.cost}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">{api.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <code className="bg-muted px-2 py-0.5 rounded font-mono">{api.endpoint}</code>
                  </div>
                  <details>
                    <summary className="text-xs text-primary cursor-pointer hover:underline">
                      Show example — featuring {api.master} ({api.masterTitle})
                    </summary>
                    <pre className="mt-3 text-xs bg-muted/50 rounded-lg p-4 font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                      {api.example}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "paid" && (
          <div className="space-y-8">
            <p className="text-sm text-muted-foreground">
              These nine functions are the governance engine — theme compression, quadratic voting,
              anomaly detection, determinism proofs, and planetary-scale broadcast. Each consumes
              ◬ (AI tokens). Two are free because trust and fair compensation shouldn&apos;t cost.
            </p>
            {PAID_SDKS.map((sdk) => (
              <div key={sdk.id} className="rounded-xl border bg-card overflow-hidden">
                <div className="px-6 py-5 border-b">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{sdk.icon}</span>
                    <div>
                      <h2 className="text-xl font-semibold">sdk.{sdk.id}()</h2>
                      <p className="text-sm text-muted-foreground">{sdk.tagline}</p>
                    </div>
                    <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${
                      sdk.cost.includes("Free")
                        ? "bg-green-500/10 text-green-400"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {sdk.cost}
                    </span>
                  </div>
                </div>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-sm text-foreground/80 leading-relaxed">{sdk.description}</p>
                  <details>
                    <summary className="text-xs text-primary cursor-pointer hover:underline">
                      Show example — featuring {sdk.master} ({sdk.masterTitle})
                    </summary>
                    <pre className="mt-3 text-xs bg-muted/50 rounded-lg p-4 font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                      {sdk.example}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center">
          <p className="text-xs text-muted-foreground">
            103 endpoints · 1044 tests · 10 cubes · 572 lexicon keys · 33 languages
          </p>
          <p className="text-xs text-muted-foreground mt-1 italic">
            &quot;The future does not belong to the most powerful intelligence.
            It belongs to those who master its direction.&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
