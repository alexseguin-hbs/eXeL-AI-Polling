# 12-AsM alignment — round 4 (2026-10-07, code at 2a9bca4, LIVE: Verify Live #2606)

**Approved: 12 / 12** (Thor, Odin, Enlil, Krishna, Enki, Thoth, Athena, Christo, Aset, Asar, Pangu, Sofia). Means: Security 90.8 · Stability 91.2 · Scalability 89.4 · Efficiency 90.9 · Succinctness 88.9

Trend: round 1 0/12 → 2 10/12 → 3 8/12 → **4 12/12**. All twelve lenses aligned. Two pillars (Scalability 89.4, Succinctness 88.9) are under 90, so the loop continues with the minor notes the lenses converged on.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | APPROVED | 90 | 90 | 88 | 90 | 88 |
| Odin (predictive / future-proof) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Enlil (implementation & build verification) | APPROVED | 91 | 90 | 89 | 91 | 89 |
| Krishna (integration & cross-module) | APPROVED | 90 | 91 | 90 | 91 | 90 |
| Enki (diversity & edge cases) | APPROVED | 91 | 91 | 89 | 90 | 89 |
| Thoth (data & analytics deep dive) | APPROVED | 90 | 92 | 90 | 92 | 89 |
| Athena (strategic test planning) | APPROVED | 91 | 91 | 89 | 90 | 88 |
| Christo (consensus & user-flow) | APPROVED | 92 | 92 | 90 | 91 | 90 |
| Aset (consistency validation) | APPROVED | 91 | 92 | 90 | 91 | 88 |
| Asar (synthesis & outcome) | APPROVED | 91 | 92 | 89 | 91 | 88 |
| Pangu (cutting-edge) | APPROVED | 91 | 91 | 90 | 92 | 90 |
| Sofia (multi-perspective): participant, moderator, operator/HI, integrator/SDK consumer and auditor views across SIM and LIVE | APPROVED | 91 | 90 | 89 | 91 | 88 |

## Minor notes folded after this round

- **Enlil, Thor** — page load let the /api/sessions record override the backend's status outright; it may now only move the status forward.
- **Enlil, Krishna, Sofia, Athena** — the LIVE bridge wrote fire-and-forget, so back-to-back transitions (start → poll) or an update racing the create could land out of order; writes are now chained one at a time per session code.
- **Krishna, Thoth, Asar, Pangu, Sofia, Odin** — a voter's view faked status "closed", so a re-open into the next cycle never reached them; a separate ballot-done flag now drives their results card while the session keeps its true status, and a re-open resets it. The toast reads "Rankings submitted", not "Session complete".
- **Enki, Athena, Enlil, Sofia, Odin, Asar** — the ballot hook resets its backoff on a new session/level/category, shows loading on Retry (no double fetch), and re-checks an empty-but-healthy answer at most every 5 s.
- **Aset** — the SIM ballot validator picks the category's parents by label, like the backend.
- **Enlil, Krishna, Athena** — the gate now asserts that request() really calls the bridge (in order), the forward-only merge and the re-open path; the test header names its npm runner.

## What each lens said (verbatim)

### Thor (risk & security stress) — APPROVED

Round 4, Thor, at 2a9bca4. I approve. Nothing new blocks scope 1–3 under my lens.

The round-3 fold does not open a new attack surface:

1. **Participant See results.** It no longer calls POST /sessions/{id}/close. The backend still guards that route with `require_role("moderator", "admin")` (backend/app/cubes/cube1_session/router.py:375-379). The participant path now changes only the participant's own view, and tests/ballot-themes.test.mjs checks this.

2. **The LIVE bridge to /api/sessions.** In lib/api.ts:187-194, the record is written only after a successful POST whose path matches `LIVE_SESSION_WRITE` (`/^\/sessions(\/[0-9a-f-]{36}\/(start|open|poll|rank|reopen|close|archive))?$/`), and only when the response has a string `short_code`. Ballots, joins and responses are not bridged; the gate checks "ballots and joins are not". The payload goes through syncSessionToKV (lib/mock-data.ts:622-643), which keeps only public fields: no moderator id, no tokens. It runs under the existing HP-11 write-key model in functions/api/sessions.js:185-217. A key is minted on the first create and stored only as a hash. A request without the key cannot change status or settings (403); it can only raise participant_count, capped by `KEYLESS_COUNT_STEP`.

3. **The Path C write guard.** In functions/api/responses.js:115-116, a POST still needs a keyed record in polling status. Backend sessions now meet that guard, so Path C works again without weakening it. Forging rows inside a live polling session is still HP-30 (Needs APPROVAL + Worker secret), which is honest.

4. **Ballot retry.** The backoff (1.5 s doubling to 30 s, ±50% jitter) and the 0–1.5 s spread on the first load reduce the thundering-herd risk on GET /themes. The remaining read burst is recorded as HP-31 (CODE + INFRA).

Checks I re-ran:
- test:ballot-themes: 24/0
- test:worker-api-routes: 39/0
- test:cube-sim-live: 837/0
- backend tests/cube1 + tests/cube7: 361 passed

Everything left is minor and listed in the notes.

