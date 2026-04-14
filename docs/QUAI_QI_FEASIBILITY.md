# Quai/QI Blockchain Integration — Feasibility Plan (MVP3+)

> **Version:** 2026.04.14v.001
> **Status:** Planning (not yet approved for execution)
> **Approval required:** Master of Thought + Thought Master
> **Target phase:** MVP3 (post-launch, paying users)

---

## Executive Summary

Integrate SoI Trinity Tokens (♡ 웃 ◬) with Quai Network's QI cryptocurrency
to enable on-chain governance documentation and real-currency token conversion.
Users earn tokens through participation (♡), payment (웃), and AI multiplier (◬),
then convert to QI/USDC via Quai's platform.

---

## Architecture: Spiral Centrifuge Model

```
               ╔══════════════════╗
               ║   CUBE CENTER    ║
               ║   (Session 1→10) ║
               ╚════════╦═════════╝
                        ║
            ┌───────────╬───────────┐
            │     SPIRAL FLING      │
            │  (parallel compute)   │
            │                       │
    ┌───────┴───────┐       ┌───────┴───────┐
    │   On-Chain    │       │   Off-Chain   │
    │   (Quai QI)   │       │  (Supabase)   │
    │               │       │               │
    │ • Poll hash   │       │ • Raw data    │
    │ • Vote proof  │       │ • Summaries   │
    │ • Token mint  │       │ • Themes      │
    │ • Governance  │       │ • Rankings    │
    └───────────────┘       └───────────────┘
            │                       │
            └───────────╬───────────┘
                        ║
               ╔════════╩═════════╗
               ║  REAGGREGATION   ║
               ║  (verify + sync) ║
               ╚══════════════════╝
```

**Spiral Centrifuge Concept:** Data/variables/functions are flung outward from the
center during computation (parallel processing), then reaggregated at verification
points. This enables scaling from 1M → 1B users by distributing work across
multiple chains/shards while maintaining deterministic outcomes.

---

## Integration Points (by Cube)

### What Goes On-Chain (immutable, verifiable)

| Cube | On-Chain Data | Why |
|------|--------------|-----|
| **1 Session** | Session creation hash, participant count proof | Verifiable session existence |
| **6 AI** | `replay_hash` (SHA-256 of entire pipeline) | Proves AI theming was deterministic |
| **7 Ranking** | `replay_hash` + final Borda scores | Proves ranking was fair + deterministic |
| **8 Tokens** | Token mint events (♡ → QI conversion) | On-chain token economics |
| **9 Reports** | Export hash (SHA-256 of CSV) | Proves results weren't tampered |

### What Stays Off-Chain (mutable, private)

| Data | Why Off-Chain |
|------|--------------|
| Raw response text | Privacy (PII-scrubbed versions could go on-chain) |
| AI summaries | Copyright / cost (AI-generated content) |
| Participant identities | GDPR / anonymity |
| Session configuration | Moderator private settings |

---

## Token Conversion Flow

```
EARN (in-app)                    CONVERT (Quai bridge)              SPEND (external)
─────────────                    ─────────────────────              ──────────────────
♡ Heart tokens                   ♡ → QI (participation reward)     QI → USDC (Quai DEX)
  (time-based, free)               Rate: TBD per session metrics     Standard crypto exchange
                                    
웃 HI tokens                     웃 → QI (compensated value)       QI → fiat (off-ramp)
  ($7.25/hr = 1.0 웃)              Rate: 웃 × $7.25 = USD equivalent   Via Quai partners
                                    
◬ Triangle tokens                ◬ → QI (automation multiplier)   QI → governance weight
  (5× ♡ AI multiplier)             Rate: ◬ × 5 × ♡ rate              On-chain voting power
```

### Conversion Smart Contract (Quai)

```solidity
// Simplified — actual implementation via Quai SDK
contract SoITokenBridge {
    // Mint QI tokens proportional to verified ♡/웃/◬ earned
    function convertHeartToQI(
        bytes32 sessionHash,    // Cube 1 session proof
        bytes32 replayHash,     // Cube 6+7 determinism proof
        uint256 heartTokens,    // ♡ amount from Cube 8 ledger
        bytes signature         // Admin approval signature
    ) external returns (uint256 qiAmount);
    
    // Record poll results on-chain
    function recordPollResult(
        bytes32 sessionHash,
        bytes32 rankingHash,    // Cube 7 Borda output hash
        bytes32 exportHash,     // Cube 9 CSV hash
        uint256 participantCount
    ) external;
}
```

---

## Implementation Phases

### Phase 1: Read-Only Bridge (MVP3.1)
- Poll results recorded on Quai testnet via `replay_hash`
- No token conversion yet — proof of concept
- **Effort:** 2-4 weeks
- **Risk:** Low (read-only, no funds at risk)

### Phase 2: Token Minting (MVP3.2)
- ♡ tokens convertible to QI on Quai mainnet
- Admin approval gate (Master of Thought signs each conversion)
- Daily conversion limits per user
- **Effort:** 4-8 weeks
- **Risk:** Medium (funds involved — need security audit)

### Phase 3: Full Bridge (MVP4)
- 웃 and ◬ conversion enabled
- USDC off-ramp via Quai DEX integration
- On-chain governance voting with QI-weighted ballots
- Spiral centrifuge: shard poll execution across Quai zones
- **Effort:** 8-16 weeks
- **Risk:** High (DeFi complexity — full audit required)

---

## SSSES Assessment

| Pillar | Impact | Notes |
|--------|:------:|-------|
| **Security** | HIGH | Smart contract audit needed. Multi-sig admin approval. Rate limiting on conversions. |
| **Stability** | MEDIUM | Blockchain finality adds latency (Quai ~2s). Fallback to off-chain if chain unavailable. |
| **Scalability** | HIGH | Quai's sharded architecture aligns with spiral centrifuge model. 1B users possible with multi-zone sharding. |
| **Efficiency** | MEDIUM | Gas costs per transaction. Batch multiple poll results into single on-chain transaction. |
| **Succinctness** | LOW | New code required — Quai SDK, smart contracts, bridge service. |

---

## Quai Network Technical Notes

- **Architecture:** Proof-of-Entropy-Minima (PoEM) consensus, merged mining
- **Sharding:** 9 execution shards (Cyprus, Paxos, Hydra × 3 zones each)
- **Token:** QI (native gas token), Quai (store of value)
- **Smart contracts:** EVM-compatible (Solidity)
- **SDK:** `quais` npm package (ethers.js-compatible)
- **Testnet:** Available for development
- **USDC bridge:** Via Quai DEX (planned)

---

## Dependencies

| Dependency | Status | Blocker? |
|-----------|--------|----------|
| Quai SDK (`quais` npm) | Available | No |
| Quai testnet access | Available | No |
| Smart contract development | Not started | Yes (Phase 2) |
| Security audit firm | Not engaged | Yes (Phase 2) |
| USDC bridge on Quai | Planned by Quai team | Yes (Phase 3) |
| Legal/compliance review | Not started | Yes (Phase 2) |

---

## Recommendation

**Phase 1 (read-only bridge) can begin immediately** — record `replay_hash` values
on Quai testnet to prove deterministic governance. No funds at risk, validates the
integration pattern.

**Phase 2+ requires:** legal review, security audit, and Thought Master approval
before any real token conversion goes live.

**Spiral Centrifuge for 1B scale:** Quai's 9-shard architecture maps naturally to
our 9-cube grid. Each Quai zone could process a subset of poll responses (centrifuge
fling), with results reaggregated on-chain (deterministic merge via replay hashes).
This is the path from 1M → 1B concurrent users.

---

### Round 1 — Thor (2026.04.14_v003)

## Security Architecture

### Smart Contract Attack Vectors

