# Cube-by-Cube Input / Function / Output Flow Table

> **Last updated:** 2026-02-17
> **Status key:** COMPLETE | PARTIAL | STUB | NOT STARTED

---

## Cube 1 — Session Join & QR `(1,2,2) CENTER` [COMPLETE]

### Inputs
| Input | Source | Type |
|-------|--------|------|
| title, description | Moderator (API) | `str` |
| anonymity_mode | Moderator config | `identified \| anonymous \| pseudonymous` |
| cycle_mode, max_cycles | Moderator config | `single \| multi`, `int` |
| ranking_mode | Moderator config | `auto \| manual` |
| language | Moderator config | `str` (ISO 639-1) |
| max_response_length | Moderator config | `int` (default 500) |
| ai_provider | Moderator config | `openai \| grok \| gemini` |
| seed | Moderator config (optional) | `str \| None` |
| short_code | Join flow | `str` (8-char) |
| user_id, display_name, device_type | Participant join | `str` |

### Functions (21)
| Function | Description | Calls |
|----------|-------------|-------|
| `create_session()` | Create session + QR + join_url | — |
| `get_session_by_id()` | Lookup by UUID | — |
| `get_session_by_short_code()` | Lookup by short code | — |
| `update_session()` | Update draft session config | — |
| `transition_session()` | State machine: draft→open→polling→ranking→closed→archived | Cube 5 `_clear_presence()` |
| `join_session()` | Validate code, create participant, set presence | **Cube 5** `create_login_time_entry()` |
| `list_participants()` | Paginated participant list | — |
| `add_question()` | Add question to session | — |
| `list_questions()` | List session questions | — |
| `get_question()` | Single question lookup | — |
| `generate_qr_png()` | QR code as PNG bytes | — |
| `generate_qr_base64()` | QR code as data URI | — |
| `verify_session_owner()` | Authorization check (403) | — |
| `validate_qr_accessible()` | Expiry + state check (410/409) | — |
| `get_presence()` | Redis HGETALL for active users | — |
| `_generate_short_code()` | 8-char nanoid | — |
| `_generate_unique_short_code()` | Collision retry (5 attempts) | — |
| `_build_join_url()` | Frontend URL construction | — |
| `_set_presence()` | Redis HSET (TTL 3600s) | — |
| `_clear_presence()` | Redis DEL | — |
| `get_participant_count()` | COUNT participants | — |

### Outputs
| Output | Destination | Type |
|--------|-------------|------|
| Session record | Postgres `sessions` | `Session` ORM |
| Participant record | Postgres `participants` | `Participant` ORM |
| QR code | Client (PNG/base64) | `bytes \| str` |
| Join URL | Client | `str` |
| Presence data | Client (via Redis) | `dict` |
| Login time entry + tokens | **Cube 5** → Postgres `time_entries` + `token_ledger` | `TimeEntry` |

### Metrics
| Category | Metric |
|----------|--------|
| System | QR gen time, join rate, WebSocket sync latency, capacity check time |
| User | Language distribution, opt-in rate, join-to-question time, payment conversion |
| Outcome | Sessions completed vs abandoned, avg participants by tier, revenue per session |

---

## Cube 2 — Text Submission Handler `(1,2,3)` [COMPLETE]

### Inputs
| Input | Source | Type |
|-------|--------|------|
| session_id | URL path | `UUID` |
| question_id | Request body | `UUID` |
| participant_id | Request body | `UUID` |
| raw_text | Request body | `str` (1–5000 chars) |
| language_code | Request body | `str` (default "en") |

### Functions (14)
| Function | Description | Calls |
|----------|-------------|-------|
| `validate_session_for_submission()` | Session exists + status == "polling" | — |
| `validate_question()` | Question exists + belongs to session | — |
| `validate_participant()` | Participant active + belongs to session | — |
| `validate_text_input()` | Non-empty, Unicode-aware length check | — |
| `detect_pii()` | NER (xlm-roberta-large-ner-hrl) + regex | — |
| `scrub_pii()` | Replace spans with `[TYPE_REDACTED]` | — |
| `detect_profanity()` | Query `profanity_filters` table, regex match | — |
| `scrub_profanity()` | Generate clean_text with replacements | — |
| `store_response()` | MongoDB raw + Postgres ResponseMeta + TextResponse | — |
| `publish_submission_event()` | Redis pub/sub `session:{id}:responses` | → **Cube 6** |
| `submit_text_response()` | **Orchestrator** — chains all above | **Cube 5** start/stop |
| `get_responses()` | Paginated list (JOIN ResponseMeta + TextResponse) | — |
| `get_response_by_id()` | Single response lookup | — |
| `_get_ner_pipeline()` | Lazy-load transformer NER model | — |