Minor notes:
- **First keyed write claims the code.** /api/sessions gives the key to whoever first writes a protected field (sessions.js:190-199), so it proves no moderator identity. Anyone can create a keyed record in polling status for an unused code and write Path C rows to it, inside the 600/min budget. They could also claim a real backend session's code if they got there before the moderator's fire-and-forget create write, or if that write failed and was retried. Backend codes are random and the window is small, so this is low risk. Record it next to HP-30: the HMAC credential issued at join could also sign the session record, for example with a backend-issued signature over short_code.
- **A moderator on a second device leaves KV status stale.** If the moderator creates on one device and changes status on another, the second device has no write key. syncSessionToKV gets a 403 and only logs `console.warn` (mock-data.ts:653). KV then keeps the old status. session-view.tsx:466-469 (loadSession) takes KV status over the backend's own status with no forward-only check, so a participant who reloads can see a stale status (for example draft) while the backend is polling. The repeating status poll at session-view.tsx:643-644 only moves status forward, so this is limited to the first load. Fix: apply the same statusRank max in loadSession.
- **Session details are public by code.** For backend sessions, title, description and settings can now be read by anyone with the code through GET /api/sessions?code=. The code is already the join secret and participants see the title, so this is a known exposure. It is the same class as the round-3 note about unauthenticated GET /api/responses.
- **Carried over from round 3, still open:** participant_id and language_code are stored unchecked in responses.js. The edge-rate counter is per colo and lets requests through on error (fail-open). On the Cache API fallback, records are kept per colo. All three are backup-path only.

### Odin (predictive / future-proof) — APPROVED

I checked both of my round-3 asks against the code at 2a9bca4, and both are done.

(1) A failed theme load no longer turns into an empty ballot. In frontend/lib/ballot-themes.ts, `useSessionBallotThemes` reports one of three states: loading, ready or failed. An empty result stays in "loading" and asks again later. A failed request becomes "failed", offers a `retry`, and also retries by itself using `ballotRetryDelayMs`: the wait starts at 1.5 s and doubles up to 30 s, with ±50% random jitter. The first load is spread at random over 0–1.5 s (`BALLOT_FIRST_LOAD_SPREAD_MS`). In components/session-view.tsx (around lines 1226–1238), the "failed" state shows a Retry button using the existing `shared.error.*` keys, and `ThemeRankingDnD` is drawn only when the load is ready and has at least one theme (`liveBallot.status === "ready" && ballotThemes.length > 0`). So a real session never draws a ballot with zero themes. The effect cleanup clears any pending timer, so leaving the page or pressing Retry by hand does not start a second retry loop. I ran tests/ballot-themes.test.mjs: 24 passed, 0 failed, and it is part of `test:ci`.

(2) The burst of theme reads when ranking opens is now backlog item HP-31 (docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md, line 66). It names the cause (an uncached `get_session_themes_enriched` query with no Cache-Control header), says what round 3 limits and what it does not, gives the real fix (an edge or in-process cache keyed on session plus theming run, and `?level=&category=` so the response carries only the ballot), and marks it CODE + INFRA. That is an honest record.

I also checked the other round-3 fold. In lib/api.ts, `LIVE_SESSION_WRITE` and `syncSessionToKV` write the session record to the worker's `/api/sessions` store after the moderator creates a session and after each status change. The participant's See results now changes only their own view. Neither raises a new concern under my lens.

None of the remaining issues blocks approval:
- When themes are still being written, the "loading" retries use the same growing delay, so the ballot can appear up to about 30 s after the themes are ready.
- The read burst itself is only spread out and retried, not removed. That is recorded as HP-31.

Minor notes:
- ballot-themes.ts: an empty result counts toward `attempt`, so while the themes are still being written the wait between checks grows to 30 s, and participants can see the ballot up to about 30 s after theming finishes. A smaller cap for the empty case (for example 5 s) would make it feel faster without bringing back a crowd of requests.
- HP-31 remains the real scale fix for 1M participants: caching an immutable theme set at the edge would turn a burst of N database queries into about one per session.
- session-view sets the participant's own status to 'closed' after they submit. This relies on the status-only-moves-forward rule so that a later poll still showing 'ranking' does not undo it. The rule holds today and is worth keeping in mind if that rule ever changes.

### Enlil (implementation & build verification) — APPROVED

I approve for scope 1–3. I checked out /tmp/claude-0/wtm at 2a9bca4 and rebuilt and ran everything myself.

**Builds and tests I ran**
- Frontend `npm run test:ci` exits 0. That includes `cube-sim-live` (837 passed, 0 failed) and `ballot-themes` (24 checks). It also includes worker-api-routes, sim-console-driver, mock-rankings and status-advance.
- `tsc --noEmit` shows 0 new errors after the filter CLAUDE.md requires.
- Backend `ENVIRONMENT=test python3 -m pytest`: 3425 passed, 66 skipped, 0 failed. This covers the cube7 SQL-tally parity test and the 1M harness tests.

