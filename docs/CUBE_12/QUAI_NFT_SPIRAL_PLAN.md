# Quai + NFT ARX Spiral Plan (Rounds 7-9)

> **Version:** 2026.04.14_v004
> **Status:** Planning (documentation only, no code)
> **Rounds:** 7 of 9, 8 of 9, 9 of 9 (combined survey-on-chain + NFT ARX integration)
> **Prerequisite docs:**
> - `docs/QUAI_QI_FEASIBILITY.md` (Rounds 1-9: Quai blockchain integration feasibility)
> - `docs/QUAI_SURVEY_ONCHAIN.md` (Rounds 1-3: survey results on-chain — not yet created)
> - `docs/NFT_ARX_DIVINITY.md` (Rounds 4-6: NFT + ARX chip for Divinity Guide — not yet created)
> **Context:** Rounds 1-3 (survey-on-chain) and Rounds 4-6 (NFT ARX) are planned in separate documents. This document assumes their outputs and connects the two into a unified spiral.

---

## Round 7 — Odin (Architecture): How Survey-on-Chain + NFT ARX Connect

**SPIRAL evolution over Round 6:** Round 6 (Odin, in `QUAI_QI_FEASIBILITY.md`) future-proofed the Quai integration to 1B scale with 81 parallel execution paths and the Base-3600 coordinate system. Round 7 takes the next step: fusing the *two* on-chain workstreams (survey governance proofs and NFT minting for the Divinity Guide) into a single, shared infrastructure layer. Where Round 6 asked "how big can this get?", Round 7 asks "how tightly can these two systems share a spine?"

### The SPIRAL: Survey to NFT in One Chain

The closed loop works as follows:

```
SURVEY SPIRAL                         NFT SPIRAL
─────────────                         ──────────
1. User submits response              1. Reader discovers Divinity Guide
2. Cube 6 clusters themes             2. Reader donates ($9.99+ tier)
3. Cube 7 ranks via Borda             3. System mints DivinityNFT on Quai
4. replay_hash recorded on Quai       4. NFT encodes governance_proof link
5. User earns ♡ tokens                5. ARX chip programmed with NFT URI
6. ♡ converts to QI                   6. Physical book ships with NFC chip
        │                                      │
        └──────────► QI ◄─────────────────────┘
                     │
            Can purchase Divinity Guide NFT
            (closing the loop)
```

The key architectural insight: survey participation *funds* the Divinity Guide, and the Divinity Guide *validates* the governance process. Each edition's sales generate QI that subsidizes the next governance round's gas costs.

### Shared Smart Contract Architecture

One Quai contract handles both workstreams, reducing deployment cost, audit surface, and maintenance burden:

```solidity
// SoIGovernance.sol — unified contract
contract SoIGovernance is ReentrancyGuard, Pausable, AccessControl {

    // === SURVEY ON-CHAIN (from QUAI_SURVEY_ONCHAIN.md) ===
    struct SurveyRecord {
        bytes32 sessionHash;
        bytes32 replayHash;
        bytes32 exportHash;
        uint32  participantCount;
        uint40  timestamp;
    }
    mapping(bytes32 => SurveyRecord) public surveys;

    function recordSurvey(bytes32 sessionHash, bytes32 replayHash,
                          bytes32 exportHash, uint32 participants) external;

    // === DIVINITY NFT (from NFT_ARX_DIVINITY.md) ===
    struct DivinityNFT {
        uint256 tokenId;
        bytes32 governanceProof;   // links to SurveyRecord
        string  arxChipId;         // physical ARX chip serial
        string  metadataURI;       // IPFS or Quai storage
        uint40  mintedAt;
    }
    mapping(uint256 => DivinityNFT) public divinityTokens;

    function mintDivinityNFT(address recipient, bytes32 governanceProof,
                              string calldata arxChipId,
                              string calldata metadataURI) external;

    // === TOKEN BRIDGE (from QUAI_QI_FEASIBILITY.md) ===
    function convertHeartToQI(bytes32 ledgerHash, uint256 heartAmount,
                               bytes32 sessionHash) external;
}
```

### Token Flow: Closed-Loop Governance Economy

