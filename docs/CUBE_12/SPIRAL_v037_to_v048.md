# Cube 12 SPIRAL v037-v048 -- 12 Ascended Masters Council

> **Date:** 2026-04-13
> **Builds on:** `NFT_ARX_DIVINITY.md` (Rounds 4-6), `QUAI_NFT_SPIRAL_PLAN.md` (Rounds 7-9), `SPIRAL_v013_to_v024.md`
> **Scope:** Divinity Guide + NFT ARX physical-digital binding
> **Target:** Production-ready Cube 12 specification in 12 iterations

---

## v037 -- Thor (Security): ARX Chip Challenge-Response Verification

**Improves over v036:** Previous rounds described ARX anti-cloning conceptually. v037 specifies the exact cryptographic protocol.

### Challenge-Response Flow

```
PHONE                          ARX CHIP                      BACKEND
  |-- 1. NFC scan ----------->|                               |
  |<- 2. chip_public_key -----|                               |
  |-- 3. request challenge --->|------------------------------>|
  |<- 4. nonce (32 bytes) ----|<-- random nonce --------------|
  |-- 5. sign(nonce) -------->|                               |
  |   (chip signs with         |                               |
  |    hardware private key)   |                               |
  |-- 6. {pubkey, sig, nonce} --------------------------->    |
  |                            |    7. verify(pubkey, sig,     |
  |                            |       nonce) against          |
  |                            |       ChipRegistry            |
  |<-------------------------- 8. {verified: true, owner, edition}
```

**Anti-counterfeit guarantees:**
- Private key never leaves chip silicon (ARX HaLo spec)
- Nonce prevents replay attacks (each verification is unique)
- ChipRegistry maps pubkey to token_id (cloned chip has wrong pubkey)
- Rate limit: max 10 verifications/minute per chip serial

**SSSES:** Security 92 | Stability 78 | Scalability 82 | Efficiency 80 | Succinctness 80
**Confidence to code in 20 min:** 35% -- crypto protocol needs careful implementation

---

## v038 -- Thoth (Data): Supabase Schema + Query Patterns

**Improves over v037:** Thor defined the verification protocol but not where data lives. v038 specifies exact tables, indexes, and query patterns.

### `arx_items` Table

```sql
CREATE TABLE arx_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id        TEXT UNIQUE NOT NULL,        -- on-chain NFT ID
  chip_serial     TEXT UNIQUE,                 -- ARX hardware serial
  chip_public_key TEXT,                        -- hex-encoded pubkey
  item_type       TEXT NOT NULL DEFAULT 'divinity_guide',
  edition_number  INT,
  edition_total   INT,
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT,
  metadata_cid    TEXT,                        -- IPFS CID
  price_usd       NUMERIC(10,2) NOT NULL,
  owner_id        UUID REFERENCES auth.users(id),
  owner_wallet    TEXT,
  language        TEXT DEFAULT 'en',
  status          TEXT DEFAULT 'minted',       -- minted/shipped/verified/transferred/burned
  minted_at       TIMESTAMPTZ DEFAULT now(),
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_arx_items_owner ON arx_items(owner_id);
CREATE INDEX idx_arx_items_status ON arx_items(status);
CREATE INDEX idx_arx_items_chip ON arx_items(chip_serial);
```

### `arx_transactions` Table

```sql
CREATE TABLE arx_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tx_ref          TEXT UNIQUE NOT NULL,        -- ARX-2026-000001 format
  item_id         UUID REFERENCES arx_items(id),
  tx_type         TEXT NOT NULL,               -- mint/purchase/transfer/resale/burn/refund
  from_user_id    UUID,
  to_user_id      UUID,
  price_usd       NUMERIC(10,2),
  platform_fee    NUMERIC(10,2),               -- 5% on resale
  stripe_payment_id TEXT,
  quai_tx_hash    TEXT,
  qr_code_buyer   TEXT,                        -- S3/R2 URL
  qr_code_seller  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_arx_tx_item ON arx_transactions(item_id);
CREATE INDEX idx_arx_tx_type ON arx_transactions(tx_type);
```

**Query patterns:** Owner lookup by user_id (O(1) indexed), marketplace browse by status='minted' + price sort, verification by chip_serial (unique index), transaction history by item_id.

**SSSES:** Security 85 | Stability 88 | Scalability 85 | Efficiency 90 | Succinctness 88
**Confidence to code in 20 min:** 65% -- migrations are straightforward

---

## v039 -- Krishna (Integration): Stripe -> Mint -> QR -> Email Pipeline

**Improves over v038:** Thoth defined storage. v039 wires payment to minting to delivery.

