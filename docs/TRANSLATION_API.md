# Translation API — Sacred Text Translation at Scale

## Vision

A production API that translates any book, document, or sacred text into multiple languages simultaneously using parallel AI agents. Designed for the Divinity Guide but architected to serve all humanity — any author, any book, any language.

## Architecture

```
                    ┌─────────────────────┐
                    │   Translation API    │
                    │   POST /v1/translate │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Orchestrator       │
                    │   (Master of Thought)│
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
    ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
    │  Agent 1   │       │  Agent 2   │       │  Agent N   │
    │  (Enki)    │       │  (Aset)    │       │  (Krishna) │
    │  Spanish   │       │  Ukrainian │       │  Portuguese│
    └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
          │                    │                    │
    Page-by-page         Page-by-page         Page-by-page
    translation          translation          translation
          │                    │                    │
    ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
    │ /es/01.01 │       │ /uk/01.01 │       │ /pt/01.01 │
    │ /es/01.02 │       │ /uk/01.02 │       │ /pt/01.02 │
    │ /es/...   │       │ /uk/...   │       │ /pt/...   │
    └─────┬─────┘       └─────┬─────┘       └─────┬─────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Aggregator        │
                    │   Merge → JSON      │
                    │   Validate → Push   │
                    └─────────────────────┘
```

## API Specification

### 1. Submit Translation Job

```
POST /api/v1/translate
Authorization: Bearer exel_pk_...
Content-Type: application/json

{
  "source_file": "divinity-pages.json",
  "source_language": "en",
  "target_languages": ["es", "uk", "ru", "zh", "fa", "he", "pt"],
  "style": "sacred",
  "parallelism": "max",
  "page_structure": {
    "id_field": "id",
    "text_field": "text",
    "preserve_fields": ["chapter", "page", "gated"]
  },
  "terminology": {
    "Master of Thought": {
      "es": "Maestro del Pensamiento",
      "uk": "Майстер Думки",
      "ru": "Мастер Мысли",
      "zh": "思想大师",
      "fa": "استاد اندیشه",
      "he": "אדון המחשבה",
      "pt": "Mestre do Pensamento"
    },
    "Divinity Guide": {
      "es": "Guía de la Divinidad",
      "uk": "Путівник Божественності",
      "ru": "Путеводитель Божественности",
      "zh": "神圣指南",
      "fa": "راهنمای الهی",
      "he": "מדריך האלוהות",
      "pt": "Guia da Divindade"
    }
  },
  "preserve_patterns": ["•••", "✦", "♡", "◬", "웃", "http*", "🙏", "💫", "💡"],
  "webhook_url": "https://your-app.com/translation-complete"
}
```

### Response

```json
{
  "job_id": "tj-2026-04-10-001",
  "status": "processing",
  "total_pages": 185,
  "total_languages": 7,
  "total_translations": 1295,
  "agents_deployed": 7,
  "estimated_time_minutes": 30,
  "progress_url": "/api/v1/translate/tj-2026-04-10-001/progress",
  "cost_estimate": "45.5 ◬"
}
```

### 2. Check Progress (Real-time)

```
GET /api/v1/translate/{job_id}/progress

{
  "job_id": "tj-2026-04-10-001",
  "status": "processing",
  "languages": {
    "es": { "agent": "Enki",    "completed": 42, "total": 185, "percent": 23 },
    "uk": { "agent": "Aset",    "completed": 38, "total": 185, "percent": 21 },
    "ru": { "agent": "Asar",    "completed": 35, "total": 185, "percent": 19 },
    "zh": { "agent": "Pangu",   "completed": 30, "total": 185, "percent": 16 },
    "fa": { "agent": "Sofia",   "completed": 28, "total": 185, "percent": 15 },
    "he": { "agent": "Christo", "completed": 25, "total": 185, "percent": 14 },
    "pt": { "agent": "Krishna", "completed": 22, "total": 185, "percent": 12 }
  },
  "overall_percent": 17,
  "pages_per_minute": 14.2,
  "eta_minutes": 18
}
```

### 3. WebSocket Progress Stream

```
WS /api/v1/translate/{job_id}/stream

// Server sends events as each page completes:
{ "event": "page_complete", "language": "es", "page_id": "01.01", "agent": "Enki" }
{ "event": "page_complete", "language": "uk", "page_id": "01.01", "agent": "Aset" }
{ "event": "language_complete", "language": "es", "pages": 185, "agent": "Enki" }
{ "event": "job_complete", "languages": 7, "pages": 1295, "duration_seconds": 1842 }
```

### 4. Download Translations

```
GET /api/v1/translate/{job_id}/download/{language}
→ Returns: {language}-translated.json

GET /api/v1/translate/{job_id}/download/all
→ Returns: ZIP of all language files
```

### 5. Spot-Check / Quality Review

```
GET /api/v1/translate/{job_id}/review/{language}?sample=5

{
  "language": "es",
  "samples": [
    {
      "page_id": "01.01",
      "original": "Thought is not an echo in the mind...",
      "translated": "El pensamiento no es un eco en la mente...",
      "quality_score": 0.94
    }
  ]
}
```

## Scaling Strategy

### Page-by-Page Architecture

Each page is an independent translation unit:
- **Input**: Single page text (1-3 paragraphs, ~500-2000 chars)
- **Output**: Single translated text file (`/translations/{lang}/{page_id}.txt`)
- **Aggregation**: Merge all page files into final JSON after all complete

This enables:
- **Visible progress**: Each page saved immediately, progress trackable in real-time
- **Fault tolerance**: If an agent fails, only that page needs retry (not the whole book)
- **Parallelism**: N agents × N languages = N² parallel translation streams
- **Resume**: Restart from last completed page, not from scratch

