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
