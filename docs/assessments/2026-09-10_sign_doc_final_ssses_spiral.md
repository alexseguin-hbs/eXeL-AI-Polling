# Sign Doc — final SSSES + SPIRAL, for the 04:00 review

**Commit c93ab2f · LIVE 2026-09-10 02:03:32Z · https://exel-ai-polling.explore-096.workers.dev**
Nineteen commits in twenty-four hours. Tree clean, branch and main identical, every gate green.

## 1 · The headline: your two executed documents still verify under today's code

You sent two documents that were signed with an earlier build. Both were run through today's verifier, unchanged:

| Document | Pages | Signatures | Codex rows | Verifier | Hidden helix |
|---|:--:|:--:|:--:|---|---|
| Foreign Travel Template | 1 | 1 | Alex Seguin · 2026-09-08 17:30 CDT | **GREEN, zero issues** | decodes forward and reverse |
| Seguin_Lucas Promissory Note | 3 | 2 | Alex Seguin 14:08 · Daniel Lucas 14:13 CDT | **GREEN, zero issues** | `ALEX SEGUIN … • DANIEL LUCAS …` |

Backward compatibility holds: nothing shipped in the last day invalidates a document already executed. The files themselves
were read in the scratchpad and never written to this repository.

## 2 · What changed since yesterday morning

| Change | Why it existed |
|---|---|
| Migration 038 | The hosted database refused every save; pgcrypto sits in `extensions`, off the RPCs' path |
| A completed signature is never discarded | A failure at create, then at save, then on a full phone each cost you the file |
| Eleven more failure points closed | The class sweep: hangs, per-file loss, no WebCrypto, a blanked render, a dropped draft, a silent no-op |
| The signer never meets the machine | Your screen was showing our database's migrations and asking you to paste SQL |
| The panel never overclaims | It said "complete" above a roster reading "your turn now" |
| Two laws in CLAUDE.md, two gates in `test:ci` | So none of it returns after I am gone |

## 3 · SSSES

| Pillar | Score | Evidence |
|---|:--:|---|
| **Security** | 96 | No party secret ever enters an outgoing message; saved links stay in the fragment; a genuine refusal (wrong secret, not your turn, revoked, expired) still raises while only outages fall back; RLS untouched; the signer's screen names no infrastructure. Open: a completed record's secret cannot be rotated. |
| **Stability** | 97 | Fourteen failure modes closed and each one asserted. Two-phone 111 steps, offline 17, `test:ci` exit 0 across 20+ suites. Two real executed documents verify green. Open: hosted Supabase, Resend and iOS share sheets are unprovable from this sandbox. |
| **Scalability** | 91 | No new table, RPC or route this cycle. Attachments capped per file and per mail; the device store evicts oldest rather than failing; every fetch on the path is time-bounded. |
| **Efficiency** | 88 | One extra digest per signed file for the link key; a pure-JS SHA-256 only when WebCrypto is absent. Thoth's standing note: `send-row` re-encodes base64 per file, bounded by the five-file cap. |
| **Succinctness** | 93 | The diagnostic disclosure and the SQL route are gone from the flow; every store failure funnels through one function to one sentence; extensions of existing primitives only. |

## 4 · SPIRAL

**Forward (1 → 10).** Cubes 1–4 untouched. Cube 5 gateway: `/api/notify` accepts `attachments[]` beside `attachment`, additive,
18/18. Cube 6–7 untouched. Cube 8, where the Sign Doc keys live: five new strings across 33 languages, strict gate 125/125.
Cube 9 reports: stamps, codex rows and the verifier unchanged, proven by the two real documents reading green. Cube 10 replay:
the two-phone script grew 82 → 111 steps and is the regression suite. **PASS.**

**Backward (10 → 1).** The replay's new scenarios drive `createEnvelope` and `signEnvelope` degradation, the store's eviction
path, the watchdog and the voice rules; Cube 8 strings answer; Cube 5 keeps `attachment` for the three existing assertions;
Cube 1 never entered. **PASS.**

**Determinism.** Identical inputs give identical link keys, chain hashes and codex lines. The saved link is content-addressed
by the file's own SHA-256, so it survives re-versioning and any future move of storage.

## 5 · The full matrix now proven in one run