```
PARTICIPATE (earn)          CONVERT (bridge)           PURCHASE (spend)
──────────────              ────────────────           ─────────────────
♡ earned via polling   ──►  ♡ → QI via bridge    ──►  QI buys Divinity NFT
                                                       │
                            Gas costs paid by     ◄────┘
                            NFT sale revenue
                            (self-sustaining)
```

At steady state, a governance session costing ~$0.015 in gas (from Round 4, Krishna) is funded by a single Divinity Guide NFT sale ($9.99+), covering approximately 666 session lifecycles. The economy is self-sustaining once 1 NFT sells per 666 sessions.

### SSSES Assessment (Round 7)

| Pillar | Score | Rationale |
|--------|:-----:|-----------|
| **Security** | 85 | Single contract reduces audit surface vs two separate contracts. Shared `Pausable` and `ReentrancyGuard`. Risk: combined contract means a bug in NFT logic could affect survey proofs. Mitigation: strict function-level access control via OpenZeppelin `AccessControl`. |
| **Stability** | 80 | Shared contract deployment means one upgrade path, not two. Risk: survey and NFT workloads compete for gas during peak. Mitigation: survey proofs are batched (Merkle root), NFT mints are individual and rate-limited. |
| **Scalability** | 90 | Both workstreams benefit from Quai's 9-zone sharding. Survey proofs route to Hydra zones; NFT mints route to Cyprus zones. No cross-zone contention. |
| **Efficiency** | 85 | Single deployment saves ~2.5M gas ($0.04). Shared mappings reduce storage reads. Combined ABI simplifies frontend integration. |
| **Succinctness** | 75 | One contract with two domains risks bloat. Mitigation: internal library separation (`SurveyLib`, `DivinityLib`) with facade pattern. Target: <500 LOC total. |

---

## Round 8 — Pangu (Innovation): What Makes This Unprecedented

**SPIRAL evolution over Round 7:** Round 7 established the shared infrastructure connecting survey-on-chain and NFT ARX. Round 8 steps back to ask: *why does this matter?* What makes the combination of AI theming + democratic ranking + blockchain proof + physical NFC chip unprecedented in the market? Where Round 7 was plumbing, Round 8 is vision.

### No Other Platform Combines These Four Elements

```
     ┌──────────────────┐
     │  AI THEMING       │    Cube 6: MiniBatchKMeans + summarization
     │  (Artificial)     │    Unstructured text → ranked themes
     └────────┬─────────┘
              │
     ┌────────▼─────────┐
     │  DEMOCRATIC RANK  │    Cube 7: Borda aggregation + governance weights
     │  (Human)          │    Themes → prioritized outcomes
     └────────┬─────────┘
              │
     ┌────────▼─────────┐
     │  BLOCKCHAIN PROOF │    Quai: replay_hash + governance_proof
     │  (Shared Intent)  │    Outcomes → immutable, verifiable record
     └────────┬─────────┘
              │
     ┌────────▼─────────┐
     │  PHYSICAL NFT     │    ARX chip: NFC-programmed with on-chain URI
     │  (Embodied)       │    Record → tangible, holdable artifact
     └──────────────────┘
```

Snapshot records votes. Aragon executes proposals. Tally tallies ballots. None of them take raw human language, compress it through AI, rank it democratically, prove the pipeline on-chain, and embed the proof in a physical object you can hold. The SoI Governance Engine is the first platform where the *entire governance lifecycle* — from thought to artifact — is auditable end-to-end.

### The Divinity Guide: First Governance-Verified Spiritual Text

The Divinity Guide (10 languages, dynamic imports, `/divinity-guide` route) becomes something no book has been before: a text whose *readership funds its own governance verification*. Each edition's NFT sales generate QI that pays for the next round of survey gas costs. The book is not just read — it participates in the governance economy.

```
Edition 1 sales ($9.99 x N readers)
    │
    ├──► Gas for N x 666 governance sessions
    │
    └──► Fund Edition 2 translation (AI-assisted, human-verified)
              │
              └──► Edition 2 NFT encodes governance_proof from Edition 1 surveys
                        │
                        └──► Readers of Edition 2 verify Edition 1's governance
```

Each edition is a *governance receipt* for the previous edition. The chain of editions forms a `GovernanceChain` (from Round 8, Aset in `QUAI_QI_FEASIBILITY.md`) — a linked list of cryptographic proofs that the governance process was fair across the entire publication history.