### Agent Deployment Model

```
Book Size    │ Agents per Language │ Total Agents │ Est. Time
─────────────┼─────────────────────┼──────────────┼──────────
< 50 pages   │ 1                   │ 7            │ 5 min
50-200 pages │ 1                   │ 7            │ 30 min
200-500      │ 2 (forward+backward)│ 14           │ 25 min
500-1000     │ 4 (chunked)         │ 28           │ 30 min
1000+        │ 8 (sharded)         │ 56           │ 35 min
```

### Terminology Consistency

The `terminology` object in the request ensures key terms are translated consistently across all pages:
- Loaded into each agent's system prompt
- Applied as find-replace after initial translation
- Verified in aggregation step

### Quality Tiers

| Tier | Method | Speed | Quality | Cost |
|------|--------|-------|---------|------|
| **Draft** | AI translation, no review | Fast | Good | 1◬/page |
| **Refined** | AI translation + consistency pass | Medium | Very Good | 2◬/page |
| **Sacred** | AI translation + style matching + spot-check | Slower | Excellent | 5◬/page |
| **Human-Verified** | AI draft + human review queue | Days | Perfect | 10◬/page |

### Style Profiles

```json
{
  "sacred": "Reverent, poetic, mystical. Draw on the target language's spiritual literary tradition.",
  "academic": "Precise, formal, technical. Preserve citations and references.",
  "conversational": "Natural, warm, accessible. Adapt idioms to target culture.",
  "legal": "Exact, unambiguous, preserving legal terms in both languages.",
  "children": "Simple, clear, engaging. Age-appropriate vocabulary."
}
```

## Supported Languages (Phase 1)

| Code | Language | Script | Direction | Spiritual Tradition |
|------|----------|--------|-----------|-------------------|
| en | English | Latin | LTR | Universal |
| es | Spanish | Latin | LTR | Catholic mysticism |
| uk | Ukrainian | Cyrillic | LTR | Orthodox spirituality |
| ru | Russian | Cyrillic | LTR | Orthodox/Tolstoy tradition |
| zh | Chinese | Hanzi | LTR | Buddhist/Taoist wisdom |
| fa | Persian | Arabic | RTL | Sufi/Rumi mysticism |
| he | Hebrew | Hebrew | RTL | Kabbalistic tradition |
| pt | Portuguese | Latin | LTR | Brazilian spiritualism |

### Phase 2 Languages (planned)

Arabic (ar), Hindi (hi), Japanese (ja), Korean (ko), Turkish (tr), Swahili (sw), French (fr), German (de), Italian (it), Thai (th), Vietnamese (vi), Polish (pl), Greek (el), Tamil (ta), Urdu (ur)

## Aggregation Script

After all page-by-page translations complete, merge into final JSON:

```javascript
// merge-translations.js
const fs = require('fs');
const en = require('./divinity-pages.json');

function mergeLanguage(langCode) {
  const dir = `./translations/${langCode}`;
  const result = en.map(page => {
    const file = `${dir}/${page.id}.txt`;
    try {
      const translated = fs.readFileSync(file, 'utf8');
      return { ...page, text: translated };
    } catch {
      console.warn(`Missing: ${langCode}/${page.id} — using English fallback`);
      return page; // fallback to English
    }
  });
  fs.writeFileSync(`./divinity-pages-${langCode}.json`, JSON.stringify(result, null, 2));
  console.log(`${langCode}: ${result.length} pages merged`);
}

['es','uk','ru','zh','fa','he','pt'].forEach(mergeLanguage);
```

## Cost Model

```
Translation cost = pages × languages × tier_multiplier × ◬_per_page

Example (Divinity Guide):
  185 pages × 7 languages × Sacred tier (5◬) = 6,475 ◬
  
At scale (1000-page book × 15 languages):
  1000 × 15 × Draft tier (1◬) = 15,000 ◬
```

## Webhook Events

```json
{
  "event": "translation.page.complete",
  "job_id": "tj-2026-04-10-001",
  "language": "es",
  "page_id": "07.06",
  "agent": "Enki",
  "timestamp": "2026-04-10T21:15:42Z"
}

{
  "event": "translation.language.complete",
  "job_id": "tj-2026-04-10-001",
  "language": "es",
  "pages_translated": 185,
  "duration_seconds": 1842,
  "agent": "Enki"
}

{
  "event": "translation.job.complete",
  "job_id": "tj-2026-04-10-001",
  "languages_completed": 7,
  "total_pages": 1295,
  "download_url": "/api/v1/translate/tj-2026-04-10-001/download/all"
}
```

## Integration with eXeL-AI Platform

This Translation API becomes **SDK function #10** in the Governance Engine:

```javascript
// sdk.translate() — Translate any document at scale
const job = await sdk.translate({
  source: myBookJSON,
  languages: ["es", "uk", "ru", "zh", "fa", "he", "pt"],
  style: "sacred",
  terminology: myGlossary,
  onProgress: (event) => console.log(`${event.language}: ${event.percent}%`),
  onComplete: (result) => console.log(`Done: ${result.download_url}`)
});
```

## First Deployment: The Divinity Guide

The Divinity Guide is the first book translated through this pipeline:
- **185 pages** × **7 languages** = **1,295 translations**
- **12 Ascended Master agents** working in parallel
- **Page-by-page** saves for real-time progress visibility
- **Sacred style** tier with Rumi/Hafez tradition for Farsi, Kabbalistic for Hebrew
- Delivered as in-app language dropdown for side-by-side bilingual reading

---

*"Where Shared Intention moves at the Speed of Thought — in every language."*