| Attack | Risk | Mitigation |
|--------|:----:|------------|
| **Reentrancy** | HIGH | Checks-Effects-Interactions pattern on all `convertHeartToQI` calls. Use OpenZeppelin `ReentrancyGuard`. No external calls before state updates. |
| **Front-running** | MEDIUM | Commit-reveal scheme for token conversions: user commits hash of intent, reveals after 1 block. MEV protection via Quai's PoEM ordering. |
| **Oracle manipulation** | HIGH | No external price oracle for ♡→QI rate. Conversion rate set by multi-sig admin, not market feed. Eliminates oracle attack surface entirely. |
| **Integer overflow** | LOW | Solidity 0.8+ built-in overflow checks. All token math uses `SafeMath`-equivalent native checks. |
| **Signature replay** | MEDIUM | Include chain ID + nonce + expiry timestamp in every admin signature. EIP-712 typed structured data signing. |

### Multi-Sig Requirements

- **Phase 2 (token minting):** 2-of-3 multi-sig (MoT + 2 designated admins). Every `convertHeartToQI` call requires threshold signature before execution.
- **Phase 3 (full bridge):** 3-of-5 multi-sig. Add Quai liaison + legal counsel as signers.
- **Emergency pause:** Any single signer can trigger `pause()` (OpenZeppelin `Pausable`). Unpause requires full threshold.
- **Key rotation:** 90-day mandatory rotation. HSM (hardware security module) for production keys.

### Rate Limiting On-Chain Conversions

| Limit | Value | Rationale |
|-------|-------|-----------|
| Per-user daily cap | 100 ♡ tokens | Prevent wash-trading participation tokens |
| Per-user hourly cap | 25 ♡ tokens | Smooth conversion load on bridge contract |
| Global daily cap | 10,000 ♡ tokens | Treasury protection during early phases |
| Cooldown between conversions | 60 seconds | Anti-bot measure |
| Minimum conversion amount | 1 ♡ token | Prevent dust attack / gas waste |

Enforced both on-chain (contract mapping `lastConversion[address]`) and off-chain (Cube 8 ledger pre-check before submitting tx).

### Audit Firm Recommendations

| Firm | Strength | Estimated Cost | Timeline |
|------|----------|:--------------:|:--------:|
| **CertiK** | Automated + manual, large audit volume | $30K-$80K | 4-6 weeks |
| **Trail of Bits** | Deep manual review, cryptographic expertise | $80K-$150K | 6-10 weeks |
| **OpenZeppelin** | Created the standard libraries we use | $50K-$120K | 4-8 weeks |
| **Consensys Diligence** | EVM specialization, MythX tooling | $40K-$100K | 4-8 weeks |

**Recommendation:** OpenZeppelin for Phase 2 (familiarity with our dependencies), Trail of Bits for Phase 3 (DeFi bridge complexity requires their depth).

---

### Round 2 — Thoth (2026.04.14_v003)

## On-Chain Data Model

### Data Structures on Quai

```
PollRecord {
    bytes32 sessionHash;        // Keccak256(session_code + created_at)
    bytes32 replayHash;         // SHA-256 from Cube 6+7 pipeline
    bytes32 exportHash;         // SHA-256 of Cube 9 CSV output
    uint32  participantCount;   // Verified count from Cube 1
    uint32  responseCount;      // Total responses from Cube 4
    uint8   themeCount;         // Number of AI themes from Cube 6
    uint40  timestamp;          // Block timestamp of recording
}

TokenEvent {
    address recipient;          // User's Quai wallet
    uint8   tokenType;          // 0=♡, 1=웃, 2=◬
    uint128 amount;             // Token amount (18 decimals)
    uint128 qiAmount;           // QI received
    bytes32 sessionHash;        // Links to originating session
}

VoteProof {
    bytes32 sessionHash;
    bytes32 bordaHash;          // SHA-256 of final Borda ranking vector
    uint32  voterCount;         // Number of ranking participants
}
```

### Gas Cost Estimates (Quai EVM)

| Operation | Gas Units | Est. Cost (QI) | Frequency |
|-----------|:---------:|:--------------:|-----------|
| `recordPollResult` (single) | ~65,000 | ~0.001 QI | Per session close |
| `convertHeartToQI` | ~85,000 | ~0.0013 QI | Per user conversion |
| `batchRecordPolls` (10 polls) | ~180,000 | ~0.003 QI | Batch job (daily) |
| `recordVoteProof` | ~45,000 | ~0.0007 QI | Per ranking round |
| Contract deployment | ~2,500,000 | ~0.04 QI | One-time |

### Storage Optimization

- **Batch writes:** Accumulate up to 50 poll results off-chain, then submit single `batchRecordPolls` tx with Merkle root. Individual polls verifiable via Merkle proof without separate on-chain storage. Reduces gas by ~85% vs individual writes.
- **Calldata over storage:** Store only hashes on-chain (32 bytes each). Full data remains in Supabase. On-chain hash = tamper-proof anchor.
- **Event-based logging:** Emit events instead of writing storage for non-critical data (theme names, summary snippets). Events are ~5x cheaper than storage but still indexed.

### Indexing Strategy

- **The Graph (subgraph):** Deploy a Quai-compatible subgraph indexing `PollRecorded`, `TokenConverted`, `VoteProofStored` events. Enables GraphQL queries: "all polls by session," "conversion history by user," "governance proofs in date range."
- **Off-chain sync:** Cube 9 reporting service subscribes to subgraph, caches historical data in Supabase `blockchain_events` table for dashboard queries without hitting the chain.
- **Retention:** On-chain data is permanent. Off-chain index rebuilt from chain if corrupted (source of truth = blockchain).

---

### Round 3 — Athena (2026.04.14_v003)

## Competitive Analysis

### Platform Comparison

| Feature | **SoI (eXeL)** | **Snapshot** | **Aragon** | **Tally** |
|---------|:-:|:-:|:-:|:-:|
| AI-powered theming | Yes (Cube 6) | No | No | No |
| On-chain vote proof | Yes (replay hash) | No (off-chain sigs) | Yes (on-chain tx) | Yes (on-chain tx) |
| Real-time 1M scale | Yes (streaming) | Limited (~10K) | No (~1K) | No (~5K) |
| Token economics | ♡ 웃 ◬ Trinity | None (uses existing tokens) | ANT governance | None |
| Natural language input | Yes (text + voice) | No (binary votes) | No (proposals only) | No (proposals only) |
| Deterministic audit | SHA-256 replay hash | IPFS snapshot hash | On-chain state | On-chain state |
| Cost to voters | Free (gas absorbed) | Free (off-chain) | Gas per vote | Gas per vote |

### SoI Unique Value Proposition

The critical differentiator: **SoI compresses unstructured human language into ranked governance outcomes with cryptographic proof**. Snapshot votes on pre-defined options. Aragon executes pre-defined proposals. Tally tallies pre-defined ballots. None of them take raw human thought, cluster it with AI, rank it democratically, and prove the entire pipeline was deterministic. SoI is the only platform where the *question* can be open-ended and the *answer* emerges from collective intelligence.

### Pricing Model for On-Chain Features

| Tier | On-Chain Feature | Who Pays Gas |
|------|-----------------|:------------:|
| **Free (1-19 users)** | No on-chain recording | N/A |
| **$1.11-$4.44** | Poll result hash on testnet | Platform absorbs |
| **$7.77-$11.11** | Poll result hash on mainnet | Platform absorbs |
| **$12.12+ / Enterprise** | Full on-chain: poll hash + vote proofs + token minting | Gas included in tier price |
| **API/SDK** | Per-call on-chain recording | Developer pays (metered) |

Gas costs are low enough on Quai (~$0.001/tx) that absorbing them below the enterprise tier is sustainable. At 1,000 sessions/day, total daily gas cost is approximately $1.

### Go-to-Market: Who Wants Blockchain Proof?

| Segment | Need | Willingness to Pay | Priority |
|---------|------|:------------------:|:--------:|
| **Government / Public Sector** | Auditable citizen consultations, tamper-proof records | HIGH ($12.12+ tier) | 1st |
| **Enterprise (Fortune 500)** | Board governance, shareholder polling, compliance proof | HIGH (API/SDK) | 1st |
| **DAOs** | Already on-chain, need better UX + AI theming | MEDIUM (familiar with gas) | 2nd |
| **Universities / Research** | Reproducible survey methodology, academic integrity | LOW-MEDIUM ($7.77 tier) | 3rd |
| **Nonprofits / NGOs** | Transparent stakeholder input, donor accountability | LOW (free tier + donation) | 3rd |