### Drone Swarm Parallel: ARX Chips as Physical Governance Nodes

Round 6 (Odin) introduced the drone swarm analogy — each cube as an autonomous agent. ARX NFC chips extend this to the physical world:

| Drone Swarm Property | ARX Chip Equivalent |
|---------------------|---------------------|
| **Unique identity** | ARX chip serial number (hardware-burned, unclonable) |
| **Mission data** | NFT URI pointing to governance_proof on Quai |
| **Communication** | NFC tap — phone reads chip, verifies on-chain |
| **Formation** | Each chip is a node in the physical governance constellation |
| **Autonomy** | Chip operates offline; proof verifiable without central server |
| **Self-verification** | SHA-256(chip_data) matches on-chain hash = authentic |

A room full of Divinity Guide holders is a *physical governance network*. Each book can verify every other book's governance lineage via NFC tap and on-chain lookup. No server required. No internet required for the initial NFC read — only for on-chain verification.

### Base-3600 Coordinate: NFT Position in Governance Constellation

Each DivinityNFT could encode a Base-3600 coordinate (SA.EA.HU) representing the owner's position in the governance constellation:

| Component | NFT Mapping | Example |
|-----------|-------------|---------|
| **SA** (Spatial) | Quai zone where NFT was minted (0-8) | `0003` = Paxos Zone 3 (Cube 6 AI) |
| **EA** (Entity) | Sequential mint number within zone | `0042` = 42nd NFT minted in this zone |
| **HU** (Hash) | Governance artifact type (5 = DivinityNFT) | `0005` = Divinity Guide NFT type |

Full coordinate: `0003.0042.0005` — locatable on Quai, verifiable on-chain, meaningful in the governance topology. Two NFT holders can compare coordinates to determine which zone and which governance epoch their copies belong to.

### SSSES Assessment (Round 8)

| Pillar | Score | Rationale |
|--------|:-----:|-----------|
| **Security** | 80 | ARX chips are hardware-unclonable (manufacturer guarantee). Risk: NFC relay attacks (reading chip remotely). Mitigation: ARX chips support challenge-response authentication, not just static ID. |
| **Stability** | 85 | Physical artifacts are inherently stable — no server dependency for basic verification. NFC works offline. On-chain verification requires network but is supplementary. |
| **Scalability** | 75 | Physical manufacturing (books + chips) is the bottleneck, not digital infrastructure. Print-on-demand with NFC chip insertion scales to ~10K units/month via partners. |
| **Efficiency** | 80 | One NFC tap replaces: QR scan + server lookup + database query. Chip stores complete verification payload locally. |
| **Succinctness** | 85 | ARX SDK is a single npm package (`@aspect-ratio/arx`). NFC Web API is 3 browser calls (`NDEFReader.scan()`, `read()`, `write()`). Frontend integration: ~100 LOC. |

---

## Round 9 — Christo (Consensus): 12 Masters Final Vote + Execution Roadmap

**SPIRAL evolution over Round 8:** Round 8 articulated *why* this combination is unprecedented. Round 9 brings the 12 Ascended Masters to consensus on *whether* and *when* to execute. Each master's contribution across all 9 rounds is summarized, risks are consolidated, and a phased execution plan is proposed for vote.

### All 9 Rounds: Summary of Contributions

| Round | Master | Domain | Key Contribution | What It Improved Over Previous Round |
|:-----:|--------|--------|-------------------|--------------------------------------|
| 1 | **Thor** | Security | Smart contract attack vectors, multi-sig, rate limiting, audit firms | Baseline — established security foundations |
| 2 | **Thoth** | Data Model | On-chain structures (PollRecord, TokenEvent, VoteProof), gas estimates | Added data precision to Round 1's security framework |
| 3 | **Athena** | Strategy | Competitive analysis, pricing model, go-to-market segmentation | Added business viability to Rounds 1-2's technical design |
| 4 | **Krishna** | Integration | Per-cube blockchain touchpoints, function-to-contract mapping | Grounded Rounds 1-3 in actual codebase locations |
| 5 | **Enki** | Edge Cases | 5 failure modes, circuit breaker patterns, Merkle batching | Stress-tested Round 4's integration points |
| 6 | **Odin** | Future-Proofing | 1B architecture, 9x9=81 parallel paths, Base-3600 coordinates | Scaled Round 5's patterns to planetary capacity |
| 7 | **Odin** | Architecture | Shared contract for survey + NFT, token flow loop, gas self-funding | Connected two separate workstreams into one infrastructure |
| 8 | **Pangu** | Innovation | Unprecedented 4-element combination, ARX as governance nodes, coordinate encoding | Articulated *why* Round 7's architecture matters |
| 9 | **Christo** | Consensus | Final vote, risk matrix, phased roadmap, hour estimates | Synthesizes Rounds 1-8 into actionable plan |