**The four round-3 folds are in the code and behave as described**
1. **Ballot loading (`lib/ballot-themes.ts`).** `useSessionBallotThemes` returns loading, ready or failed. An empty result waits and asks again. A failure sets `retry: again` and schedules `ballotRetryDelayMs(attempt+1)`: 1.5 s doubling to a 30 s cap, ±50% jitter. The first load waits a random 0–1.5 s. The effect's cleanup clears the timer and sets `live=false`, so no state update lands after unmount. The label filter is `(r.label ?? "") !== ""`, the backend's exact-empty rule.
2. **Ballot display (`session-view.tsx`).** The ballot renders only on `liveBallot.status === "ready" && ballotThemes.length > 0`. The hook gets `sessionId` only during ranking or closed, so nobody polls GET /themes while polling is open.
3. **Participant's See results.** The ranking block no longer calls `/close`. `onComplete(order)` keeps the participant's own order, and the results card draws `resultThemes`.
4. **Path C for backend sessions (`lib/api.ts`).** After a successful live POST whose path matches `LIVE_SESSION_WRITE`, `request()` calls `syncSessionToKV` without waiting for it. That pattern matches the backend routes exactly (`cube1_session/router.py` lines 194 and 317–385: start, open, poll, rank, reopen, close, archive). Mock mode returns earlier, so the record is not written twice.
- **Read burst on GET /themes.** HP-31 is in the backlog as CODE + INFRA, with a concrete fix in its "Needs".

**Why nothing blocks.** Every point below is minor. Responses still reach the moderator by Paths A and B, and anything wrong at load corrects itself within one poll.

Minor notes:
- The new `lib/api.ts` sync writes /api/sessions without waiting and without ordering (line 188, `void syncSessionToKV(...)`). Mock mode waits for each transition's sync (`await syncSessionToKV(session)`, mock-data.ts:1585). Two transitions sent back to back can therefore reach the worker out of order and leave the record a step behind. Examples: dashboard `handleTransition` draft→start→poll (page.tsx:471-474), and sim-console-driver create→open→poll (lines 76-97). The worker would then refuse Path C with 409. The create sync can also race the first update before `write_key` comes back, which gives a 403 or a second key. A per-short_code promise chain would make LIVE behave like SIM. Paths A and B still deliver.
- Now that backend sessions have a record in /api/sessions, `session-view.tsx` loadSession (lines 466-469) lets that record's status override the backend's status outright, where it used to take whichever status is further along. A stale record can therefore briefly show an earlier status. Examples: a moderator on a second device without the write key gets 403 on every sync; or a reordered write. The 1.5 s checkStatus poll corrects it, using `statusAdvances` against the backend. Taking the highest rank at load, as checkStatus does, would remove the flicker.
- `tests/ballot-themes.test.mjs` tests only the `LIVE_SESSION_WRITE` regex. Nothing checks that `request()` actually calls `syncSessionToKV`, so deleting line 187-189 keeps the gate green. The hook's loading/ready/failed behaviour is likewise checked only by source regex, with no runtime test.
- `useSessionBallotThemes` never resets `attempt`. If sessionId or category changes after a load, the next load skips the 0–1.5 s spread and starts at the backoff level already reached. A manual Retry also keeps showing the failed state until the new fetch returns, with no loading indicator.
- In live mode, `syncSessionToKV` reads `question_text` from `MOCK_QUESTIONS`. For backend sessions that is always null, so each sync stores `question_text: null` in /api/sessions. Nothing on the live path reads it today.

### Krishna (integration & cross-module) — APPROVED

The fix I asked for last round is in the code. The live-mode (real backend) gap in Path C is closed. In frontend/lib/api.ts:187-188, after a successful live POST that matches LIVE_SESSION_WRITE (`/^\/sessions(\/[0-9a-f-]{36}\/(start|open|poll|rank|reopen|close|archive))?$/`, line 194), the code calls `void syncSessionToKV(data as Session, path === "/sessions" ? "create" : "update")`. I checked both sides of that wire. The backend routes in cube1_session/router.py at 194 and 317-385 all return SessionRead, which carries short_code. The dashboard's handleTransition (dashboard/page.tsx:474) and the create call (dashboard/page.tsx:1121) both go through api.post. That means the first create gets the write key from functions/api/sessions.js, the key is kept, and each later transition writes the keyed record with its new status. So responses.js:114-116 (`meta.status !== "polling"` → 409) now accepts Path C for backend sessions while they are polling. Mock mode returns before this code runs (api.ts:98-111), so nothing is written twice. Joins and ballots are left out of the bridge on purpose, and ballot-themes.test.mjs:59-60 checks that.

The other round-3 changes also line up across modules:
- **Ballot themes:** ballotThemeRows applies the same exact-empty label rule (`(r.label ?? "") !== ""`), the same level and the same category-parent scoping as ranking_submission.py:66-111.
- **Ballot loading:** useSessionBallotThemes waits while the result is empty, shows Retry on failure, and retries with backoff. session-view only renders ThemeRankingDnD once the ballot is ready and has themes.
- **See results:** a participant's See results no longer calls the moderator-only /close.
- **Backlog:** HP-31 (the GET /themes read burst) is recorded honestly as CODE + INFRA.

Checks run:
- test:ballot-themes 24/0
- test:cube-sim-live 837/0
- test:worker-api-routes 39/0
- test:sim-console-driver 20/0
- test:status-advance 7/0
- backend cube1 + test_sql_tally_parity 125 passed

What remains under this lens is minor and does not block approval (see minor_notes).