**Phase 1 GTM:** Target government RFPs and enterprise pilots (they pay the most and validate the product for downstream segments). DAOs are a natural fit but lower revenue per user.

---

### Round 4 — Krishna (Integration) (2026.04.14_v003)

## Per-Cube Blockchain Touchpoints

Each cube that interacts with the blockchain has a single, well-defined function where the on-chain call is injected. The blockchain call is always **post-commit** (after the off-chain operation succeeds) and **fire-and-forget with retry** (failure does not block the user flow).

### Cube 1: `create_session` — Session Hash Anchoring

| Property | Value |
|----------|-------|
| **File** | `backend/app/cubes/cube1_session/service.py` line 183 |
| **Function** | `async def create_session(db, *, title, created_by, description, anonymity_mode, cycle_mode, max_cycles, ranking_mode, language, max_response_length, ai_provider, seed, session_type, polling_mode, pricing_tier, max_participants, fee_amount_cents)` |
| **Injection point** | After session row is committed to PostgreSQL and `short_code` is generated |
| **On-chain data** | `session_hash = SHA-256(session_id + title + created_by + seed + created_at)` |
| **Contract call** | `SoISessionRegistry.recordSession(bytes32 sessionHash, uint256 maxParticipants)` |
| **Return** | `tx_hash` stored in `Session.blockchain_tx` column (nullable) |
| **Estimated gas** | ~45,000 gas (~$0.002 at 20 gwei on Quai) |
| **Failure mode** | Session still valid off-chain; `blockchain_tx = null` signals "not anchored" |

### Cube 6: `run_pipeline` — Replay Hash Anchoring

| Property | Value |
|----------|-------|
| **File** | `backend/app/cubes/cube6_ai/pipeline.py` line 48 |
| **Function** | `async def run_pipeline(db, session_id, seed, *, use_embedding_assignment)` |
| **Injection point** | After pipeline returns `replay_hash` in the result dict (final step after theme hierarchy 9 -> 6 -> 3 is built) |
| **On-chain data** | `replay_hash` (SHA-256 of pipeline output: embeddings + clusters + themes), `theme_count`, `response_count` |
| **Contract call** | `SoIGovernanceProof.recordPipelineHash(bytes32 sessionHash, bytes32 replayHash, uint16 themeCount, uint32 responseCount)` |
| **Return** | `tx_hash` stored in pipeline result metadata |
| **Estimated gas** | ~55,000 gas (~$0.003 at 20 gwei on Quai) |
| **Failure mode** | Themes still valid off-chain; on-chain proof is supplementary verification |

### Cube 7: `aggregate_rankings` — Ranking Proof Anchoring

| Property | Value |
|----------|-------|
| **File** | `backend/app/cubes/cube7_ranking/ranking_aggregation.py` line 151 |
| **Function** | `async def aggregate_rankings(db, session_id, cycle_id, seed, participant_stakes, excluded_participant_ids)` |
| **Injection point** | After `AggregatedRanking` rows are committed to PostgreSQL and `replay_hash` is computed from the sorted Borda output |
| **On-chain data** | `ranking_replay_hash` (SHA-256 of sorted Borda scores), `voter_count`, `excluded_count` (from anti-sybil CRS-12.04), `top_theme_id` |
| **Contract call** | `SoIGovernanceProof.recordRankingProof(bytes32 sessionHash, bytes32 rankingHash, uint32 voterCount, uint16 excludedCount)` |
| **Return** | `tx_hash` appended to aggregation response |
| **Estimated gas** | ~60,000 gas (~$0.003 at 20 gwei on Quai) |
| **Failure mode** | Rankings valid off-chain; proof is additive assurance for auditors |

### Cube 8: `create_ledger_entry` — Token Minting

| Property | Value |
|----------|-------|
| **File** | `backend/app/cubes/cube8_tokens/service.py` line 218 |
| **Function** | `async def create_ledger_entry(db, *, session_id, user_id, cube_id, action_type, delta_heart, delta_human, delta_unity, lifecycle_state, reason, reference_id, distribution_method, anon_hash, session_short_code)` |
| **Injection point** | After `TokenLedger` row is appended with `lifecycle_state = "confirmed"` |
| **On-chain data** | `ledger_hash = SHA-256(session_id + user_id + delta_heart + delta_human + delta_unity + timestamp)`, token amounts (heart/human/unity as uint256), `anon_hash` (never raw user_id -- privacy preserved) |
| **Contract call** | `SoITokenBridge.mintTokens(bytes32 ledgerHash, uint256 heartAmount, uint256 humanAmount, uint256 unityAmount, bytes32 anonUserHash)` |
| **Return** | `tx_hash` stored in `TokenLedger.blockchain_tx` column (nullable) |
| **Estimated gas** | ~80,000 gas (~$0.004 at 20 gwei on Quai) -- higher due to ERC-20 state changes |
| **Failure mode** | Off-chain ledger is source of truth; on-chain mint is the "receipt" for eventual QI conversion |
| **Batching** | For sessions with >100 participants, ledger entries are batched into a single Merkle root on-chain (1 tx per session, not per user). Individual users claim via Merkle proof later. |

### Cube 9: `export_session_csv` — Export Hash Anchoring

| Property | Value |
|----------|-------|
| **File** | `backend/app/cubes/cube9_reports/service.py` line 220 |
| **Function** | `async def export_session_csv(db, session_id, content_tier)` |
| **Injection point** | After CSV bytes are assembled into `io.BytesIO` and SHA-256 hash is computed over the final bytes |
| **On-chain data** | `export_hash` (SHA-256 of final CSV bytes), `content_tier` (FREE/TIER_333/TIER_FULL), `row_count`, `column_count` (19 columns per CUBE_IO_SPEC) |
| **Contract call** | `SoIGovernanceProof.recordExportHash(bytes32 sessionHash, bytes32 exportHash, string contentTier, uint32 rowCount)` |
| **Return** | `tx_hash` included in export response headers (`X-Blockchain-Tx`) |
| **Estimated gas** | ~50,000 gas (~$0.003 at 20 gwei on Quai) |
| **Failure mode** | CSV download proceeds normally; blockchain receipt is optional verification |

### Gas Cost Summary (per full session lifecycle)

| Step | Gas | USD (20 gwei) |
|------|----:|------:|
| Session creation (Cube 1) | 45,000 | $0.002 |
| Pipeline hash (Cube 6) | 55,000 | $0.003 |
| Ranking proof (Cube 7) | 60,000 | $0.003 |
| Token mint -- batched (Cube 8) | 80,000 | $0.004 |
| Export hash (Cube 9) | 50,000 | $0.003 |
| **Total per session** | **290,000** | **$0.015** |

> At 20 gwei on Quai, a complete session lifecycle costs approximately $0.015 in gas.
> For a 1M-user session with Merkle-batched token mints, total on-chain cost remains under $0.05.

### Cubes NOT on-chain (and why)

| Cube | Why Off-Chain |
|------|--------------|
| **Cube 2 (Text)** | Raw text contains PII-scrubbed content -- privacy-first. Hash included in Cube 6 replay_hash transitively. |
| **Cube 3 (Voice)** | Audio metadata -- same PII rationale. Transcript flows through Cube 2 pipeline. |
| **Cube 4 (Collector)** | Aggregation layer -- no unique proof needed. Individual response hashes covered by Cube 6. |
| **Cube 5 (Gateway)** | Orchestration triggers -- ephemeral. Token calculations flow to Cube 8 for on-chain recording. |
| **Cube 10 (Simulation)** | Internal testing/feedback -- no governance value in anchoring simulation results on-chain. |

---

### Round 5 — Enki (Edge Cases) (2026.04.14_v003)

