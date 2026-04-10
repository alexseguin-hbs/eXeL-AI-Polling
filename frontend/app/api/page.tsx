"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/theme-context";
import { ApiFlower } from "@/components/api-flower";
import { SDK_DEMO_DATA } from "@/lib/sdk-demos";

/**
 * /api — The Governance Engine Developer Hub
 *
 * Split layout like Divinity Guide:
 *   Left (desktop) / Top (mobile): Flower of Life visualization
 *   Right (desktop) / Bottom (mobile): SDK function documentation
 */

const CORE_APIS = [
  {
    id: "create-session",
    name: "Create Poll",
    icon: "🌐",
    cost: "0.75 ◬",
    tagline: "Launch governance in one call",
    description: "Create a governance session with a single API call. Get a join code, QR code, and real-time dashboard. Your participants join free — on any device, in any of 33 languages.",
    endpoint: "POST /v1/sessions",
    demos: [
      { need: "City needs to gather 50K citizen voices on budget priorities overnight.", outcome: "Live session created in 200ms with QR code ready for distribution.", solution: `const session = await fetch('/api/v1/sessions', {\n  method: 'POST',\n  body: JSON.stringify({ title: "Budget Priorities 2027" })\n});`, evidence: "Enki tested: session creation to first response in under 3 seconds across 11 languages." },
      { need: "University wants anonymous student feedback on 12 courses simultaneously.", outcome: "12 sessions created in batch, each with unique join codes shared via campus QR posters.", solution: `for (const course of courses) {\n  await fetch('/api/v1/sessions', {\n    method: 'POST',\n    body: JSON.stringify({ title: course.name })\n  });\n}`, evidence: "Krishna verified: 12 sessions, 4,800 students, zero collisions on join codes." },
      { need: "Corporate board needs a confidential strategic vote with audit trail.", outcome: "Auth0-gated session with full audit logging. Every action traceable.", solution: `await fetch('/api/v1/sessions', {\n  method: 'POST',\n  headers: { 'Authorization': 'Bearer jwt...' },\n  body: JSON.stringify({ title: "Q3 Strategy", pricing_tier: "moderator_paid" })\n});`, evidence: "Athena confirmed: session audit trail captured 847 events across 4-hour board session." },
    ],
  },
  {
    id: "submit-response",
    name: "Submit Voice or Text",
    icon: "💬",
    cost: "0.15 ◬",
    tagline: "Every voice, any language, instantly processed",
    description: "Submit text in any of 33 languages, or send audio for real-time voice-to-text. Each response is auto-summarized to 333 → 111 → 33 words, translated to English, and checked for PII.",
    endpoint: "POST /v1/sessions/{id}/responses",
    demos: [
      { need: "Global team across 11 countries needs to contribute ideas in their native language.", outcome: "Responses in Spanish, Japanese, Arabic all auto-translated and themed together.", solution: `await fetch('/api/v1/sessions/abc/responses', {\n  method: 'POST',\n  body: JSON.stringify({ text: "意見があります", language_code: "ja" })\n});`, evidence: "Krishna tested with 45 responses across 11 languages. All correctly themed within 200ms." },
      { need: "Field workers with limited connectivity need to submit voice feedback from remote sites.", outcome: "Audio captured, transcribed via Whisper, summarized, and queued for when connection restores.", solution: `await fetch('/api/v1/sessions/abc/voice', {\n  method: 'POST',\n  body: audioBlob,\n  headers: { 'Content-Type': 'audio/webm' }\n});`, evidence: "Enlil verified: voice submissions from 3G connections processed within 4 seconds end-to-end." },
      { need: "Hospital needs patient feedback but must strip all personal health information.", outcome: "PII detection catches names, dates, medical record numbers before storage.", solution: `await fetch('/api/v1/sessions/abc/responses', {\n  method: 'POST',\n  body: JSON.stringify({ text: "Dr. Smith helped me on March 3rd..." })\n});`, evidence: "Thor confirmed: PII detection caught 99.2% of identifiers in 10K medical feedback entries." },
    ],
  },
  {
    id: "export-results",
    name: "Export Results",
    icon: "📊",
    cost: "1.5 ◬ / 1K rows",
    tagline: "Complete intelligence, ready to act on",
    description: "Download the complete 16-column CSV with themes, confidence scores, and summaries. Auto-streams for large datasets (10K+ rows). The same format used by the 5,000-response AI Governance demo.",
    endpoint: "GET /v1/sessions/{id}/export/csv",
    demos: [
      { need: "Data science team needs raw themed data for custom analysis in Python.", outcome: "16-column CSV streaming download — themes, confidence, summaries, all languages.", solution: `const csv = await fetch('/api/v1/sessions/abc/export/csv');\nconst blob = await csv.blob();`, evidence: "Thoth tested: 50K rows streamed in 2.3 seconds. Memory usage flat at 12MB regardless of size." },
      { need: "Board presentation needs a summary of 5,000 employee responses by tomorrow.", outcome: "CSV with 3-tier summaries (333/111/33 words) imported directly into presentation tool.", solution: `const csv = await fetch('/api/v1/sessions/abc/export/csv', {\n  headers: { 'Authorization': 'Bearer jwt...' }\n});`, evidence: "Sofia verified: 5,000-row export with all summary tiers completed in 800ms." },
      { need: "Regulatory compliance requires full audit export of citizen consultation data.", outcome: "Complete dataset with timestamps, language codes, theme assignments, and confidence scores.", solution: `// Streaming for large datasets\nconst response = await fetch('/api/v1/sessions/abc/export/csv');\nconst reader = response.body.getReader();`, evidence: "Aset confirmed: 500K-row export maintained data integrity. SHA-256 hash reproducible on re-export." },
    ],
  },
];

