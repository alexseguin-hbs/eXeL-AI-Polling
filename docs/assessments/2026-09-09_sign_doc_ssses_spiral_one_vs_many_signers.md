# Sign Doc — SSSES + SPIRAL test after the 2026-09-09 fixes (one signer vs several) — 10:20 UTC

Scope: 8cbb904 (saved file link · every PDF attached · the signature loop) + 74862b8 (any failure at create keeps the stamped record on the
device) + the one-vs-many proofs added in this pass. Operator rule honoured: **nothing rebuilt** — every proof reuses the shipped primitives
(`SendRow`, `my-link` block, `createEnvelope` local path, `placeAndSign` helpers); the grep-verify came first (R-CORE).

## What was checked first (no rework)
| Question | Answer (evidence) |
|---|---|
| Is the live site on the latest fix? | Verify Live: 8cbb904 LIVE ✓ 09:47:57Z; 74862b8 run 1455 (result in the status line below). The 04:02 CDT screenshots were build 9779def — two builds behind, before either fix. |
| Was the one-signer path already proven? | Refused-at-create, one signer: proven at 74862b8 (step 10). One signer with the store answering: **not** proven → added (step 11). |
| Was the many-signer path already proven? | Two signers, store answering: the whole two-phone run. Two signers, refused at create (generic code): **not** proven → added (step 12). |

## One signer vs several — the matrix (two-phone live run, 98 steps, 0 failures)
| Signers | Store | Outcome on the phone | Proof |
|---|---|---|---|
| 1 | answers | SHARED record: Done panel, no LOCAL ONLY badge, saved link to the file, Download · Text · E-mail · Copy | 11-one-signer-shared |
| 1 | refuses at create (42883, 038 not pasted) | LOCAL ONLY record: Done panel, the reason named, Download · Text · E-mail; the signed PDF downloads | 10-refused-at-create |
| 2 | answers | hand-off link minted; Daniel signs; both download; saved links; the creator mailed | steps 1–7b |
| 2 | refuses at create | OFFLINE hand-off block: the reason named, "hand the file over", partly-signed PDF downloads, Text / E-mail carry it | 12-two-signers-refused |
| 2 | no Supabase at all | same offline block (no_backend) | offline run 17/17 |

Unchanged behaviour (Rule 6): every element of the Done panel photographed at 7:29 PM; labels; the hand-off panel; SACRED files untouched.

## SSSES (Sign Doc, this pass)
| Pillar | Score | Evidence |
|---|:--:|---|
| Security | 95 | The outgoing message never carries a party secret (record link + chain hash instead; Thor's finding closed). Saved links stay in the fragment. RLS/grants untouched; 038 only widens `search_path` to `extensions`. Open: a completed record's secret has no rotation (future RPC). |
| Stability | 95 | Three loop causes closed (D1 store mapping, D2 pads repaint, D3 landed-draft guard) and any failure at create degrades to a device record instead of a dead end. 98-step live run, 17-step offline run, 12/12 RPC on a real Postgres, 18 notify cases. Open: hosted Supabase / Resend / iOS unprovable from the sandbox. |
| Scalability | 90 | No new RPC, no new table, no new Worker route; the saved link reads the store's existing latest-version files. Attachments capped per file / per mail (3 MB / 9 MB), over-cap falls to the composer. |
| Efficiency | 88 | One extra `sha256Hex` per signed file on Done (needed for the link key); the download-once guard is a sessionStorage key. Thoth's note stands: `send-row` re-encodes base64 per file (bounded by the 5-file cap). |
| Succinctness | 90 | Extensions of existing primitives only (`my-link` block, `SendRow` props, `createEnvelope.why`); 4 lexicon keys × 33 languages; the live script grew by three sections that reuse `scribble`/`drawInitials`. |

## SPIRAL propagation
- **Forward (1 → 10):** Cube 1 (session/join) untouched → Cube 2/4 (text, collector) untouched → Cube 5 gateway: `/api/notify` accepts
  `attachments[]` beside `attachment` (additive; old callers unchanged, 18/18) → Cube 6/7 untouched → Cube 8 (tokens/ledger — the Sign Doc
  keys live under cubeId 8): lexicon +4 keys, all 33 languages, strict gate 125/125 → Cube 9 (reports/export): the signed PDF's stamps,
  codex rows and verifier unchanged (verify-result green on the redo file) → Cube 10 (simulation/replay): the two-phone script is the
  replay; 82 → 98 steps, deterministic fixtures. **PASS.**
- **Backward (10 → 1):** the replay's new refused-at-create scenarios (10, 12) exercise `createEnvelope`'s degrade → Cube 8 strings name
  the cause → Cube 5's mail path keeps `attachment` for the three existing assertions → Cube 1's join/session code never entered. **PASS.**
- **Determinism:** identical inputs → identical link keys (sha8 of the file bytes) and chain hashes; the saved-file link is content-addressed.

## Gates
tsc 0 · lint 0 · scratch build green (twice) · test:ci green (log ends at sim-parity 3/3) · sign-i18n-all 125/125 strict · sign-i18n 137 ·
notify-core 18 · sign-store 12 · sign-envelope 39 · sign-rpc 12 · two-phone 98 · offline 17.

## Still the operator's (cannot be done from the sandbox)
1. Paste the served SQL (036+037+038) once in the Supabase SQL editor → the LOCAL ONLY badge goes away, links mint.
2. Rotate the Supabase keys pasted into chat.
3. `RESEND_API_KEY` + `NOTIFY_FROM` (server mail with every PDF attached) · `SIGN_FILES` KV (24-hour hand-off links).