### Webhook Pipeline

```
Stripe checkout.session.completed
  |-> 1. Validate payment (idempotency key = stripe_session_id)
  |-> 2. Create arx_items record (status='minted')
  |-> 3. Call Quai SDK: mint NFT to buyer wallet (or custodial)
  |-> 4. Store quai_tx_hash in arx_transactions
  |-> 5. Generate 2 QR codes:
  |      buyer_qr:  /divinity-guide/arx?token={id}&verify=buyer&ts={unix}
  |      seller_qr: /divinity-guide/arx?token={id}&verify=seller&ts={unix}
  |-> 6. Upload QRs to R2 (Cloudflare)
  |-> 7. Send email to buyer (QR + edition certificate)
  |-> 8. Send email to seller/fulfillment (QR + shipping label trigger)
  |-> 9. Create arx_transactions record (tx_type='purchase')
```

**Idempotency:** Stripe webhook may fire multiple times. Check `arx_transactions.stripe_payment_id` uniqueness before step 2. Return 200 OK on duplicate.

**SSSES:** Security 84 | Stability 82 | Scalability 80 | Efficiency 83 | Succinctness 82
**Confidence to code in 20 min:** 40% -- Stripe + Quai SDK + email = many external deps

---

## v040 -- Athena (Strategy): Pricing + Platform Economics

**Improves over v039:** Krishna built the pipe. v040 defines what flows through it economically.

### Pricing Matrix

| Item | Primary Sale | Resale Fee | Creator Royalty |
|------|:-----------:|:----------:|:--------------:|
| Divinity Guide (softcover) | $33.33 | 5% platform | 5% to author |
| Divinity Guide (hardcover) | $44.44 | 5% platform | 5% to author |
| Collector's Edition (numbered) | $77.77 | 5% platform | 7% to author |
| Custom Collectible (user-set) | Variable | 5% platform | Configurable 0-10% |

**Platform fee logic:** On primary sale, 100% to seller minus Stripe fees (~2.9% + $0.30). On resale, 5% platform + creator royalty deducted before seller payout. Encoded in smart contract `royaltyInfo()` (ERC-2981).

**Break-even:** At $33.33 per book, after Stripe fees ($1.27) and ARX chip ($3), net margin = $29.06. Platform needs 35 sales/month to cover Quai gas + hosting.

**SSSES:** Security 80 | Stability 85 | Scalability 90 | Efficiency 85 | Succinctness 88
**Confidence to code in 20 min:** 70% -- pricing is config, not complex logic

---

## v041 -- Enki (Edge Cases): Failure Recovery Matrix

**Improves over v040:** Athena assumed happy paths. v041 breaks everything.

| Scenario | Detection | Recovery |
|----------|-----------|----------|
| **No NFC phone** | `navigator.nfc` undefined | Show QR scanner (camera) with "Scan the QR code inside the cover" prompt |
| **Damaged chip** | NFC read timeout after 5s | Owner logs in, proves wallet, requests replacement chip. Old serial revoked in DB. Ship cost only. |
| **Duplicate mint** | `arx_items.token_id` UNIQUE constraint | Return existing record. Log duplicate attempt. Alert admin if >3 attempts. |
| **Stripe webhook fails** | Missing arx_items record after 5 min | Cron job checks Stripe for unprocessed payments every 10 min. Manual admin queue. |
| **Quai mint fails** | quai_tx_hash is null after webhook | Retry 3x with exponential backoff (2s, 8s, 32s). If all fail, status='mint_failed', admin alert, manual resolution. |
| **Email delivery fails** | Bounce/complaint from SES | QR codes always stored in R2. User can retrieve from /divinity-guide/arx when logged in. |

**SSSES:** Security 86 | Stability 90 | Scalability 82 | Efficiency 78 | Succinctness 80
**Confidence to code in 20 min:** 45% -- error handling is the bulk of real code

---

## v042 -- Sofia (Localization): NFT Metadata + Lexicon Keys

**Improves over v041:** Enki handled failures but in English only. v042 internationalizes everything.

### NFT Metadata Structure (IPFS JSON)

```json
{
  "name": { "en": "The Divinity Guide", "es": "La Guia de la Divinidad", ... },
  "description": { "en": "Edition 1 of 1000...", ... },
  "image": "ipfs://Qm.../cover.jpg",
  "attributes": [
    { "trait_type": "edition", "value": 1 },
    { "trait_type": "total_editions", "value": 1000 },
    { "trait_type": "language", "value": "en" }
  ],
  "locales": ["en","es","uk","ru","zh","fa","he","pt","km","ne"]
}
```

