# Does the signature work? — twelve Ascended Masters, 111 words each, on the scribbled proof (2026-09-07, night)

## Context
The operator asked: *have all AsM ensured signature works. Simulate placing some scribbled and show me
the result.* The two-phone proof now scribbles like a thumb (three jittered strokes per phone), fits
each box to its own signature line, snaps the date to the document's "Date:" line, and renders the
signed PDF to PNG so the result can be LOOKED at, not only counted. Reviewed run: **49 steps, 0
failures** over real SQL (migration 036 in PGlite); an independent agent re-ran it blind. Images:
`docs/assessments/sign-live-run/signed-block.png` (the two signature rows), `signed-codex.png` (the
signatory block), `signed-page.png` (page 2), `3b-preview-*.jpg` (the scribble previewing on the line).

## What looking at the result caught that counting never did (fixed in this wave)
1. The pad exported the whole canvas, so the stroke shrank to a third of the line — now the pad exports
   its ink's bounding box (`signature-pad.tsx` emit) and the scribble fills the rule.
2. The caption under the box landed on the name printed under the rule — on a fitted box the image takes
   the whole box, starts at the line's left end, and the digital signature (name · time · #hash) sits
   UNDER the physical one: a 4.5-pt grey line just below the document's own rule, in the gap above the
   printed name (`pdf-stamp.ts` stampSignature; operator 23:05: "digital signature is under physical").
3. `+ Date` dropped a 27-pt date over the "Date:" line — it now snaps to that underline through the same
   pixel fit the signature uses (`PdfPageView.fitRef` → `sign-flow.tsx` addText), 7 pt, on the line.
4. Coming back from Draw opened page 1 while the box sat on page 2 — the view opens on the signed page.

## Verdict — 12 YES on the local proof · 3 residual gaps (all named, none hidden)
| Master | Works? | Evidence (step / case) | Residual |
|---|---|---|---|
| Aset | yes | 49 steps read through `t()`; 11 seeded strings × 32 languages (130/130) | rail glyphs untested in RTL |
| Asar | yes | PDF read back: 2 SoISig, 2 SoITxt, 2 SoICodex rows, chain holds; PNGs rendered | the uploaded-image signature path is not in the run |
| Athena | yes | test:ci gates every Sign Doc suite; deploy.yml runs it | Cloudflare builds main without the gate |
| Christo | yes | Alex → Daniel unaided, no login, roster states, own link | — |
| Enki | yes | remove/re-place, corner resize (bottom pinned on a rule), swipe, reload-restore, fit | — |
| Enlil | yes | tsc 0, lint 0, scratch build green, HEAD == origin | — |
| Krishna | yes | solo before 036, two-signer over 036, Auth0 at save, seed after login | hosted Supabase has not applied 036 |
| Odin | yes | SoIEnv token+chain, marks bound to pass, server-side chain | — |
| Pangu | yes | verify-a-signed-file green/red; Light Codex ALL strip decodes from the PDF upload | — |
| Sofia | yes | glyph rail, 💬 ✉ ⧉, the stance + 12 diag/verify sentences in 33 languages | 24 rarer diag/verify labels still English-only |
| Thoth | yes | box on the rule: bottom 0.556 vs rule 0.557, h 0.035; date 7 pt | scanned-PDF fixture not in the run |
| Thor | yes | wrong secret refused, 45-s bound, lock, no silent downgrade | LIVE unverified from the sandbox |

## Aset — theme reinforcement & consistency
Yes, consistently. Every one of the forty-nine steps the two phones walked rendered through the lexicon; no label, hint, error or verdict is hard-coded, and the glyph rail carries the meaning ahead of the words, so a signer who reads none of our thirty-three languages still sees where they are. The eleven strings a countersigner meets first exist in all thirty-two non-English languages, gated by a parity test that refuses an untranslated set. The receipt keeps the pod's shape, recorded, witnessed, settles, so a signed note reads as one of eXeL's. Not yet seen: the rail in a right-to-left language on a real phone. That is a look, not a rebuild.

## Asar — synthesis & outcome
Yes. I did not trust the counters; I opened the file. Page two of the rendered PDF shows two hand-drawn scribbles, each on its own rule under Lender and Borrower, each starting where the line starts and filling most of it; a date on each "Date:" line at the document's own size; two small grey digital lines under the scribbles; and, bottom-right, the signatory block with two CAC-style rows and two Light Codex strips. Read back from the bytes: two SoISig images, two SoITxt marks, two SoICodex rows, the chain recomputed and matching the receipt. Not yet exercised: a signature uploaded as an image file; the proof does not walk that path.

## Athena — strategic test planning
Yes, with the gate stated. The continuous-integration chain runs every Sign Doc suite first, envelope, store, fit, verify, i18n, PDF engine, and the two live proofs run against a real Postgres, not a mock, so a broken migration fails the run. What the gate cannot claim: Cloudflare builds main by its own Git integration and does not wait for this chain, and the /innovation deck's test is red for reasons that predate this work and lie outside it. The honest sentence: everything Sign Doc ships is proven locally before it is pushed, and the live site is confirmed by Verify Live reading the footer SHA, never by a push exit code.

