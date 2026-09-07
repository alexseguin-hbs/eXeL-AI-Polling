# Is the signature working? — AsM assessment (persisted from the approved plan) — twelve Ascended Masters, 111 words each (2026-09-07, evening)

## Context
The operator is signing the Seguin / Vail PDFs from his phone on the live site and asked: *is
signature working? do AsM assessment, 111 words each.* Shipped state under review: HEAD 01be293
(pushed; Cloudflare building), two-phone proof 28 steps / 0 failures, solo signing proven, box
resize by corner handle, + Date / + Text marks, the theme hue everywhere, the bold ◬ ♡ 웃 row.

## Verdict — 4 YES · 8 PARTLY · 0 NO
Signing works end to end: upload, place, resize, date mark, draw, stamp, hand off, countersign
with no login, download a PDF that carries two signature images, two date marks, captions and the
envelope chain, creator reopens to COMPLETE. What is *partly* is around it: what a phone shows as
selected, what the proof does not yet assert, what CI does not gate, and what the record does not
yet bind (text marks, rotated pages, the final chain, other languages).

| Master | Working? | Gap | Change sent up |
|---|---|---|---|
| Aset | **yes** — 81/81 keys resolve; one receipt shape | creator rail ends at HAND OFF on a completed doc; countersigner rail says DONE | append "done" to the creator rail |
| Asar | **yes** — reopened the signed PDF: 2 images, both captions, 2 dates, chain genesis→31813d77 | both phones tapped the same spot; captions, resized w/h, rotated/page-2 never asserted | Dan taps elsewhere; assert distinct boxes + caption text + a rotated fixture |
| Athena | partly — 57 headless tests green locally; the 2-phone run is human-shell only | nothing sign-related gated pre-deploy; deploy.yml dies at envcheck before test:ci | move test:ci above the envcheck step |
| Christo | partly — Alex→Daniel walks; 28 px handle hit lands | selection nearly invisible; + Date drops silently, once onto the amortization table | solid selection ring + a chip naming the target; scroll the new mark into view |
| Enki | partly — place/drag/resize/re-key hold | signature mark cannot be deleted or re-placed; date forced onto the signature's page; rotated pages draw sideways | remove/re-place the sig; addText on the viewed page |
| Enlil | **yes** — tsc clean, 57/57, parity 0 orphans, tree clean, HEAD == origin/main | silent local-only persistence when Supabase is null | visible "local-only" badge (already shown when mode is local — verify it fires on the fallback) |
| Krishna | partly — (a) solo yes (b) two-signer refuses loudly before 036 (c) yes after 036 | the Create-Doc seed is consumed on mount, before the Auth0 redirect | pick up the seed after authentication |
| Odin | partly — PDF ties to rows via SoIEnv + server chain + events | text marks carry no signer/time/chain; final chain in no PDF | bind marks into the signer's pass |
| Pangu | **yes** — receipt-3, chain, download | envelopeMarks has no consumer | offline "verify this file" drop zone |
| Sofia | partly — Daniel completes unaided | 101 keys English-only in 33 languages; 10 px chips; low-vision | seed soi.sign.* translations (consent, mylink, status first) |
| Thoth | partly — Letter: signature 86×22 mm, date 47×10 mm, 20 pt text fits | handle hit 28 px < 44 px; caption at MIN_H renders 4 pt | raise the handle slop to 44 px |
| Thor | partly — sha/chain/baton/lock/RLS hold; no silent multi-signer downgrade | any signer stamps text anywhere; marks not in sign_events; a transient PostgREST reload could downgrade a solo save | persist each pass's marks in sign_events |

## Plan — one commit, the cheap and clear fixes (≈ 1 hour), then the proof re-run
Files: `frontend/components/sign/pdf-page-view.tsx`, `frontend/components/sign/sign-flow.tsx`,
`frontend/app/soi-session/sign/page.tsx`, `frontend/lib/pdf-stamp.ts`, `frontend/lib/sign-store.ts`,
`supabase/migrations/036_sign_envelopes.sql` (+ model), `frontend/scripts/sign-live-run.mjs`,
`.github/workflows/deploy.yml`, `frontend/lib/lexicon-data.ts`.

1. **Selection you can see** (Christo, Thoth): selected mark gets a solid 3 px ring + a toolbar chip
   "Sizing: Signature / Date / Text"; handle slop 44 px; new marks scroll into view.
2. **Undo your own placement** (Enki): ✕ removes the signature mark too; tap-to-place returns; + Date /
   + Text land on the page being viewed.
3. **Rotated pages** (Enki, Asar): `stampSignature`/`stampText` rotate the drawn image/text by the
   page's /Rotate; a rotated fixture page joins `tests/pdf-stamp.test.mjs`.
4. **Marks in the record** (Odin, Thor): `SoITxt` keyword carries signer idx + ISO time + chain-before;
   `sign_envelope_sign` takes `p_marks jsonb` and stores it on the signed event (`sign_events.marks`).
   `isMissingRpc` narrows to PGRST202 / "Could not find the function" only (no "schema cache").
5. **One finish** (Aset): creator rail gains DONE.
6. **Seed after login** (Krishna): the Create-Doc seed is read inside the authenticated branch.
7. **CI order** (Athena): `test:ci` runs before "Check required build vars" in deploy.yml.
8. **Proof widened** (Asar): Dan taps a different spot; assert distinct boxes, caption text, resized
   width; the rotated fixture in the headless gate.
Deferred, named: the offline verify drop zone (Pangu) and the 33-language seed (Sofia) — a second
commit and a fleet job respectively.

## Verification
`npx tsc --noEmit` gate · `npm run test:pdf-stamp` (rotated fixture, marks keyword) · `test:sign` ·
`test:sign-store` · `test:ci` · relay restart on the amended 036 · `npm run test:soi-sign-live`
(expect ≥ 30 steps, 0 failures) · `test:soi-pod-live` unchanged · commit, push both branches, the
three-state line, Verify Live for the footer SHA.