Minor notes:
- Write-order race in the KV bridge: launching from draft fires `/start` and then `/poll` back to back (dashboard/page.tsx:471-475). Each fires its own fire-and-forget syncSessionToKV, and each can retry once after 500 ms (mock-data.ts:684-689). If the start write lands last (for example it retried), the KV record goes back to status 'open' and responses.js refuses Path C (409) until the next transition. Paths A and B still deliver, so this is not data loss. Possible fixes: send the writes for one code one after another (a per-code promise chain), or have sessions.js refuse a status that goes backwards for the same cycle.
- Backend sessions sync question_text as null, because syncSessionToKV reads MOCK_QUESTIONS[session.id]. Harmless today (live participants load questions from the backend), but a KV reader of question_text would see nothing for live sessions.
- After a participant submits a ballot, session-view sets its local status to 'closed'. If Broadcast is down and the moderator then reopens (ranking→polling, cycle+1), the fallback poll will not move that participant forward. statusAdvances (session-utils.ts:21-23) only lets polling count as forward when the previous status is 'ranking', not 'closed', and the KV/Supabase candidates are ranked by statusRank. The Broadcast path (onBroadcastStatus) does apply the reopen, so this only affects the degraded path. A fix would be to keep the local results state separate from session.status, or to treat a higher current_cycle as forward from 'closed'.
- Only the regex is gated, not the live bridge itself. No test checks that request() actually calls syncSessionToKV in live mode, so a refactor of api.ts could quietly drop it. A source-level assertion in ballot-themes.test.mjs would lock it in.

### Enki (diversity & edge cases) — APPROVED

My round-3 request is done. A failed ballot fetch no longer gives the participant an empty ballot they can submit. In frontend/lib/ballot-themes.ts, useSessionBallotThemes returns one of three states: loading, ready or failed. The `.catch` sets `{status:"failed", retry: again}` and schedules `ballotRetryDelayMs(attempt+1)`, which starts at 1.5 s, doubles up to a 30 s cap and adds ±50% jitter. An empty result stays in "loading" and asks again with the same backoff. The first load is spread randomly over 0–1.5 s. In components/session-view.tsx, lines 1227–1238 show a loading line, or an error with a Retry button (existing shared.error.* keys). ThemeRankingDnD is mounted only when status is "ready" and there are themes. The ballot filter also matches the backend: label exactly non-empty, parent has the session's Theme01 category, theme at the voting level, and theme01_category is in SessionRead. I also checked the other round-3 fixes: the participant's "See results" never calls /close and only changes their own view; the results card shows the order they submitted; a failed ranking POST resets `submitted` and shows an error, so it never moves on silently. Checks run: npm run test:ballot-themes (24/24) and test:cube-sim-live (837/837). The remaining read burst on GET /themes is honestly recorded as HP-31 (CODE + INFRA). The issues left under my lens are all minor and listed below.

Minor notes:
- ballot-themes.ts: the `attempt` counter is never reset when sessionId changes, so moving to a second session in the same tab skips the 0–1.5 s first-load spread and starts at a longer retry delay. Fix: reset attempt to 0 when sessionId changes.
- ballot-themes.ts: after a manual Retry, the state stays "failed" until the new fetch returns. There is no loading feedback, so a quick second tap starts a second request. Fix: set loading at the start of a retry.
- ballot-themes.ts: once the state is "ready", the ballot is never fetched again. If the moderator re-runs theming during ranking, the participant keeps the old theme ids and their POST is refused with 422. The ranking component does show that error, but nothing reloads the ballot. Rare, but worth a line in the backlog next to HP-31.
- Running `node --test tests/ballot-themes.test.mjs` directly fails with ERR_MODULE_NOT_FOUND because it needs the ts-alias loader. Only the npm script works. That is fine for CI, but a short comment at the top of the test file would save reviewers the confusion.

### Thoth (data & analytics deep dive) — APPROVED

I approve. I re-read the data path at 2a9bca4, and the round-3 fold keeps the client ballot, the stored ballot and the tally consistent with each other.

(1) The ballot rule still matches the backend. In ballot-themes.ts, ballotThemeRows keeps only non-empty Theme02 rows at the session's level, under Theme01 parents of its category. It now uses `(r.label ?? "") !== ""`, which drops both null and "" labels. The backend's `Theme.label != ""` drops the same rows (in ranking_submission.py:105, a SQL NULL compares as not true, so a null label is dropped there too). categoryKey uses substring matching, which gives the same key as the backend's _CATEGORY_KEYS exact match plus its substring fallback (pipeline.py:393-413) for the three canonical labels.

(2) The results card shows only what was actually submitted. The See results button renders only while `submitted` is true (theme-ranking-dnd.tsx:345-352). handleAdjust clears that flag, so after an adjustment the order shown is never one that was not posted. The re-vote still sends replace_last, so nothing is counted twice. The participant no longer posts /close, which removes a write that could change the session state and that the tally never needed.

(3) A failed or empty theme load no longer turns into an empty ballot. A ballot with zero themes is never drawn, so no zero-length or partial ranking is possible at the client. The backend also enforces exact-set, no-duplicate ballots, and I re-checked that.

(4) LIVE_SESSION_WRITE matches exactly the moderator create and the seven transition routes in cube1 router.py:194-385. The write is fire-and-forget and never blocks the response.

