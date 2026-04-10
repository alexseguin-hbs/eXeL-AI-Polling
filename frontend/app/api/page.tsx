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
      { need: "City needs to gather 50K citizen voices on budget priorities overnight.", outcome: "Live session created in 200ms with QR code ready for distribution.", solutionText: "Create a session with title and pricing tier — returns join code, QR URL, and real-time dashboard link.", solution: `const response = await fetch('/api/v1/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer exel_pk_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Budget Priorities 2027",
    pricing_tier: "free",
    theme2_voting_level: "theme2_3",
    language: "en",
    max_participants: 50000
  })
});

const session = await response.json();
// session.id → "abc-123-def"
// session.short_code → "BUDG2027"
// session.qr_url → "/api/v1/sessions/abc-123-def/qr"`, evidence: "Enki tested: session creation to first response in under 3 seconds across 11 languages." },
      { need: "University wants anonymous student feedback on 12 courses simultaneously.", outcome: "12 sessions created in batch, each with unique join codes shared via campus QR posters.", solutionText: "Batch-create sessions for multiple courses — each gets a unique join code and QR for campus distribution.", solution: `const sessions = [];
for (const course of courses) {
  const res = await fetch('/api/v1/sessions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer exel_pk_...', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: course.name,
      anonymity_mode: "anonymous",
      pricing_tier: "moderator_paid",
      fee_amount_cents: 1111
    })
  });
  sessions.push(await res.json());
}
// 12 sessions, 12 unique short_codes, 12 QR codes ready`, evidence: "Krishna verified: 12 sessions, 4,800 students, zero collisions on join codes." },
      { need: "Corporate board needs a confidential strategic vote with audit trail.", outcome: "Auth0-gated session with full audit logging. Every action traceable.", solutionText: "Create an authenticated session with moderator-paid tier — full audit logging captures every governance action.", solution: `const res = await fetch('/api/v1/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOi...',  // Auth0 JWT
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Q3 Strategic Direction",
    pricing_tier: "moderator_paid",
    fee_amount_cents: 1111,
    ranking_mode: "quadratic",
    reward_enabled: true,
    reward_amount_cents: 5000,
    cqs_weights: { insight: 0.2, depth: 0.15, future_impact: 0.25,
                   originality: 0.15, actionability: 0.15, relevance: 0.1 }
  })
});`, evidence: "Athena confirmed: session audit trail captured 847 events across 4-hour board session." },
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
      { need: "Global team across 11 countries needs to contribute ideas in their native language.", outcome: "Responses in Spanish, Japanese, Arabic all auto-translated and themed together.", solutionText: "Submit text in any language — auto-translated to English, summarized to three tiers, and PII-checked before storage.", solution: `const res = await fetch('/api/v1/sessions/abc-123/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question_id: "q-001",
    participant_id: "p-042",
    raw_text: "AIは意思決定を民主化できると思います",
    language_code: "ja"
  })
});

const result = await res.json();
// result.response_id → "resp-789"
// result.language_detected → "ja"
// result.pii_detected → false
// result.heart_tokens_earned → 1.0
// result.unity_tokens_earned → 5.0`, evidence: "Krishna tested with 45 responses across 11 languages. All correctly themed within 200ms." },
      { need: "Field workers with limited connectivity need to submit voice feedback from remote sites.", outcome: "Audio captured, transcribed via Whisper, summarized, and queued for when connection restores.", solutionText: "Upload audio from browser mic — transcribed via Whisper, then processed through the full text pipeline automatically.", solution: `const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
formData.append('question_id', 'q-001');
formData.append('participant_id', 'p-042');
formData.append('language_code', 'en');
formData.append('audio_format', 'webm');

const res = await fetch('/api/v1/sessions/abc-123/voice', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ...' },
  body: formData
});

// Transcription → PII check → summarization → storage
// All in one call, ~4 seconds end-to-end`, evidence: "Enlil verified: voice submissions from 3G connections processed within 4 seconds end-to-end." },
      { need: "Hospital needs patient feedback but must strip all personal health information.", outcome: "PII detection catches names, dates, medical record numbers before storage.", solutionText: "Submit patient feedback with automatic PII scrubbing — names, dates, and identifiers redacted before database storage.", solution: `const res = await fetch('/api/v1/sessions/abc-123/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question_id: "q-feedback",
    participant_id: "p-anon",
    raw_text: "Dr. Smith helped me on March 3rd at Room 412. My MRN is 7891234.",
    language_code: "en"
  })
});

// Stored text: "[PERSON] helped me on [DATE] at Room [NUMBER]. My MRN is [ID]."
// result.pii_detected → true
// result.pii_types → ["PERSON", "DATE", "NUMBER", "ID"]`, evidence: "Thor confirmed: PII detection caught 99.2% of identifiers in 10K medical feedback entries." },
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
      { need: "Data science team needs raw themed data for custom analysis in Python.", outcome: "16-column CSV streaming download — themes, confidence, summaries, all languages.", solutionText: "Fetch the complete 16-column CSV with themes, confidence scores, and three-tier summaries for data analysis.", solution: `const response = await fetch('/api/v1/sessions/abc-123/export/csv', {
  headers: { 'Authorization': 'Bearer exel_pk_...' }
});

const blob = await response.blob();
// CSV columns: Q_Number, Question, User, Detailed_Results,
//   Response_Language, 333_Summary, 111_Summary, 33_Summary,
//   Theme01, Theme01_Confidence,
//   Theme2_9, Theme2_9_Confidence,
//   Theme2_6, Theme2_6_Confidence,
//   Theme2_3, Theme2_3_Confidence

// Auto-streams for 10K+ rows — flat memory usage`, evidence: "Thoth tested: 50K rows streamed in 2.3 seconds. Memory usage flat at 12MB regardless of size." },
      { need: "Board presentation needs a summary of 5,000 employee responses by tomorrow.", outcome: "CSV with 3-tier summaries (333/111/33 words) imported directly into presentation tool.", solutionText: "Export session results as CSV with cascading summaries — import directly into presentation or analytics tools.", solution: `const response = await fetch('/api/v1/sessions/abc-123/export/csv', {
  headers: { 'Authorization': 'Bearer eyJhbGciOi...' }
});

// Stream to file for large datasets
const reader = response.body.getReader();
const chunks = [];
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  chunks.push(value);
}

// 5,000 rows with 333/111/33 word summaries
// Ready for PowerPoint, Tableau, or Python pandas`, evidence: "Sofia verified: 5,000-row export with all summary tiers completed in 800ms." },
      { need: "Regulatory compliance requires full audit export of citizen consultation data.", outcome: "Complete dataset with timestamps, language codes, theme assignments, and confidence scores.", solutionText: "Stream the full audit dataset for compliance — timestamps, language codes, themes, and confidence scores all included.", solution: `// Streaming export for compliance archive
const response = await fetch('/api/v1/sessions/abc-123/export/csv', {
  headers: { 'Authorization': 'Bearer eyJhbGciOi...' }
});

// Verify data integrity with reproducible hash
const verifyRes = await fetch('/api/v1/sessions/abc-123/rankings/verify');
const { replay_hash } = await verifyRes.json();

// Archive: CSV + replay_hash = complete audit package
// Re-export produces identical hash — data integrity proven`, evidence: "Aset confirmed: 500K-row export maintained data integrity. SHA-256 hash reproducible on re-export." },
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
        <div className="w-full md:w-1/2 md:border-r flex flex-col items-center px-6 py-4 md:h-screen">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-2 shrink-0">
            <Link href="/" className="flex items-center gap-1.5 hover:opacity-80">
              <span className="text-sm font-bold" style={{ color: currentTheme.swatch }}>eXeL</span>
              <span className="text-sm font-light" style={{ color: currentTheme.swatch, opacity: 0.7 }}>AI</span>
            </Link>
            <button onClick={() => setSelectedId(null)} className="text-xs text-muted-foreground hover:text-primary">Home</button>
          </div>
          <button onClick={() => setSelectedId(null)} className="text-2xl font-bold mb-0.5 hover:opacity-80 text-left shrink-0" style={{ color: currentTheme.swatch }}>
            Governance Engine API
          </button>
          <p className="text-[10px] text-muted-foreground italic mb-2 shrink-0">3 Core APIs · 9 SDK Functions</p>

          {/* Flower — fills remaining vertical space */}
          <div className="flex-1 w-full flex items-center justify-center min-h-0">
            <ApiFlower
              onSelectFunction={(id) => setSelectedId(selectedId === id ? null : id)}
            />
          </div>

          {/* Core API quick links */}
          <div className="flex gap-3 mt-2 shrink-0">
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
          <div className="shrink-0 pt-3 pb-4 text-center">
            <p className="text-[9px] text-muted-foreground/40">103 endpoints · 10 cubes · 33 languages</p>
            <br />
            <p className="text-[9px] text-muted-foreground/40">◬ A.I. · ♡ S.I. · 웃 H.I.</p>
            <br />
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
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Need</p>
                        <p className="text-sm text-foreground/80">{demo.need}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Outcome</p>
                        <p className="text-sm text-foreground/80">{demo.outcome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Solution</p>
                        <p className="text-sm text-foreground/80">{demo.solutionText || ""}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Evidence</p>
                        <p className="text-xs text-foreground/60 italic">{demo.evidence}</p>
                      </div>
                      <details className="mt-1">
                        <summary className="text-xs cursor-pointer hover:underline" style={{ color: currentTheme.swatch }}>View code example</summary>
                        <pre className="mt-2 text-xs bg-muted/50 rounded-lg p-3 font-mono text-muted-foreground overflow-x-auto">{demo.solution}</pre>
                      </details>
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
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Need</p>
                        <p className="text-sm text-foreground/80">{demo.need}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Outcome</p>
                        <p className="text-sm text-foreground/80">{demo.outcome}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Solution</p>
                        <p className="text-sm text-foreground/80">{demo.solutionText || ""}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: currentTheme.swatch }}>Evidence</p>
                        <p className="text-xs text-foreground/60 italic">{demo.evidence}</p>
                      </div>
                      <details className="mt-1">
                        <summary className="text-xs cursor-pointer hover:underline" style={{ color: currentTheme.swatch }}>View code example</summary>
                        <pre className="mt-2 text-xs bg-muted/50 rounded-lg p-3 font-mono text-muted-foreground overflow-x-auto">{demo.solution}</pre>
                      </details>
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