| Signers | Database | Device | Outcome |
|:--:|---|---|---|
| 1 | answers | normal | Shared record, saved link, no badge |
| 1 | refuses at create | normal | On this phone, one human sentence, file downloads |
| 1 | refuses at save | normal | Same |
| 1 | answers | **storage full** | Oldest record evicted, file downloads |
| 2 | answers | normal | Hand-off link and QR, both sign, both download, creator mailed |
| 2 | refuses at create | normal | Hand the file over, partly-signed downloads |
| 2 | refuses at save (second signer) | normal | His file downloads; the panel does not claim completion |

## 6 · Still yours, unchanged

1. Paste the served SQL once (036 + 037 + 038) — until then every signing stays on the device and says so, in human words.
2. Rotate the Supabase keys pasted into chat.
3. `RESEND_API_KEY` + `NOTIFY_FROM` for server e-mail with attachments; the `SIGN_FILES` KV id for 24-hour file links.
Your technical panel: add `?diag=1` to the sign URL.

## 7 · Open, code-side, none of which loses a signature
A reader view for a non-signer · QR beside the saved links · rotation of a completed record's secret · re-saving a
device-local record once the database answers · the multi-signer hand-off texting a link rather than the file.

---

# 8 · The twelve, on the shipped journey (not the diff)

Grades: **A A A A · B B B B B B B · C**. Every actionable finding was closed the same night; the closing commit is 6dbec41.

| Master | Grade | What they found | State |
|---|:--:|---|---|
| **Thoth** | A | Counted the gates and the caps. The one number nobody measures: `addBytes` sums a stale files array, so eight PDFs chosen at once clear every cap and fail later at create. | **Open** — logged below |
| **Odin** | A | The invariant is structural now; the Light Codex alphabet carries no version byte, so a future alphabet change would silently break decoding of your two executed PDFs. Three untimed fetches in `lib/ai.ts`. | Fetches **fixed**; codex version **open** |
| **Enki** | B | Multi-select, storage pressure and a backgrounded phone are driven by no proof. Eviction may delete another unfinished document without warning. | **Open** |
| **Thor** | B | The hand-off e-mail carries the full link including the `#s=` fragment to the mail vendor, so a bearer key lands in a third-party log. Secrets are plaintext in device storage. | **Open, accepted for now** — this is how a magic link works; the alternative is a server-side one-time handle |
| **Christo** | B | The 60-second watchdog handed over the file but never marked the save refused, so a hung save could still read "complete". | **Fixed** |
| **Aset** | C | The law was still broken in one place: `soi.sign.err.no_backend` rendered verbatim on the signers step, in all 33 languages. The gate's exemption list had become a hiding place. | **Fixed**, and the gate now fails on any retired string in the JSX |
| **Krishna** | B | Five optional-chained `pub?.signers` reads bypassed the guard and could still blank the panel. Three fixes sat outside the build gate. | **Fixed** |
| **Sofia** | B | Four controls at 36px under the 44px floor; rendered URLs had no direction, so Arabic and Hebrew reordered them. | **Fixed** |
| **Athena** | B | The proof reproduces your world in shape but not in substrate: every run is Chromium. Your own database state on your own iPhone is still unproven. | **Open — yours to run** |
| **Enlil** | B | Three fixes had no gate at all: delete them and everything stayed green. | **Fixed** — 20 → 27 assertions |
| **Asar** | A | You have the outcome you asked for: you sign, and the file is yours whatever the database does. | — |
| **Pangu** | A | Vision-2525 worthy now. The single change that would raise it further: let a device-held record rejoin the store by itself, so the promise needs no sentence at all. | **Open, recommended next** |

## 9 · What I would do next, in order
1. **Silent reconciliation** (Pangu). A device-held record rejoins the store on the next successful contact. The best remaining
   change, because it removes a sentence rather than adding one.
2. **Cap arithmetic on live totals** (Thoth, Enki). Refuse the sixth file at the picker, not at create.
3. **A version byte in the Light Codex** (Odin), plus a frozen v1 fixture that must decode forever — so the two documents you
   executed stay readable for good.
4. **A server-side one-time handle for the hand-off mail** (Thor), so no bearer key reaches a vendor's log.
5. **One run on your real iPhone against your real database** (Athena). Only you can do this one.

## 10 · The morning check, in four taps
1. Open the site, hard reload once. Footer should read **6dbec41** or later.
2. Sign one document alone. You should get the Done panel, the file, and no word about any database.
3. Paste the served SQL once in Supabase, reload, sign again. The badge should disappear and a hand-off link should mint.
4. If anything looks wrong, add `?diag=1` to the sign URL: that panel is yours and it still speaks plainly.