### New Lexicon Keys (cube12 group, 14 keys)

`arx.browse_title`, `arx.verify_title`, `arx.own_title`, `arx.chip_tap_title`, `arx.edition_of`, `arx.verified_authentic`, `arx.qr_fallback`, `arx.transfer_btn`, `arx.resale_btn`, `arx.purchase_btn`, `arx.damaged_chip`, `arx.no_nfc`, `arx.mint_pending`, `arx.tx_history`

All keys added to `lexicon-data.ts` with `englishDefault` + `context` + `cubeId: 12`. Fallback chain: translation -> English -> raw key.

**SSSES:** Security 80 | Stability 86 | Scalability 82 | Efficiency 88 | Succinctness 90
**Confidence to code in 20 min:** 60% -- lexicon pattern is well-established

---

## v043 -- Odin (Architecture): service.py Exact Class Design

**Improves over v042:** Sofia defined what users see. v043 defines the backend brain.

```python
class ArxService:
    """Cube 12 — NFT ARX item management."""

    def __init__(self, db: SupabaseClient, quai: QuaiProvider):
        self.db = db
        self.quai = quai

    async def mint_item(self, buyer_id: str, item_type: str,
                        edition: int, price_usd: float,
                        language: str = "en") -> ArxItem:
        """Mint NFT on Quai, create arx_items record, return item."""

    async def verify_chip(self, chip_serial: str, chip_signature: str,
                          nonce: str) -> VerifyResult:
        """Challenge-response verification against ChipRegistry."""

    async def transfer_item(self, item_id: str, from_user: str,
                            to_user: str, price_usd: float = 0) -> ArxTransaction:
        """Transfer ownership. price=0 means gift. Records tx, updates owner."""

    async def list_marketplace(self, status: str = "minted",
                               limit: int = 20, offset: int = 0) -> list[ArxItem]:
        """Browse available items. Paginated, sorted by price."""

    async def claim_item(self, user_id: str, token_id: str,
                         chip_serial: str) -> ArxItem:
        """Post-delivery: buyer taps chip, binds to their account."""
```

~150 lines total. Each method: validate input, DB operation, Quai call (if needed), return typed result.

**SSSES:** Security 84 | Stability 85 | Scalability 85 | Efficiency 88 | Succinctness 92
**Confidence to code in 20 min:** 55% -- class skeleton is clear, Quai SDK calls need testing

---

## v044 -- Pangu (Innovation): Dual QR Code Architecture

**Improves over v043:** Odin defined backend methods. v044 innovates on the QR delivery mechanism.

### QR Payload Structure

```
https://exel-ai-polling.explore-096.workers.dev/divinity-guide/arx
  ?token=DG-2026-000042
  &verify=e3b0c44298fc1c14...  (SHA-256 of token_id + timestamp + salt)
  &ts=1718000000
  &role=buyer|seller
```

**Buyer QR:** Proves "I purchased this item at this time." Scannable by anyone to verify authenticity. Encoded in email + saved to user's /divinity-guide/arx dashboard.

**Seller QR:** Proves "I sold/shipped this item at this time." Contains same token_id but different verify hash (salted with seller_id). Used for fulfillment tracking and dispute resolution.

**Both QRs are timestamped and hash-linked to the on-chain transaction.** Neither can be forged without the backend salt. Verification: scan QR -> backend checks hash against stored record -> returns ownership + edition data.

**SSSES:** Security 88 | Stability 82 | Scalability 85 | Efficiency 85 | Succinctness 84
**Confidence to code in 20 min:** 60% -- QR generation is a library call, hashing is standard

---

## v045 -- Aset (Verification): /divinity-guide/arx Page Modes + Component Tree

**Improves over v044:** Pangu defined what QRs contain. v045 defines what the user sees when they arrive.

### 4 Modes

| Mode | Entry Point | Auth Required | Shows |
|------|-------------|:------------:|-------|
| **Browse** | Direct navigation | No | Marketplace grid, edition cards, "Own a Copy" CTA |
| **Verify** | QR scan or URL with `?token=` | No | Edition badge, ownership proof (masked wallet), authenticity stamp |
| **Own** | Logged-in owner visits | Yes | Full details, transfer/sell buttons, tx history, QR codes |
| **Chip Tap** | NFC tap redirects | No (verify) / Yes (claim) | Animation -> verification result -> claim prompt if unclaimed |

### Component Tree

