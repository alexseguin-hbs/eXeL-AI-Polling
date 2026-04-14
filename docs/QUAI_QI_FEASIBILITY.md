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
| **Enlil** | 4 | Implementation | Build verification, migration paths, contract deployment checklist |
| **Krishna** | 5 | Integration | Cross-module dependencies, Cube-to-chain mapping, SDK bridge layer |
| **Odin** | 6 | Foresight | Predictive risk modeling, future-proofing for Quai protocol upgrades, chain migration strategy |
| **Sofia** | 7 | Localization | 59-jurisdiction compliance mapping, KYC/AML tiers, geo-fencing, GDPR-blockchain resolution |
| **Aset** | 8 | Verification | Governance proof chain, replay verification protocol, dispute resolution, cross-poll consistency |
| **Christo** | 9 | Consensus | Final assessment, risk matrix, recommended next steps (this section) |
| **Enki** | — | Diversity | Edge-case injection across all rounds (sanctioned country edge cases, minority language polls, single-participant sessions) |
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