### Outputs
| Output | Destination | Type |
|--------|-------------|------|
| ResponseMeta record | Postgres `response_meta` | `ResponseMeta` ORM |
| TextResponse record | Postgres `text_responses` | `TextResponse` ORM |
| Raw text document | MongoDB `responses` | Document |
| Redis submission event | **Cube 6** via `session:{id}:responses` | JSON |
| Time entry + tokens | **Cube 5** → `time_entries` + `token_ledger` | `TimeEntry` |
| Immediate ♡/◬ display | Client response | `float, float` |

### Metrics
| Category | Metric |
|----------|--------|
| System | avg/max submission latency, responses/min, NER invocations |
| User | language distribution, avg/max response length, PII/profanity rates, unique participants |
| Outcome | clean response ratio, flagged count, token distribution per response |

---

## Cube 3 — Voice-to-Text Engine `(1,3,3)` [COMPLETE]

### Inputs
| Input | Source | Type |
|-------|--------|------|
| session_id | URL path | `UUID` |
| audio | Multipart upload (browser mic) | `UploadFile` (≤25 MB) |
| question_id | Form field | `UUID` |
| participant_id | Form field | `UUID` |
| language_code | Form field | `str` (default "en") |
| audio_format | Form field | `str` (webm/wav/mp3/ogg/m4a/flac) |

### Functions (8)
| Function | Description | Calls |
|----------|-------------|-------|
| `select_provider_for_language()` | Pick best STT provider for language | Factory |
| `transcribe_audio()` | STT with provider selection + circuit breaker | Provider API |
| `_handle_stt_failure()` | Failover chain: whisper → grok → gemini | Provider API |
| `validate_transcript()` | Non-empty, confidence threshold, length | — |
| `store_voice_response()` | MongoDB (audio + raw) + Postgres (ResponseMeta + VoiceResponse + TextResponse) | — |
| `submit_voice_response()` | **Orchestrator** — transcribe → Cube 2 PII/profanity → store → tokens | **Cube 2** validators, **Cube 5** start/stop |
| `get_voice_responses()` | Paginated voice response list | — |
| `get_voice_response_by_id()` | Single voice response detail | — |

### Batch STT Providers (3 launch — user-selectable)
| Provider | Model | API |
|----------|-------|-----|
| OpenAI Whisper | `whisper-1` | OpenAI Audio Transcriptions |
| Grok (xAI) | `whisper-large-v3` | OpenAI-compatible API |
| Gemini (Google) | `gemini-2.0-flash` | Multimodal audio input |

### Real-time STT Providers (PAID feature — word-by-word display)
| Provider | Role | Latency | Languages | API |
|----------|------|---------|-----------|-----|
| Azure Speech Services | **Primary** | ~200ms | 100+ | WebSocket push stream |
| AWS Transcribe Streaming | **Fallback** | ~300ms | 30+ | WebSocket streaming |

Real-time STT WebSocket endpoint: `WS /sessions/{id}/voice/realtime`
Payment gate: `session.is_paid == True` required (Moderator paid or cost-split)

### Outputs
| Output | Destination | Type |
|--------|-------------|------|
| ResponseMeta record | Postgres `response_meta` (source="voice") | `ResponseMeta` ORM |
| VoiceResponse record | Postgres `voice_responses` | `VoiceResponse` ORM |
| TextResponse record | Postgres `text_responses` (PII/profanity) | `TextResponse` ORM |
| Raw transcript + audio | MongoDB `responses` + `audio_files` | Documents |
| Redis submission event | **Cube 6** via `session:{id}:responses` | JSON |
| Time entry + tokens | **Cube 5** → `time_entries` + `token_ledger` | `TimeEntry` |
| Immediate ♡/◬ display | Client response | `float, float` |

### Metrics
| Category | Metric |
|----------|--------|
| System | avg/max transcription latency, voice responses/min, avg/total audio duration |
| User | language distribution, provider distribution, avg confidence, low-confidence rate |
| Outcome | clean transcript ratio, PII rate, token distribution per voice response |

---

## Cube 4 — Response Collector `(1,3,2)` [STUB]

### Inputs (Expected)
| Input | Source | Type |
|-------|--------|------|
| session_id | URL path | `UUID` |
| Responses | **Cube 2** + **Cube 3** via Postgres | `ResponseMeta` records |
| Presence data | Redis | `dict` |
| Payment status | **Cube 1** session config | `bool` |