## Edge Cases & Failure Modes

### EC-1: Quai Chain Down During Poll Close

**Scenario:** Moderator closes polling, Cube 6 `run_pipeline` executes successfully, but Quai RPC is unreachable when `recordPipelineHash` is called. Same applies to Cube 7 `aggregate_rankings` and Cube 9 `export_session_csv`.

**Mitigation:**
1. All on-chain calls use fire-and-forget with `CircuitBreaker` (from `core/circuit_breaker.py`, already implemented for AI providers)
2. Failed tx enters `blockchain_pending` queue in PostgreSQL: `{cube_id, function_name, payload_json, retry_count, next_retry_at, created_at}`
3. Background worker retries with exponential backoff: 30s, 60s, 2m, 5m, 15m, 1h (max 6 retries)
4. After 6 failures, entry moves to `blockchain_failed` state with alert to admin
5. Session results remain fully valid off-chain -- blockchain anchoring is **supplementary, never blocking**
6. When chain recovers, worker drains queue in FIFO order
7. Dashboard shows indicator: "On-chain proof: pending" / "verified" / "unavailable"

**User impact:** Zero. No user-facing flow depends on blockchain confirmation. The off-chain `replay_hash` in PostgreSQL is the primary source of truth.

### EC-2: Gas Price Spike (10x) During 1M-User Poll

**Scenario:** Gas price jumps from 20 gwei to 200 gwei mid-session. Unbatched token minting for 1M users via `create_ledger_entry` would cost $0.04 per mint = $40,000 total.

**Mitigation:**
1. **Gas price oracle check** before every on-chain call: `if gas_price > MAX_GAS_GWEI (configurable, default 50 gwei): defer`
2. **Merkle batching** (designed for Cube 8): 1M token mints compress to a single Merkle root tx (~120,000 gas). Users claim individually later via Merkle proof.
3. **Deferred anchoring mode:** When gas exceeds threshold, all proofs queue locally and anchor during the next low-gas window (checked every 5 minutes via cron)
4. **Session-level gas budget:** Moderator sets max gas budget at session creation via `pricing_tier` (default: $1.00 USD). System batches/defers to stay within budget.
5. **Priority tiers for on-chain calls:**
   - P1 (critical): Ranking proof (Cube 7) -- governance integrity
   - P2 (important): Pipeline hash (Cube 6) -- determinism proof
   - P3 (normal): Session hash (Cube 1), Token mint (Cube 8)
   - P4 (deferrable): Export hash (Cube 9) -- convenience only

**Worst case cost with batching:** Single Merkle root for 1M users at 200 gwei = ~$0.05 (vs $40,000 unbatched). Batching reduces cost by 800,000x.

### EC-3: Exchange Rate Change During ♡ -> QI Conversion

**Scenario:** User initiates heart-to-QI conversion at rate 1000 ♡ = 1 QI. Between rate lock and on-chain execution (2-10 seconds of Quai block time), the admin-set rate changes to 1200 ♡ = 1 QI.

**Mitigation:**
1. **Rate lock window:** Conversion quote includes a `rate_lock_until` timestamp (30 seconds from quote)
2. **Quote-then-execute pattern:**
   - Step 1: `POST /api/v1/tokens/convert/quote` returns `{rate, qi_amount, rate_lock_until, quote_id}`
   - Step 2: `POST /api/v1/tokens/convert/execute` with `quote_id` -- validates lock hasn't expired
3. **Slippage tolerance:** User sets max acceptable slippage (default 2%). If rate moves >2% before execution, tx auto-cancels and heart tokens are refunded to off-chain ledger.
4. **Atomic swap on-chain:** Smart contract holds heart tokens in escrow, mints QI atomically. If rate check fails on-chain, both sides revert (Solidity `require`).
5. **Admin rate change cooldown:** When admin updates conversion rate, a 60-second grace period honors all existing quotes at the old rate. No surprise rate changes.
6. **Note:** Unlike DEX trading, the ♡ -> QI rate is admin-controlled (no external oracle), so rate changes are deliberate and infrequent. This edge case is rare but must be handled.

### EC-4: Smart Contract Bug Allows Double Minting

**Scenario:** A reentrancy or logic bug in `SoITokenBridge.mintTokens` allows a malicious actor to call `create_ledger_entry` and trigger on-chain minting twice for the same ledger entry.

**Mitigation (defense in depth, 7 layers):**
1. **On-chain nonce:** `mintTokens` includes `require(!minted[ledgerHash])` -- each `ledger_hash` can only mint once. Mapping of used hashes is permanent.
2. **On-chain reentrancy guard:** OpenZeppelin `ReentrancyGuard` on all state-changing functions
3. **Off-chain pre-check:** Before submitting tx, Cube 8 service checks `TokenLedger.blockchain_tx IS NOT NULL` -- skip if already minted
4. **Off-chain circuit breaker:** `core/circuit_breaker.py` monitors mint events via Quai event subscription. If minted amount exceeds expected amount for a session by >1%, breaker trips:
   - Immediately pauses all conversion endpoints
   - Alerts admin via webhook + email
   - Logs full tx trace for forensic analysis
5. **Reconciliation cron:** Every 5 minutes, compare on-chain token supply (from `SoITokenBridge.totalMinted()`) against off-chain `SELECT SUM(delta_heart + delta_human + delta_unity) FROM token_ledger WHERE lifecycle_state = 'confirmed'`. Discrepancy > 0.01% triggers immediate alert.
6. **Multi-sig contract upgrades:** All contract upgrades require 3-of-5 multi-sig (Master of Thought + 2 additional signers minimum). No single actor can deploy a compromised contract.
7. **Emergency pause:** Contract includes `pause()` callable by any single multi-sig signer -- freezes all minting immediately. Unpause requires full threshold.

### EC-5: 59 Jurisdictions Have Different Crypto Regulations

**Scenario:** User in jurisdiction X (e.g., New York requires BitLicense, China bans crypto, UAE has VARA) attempts token conversion via `create_ledger_entry` -> `mintTokens`, but local regulations prohibit or restrict the operation.

**Mitigation:**
1. **Jurisdiction gating extension:** `core/hi_rates.py` already has 59-jurisdiction rate table. Add three fields per jurisdiction:
   - `crypto_conversion_allowed: bool` -- can this jurisdiction convert ♡ to QI?
   - `kyc_required_level: int` (0-3) -- what KYC tier is needed before first conversion?
   - `max_daily_conversion_usd: float` -- daily conversion cap (0 = blocked)

2. **Three tiers of blockchain access:**

   | Tier | Example Jurisdictions | What's Allowed |
   |------|----------------------|----------------|
   | **Full** | US (excl. NY), EU (MiCA), Canada, UK, Japan, Singapore, UAE, Australia | Token earning + QI conversion + USDC off-ramp |
   | **Earn Only** | NY (BitLicense required), India (30% tax), South Korea (VASP reg) | Token earning + on-chain proof viewing, NO conversion to QI |
   | **Blocked** | China, Russia, Iran, North Korea, Cuba, Syria | No blockchain features visible in UI at all |

3. **Graceful degradation:** Blocked-jurisdiction users see standard SoI Trinity Tokens (♡ 웃 ◬) without any blockchain/QI branding. Governance works identically -- blockchain is invisible. The `create_ledger_entry` function still records tokens off-chain; only the on-chain `mintTokens` call is suppressed.

4. **Pre-conversion jurisdiction check:** `POST /api/v1/tokens/convert/quote` checks `hi_rates[user.jurisdiction].crypto_conversion_allowed` before returning a quote. Blocked users get HTTP 403 with jurisdiction-specific explanation.

5. **Jurisdiction change handling:** If a country's crypto status changes (e.g., India fully bans), pending conversions for affected users are paused (not cancelled) with notification. Config update to `hi_rates.py` -- no code deployment needed.

6. **Legal review cadence:** Jurisdiction table reviewed quarterly by legal counsel. Changes are config-only (no code changes, no redeployment).

---

### Round 6 — Odin (Future-Proofing) (2026.04.14_v003)