(5) Tests run read-only, all passing:
- ballot-themes 24/24, cube-sim-live 837/837, sim-console-driver 20/20, mock-rankings 40/40, theme-tiers 8/8, theme-ranked 12/12, ranking-shape 8/8.
- Backend: tests/cube7 245 passed; cube6 plus test_sql_tally_parity 211 passed, 10 skipped; the parity file alone 9/9, so the SQL tally and the Python tally still agree.

The ranking-open read burst on GET /themes is honestly recorded as HP-31 (CODE + INFRA), with the right method: an immutable-after-theming cache plus a ?level=&category= ballot-only payload.

Minor notes:
- ballot-themes.ts toBallotThemes rescales confidence with `c > 1 ? c / 100 : c`. That guesses whether the value is a percentage or a fraction. The backend should declare a single scale for LiveThemeRow.confidence so a confidence of exactly 1.0 and a 1% value cannot be confused.
- parentCategory falls back to row.theme01_category when the label has no category key. The backend's valid_ids uses the label only. The two agree today, because GET /themes derives theme01_category from the same label, but the fallback could diverge if that endpoint ever sets the category another way.
- The participant results card totals responseCount over the ballot's Theme02 rows, which is only the session's category slice. cube10.sim.final_stats reads as a session-wide figure. A label saying it is the category slice would stop it being read as the session's total responses.
- After See results the participant's local status is set to closed. STATUS_ORDER only moves forward, so if the moderator later reopens the session this device will not follow it back without a reload. This is an edge case for the participant flow, not a defect in the tally.

### Athena (strategic test planning) — APPROVED

Athena signs off on round 4 (2a9bca4) and approves. All four round-3 objections are fixed in the code, and each fix is checked by a gate.

**What I ran**
- `tests/ballot-themes.test.mjs`: 24 of 24 pass.
- Full `npm run test:ci`: passes (exit 0).
- Backend `pytest tests/cube7 tests/cube1` with ENVIRONMENT=test: 361 passed.

**The four fixes, checked in the code**
- **Ballot loading (Odin, Enki):** `useSessionBallotThemes` in `frontend/lib/ballot-themes.ts` now returns loading, ready or failed.
  - An empty result stays loading and asks again later. A failed fetch shows a Retry button and also retries by itself.
  - The retry delay starts at 1.5 s, doubles up to 30 s, and varies by ±50% so a crowd does not retry together. The gate tests this with injected random values (750, 1500, 6000 and 30000 ms).
  - The first load waits a random 0–1.5 s. `session-view.tsx` shows the ranking screen only when the status is ready and themes exist.
- **Participant results (Christo):** the participant's See results no longer posts to the moderator-only `/close`. It moves only their own view, and the results card shows their own submitted order. ThemeRankingDnD passes that order through `onComplete(orderedThemes)` from both buttons.
- **Path C for backend sessions (Krishna):** `lib/api.ts` now writes the session record to /api/sessions after create and after each status change, and only on success. I compared the pattern with the backend routes in `cube1_session/router.py` (start, open, poll, rank, reopen, close, archive): it covers all seven and leaves out ballots and joins.
- **Read burst on GET /themes (Odin):** recorded as backlog HP-31, marked CODE + INFRA, with a concrete fix (cache the theme set and filter by level and category). That record is honest.

**Minor notes, none blocking**
- Most of the round-3 page checks only scan the source code. Nothing runs the hook or the page to prove the transitions, such as failed, then retry, then ready.
- The hook's retry counter never resets when the session id changes, so a later session can start with a longer wait.
- The create sync runs in the background. A status change sent right after it could arrive before the write key is saved and be refused.

Scope 1–3 is working in both SIM and LIVE as far as these tests show.

Minor notes:
- Most round-3 page checks in tests/ballot-themes.test.mjs only scan the source text, e.g. /liveBallot\.status === "failed"/ and !/setThemes\(\[\]\)/. Nothing runs useSessionBallotThemes against a mocked api.get to prove the empty → loading, reject → failed → auto-retry → ready transitions. A small runtime test of the hook, or the same loop pulled into a pure function and tested, would turn these into checks of behaviour rather than wording.
- useSessionBallotThemes (lib/ballot-themes.ts): the `attempt` count is never reset when sessionId, level or category change. If the same component instance moves to another session, its first load skips the 0–1.5 s spread and its backoff starts from the old count. Resetting attempt in that case would fix it.
- lib/api.ts: the create sync is `void syncSessionToKV(...)`, fire-and-forget. If the moderator sends a status change before the create's 201 returns and the write key is saved, that update goes without X-Session-Key and gets a 403 (only a console warning). Unlikely with a human moderator, but possible for the scripted Admin Console driver, which goes straight from create to /open and /poll in sim-console-driver.ts lines 76–97.
- LIVE_SESSION_WRITE does not cover PATCH /sessions/{id} (settings) or /ranking-config, so the record in /api/sessions can fall behind on settings like theme2_voting_level for backend sessions. The round-2 Path C guard checks status only, so this does not break delivery.

### Christo (consensus & user-flow) — APPROVED