### Functions (Expected — 10)
| Function | Description |
|----------|-------------|
| `aggregate_responses()` | Collect all responses for a session |
| `get_response_count()` | Total + per-question counts |
| `get_presence_tracking()` | Live active user count |
| `collect_desired_outcomes()` | M2/M3 outcome collection |
| `cache_responses()` | Redis caching for hot data |
| `get_payment_status()` | Per-participant payment flags |
| `store_collected_batch()` | Batch write to MongoDB |
| `get_language_breakdown()` | Response count by language |
| `flag_response()` | Manual response flagging |
| `unflag_response()` | Remove flag from response |

### Outputs (Expected)
| Output | Destination | Type |
|--------|-------------|------|
| Aggregated responses | **Cube 6** (AI pipeline input) | `list[dict]` |
| Presence state | Client (WebSocket) | `dict` |
| Desired outcomes | Postgres `desired_outcomes` | ORM records |

---

## Cube 5 — User Input Gateway / Orchestrator `(1,3,1)` [COMPLETE — Time Tracking]

### Inputs
| Input | Source | Type |
|-------|--------|------|
| session_id | Calling cube | `UUID` |
| participant_id | Calling cube | `UUID` |
| action_type | Calling cube | `login \| responding \| ranking \| reviewing \| voice_responding` |
| cube_id | Calling cube | `str` (cube2, cube3, cube5, etc.) |
| reference_id | Calling cube (optional) | `str` (question_id, etc.) |
| country, state | Participant record (optional) | `str` (for 웃 jurisdiction rate) |

### Functions (6)
| Function | Description | Calls |
|----------|-------------|-------|
| `calculate_tokens()` | ♡ = floor(min), 웃 = rate×min, ◬ = ♡×5 | `hi_rates.resolve_hi_rate()` |
| `start_time_tracking()` | Create open TimeEntry | — |
| `stop_time_tracking()` | Calculate duration + tokens, create TokenLedger | — |
| `create_login_time_entry()` | Instant login credit (♡1 웃0 ◬5) + TokenLedger | — |
| `get_participant_time_summary()` | Aggregate time + tokens per participant | — |
| `_calculate_hi()` | 웃 = duration × (jurisdiction_rate / 60) | `hi_rates` |

### Outputs
| Output | Destination | Type |
|--------|-------------|------|
| TimeEntry record | Postgres `time_entries` | `TimeEntry` ORM |
| TokenLedger entry | Postgres `token_ledger` (append-only) | `TokenLedger` ORM |
| Token summary | Client / calling cube | `dict` {si, hi, ai} |

### Token Calculation
```
♡ = floor(active_minutes)          — 1 awarded on login
웃 = duration_min × (rate / 60)   — $0 when hi_enabled=False
◬ = ♡ × 5                         — default multiplier
```

---

## Cube 6 — AI Theming Clusterer `(1,2,1)` [COMPLETE]

### Inputs
| Input | Source | Type |
|-------|--------|------|
| session_id | API trigger | `UUID` |
| seed | Session config (optional) | `str \| None` |
| Responses | Postgres `response_meta` + MongoDB `responses` | Records + documents |
| Redis events | **Cube 2/3** via `session:{id}:responses` | JSON |
| ai_provider | Session config | `openai \| grok \| gemini` |

### Functions (9-Step Pipeline + 2 Public)
| Step | Function | Description |
|------|----------|-------------|
| 1 | `_fetch_responses()` | Postgres ResponseMeta + MongoDB raw text |
| 2 | `_batch_summarize()` | 333 → 111 → 33 word summaries |
| 3 | `_classify_theme01()` | Risk & Concerns / Supporting / Neutral (<65% → Neutral) |
| 4 | `_group_by_theme01()` | Bin responses by Theme01 category |
| 5 | `_parallel_sample()` | Marble sampling: 100 draws × 10 items per bin (seeded) |
| 6 | `_generate_secondary_themes()` | 3 themes per sample via LLM |
| 7 | `_reduce_themes()` | All themes → 9 → 6 → 3 |
| 8 | `_assign_themes()` | Embedding similarity assignment to responses |
| 9 | `_store_results()` | Theme + ThemeSample records + replay hash (SHA-256) |
| — | `run_pipeline()` | **Public orchestrator** — runs steps 1–9 |
| — | `get_session_themes()` | Query all theme records for session |

### AI Providers
| Provider | Embedding Model | Summarization Model |
|----------|----------------|---------------------|
| OpenAI | `text-embedding-3-small` | `gpt-4o-mini` (temp=0.0) |
| Grok | (OpenAI-compatible) | (OpenAI-compatible) |
| Gemini | (Google genai) | (Google genai) |

