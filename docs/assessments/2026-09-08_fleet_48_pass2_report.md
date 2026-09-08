# Fleet pass 2 — 48-agent review of the Sign Doc backlog (2026-09-08 01:57–02:30 UTC), with today's dispositions

Run `wf_1cd17ab4-e25` at HEAD 1ebadec. **11 of 48 agents returned** before the session limit (reset 04:10 UTC) stopped the rest; the 37 missing voters and MoTs are re-run after this ship (plan E). Every finding below carries what shipped today (d16ef66, then batches 1–2: 9161327, f6c9b2f) or what stays open. The 12 × 111 + 3 × 333 review of the plan that answered these is `2026-09-08_asm_plan_review_12x111_mot333.md`.

## Findings by specialist (severity · effort · disposition)

### Aset-2 — signature works today: yes

- **low · day** · 177 of 200 soi.sign.* keys are English-only in the 31 non-Spanish languages; parity gate still pins 23 and its header says 'all ten' — `frontend/lib/lexicon-translations-sign.ts:5`
  → OPEN — see the item
- **medium · hour** · RTL never engaged on the Sign page: no dir anywhere, html lang fixed 'en', tracking-wide on Arabic, physical margins, unmirrored ‹ / ArrowRight / ← — `frontend/app/soi-session/sign/page.tsx:30`
  → FIXED in part — <html lang/dir> follow the Globe (lexicon-context); per-component mirroring open
- **medium · hour** · Receipt shape still drifts across pod, Done panel and verifier (line 2 and line 3 disagree in content and glyph law) — `frontend/components/sign/sign-flow.tsx:580`
  → FIXED (batch 2, f6c9b2f) — one SignReceipt for Done and Verify
- **medium · hour** · Verifier prints raw issue codes ('images_vs_boxes, row_1_chain') instead of lexicon strings — `frontend/components/sign/verify-file.tsx:32`
  → FIXED — soi.sign.verify.issue.* (+ES), names from the row
- **medium · minutes** · Diagnosis panel prints the raw key soi.sign.step.error on every error state — `frontend/components/sign/sign-diag.tsx:43`
  → FIXED — key + ES; diag names the failed phase; error keeps the last step lit
- **low · minutes** · Explainer line and a dozen accents are hard-coded cyan while the rail, AI and share controls follow the theme hue — `frontend/components/sign/sign-flow.tsx:410`
  → FIXED — theme tokens in every Sign Doc component
- **low · minutes** · Glyph law for the sign rail is undocumented and untyped, and ◬ now carries two meanings (record/chain AND the AI button) — `frontend/lib/sign-steps.ts:6`
  → FIXED — SignStep typed, glyph table, ✦ for AI
- **low · hour** · Raw, untranslated error messages still reach the UI on the AI, open, save and mail paths — `frontend/components/sign/sign-flow.tsx:328`
  → FIXED in part (batch 1) — the AI line is the lexicon sentence with the provider's words in brackets; open/save lines map every SignStoreError code, raw text only for unknown exceptions
- **medium · hour** · Word-order and number-word concatenation cannot reorder or pluralise ('Waiting for NAME', 'Please sign: TITLE', '웃 1 signatures', 'N pages', 'Signer N') — `frontend/components/sign/handoff.tsx:34`
  → FIXED (batch 1, 9161327) — {name} / {n} placeholders; fill() never loses the value
- **medium · minutes** · Stamped date follows the browser's locale, not the Globe's active language; the 24-hour link expiry uses the browser locale too — `frontend/components/sign/sign-flow.tsx:229`
  → FIXED — stamped date + link expiry follow activeLocale
- **medium · hour** · Hand-off message, e-mail and link carry the sender's language; the server mail is English-only and the countersigner's first visit has no lang hint — `frontend/notify-core.js:29`
  → OPEN (hour) — server mail English-only; no lang hint on the first visit

### Aset-1 — signature works today: yes

- **medium · hour** · RTL never engaged anywhere: no dir attribute, physical-side classes, LTR-fixed arrows and globe; html lang hard-coded 'en' — `frontend/components/sign/sign-flow.tsx`
  → FIXED in part — <html lang/dir> follow the Globe (lexicon-context); per-component mirroring open
- **medium · hour** · Receipt shape still drifts across pod, Done panel and verifier (three line-2 / line-3 forms, ♡ absent from the sign receipts) — `frontend/components/sign/sign-flow.tsx`
  → FIXED (batch 2, f6c9b2f) — one SignReceipt for Done and Verify
- **medium · hour** · Verifier prints raw issue codes, not lexicon strings — `frontend/components/sign/verify-file.tsx`
  → FIXED — soi.sign.verify.issue.* (+ES), names from the row
- **medium · minutes** · Diagnosis panel prints the raw key `soi.sign.step.error` on every error state — `frontend/components/sign/sign-diag.tsx`
  → OPEN — see the item
- **medium · day** · 177 of 200 soi.sign.* keys are English-only in 31 languages (rail labels, every explainer, hand-off buttons); the parity gate pins 23 — `frontend/lib/lexicon-translations-sign.ts`
  → OPEN — see the item
- **low · hour** · Word-order and number-word concatenations cannot reorder or pluralise — `frontend/components/sign/sign-flow.tsx`
  → FIXED (batch 1, 9161327) — {name} / {n} placeholders; fill() never loses the value
- **low · minutes** · Two dates still follow the browser, not the lexicon: the stamped date's locale and the 24-hour link expiry — `frontend/components/sign/sign-flow.tsx`
  → OPEN — see the item