```
ArxPage (page.tsx, ~250 LOC)
  |-- ArxBrowse (~80 LOC)          -- marketplace grid, ItemCard components
  |-- ArxVerify (~60 LOC)          -- authenticity badge, edition info
  |-- ArxOwner (~70 LOC)           -- transfer/sell forms, tx history list
  |-- ArxChipTap (~40 LOC)         -- NFC scan animation, verify result
  |-- shared: ArxItemCard (~30 LOC) -- edition thumbnail, price, status
```

Mode detected from URL params: no params = Browse, `?token=` = Verify, logged in + owns token = Own, `?chip=` = ChipTap.

**SSSES:** Security 82 | Stability 86 | Scalability 80 | Efficiency 84 | Succinctness 88
**Confidence to code in 20 min:** 50% -- UI layout is clear, NFC API integration is the risk

---

## v046 -- Asar (Synthesis): router.py Endpoints + Schemas

**Improves over v045:** Aset defined the frontend. v046 defines the API contract between frontend and backend.

### Endpoints (5 routes, ~100 LOC)

```python
# POST /api/v1/cube12/arx/mint
# Body: { item_type, edition, price_usd, language }
# Response: { item: ArxItem, tx: ArxTransaction }
# Auth: Moderator or Admin

# POST /api/v1/cube12/arx/verify
# Body: { chip_serial, chip_signature, nonce }
# Response: { verified: bool, item: ArxItem | null, owner_masked: str }
# Auth: None (public)

# POST /api/v1/cube12/arx/transfer
# Body: { item_id, to_user_id, price_usd? }
# Response: { tx: ArxTransaction, qr_buyer: str, qr_seller: str }
# Auth: Owner only

# GET /api/v1/cube12/arx/marketplace?status=minted&limit=20&offset=0
# Response: { items: ArxItem[], total: int }
# Auth: None (public)

# POST /api/v1/cube12/arx/claim
# Body: { token_id, chip_serial }
# Response: { item: ArxItem, claimed: bool }
# Auth: Authenticated user
```

**CRS Mapping:** CRS-NEW-12.01 (NFT mint), CRS-NEW-12.02 (chip verify), CRS-NEW-12.03 (transfer/resale), CRS-NEW-12.04 (marketplace), CRS-NEW-12.05 (claim/bind).

**SSSES:** Security 85 | Stability 84 | Scalability 82 | Efficiency 86 | Succinctness 90
**Confidence to code in 20 min:** 60% -- FastAPI router pattern is well-established in the codebase

---

## v047 -- Enlil (Build): Exact File Manifest + Test Stubs

**Improves over v046:** Asar defined the API. v047 specifies every file to create.

### Backend Files

| File | Lines | Imports |
|------|:-----:|---------|
| `backend/app/cubes/cube12_divinity_nft/service.py` | ~150 | `supabase`, `quais`, `hashlib`, `core.auth`, `core.config` |
| `backend/app/cubes/cube12_divinity_nft/router.py` | ~100 | `fastapi`, `service.ArxService`, `core.auth.require_role` |
| `backend/app/cubes/cube12_divinity_nft/models.py` | ~50 | `pydantic.BaseModel`, `datetime`, `enum` |
| `backend/app/cubes/cube12_divinity_nft/__init__.py` | ~5 | router export |
| `backend/migrations/014_arx_items.sql` | ~40 | CREATE TABLE, indexes |
| `backend/tests/cube12/test_arx_service.py` | ~120 | `pytest`, `unittest.mock`, service |
| `backend/tests/cube12/test_arx_router.py` | ~80 | `httpx.AsyncClient`, `fastapi.testclient` |

### Frontend Files

| File | Lines | Imports |
|------|:-----:|---------|
| `frontend/app/divinity-guide/arx/page.tsx` | ~250 | `react`, `next/navigation`, lexicon `t()` |
| `frontend/components/arx/arx-browse.tsx` | ~80 | `ArxItemCard` |
| `frontend/components/arx/arx-verify.tsx` | ~60 | verification display |
| `frontend/components/arx/arx-owner.tsx` | ~70 | transfer/sell forms |
| `frontend/components/arx/arx-chip-tap.tsx` | ~40 | Web NFC API |
| `frontend/components/arx/arx-item-card.tsx` | ~30 | shared card component |

### Test Stubs (backend/tests/cube12/test_arx_service.py)

```python
class TestMintItem:
    async def test_mint_creates_record(self): ...
    async def test_mint_idempotent(self): ...
    async def test_mint_invalid_type_rejected(self): ...

class TestVerifyChip:
    async def test_valid_signature_passes(self): ...
    async def test_invalid_signature_fails(self): ...
    async def test_revoked_chip_fails(self): ...

class TestTransferItem:
    async def test_transfer_updates_owner(self): ...
    async def test_transfer_creates_dual_qr(self): ...
    async def test_non_owner_transfer_rejected(self): ...

class TestMarketplace:
    async def test_list_paginated(self): ...
    async def test_filter_by_status(self): ...
```