**Supporting masters (cross-round):**

| Master | Role Across Rounds |
|--------|--------------------|
| **Enlil** | Build verification and migration path advisory |
| **Sofia** | 59-jurisdiction compliance, GDPR-blockchain resolution, localization |
| **Aset** | Governance proof chain, replay verification, dispute resolution |
| **Asar** | Final synthesis and outcome coherence validation |

### Risk Matrix: Combined Survey + NFT Plan

```
                    IMPACT
           Low      Medium      High      Critical
         +─────────+──────────+─────────+──────────+
  Almost |         |          |         |          |
 Certain |         |          |         |          |
         +─────────+──────────+─────────+──────────+
  Likely |         |          |  [R3]   |          |
         |         |          |  [R6]   |          |
         +─────────+──────────+─────────+──────────+
Possible |         |   [R5]   |  [R2]   |   [R1]   |
         |         |   [R8]   |  [R7]   |          |
         +─────────+──────────+─────────+──────────+
Unlikely |         |          |  [R4]   |          |
         |         |          |         |          |
         +─────────+──────────+─────────+──────────+
```

| ID | Risk | Likelihood | Impact | Mitigation |
|----|------|:----------:|:------:|------------|
| **R1** | ♡ tokens classified as securities (Howey test) | Possible | Critical | Legal opinion before Phase B. Structure as non-transferable rewards. |
| **R2** | Smart contract vulnerability in unified contract | Possible | High | OpenZeppelin audit (Phase A), Trail of Bits (Phase B). |
| **R3** | Quai Network instability or breaking upgrade | Likely | High | Abstract blockchain behind interface. UUPS proxy. Off-chain fallback. |
| **R4** | GDPR enforcement against on-chain hash storage | Unlikely | High | Hash-only architecture. No personal data on-chain. DPIA documented. |
| **R5** | Low user adoption of token conversion | Possible | Medium | Phase A proves value without conversion. Gamify verification badges. |
| **R6** | ARX chip supply chain disruption | Likely | High | Dual supplier. Stock 90-day buffer. Fallback to QR-code-only verification. |
| **R7** | NFC browser API inconsistency (iOS Safari) | Possible | High | Progressive enhancement: NFC on Android, QR fallback on iOS. Web NFC API is Chrome-only as of 2026. |
| **R8** | Print-on-demand quality variance for embedded chips | Possible | Medium | Partner with ARX-certified print houses. QA sampling on each batch. |

### Implementation Phases

#### Phase A: Survey on-chain (Quai testnet) — 2-4 weeks

| Task | Hours (Human) | Hours (AI) | Total |
|------|:------------:|:----------:|:-----:|
| Deploy `SoIGovernance` contract to Quai testnet | 8 | 4 | 12 |
| Implement `recordSurvey` integration in Cube 6 + Cube 7 | 16 | 8 | 24 |
| Build replay verification CLI tool | 12 | 6 | 18 |
| Dashboard indicator: "On-chain proof: pending/verified" | 6 | 3 | 9 |
| Integration tests (testnet) | 10 | 4 | 14 |
| **Phase A Total** | **52** | **25** | **77** |

#### Phase B: NFT contract + ARX integration — 4-8 weeks

| Task | Hours (Human) | Hours (AI) | Total |
|------|:------------:|:----------:|:-----:|
| Extend `SoIGovernance` with `DivinityNFT` struct + ERC-721 | 20 | 8 | 28 |
| ARX SDK integration (chip read/write/verify) | 16 | 4 | 20 |
| NFT metadata schema + IPFS pinning service | 12 | 6 | 18 |
| ♡ to QI conversion endpoint + rate locking | 16 | 6 | 22 |
| OpenZeppelin security audit engagement + remediation | 24 | 0 | 24 |
| KYC integration (Jumio/Onfido) for conversion | 20 | 4 | 24 |
| **Phase B Total** | **108** | **28** | **136** |

