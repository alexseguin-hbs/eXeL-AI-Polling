# ARX Chip Pairing Guide

## [Athena] Step-by-Step: How to Pair Your ARX Chip to a Registered Item

### Option A: Pair During Registration

1. Go to `/divinity-guide/arx` and click "Register Item"
2. Fill in the item details (name, price, serial number, edition)
3. Tap your ARX chip with your phone to reveal its Ethereum address (starts with `0x`)
4. Paste the Ethereum address into the "ARX Chip Address" field
5. Click "Register on Blockchain"
6. The chip address is SHA-256 hashed and stored alongside the item record
7. Your item is now paired — anyone who taps the chip will see your item's details

### Option B: Pair After Registration

1. Register your item normally (skip the "ARX Chip Address" field)
2. After successful registration, click "Tap ARX Chip to Pair"
3. Open the ARX app on your phone and tap your chip to reveal its Ethereum address
4. Paste the address into the text field
5. Click "Pair Chip to Item"
6. The system calls `POST /api/v1/arx/pair-chip` which hashes and stores the address
7. Your chip is now linked — tapping it will find your item

### Verifying a Paired Chip

- Tap the ARX chip with any NFC-enabled phone
- The chip provides its Ethereum address (e.g., `0xC3D72cc59B4514fac7057bC9C629b7bC4de9A635`)
- Visit `/divinity-guide/arx?chip=0xC3D72cc59...` or use `GET /api/v1/arx/lookup-chip/{address}`
- The system hashes the address and looks up the matching item
- Full item details, ownership proof, and transaction history are displayed

### No NFC on Your Device?

- Open the ARX app (iOS/Android), tap the chip there
- Copy the Ethereum address from the chip details screen
- Paste it manually into the registration or pairing form
- All the same functionality works without direct NFC browser access

## [Christo] Consensus: Flexible Pairing Flow

The ARX chip pairing flow supports both pathways with equal confidence:

- **Pair during registration:** The Ethereum address is included in the initial mint, hashed
  with SHA-256, and stored as `chip_key_hash` in the `arx_items` table from the start.

- **Pair after registration:** The user registers the item first (without a chip), then uses
  the "Tap ARX Chip to Pair" button to associate the chip later via `POST /arx/pair-chip`.

Both paths result in identical on-chain records. The flexibility ensures users are never
blocked — whether they have their chip in hand during registration or receive it later.

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/arx/mint` | POST | Required | Register item (optionally with chip address) |
| `/arx/pair-chip` | POST | Required | Pair chip to existing item |
| `/arx/lookup-chip/{address}` | GET | Public | Find item by chip Ethereum address |
| `/arx/verify/{token_id}` | GET | Public | Verify item by token ID |

### Security Notes

- Raw Ethereum addresses are **never stored** — only SHA-256 hashes
- Each item can only have **one chip paired** (prevents re-pairing attacks)
- Chip pairing requires authentication (only item owner can pair)
- Chip lookup is public (anyone can verify by tapping)