I checked both of my round-3 asks first, and both are done in 2a9bca4. (1) The participant's See results no longer closes the session. In frontend/components/session-view.tsx (~L1242-1249), onComplete now only changes the participant's own view: it sets local status "closed" and setSimPhase("results"). The comment there says "closing the session stays the moderator's action on the dashboard", and nothing on this path calls /close. (2) The results card now shows the participant's own submitted order. ThemeRankingDnD passes orderedThemes to onComplete (theme-ranking-dnd.tsx L254 and L352), session-view stores it in myRankedOrder, and resultThemes = !simulationMode && myRankedOrder ? myRankedOrder : ballotThemes (~L401-403). See results only appears once a ballot has been submitted (the `submitted && sessionId` block), and Adjust hides it again. So the order on the results card is always the ballot the server accepted, including after a re-vote. A failed POST resets submitted and shows a toast, so a vote that did not reach the server never advances the participant. The ballot now loads in three states (loading / ready / failed with Retry), and ThemeRankingDnD only renders when the state is ready and themes exist, so an empty or failed load can no longer give the participant an empty ballot. Gates: test:ballot-themes passed 24/24 and test:cube-sim-live passed 837/837. The ranking-open read burst is recorded honestly as backlog HP-31 (CODE + INFRA). Everything left under my lens is copy wording.

Minor notes:
- When a real participant presses See results, the toast says cube10.sim.session_complete ("Session Complete") and the card says "AI theming and ranking complete" (cube10.sim.sim_results_desc), even though the session is still ranking and only their own ballot is in. Because the card lists the participant's personal order under the heading "Session Results", it can read as the group consensus. For non-SIM sessions, use wording like "Your ranking" / "Ranking submitted — results after the moderator closes". Under the AFTER_FILL rule this is staged English only, not a translation fill.
- After the moderator closes the session, the participant's view stays on their own order and never switches to the live consensus aggregate. That is acceptable for this scope; a later revision could swap in the Cube 7 aggregate once the server reports the session closed.
- The labels in the results card's per-theme responseCount and the ThemeResultsChart are fine, but the chart is driven by resultThemes, so its bar order follows the participant's ranking, not response volume. This is intentional but worth a label.

### Aset (consistency validation) — APPROVED

I approve 2a9bca4. I checked whether the round-3 folds are consistent with the backend, with the other caller of the same code, and between SIM and LIVE. They are.

(1) The ballot filter matches the backend rule. ballotThemeRows now uses `(r.label ?? "") !== ""`. That is the same as the SQL condition `Theme.label != ""` in cube7 ranking_submission.py:97-102, where a NULL label is also left out. The level and parent_theme_id conditions still match. A parent's category goes through categoryKey, which uses the same substring mapping as the backend's _category_key at pipeline.py:400-413.

(2) The participant's results card shows exactly the order the server accepted. ThemeRankingDnD shows See results only while `submitted` is true (theme-ranking-dnd.tsx:343-352). Adjust clears that flag, so a dragged order the participant has not resubmitted can never reach onComplete. session-view.tsx:1242 stores that order as myRankedOrder. The participant path no longer calls /close; it only changes the participant's own status and simPhase.

(3) The Path C bridge matches the endpoints the moderator actually calls. LIVE_SESSION_WRITE (lib/api.ts:194) covers POST /sessions plus start, open, poll, rank, reopen, close and archive. Those are the backend routes at cube1 router.py:194-385, and the dashboard calls them through `/sessions/${id}/${action}` (dashboard/page.tsx:472-475). The KV write goes through the same syncSessionToKV that mock mode uses (mock-data.ts:622), so the write-key and 201/403 handling is identical in both modes.

(4) The load states and the render conditions agree. ThemeRankingDnD renders only when the load is ready and has themes; loading and failed have their own branches, and the failed branch uses the existing shared.error.* keys. The retry backoff is pure and is tested by the gate.

Gates I ran: ballot-themes 24/0, cube-sim-live 837/0, sim-console-driver 20/0, mock-rankings 40/0, worker-api-routes 39/0, sim-parity 3/3, backend cube1 + cube7 361 passed. HP-30 and HP-31 are in the backlog with the correct Needs.

Minor notes:
- mock-data.ts:939 _validateMockBallot picks the category's parents by comparing `r.theme01_category === cat`. The backend at ranking_submission.py:81-85 and the client's categoryKey ?? theme01_category both go by the parent's label instead. The results agree today because the mock parents carry both fields, but the mock should use categoryKey(label) so the three implementations follow one rule.
- useSessionBallotThemes (ballot-themes.ts:129-131) treats an empty ballot as 'still theming' and retries without end. Suppose a session's theme01_category matches no Theme01 parent; the backend submit would raise 'No Theme 01 parents match category'. The participant would then see Loading until the 30 s retry cap and never an explanation. This is an edge case, but a final 'no themes for this category' state, once the AI status reports completed, would be consistent with the backend's error.
- The syncSessionToKV payload (mock-data.ts:627-642) does not include theme01_category. That is harmless today, because LIVE participants read the session from the backend. If any KV reader later builds a ballot, the record will not match the backend's session.

### Asar (synthesis & outcome) — APPROVED

I approve 2a9bca4. Scope items 1 to 3 work end to end. The four round-3 objections are closed in the code, and so are both minor notes I raised in round 3.

Tests I ran myself:
- The ballot-themes gate passed 24 of 24 and cube-sim-live passed 837 of 837, both run through the npm scripts with the ts-alias loader.
- The backend's tests/cube7 and tests/cube1 passed 361 of 361 with ENVIRONMENT=test.

