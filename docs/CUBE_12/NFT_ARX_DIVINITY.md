# NFT ARX Integration — Divinity Guide Physical Items

> **Version:** 2026.04.14_v004
> **Status:** Planning (Rounds 4-6 of 9)
> **Builds on:** `docs/QUAI_QI_FEASIBILITY.md` (v003, Rounds 1-9 complete)
> **Approval required:** Master of Thought + Thought Master
> **Target phase:** MVP3+ (post Quai Phase 1 testnet deployment)

---

## What's NEW vs QUAI_QI_FEASIBILITY.md

The feasibility plan covers on-chain governance proofs, token conversion (Heart/HI/Triangle to QI), and smart contract architecture for the polling engine. **This document extends it** with a wholly new capability: **physical item authentication via NFC chips (ARX) linked to NFTs on Quai**, starting with the Divinity Guide book. None of the following was addressed in the feasibility plan:

- Physical-to-digital ownership binding (NFT + NFC chip)
- ARX chip programming flow from a phone
- `/divinity-guide-arx` frontend route
- Resale/transfer/refund lifecycle for physical NFTs
- Multi-language NFT metadata
- Jurisdiction-aware purchase terms for physical+digital hybrid products

---

## Round 4 — Krishna (Integration): The Phone-to-Chip Flow

### User Journey

1. **Discovery:** User is reading the Divinity Guide at `/divinity-guide`. A "Purchase Physical Copy" button appears below the Flower of Life navigation (conditionally rendered, not shown to users who already own one).
2. **Payment:** Button opens Stripe Checkout with the item (book or artifact), edition, and shipping address. Price follows the 8-tier monetization model (see Round 6). Stripe webhook confirms payment.
3. **NFT Mint:** Backend calls Quai SDK to mint a Divinity Guide NFT to the user's wallet. If the user has no wallet, a custodial wallet is created automatically (same pattern as Cube 8 token ledger). The NFT contract extends the `SoITokenBridge` from the feasibility plan with a new `DivinityEdition` struct.
4. **Shipping + ARX Chip:** The physical item ships with an ARX NFC chip embedded (spine of book, base of artifact). The chip is pre-programmed at fulfillment with: NFT token ID, edition number (e.g., 1 of 1000), Divinity Guide content version hash, and a chip-unique ARX serial number.
5. **Ownership Binding:** When the user receives the item, they tap it with their phone. The ARX app (or Web NFC API on Android Chrome) reads the chip, which redirects to `/divinity-guide-arx?chip={arxSerial}&token={nftId}`. The page calls the Quai contract to verify on-chain ownership matches the logged-in user's wallet.

### ARX Chip Data Schema

| Field | Size | Source | Mutable |
|-------|------|--------|:-------:|
| `nft_token_id` | 32 bytes | Quai contract mint event | On transfer only |
| `owner_wallet` | 20 bytes | Buyer's Quai address | On transfer only |
| `edition_number` | 4 bytes | Sequential per print run | Never |
| `content_version_hash` | 32 bytes | SHA-256 of Divinity Guide JSON at mint time | Never |
| `arx_serial` | 16 bytes | Factory-assigned, unique per chip | Never |

### Frontend Route: `/divinity-guide-arx`

This page serves two purposes depending on context:

- **Tap verification (unauthenticated):** Shows edition info, ownership proof (wallet address, masked), and a "This is an authentic Divinity Guide" badge. No login required -- anyone can tap to verify.
- **Owner view (authenticated):** Shows full ownership details, edition certificate, link to the on-chain transaction, resale listing option, and a button to transfer ownership to a new wallet (for gifting or resale).

### SSSES Assessment

| Pillar | Score | Rationale |
|--------|:-----:|-----------|
| Security | 80 | On-chain verification prevents counterfeits. ARX chip serial is hardware-bound. Risk: NFC relay attacks (mitigated by requiring wallet signature for ownership actions). |
| Stability | 75 | Depends on Quai uptime for verification. Fallback: cache last-known ownership state for offline tap display with "last verified" timestamp. |
| Scalability | 85 | NFT minting is per-purchase (low volume vs polling). ARX verification is a single contract read -- minimal gas. |
| Efficiency | 80 | Single NFC tap triggers one on-chain read. No polling loops. Stripe webhook is async. |
| Succinctness | 85 | Reuses existing Quai bridge from feasibility plan. New code: one Next.js route, one contract extension, one Stripe webhook handler. |

---