**Total: ~925 lines backend, ~530 lines frontend = ~1,455 lines new code.**

**SSSES:** Security 82 | Stability 84 | Scalability 80 | Efficiency 85 | Succinctness 86
**Confidence to code in 20 min:** 40% -- 1,455 lines in 20 min = 73 LOC/min, aggressive but skeleton-possible

---

## v048 -- Christo (Consensus): Final Vote + 20-Minute Coding Plan

**Improves over v047:** Enlil listed files. v048 sequences the 20-minute sprint and assesses risk.

### 12 Masters Final Vote on Cube 12 Readiness

| Master | Vote | Rationale |
|--------|:----:|-----------|
| Thor | PROCEED | Security protocol is specified; can stub Quai calls |
| Thoth | PROCEED | Schema is clean, migration is standard |
| Krishna | PROCEED with conditions | Stripe webhook needs test mode; stub external calls |
| Athena | PROCEED | Pricing is config, not blocking |
| Enki | PROCEED | Edge cases documented; implement happy path first |
| Sofia | PROCEED | Lexicon pattern is copy-paste from existing cubes |
| Odin | PROCEED | Service class is well-defined |
| Pangu | PROCEED | QR generation is a library call |
| Aset | PROCEED | Component tree is clear |
| Asar | PROCEED | Router follows established FastAPI patterns |
| Enlil | PROCEED with conditions | 20 min is tight; prioritize backend skeleton |
| Christo | **PROCEED** | 11/12 clear, 1 conditional. Consensus achieved. |

**Result: 10 PROCEED, 2 PROCEED with conditions = APPROVED**

### 20-Minute Coding Plan (Cube 12 ONLY)

| Min | Task | Files | LOC |
|:---:|------|-------|:---:|
| 0-3 | Migration 014: arx_items + arx_transactions | `014_arx_items.sql` | 40 |
| 3-6 | models.py: Pydantic schemas | `models.py` | 50 |
| 6-12 | service.py: 5 methods with Quai stubs | `service.py` | 150 |
| 12-16 | router.py: 5 endpoints wired to service | `router.py` | 100 |
| 16-18 | __init__.py + register in main app | `__init__.py`, `main.py` | 10 |
| 18-20 | test stubs (11 test functions) | `test_arx_service.py` | 80 |

**Frontend deferred to next sprint** (needs NFC API testing on real device).

### Risk Check

| Risk | Severity | Mitigation in 20 min |
|------|:--------:|----------------------|
| Quai SDK not installed | High | Stub all Quai calls with `async def _mock_mint()` |
| No ARX chip for testing | High | Mock NFC verification, test happy path only |
| Stripe webhook complexity | Medium | Use test mode webhook, hardcode test product |
| 20 min too short for 430 LOC | Medium | Skip docstrings, minimal error handling, add TODO comments |

### Combined Cube 11 + Cube 12 Confidence

| Metric | Cube 11 (Quai Chain) | Cube 12 (NFT ARX) | Combined |
|--------|:-------------------:|:-----------------:|:--------:|
| Backend LOC needed | ~400 | ~430 | ~830 |
| External dependencies | Quai SDK | Quai SDK + Stripe + ARX | Heavy |
| Test stubs | ~15 tests | ~11 tests | ~26 tests |
| Schema migrations | 1 table | 2 tables | 3 tables |
| **20-min confidence** | **45%** | **40%** | **22%** |

**Combined confidence for coding BOTH Cube 11 AND Cube 12 in 20 minutes: 22%.**

The 22% reflects: (1) 830 lines across 2 cubes is 41.5 LOC/min sustained, (2) three external SDK integrations (Quai, Stripe, ARX) each need stubs, (3) three migrations, and (4) no time for frontend. Realistic 20-minute target: backend skeletons for ONE cube with stubs, not both. Recommended: 40-minute sprint (one cube per 20 min) raises combined confidence to 55%.

### SSSES Composite (v048 Final)

| Pillar | Score | Trend |
|--------|:-----:|:-----:|
| Security | 85 | +5 from v037 (challenge-response fully specified) |
| Stability | 84 | +6 from v038 (all edge cases have recovery) |
| Scalability | 83 | stable (physical manufacturing remains bottleneck) |
| Efficiency | 85 | +5 from v039 (pipeline is streamlined) |
| Succinctness | 86 | +6 from v043 (clear class boundaries) |
| **Average** | **84.6** | |
