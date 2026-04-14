# Cube 12 — Divinity Guide & NFT ARX

> **Status:** Planned (v024) — DO NOT CODE until MoT approves
> **CRS:** NEW (Divinity Guide UX + physically-backed tokens)
> **Architecturally independent from Cube 11** — shares Quai chain but separate code path

## Purpose

1. **Divinity Guide Reader:** 10-language spiritual book with Flower of Life navigation, Pinyin, bilingual mirror
2. **NFT ARX:** Physically-backed tokens using ARX/HaLo NFC chips for any collectible (books, art, signed items)

## Files to Create (when approved)

| File | Lines | Purpose |
|------|:-----:|---------|
| `service.py` | ~150 | ARX item CRUD, mint NFT, transfer, verify chip |
| `router.py` | ~100 | 5 endpoints: /arx/mint, /arx/verify, /arx/transfer, /arx/marketplace, /arx/claim |
| `models.py` | ~50 | ArxItem + ArxTransaction ORM models |

## Frontend Route

`frontend/app/divinity-guide/arx/page.tsx` (~250 lines)
- **Browse mode:** Available editions, marketplace, "Own a Copy" CTA
- **Verify mode:** Item details, ownership proof, authenticity status
- **Own mode:** Transfer/sell buttons, transaction history, premium content
- **Chip tap mode:** NFC verification animation → verify on-chain

## Dependencies

- `@arx-research/libhalo` npm v1.18.1 (ARX NFC chip SDK)
- `quais` npm v1.0.0-alpha.54 (shared with Cube 11)
- ARX NFC chips (~$2-5/chip at volume)

## Supabase Tables

- `arx_items` — NFT item records (see migration 014)
- `arx_transactions` — buy/sell/transfer log with ARX-YYYY-NNNNNN IDs

## User Flows

### First Purchase
```
Divinity Guide → "Own Physical Copy" → Select edition → Stripe payment
→ NFT minted on Quai → QR code sent to buyer + seller
→ Book ships with ARX chip → Buyer taps phone → Verified ✓
```

### Resale
```
Owner → "Sell or Gift" → Set price or free transfer
→ Buyer scans QR or listing → Stripe payment
→ On-chain transfer → New owner taps book → Verified ✓
→ QR codes sent to both buyer AND seller (timestamped)
```

## Item Registration (any collectible)

| Field | Required | Example |
|-------|:--------:|---------|
| Item name | Yes | "The Divinity Guide — First Edition" |
| Purchase price | Yes | $33.33 |
| Serial number | Optional | "DG-2026-001" |
| Edition | Optional | "Master of Thought Edition (7 of 12)" |
| Special marker | Optional | "Signed by author — page 144" |
| Image | Yes | Cover photo |
| Language | Yes | "en" (10 Divinity languages) |