#### Phase C: `/divinity-guide-arx` frontend route — 2-3 weeks

| Task | Hours (Human) | Hours (AI) | Total |
|------|:------------:|:----------:|:-----:|
| New Next.js route `/divinity-guide-arx` | 8 | 4 | 12 |
| NFC scan UI (Web NFC API + QR fallback) | 12 | 4 | 16 |
| On-chain verification display (governance proof chain) | 10 | 4 | 14 |
| NFT ownership display + Base-3600 coordinate | 8 | 3 | 11 |
| Responsive design (mobile-first, NFC is phone-primary) | 6 | 2 | 8 |
| Lexicon keys for all 34 languages | 4 | 8 | 12 |
| **Phase C Total** | **48** | **25** | **73** |

#### Phase D: Phone NFC programming flow — 4-6 weeks

| Task | Hours (Human) | Hours (AI) | Total |
|------|:------------:|:----------:|:-----:|
| ARX chip programming flow (write NFT URI to chip) | 16 | 4 | 20 |
| Batch programming tool for print house workers | 12 | 4 | 16 |
| Challenge-response authentication protocol | 20 | 6 | 26 |
| Print house integration + QA sampling workflow | 16 | 2 | 18 |
| End-to-end testing (program chip, embed in book, scan, verify) | 12 | 4 | 16 |
| iOS fallback flow (QR code inside book cover) | 8 | 4 | 12 |
| **Phase D Total** | **84** | **24** | **108** |

### Grand Total

| Phase | Human Hours | AI Hours | Total Hours | Calendar Weeks |
|-------|:----------:|:--------:|:-----------:|:--------------:|
| **A** Survey on-chain | 52 | 25 | 77 | 2-4 |
| **B** NFT + ARX contract | 108 | 28 | 136 | 4-8 |
| **C** Frontend route | 48 | 25 | 73 | 2-3 |
| **D** Phone NFC flow | 84 | 24 | 108 | 4-6 |
| **TOTAL** | **292** | **102** | **394** | **12-21** |

### 12 Masters Final Vote

| Phase | Description | Vote | Result | Conditions |
|-------|-------------|:----:|:------:|------------|
| **A** | Survey on-chain (Quai testnet) | 12/12 | **PROCEED** | Zero financial risk. Read-only proofs. Validates pattern. No regulatory burden. |
| **B** | NFT contract + ARX integration | 9/12 | **PROCEED with conditions** | (1) OpenZeppelin audit complete, (2) US legal opinion on ♡ classification obtained, (3) KYC Level 1 for all converters, (4) ARX supplier contract signed. Thor, Sofia, Thoth voted DEFER pending legal + audit. |
| **C** | `/divinity-guide-arx` frontend | 11/12 | **PROCEED** | Can begin in parallel with Phase B (no on-chain dependency for UI scaffolding). Enki voted DEFER citing Web NFC API immaturity on iOS. |
| **D** | Phone NFC programming flow | 7/12 | **DEFER** | Defer until: (1) Phase B running 3+ months, (2) ARX chip supply chain validated at 1K+ units, (3) Web NFC API supported on iOS Safari (or fallback proven adequate), (4) Print house partner qualified. Odin, Thor, Sofia, Thoth, Aset voted DEFER citing physical manufacturing complexity. |

### Consensus Summary

- **Phase A is unanimous.** Begin immediately on Quai testnet.
- **Phase B proceeds with conditions.** Legal and security gates must clear before any real token conversion.
- **Phase C can start in parallel** with Phase B for UI scaffolding; on-chain features gated behind Phase B completion.
- **Phase D deferred** until physical supply chain is proven. Digital-only (QR code) fallback covers the gap.

### Document Version

> **Version:** 2026.04.14_v004
> **Rounds completed:** 7, 8, 9 of 9 (combined survey-on-chain + NFT ARX)
> **Status:** Ready for Thought Master review
> **Next action:** Thought Master (MoT) final review and approval gate
> **Consensus:** Phase A PROCEED (12/12), Phase B PROCEED with conditions (9/12), Phase C PROCEED (11/12), Phase D DEFER (7/12)