What I checked in the code:
- **Ballot loading (Odin and Enki).** In frontend/lib/ballot-themes.ts, `useSessionBallotThemes` has three states: loading, ready and failed. An empty result keeps waiting and asks again with backoff. A failed fetch sets `failed`, offers a Retry button and also schedules a retry with `ballotRetryDelayMs`: 1.5 s doubling, capped at 30 s, ±50% jitter. The first fetch is spread over 0–1.5 s.
- **Label rule.** The filter is now `(r.label ?? "") !== ""`, the same as the backend's exact-empty check. That closes my round-3 note about the client trimming labels.
- **Ballot rendering.** In session-view.tsx (around lines 1228–1250), the loading line, the Retry view (keys `shared.error.something_wrong` and `shared.error.retry`) and ThemeRankingDnD are separate branches. ThemeRankingDnD renders only when the status is `ready` and there are themes. That closes my round-3 note about an empty ranking list.
- **Path C for backend sessions (Krishna).** `LIVE_SESSION_WRITE` matches exactly the cube1 router's POST routes: create plus start, open, poll, rank, reopen, close and archive (router.py lines 194–385). The dashboard's `handleTransition` and the Admin Console driver both go through `api.post` with those paths. The bridge to /api/sessions runs only on the live-backend branch, after a successful response, without blocking the caller, with failures caught.
- **Participant results (Christo).** The participant path no longer posts `/close`. ThemeRankingDnD calls `onComplete(orderedThemes)` only after a successful submit or from See results, which appears only after a submit. The results card shows the participant's own submitted order. A failed POST still does not advance (the C7-5 rule).
- **Load burst.** The leftover read burst on GET /themes is recorded honestly as HP-31 (CODE + INFRA).

The minor issues that remain are listed in my minor notes. None blocks sign-off.

Minor notes:
- ballot-themes.ts: the 'empty result' path uses the same doubling backoff, up to a 30 s cap with jitter (up to 45 s), as the failure path. Once theming finishes, a participant who arrived early may wait up to about 45 s before the ballot appears. A lower cap for the empty-but-healthy case (say 5 s) would make the ballot appear sooner.
- session-view.tsx about line 1246: See results sets the local status to 'closed'. If the moderator later reopens (closed to polling), this participant's forward-only STATUS_ORDER may leave them on the results view until they reload. This is an edge case, but the local status and the server status differ by design here and are not reconciled.
- syncSessionToKV on create: if a backend short_code collides with an existing /api/sessions record that this browser has no write key for, the worker answers 403. The only signal is a console.warn, so Path C would stay refused for that session without anyone seeing it. That is unlikely, but it could be noted alongside HP-30 and HP-31.
- The results card in a real session now shows the participant's own order under the heading cube10.sim.sim_results_desc. The wording still reads like a group or SIM result. Once the English is final, a participant-specific description key would remove the ambiguity (staged in AFTER_FILL under the translation rule).

### Pangu (cutting-edge) — APPROVED

I reviewed 2a9bca4 read-only in /tmp/claude-0/wtm and approve it. My two minor notes from round 3 are folded, along with the four objections from the other lenses.

The ballot hook:
- frontend/lib/ballot-themes.ts useSessionBallotThemes now returns a three-state result: loading, ready, or failed with a retry.
- An empty result keeps waiting and asks again. A rejected fetch shows Retry and also retries on its own via ballotRetryDelayMs: 1.5 s doubling to a 30 s cap, ±50% jitter.
- The first load waits a random 0–1.5 s, and the timer is cleared on unmount.
- The label filter is now the backend's exact-empty rule.
- session-view.tsx:1237 renders ThemeRankingDnD only when the status is ready and the ballot has themes. An empty ballot can no longer reach Submit.

The Path C bridge:
- lib/api.ts LIVE_SESSION_WRITE matches the backend routes exactly: POST /sessions plus /{uuid}/start|open|poll|rank|reopen|close|archive (cube1 router.py:194–385).
- It matches the dashboard's handleTransition call (`/sessions/${session.id}/${action}`, dashboard/page.tsx:475) and the console driver's calls.
- syncSessionToKV runs fire-and-forget after a successful response and swallows errors. Joins and ballots are not bridged.

The participant path:
- It no longer calls the moderator-only /close.
- onComplete(orderedThemes) carries the participant's own order to the results card.

The ranking-open read burst on GET /themes is recorded honestly as HP-31 (CODE + INFRA), with the cache and ?level=&category= fix.

Checks I ran, all passing:
- npm run test:ballot-themes: 24/0
- test:cube-sim-live: 837/0
- test:worker-api-routes: 39/0
- backend tests/cube7 + tests/cube1 under ENVIRONMENT=test: 361 passed

Under my lens, scope 1–3 is operational. What is left is minor or already in the backlog.