## Round 5 — Enki (Edge Cases): What Can Go Wrong

### Edge Case 1: Phone Lacks NFC

**Scenario:** iOS Safari does not support Web NFC. Older Android phones may lack NFC hardware.
**Fallback:** Every physical item includes a printed QR code (inside cover for books, on certificate card for artifacts) that encodes the same URL: `/divinity-guide-arx?chip={arxSerial}&token={nftId}`. QR scan provides identical verification, minus the hardware-attestation layer. The verification page notes "Verified via QR (chip not physically read)" to distinguish from NFC tap verification.

### Edge Case 2: ARX Chip Damaged

**Scenario:** Chip is physically destroyed (water damage, demagnetized, cracked spine).
**Recovery:** Ownership is on-chain, not on the chip. The user logs in at `/divinity-guide-arx`, proves wallet ownership, and requests a replacement chip. Fulfillment ships a new ARX chip pre-programmed with the same NFT token ID. The old chip serial is revoked in a `ChipRegistry` contract (mapping `arxSerial => active/revoked`). Cost: shipping only (chip cost is negligible).

### Edge Case 3: NFC Data Copied

**Scenario:** An attacker reads the NFC data and writes it to a blank chip (cloning).
**Mitigation:** ARX chips use asymmetric cryptography -- each chip has a private key burned at factory that signs a challenge during NFC read. The verification contract checks the chip's signature against the registered public key. A cloned chip cannot produce a valid signature. Additionally, the `ChipRegistry` contract maps each `arxSerial` to exactly one `nft_token_id` -- duplicate registrations are rejected.

### Edge Case 4: Resale / Ownership Transfer

**Flow:** Seller lists on `/divinity-guide-arx` (or external marketplace). Buyer purchases. Smart contract transfers NFT ownership. **Critical step:** Buyer must physically tap the item with their phone to re-bind the ARX chip to their wallet. Until re-tap, the chip still shows the old owner -- but on-chain ownership has transferred. The chip's `owner_wallet` field is updated via a signed NFC write (requires new owner's wallet signature + physical chip presence).

### Edge Case 5: Refund

**Flow:** User requests refund within the return window. Stripe processes refund. Backend calls `burn(tokenId)` on the NFT contract. The `ChipRegistry` marks the chip serial as `deactivated`. If the physical item is returned, the chip can be re-programmed for a future sale. If not returned, the chip is inert (on-chain lookup returns "burned").

### SSSES Assessment

| Pillar | Score | Rationale |
|--------|:-----:|-----------|
| Security | 85 | ARX asymmetric crypto prevents cloning. ChipRegistry prevents duplicate registration. Burn-on-refund prevents ghost NFTs. |
| Stability | 80 | Every failure mode has a recovery path. QR fallback ensures access even without NFC. Chip replacement is a simple fulfillment operation. |
| Scalability | 85 | ChipRegistry is append-only with O(1) lookups. Resale transfers are standard ERC-721 operations. |
| Efficiency | 75 | Re-tap requirement for resale adds friction (intentional -- prevents pure-digital flipping without possessing the physical item). |
| Succinctness | 80 | Five edge cases, five mitigations. No over-engineering -- ChipRegistry is ~50 lines of Solidity. |

---

## Round 6 — Sofia (Localization): Multi-Language NFT Experience

### NFT Metadata in 10 Languages

The Divinity Guide supports 10 languages: English, Spanish, Ukrainian, Russian, Chinese, Farsi, Hebrew, Portuguese, Khmer, and Nepali. NFT metadata must reflect the buyer's language:

- **`name`**: "The Divinity Guide: The Return to Wholeness and Living Divinity" (localized per language)
- **`description`**: 1-2 sentence summary of the edition, in the buyer's language at time of purchase
- **`attributes`**: Language-agnostic (edition number, content hash, print date) -- no translation needed
- **`external_url`**: Points to `/divinity-guide-arx?lang={code}` so the verification page renders in the correct language

Metadata is stored on IPFS (via Pinata or nft.storage) with a `locale` field. The contract stores the IPFS CID; the frontend resolves the correct locale from the metadata JSON. One NFT, one CID, 10 locale objects inside the JSON -- not 10 separate NFTs.

### ARX Verification Page Localization

`/divinity-guide-arx` uses the same `t()` lexicon system as the rest of the frontend (702+ keys, 34 languages). New lexicon keys added under a `cube9_arx` group:

- `arx.verified_badge` -- "Authentic Divinity Guide"
- `arx.edition_label` -- "Edition {n} of {total}"
- `arx.owner_label` -- "Owned by"
- `arx.transfer_button` -- "Transfer Ownership"
- `arx.resale_button` -- "List for Resale"
- `arx.qr_fallback_notice` -- "Verified via QR (chip not physically read)"

The page auto-detects language from: (1) URL `?lang=` param, (2) localStorage locale, (3) browser `navigator.language`, (4) English fallback.

### 8-Tier Pricing for Physical Items

Physical Divinity Guide editions map to the locked 8-tier monetization model:

| Tier | Price (USD) | Physical Item | Includes |
|------|:-----------:|---------------|----------|
| FREE | $0 | -- | Digital-only access (no NFT, no physical item) |
| 1 | $1.11 | -- | Digital + donation badge |
| 2 | $3.33 | Bookmark with ARX chip | NFT certificate, NFC-verifiable bookmark |
| 3 | $4.44 | Postcard set with ARX chip | NFT + 12 chapter art postcards |
| 4 | $7.77 | Softcover book with ARX chip | NFT + full printed Divinity Guide |
| 5 | $9.99 | Hardcover book with ARX chip | NFT + premium binding + ribbon marker |
| 6 | $11.11 | Collector's edition with ARX chip | NFT + numbered hardcover + art prints |
| 7 | $12.12 | Sacred artifact with ARX chip | NFT + handcrafted item + signed certificate |

Stripe Checkout displays prices in the user's local currency (Stripe handles FX). The NFT metadata includes `tier` as an attribute.

### Legal: NFT Purchase Terms per Jurisdiction

| Region | Key Requirement | Implementation |
|--------|----------------|----------------|
| **US** | NFTs may be classified as collectibles (not securities) if no profit expectation is marketed. Sales tax applies to physical items per state nexus. | Stripe Tax for automatic sales tax calculation. Marketing avoids "investment" language. Terms state: "This NFT represents ownership of a physical item, not a financial instrument." |
| **EU** | VAT on physical goods (standard rates per country). MiCA does not cover NFTs unless fungible. GDPR applies to wallet-to-identity linkage. | Stripe handles VAT. Wallet addresses are pseudonymous -- no PII stored on-chain (per feasibility plan DPIA, Round 7). Cookie consent for NFC interaction tracking. |
| **APAC** | Japan: NFTs taxed as miscellaneous income. Singapore: no GST on digital tokens but GST on physical goods. Australia: GST on physical + potentially on NFT. | Stripe Tax handles GST/consumption tax. Terms of sale specify jurisdiction of the buyer. Geo-fencing from feasibility plan (Round 7, Sofia) applies -- sanctioned countries blocked. |

The purchase flow includes a jurisdiction-aware terms checkbox ("I agree to the Terms of Sale for my region") with a link to the appropriate legal text, dynamically selected by Stripe's detected country.

### SSSES Assessment

| Pillar | Score | Rationale |
|--------|:-----:|-----------|
| Security | 80 | Jurisdiction gating reuses feasibility plan geo-fencing. No PII on-chain. Stripe handles PCI compliance for payments. |
| Stability | 85 | Lexicon fallback chain ensures no blank UI in any language. IPFS metadata is immutable once pinned. |
| Scalability | 80 | One IPFS CID per NFT with 10 locales is storage-efficient. Stripe Tax scales to all jurisdictions automatically. |
| Efficiency | 85 | Reuses existing `t()` infrastructure. No new translation service needed -- same lexicon pipeline. |
| Succinctness | 85 | ~8 new lexicon keys. Legal terms are template-based (3 regional variants). No new smart contracts beyond what Round 4-5 defined. |

---

## Cross-Round Summary

| Round | Master | Domain | Key NEW Contribution (not in QUAI_QI_FEASIBILITY.md) |
|:-----:|--------|--------|------------------------------------------------------|
| 4 | Krishna | Integration | End-to-end phone-to-chip flow, ARX data schema, `/divinity-guide-arx` route spec, Stripe-to-NFT-to-ARX pipeline |
| 5 | Enki | Edge Cases | 5 failure modes with recovery paths, ChipRegistry contract, ARX asymmetric crypto anti-cloning, resale re-tap requirement |
| 6 | Sofia | Localization | 10-language NFT metadata on IPFS, 8-tier physical item pricing, 3-region legal framework, lexicon key additions |

> **Next:** Rounds 7-9 (Odin future-proofing, Aset verification protocol, Christo final consensus)