## 1B Scale Architecture

### The Spiral Centrifuge at Planetary Scale

The spiral centrifuge model (center -> fling -> reaggregate) is the architectural key to 1B concurrent users. At 1M users, a single Quai zone handles all on-chain operations. At 1B, we shard across Quai's full 9-zone topology, with each zone processing a deterministic subset of the governance workload.

```
                         1B USERS
                            |
                    +-------+-------+
                    |   INGESTION   |
                    |   ROUTER      |
                    | (hash-based   |
                    |  zone assign) |
                    +---+---+---+---+
                        |   |   |
           +------------+   |   +------------+
           |                |                |
    +======+======+  +======+======+  +======+======+
    |   CYPRUS     |  |   PAXOS     |  |   HYDRA     |
    |  Zone 1-3   |  |  Zone 4-6   |  |  Zone 7-9   |
    |  Cubes 1-3  |  |  Cubes 4-6  |  |  Cubes 7-9  |
    +======+======+  +======+======+  +======+======+
           |                |                |
           +--------+-------+--------+-------+
                    |                |
             +------+------+  +-----+------+
             | REAGGREGATE |  | CUBE 10    |
             | Cross-zone  |  | Merge      |
             | Merkle root |  | Coordinator|
             +-------------+  +------------+
```

### Quai Zone-to-Cube Mapping (9 Zones x 9 Cubes = 81 Parallel Execution Paths)

Quai Network provides 3 regions (Cyprus, Paxos, Hydra) x 3 zones each = 9 execution shards. Our 9-cube architecture maps naturally onto this topology:

| Quai Region | Quai Zone | Cube Assignment | Governance Role | On-Chain Function |
|-------------|-----------|-----------------|-----------------|-------------------|
| **Cyprus** (Session Layer) | Cyprus-1 | Cube 1 (Session) | Session creation, state anchoring | `recordSession()` |
| | Cyprus-2 | Cube 2 (Text) | Text response ingestion (off-chain) | N/A |
| | Cyprus-3 | Cube 3 (Voice) | Voice transcript ingestion (off-chain) | N/A |
| **Paxos** (Processing Layer) | Paxos-1 | Cube 4 (Collector) | Response aggregation (off-chain) | N/A |
| | Paxos-2 | Cube 5 (Gateway) | Pipeline orchestration (off-chain) | N/A |
| | Paxos-3 | Cube 6 (AI) | Replay hash anchoring | `recordPipelineHash()` |
| **Hydra** (Governance Layer) | Hydra-1 | Cube 7 (Ranking) | Ranking proofs, Borda verification | `recordRankingProof()` |
| | Hydra-2 | Cube 8 (Tokens) | Token minting, QI bridge | `mintTokens()` |
| | Hydra-3 | Cube 9 (Reports) | Export hash anchoring | `recordExportHash()` |

**81 parallel paths:** For a session with 1B users, the ingestion router assigns each user to one of 9 zones based on `SHA-256(user_id) mod 9`. Each zone processes its user shard independently through all 9 cube stages. Total parallel capacity: 9 zones x 9 stages = 81 concurrent execution lanes.

### Cross-Zone Aggregation Protocol

Deterministic reaggregation is the hardest problem at 1B scale. The protocol ensures identical results regardless of how users are distributed across zones:

```
PHASE 1 -- ZONE-LOCAL AGGREGATION (parallel, 9 zones)
------------------------------------------------------
Each zone independently:
  1. Collects responses from its user shard (Cube 4)
  2. Runs local Cube 6 pipeline (embeddings + MiniBatchKMeans clustering)
  3. Runs local Cube 7 Borda aggregation (BordaAccumulator per zone)
  4. Produces zone_replay_hash = SHA-256(local_pipeline_hash + local_borda_hash)
  5. Anchors zone_replay_hash on its Quai zone shard

PHASE 2 -- CROSS-ZONE MERGE (sequential, Cube 10 as coordinator)
-----------------------------------------------------------------
Cube 10 (Simulation Orchestrator) becomes the merge coordinator:
  1. Collects 9 zone_replay_hashes from respective zone shards
  2. Fetches zone-local Borda scores via internal API
  3. Runs BordaAccumulator.merge(zone_results[0..8])
     -- Deterministic: same inputs always produce same merged ranking
     -- Commutative: merge order does not matter (sorted by zone_id)
     -- Associative: merge(merge(A,B), C) == merge(A, merge(B,C))
  4. Produces global_replay_hash = SHA-256(sorted(zone_hashes) + merged_scores)
  5. Anchors global_replay_hash on Quai prime chain (cross-shard tx)

PHASE 3 -- VERIFICATION (any auditor, fully public)
----------------------------------------------------
  1. Fetch all 9 zone_replay_hashes from respective zone shards
  2. Fetch global_replay_hash from prime chain
  3. Recompute: SHA-256(sorted(zone_hashes) + recomputed_merge)
  4. Verify: recomputed == global_replay_hash
  5. PASS = governance result is cryptographically proven deterministic
     FAIL = trigger dispute resolution (Round 8, Aset)
```

**Determinism guarantee:** The merge is commutative and associative because Borda scores are additive. A theme ranked #1 in 7 of 9 zones will always be #1 globally, regardless of zone assignment order. The seeded MiniBatchKMeans (`random_state` from Cube 6) ensures identical response text in different zones produces identical theme assignments.

### Base-3600 Coordinate System for Distributed Governance

The universal coordinate system (SA/EA/HU -- see `project_universal_coordinate_system.md`) maps naturally to the distributed governance topology:

```
BASE-3600 GOVERNANCE COORDINATES
----------------------------------
Format: SA.EA.HU (each component 0-3599)

SA (Spatial Address):  Which Quai zone handles this governance artifact
  SA = session_hash mod 9 -> zone assignment (0-8)
  SA precision: zone (coarse, 0-8) -> shard (medium, 0-99) -> block (fine, 0-3599)
  SA maps to physical geography for geo-scoped polls

EA (Entity Address):   Which participant/entity within the zone
  EA = participant_hash mod zone_capacity
  EA precision: user (coarse) -> response (medium) -> token (fine)
  EA uniquely identifies a governance actor across the entire system

HU (Hash Unit):        Which governance artifact type
  HU = artifact_type enum:
    0 = session_hash      (Cube 1 create_session)
    1 = pipeline_hash     (Cube 6 run_pipeline)
    2 = ranking_hash      (Cube 7 aggregate_rankings)
    3 = token_hash         (Cube 8 create_ledger_entry)
    4 = export_hash        (Cube 9 export_session_csv)
  HU precision: type (coarse) -> version (medium) -> tx_hash (fine)

EXAMPLE: 0007.1842.0002
  -> Zone 7 (Hydra-1 = Cube 7 Ranking)
  -> Entity #1842 in that zone
  -> Ranking proof artifact (HU=2)
  -> Locatable on Quai Hydra Zone 1 by any verifier
```

This coordinate system enables any governance artifact to be located across the distributed 1B-user topology with a single 12-digit address. It also enables future geospatial governance -- polls scoped to physical regions can use SA as a literal geographic coordinate, enabling drone-swarm-scale distributed decision making.

### Drone Swarm Analogy: Each Cube as an Autonomous Agent

At 1B scale, each cube operates as an autonomous agent in a drone swarm. The I/O contracts from `CUBE_IO_SPEC.md` are the "flight protocols" -- each agent only needs to know its inputs and outputs, not the full system:

| Drone Property | Cube Equivalent | Implementation |
|---------------|-----------------|----------------|
| **Mission** | Cube responsibility (Session, Text, AI, etc.) | Single-purpose service with defined I/O from CUBE_IO_SPEC |
| **Sensors** | Input interfaces (HTTP, WebSocket, DB read) | Pydantic schemas, validated at service boundary |
| **Actuators** | Output interfaces (DB write, broadcast, on-chain tx) | ORM commits, Supabase Realtime events, Quai contract calls |
| **Autonomy** | Standalone operation with local state | Stateless service + shared PostgreSQL (Supabase) |
| **Communication** | I/O contracts between cubes | `CUBE_IO_SPEC.md` defines exact schemas -- Challengers must preserve |
| **Formation** | Spiral grid (3x3 Layer 1 + center Layer 2) | Dependency graph determines execution order (1->2->3->4->5->6->7->8->9) |
| **Swarm intelligence** | Cross-cube aggregation via Cube 10 | Cube 10 merges zone-local results into global governance outcome |
| **Self-healing** | Circuit breaker + retry + fallback | `core/circuit_breaker.py` per external dependency (AI providers, Quai RPC) |
| **Redundancy** | Multi-zone deployment | Same cube code runs on all 9 Quai zones simultaneously |
| **Upgradability** | Cube 10 Challenger system | Any developer can check out a cube, modify internals, prove better metrics |

**Key insight:** Just as a drone swarm achieves complex missions through simple agents following I/O contracts, the cube architecture achieves 1B-scale governance through 9 simple services following strict interface contracts. No cube needs to understand the full system -- it only needs to honor its inputs and outputs as defined in `CUBE_IO_SPEC.md`.

### Scaling Equation

```
Throughput = zones(Z) x cubes(C) x workers_per_cube(W) x batch_size(B)

At Quai's current topology:
  Z = 9 (Quai execution shards)
  C = 9 (SoI cubes)
  W = variable (horizontal autoscaling via Kubernetes)
  B = variable (MiniBatchKMeans chunk size, default 1000)

For 1B users:
  Operations per user = ~5 (submit + theme + rank + token + export)
  Total operations = 1B x 5 = 5B

  At W=135 workers/cube, B=1000:
    Throughput = 9 x 9 x 135 x 1000 = 10,935,000 ops/sec
    Time = 5B / 10.9M = ~458 seconds (~7.6 minutes)

  At W=135 workers/cube, B=10,000 (streaming batches):
    Throughput = 9 x 9 x 135 x 10,000 = 109,350,000 ops/sec
    Time = 5B / 109.3M = ~46 seconds

  At W=500 workers/cube (burst mode), B=10,000:
    Throughput = 9 x 9 x 500 x 10,000 = 405,000,000 ops/sec
    Time = 5B / 405M = ~12 seconds
```

**Conclusion:** The spiral centrifuge model can process 1B users within 46 seconds using moderate horizontal scaling (135 workers per cube across 9 Quai zones). Burst mode at 500 workers achieves 12-second processing -- well within the "Speed of Thought" vision.

**Infrastructure cost estimate at 1B scale:** At 135 workers x 9 cubes = 1,215 containers. On Kubernetes with spot instances (~$0.02/hr per container), burst processing for 1 minute costs approximately $0.40 in compute. On-chain gas for 1B users (Merkle-batched): ~$0.50. Total cost per 1B-user governance event: under $1.00.

---

### Round 7 — Sofia (2026.04.14_v003)

## Multi-Jurisdiction Token Compliance

### 59-Jurisdiction Rate Table Mapping to Crypto Regulations

Cube 8 already maintains a 59-jurisdiction `hi_rates` table (`backend/app/core/hi_rates.py`) mapping countries to hourly compensation rates for 웃 tokens. This same jurisdiction index serves as the regulatory compliance backbone for crypto token conversion. Each jurisdiction entry is extended with a `crypto_conversion_allowed` flag, a `kyc_threshold` value, and a `regulatory_framework` reference.

### Jurisdiction Breakdown: Crypto Token Conversion Eligibility

| Region | Jurisdictions | Conversion Allowed | Regulatory Framework | Notes |
|--------|:------------:|--------------------|---------------------|-------|
| **United States** | 1 (federal) + 50 states | Conditional | SEC (securities), FinCEN (MSB), state MTLs | ♡ tokens classified as utility/reward points (not securities) to avoid Howey test. Conversion to QI triggers MSB registration. States like NY require BitLicense. TX, WY, FL crypto-friendly. |
| **European Union** | 27 member states | Yes (MiCA) | MiCA (Markets in Crypto-Assets Regulation) | MiCA effective 2024 provides unified framework. Utility tokens under lighter regime. Conversion service requires CASP (Crypto-Asset Service Provider) license. VASP registration per member state. |
| **United Kingdom** | 1 | Yes | FCA (Financial Conduct Authority) | Crypto-asset registration required. ♡→QI conversion = regulated exchange activity. Travel Rule compliance mandatory above threshold. |
| **APAC — Japan** | 1 | Yes | FSA (Financial Services Agency), JVCEA | Crypto-asset exchange registration. Strict segregation of customer assets. Tax: 15-55% on crypto gains. |
| **APAC — Singapore** | 1 | Yes | MAS (Payment Services Act) | DPT (Digital Payment Token) license required. Progressive sandbox regime. Low tax on crypto. |
| **APAC — Australia** | 1 | Yes | ASIC + AUSTRAC | DCE (Digital Currency Exchange) registration. AML/CTF reporting. Capital gains tax applies. |
| **APAC — South Korea** | 1 | Conditional | FSC (Financial Services Commission) | VASP registration. Real-name verification. 20% tax on gains above threshold. |
| **APAC — India** | 1 | Conditional | RBI guidance, 30% tax | No formal ban but 30% flat tax + 1% TDS on transfers. High regulatory uncertainty. |
| **Middle East — UAE** | 1 | Yes | VARA (Dubai), ADGM, FSRA | Most crypto-friendly in region. Free zone licenses available. |
| **Latin America — Brazil** | 1 | Yes | CVM + Central Bank | Crypto framework law (2022). VASP licensing. |
| **Africa** | 5 (ZA, NG, KE, GH, EG) | Mixed | Varies by country | South Africa (FSCA regulated), Nigeria (restricted), Kenya (unregulated), Ghana (cautious), Egypt (restricted). |
| **Restricted/Banned** | 8+ | No | N/A | China (mainland), Russia, Iran, North Korea, Cuba, Syria, Myanmar, Venezuela — either outright bans or under international sanctions. |

### KYC/AML Requirements for Token Conversion

| Conversion Tier | Threshold (USD equivalent) | KYC Level | Requirements |
|----------------|:-------------------------:|:---------:|-------------|
| **Micro** | < $100/month | Level 0 (none) | Email verification only. ♡ tokens remain in-app. No fiat conversion. |
| **Basic** | $100 - $1,000/month | Level 1 | Email + phone + name + DOB. Government ID scan (automated via Jumio/Onfido). |
| **Standard** | $1,000 - $10,000/month | Level 2 | Level 1 + proof of address + source of funds declaration. Manual review for flags. |
| **Enhanced** | > $10,000/month | Level 3 | Level 2 + video KYC + enhanced due diligence (EDD). Ongoing transaction monitoring. PEP/sanctions screening. |

**AML Controls:**
- **Transaction monitoring:** All conversions screened against Chainalysis/Elliptic for wallet risk scoring
- **Travel Rule (FATF R.16):** For conversions > $1,000 (or local threshold), originator and beneficiary information transmitted between VASPs
- **Suspicious Activity Reports (SARs):** Auto-filed when patterns match typologies (rapid conversion cycles, structuring below thresholds, velocity anomalies)
- **Record retention:** 5-year minimum for all KYC documents and transaction records (7 years for EU/UK)

### Geo-Fencing: Sanctioned Country Blocking

```
Conversion Request Flow:

  User initiates ♡ → QI conversion
           │
           ▼
  ┌─────────────────┐
  │  IP Geolocation  │ ◄── MaxMind GeoIP2 + Cloudflare headers
  └────────┬────────┘
           │
           ▼
  ┌─────────────────┐     ┌──────────────────┐
  │ Sanctions Check  │────►│ BLOCK + Log      │ (OFAC/EU/UN lists)
  │ (OFAC, EU, UN)  │ YES │ Return 451       │
  └────────┬────────┘     └──────────────────┘
           │ NO
           ▼
  ┌─────────────────┐     ┌──────────────────┐
  │ Jurisdiction     │────►│ BLOCK + Explain  │ (country bans crypto)
  │ Crypto Allowed?  │ NO  │ Return 403       │
  └────────┬────────┘     └──────────────────┘
           │ YES
           ▼
  ┌─────────────────┐
  │  KYC Tier Check  │ ──► Proceed or escalate KYC level
  └─────────────────┘
```