Minor notes:
- Living-vote edge: once a participant taps See results, their local status is 'closed'. The 1.5 s status poll then stops, because session-view.tsx:624 isActive excludes closed, and statusAdvances (lib/session-utils.ts:23) only treats ranking→polling at a higher cycle as forward, never closed→polling. If the moderator reopens into cycle 2 (POST /reopen, ranking→polling), only the Supabase status broadcast can bring that participant back. A missed broadcast leaves them on the results card. Before this round the participant's /close fallback set 'closed' too, so this is not a regression. Consider keeping a local 'viewing results' flag instead of rewriting session.status, or recording it with the living-vote items.
- When a session never gets Theme02 rows at its voting level (for example, theming failed), useSessionBallotThemes stays in 'loading' indefinitely, retrying at the 30 s cap. That is safe, but after N empty attempts a 'themes not ready yet' message would tell the participant why nothing is happening.
- The LIVE_SESSION_WRITE bridge depends on the moderator's browser holding the worker write key returned at create. A backend session created before this deploy, or one moved to another device, gets a 403 on update, and the session-sync code only logs a console warning. Path A and Path B still deliver. One sentence next to HP-30 would make this residual explicit.
- This one is carried over from round 3 and is still open. categoryKey reads the category from the label text ('risk' / 'support' / 'neutral'), the same way as the backend's _category_key. A stored theme01_category enum on both sides would keep a translated or renamed Theme01 label from moving a ballot to the wrong category.
- Next cutting-edge step for 1M, already in the backlog as CODE: a stake-weighted SQL tally, so quadratic_borda gets the same Postgres path and memory profile as equal-weight Borda.

### Sofia (multi-perspective): participant, moderator, operator/HI, integrator/SDK consumer and auditor views across SIM and LIVE — APPROVED

I approve round 4. I read each round-3 fold in 2a9bca4 from five points of view and checked it against the code.

Participant (LIVE). In frontend/lib/ballot-themes.ts, useSessionBallotThemes returns one of three states: loading, ready or failed. An empty result keeps the participant in loading and asks again later. A failure sets failed with a retry and also schedules its own retry through ballotRetryDelayMs (1.5 s doubling to a 30 s cap, ±50% jitter). The first fetch waits a random 0–1.5 s. The effect cleanup sets live=false and clears the timer, so an unmounted page never writes state. session-view.tsx draws three branches: loading text, a Retry button using the existing shared.error.* keys, and ThemeRankingDnD only when the state is ready and themes is non-empty. The empty-ballot Submit that round 3 found can no longer happen. The label filter `(r.label ?? "") !== ""` uses the backend's exact-empty rule.

Christo's fold. onComplete no longer posts to /sessions/{id}/close. It sets myRankedOrder from the order ThemeRankingDnD passes, and the results card, chart and stats read resultThemes.

Moderator and integrator. lib/api.ts calls syncSessionToKV after a successful POST that matches LIVE_SESSION_WRITE. That regex covers exactly the create route plus the seven transition routes in backend cube1_session/router.py (start, open, poll, rank, reopen, close, archive), and it requires a short_code in the response. The write is fire-and-forget, so a failure there never touches the API call. The worker (functions/api/sessions.js) returns the write key on the first keyed create, and syncSessionToKV remembers it. The Path C guard in functions/api/responses.js (status must be polling, line 116) can therefore pass for backend sessions.

Operator and auditor. HP-31 is recorded honestly as CODE + INFRA, with the spread and backoff described as bounding the burst, not removing it.

What I ran: npm run test:ballot-themes passed 24/0, npm run test:cube-sim-live passed 837/0, and backend pytest on tests/cube7 and tests/cube1 (ENVIRONMENT=test) passed 361.

What is left is minor and listed below. None of it breaks scope items 1–3.

Minor notes:
- Participant honesty: after See results, a real-session participant sees the toast cube10.sim.session_complete ('Session Complete') and the card header 'Session Results' / 'AI theming and ranking complete' (lexicon-data.ts l.1511, 1512, 1519). The session may still be in ranking for everyone else, and the numbered list is only their own submitted order (session-view.tsx l.1244-1259). A participant could take their own ballot for the group result. Suggest a 'Your ranking' label in the real-session branch, staged English-only under AFTER_FILL.
- Living vote after See results: session-view sets the participant's status to 'closed' locally. The 1.5 s HTTP/KV status poll runs only while status is draft, open, polling or ranking (l.573), and statusAdvances lets a later cycle through only from 'ranking' (session-utils.ts l.23). So if the moderator reopens into cycle 2, only the Broadcast listener (onBroadcastStatus) can bring that participant back. If Broadcast is down they stay on results. This was already true before round 3 (the old /close call failed for participants and also set 'closed' locally). Worth either a backlog line or letting statusAdvances accept a higher current_cycle from a locally closed status.
- Retry button: clicking it in the failed state bumps attempt but leaves status at 'failed' until the next response arrives. The button gives no visible feedback, and a second tap starts another fetch. Setting loading in again() would fix both.
- KV ordering: dashboard handleTransition runs start and then poll from draft (dashboard/page.tsx l.471-475). Each fires its own syncSessionToKV with no ordering between them. If the 'open' write lands after the 'polling' write, the /api/sessions record would stay 'open' and Path C would refuse responses (409) until the next transition. This is unlikely, because the start sync is sent a full backend round-trip earlier. Chaining the syncs per short_code would remove the window.
- syncSessionToKV sends question_text from MOCK_QUESTIONS, which is null for backend sessions, so the KV record never carries a backend session's question. This is harmless for the Path C guard but worth knowing for any KV reader that displays it.
