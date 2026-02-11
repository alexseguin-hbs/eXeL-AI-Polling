# Cube Mapping from v04.2 Monolith

Maps each section of `eXeL-AI_Polling_v04.2.py` to the target cube service,
showing how the monolith decomposes into the modular architecture.

---

## Monolith → Cube Service Mapping

| v04.2.py Section | Lines | Target Cube | Service | What Changes |
|-----------------|-------|-------------|---------|-------------|
| OPENAI API KEY + MODEL | 1–20 | Cube 6 | AI Provider Abstraction | Move to config; multi-provider interface; circuit breaker |
| FILE PATHS + folder setup | 22–33 | Cube 4 | Collection Service | Eliminate filesystem; use Postgres + MongoDB + Redis |
| LOAD & MERGE (CSV read + entry split) | 35–54 | Cube 1 + Cube 4 | Session + Collection | Session creates context; Collector ingests via API |
| SUMMARIZATION FUNCTIONS | 56–73 | Cube 6 | AI Theming Engine | Batch API calls; eliminate row-by-row; async worker |
| ADD SUMMARIES (333→111→33) | 75–97 | Cube 6 | Summarization Pipeline | Stream through pipeline; no CSV intermediates |
| CLASSIFY THEMES (Theme01) | 99–130 | Cube 6 | Classification Engine | Batch classification; confidence threshold logic |
| SPLIT INTO RISK/SUPPORT/NEUTRAL | 132–138 | Cube 4 + Cube 6 | Collection + Classification | In-memory partition; store classification in Postgres |
| RANDOM SAMPLES | 140–151 | Cube 6 | Sampling Service | Statistical sampling; configurable sample size |
| TXT CLEANUP | 153–164 | — | ELIMINATED | No disk-based text cleanup needed |
| GENERATE SECONDARY THEMES (R/S/N) | 166–252 | Cube 6 | Theme02 Generator | Unified function (not 3 copies); batch processing |
| MERGE SECONDARY THEMES | 254–281 | Cube 6 | Theme Consolidation | In-memory aggregation; no file I/O |
| REDUCE TO 9, 6, 3 THEMES | 283–327 | Cube 6 | Theme Reduction Engine | Hierarchical reduction; deterministic ordering |
| ASSIGN GENERATED THEMES | 329–400 | Cube 6 | Theme Assignment | Batch assignment with embeddings; not per-row API calls |
| SAVE FINAL FILE | 402–405 | Cube 9 | Export Service | CSV/PDF export on demand; Postgres as source of truth |
| GENERATE REPORT | 407–515 | Cube 9 | Reporting Engine | Dynamic report generation; template-based; live data |

---

## Dependency Graph

```
Cube 1 (Session) ──creates──→ Session Context
       │
       ▼
Cube 2 (Text Input) ──validates──→ Raw Responses
       │
       ▼
Cube 4 (Collector) ──aggregates──→ MongoDB + Redis
       │
       ▼
Cube 5 (Orchestrator) ──triggers──→ AI Pipeline
       │
       ▼
Cube 6 (AI Theming) ──produces──→ Themes + Classifications
  │  ├─ Batch Embeddings (async worker fleet)
  │  ├─ MiniBatchKMeans Clustering (deterministic)
  │  ├─ Summarization (333→111→33)
  │  ├─ Theme01 Classification (Risk/Support/Neutral)
  │  ├─ Theme02 Generation (per category, batched)
  │  └─ Theme Reduction (9→6→3)
  │
  ▼
Cube 7 (Ranking) ──aggregates──→ Prioritized Themes
  │  ├─ Quadratic vote normalization
  │  ├─ Deterministic aggregation
  │  └─ Governance weight damping
  │
  ▼
Cube 8 (Tokens) ──calculates──→ Token Ledger
  │  ├─ SI from time tracking
  │  ├─ Governance compression
  │  └─ Treasury accounting
  │
  ▼
Cube 9 (Reports) ──exports──→ CSV / PDF / Dashboard
       │
       ▼
Cube 10 (Simulation) ──replays──→ Metrics Comparison
```

---

## Key Refactoring Decisions

### 1. Eliminate Row-by-Row OpenAI Calls
**v04.2 pattern:** Loop over each row, call `openai.ChatCompletion.create()` per response.
**Target:** Batch embeddings via `openai.embeddings.create()` with batches of 100–2000 texts.
Use async workers to parallelize across batches.

### 2. Eliminate Filesystem Intermediates
**v04.2 pattern:** Write CSV after every stage (entries, samples, themes, reduced themes).
**Target:** Stream all data through in-memory pipeline. Persist only to Postgres/MongoDB.
Export to CSV/PDF only on explicit user request (Cube 9).

### 3. Unify Duplicate Functions
**v04.2 pattern:** `prompt_openai_R()`, `prompt_openai_S()`, `prompt_openai_N()` are identical
except for the word "RISK" / "SUPPORT" / "NEUTRAL" in the prompt.
**Target:** Single `generate_secondary_themes(category, data)` function with parameterized prompt.

### 4. Deterministic Clustering
**v04.2 pattern:** No clustering — uses OpenAI chat to "generate themes" non-deterministically.
**Target:** Replace with MiniBatchKMeans on embeddings with fixed `random_state`.
Use OpenAI only for generating human-readable theme labels from cluster centroids.

### 5. Streaming Theme Updates
**v04.2 pattern:** Full re-clustering after every batch.
**Target:** MiniBatchKMeans `partial_fit()` for incremental updates.
Track centroid drift via cosine similarity (see Token_Governance_Math.md Section 7).

### 6. Confidence from Embeddings, Not Chat
**v04.2 pattern:** Ask OpenAI to self-report confidence (unreliable, non-deterministic).
**Target:** Compute confidence from:
- Distance to nearest cluster centroid (closer = higher confidence)
- Cluster density / spread
- Classification margin (distance between top-2 cluster assignments)

```python
confidence = 1 - (distance_to_centroid / max_distance_in_cluster)
```

---

## v04.2 Output Schema → Database Schema Mapping

| v04.2 CSV Column | Target Table | Target Column(s) |
|-----------------|-------------|-------------------|
| Q_Number | questions | id |
| Question | questions | question_text |
| User | participants | user_id / anon_hash |
| Detailed_Results | responses (MongoDB) | raw_text |
| 333_Summary | response_summaries | summary_333 |
| 111_Summary | response_summaries | summary_111 |
| 33_Summary | response_summaries | summary_33 |
| Theme01 | response_meta | theme01_label |
| Theme01_Confidence | response_meta | theme01_confidence |
| Theme2_9 | response_meta | theme02_9_label |
| Theme2_9_Confidence | response_meta | theme02_9_confidence |
| Theme2_6 | response_meta | theme02_6_label |
| Theme2_6_Confidence | response_meta | theme02_6_confidence |
| Theme2_3 | response_meta | theme02_3_label |
| Theme2_3_Confidence | response_meta | theme02_3_confidence |

---

## Cube Version Contract

Each cube exposes:
- **Input schema** (what it expects from upstream)
- **Output schema** (what it produces for downstream)
- **Version hash** (SHA-256 of code + config + dependency versions)

Version hash is included in:
- Token ledger entries
- Reproducibility hashes
- Simulation comparison reports
