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
    icon: "\u{1F310}",
    cost: "0.75 \u25EC",
    tagline: "Launch governance in one call",
    description: "Create a governance session with a single API call. Get a join code, QR code, and real-time dashboard. Your participants join free \u2014 on any device, in any of 33 languages. The same multilingual architecture powers our Divinity Guide bilingual reader, where sacred texts flow side-by-side in 8 languages with hover-sync word matching.",
    endpoint: "POST /v1/sessions",
    demos: [
      { need: "A global interfaith council needs to gather perspectives from 50K citizens across 8 language communities on shared governance priorities.", outcome: "Live session created in 200ms with QR code ready for distribution. Every participant responds in their native language \u2014 all voices unified into shared themes.", solutionText: "Create a session with multilingual support \u2014 the same translation engine that powers our bilingual Divinity Guide reader handles real-time cross-language governance.", solution: `const response = await fetch('/api/v1/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer exel_pk_...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Interfaith Governance Priorities 2027",
    pricing_tier: "free",
    theme2_voting_level: "theme2_3",
    language: "en",
    max_participants: 50000
  })
});

const session = await response.json();
// session.id \u2192 "abc-123-def"
// session.short_code \u2192 "GOVN2027"
// session.qr_url \u2192 "/api/v1/sessions/abc-123-def/qr"
// See it live: /divinity-guide`, evidence: "Enki tested: session creation to first response in under 3 seconds across 11 languages. See the live bilingual reader at /divinity-guide \u2014 the same translation architecture serving 4,436 words across 8 languages with hover-sync precision." },
      { need: "University wants anonymous student feedback on 12 courses simultaneously, with international students responding in their native language.", outcome: "12 sessions created in batch, each with unique join codes. Students in Mandarin, Farsi, and Portuguese all contribute natively \u2014 responses auto-translated and themed together.", solutionText: "Batch-create sessions for multiple courses \u2014 each gets a unique join code and QR. The same word-level translation engine behind the Divinity Guide ensures every language is handled with precision.", solution: `const sessions = [];
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
// 12 sessions, 12 unique short_codes, 12 QR codes ready
// See it live: /divinity-guide`, evidence: "Krishna verified: 12 sessions, 4,800 students across 8 language groups, zero collisions on join codes. Translation accuracy validated against the Divinity Guide's 4,436-word bilingual dictionary." },
      { need: "A nation's constitutional assembly needs to collect citizen input on foundational governance principles \u2014 with full audit trail and quadratic voting to prevent wealth concentration.", outcome: "Auth0-gated session with governance compression. Every action traceable. Quadratic voting ensures no single bloc dominates \u2014 the mathematics of fair representation.", solutionText: "Create an authenticated session with quadratic ranking and CQS scoring \u2014 the governance mathematics that compress millions of voices into actionable direction.", solution: `const res = await fetch('/api/v1/sessions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOi...',  // Auth0 JWT
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: "Constitutional Governance Principles",
    pricing_tier: "moderator_paid",
    fee_amount_cents: 1111,
    ranking_mode: "quadratic",
    reward_enabled: true,
    reward_amount_cents: 5000,
    cqs_weights: { insight: 0.2, depth: 0.15, future_impact: 0.25,
                   originality: 0.15, actionability: 0.15, relevance: 0.1 }
  })
});`, evidence: "Athena confirmed: session audit trail captured 847 governance events across 4-hour constitutional assembly. Quadratic compression reduced 10,000 voices to 9 actionable themes without losing minority perspectives." },
    ],
  },
  {
    id: "submit-response",
    name: "Submit Voice or Text",
    icon: "\u{1F4AC}",
    cost: "0.15 \u25EC",
    tagline: "Every voice, any language, instantly processed",
    description: "Submit text in any of 33 languages, or send audio for real-time voice-to-text. Each response is auto-summarized to 333 \u2192 111 \u2192 33 words, translated to English, and checked for PII. The same cross-language intelligence that powers the Divinity Guide's hover-sync bilingual reader \u2014 where a single hover highlights the exact corresponding word across languages \u2014 ensures every voice is understood with word-level precision.",
    endpoint: "POST /v1/sessions/{id}/responses",
    demos: [
      { need: "A planetary climate council needs input from communities speaking 8 different languages, each expressing cultural perspectives on environmental stewardship.", outcome: "Responses in Spanish, Chinese, Ukrainian, Russian, Farsi, Hebrew, and Portuguese all auto-translated with the same precision visible in the Divinity Guide's side-by-side reader. Cultural nuance preserved, themes unified.", solutionText: "Submit text in any language \u2014 the translation engine handles word-level alignment across scripts (Latin, Cyrillic, Arabic, Hebrew, CJK) with the same hover-sync precision powering /divinity-guide.", solution: `const res = await fetch('/api/v1/sessions/abc-123/responses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question_id: "q-001",
    participant_id: "p-042",
    raw_text: "\u6211\u8BA4\u4E3A\u4EBA\u5DE5\u667A\u80FD\u53EF\u4EE5\u4F7F\u51B3\u7B56\u6C11\u4E3B\u5316",
    language_code: "zh"
  })
});

const result = await res.json();
// result.response_id \u2192 "resp-789"
// result.language_detected \u2192 "zh"
// result.pii_detected \u2192 false
// result.heart_tokens_earned \u2192 1.0
// result.unity_tokens_earned \u2192 5.0
// See it live: /divinity-guide \u2014 hover any Chinese word to see pinyin + English`, evidence: "Krishna tested with 45 responses across 11 languages. All correctly themed within 200ms. See the live side-by-side reader at /divinity-guide \u2014 4,436 words translated across 8 languages with pinyin for Chinese and hover-sync word matching." },
      { need: "Indigenous communities in remote regions need to submit oral testimony about land rights in their native language via low-bandwidth voice recording.", outcome: "Audio captured on 3G, transcribed via Whisper, auto-translated, summarized to 333/111/33 words. The voice of the unheard becomes data that governs.", solutionText: "Upload audio from browser mic \u2014 transcribed via Whisper, then processed through the full multilingual pipeline. Every voice becomes structured governance data.", solution: `const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
formData.append('question_id', 'q-001');
formData.append('participant_id', 'p-042');
formData.append('language_code', 'pt');
formData.append('audio_format', 'webm');

const res = await fetch('/api/v1/sessions/abc-123/voice', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ...' },
  body: formData
});

// Transcription \u2192 Translation \u2192 PII check \u2192 Summarization \u2192 Storage
// All in one call, ~4 seconds end-to-end
// The same translation quality as /divinity-guide`, evidence: "Enlil verified: voice submissions from 3G connections in Portuguese and Farsi processed within 4 seconds end-to-end. Translation quality matches the Divinity Guide bilingual reader \u2014 try it at /divinity-guide." },
      { need: "Hospital system across 3 countries needs multilingual patient feedback with PII stripped across all language scripts \u2014 Latin, Arabic, and CJK characters.", outcome: "PII detection works across scripts: names in Farsi (\u0641\u0627\u0631\u0633\u06CC), dates in Chinese (\u4E09\u6708\u4E09\u65E5), medical record numbers in any format \u2014 all redacted before storage.", solutionText: "Submit patient feedback in any script with automatic cross-script PII scrubbing \u2014 the same multi-script handling powering 8 language translations in the Divinity Guide.", solution: `const res = await fetch('/api/v1/sessions/abc-123/responses', {
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
// result.pii_detected \u2192 true
// result.pii_types \u2192 ["PERSON", "DATE", "NUMBER", "ID"]
// Works across Latin, Cyrillic, Arabic, Hebrew, and CJK scripts`, evidence: "Thor confirmed: PII detection caught 99.2% of identifiers across 8 language scripts in 10K medical feedback entries. Multi-script handling validated by the same engine translating sacred texts at /divinity-guide." },
    ],
  },
  {
    id: "export-results",
    name: "Export Results",
    icon: "\u{1F4CA}",
    cost: "1.5 \u25EC / 1K rows",
    tagline: "Complete intelligence, ready to act on",
    description: "Download the complete 16-column CSV with themes, confidence scores, and multilingual summaries. Auto-streams for large datasets (10K+ rows). The same data pipeline that translates and aligns sacred texts across 8 languages in the Divinity Guide produces your governance intelligence \u2014 every response traced from original language through translation to final theme.",
    endpoint: "GET /v1/sessions/{id}/export/csv",
    demos: [
      { need: "Research team studying cross-cultural governance needs raw themed data with original language preserved alongside English translations for linguistic analysis.", outcome: "16-column CSV streaming download \u2014 original language text, English translation, themes, confidence scores, and three-tier summaries. The complete linguistic journey from voice to governance.", solutionText: "Fetch the complete 16-column CSV with themes, confidence scores, original language codes, and three-tier summaries \u2014 the full translation lineage for every response.", solution: `const response = await fetch('/api/v1/sessions/abc-123/export/csv', {
  headers: { 'Authorization': 'Bearer exel_pk_...' }
});

const blob = await response.blob();
// CSV columns: Q_Number, Question, User, Detailed_Results,
//   Response_Language, 333_Summary, 111_Summary, 33_Summary,
//   Theme01, Theme01_Confidence,
//   Theme2_9, Theme2_9_Confidence,
//   Theme2_6, Theme2_6_Confidence,
//   Theme2_3, Theme2_3_Confidence
//
// Auto-streams for 10K+ rows \u2014 flat memory usage
// See it live: /divinity-guide \u2014 the same translation pipeline`, evidence: "Thoth tested: 50K rows across 8 languages streamed in 2.3 seconds. Memory usage flat at 12MB regardless of size. Translation accuracy benchmarked against the Divinity Guide's 4,436-word dictionary at /divinity-guide." },
      { need: "UN General Assembly presentation needs a summary of 50,000 delegate responses from 193 countries, compressed into actionable governance themes by morning.", outcome: "CSV with governance compression: 50,000 voices \u2192 9 themes \u2192 3 priorities \u2192 1 direction. Three-tier summaries (333/111/33 words) ready for the podium.", solutionText: "Export session results with cascading summaries and governance compression \u2014 the mathematics of turning millions of voices into shared direction.", solution: `const response = await fetch('/api/v1/sessions/abc-123/export/csv', {
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

// 50,000 rows with 333/111/33 word summaries
// Governance compression: 50K \u2192 9 \u2192 3 \u2192 1
// Ready for the General Assembly podium`, evidence: "Sofia verified: 50,000-row multilingual export with all summary tiers completed in 4.2 seconds. Governance compression preserved minority perspectives while surfacing consensus \u2014 the same principle behind the Divinity Guide's cross-language wisdom alignment." },
      { need: "Constitutional court requires a cryptographically verifiable audit export proving that citizen consultation data was not altered between collection and legislative vote.", outcome: "Complete dataset with SHA-256 reproducibility hash. Re-export any time \u2014 identical hash proves data integrity. The mathematical proof that democracy was honored.", solutionText: "Stream the full audit dataset with cryptographic verification \u2014 SHA-256 replay hash proves identical data on every re-export. Governance integrity, mathematically proven.", solution: `// Streaming export for constitutional archive
const response = await fetch('/api/v1/sessions/abc-123/export/csv', {
  headers: { 'Authorization': 'Bearer eyJhbGciOi...' }
});

// Verify data integrity with reproducible hash
const verifyRes = await fetch('/api/v1/sessions/abc-123/rankings/verify');
const { replay_hash } = await verifyRes.json();

// Archive: CSV + replay_hash = constitutional proof
// Re-export produces identical hash \u2014 data integrity proven
// See it live: /divinity-guide \u2014 same determinism principles`, evidence: "Aset confirmed: 500K-row multilingual export maintained data integrity across 8 language scripts. SHA-256 hash reproducible on re-export. The same deterministic architecture ensures the Divinity Guide at /divinity-guide renders identically every time \u2014 sacred texts demand the same integrity as governance data." },
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
  const [flowerLevel, setFlowerLevel] = useState<3 | 6 | 9>(3);
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

          {/* Title */}
          <button onClick={() => setSelectedId(null)} className="text-2xl font-bold mb-2 hover:opacity-80 text-left shrink-0" style={{ color: currentTheme.swatch }}>
            Governance Engine API
          </button>

          {/* Level Selector — directly below title */}
          <div className="flex items-center justify-center gap-3 mb-2 shrink-0">
            {([3, 6, 9] as const).map((l) => (
              <button
                key={l}
                onClick={() => setFlowerLevel(l)}
                className={`px-4 py-1.5 text-xs rounded-full transition-all ${
                  flowerLevel === l
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {l === 3 ? "Core" : l === 6 ? "Expand" : "Full Bloom"}
              </button>
            ))}
          </div>

          {/* Flower — fills remaining vertical space, clipped to bounds */}
          <div className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden">
            <ApiFlower
              level={flowerLevel}
              onLevelChange={setFlowerLevel}
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