- **low · hour** · Raw error messages reach the UI untranslated although lexicon keys exist for the codes — `frontend/components/sign/sign-flow.tsx`
  → OPEN — see the item
- **low · hour** · Countersigner's first visit always opens in English: no lang carried by the hand-off, no navigator.language fallback — `frontend/app/soi-session/sign/page.tsx`
  → OPEN — see the item
- **low · minutes** · Explainer, resumed banner, roster and upload chrome hard-code cyan while the rail and the download icons follow the theme hue — `frontend/components/sign/sign-flow.tsx`
  → OPEN — see the item
- **low · minutes** · Glyph law for the sign rail still undocumented and untyped; ◬ = 'sign' on the rail but 'chain' on the receipt — `frontend/lib/sign-steps.ts`
  → FIXED — SignStep typed, glyph table, ✦ for AI

### Asar-2 — signature works today: yes

- **high · minutes** · Landing on a placeholder ERASES the document's own signature rule: clearBox grows 3 pt below a box whose bottom sits 0.5–1 pt above the line — `frontend/lib/pdf-stamp.ts:78 (clearBox :12-15, grow=3), :122 (stampText grow 1.5); frontend/lib/sign-fit.ts:203 (bottom = lineY − 1 px); sign-flow.tsx:192 (holder marks carry clear:true)`
  → FIXED — never grows below the box
- **medium · minutes** · Non-Latin signer's visible digital line names nobody: pdfSafe turns 'علي حسن' into '·· ··', so the caption reads '·· ·· · 2026-… · #hash' — `frontend/lib/pdf-stamp.ts:98 (caption = pdfSafe(name…)), :64-65 (base || '·'); tests/pdf-stamp.test.mjs:33 asserts the dots`
  → FIXED — captionName falls back to the contact, then Signer N, in caption and hidden line
- **medium · hour** · Rotated page + fitted/holder/AI box: the caption is drawn INSIDE the ink box (lower 40 %), not under the rule, in dark grey — `frontend/lib/pdf-stamp.ts:103-104 (onRule && rot === 0 guard), :86 (capBox = lower 40 % of the same box), :84 (onRule now also 'holder' | 'ai')`
  → FIXED — on-rule caption placed through /Rotate
- **medium · minutes** · clampBox grows a tight fitted box DOWNWARD to MIN_H 0.02 while keeping y — bottom leaves the rule; AI boxes get the same Math.max(0.02, h) — `frontend/components/sign/pdf-page-view.tsx:228 (clampBox h = max(h, MIN_H), y kept), :275 (applied to the fit); frontend/components/sign/sign-flow.tsx:97 (AI: h: Math.max(0.02, b.h))`
  → FIXED — a short box grows upward (baseline stays); AI box too
- **medium · hour** · Uploaded JPEG / opaque PNG stamps as an opaque white slab; upload also writes double-helix codex pixels into the ink image — `frontend/components/sign/signature-pad.tsx:20 (ink test used only for the bbox, alpha never cleared), :97 (signedDataURL(…,'exel-sign') → lib/image-library.ts:88 placeSignature style '2'), :117 (accept image/jpeg)`
  → FIXED — near-white knocked out; uploads never pass the helix encoder
- **medium · minutes** · Light Codex strip: a name > 24 chars truncates the timestamp, a non-Latin name vanishes — the hidden line disagrees with the keywords about who signed — `frontend/lib/codex-pdf.ts:30-32 (raw = name + stamp, unsupported chars dropped, slice(0,44) from the start)`
  → FIXED — the name is trimmed, never the stamp (CODEX_LINE_MAX 44)
- **low · minutes** · Initials row is chosen from the UNSTAMPED page: this pass's own signature, caption and date are invisible to the scan that places the slot — `frontend/components/sign/sign-flow.tsx:275 (initialsSlotTop(await pageBitmap(f.bytes, pg))) after stampSignature/stampText already produced `out` (:261-263)`
  → FIXED — the slot is pushed below this pass's own marks
- **low · day** · The hidden codex line is 0.6 pt at y=0 on the trimmed edge: outside most printers' margin, and a visible dotted line at zoom — still a bytes-only carrier — `frontend/lib/pdf-stamp.ts:243 (embedCodexImage … width−w, 0, w, 0.6); frontend/lib/codex-pdf.ts:41-46 (2-px image, 1 px/pt)`
  → FIXED — 0.25 pt
- **low · hour** · Verify panel prints 'Signer N' though the file now carries each name; initials (SoIInit) and placeholders (SoIHold) are never checked; SoITxt still records geometry only — `frontend/components/sign/verify-file.tsx:159; frontend/lib/sign-verify.ts:112 (rows typed without name), :122-138 (no initialledBy / holders check); frontend/lib/pdf-stamp.ts:134 (SoITxt has no :t<b64u text>), :139-142 (textBoxes discards meta)`
  → FIXED — verifier prints names; initials + holders counted
- **low · minutes** · Three renderings of one instant in one file: caption ISO-with-ms UTC, codex local zone, receipt cacStamp UTC; and the clock is the phone's — `frontend/lib/pdf-stamp.ts:98 (sig.isoDate raw), :204-207 (cacStamp); frontend/lib/codex-pdf.ts:25-28 (local zone); frontend/components/sign/sign-flow.tsx:254 (new Date().toISOString())`
  → FIXED — caption prints cacStamp; keywords keep the ISO
- **low · minutes** · Dead weight in stampHolders and a two-line shim: an unused Helvetica embed per pass; lib/codex-strip.ts still re-exports codex-pdf — `frontend/lib/pdf-stamp.ts:278 (const font = … never used since the label was removed); frontend/lib/codex-strip.ts:2; frontend/components/sign/sign-flow.tsx:30`
  → FIXED — unused font removed; codex-strip shim deleted