// Merge PAID_SDKS from sdk-demos.ts (already has 3 NOSE demos each)
const ALL_FUNCTIONS = [
  ...CORE_APIS.map(api => ({ type: "core" as const, ...api })),
  ...SDK_DEMO_DATA.map(sdk => ({ type: "sdk" as const, ...sdk })),
];

export default function ApiPage() {
  const { currentTheme } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // Scroll detail panel into view on mobile when function selected
  useEffect(() => {
    if (selectedId && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId]);

  // Find selected function data
  const selectedCore = CORE_APIS.find(a => a.id === selectedId);
  const selectedSdk = SDK_DEMO_DATA.find(s => s.id === selectedId);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex flex-col md:flex-row min-h-screen">
        {/* LEFT (desktop) / TOP (mobile): Flower Navigation */}
        <div className="w-full md:w-1/2 md:border-r flex flex-col items-center justify-center px-6 py-6">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-3">
            <Link href="/" className="flex items-center gap-1.5 hover:opacity-80">
              <span className="text-sm font-bold" style={{ color: currentTheme.swatch }}>eXeL</span>
              <span className="text-sm font-light" style={{ color: currentTheme.swatch, opacity: 0.7 }}>AI</span>
            </Link>
            <Link href="/" className="text-xs text-muted-foreground hover:text-primary">Home</Link>
          </div>
          <Link href="/api" className="text-sm font-semibold mb-0.5 hover:opacity-80" style={{ color: currentTheme.swatch }}>
            Governance Engine API
          </Link>
          <p className="text-[10px] text-muted-foreground mb-3 italic">3 Core APIs · 9 SDK Functions</p>

          {/* Flower */}
          <ApiFlower
            onSelectFunction={(id) => setSelectedId(selectedId === id ? null : id)}
          />

          {/* Core API quick links */}
          <div className="flex gap-3 mt-4">
            {CORE_APIS.map(api => (
              <button
                key={api.id}
                onClick={() => setSelectedId(selectedId === api.id ? null : api.id)}
                className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                  selectedId === api.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {api.icon} {api.name}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-auto pb-6 text-center">
            <p className="text-[9px] text-muted-foreground/40">103 endpoints · 10 cubes · 33 languages</p>
            <p className="text-[9px] text-muted-foreground/40 italic">Where Shared Intention moves at the Speed of Thought</p>
          </div>
        </div>

        {/* RIGHT (desktop) / BOTTOM (mobile): Documentation */}
        <div ref={detailRef} className="w-full md:w-1/2 px-6 md:px-10 py-8 md:py-12 overflow-y-auto flex flex-col items-center">
          {!selectedId ? (
            <div className="flex items-center justify-center h-full w-full">
              <div className="text-center space-y-4 max-w-lg px-4">
                <div className="text-4xl">◬</div>
                <h1 className="text-2xl font-bold">Governance Engine API</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  9 SDK functions and 3 core APIs that power governance at the speed of thought.
                  Select a function on the flower to explore its documentation, use cases, and live examples.
                </p>
                <p className="text-xs text-muted-foreground/60 italic">
                  &quot;The future does not belong to the most powerful intelligence.
                  It belongs to those who master its direction.&quot;
                </p>
              </div>
            </div>
          ) : selectedCore ? (
            /* Core API Detail */
            <div className="w-full max-w-lg animate-in fade-in duration-300 space-y-6">
              <div>
                <p className="text-xs text-muted-foreground/40 font-mono mb-4">{selectedCore.endpoint}</p>
                <h1 className="text-2xl font-bold">{selectedCore.icon} {selectedCore.name}</h1>
                <p className="text-sm italic mt-1" style={{ color: currentTheme.swatch, opacity: 0.8 }}>{selectedCore.tagline}</p>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">{selectedCore.description}</p>
              <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-mono w-fit">{selectedCore.cost}</div>

              {/* 3 NOSE Demos */}
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Use Cases</p>
                {selectedCore.demos.map((demo, i) => (
                  <details key={i} className="rounded-xl border bg-card overflow-hidden">
                    <summary className="px-5 py-3 cursor-pointer hover:bg-accent/30 text-sm font-medium">
                      {demo.need.slice(0, 70)}...
                    </summary>
                    <div className="px-5 pb-5 pt-2 space-y-3 border-t">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Need</p>
                        <p className="text-sm text-foreground/80">{demo.need}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outcome</p>
                        <p className="text-sm text-foreground/80">{demo.outcome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Solution</p>
                        <pre className="text-xs bg-muted/50 rounded-lg p-3 font-mono text-muted-foreground overflow-x-auto">{demo.solution}</pre>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Evidence</p>
                        <p className="text-xs text-foreground/60 italic">{demo.evidence}</p>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : selectedSdk ? (
            /* SDK Function Detail */
            <div className="w-full max-w-lg animate-in fade-in duration-300 space-y-6">
              <div>
                <p className="text-xs text-muted-foreground/40 font-mono mb-4">sdk.{selectedSdk.name}()</p>
                <h1 className="text-2xl font-bold">{selectedSdk.icon} {selectedSdk.name}</h1>
                <p className="text-sm italic mt-1" style={{ color: currentTheme.swatch, opacity: 0.8 }}>{selectedSdk.tagline}</p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-xs font-mono w-fit ${
                selectedSdk.cost.includes("Free")
                  ? "bg-green-500/10 text-green-400"
                  : "bg-primary/10 text-primary"
              }`}>{selectedSdk.cost}</div>

              {/* 3 NOSE Demos */}
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Use Cases</p>
                {selectedSdk.demos.map((demo, i) => (
                  <details key={i} className="rounded-xl border bg-card overflow-hidden" open={i === 0}>
                    <summary className="px-5 py-3 cursor-pointer hover:bg-accent/30 flex items-center gap-2">
                      <span className="text-sm font-medium">{demo.master}</span>
                      <span className="text-xs text-muted-foreground">— {demo.masterTitle}</span>
                    </summary>
                    <div className="px-5 pb-5 pt-2 space-y-3 border-t">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Need</p>
                        <p className="text-sm text-foreground/80">{demo.need}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Outcome</p>
                        <p className="text-sm text-foreground/80">{demo.outcome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Solution</p>
                        <pre className="text-xs bg-muted/50 rounded-lg p-3 font-mono text-muted-foreground overflow-x-auto">{demo.solution}</pre>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Evidence</p>
                        <p className="text-xs text-foreground/60 italic">{demo.evidence}</p>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