### Outputs
| Output | Destination | Type |
|--------|-------------|------|
| Theme records (parent + child) | Postgres `themes` | `Theme` ORM |
| ThemeSample records | Postgres `theme_samples` | `ThemeSample` ORM |
| Summaries | MongoDB | Documents |
| Replay hash | Session `replay_hash` | `str` (SHA-256) |
| Pipeline result | Client (202 Accepted) | `dict` {status, themes_9/6/3, replay_hash} |

---

## Cube 7 — Prioritization & Voting `(1,1,1)` [STUB]

### Inputs (Expected)
| Input | Source | Type |
|-------|--------|------|
| session_id | URL path | `UUID` |
| ranked_theme_ids | User ranking submission | `list[UUID]` |
| Theme2 voting level | Session config | `theme2_9 \| theme2_6 \| theme2_3` |
| Themes | **Cube 6** Postgres `themes` | `Theme` records |

### Functions (Expected — 8)
| Function | Description |
|----------|-------------|
| `submit_ranking()` | CRS-11: User ranks themes at selected level |
| `get_aggregated_rankings()` | CRS-12: Deterministic aggregation |
| `apply_governance_compression()` | Quadratic normalization, weight damping |
| `detect_manipulation()` | Anti-sybil safeguards |
| `override_ranking()` | CRS-22: Lead/Developer override (MVP3) |
| `get_cqs_eligible_responses()` | #1 Theme2 cluster → CQS reward selection |
| `progressive_theme_reveal()` | Hosting PC theme reveal (paid tiers) |
| `get_ranking_results()` | Final ranking output |

### Outputs (Expected)
| Output | Destination | Type |
|--------|-------------|------|
| Ranking records | Postgres `user_rankings` | `Ranking` ORM |
| Aggregated rankings | Postgres `aggregated_rankings` | `AggregatedRanking` ORM |
| #1 voted Theme2 cluster | **Cube 8** (CQS reward) | `UUID` |
| Live ranking updates | Client (WebSocket) | JSON |

---

## Cube 8 — Token Reward Calculator `(1,1,2)` [COMPLETE — Ledger]

### Inputs
| Input | Source | Type |
|-------|--------|------|
| session_id | URL path / query | `UUID` |
| user_id | Query param | `str` |
| ledger_entry_id | Dispute creation | `UUID` |
| Token entries | **Cube 5** (append-only writes) | `TokenLedger` records |
| 웃 rates | `hi_rates.py` (59 jurisdictions) | `float` ($/hr) |

### Functions (3)
| Function | Description | Calls |
|----------|-------------|-------|
| `get_session_tokens()` | All ledger entries for session | — |
| `get_user_token_balance()` | Aggregate ♡/웃/◬ balance | — |
| `create_dispute()` | Flag ledger entry for review | — |

### Outputs
| Output | Destination | Type |
|--------|-------------|------|
| Token ledger entries | Client | `list[TokenLedger]` |
| Balance summary | Client | `dict` {total_si, total_hi, total_ai} |
| Dispute record | Postgres `token_disputes` | `TokenDispute` ORM |
| 웃 rate table | Client (GET /tokens/rates) | `list[dict]` |

### 웃 Rate Ranges
| Range ($/hr) | Count | Examples |
|--------------|-------|---------|
| $0.34–$1.04 | 3 | Nigeria, Nepal, Cambodia |
| $1.43–$3.02 | 6 | Mexico, Thailand, Brazil, Honduras, Colombia, Chile |
| $7.25 | 20 | TX, AL, GA, ID + 16 more US states |
| $8.75–$12.30 | 13 | WV, MI, OH, MT, MN + 8 more |
| $13.00–$16.28 | 17 | FL, VT, HI, RI, CA, WA + 11 more |

---

## Cube 9 — Reports, Export & Dashboards `(1,1,3)` [PARTIAL — CSV Export]

### Inputs
| Input | Source | Type |
|-------|--------|------|
| session_id | URL path | `UUID` |
| ResponseMeta + TextResponse | Postgres | ORM records |
| Themes + summaries | Postgres `themes` + MongoDB | Records + documents |
| Token data | **Cube 8** ledger | `TokenLedger` records |

### Functions (2 implemented + stubs)
| Function | Description | Status |
|----------|-------------|--------|
| `export_session_csv()` | 15-column CSV matching target schema | COMPLETE |
| `export_session_csv_to_file()` | CSV to file path | COMPLETE |
| `generate_pixelated_token()` | Self-contained token image | STUB |
| `distribute_results()` | Results to paying participants | STUB |
| `get_cqs_dashboard()` | CQS scores + metrics | STUB |
| `get_talent_recommendations()` | Talent profiles from CQS | STUB |
| `announce_reward()` | Gamified reward announcement | STUB |
| `destroy_user_data()` | Post-delivery data destruction | STUB |