**Blocked jurisdictions (hard block, no override):**
- OFAC SDN list countries: North Korea, Iran, Cuba, Syria, Crimea region
- UN sanctions list: additional entities/individuals
- Platform policy: China (mainland), Russia (due to sanctions risk)

**Soft restrictions (conversion allowed with enhanced KYC):**
- India, South Korea, Nigeria — higher KYC tier required due to regulatory uncertainty

### GDPR vs Blockchain Immutability

| Challenge | Resolution |
|-----------|-----------|
| **Right to erasure (Art. 17)** | Only cryptographic hashes stored on-chain. No personal data on blockchain. Raw data in Supabase (deletable). Hash of deleted data becomes an orphan proof — verifiable that *something* existed but content irrecoverable. |
| **Right to rectification (Art. 16)** | Off-chain data correctable in Supabase. On-chain hash remains as historical record. New corrected hash appended (chain of corrections). |
| **Data minimization (Art. 5)** | On-chain: 32-byte hashes only. No names, emails, response text, or IP addresses ever touch the blockchain. |
| **Lawful basis for processing** | Legitimate interest (Art. 6(1)(f)) for governance proof. Consent (Art. 6(1)(a)) for token conversion. Users explicitly opt in to blockchain features. |
| **Data portability (Art. 20)** | Cube 9 CSV export provides all user data. On-chain hashes are publicly readable (self-service portability). |
| **Cross-border transfers** | Blockchain is global by nature. Hashes contain no personal data, so Schrems II does not apply to on-chain data. Off-chain data remains in Supabase (region-selectable). |

**Hash-only architecture resolves the fundamental GDPR-blockchain tension:** the blockchain proves integrity without storing personal data. Delete the off-chain record, and the on-chain hash becomes meaningless — satisfying erasure while preserving audit proof.

---

### Round 8 — Aset (2026.04.14_v003)

## Governance Proof Verification

### Third-Party Verification of Poll Fairness

Any external auditor, regulator, or participant can independently verify that a governance poll was conducted fairly using only publicly available on-chain data and the platform's open-source replay tool.

**Verification levels (ascending rigor):**

| Level | What is Verified | Verifier Needs | Time |
|-------|-----------------|---------------|:----:|
| **1 — Existence** | Poll happened, N participants, M responses | On-chain `PollRecord` (public) | Seconds |
| **2 — Integrity** | Results weren't altered after export | `exportHash` vs SHA-256 of provided CSV | Seconds |
| **3 — Determinism** | AI theming + ranking were reproducible | Input dataset + seed + replay tool | Minutes |
| **4 — Completeness** | No responses were excluded or fabricated | Full response set + Merkle proof against on-chain root | Minutes |
| **5 — Governance** | Voting weights were fair, no manipulation | Borda vectors + weight parameters + anti-sybil logs | Hours |

### Replay Verification Protocol

Given the same inputs and seed parameters, the entire pipeline must produce byte-identical outputs:

```
REPLAY VERIFICATION:

  Inputs Required:
  ├── responses[]          (anonymized text, from Cube 4)
  ├── embedding_model_id   (pinned version, e.g., "text-embedding-3-small-v2")
  ├── clustering_seed      (random_state integer, from Cube 6)
  ├── cluster_count        (k value, from Cube 6)
  ├── summarization_prompt (exact prompt template, versioned)
  └── borda_parameters     (weights, voter IDs, ranking vectors)

  Replay Steps:
  1. Generate embeddings     → embedding_hash = SHA-256(all_vectors)
  2. Run MiniBatchKMeans     → cluster_hash = SHA-256(cluster_assignments)
  3. Generate summaries      → summary_hash = SHA-256(all_summaries)
  4. Compute themes          → theme_hash = SHA-256(theme_labels + counts)
  5. Run Borda aggregation   → borda_hash = SHA-256(final_ranking_vector)
  6. Export CSV               → export_hash = SHA-256(csv_bytes)

  Verification:
  replay_hash = SHA-256(embedding_hash ‖ cluster_hash ‖ summary_hash
                        ‖ theme_hash ‖ borda_hash ‖ export_hash)

  PASS: replay_hash == on-chain replayHash
  FAIL: replay_hash != on-chain replayHash → trigger dispute
```

**Determinism guarantee:** Because embedding models are pinned to exact versions, clustering uses a fixed seed, and Borda aggregation is purely mathematical, identical inputs always produce identical outputs. The only non-deterministic component is AI summarization — mitigated by storing the exact prompt template version and using temperature=0 with the same model version.

### On-Chain Proof Chain

```
SESSION LIFECYCLE → PROOF CHAIN:

  Cube 1: Session Created
     │
     └──► session_hash = Keccak256(session_code ‖ created_at ‖ moderator_id)
              │
              │  (recorded on-chain: PollRecord.sessionHash)
              │
  Cube 4: Responses Collected
     │
     └──► response_root = MerkleRoot(all response hashes)
              │
              │  (recorded on-chain: PollRecord.responseRoot) [Phase 2+]
              │
  Cube 6: AI Pipeline Complete
     │
     └──► replay_hash = SHA-256(embedding ‖ cluster ‖ summary ‖ theme)
              │
              │  (recorded on-chain: PollRecord.replayHash)
              │
  Cube 7: Ranking Complete
     │
     └──► borda_hash = SHA-256(final_ranking_vector ‖ voter_count)
              │
              │  (recorded on-chain: VoteProof.bordaHash)
              │
  Cube 9: Export Generated
     │
     └──► export_hash = SHA-256(csv_bytes)
              │
              │  (recorded on-chain: PollRecord.exportHash)
              │
  FINAL PROOF:
     │
     └──► governance_proof = Keccak256(session_hash ‖ replay_hash
                                        ‖ borda_hash ‖ export_hash)
              │
              └──► Recorded on-chain as single 32-byte anchor
                   Anyone can verify by recomputing from components
```

### Dispute Resolution Protocol

| Stage | Action | Timeline | Arbiter |
|:-----:|--------|:--------:|---------|
| **1 — Challenge Filed** | Challenger submits dispute with specific claim (e.g., "Theme X should not exist" or "Response Y was excluded") | T+0 | Automated intake |
| **2 — Replay Triggered** | System runs full deterministic replay with challenger-provided inputs vs on-chain hashes | T+1 hour | Automated replay |
| **3a — Hash Match** | Replay produces identical hashes. Challenge dismissed with proof. Challenger shown replay evidence. | T+2 hours | System (automated) |
| **3b — Hash Mismatch** | Replay produces different hashes. Escalate to human review. Freeze affected session results. | T+2 hours | System (automated) |
| **4 — Human Review** | 3-of-5 multi-sig panel (MoT + 2 Masters + Quai liaison + independent auditor) reviews inputs, pipeline, and chain of custody | T+48 hours | Multi-sig panel |
| **5 — Resolution** | Panel publishes findings on-chain. If fraud confirmed: session invalidated, tokens clawed back, moderator flagged. If error: corrected hash appended. | T+72 hours | Multi-sig panel |

**AI Theming Disputes (specific to Cube 6):**
- Challenger can argue themes are biased or incorrect — but this is a *quality* dispute, not a *fairness* dispute
- System proves: given these inputs + this model + this seed, these themes are the deterministic output
- If challenger disagrees with the AI's judgment, they can request a re-run with a different model/seed — this creates a *new* governance round, not a reversal of the previous one
- The blockchain proves *what happened*, not *what should have happened* — normative disputes are out of scope for on-chain verification

### Cross-Poll Consistency

Comparing governance outcomes across sessions enables longitudinal analysis and trend detection:

