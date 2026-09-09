# Operator asks — the single ledger (so nothing is asked twice)

**Rule:** every operator message is persisted verbatim to `docs/asks/` the moment it arrives, then appears here with a state and
evidence. Nothing is "remembered"; if it is not in this table it was not intaken. Update this file in the same commit that
changes the state. 45 ask files persisted to date.

**States:** LIVE = shipped and serving · OPERATOR = only the operator can close it (a secret, a paste, a rotation) · OPEN = code
not written · N/A = physically impossible on the platform, with the workaround named.

## A · Sign Doc — the file reaching a person (the thread that kept circling)

| Ask (operator's words, short) | First asked | State | Evidence |
|---|---|---|---|
| Download the signed doc at the end | 09-08 00:35 | **LIVE** | `sign-flow.tsx` Done panel, ungated `SendRow`; live run asserts a real download event |
| Share with someone by text and e-mail | 09-09 00:00 | **LIVE** | `send-row.tsx` share sheet with every PDF (phone) / download + clipboard (computer) |
| E-mail and text with the file, phone **or** computer | 09-09 00:00 | **LIVE (computer text = link, see N/A)** | phone share sheet carries files; computer downloads + copies the message |
| Attachment when e-mailed or texted | 09-08 01:10 | **LIVE** | `attachment` + `attachments[]`, every file, 3 MB each / 9 MB total; `notify-core` 18/18 |
| Saved link to a specific file | 09-09 02:40 | **LIVE** | `?e=<token>#s=<key>&file=<sha8>`; opening it focuses that file and downloads it once |
| Save in the database | 09-09 01:52 | **LIVE (needs the paste)** | 036+037+038 served; until pasted the record stays on the device and the panel says so |
| "After signing I can't download, text or email" | 09-09 04:02 | **LIVE** | 74862b8 (create) + 3f6ac5d (save) — the outcome panel is unconditional |
| "This error comes up after signing" | 09-09 04:59 | **LIVE** | 3f6ac5d: the catch keeps the stamped file and lands on Done for both roles |
| "The quota has been exceeded" | 09-09 09:14 | **LIVE** | 0687ebb: oldest record evicted, then memory; `soi.sign.err.storage_full` in 33 languages |
| Get rid of "Why can't I sign?" | 09-09 04:59 | **LIVE** | 2ca7a54: removed with both auto-open effects; the SQL route moved onto the panels |
| One signer vs multiple | 09-09 10:05 | **LIVE** | four combinations proven; SSSES + SPIRAL assessment committed |
| All AsM check it is working | 09-09 04:59 | **LIVE** | twelve verification statements; every finding fixed in 0687ebb |
| AsM AAR on why it took so long | 09-09 05:10 | **LIVE** | in the approved plan and wave 15; ruling: a completed signature is never discarded |

## B · Still open, and why

| Item | Owner | What closes it |
|---|---|---|
| 24-hour file link never mints live | **OPERATOR + 1 line** | `wrangler.jsonc:29` has the `SIGN_FILES` KV binding commented out. Create the namespace, paste the 32-hex id, uncomment. |
| Server e-mail with the PDF attached | **OPERATOR** | `RESEND_API_KEY` + `NOTIFY_FROM` as Worker secrets, plus a verified sender domain. |
| The database takes the record | **OPERATOR** | Paste the served SQL (036+037+038) once. Until then every signing is device-local and says so. |
| Supabase keys pasted into chat | **OPERATOR** | Rotate them. |
| A non-signer cannot open a shared record | **OPEN (code)** | Files go only to a party. A read-only reader view would be migration 039 plus a `not_party` panel that shows title, status and masked roster. |
| No QR on the Done panel or the saved links | **OPEN (code)** | `QRCodeSVG` is already imported by `handoff.tsx`; add a tap-to-reveal QR beside each saved link. |
| A completed record's secret cannot be rotated | **OPEN (code)** | A future RPC. |
| Text with a file on a **computer** | **N/A** | A web page cannot attach to an SMS composer. The file downloads and the message carries the link; the phone share sheet does carry files. |
| A device-local record never rejoins the database | **OPEN (code)** | One "save to the database now" action on the Done panel of a local record. |


## D · Operator evidence — the states already proven on his own phone
Intaken at his instruction. Full detail in `docs/evidence/2026-09-09_operator_proof/README.md`.

| Image | What it proves | Date |
|---|---|---|
| `01-done-panel-one-signer-local.png` | The Done panel working: download, text, e-mail, copy, verify, stance. **The baseline.** | 09-08 19:29 |
| `02-light-codex-two-signatories.png` | **Two signatories on one document**, five minutes apart, decoded back out of the PDF: 3 strips, hidden helix, `ALEX SEGUIN … • DANIEL LUCAS …`. The mission outcome. | 09-08 14:17 |
| `03-quota-exceeded-on-478f602.png` | The phone's storage refusing the write. Closed by 0687ebb. | 09-09 09:14 |
| `04-saving-failed-on-9779def.png` | The RPC failing inside itself after 036/037 without 038. Closed by ecc3140, 74862b8, 3f6ac5d. | 09-09 04:02 |
| `05-blank-pads-after-failure.png` | The pads rendering empty after a failure, reading as "sign again". Closed by 8cbb904 and 3f6ac5d. | 09-08 21:09 |

**It was working before it broke, and what broke it was the database changing under the app, not a code revert.** The panel in
image 01 is present element for element in the build today.

## C · The standing rules this thread produced
1. **A completed signature is never discarded.** Once bytes are stamped the outcome panel renders whatever any backend does;
   every failure is a note on it, never a wall. Guarded by `tests/sign-invariant.test.mjs` in `test:ci`.
2. **The panel never overclaims.** The heading, the file name and whether a link is offered follow what actually happened.
3. **Persist first.** Every ask reaches `docs/asks/` before analysis, and this ledger before the work is called done.
4. **Report three states.** COMMITTED, PUSHED and LIVE are never collapsed.
