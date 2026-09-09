# Operator evidence — what was already working, and what broke it

Taken on the operator's own phone against the live site. Intaken at his instruction ("intake all my screenshots: we were
already successful here"). These are the reference states. Any future change to Sign Doc is measured against them.

## 01 · The Done panel, one signer, device-local — SUCCESS (7:29 PM, 2026-09-08, build 9779def)
`01-done-panel-one-signer-local.png`

Foreign Travel Template.pdf, signed by Alex Seguin, chain hash `dd07ede8`, receipt 1 Recorded / 2 Witnessed / 3 Settles.
On the panel: **⤓ file · 💬 Text · ✉ E-mail · ⧉ Copy · the address field · Verify a signed file · the stance line.**
The badge reads LOCAL ONLY because the hosted database had no sign RPC yet, so the record stayed on the phone. **That is
why it worked:** every signing took the device path and the panel always rendered.

**This is the baseline. Every element of it is present in the build today** (`docs/OPERATOR_ASKS_LEDGER.md`, section A),
plus the saved per-file link he asked for at 02:40, minus the "Why can't I sign?" disclosure he asked to remove at 04:59.

## 02 · Light Codex decode, TWO signatories — SUCCESS (2:17, 2026-09-08)
`02-light-codex-two-signatories.png`

`Seguin_Lucas_Promissory_Note_320-signed-AS-DL.pdf` uploaded to the Light Codex page and decoded:
**3 strips · All signatories · p.1, 2, 3 · Hidden Helix · 1×1**, reading
`ALEX SEGUIN 2026.09.08_14:08CDT • DANIEL LUCAS 2026.09.08_14:13CDT`.

This is the mission outcome in one image: **a document carried to two signatories, five minutes apart, and the proof read
back out of the file itself** with no account, no fee and no third party. The codex is per page, hidden, and survives the
download. Nothing since has changed the codex writer or reader.

## 03 · "The quota has been exceeded" — FAILURE (9:14, 2026-09-09, build 478f602)
`03-quota-exceeded-on-478f602.png`

The phone's storage refused another write. The create fallback wrote the whole envelope, PDFs included, to `localStorage`,
and a `QuotaExceededError` is not a store error, so the flow died at create. **Fixed in 0687ebb**: the oldest record is
evicted and the write retried; if the device still refuses, signing continues from memory.

## 04 · "Creating the document: Saving failed" — FAILURE (4:02, 2026-09-09, build 9779def)
`04-saving-failed-on-9779def.png`

After 036 and 037 were pasted, the RPC existed but failed inside itself (pgcrypto off its search path, 038 unpasted). The
app stopped falling back and dead-ended. **Fixed in ecc3140 (038), 74862b8 (create) and 3f6ac5d (save).**

## 05 · Blank pads after the failure — FAILURE (9:09, 2026-09-08)
`05-blank-pads-after-failure.png`

The catch sent the signer back to the draw step and the pads rendered empty, so it read as "sign again" although the
signature was already stamped. **Fixed in 8cbb904** (the pads repaint what the flow holds) and **3f6ac5d** (the catch never
returns to the pads once bytes exist).

## The rule these five images produced
**A completed signature is never discarded.** Once the bytes are stamped the outcome panel renders whatever any backend
does, and every failure is a note on it rather than a wall. Enforced by `frontend/tests/sign-invariant.test.mjs` in `test:ci`.

> Note on privacy: these are screenshots of the application. The signed PDFs themselves, and any personal identifiers inside
> them, are never committed to this repository. Say the word and these images come out too.