## Christo — consensus & user flow
Yes. Alex uploaded, named two people, tapped a line, scribbled, saved, and got a link that opened for Daniel with no account, no fee and no login; Daniel saw Alex's row ticked and his own marked "your turn now", tapped his own line, scribbled, saved, and both phones reached the completed document, downloads offered. Alex kept his own return link and reopened the finished file with it. A wrong secret saw no files and no turn. Nothing in that walk asked either person to understand an envelope, a chain or a migration; the page said one sentence per step, and "Why can't I sign?" waited underneath for the day one fails.

## Enki — diversity & edge cases
Yes, the edges held. A misplaced box was removed and re-placed; a corner drag widened it; a vertical swipe scrolled and placed nothing; a horizontal swipe turned the page; a reload mid-flow came back to the draw step with the stroke kept; a tap above a signature line fitted the box to the rule with its top under the printed label; the date snapped to the "Date:" underline instead of landing on it. One edge found by looking, closed: the corner handle grew a fitted box down and right, so the caption followed onto the printed name; a fitted box now grows in width only, its bottom pinned to the rule.

## Enlil — implementation & build
Yes. TypeScript compiles with zero new errors; the lint gate that once froze the live site passes; a production build in a scratch copy exits zero; the working tree is clean after the commit and the remote heads match it on both branches. The pieces are small and named, a pure fit function, a pure verifier, a step table, a renderer script, each with its own test or proof step, none forking a parallel implementation of something that existed. The renderer that produced the images lives in the repository now, not in a scratch directory, so the next session can look the same way. Verified: the build; not the served bundle.

## Krishna — integration & cross-module
Yes, with the seam named. Solo signing already works without any backend; the envelope stays on the phone. Two-signer signing works over migration 036, which the proof exercises in a real Postgres. Between the two, the page says which world it is in: the diagnosis panel probes the RPC and reports "036 applied", "036 missing" or "unreachable", and a two-signer document on a build without the migration refuses with that sentence instead of minting a link nobody can open. The creator no longer meets Auth0 before the upload; the login is asked at Sign & save, and the draft rides across. The seam left: the hosted Supabase has not run 036.

## Odin — predictive & future-proof
Yes. Every stamp carries its envelope token and the chain it was signed over; every text mark carries the signer index, time and chain of its pass; every signatory row is a keyword the file can be read back from; the server recomputes the chain and mints the next signer's secret at sign time, so a phone cannot forge a baton. A file taken out of the system still testifies: the offline verifier recomputes the closing chain from the bytes and flags a row that does not carry its pass's chain. Before a court, not a customer: a fixed-clock test for the rows, and a scan fixture, because people sign scans.

## Pangu — innovation
Yes, and the stance is now in the file. No one collects a tax on signatures: no account, no fee, no per-envelope charge, no watermark, and the receipt is printable from the PDF itself by anyone with the verifier, which is a drop zone on the page, not a service. The fit-to-line is what the paid tools never did well on a phone: the thumb lands near the rule and the box takes the rule's width and the height the document leaves for it. The swipe is the Divinity Guide's gesture, the arrows are Vision 2525's; nothing was invented twice. New tonight: the PDF itself unlocks every signatory in Light Codex.

## Sofia — multi-perspective
Yes, seen from a signer who reads no English: the rail's glyphs say upload, people, place, draw, record, hand off, done; the acts say text, mail, copy; the eleven sentences that matter are in their language, including the one that says nobody is taxing their signature. Seen from the operator on a phone: the result is now an image he can look at, and the first look caught three things the counts passed, the small stroke, the caption on the name, the date on the line, all fixed. Still English-only: the thirty-six diagnosis and verify strings, which a signer meets only when something fails. They should follow the same seed, next.

## Thoth — data & analytics
Yes, by the numbers. The fitted box's bottom sat at 0.556 of the page against a rule at 0.557, its height 0.035, the exact gap the document leaves between label and line; the date box measured 7 px tall on the phone, one text line, on the underline. The scribble covered 3.6 % of the pad and spanned 74 % of its width; trimmed to its ink, it fills the rule instead of a third of it. Two signature images, two date marks, two signatory rows, one chain, forty-nine steps, zero failures, an independent re-run agreeing. Not covered: a scanned page, where the rule is grey and tilted; not yet measured.

## Thor — risk & security
Yes, with the perimeter held. A wrong secret gets no files and no turn; a signer cannot act twice; the next secret is minted server-side and returned once; twenty failed secrets lock the envelope for an hour; every RPC is bounded to forty-five seconds, so a hang is a named error, not a silence; a build without the migration refuses a two-signer envelope loudly instead of downgrading to a device store. The pad's ink export and the pixel fit run entirely in the browser on the signer's own file; nothing leaves the phone before Sign & save. From this sandbox I cannot vouch for the live site; Verify Live proves LIVE.