### 15-Column CSV Schema
```
Q_Number | Question | User | Detailed_Results |
333_Summary | 111_Summary | 33_Summary |
Theme01 | Theme01_Confidence |
Theme2_9 | Theme2_9_Confidence |
Theme2_6 | Theme2_6_Confidence |
Theme2_3 | Theme2_3_Confidence
```

### Outputs
| Output | Destination | Type |
|--------|-------------|------|
| CSV file | Client (StreamingResponse) | `bytes` |
| Pixelated token image | Client (download/SMS/email) | `bytes` (PNG) |
| Analytics dashboard | Client | `dict` |

---

## Cube 10 — Simulation Orchestrator `(2,2,2) CENTER L2` [NOT STARTED]

### Inputs (Expected)
| Input | Source | Type |
|-------|--------|------|
| cube_id | Simulation config | `str` |
| base_version | Current production | `str` |
| proposed_version | Code change | `str` |
| replay_dataset_ref | Past session data | `str` |
| Metrics baselines | **Cubes 2/3** metrics endpoints | `dict` |

### Functions (Expected — 12)
| Function | Description |
|----------|-------------|
| `checkout_cube()` | Isolate cube version for testing |
| `replay_session()` | Re-run past session with proposed changes |
| `compare_metrics()` | System/User/Outcome metric comparison |
| `evaluate_pass_fail()` | Must EXCEED existing metrics |
| `version_rollback()` | Revert failed changes |
| `run_simulation()` | Orchestrate full simulation pass |
| `get_simulation_results()` | Query past results |
| `collect_feedback()` | System-prompted + icon feedback |
| `prioritize_backlog()` | Tag feedback by cube/scoping |

### Pass Criteria
**Proposed changes must EXCEED all three metric categories from production:**
- System metrics (latency, throughput)
- User metrics (engagement, quality)
- Business/Outcome metrics (completion, tokens, revenue)

---

## Inter-Cube Data Flow

```
                    ┌──────────────────────────────────────────┐
                    │           Cube 10 Simulation             │
                    │  (compares metrics from all cubes)       │
                    └────────────┬─────────────────────────────┘
                                 │ reads metrics
    ┌────────────────────────────┼────────────────────────────────┐
    │                            ▼                                │
    │  ┌─────────┐    ┌─────────────────┐    ┌───────────────┐   │
    │  │ Cube 7  │◄───│    Cube 6 AI    │◄───│   Cube 4      │   │
    │  │ Ranking │    │ Theme Pipeline  │    │  Collector     │   │
    │  └────┬────┘    └───────▲─────────┘    └───────▲───────┘   │
    │       │                 │ Redis pub/sub        │            │
    │       │         ┌───────┴─────────┐    ┌───────┴───────┐   │
    │       │         │    Cube 2 Text  │    │   Cube 3      │   │
    │       │         │  Submission     │◄───│   Voice STT   │   │
    │       │         └───────▲─────────┘    └───────▲───────┘   │
    │       │                 │                      │            │
    │       │         ┌───────┴──────────────────────┴───────┐   │
    │       │         │         Cube 1 Session                │   │
    │       │         │    (join → question → polling)        │   │
    │       │         └──────────────────┬───────────────────┘   │
    │       │                            │                        │
    │  ┌────▼────┐    ┌─────────┐    ┌───▼───────────┐          │
    │  │ Cube 8  │◄───│ Cube 9  │◄───│   Cube 5      │          │
    │  │ Tokens  │    │ Reports │    │  Gateway/Time  │          │
    │  └─────────┘    └─────────┘    └───────────────┘          │
    └────────────────────────────────────────────────────────────┘

Cube 1 → Cube 5 (login time entry on join)
Cube 2 → Cube 5 (start/stop time tracking)
Cube 3 → Cube 2 (reuses PII/profanity validators)
Cube 3 → Cube 5 (start/stop time tracking)
Cube 2/3 → Cube 6 (Redis pub/sub submission events)
Cube 5 → Cube 8 (creates append-only token ledger entries)
Cube 6 → Cube 7 (themes for voting)
Cube 7 → Cube 8 (#1 theme → CQS reward)
Cube 8 → Cube 9 (token data for reports)
Cube 10 → All cubes (reads metrics for simulation comparison)
```