### Asar-1 — signature works today: yes

- **blocker · hour** · Countersigner's placeholder clear (grow 3 pt) erases the document's own signature rule and clips the label above it — visible in the current render — `frontend/lib/pdf-stamp.ts:78 (clearBox(page, box, 3)), :12-15; frontend/lib/sign-fit.ts:63-64 (box top = textBottom+2 px, bottom = lineY-1 px); frontend/components/sign/sign-flow.tsx:36 (bitmap 306 px wide → 1 px = 2 pt), :192 (holder marks get clear:true); proof docs/assessments/sign-live-run/signed-block.png + signed-page.png (02:03 UTC, after HEAD 1ebadec)`
  → OPEN — see the item
- **high · hour** · Rotated page + fitted/holder/AI box: the digital caption is drawn inside the ink box, not under the rule (pass-1 #2, still true) — `frontend/lib/pdf-stamp.ts:103-104`
  → FIXED — on-rule caption placed through /Rotate
- **medium · minutes** · SoITxt keyword records the box but not the text — the file still cannot testify what date was written (pass-1, still true) — `frontend/lib/pdf-stamp.ts:134, :139-142`
  → FIXED — :t<b64url> text in the keyword
- **medium · hour** · Pages inheriting a shared /Resources dict double-count SoISig images — verifier turns red on a valid file (pass-1, still true, still untested) — `frontend/lib/pdf-stamp.ts:94, :154-159; node_modules/pdf-lib/cjs/core/structures/PDFPageLeaf.js:154-161 (TODO: Clone Resources/XObject if inherited)`
  → FIXED — XObjects de-duplicated by ref (test: shared /Resources)
- **medium · minutes** · Light Codex text truncated at 44 chars cuts the TIMESTAMP off long names (Spanish two-surname names lose minutes/zone) — `frontend/lib/codex-pdf.ts:30-32, :35`
  → OPEN — see the item
- **low · minutes** · The 'hidden' helix is drawn 0.6 pt tall and renders as a visible dashed line along the bottom edge — `frontend/lib/pdf-stamp.ts:242-243; proof docs/assessments/sign-live-run/signed-codex-p1.png (3× crop shows a dark dashed line on the bottom row)`
  → FIXED — 0.25 pt
- **low · minutes** · Initials row can extend left of the scanned band for 3+ signers with wide strokes — white-filled slots may cover text the scan never looked at — `frontend/lib/sign-layout.ts:12 (colFrac 0.45 → scans the right 275 pt of a Letter page); frontend/lib/pdf-stamp.ts:193 (wMax 96), :198 (slot x), :253/:259 (white-filled slots)`
  → FIXED — initialsRowFrac widens the scan band
- **low · minutes** · Fallback partner placeholder (no rule found) is still stamped as fit 'holder' → treated as on-rule: caption hangs 5.5 pt under a rule-less box and clear:true whitens that area — `frontend/components/sign/sign-flow.tsx:282 (fallback {x: sig.x+sig.w+0.06, y: sig.y, …}), :192 (fit:'holder', clear:true); frontend/lib/pdf-stamp.ts:84 (onRule includes 'holder'), :78 (clearBox)`
  → FIXED — fallback holder uses fit "default"
- **low · minutes** · Verify panel prints 'signer N' though the file now carries each signatory's name (pass-1, display half still open) — `frontend/components/sign/verify-file.tsx:37; frontend/lib/sign-verify.ts:12`
  → FIXED — verifier prints names; initials + holders counted
- **low · minutes** · Uploaded opaque PNG/JPEG still stamps as a white slab; upload path writes Light Codex pixels into the ink (pass-1, still true) — `frontend/components/sign/signature-pad.tsx:13-28 (trimToInk never clears background alpha), :97 (signedDataURL → lib/image-library.ts:88 placeSignature 1×1 double helix, framed rows top-left/bottom-right), :117 (accept image/jpeg)`
  → FIXED — near-white knocked out; uploads never pass the helix encoder
- **low · hour** · Initials slots and hidden strip ignore /Rotate (pass-1, still true) — `frontend/lib/pdf-stamp.ts:241-258`
  → FIXED (batch 2, f6c9b2f) — laid out in the displayed frame, mapped through /Rotate; test on a /Rotate 90 page

### Athena-2 — signature works today: yes

- **high · hour** · Manual ship door (ship.sh) still runs only test:innovation-time, never test:ci; Cloudflare git build (prebuild) still runs no suite — both real ship doors bypass every Sign Doc test — `frontend/scripts/ship.sh`
  → FIXED — ship.sh gates on test:ci
- **high · hour** · deploy.yml gate is red by construction: test:innovation-time runs inside test:ci and again at :77, and the live-run doc records it failing on the /innovation deck; test:notify-core is listed twice in test:ci — `.github/workflows/deploy.yml`
  → FIXED — innovation-time reads /SoI-2525, 3680/3680; duplicate notify-core removed
- **medium · hour** · Supabase branch of sign-store (create/get/sign over the 036 RPCs), the duplicate-token retry, the 'unreachable' probe and the lockout have zero unit coverage in test:ci — all four are proven only through the Playwright run, which no door executes — `frontend/tests/sign-store.test.mjs`
  → OPEN (hour) — sign-store Supabase branch still proven by live runs only
- **medium · day** · No proof walks a third signer or a returning/early signer; 036 still returns no next_contact and the waiting screen has no poll — `frontend/scripts/sign-live-run.mjs`
  → OPEN — see the item
- **medium · hour** · Hosted 036 presence is still never measured after a deploy — verify-live.yml checks the footer SHA only; apply-migration.yml is manual and one-shot — `.github/workflows/verify-live.yml`
  → OPEN — operator-owned (Path A); no RPC probe in verify-live.yml
- **medium · hour** · A build missing NEXT_PUBLIC_AUTH0_* or with NEXT_PUBLIC_SIGN_NO_AUTH=1 still ships the creator path with login OFF and envcheck only warns — `frontend/scripts/envcheck.mjs`
  → FIXED — envcheck refuses a deploy built with it
- **low · minutes** · /api/notify is the only Sign Doc Worker route outside the pause kill-switch — `frontend/worker.js`
  → FIXED — behind the pause switch
- **low · hour** · Live proofs (two-phone / offline / scan / pod) and the Worker's KV + AI bindings run only by hand: SIGN_FILES KV is still commented out in wrangler.jsonc, so the 24-hour link on the live site falls back to the share sheet until the operator binds it — `frontend/wrangler.jsonc`
  → OPEN — operator-owned binding

### Athena-1 (test planning: test:ci, the four live proofs, ship doors, pass-1 backlog) — signature works today: yes

- **high · hour** · The only gated ship door (deploy.yml) is red on every run — test:ci crashes in innovation-time, after every Sign Doc suite passed; the site ships through the ungated Cloudflare git build instead — `frontend/package.json:87 · .github/workflows/deploy.yml:60-62,76-77 · frontend/tests/innovation-time.test.mjs:3127`
  → OPEN — see the item
- **high · minutes** · ship.sh (the manual wrangler door) still gates on test:innovation-time alone — red by construction, so the only way through is SKIP_TESTS=1, which runs nothing — `frontend/scripts/ship.sh:30-38`
  → FIXED — ship.sh gates on test:ci
- **high · hour** · Cloudflare git build ships with no test at all — prebuild has no suite, and it is the door that actually promotes main today — `frontend/package.json:9`
  → FIXED (batch 1, 9161327) — prebuild runs test:build-gate (Sign Doc + core unit suites)
- **medium · minutes** · Hosted Supabase 036 is still unmeasured — apply-migration.yml has never run and verify-live.yml has no RPC probe; every proof of the hand-off link ran over PGlite — `.github/workflows/apply-migration.yml:8 · .github/workflows/verify-live.yml:33-63 · frontend/scripts/sign-live-run.mjs:9-10,206`
  → OPEN — see the item
- **medium · day** · Third signer, returning/early signer and the waiting screen remain unproven and partly unbuilt: the countersigner's hand-off has no recipient, 036 returns no next_contact, waiting never refreshes; no proof drives a third phone — `frontend/components/sign/sign-flow.tsx:322,166,572 · supabase/migrations/036_sign_envelopes.sql:257 · frontend/scripts/sign-live-run.mjs:1-7`
  → FIXED in part — <html lang/dir> follow the Globe (lexicon-context); per-component mirroring open
- **medium · hour** · The four live proofs (two-phone, offline, scan, pod) live outside every gate — they need a dev server, the relay and Chromium, and no workflow runs them — `frontend/package.json:49-52 · frontend/scripts/sign-live-run.mjs:14-16`
  → OPEN — the four live proofs run by hand (dev server + relay + Chromium)
- **medium · minutes** · A build with NEXT_PUBLIC_SIGN_NO_AUTH=1 or missing Auth0 vars still ships the creator path with login OFF; envcheck only warns and nothing in CI asserts the login gate — `frontend/app/soi-session/sign/page.tsx:12,65 · frontend/scripts/envcheck.mjs:19-23`
  → FIXED — envcheck refuses a deploy built with it
- **medium · hour** · The Supabase branch of sign-store and the 036 SQL have no gated unit coverage (lockout, revoke, duplicate, wrong-secret paths) although a PGlite runner exists — `frontend/tests/sign-store.test.mjs:11 · frontend/scripts/local-rpc.mjs · supabase/migrations/036_sign_envelopes.sql:189-190,215-220`
  → OPEN — see the item
- **low · hour** · Real-touch drag of a placed mark and a JPEG upload are still unproven in any run — `frontend/components/sign/pdf-page-view.tsx:95,126,130 · frontend/components/sign/signature-pad.tsx:97,117 · frontend/scripts/sign-live-run.mjs:58,136`
  → FIXED (batch 1, 9161327) — a touch-pointer drag moves the box at zoom in the two-phone run
- **low · minutes** · removeFile still does not clamp fileIdx; Clear after a draft resume is still ignored — `frontend/components/sign/sign-flow.tsx:202-206,479,516,519`
  → FIXED — fileIdx clamped; Clear after resume works

### Christo-1 — signature works today: yes

- **high · hour** · Middle signer's hand-off still has no recipient (3+ signers): next_contact never returned, sms:/mailto: open empty — `frontend/components/sign/sign-flow.tsx:334`
  → OPEN (hour + 036 change) — third signer hand-off
- **high · hour** · 'Waiting for X' is still frozen: envelope fetched once on mount, no poll, no visibilitychange, no Check-again — `frontend/components/sign/sign-flow.tsx:148-170`
  → FIXED — visibilitychange + 20 s refetch + Check again
- **high · minutes** · The 24-hour file link is not configured on the live Worker: SIGN_FILES KV is commented out, so /api/tmp answers {configured:false} and no ?f= link is ever minted live — `frontend/wrangler.jsonc:27-29`
  → OPEN — operator-owned binding
- **high · minutes** · Receiving a partly-signed file by the 24-hour link puts the next signer on the CREATOR path, which demands the Auth0 login at Sign & save — the message promised 'No account' — `frontend/app/soi-session/sign/page.tsx:79`
  → FIXED in part — <html lang/dir> follow the Globe (lexicon-context); per-component mirroring open
- **medium · hour** · Offline hand-off mints the 24-hour link for file 1 only; a multi-file envelope hands 1 of N files by link — `frontend/components/sign/sign-flow.tsx:311`
  → FIXED (batch 1, 9161327) — one link per file; the message carries them all
- **medium · minutes** · Web Share is called only after async PDF parsing (signedName → codexRows), so on iOS Safari the share sheet can be refused for lost user activation; the real-phone share is unproven — `frontend/components/sign/sign-flow.tsx:348-352`
  → FIXED — signed name precomputed, share called synchronously
- **medium · hour** · 'Why can't I sign?' sentence still ignores step and role: a waiting or not_party countersigner is told to Upload/Place; a failed-open signer is told to tap a Sign & save button that is not on the page — `frontend/components/sign/sign-diag.tsx:81-86`
  → OPEN (hour) — diagnosis sentence per step/role
- **medium · hour** · Creator is never told the document completed; the last signer's result carries no creator contact — `frontend/components/sign/sign-flow.tsx:325`
  → OPEN (036 change)
- **medium · minutes** · After a failed save a countersigner lands on PLACE ('Next: draw.') while the red line says the save failed — `frontend/components/sign/sign-flow.tsx:344`
  → FIXED — failed save stays on the sign step
- **medium · day** · Flow explainer lines, roster states, hand-off, tmp-link and share strings are English-only in 31 languages (Spanish now complete) — `frontend/lib/lexicon-translations-sign.ts:5`
  → OPEN — see the item
- **low · minutes** · Offline file hand-off is unreachable on a build with NO Supabase: the signers step disables Next for two signers in local mode — `frontend/components/sign/sign-flow.tsx:464`
  → FIXED
- **low · minutes** · Receiver of a hand-carried / linked file starts with two blank signer rows and must delete one and retype the title — `frontend/components/sign/sign-flow.tsx:71`
  → FIXED — title + rows prefilled; a signed row owes no contact
- **low · minutes** · Error step: rail highlights no step and the explainer goes blank — `frontend/components/sign/sign-flow.tsx:365`
  → FIXED — rail keeps the last step lit; explainer shows the sentence
- **low · minutes** · 'Send by text' is the filled primary button even for an e-mail contact; desktop sms: anchor is inert and mail fallback navigates the page — `frontend/components/sign/handoff.tsx:36`
  → FIXED — primary follows the contact kind
- **low · minutes** · A wrong secret (not_party) still sees the full roster with names and masked contacts — `frontend/components/sign/sign-flow.tsx:572`
  → FIXED — roster hidden for not_party
- **low · minutes** · After the Auth0 round-trip the button is silently disabled while auth.isLoading; the auth_loading guard is unreachable from the button — `frontend/components/sign/sign-flow.tsx:522`
  → FIXED — auth_loading sentence shown

### Christo-2 — signature works today: yes

- **high · hour** · Still true — middle signer (3+ signers) hands off to nobody: next contact blanked, 036 returns no next_contact — `frontend/components/sign/sign-flow.tsx`
  → OPEN (hour + 036 change) — third signer hand-off
- **high · hour** · Still true — 'Waiting for X' never refreshes: one fetch on mount, no poll, no Check-again; the creator's hand-off screen never flips to done — `frontend/components/sign/sign-flow.tsx`
  → FIXED — visibilitychange + 20 s refetch + Check again
- **medium · hour** · Still true — the creator is never told the document completed — `supabase/migrations/036_sign_envelopes.sql`
  → OPEN (036 change)
- **medium · minutes** · NEW — the ?f= (24-hour link) recipient is asked to log in with Auth0, unlike the ?e= recipient; the ask says the token IS the unique login — `frontend/app/soi-session/sign/page.tsx`
  → OPEN — see the item
- **medium · hour** · NEW — offline recipient must know to DELETE the second signer row, or the flow hands off again instead of completing; the message never says so — `frontend/components/sign/sign-flow.tsx`
  → OPEN — see the item
- **medium · hour** · NEW — the 24-hour link carries only FILE 1 of a multi-file envelope; the share sheet carries all — `frontend/components/sign/sign-flow.tsx`
  → OPEN — see the item
- **low · minutes** · NEW — a non-ASCII file name (accented initials/Spanish titles) makes fetch throw on the X-File-Name header, so the 24-hour link silently never appears — `frontend/lib/tmpfile.ts`
  → FIXED — encoded both ways
- **medium · minutes** · NEW (plausible) — after the Auth0 round-trip on a ?f= link the tmp file is re-seeded on top of the restored draft (duplicate file) — `frontend/app/soi-session/sign/page.tsx`
  → FIXED — seed guarded by token
- **medium · hour** · Still true — the diagnosis sentence ignores step and role; not_party never opens the panel — `frontend/components/sign/sign-diag.tsx`
  → OPEN (hour) — diagnosis sentence per step/role
- **medium · minutes** · Still true — after a failed save a countersigner lands on PLACE while the sentence says 'Tap Sign & save again' — `frontend/components/sign/sign-flow.tsx`
  → FIXED — failed save stays on the sign step
- **low · minutes** · Still true — the error step highlights no rail step and the explainer goes blank — `frontend/components/sign/sign-flow.tsx`
  → FIXED — rail keeps the last step lit; explainer shows the sentence
- **low · minutes** · Still true — 'Send by text' is the filled primary button even for an e-mail contact; desktop mailto navigates the page away — `frontend/components/sign/handoff.tsx`
  → FIXED — primary follows the contact kind
- **low · minutes** · Still true — a wrong secret (not_party) sees the full roster with names and masked contacts — `frontend/components/sign/sign-flow.tsx`
  → FIXED — roster hidden for not_party
- **low · hour** · Still true (narrowed) — flow strings in my lens are English in 31 of 33 languages (Spanish now covered) — `frontend/lib/lexicon-translations-sign.ts`
  → OPEN — see the item
- **low · minutes** · Still true (partial) — while Auth0 hydrates after the redirect the Sign & save button is disabled with no label; the auth_loading sentence is unreachable by tap — `frontend/components/sign/sign-flow.tsx`
  → OPEN — see the item

### Enki-1 — signature works today: yes

- **high · hour** · A pre-placed placeholder mark keeps clear:true when the signer moves or resizes it — the stamp white-fills the NEW box (+3 pt) over printed text and the original dotted placeholder stays printed — `frontend/components/sign/sign-flow.tsx:192 (clear:true on holder marks) · frontend/components/sign/pdf-page-view.tsx:62 (update spreads {...m,...patch} — clear survives drag/resize) · frontend/lib/pdf-stamp.ts:78 (clearBox(page, box, 3) at the mark's CURRENT box) · :12-15 (opaque white rectangle)`
  → OPEN — see the item
- **medium · hour** · Deleting a pre-placed placeholder and tapping a fresh box leaves the dotted placeholder printed on the final PDF (the fresh mark has no clear flag) — `frontend/components/sign/sign-flow.tsx:232 (removeSel) · frontend/components/sign/pdf-page-view.tsx:108 (fresh sig has no clear) · frontend/lib/pdf-stamp.ts:283 (dotted rectangle drawn into the page content)`
  → OPEN — see the item
- **high · hour** · Vertical finger drag of a mark is still a browser pan, not a move (host touch-action pan-y, marks pointer-events-none, preventDefault only inside the document pointermove) — still no real-touch drag in any proof — `frontend/components/sign/pdf-page-view.tsx:126 (touchAction: pan-y), :130 (pointer-events-none), :95 (ev.preventDefault after the browser claimed the pan) · scripts/sign-live-run.mjs:143,148 (p.mouse drags only)`
  → FIXED (batch 1, 9161327) — a touch-pointer drag moves the box at zoom in the two-phone run
- **high · hour** · Host wider than the 640-px canvas (tablet/desktop under max-w-3xl): frac(), mark %, fitAt and onHandle use the host rect while the canvas is 640 px left-aligned — taps, fits, handles and stamps mis-scaled — `frontend/components/sign/pdf-page-view.tsx:53 (width = min(clientWidth, 640)), :60 (frac from host rect), :64 (onHandle from host rect), :126 (host w-full) · frontend/app/soi-session/sign/page.tsx:71 (max-w-3xl → ~736 px host)`
  → OPEN — see the item
- **medium · hour** · Tilted scan: a tap at the LOW end of a drifting rule returns null (or a box the rule crosses) — lineY is the tapped row, the run's vertical envelope is not tracked, and the text scan at lineY−3 counts the rule's own higher pixels as text — `frontend/lib/sign-fit.ts:27-34 (runAt returns [x0,x1] only), :53 (lineY climbs from the tapped row), :58-62 (text scan from lineY−3 across the whole run), :64-65 (bottom = lineY−1; h<4 → null)`
  → OPEN — see the item
- **medium · minutes** · Initials slot row is scanned only in the right 45 % column, but three or more slots (or wide drawn initials at wMax 96 pt) extend left of that column — placeholder slots white-fill text the scan never checked — `frontend/lib/sign-layout.ts:12 (col = W·(1−0.45)), :13 (inkRow scans col..W) · frontend/lib/pdf-stamp.ts:193 (INIT_SLOT w 36, wMax 96, gap 4, right 18), :198 (slot x = width − 18 − Σ widths), :259 (dotted slot drawn with opaque white fill) · frontend/components/sign/sign-flow.tsx:275 (initialsSlotTop called with defaults)`
  → OPEN — see the item
- **medium · hour** · partnerRule fallback places the next signer's placeholder to the right of a rule-wide fitted box, over the page's own text, or overlapping the first signer's box when w > 0.85 — `frontend/components/sign/sign-flow.tsx:282 (partner fallback x = min(0.95 − sig.w, sig.x + sig.w + 0.06), y = sig.y) · frontend/lib/pdf-stamp.ts:283 (dotted holder drawn there) · frontend/lib/sign-layout.ts:29-34 (partnerRule returns null with no second rule)`
  → OPEN — see the item
- **low · minutes** · − / + resize is still unclamped to the page (w ≤ 1 but x + w may exceed 1) and scales h on a fitted box, unlike the handle drag; a handle drag past the right edge shifts the box left via clampBox — `frontend/components/sign/sign-flow.tsx:234 (resizeSel: w=min(1,…), no x+w bound) · frontend/components/sign/pdf-page-view.tsx:61 (clampBox re-anchors x = min(x, 1−w)), :98 (resize w = q.x − m.x, then clampBox)`
  → FIXED — a short box grows upward (baseline stays); AI box too
- **medium · hour** · Draft is kept only at the draw step and only for the creator; Clear after a resume is still ignored for both pads — `frontend/components/sign/sign-flow.tsx:138 (keepDraft only when step === 'draw'), :130 (restore returns when countersign), :516 and :519 (onChange ignores null while resumed)`
  → OPEN — see the item
- **medium · minutes** · + Date probes only BELOW the signature in its own column; on a same-row 'Signature ___ Date ___' block it snaps to the next signer's rule — `frontend/components/sign/sign-flow.tsx:223 (probe at sig.x + min(0.1, w/2), sig.y + sig.h + 0.03) · frontend/lib/sign-fit.ts:17 (reach 0.06)`
  → OPEN — see the item
- **medium · minutes** · removeFile never clamps fileIdx — view file 2 at Place, go Back twice, remove a file, return: files[fileIdx] is undefined and Place throws — `frontend/components/sign/sign-flow.tsx:202-206 (setFiles + re-key marks only) · :479 (files[fileIdx].bytes unguarded, guard at :469 is files.length > 0)`
  → FIXED — fileIdx clamped; Clear after resume works
- **low · minutes** · onHandle slop: a mark narrower AND shorter than 44 px is entirely 'handle' — a small fitted date can only be resized, never dragged — `frontend/components/sign/pdf-page-view.tsx:64`
  → OPEN — see the item

### Enki-2 — signature works today: yes

- **high · minutes** · Delete a pre-placed placeholder (or let the AI re-place it) and the dotted holder box stays printed under the real signature — the new mark never carries clear:true — `frontend/components/sign/pdf-page-view.tsx:108 · frontend/components/sign/sign-flow.tsx:97-99,225,232`
  → OPEN — see the item
- **medium · minutes** · Dragging a pre-placed holder mark elsewhere clears the NEW spot and leaves the dotted box at the OLD spot — `frontend/components/sign/pdf-page-view.tsx:62,99 · frontend/lib/pdf-stamp.ts:12-15,78`
  → OPEN — see the item
- **high · minutes** · removeFile never clamps fileIdx → files[fileIdx].bytes throws on Place after viewing a later file then removing one (pass-1 high, still true) — `frontend/components/sign/sign-flow.tsx:202-206,469,479`
  → FIXED — fileIdx clamped; Clear after resume works
- **high · hour** · Vertical finger drag of a placed mark is a browser pan, not a move (pass-1 high, still true, still unproven by touch) — `frontend/components/sign/pdf-page-view.tsx:95,126,130`
  → OPEN — see the item
- **medium · hour** · Tilted (scanned) rule: box is axis-aligned over the rule's vertical envelope — ink crosses the rule at one end, floats at the other; lineY is the tap-column row (pass-1 high → medium; the null prediction is withdrawn) — `frontend/lib/sign-fit.ts:27-34,53,58-65`
  → OPEN — see the item
- **medium · hour** · Fixed darkness threshold (mean RGB < 200): light-grey scanned rules are invisible, grey/photo grounds make every row dark → silent default box AND the initials slot falls to the margin — `frontend/lib/sign-fit.ts:17,22 · frontend/lib/sign-layout.ts:12-13,15,24`
  → OPEN — see the item
- **medium · minutes** · Placeholder fallback for the next signer overlaps the first signature when no partner rule is found and the box is wide or right of ~x=0.5 — `frontend/components/sign/sign-flow.tsx:282`
  → OPEN — see the item
- **low · minutes** · Clearing a holder with grow 3 pt paints over the document's own signature rule under the countersignature — `frontend/lib/pdf-stamp.ts:12-15,78 · frontend/lib/sign-fit.ts:64`
  → OPEN — see the item
- **low · minutes** · −/+ resize still has no x + w ≤ 1 clamp: a box near the right edge grows past the page and the stamp is shifted left by placeOnPage — `frontend/components/sign/sign-flow.tsx:234 · frontend/components/sign/pdf-page-view.tsx:61 · frontend/lib/pdf-stamp.ts:33`
  → OPEN — see the item
- **low · minutes** · onHandle slop: a mark narrower than 44 px is entirely 'handle' (resize-only, never drag); no hit slop for thumbs on short marks — `frontend/components/sign/pdf-page-view.tsx:63-64`
  → OPEN — see the item
- **medium · hour** · Draft: kept only at Draw, only for the creator, and only on step/png changes — a reload at Place loses everything, a draft restored to Place is gone on the next reload, initials drawn after the signature are not in the draft, and the countersigner has no draft at all — `frontend/components/sign/sign-flow.tsx:129,135,139,250`
  → OPEN — see the item
- **medium · minutes** · Clear after a draft resume is ignored for both pads — Sign & save stays enabled and the stamp uses the invisible restored stroke (pass-1, still true) — `frontend/components/sign/sign-flow.tsx:119,516,519 · frontend/components/sign/signature-pad.tsx:84-87`
  → OPEN — see the item
- **medium · hour** · Host wider than the 640-px canvas (tablet/desktop): frac(), mark %, onHandle and fitAt use the host rect while the canvas is 640 px left-aligned → taps, fit and stamps mis-scaled — `frontend/components/sign/pdf-page-view.tsx:53,60,64,126 · frontend/lib/pdf-render.ts:40-41 · frontend/app/soi-session/sign/page.tsx:72`
  → OPEN — see the item
- **medium · minutes** · + Date probes only BELOW the signature in its own column: on a same-row 'Signature ___  Date ___' block it snaps to the next rule down (often the other party's), and the next signer's date holder repeats the same probe — `frontend/components/sign/sign-flow.tsx:223-224,285-286`
  → OPEN — see the item
- **low · hour** · Fit constants are pixel-absolute but the two callers render at different resolutions (canvas at 640·dpr vs 306 px off-screen) — the box the user got at Place and the holders/date the stamp computes can disagree on dashed rules — `frontend/lib/sign-fit.ts:31,33,43,53,58,65 · frontend/components/sign/pdf-page-view.tsx:71 · frontend/components/sign/sign-flow.tsx:35-36`
  → OPEN — see the item
- **low · minutes** · Initials slot on crowded pages: the clear-gap scan covers the right 45 % but a three-signer row can span 51 % of the page; a page inked to the edge silently falls to the bottom margin — `frontend/lib/sign-layout.ts:12-13,17,22,24 · frontend/lib/pdf-stamp.ts:193-198`
  → OPEN — see the item
- **low · minutes** · AI placement with a date drops every existing text mark, including the user's own note — `frontend/components/sign/sign-flow.tsx:99`
  → OPEN — see the item
- **low · minutes** · Pre-placed marks bypass clampBox: a date holder at y = 0.98 with h 0.035 extends past the page; downloads still keyed by filename — `frontend/components/sign/sign-flow.tsx:192,286,567,587`
  → FIXED — a short box grows upward (baseline stays); AI box too
- **low · minutes** · Signature pad bitmap sized once at mount; rotation/viewport change stretches the canvas and skews later strokes and the ink-bbox export (pass-1 low, still true) — `frontend/components/sign/signature-pad.tsx:38-46,48-51,57-65`
  → OPEN — see the item

### Enlil-1 — signature works today: yes

- **high · minutes** · wrangler.jsonc declares no SIGN_FILES KV binding, so every `wrangler deploy` (ship.sh:117, deploy.yml:98-104) ships a Worker where /api/tmp answers {configured:false}; a dashboard-added binding is dropped on the next deploy — `frontend/wrangler.jsonc:27-29`
  → FIXED — ship.sh gates on test:ci
- **high · minutes** · Both real ship doors still bypass test:ci; deploy.yml still runs innovation-time twice; branch is still not main — `frontend/scripts/ship.sh:36-37`
  → OPEN — see the item
- **high · hour** · Clear after a draft resume is still ignored for both pads — a restored, invisible stroke is stamped — `frontend/components/sign/sign-flow.tsx:516`
  → OPEN — see the item
- **medium · minutes** · test:ci runs test:notify-core twice; test:all never runs notify-core, tmp-core or ai-core — `frontend/package.json:85`
  → OPEN — see the item
- **medium · minutes** · lint:gate still tolerates 9,999 warnings; tsc is in neither test:ci nor deploy.yml — `frontend/package.json:57`
  → OPEN — see the item
- **medium · minutes** · revokeEnvelope is dead code (no caller) and skips the device-local check; isMissingRpc / RPC_TIMEOUT_MS / loadPdfjs / RenderedPage / initialsSlot / INIT_SLOT / initialsSlotWidths / CODEX_BLOCK are exported with no importer — `frontend/lib/sign-store.ts:124-128`
  → OPEN — see the item
- **low · minutes** · lib/codex-strip.ts is a 2-line re-export shim with one importer and a stale comment ('one per signatory row' — the per-row strip no longer exists) — `frontend/lib/codex-strip.ts:1-2`
  → OPEN — see the item
- **medium · minutes** · SignDiag still prints the raw key soi.sign.step.error on every error state — `frontend/components/sign/sign-diag.tsx:43`
  → FIXED — key + ES; diag names the failed phase; error keeps the last step lit
- **medium · hour** · Initials (SoIInit) still have no unit test and no verify reader; sign-store tests still cover local mode only — `frontend/tests/pdf-stamp.test.mjs`
  → OPEN — see the item
- **medium · hour** · Proof scripts still write into tracked docs/ paths, 7 FAIL-*.jpg from failed runs are still committed, the operator's real phone number is still a fixture, pod-live-run.mjs still hard-codes the sandbox Chromium, playwright-core is still undeclared, and the step logger is still triplicated — `frontend/scripts/sign-live-run.mjs:28`
  → OPEN — see the item
- **low · hour** · SignFlow is one 536-line component (sign-flow.tsx:61-597); Roster is declared inside render, fitRef is written during render, a runtime scroll selects a test id — `frontend/components/sign/sign-flow.tsx:385`
  → OPEN — see the item
- **low · minutes** · Duplicate filenames still collide: downloads keyed by f.name and identical -signed names — `frontend/components/sign/sign-flow.tsx:567`
  → OPEN — see the item
- **low · minutes** · pdf-stamp keyword handling still hand-rolled with one different splitter, a mid-file import, stringly-typed fit, and a second base64 decoder — `frontend/lib/pdf-stamp.ts:69`
  → OPEN — see the item
- **low · minutes** · Uploaded-signature guards still fail silently and leak an object URL; two ink bounding-box scans with different thresholds — `frontend/components/sign/signature-pad.tsx:92`
  → OPEN — see the item
- **low · minutes** · /api/notify still bypasses the site pause the other three /api routes honour, and is still keyed on DONATE_ALLOWED_ORIGINS — `frontend/worker.js:60-63`
  → FIXED — behind the pause switch
- **low · hour** · sign-i18n gate still says 'all ten' while asserting 23; migration 036 still carries unused v_cur and an uncompared p_chain, with no superseding migration — `frontend/tests/sign-i18n.test.mjs:1`
  → OPEN — see the item
- **low · minutes** · ai-core pins model ids as bare strings with no configured override; /api/ai and /api/tmp have no per-IP throttle — `frontend/ai-core.js:14-18`
  → OPEN — see the item
