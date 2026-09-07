# Sign Doc — two real phones, one document, no fees (live run, 2026-09-07)

**Ask (operator, 2026-09-07):** *before going into session, allow for 3 options … Sign Doc: user
uploads 1+ docs, places a signature, signs with the phone or uploads a signature, no fees; provides
email or phone for the next person, so after the first signature it goes to the next person.*

**What this run proves.** Two Chromium phones (375×812, touch). Phone A opens the ◬ ♡ 웃 landing,
taps **Sign Doc**, uploads a two-page promissory note (synthetic names), names itself and a second
signer (one e-mail, one phone), taps the page to place the box, draws a stroke, stamps, saves — and
is handed the second signer's link, prefilled into the phone's own text composer. Phone B opens
that link **with no account and no login**, sees that it is its turn, places, draws, stamps; the
envelope completes; the downloaded PDF carries **exactly two** signature images, **each on page 1 at
the tapped spot** (read back from the PDF). A vertical swipe over the page places nothing. A wrong
secret sees the masked roster and no file bytes. Alex reopens with **his own kept link** and finds the
completed document.

**On real SQL.** The relay serves migration `036_sign_envelopes.sql` from a real Postgres (PGlite),
so the RPCs — not a mock — decided every step: create · get · sign · the baton (each signer's secret
minted at hand-off) · every file's sha256 and the chain computed server-side from the stored bytes · `not_your_turn` · `bad_secret` · stranger → masked, no files · replay refused ·
complete · revoke-after-complete refused. The hosted Supabase project still has to apply 036;
Auth0 login on the creator path is bypassed locally (`NEXT_PUBLIC_SIGN_NO_AUTH=1`) and is
**UNVERIFIED** until the operator signs in on the live site.

## Outcome — 33 steps, 0 failures

```
  3408ms  alex  OK  landing → Sign Doc
  3447ms  alex  OK  PDF uploaded, hashed, page-counted
  3545ms  alex  OK  two signers named (email + phone)
  3934ms  alex  OK  PDF page rendered (pdfjs)
  3993ms  alex  OK  misplaced signature removed
  4010ms  alex  OK  signature box placed by tap
  4013ms  alex  OK  toolbar names the selected box
  4136ms  alex  OK  a swipe over the page places nothing
  4241ms  alex  OK  signature box resized by its corner  123→158 px
  4289ms  alex  OK  date mark added beside the signature
  4953ms  alex  OK  signature drawn with the pointer
  5158ms  alex  OK  Sign & save pressed
  5215ms  alex  OK  saved — hand-off link minted for Daniel  http://127.0.0.1:3210/soi-session/sign/?e=adJbekY6mqOt_k2AR2…
  5263ms  alex  OK  creator keeps his own return link
  5266ms  alex  OK  sms: composer prefilled to Daniel
  7402ms  alex  OK  a wrong secret sees no files and no turn  This link's secret does not match any signer of this document.
  9134ms  dan   OK  opened the hand-off link, no login
  9137ms  dan   OK  roster: Alex signed, Daniel now
  9199ms  dan   OK  PDF page rendered (pdfjs)
  9261ms  dan   OK  misplaced signature removed
  9275ms  dan   OK  signature box placed by tap
  9277ms  dan   OK  toolbar names the selected box
  9402ms  dan   OK  a swipe over the page places nothing
  9511ms  dan   OK  signature box resized by its corner  123→157 px
  9574ms  dan   OK  date mark added beside the signature
 10236ms  dan   OK  signature drawn with the pointer
 10447ms  dan   OK  Sign & save pressed
 10480ms  dan   OK  COMPLETE — every signer has signed
 10554ms  dan   OK  downloaded PDF carries two signature images  SoISig count = 2
 10559ms  dan   OK  each stamp sits on page 1 where ITS phone tapped, resized wider (distinct boxes)  [[1,0.1,0.71,0.51],[1,0.49,0.56,0.51]]
 10563ms  dan   OK  two date marks stamped (one per signer)  SoITxt count = 2
 10566ms  dan   OK  signatory block: two CAC-style timestamp rows, bottom-right of the last page  [[0,"2026-09-07T20:36:26.917Z","91d05b18"],[1,"2026-09-07T20:36:32.165Z","da5ede51"]]
 10993ms  alex  OK  creator reopens with his own link → COMPLETE, downloads offered
```

Reproduce: `cd frontend && npm run pod:relay` ·
`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:4999 NEXT_PUBLIC_SUPABASE_ANON_KEY=local NEXT_PUBLIC_SIGN_NO_AUTH=1 npx next dev -p 3210` ·
`npm run test:soi-sign-live`. Screenshots and the signed PDF are in `sign-live-run/` beside this file.

## What the operator does next
1. Apply `supabase/migrations/036_sign_envelopes.sql` in the Supabase SQL editor (idempotent).
2. Open https://exel-ai-polling.explore-096.workers.dev/soi-session/ → Sign Doc → upload the two
   Seguin / Vail PDFs → name yourself, then Daniel with his mobile or e-mail → place, draw, sign →
   tap **Send by text**. Daniel signs from the link; both of you download.

## Boundaries, said plainly
No e-mail or SMS is sent by the server (no carrier exists); the hand-off is your own composer. The
stamp records name, time, and a hash — a record, not a legal opinion on UETA/ESIGN. Files are held
as base64 in Postgres (3 MB each) behind default-deny RLS; `storage_url` is reserved for R2.