| Comparison Type | Method | Use Case |
|----------------|--------|----------|
| **Theme drift** | Cosine similarity between cluster centroids across sessions | "Are the same topics emerging over time?" |
| **Ranking stability** | Kendall tau correlation between Borda rankings | "Do priorities shift between polls?" |
| **Participation equity** | Gini coefficient of response counts per user across sessions | "Is participation becoming more or less equal?" |
| **Governance convergence** | Jensen-Shannon divergence of ranking distributions | "Is the group approaching consensus over time?" |
| **Cross-session proof** | Chain of `governance_proof` hashes linked by `project_id` | "Prove this series of polls all belong to the same governance process" |

Cross-session proofs are linked on-chain via a `GovernanceChain` structure:

```
GovernanceChain {
    bytes32 projectHash;           // Keccak256(project_id)
    bytes32[] sessionProofs;       // Ordered array of governance_proof hashes
    uint32   sessionCount;         // Total sessions in chain
    bytes32  chainRoot;            // MerkleRoot(sessionProofs)
}
```

This enables a third party to verify not just a single poll, but an entire governance *process* spanning multiple sessions — critical for regulatory compliance and academic reproducibility.

---

### Round 9 — Christo (2026.04.14_v003)

## 12 Ascended Masters Consensus Report

### Master Contributions Summary

| Master | Round | Domain | Key Contribution |
|--------|:-----:|--------|-----------------|
| **Thor** | 1 | Security | Smart contract attack vectors, multi-sig requirements, rate limiting on-chain, audit firm recommendations |
| **Thoth** | 2 | Data Model | On-chain data structures (PollRecord, TokenEvent, VoteProof), gas cost estimates, storage optimization, indexing strategy |
| **Athena** | 3 | Strategy | Competitive analysis (vs Snapshot/Aragon/Tally), pricing model, go-to-market segmentation |
| **Krishna** | 4 | Integration | Per-cube blockchain touchpoints, exact function-to-contract mapping, gas cost summary, on-chain vs off-chain rationale |
| **Enki** | 5 | Edge Cases | 5 failure modes (chain down, gas spike, rate change, double-mint, jurisdiction gating), circuit breaker patterns, Merkle batching |
| **Odin** | 6 | Future-Proofing | 1B scale architecture, 9x9=81 parallel paths, cross-zone aggregation protocol, Base-3600 coordinates, drone swarm analogy |
| **Sofia** | 7 | Localization | 59-jurisdiction compliance mapping, KYC/AML tiers, geo-fencing, GDPR-blockchain resolution |
| **Aset** | 8 | Verification | Governance proof chain, replay verification protocol, dispute resolution, cross-poll consistency |
| **Christo** | 9 | Consensus | Final assessment, risk matrix, recommended next steps (this section) |
| **Enlil** | — | Implementation | Build verification support, migration path advisory across all rounds |
| **Pangu** | — | Innovation | Spiral centrifuge concept, 1B-scale sharding vision, cross-chain future architecture |
| **Asar** | — | Synthesis | Final synthesis review of all rounds, outcome coherence validation |

### Final Consensus: Phase Recommendations

| Phase | Description | Verdict | Vote | Rationale |
|-------|-------------|:-------:|:----:|-----------|
| **Phase 1** | Read-Only Bridge (testnet) | **PROCEED** | 12/12 | Zero financial risk. Validates integration pattern. Demonstrates on-chain governance proof to prospects. No regulatory burden (no tokens, no conversion). |
| **Phase 2** | Token Minting (♡ → QI) | **PROCEED with conditions** | 10/12 | Conditions: (1) Security audit complete (OpenZeppelin recommended), (2) KYC Level 1 minimum for all converters, (3) US legal opinion obtained re: Howey test for ♡ tokens, (4) Multi-sig deployed and tested. Thor and Sofia abstained pending legal clarity. |
| **Phase 3** | Full Bridge (웃/◬ + USDC off-ramp) | **DEFER** | 8/12 | Defer until: (1) Phase 2 running 6+ months without incident, (2) Trail of Bits audit complete, (3) MiCA CASP license obtained for EU operations, (4) Quai mainnet stability proven at scale. Odin, Thor, Sofia, Thoth voted defer citing regulatory and technical maturity risks. |

### Risk Matrix: Top 5 Risks

```
                    IMPACT
           Low      Medium      High      Critical
         ┌─────────┬──────────┬─────────┬──────────┐
  Almost │         │          │         │          │
 Certain │         │          │         │          │
         ├─────────┼──────────┼─────────┼──────────┤
  Likely │         │          │  [R3]   │          │
         │         │          │         │          │
         ├─────────┼──────────┼─────────┼──────────┤
Possible │         │   [R5]   │  [R2]   │   [R1]   │
         │         │          │         │          │
         ├─────────┼──────────┼─────────┼──────────┤
Unlikely │         │          │  [R4]   │          │
         │         │          │         │          │
         └─────────┴──────────┴─────────┴──────────┘
```

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|:----------:|:------:|------------|:-----:|
| **R1** | Regulatory classification of ♡ tokens as securities (Howey test failure) | Possible | Critical | Obtain legal opinion before Phase 2. Structure ♡ as non-transferable reward points until conversion. No secondary market for ♡. | Sofia |
| **R2** | Smart contract vulnerability leading to fund loss | Possible | High | Dual audit (OpenZeppelin Phase 2, Trail of Bits Phase 3). Bug bounty program. Multi-sig with emergency pause. Incremental deployment with caps. | Thor |
| **R3** | Quai Network instability or protocol-breaking upgrade | Likely | High | Abstract blockchain layer behind interface. Contract upgrade proxy pattern (UUPS). Maintain off-chain fallback for all on-chain features. Monitor Quai governance proposals. | Krishna |
| **R4** | GDPR enforcement action against on-chain hash storage | Unlikely | High | Hash-only architecture (no personal data on-chain). Obtain DPA pre-consultation in primary EU market. Document DPIA (Data Protection Impact Assessment). | Sofia |
| **R5** | Low user adoption of token conversion feature | Possible | Medium | Phase 1 proves value without conversion. Gamify on-chain proofs (verification badges). Free tier includes testnet proof. Conversion is opt-in, not required. | Athena |

### Recommended Next Steps (Priority Order)

| Priority | Action | Owner | Timeline | Dependency |
|:--------:|--------|:-----:|:--------:|------------|
| **1** | Deploy Phase 1 read-only bridge on Quai testnet | Enlil | 2-4 weeks | Quai testnet access (available) |
| **2** | Obtain US legal opinion on ♡ token classification | Sofia | 4-6 weeks | Engage crypto-specialized law firm |
| **3** | Draft DPIA (Data Protection Impact Assessment) for on-chain hashes | Sofia | 2-3 weeks | Internal (parallel with #1) |
| **4** | Build replay verification CLI tool (open-source) | Aset | 3-4 weeks | Cube 6+7 replay hash implementation |
| **5** | Engage OpenZeppelin for Phase 2 smart contract audit | Thor | 1 week to engage, 4-8 weeks audit | Smart contract code complete |
| **6** | Implement KYC integration (Jumio or Onfido) | Krishna | 4-6 weeks | Legal opinion (#2) confirms path |
| **7** | Build geo-fencing + sanctions screening service | Sofia | 2-3 weeks | MaxMind license + OFAC API access |
| **8** | Design multi-sig wallet infrastructure (HSM-backed) | Thor | 3-4 weeks | Audit firm engaged (#5) |
| **9** | Quai partnership discussion — testnet allocation, technical liaison | Athena | 2 weeks | Phase 1 demo ready (#1) |
| **10** | Community announcement — roadmap blog post + DAO outreach | Athena | 1 week | Phase 1 deployed (#1) |

### Document Version

> **Version:** 2026.04.14_v003
> **Rounds completed:** 9 of 9
> **Status:** Ready for Thought Master review
> **Next action:** Thought Master (MoT) final review and approval gate
> **Consensus:** Phase 1 PROCEED (unanimous), Phase 2 PROCEED with conditions (10/12), Phase 3 DEFER (8/12)
