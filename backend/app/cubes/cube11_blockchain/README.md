# Cube 11 — Blockchain (Quai/QI)

> **Status:** Planned (v024) — DO NOT CODE until MoT approves
> **CRS:** CRS-23 (Audit trail)
> **Data flow:** Cube 9 → Cube 10 → Cube 11 (survey results → simulation verify → chain record)

## Purpose

Record completed survey governance proofs on Quai blockchain. Convert AI/SI/HI tokens to QI/USDC.

## Files to Create (when approved)

| File | Lines | Purpose |
|------|:-----:|---------|
| `service.py` | ~120 | Quai SDK wrapper: record_survey, convert_tokens, verify |
| `router.py` | ~80 | 3 endpoints: /chain/record-survey, /chain/verify, /chain/convert |
| `models.py` | ~30 | BlockchainRecord ORM model |

## Smart Contract

`contracts/SoIGovernance.sol` — Solidity 0.8.20, OpenZeppelin ERC-721
- `recordSurvey()`: Store governance_proof hash on-chain
- `verifySurvey()`: View function to verify a session hash exists

## Dependencies

- `quais` npm v1.0.0-alpha.54 (Quai SDK, ethers.js fork)
- Quai testnet: Cyprus-1 zone, Colosseum network
- Gas token: QUAI (not QI)

## Supabase Tables

- `blockchain_records` — survey proof records (see migration 014)
- `deferred_claim_tokens` — anonymous poller reward claims

## Governance Proof Chain

```
governance_proof = SHA-256(
    cube6_theme_hash  ||   ← AI pipeline determinism
    cube7_ranking_hash ||  ← Borda voting proof
    cube9_export_hash  ||  ← CSV content integrity
    cube1_session_hash     ← input corpus identity
)
```