## Wave 3 — "I still cannot sign" (autonomous run, evening)

The operator, on his phone, reported that he still could not sign, with no screen to show. Wave 3 makes the
page diagnose itself and removes every way left to fail silently; the two-phone proof re-ran at **37/37**
(was 33) and the three-phone pod at **45/45**, over the same real SQL (migration 036 in PGlite).

**What changed**
- `Why can't I sign?` under the rail (`components/sign/sign-diag.tsx`): build SHA · storage mode · a live probe
  of the 036 RPC (`sign_envelope_get` with a nonsense token — a `bad_token` refusal proves the function exists,
  `PGRST202` proves the migration is missing) · the pdf worker (`HEAD /pdf.worker.min.mjs`) · the login state ·
  the step and its error — then one sentence saying what to do. Opens by itself on any error.
- Never silent: every catch names its step (`Opening: …`, `Stamping: …`, `Creating the document: …`,
  `Saving the signature: …`); every RPC is bounded to 45 s (`withTimeout`) and a 30-s watchdog says so while
  saving; a `timeout` is a named error, not a hang.
- Login at save, not before upload: the creator path is unguarded; with Auth0 configured, "Sign & save" keeps
  the draft (files, signers, boxes, stroke) in `sessionStorage["exel-sign-draft"]` and redirects; the draft
  comes back after the login (or a reload — proved in the run: reload mid-flow → draw step restored).
- Offline verify (`lib/sign-verify.ts` + the DONE block and the upload step): the four accounts a signed file
  carries (images, boxes, passes, timestamp rows) must agree, every later row must carry the chain it signed
  over, and the closing chain is recomputed; the downloaded proof PDF reads green, the unsigned fixture reads
  "no signatures" (6 unit cases, `tests/sign-verify.test.mjs`).
- Ten strings a countersigner reads first, in the 32 non-English lexicon languages
  (`lib/lexicon-translations-sign.ts`, parity gate `tests/sign-i18n.test.mjs`, 130 cases).

**The three sentences the live site can show (what each means)**
| Diag row `Sign backend` | Sentence | What it means for the operator |
|---|---|---|
| `answers — migration 036 is applied` | *Everything this page depends on answers. Upload, place, draw, then Sign & save.* | Two-signer hand-off works on the live site. |
| `migration 036 is NOT applied on this site's Supabase` | *Migration 036 is not applied on this site's Supabase — a hand-off link cannot be made until it is (supabase/migrations/036_sign_envelopes.sql). Signing alone on this phone still works.* | Apply 036 in the Supabase SQL editor; solo signing already works. |
| `unreachable from this phone` | *Supabase did not answer from this phone. Check the connection (Wi-Fi vs mobile data) and open this page again.* | Network, not the app. |

If the `Build` row shows an older SHA than the footer of the landing page, the phone is holding a cached
page — pull to refresh. "Copy this report" puts the six rows, the sentence and the user agent on the clipboard.

**Known red outside this scope:** `test:ci` was already failing at HEAD before this wave on two steps that are
not Sign Doc's — `test:vision-lexicon` had no package script (added now; 24/24) and `test:innovation-time`
fails four waterfall-geometry cases on the /innovation deck (untouched, out of scope, reported).

## Wave 4 — fit to the signature line · swipe to turn · iconology · "no one collects a tax on signatures"

Operator ask (persisted first, `docs/asks/2026-09-07_2140_sign_doc_underline_iconology.md`, sha256
d8f0f024…f393e8e). Two-phone proof **44/44**, three-phone pod **45/45**, scratch production build green.

- **The first box fits the rule under the thumb** (`lib/sign-fit.ts`, pure, 12 unit cases): on the rendered
  page's pixels — so a drawn rule, a run of underscores or a line in a scanned PDF all count — the nearest
  line within 6 % of the tap becomes the box's width; the top stops 2 px under the text above it (never
  taller than the bottom of that text; default height when nothing is above within 12 %); the bottom sits
  1 px above the rule. No line → the default box, as before. The page now renders at ≥ 2× so a 0.7-pt rule
  survives as ink on a 1× screen. Proof: Alex's box `x=[0.120–0.451]` on the lender's rule
  `[0.117–0.450]`, Daniel's `[0.500–0.832]` on the borrower's, both bottoms on the rule, height 0.035.
- **Go to next, reused (R-CORE):** a horizontal swipe on the PDF turns the page — the Divinity Guide reader's
  gesture (`onTouchStart`/`onTouchEnd`, ±50 px, never from inside a mark) — beside the ‹ › buttons; every
  "Next" button carries Vision 2525's `ArrowRight`, every "Back" a ‹.
- **Iconology:** the rail is one table (`lib/sign-steps.ts`, POD_PHASES shape) — ⤒ upload · 웃 signers ·
  ⌖ place · ✎ draw · ◬ sign · ♡ hand off · ✓ done (⤓ open for a countersigner), past steps ticked; the
  hand-off acts read 💬 / ✉ / ⧉; glyphs are `aria-hidden`, every label stays a `t()` key.
- **The stance,** first words of the page's footer, bold, in 33 languages: *No one collects a tax on
  signatures.* (`soi.sign.stance`, 11th seeded string; parity gate 130/130).
