# 12-AsM alignment — round 5 (2026-10-07, code at 7961e79, LIVE: Verify Live #2607)

**Approved: 9 / 12** (Odin, Enlil, Krishna, Enki, Thoth, Aset, Asar, Pangu, Sofia). Means: Security 90.2 · Stability 90.8 · Scalability 89.8 · Efficiency 91 · Succinctness 89.5

Trend (approvals): 0 → 10 → 8 → 12 → 9. Round 4's minor-note fold (forward-only status merge) exposed two real edge-status defects and one backend cycle defect the earlier rounds had not reached; all three folded below.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | NOT_APPROVED | 87 | 91 | 90 | 91 | 90 |
| Odin (predictive / future-proof) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Enlil (implementation & build verification) | APPROVED | 91 | 92 | 90 | 91 | 90 |
| Krishna (integration & cross-module) | APPROVED | 90 | 92 | 90 | 91 | 90 |
| Enki (diversity & edge cases) | APPROVED | 90 | 91 | 90 | 91 | 89 |
| Thoth (data & analytics deep dive) | APPROVED | 90 | 92 | 90 | 92 | 90 |
| Athena (strategic test planning) | NOT_APPROVED | 90 | 86 | 89 | 90 | 88 |
| Christo (consensus & user-flow) | NOT_APPROVED | 90 | 86 | 90 | 91 | 90 |
| Aset (consistency validation) | APPROVED | 91 | 91 | 90 | 91 | 90 |
| Asar (synthesis & outcome) | APPROVED | 91 | 92 | 88 | 91 | 88 |
| Pangu (cutting-edge) | APPROVED | 90 | 92 | 90 | 91 | 90 |
| Sofia (multi-perspective) | APPROVED | 91 | 92 | 90 | 91 | 89 |

## Folded after this round

- **Athena** — themes are stored per cycle and a re-open keeps cycle 1's rows, so a re-themed cycle 2 put 18 themes on a 9-theme ballot. `ballot_cycle_clause` (cube6 pipeline) scopes GET /themes and `submit_user_ranking` to the newest themed cycle at or before the current one, inside the same query. New real-Postgres test `tests/cube7/test_ballot_cycle.py` (cycle 1 → re-open un-themed → cycle 2 themed: exactly cycle 2's nine; cycle-1 ids refused; history keeps 18), added to CI's fail-if-skipped list.
- **Christo** — `statusAdvances` was rank-first, so a stale earlier-cycle "ranking" beat a re-opened round's "polling". It is now cycle-first (an earlier cycle never advances; data with no cycle reads as cycle 1), the /api/sessions record carries `current_cycle` (protected), and both edge merges (page load, poll) use it.
- **Thor** — the /api/sessions key is claimable for a backend session whose create sync was lost or whose record expired; the forward-only merge then showed a forged `archived`. Against the real backend the edge status is no longer merged at all (the backend is authoritative and reachable); the remaining Path C exposure is recorded as HP-32 (APPROVAL + Worker secret).
- Gates: status-advance 10, ballot-themes 30, worker-api-routes 40.

## What each lens said (verbatim)

### Thor (risk & security stress) — NOT_APPROVED

Round 5 code, 7961e79, checked under the Thor lens: risk and security stress. Scope 1–3 still holds. The changed files are session-view.tsx (forward-only page-load merge, ballotDone flag), api.ts (queueSessionSync, one write at a time per short code), ballot-themes.ts (backoff reset on a new session, 5 s re-check cap) and mock-data.ts (validator picks parents by label). All four are sound. None of them weakens the /api/sessions write-key guard (sessions.js:185-215: hash only, 403 on a keyless settings change, count can only rise), the /api/responses keyed-polling guard, or the moderator-only close. Relevant gates I ran pass: ballot-themes 28/28, worker-api-routes, cube-sim-live, status-advance. Queueing the writes per code also removes the update-before-create race that could have orphaned the write key.

One item is still open, and it is not recorded. The /api/sessions key goes to whoever first writes a protected field. The record expires 24 h after its last write (sessions.js:98). So a real backend session whose create sync was lost, or which sat idle for 24 h (a static multi-day poll), can be claimed by anyone with the participant code. That person can write status 'archived' or 'closed'. The moderator's later writes then fail silently (api.ts:199). Both the new forward-only page-load merge and the existing 1.5 s max-merge poll show participants that forged later status and stop their polling. Round 4 asked for this to be recorded next to HP-30. The backlog does not have it; the HP-11 note covers pre-key records only. A backlog row with an honest Needs, or a code guard, earns my approval.

Scalability now reaches 90 and Succinctness 90. Security is held at 87 by this item.

- **Required:** Add the /api/sessions key-claim risk for real backend sessions to the backlog, next to HP-30, with a correct Needs (APPROVAL + Worker secret, or CODE). Name both ways in: (a) the moderator's create sync was lost, and (b) the record expired. Alternatively, close it in code: when a LIVE session's own backend GET disagrees, page load and the 1.5 s poll should not let an edge status that only a key holder wrote override it, for example by ignoring edge 'closed'/'archived' for backend sessions unless the backend agrees.
  - File: `frontend/functions/api/sessions.js`:190
  - Evidence: sessions.js:190-199 `if (!existing || !existing.write_key_hash) { ... const writeKey = newWriteKey(); ... return json({ ...publicView(metadata), write_key: writeKey }, 201)`: whoever first writes a protected field (status included, PROTECTED_FIELDS l.32-36) gets the key. sessions.js:98 `store.put(..., { expirationTtl: 86400 })` is refreshed only by writes, so a static multi-day poll (static_poll_duration_days) with no joins or transitions for 24 h loses its record. Anyone holding the participant code can then POST {short_code, status:'archived'} and claim a fresh key. The moderator's later syncs get a 403, and lib/api.ts:199 `.catch(() => {})` swallows it. The new page-load merge (session-view.tsx:473-480, `if (ahead(kvData.status)) data.status = ...`) and the existing poll max-merge (session-view.tsx:651-652, `candidates.reduce(... statusRank(s) > statusRank(best) ...)`) both take the forged later status over the backend's, so every participant sees closed/archived and the poll stops (`isActive` false, l.632). Round 4's record (docs/assessments/2026-10-07_asm_alignment_round4.md:56) asked for this to be 'Record[ed] next to HP-30'. The backlog's only mention is the HP-11 transitional note (l.73), which covers pre-key records only and says the window 'closes on its own'. Expiry reopens it for every long-idle session.
  - Why it blocks: This is a verified defect under the security lens and it is not in the backlog. The scope rule says an unlisted defect blocks approval. Round 4 already asked for it to be recorded, and this round's forward-only merge makes a forged later edge status the one participants act on.

Minor notes:
- lib/api.ts:196 sessionSyncChain keeps one settled promise per short code for the life of the tab. The growth is tiny (one entry per session a moderator creates), but deleting the entry once its promise settles would keep the map bounded.
- session-view.tsx:473 uses the edge copy only if it is ahead of the backend, but the backend's status can legitimately move back on a re-open (ranking → polling, next cycle). If the re-open's fire-and-forget sync fails, a page load in cycle 2 shows the stale 'ranking' ballot. The poll's statusAdvances check (same current_cycle) does not correct it until a broadcast arrives. Comparing current_cycle in the page-load merge, or carrying it in the edge record, would close this.
- Run tests/ballot-themes.test.mjs through `npm run test:ballot-themes`. Plain `node --test` fails on the @/lib alias, which can mislead manual reviewers. The loader is in the npm script.

### Odin (predictive / future-proof) — APPROVED

Round 5, Odin, at 7961e79. I approve. I checked each item in the round-4 fold against the code and ran the gates myself: ballot-themes 28/28, cube-sim-live 837/837, sim-console-driver 20/20, status-advance 7/7, mock-rankings 40/40, worker-api-routes 39/39, and backend tests/cube7 245 passed (all with ENVIRONMENT=test, through the npm runners).

What I confirmed in the code:
- **Forward-only status merge.** In session-view.tsx (~l.471) an `ahead()` helper uses statusRank against the backend's status. Neither the KV copy nor the Supabase copy can move a session back to an earlier status any more.
- **Ordered session sync.** In lib/api.ts l.196-201, `queueSessionSync` chains writes per short code with `prev.then(...).catch(() => {})`. One failed write cannot break the writes after it, and a create always lands before the updates that follow it.
- **Voters follow a re-open.** `ballotDone` replaces the old fake "closed" status. A participant who voted now sees a re-open into the next cycle, and their ballot resets. While the session is polling, the ballot hook gets a null session id, so returning to ranking starts a fresh fetch with a fresh backoff.
- **No double ballots.** If a voter reloads during ranking, the ballot shows again, but the backend's unique constraint (ranking_submission.py:149, "already submitted") refuses a second ballot in the same cycle.
- **Empty-answer re-check.** The cap is `Math.min(BALLOT_EMPTY_RECHECK_CAP_MS, ...)`, and the backoff resets on a new session, level or category, as the commit says.
- **SIM validator.** It now picks category parents by label, the same way the backend does.

**Scalability: 90.** It reaches 90. The remaining known scale risks are all recorded honestly in the backlog with the right "Needs":
- HP-31: the GET /themes read burst (CODE+INFRA), now bounded by the spread and jitter.
- HP-28: crowds behind one address throttled (DECISION).
- HP-25: no global spend cap (INFRA).
- HP-29: 10M/100M assessment (deferred by the operator).

**Succinctness: 90.** It reaches 90. Session sync now goes through one queue and voted-state through one flag, and the changes are small and commented.

Minor notes, not blocking:
1. The re-open reset fires only when this client actually sees status "polling". Keying it on `current_cycle` would be sturdier if a client ever missed the polling window.
2. The `sessionSyncChain` map never removes old codes. The growth per tab is small, but a moderator console running many sessions would keep accumulating entries.


Minor notes:
- frontend/components/session-view.tsx ~l.406: the ballotDone/myRankedOrder reset fires only when the client sees status 'polling'. Keying it on session.current_cycle would survive a missed polling window.
- frontend/lib/api.ts l.196: sessionSyncChain never removes settled entries. Delete the key once its promise settles, if the chain still points to it.
- Backlog index note (user_rankings (session_id, cycle_id, submitted_at, id)) should be built together with HP-29. It is already recorded.

### Enlil (implementation & build verification) — APPROVED

I approve. I checked that the checkout at /tmp/claude-0/wtm is at 7961e79 and clean apart from the untracked node_modules. I read the whole 7961e79 diff (session-view.tsx, lib/api.ts, lib/ballot-themes.ts, lib/mock-data.ts, tests/ballot-themes.test.mjs) and ran the checks myself. Frontend `npm run test:ci` exited 0: cube-sim-live 837 passed, 0 failed; ballot-themes 28 passed, 0 failed; no failing suite anywhere in the log. The project's filtered `tsc --noEmit` shows 0 errors. Backend `ENVIRONMENT=test python3 -m pytest` gave 3425 passed, 66 skipped, 0 failed, and that run includes the cube7 SQL tally parity test. The new code does what the commit says. The page-load merge only takes the /api/sessions or Supabase status when it ranks higher than the backend's (`ahead()` using `statusRank`). `queueSessionSync` sends /api/sessions writes one at a time per short code, and the gate checks that `request()` really calls it. A real voter gets `ballotDone=true` while the session keeps its true status, and a re-open still reaches them: the broadcast handler takes any status, and the backend poll uses `statusAdvances`, which counts a move to the next cycle. `useSessionBallotThemes` starts the backoff over on a new session, level or category, and re-checks an empty answer at most every 5 s. The SIM ballot validator now picks category parents by label, as the backend does. Scope 1–3 is operational under my lens. The two open items closest to this change, HP-30 (APPROVAL plus a Worker secret) and HP-31 (CODE+INFRA), are written up honestly in the backlog. Scalability and Succinctness now reach 90: one ordered sync path, one ballot rule, and the remaining read burst is recorded as HP-31.


Minor notes:
- session-view.tsx:473 — `ahead()` only compares status rank and ignores the cycle number. Say the moderator re-opens (ranking → polling, cycle 2) and the matching /api/sessions write fails. A participant who then reloads gets the stale "ranking" record, which now outranks the backend's "polling". This case was already possible before this commit, and the ordered write right after a re-open makes it unlikely. A cycle-aware comparison like `statusAdvances` would close it.
- lib/api.ts queueSessionSync — `sessionSyncChain` keeps one finished promise per short code for the life of the tab and never removes it. A moderator has only a few sessions, so this is cosmetic. Deleting the entry once its write finishes, if nothing newer has been queued, would tidy it.
- session-view.tsx — `ballotDone` lives only in component state. A voter who reloads during ranking sees the ballot again, and a second submit is refused with ranking_submission.py:149 'already submitted ranking' unless re-voting is allowed. The ballot is not corrupted, but the results card is lost after a reload. Saving the flag per session and cycle in sessionStorage would fix that.
- ballot-themes.ts — a session/level/category change resets `attempt` in a separate effect. The main effect therefore runs once with the old attempt and its timer is cleared on the next render. A 0 ms timer could, rarely, fire before that cleanup and cause one extra GET. This is harmless.

### Krishna (integration & cross-module) — APPROVED

I traced the 7961e79 folds end to end across the module boundaries and found no unlisted defect that blocks approval.

1. **Re-open reaches a real voter.** After voting, the participant sees results while the session keeps its true status. ballotDone is set in onComplete, and the results card is gated on `ballotDone && status==="ranking"`. Because the status stays ranking, the 1.5 s status poll stays active (isActive includes "ranking").
   - When the moderator re-opens, the dashboard posts /sessions/{id}/reopen. The backend bumps current_cycle (cube1 service.py:476). The poll's KV/Supabase candidates never pick a lower-ranked status, but the API fallback does: statusAdvances (session-utils.ts:17-23) accepts ranking to polling when the cycle is higher. Broadcast applies the status unconditionally, so it works when that path is healthy too.
   - The new polling effect then clears ballotDone and myRankedOrder. ThemeRankingDnD is unmounted while ballotDone is set, so it comes back with fresh submitted state. A second-cycle re-vote posts replace_last properly.
2. **Ordered sync from the LIVE bridge.** queueSessionSync (api.ts:196-201) chains syncSessionToKV per short code, after the backend's response. The /api/sessions function (functions/api/sessions.js) has no forward-only rule, so a ranking to polling write lands. The write key from the 201 create is saved before any update runs.
3. **Ballot rule parity across three places.** The mock validator's category-by-label rule (mock-data.ts:939-944) matches ballot-themes.ts categoryKey and the backend's cube6 pipeline.py `_category_key`, with the stored field as fallback. The parent-allowlist rule matches cube7 ranking_submission.py.

**Tests I ran (all green):**
- Frontend: test:ballot-themes 28/28, test:cube-sim-live 837/837, sim-parity 3/3, status-advance 7/7, mock-rankings 40/40, worker-api-routes 39/39, sim-console-driver 20/20, theme-ranked 12/12.
- Backend: pytest tests/cube1, cube5 and cube7 with ENVIRONMENT=test, 488 passed.
- I did not run the full test:ci.

**Backlog check:** HP-25 to HP-31 are in the backlog with correct Needs tags.

**Scalability (90):** it now reaches 90. The sync queue holds one small promise per short code, the ballot load is spread and capped, and the remaining GET /themes burst is honestly recorded as HP-31.

**Succinctness (90):** it now reaches 90. There is one sync queue and one ballot rule. The only residue is that mock-data repeats the categoryKey logic inline instead of importing it.


Minor notes:
- session-view.tsx:473 — the page-load merge `ahead()` compares status rank without the cycle. If the moderator's reopen sync to /api/sessions is lost (fire-and-forget, one retry), a participant loading in cycle 2 gets backend 'polling' but stale KV 'ranking', and the KV copy wins. The poll's statusAdvances then cannot recover, because current_cycle is equal. This is not a regression (before the fold KV always won), but the fix is cheap: only let the edge copy move ahead when the backend's current_cycle is 1, or include current_cycle in the syncSessionToKV payload (mock-data.ts:627-643) and compare cycles.
- mock-data.ts:940-943 repeats ballot-themes.ts categoryKey/parentCategory inline instead of reusing it (possibly to avoid an import cycle through api.ts). Moving categoryKey to a small dependency-free module that both files import would leave one copy of the rule.
- api.ts:199 — the per-code chain has no timeout. A hung fetch in syncSessionToKV (mock-data.ts:647) would stall every later write for that code until the browser gives up. An AbortSignal.timeout(~8 s) on the fetch would bound it.
- mock-data.ts:1256 — in SIM mode the create sync is still fire-and-forget outside the queue, so a transition made immediately after create can race the write key. This is SIM-only and unlikely because the transition is user-paced, but routing it through the same queue would close it.

### Enki (diversity & edge cases) — APPROVED

Approved. I reviewed the 7961e79 changes for edge cases and the ones I traced hold up. Page load now lets the edge copy only move status forward (session-view.tsx:473). Moderator writes to /api/sessions go out one at a time per short code, so start, poll and reopen land in order (api.ts queueSessionSync). A voter who has submitted keeps the session's real status: ballotDone gates the ballot at :1245 and the results card at :1266, and a re-open to polling resets the ballot (:406). The poll loop's backend branch uses statusAdvances with current_cycle, so ranking to polling in a new cycle reaches a voter who has already voted. I checked the reload-after-vote case: the ballot shows again, but POST /rankings always passes allow_revote=True (cube7 router.py), so the second submit replaces the first ballot instead of returning a 400. The SIM validator now picks category parents by label, matching the backend's _category_key (pipeline.py:400) and the client's categoryKey. When an empty ballot answer is re-checked it waits at most 5 s; after a failure the 1.5 to 30 s jittered backoff still applies. Checks run: test:ballot-themes 28/28, test:status-advance 7/7, test:cube-sim-live 837/837, backend tests/cube7 245 passed. Scope 1 to 3 works under this lens. The remaining burst and forgery risks are recorded honestly in the backlog: HP-31 (CODE+INFRA) and HP-30 (APPROVAL). Pillars: Scalability reaches 90, its only gap being HP-31, which is recorded. Succinctness is just short at 89 because mock-data.ts re-implements the category rule inline.


Minor notes:
- The re-open reset does not reset simPhase. session-view.tsx:406 clears ballotDone and myRankedOrder when status returns to polling, but simPhase stays 'results'. So a participant who voted in cycle 1 and does not vote in cycle 2 sees the 'Session Results' card when the session closes (:1266, with ballotThemes they never ranked and the line '... Rankings submitted'). They should see the 'Session ended' card, which :1339 hides because simPhase is 'results'. Fix: add setSimPhase('polling') to the same effect for non-SIM sessions.
- The page-load forward-only merge (:473) compares statusRank only; the poll loop uses statusAdvances, which also counts a cycle-2 re-open as forward. If the KV copy is stale at 'ranking' during cycle-2 polling (only possible if the queued sync failed), a reload shows the ballot. The poll then cannot recover: the backend's polling at cycle 2 does not count as forward of ranking at cycle 2 (statusAdvances needs a higher cycle). Rare, but using statusAdvances at load would close it.
- Succinctness: mock-data.ts:940 labelCat re-implements categoryKey and parentCategory from lib/ballot-themes.ts. Importing the shared helper keeps one category rule and would likely lift Succinctness to 90.
- theme-ranking-dnd.tsx:245 puts the backend's raw err.detail in the participant's error toast. The 400 texts from submit_user_ranking include UUIDs and phrasing such as 'Theme ID mismatch: missing=...'. Mapping 4xx responses to the translated submit_error_retry text keeps machine wording off the participant's screen.
- POST /rankings accepts ballots while the session is still in 'polling' (cube7 router.py:95). Right after a re-open into cycle N+1, a ballot can be filed for the new cycle before the themes are re-run. That is consistent with the 'living vote' design and worth one line in the backlog.

### Thoth (data & analytics deep dive) — APPROVED

I approve. The data path holds up under the Thoth lens at 7961e79 (/tmp/claude-0/wtm).

**Aggregation (`backend/app/cubes/cube7_ranking/ranking_aggregation.py`).** The SQL tally and the Python path give the same answer:
- Both take the Borda width from the longest ballot (`_ballot_width`, and `max(jsonb_array_length)` in SQL), so row order cannot change it.
- Borda points count every occurrence; a ballot counts once per theme for votes (SQL `DISTINCT tid`, Python `set(r)`).
- Unreadable ballots are dropped on both paths (`jsonb_typeof` / `isinstance`).
- Both paths share one replay prefix (`_replay_prefix`) and the same refusals (`_check_tally`).

**Replay hash.** The streamed hash is the same bytes as `_compute_replay_hash`. COLLATE "C" ordering of the comma-joined ballots matches Python's list sort because every theme id is a 36-character UUID. `_feed_repeated` keeps memory flat when many voters agree.

**Tests.** The parity proof (`tests/cube7/test_sql_tally_parity.py`) is skipped locally because there is no Postgres here. CI runs it against a postgres:16 service (`deploy.yml` sets `SIM_TEST_DSN`), so it is a real gate.

**Overlapping runs.** Two aggregations of the same session and cycle serialize on an advisory lock.

**1M harness.** `backend/scripts/sim_1m.py` and `sim_compare.py` refuse any non-local database or production. They seed the 3 Theme01 groups × 9 Theme02 with fixed ids and the 40/35/25 split, and `sim_compare` exits 1 when the result hash changes, so a faster method that changes the answer counts as a regression.

**Results checked this round:**
- Backend cube6 + cube7: 447 passed, 10 skipped.
- Frontend: ballot-themes 28/28, cube-sim-live 837/837, mock-rankings 40/40, sim-console-driver 20/20, theme-tiers 8/8, theme-ranked 12/12, status-advance 7/7, worker-api-routes 39/39. sim-parity and ranking-shape ran with only module-type warnings and no pass count shown.
- The SIM ballot validator now picks category parents by label, the same way the backend's `_category_key` does (`mock-data.ts:939`).

**Backlog.** Open items under this lens are recorded with the right Needs: HP-26 (per-stage meter and run hash: CODE), HP-29 (deferred by the operator), HP-31 (GET /themes read burst: CODE+INFRA), and HP-03/09 (INFRA).

**Scalability and Succinctness now reach 90.**
- Scalability: the measured 1M aggregate is 1.8 s / 192 MB. What remains is fan-out tiering (HP-01/02/06), all recorded with honest INFRA/APPROVAL needs.
- Succinctness: the two tally paths now share their prefix, refusals and width rule, so they cannot drift. The one heavier spot is `_write_aggregation`, a 14-argument helper (see minor notes).


Minor notes:
- Unlisted, minor (only the session owner can trigger it). PATCH /sessions/{id}/ranking-config (`backend/app/cubes/cube1_session/router.py:279-309`) changes theme01_category and theme2_voting_level with no check on session status or existing ballots. If the moderator switches category or level mid-ranking, `tally_rankings` mixes the cycle's earlier ballots (for example 9-wide Risk ballots) with the new ones (3-wide Support ballots). The Borda width becomes the longest ballot, and the replay hash is labelled with the new category. Suggest refusing the change once a ballot exists in the current cycle, or starting a new cycle_id. At minimum, add it to the backlog.
- HP-26 is still the main analytics gap: sim_1m.py measures only aggregate_rankings over seeded themes. There is no per-stage row for summaries 333/111/33 → Theme01 → Theme02 9/6/3, and no run hash. It is honestly listed as CODE.
- The parity proof only runs where Postgres is reachable (it is skipped in this sandbox). Its weight rests on the deploy.yml postgres service, so keep that service required for the backend job.
- `_write_aggregation` takes 14 positional arguments. Passing the `tally_rankings` dict straight through would cut that roughly in half (Succinctness).

### Athena (strategic test planning) — NOT_APPROVED

Under the strategic test-planning lens I would not sign off yet. Everything this round folded in is correct and gated, and every suite I ran passes (backend 3425; ballot-themes 28, cube-sim-live 837, worker routes 39, and the rest). The flaw is in coverage: the gates stop at the reopen, and the next step after it is wrong. Themes are stored per cycle (phase_b `_replace_cycle_themes`, `cycle_id=current_cycle`), but GET /themes (pipeline.get_session_themes filters on session only) and the ranking validator (ranking_submission.py:101-106 has no cycle condition) both read across cycles. So once the moderator uses the dashboard's Reopen, the cycle-2 ballot asks voters to rank cycle-1 and cycle-2 themes together, 18 instead of 9 at level 9. The validator accepts it, so nothing errors. The backlog does not list this, and no test walks the journey past the reopen. Scoping both reads to current_cycle, plus one backend test of a cycle-2 ballot, would earn my approval. The rest is minor: the edge status override is unaware of cycles after a reopen, and the ballot hook's reset ordering is fragile. Scalability (89, held back by HP-31, honestly recorded) and Succinctness (88) do not reach 90 yet under this lens.

- **Required:** Limit the ballot to the session's current cycle, both where the themes are read and where a ballot is checked. GET /sessions/{id}/themes (get_session_themes / get_session_themes_enriched) should return only Theme.cycle_id == session.current_cycle, or return cycle_id so the client can filter. ranking_submission's valid-id query and its parent allowlist need the condition Theme.cycle_id == current_cycle added. Then add a backend test: run cycle 1 theming, reopen, run cycle 2 theming, and assert the cycle-2 ballot holds exactly the cycle-2 themes at the voting level (9, not 18) and that a cycle-2 submission naming a cycle-1 theme is refused.
  - File: `backend/app/cubes/cube7_ranking/ranking_submission.py`:101
  - Evidence: Themes are stored per cycle: phase_b.py:729 `await _replace_cycle_themes(db, session.id, session.current_cycle)`, and new rows get `cycle_id=session.current_cycle` (phase_b.py:736,764). _replace_cycle_themes deletes only the same cycle, so cycle-1 themes survive a reopen. The read side is not scoped to a cycle. pipeline.py:384-387 is `select(Theme).where(Theme.session_id == session_id)`, with the docstring "Return all Theme records for a session". The validator is not scoped either: ranking_submission.py:101-106 has only `Theme.session_id == session_id, Theme.parent_theme_id.isnot(None), Theme.cluster_metadata["level"]... == level_num, Theme.label != ""`, and the parent allowlist at l.73-79 likewise filters on session only. frontend/lib/ballot-themes.ts has no cycle filter (grep 'cycle' finds nothing there). The dashboard exposes Reopen (app/dashboard/page.tsx:592 `handleTransition("reopen")`), and round 4 explicitly routed voters into the next cycle (session-view.tsx resets ballotDone on 'polling'). No backend test covers a cycle-2 ballot: grep for cycle_id=2 / current_cycle=2 finds only tests/cube1/test_cycle_advance.py and tests/cube6/test_metrics.py.
  - Why it blocks: This is in scope item 3 (voting on 9 themes) and the re-open journey this round claims to have fixed. After Reopen and re-theming, the cycle-2 ballot shows and requires both cycles' themes: at level 9 that is 18 items, including stale cycle-1 themes. The validator agrees with that ballot, so nothing errors and the tally silently mixes cycles. phase_b.py:726 records the same class at one level down: 'appending gave a second full set and a ballot that had to rank both'. The defect is not listed in the backlog, and every gate (ballot-themes 28/28, the 3425 backend tests) passes because none of them walk the journey past the reopen.

Minor notes:
- Verified green at 7961e79: backend pytest 3425 passed / 66 skipped. Frontend ballot-themes 28/28, cube-sim-live 837/837, sim-console-driver 20/20, status-advance 7/7, worker-api-routes 39/39, mock-rankings 40/40, sim-parity 3/3.
- On page load the edge status may now only move forward, judged by statusRank alone (session-view.tsx:473 `const ahead = ...statusRank(st) > statusRank(data.status)`). The /api/sessions record carries no current_cycle (mock-data.ts:627-643 payload). Production has no RESPONSES KV binding (wrangler.jsonc:26 is commented out), so it runs on a per-colo Cache API with a 5-minute TTL. A stale 'ranking' record left after a reopen, for example when the fire-and-forget reopen sync fails because the write key was lost, now beats the backend's true 'polling' at load. The 1.5 s poll does not correct it either: statusAdvances compares current_cycle values that both came from the backend copy. Suggested fix: skip the edge override when the backend's current_cycle > 1 and its status is 'polling', or put current_cycle in the sync payload. The gate for this is only a source regex (ballot-themes.test.mjs:66). It wants a runtime case.
- useSessionBallotThemes: when sessionId/level/category change while attempt > 0, the main effect first schedules a 0 ms fetch with the old attempt, and the separate setAttempt(0) effect then re-runs it with the spread. The timer is normally cleared before it fires, but the order is fragile. Folding the reset into the main effect, by keying attempt on the session, removes the double path.
- The SIM validator's labelCat (mock-data.ts:940) duplicates the backend's _category_key substring rule but not its _CATEGORY_KEYS exact map. The two agree for today's English labels; a shared fixture test (the same labels through both) would keep SIM and LIVE in step.
- Scalability is still just under 90 under my lens, because HP-31 (the uncached GET /themes burst) is open and honestly recorded. Succinctness sits at about 88: session-view.tsx keeps adding phase flags (simPhase, ballotDone, myRankedOrder) that a small participant-phase reducer would hold more clearly.

### Christo (consensus & user-flow) — NOT_APPROVED

Christo, round 5, at 7961e79: NOT_APPROVED, one required change. Most of the user flow now works. The real voter keeps the session's true status after voting, the toast reads 'Rankings submitted', a re-vote replaces the ballot on the server, moderator transitions sync to /api/sessions in order, and the ballot hook's backoff, Retry and the 5 s empty re-check behave as described. Gates are green (ballot-themes 28, status-advance 7, cube-sim-live 837). One defect is unlisted and verified in the code, on the exact re-open path this commit claims to fix. Both edge-status merges in session-view (the poll loop's statusRank max at L652 and the new page-load `ahead` at L473) ignore current_cycle, and the /api/sessions record carries no cycle. A stale 'ranking' copy in a Cloudflare datacenter, or one left by a 403 reopen from a second moderator device, therefore pulls a participant in a re-opened round back to the ballot. They stay stuck there, and reloading does not clear it. The fix is small: carry the cycle in the edge record and use the existing statusAdvances rule in both merges, plus one test case. Scalability and Succinctness now reach 90 under this lens; Stability sits at 86 until the re-open regression is closed.

- **Required:** When the edge copy (/api/sessions KV/Cache record or Supabase session_status) is merged into the participant's status, compare cycles as well as rank, so a stale 'ranking' from the previous cycle can never override a re-opened round's 'polling'. Concretely: carry current_cycle in the /api/sessions record (syncSessionToKV payload in lib/mock-data.ts ~L627 and buildMetadata in functions/api/sessions.js ~L115), and in session-view use statusAdvances({status, current_cycle}, edge) in place of the raw statusRank comparison, both in loadSession's `ahead` and in the poll loop's `bestStatus` reduce. Add a case to tests/ballot-themes.test.mjs or tests/status-advance: local polling cycle 2 + edge 'ranking' with no/older cycle must stay polling.
  - File: `frontend/components/session-view.tsx`:652
  - Evidence: Poll loop L651-652: `const candidates = [sessionStatus, kvStatus, sbStatus]...; const bestStatus = candidates.reduce((best, s) => statusRank(s) > statusRank(best) ? s : best, sessionStatus);` then setSession(status: bestStatus) and return. The cycle-aware rule only runs on the backend fallback, L669: `statusAdvances({ status: sessionStatus, current_cycle: session?.current_cycle }, data)`. The new page-load guard at L473 is the same: `const ahead = (st) => ... statusRank(st) > statusRank(data.status)`. lib/session-utils.ts says ranking→polling with a higher cycle is a forward move, but neither edge merge applies that rule, and the edge record has no current_cycle at all: buildMetadata in functions/api/sessions.js holds status but not the cycle, and the syncSessionToKV payload has none. Production has no KV bound (wrangler.jsonc keeps kv_namespaces commented out), so sessions.js falls back to the per-datacenter Cache API. A PoP whose copy last got 'ranking' keeps it whenever the reopen write does not land there. That happens on a 403 when the moderator reopens from a browser without the write key (the round-4 comment itself names 'a second moderator device'), or when the moderator's writes come from a different PoP.
  - Why it blocks: Path: participant on the ballot, cycle 1. The moderator taps 'Re-open polling (next round)'. The broadcast (or the L669 backend check) moves the participant to polling, and ballotDone resets. Once broadcast has been quiet for 8 s, the next 1.5 s poll reads the stale edge 'ranking', which outranks 'polling', so setSession pulls them back to the ballot. From then on the participant is stuck: every later poll keeps the max-ranked 'ranking' even after the edge copy says 'polling', and L669 needs a higher cycle than the 2 the session already holds. A page reload does not help either, because the L473 `ahead` override applies the same stale 'ranking' over the backend's 'polling'. They cannot answer the new round. This is the re-open flow commit 7961e79 claims to fix ('a re-open into the next cycle reaches them'), and it is not in the HP backlog.

Minor notes:
- Verified green at 7961e79: npm run test:ballot-themes 28/28, test:status-advance 7/7, test:cube-sim-live 837/837.
- Ballot flow otherwise holds together: a reload after voting re-shows the ballot, but the backend always passes allow_revote=True (cube7 router L130), so a second submit replaces the ballot and never double-counts. The ballotDone/myRankedOrder reset on 'polling' plus the results-card condition (closed | archived | ballotDone&&ranking) cover the moderator closing after a vote.
- After a re-open, simPhase stays 'results' in a real session. It is harmless today because the results card also requires ranking/closed status and the input disable only applies in simulationMode, but resetting simPhase alongside ballotDone in the same effect would keep the state consistent.
- A participant who answered every question in cycle 1 sees 'All submitted / Respond again' when cycle 2 opens. submittedQuestions is not cleared on a re-open, which costs one extra tap. Consider clearing it in the same 'polling' effect.
- SIM validator labelCat (mock-data.ts L940) matches the label by substring ('risk'/'support'/'neutral'). It mirrors the backend's _category_key, but a Neutral label containing 'support' would be read as support. Low risk with the fixed Theme01 labels.
- Succinctness reaches 90: one sync queue (queueSessionSync) and one ballot rule. Scalability is at 90 given HP-31 (GET /themes burst) is honestly recorded with the 1.5 s first-load spread and the 5 s empty-recheck cap in place.

### Aset (consistency validation) — APPROVED

I approve. All five round-4 folds in 7961e79 are in the code, and they agree across files and across SIM and LIVE:
- The edge copy can only move the status forward. Both the KV copy and the Supabase copy go through the same ahead() check (session-view.tsx:473-481).
- queueSessionSync (api.ts:196-201) sends one write at a time per short code, in the order the backend answered. Mock mode still returns before the bridge runs, so nothing is written twice.
- A real voter's results now use a ballotDone flag. Only SIM fakes "closed". A re-open resets the ballot through the polling effect at session-view.tsx:406. It reaches the voter in two ways: by Broadcast (onBroadcastStatus does not check rank), or by the fallback poll, which ends in statusAdvances. The poll loop now stays active through "ranking" because the status is no longer faked to "closed".
- The ballot hook resets on a new session, level or category, shows loading on Retry, and re-checks an empty answer at most every 5 s. These match the backoff constants.
- The SIM ballot validator now finds the category parent by its label. That mirrors cube6 pipeline._category_key (exact map, then the risk/support/neutral substrings). The two give the same result on the canonical labels.
- The new toast key cube10.sim.rankings_submitted is in lexicon-data.ts:1508 and translated.

Checks I re-ran:
- test:ballot-themes: 28/28.
- cube-sim-live (the SIM/LIVE parity gate): 837/837.
- Backend cube1 and cube7: 361 passed.

Scalability now reaches 90: the per-code sync chain, the 5 s cap on empty re-checks and the first-load spread for HP-31 are in place, and the remaining work is honestly listed in the backlog. Succinctness also reaches 90: one sync queue and one ballot rule, both small. What is left under my lens is minor and none of it is a regression.


Minor notes:
- Forward-only merge vs re-open: session-view.tsx:473 compares statuses with statusRank only, and the /api/sessions payload has no current_cycle (mock-data.ts:627-643). So the 'ranking' (cycle N) → 'polling' (cycle N+1) exception that statusAdvances handles cannot be seen at page load. If the reopen write to /api/sessions fails (for example a 403 for a moderator browser without the write key, mock-data.ts:653), a stale KV 'ranking' wins over the backend's 'polling' on page load. The poll loop's candidate reduce at session-view.tsx:652 has the same gap (pre-existing). Suggested fix: carry current_cycle in the KV payload and use statusAdvances in both places. This is not a regression; before this commit KV overrode the status unconditionally.
- session-view.tsx:476: ends_at and participant_count are still taken from the KV copy even when its status is not ahead. A stale record from an earlier cycle can therefore put an old ends_at next to a newer status. Apply ends_at only when the KV status is applied, or when the cycles match.
- useSessionBallotThemes: the reset effect setAttempt(0) (ballot-themes.ts:104) runs after the fetch effect has already fired with the old attempt. When attempt was above 0, a switch of session, level or category fetches twice. Harmless; it could be folded into one keyed effect.
- api.ts sessionSyncChain is never pruned. That is one entry per short code a moderator writes in a tab, which is negligible, but it could delete the entry when the chain settles.
- mock-data.ts _validateMockBallot labelCat checks the substrings without the backend's exact-label map first. The result is the same for the canonical Theme01 labels. A shared table would keep the two locked together if the labels change.

### Asar (synthesis & outcome) — APPROVED

I approve scope 1–3 at 7961e79 as operational. I checked this by running the tests myself. Full `npm run test:ci` exited 0. test:ballot-themes passed 28/0 and test:cube-sim-live passed 837/0, so SIM and LIVE give the same results for Cubes 1–9. Backend tests/cube7, which includes the SQL tally parity test, passed 245. The round-4 fold matches what its commit says. (1) In session-view.tsx around line 473, the `ahead()` check lets the /api/sessions or Supabase copy only move status forward of the backend's. (2) In lib/api.ts around line 196, `queueSessionSync` chains each code's writes on `prev.then(() => syncSessionToKV(...))`, so start→poll and create→update cannot land out of order. (3) A real voter's results now use a `ballotDone` flag and the session keeps its true status. The results card accepts `ballotDone && status === "ranking"`, and returning to polling resets the ballot. The SIM path still closes locally as before. (4) The ballot hook caps empty re-checks at 5 s with `BALLOT_EMPTY_RECHECK_CAP_MS`, resets backoff on a new session, level or category, and shows loading on Retry. (5) The SIM validator now picks category parents by label, the same way the backend's _category_key does. The open defects I can see are all recorded in the backlog with an honest Needs. These include HP-01/02/04/06, which mean the live site cannot fan out 1M today (INFRA/APPROVAL), plus HP-09/10/12/13, HP-22, HP-25 to 31, and the quadratic-Borda-at-1M note. On the question asked: Scalability does not honestly reach 90. The 1M aggregation path is solid: Postgres tally, parity-tested, measured. But the fan-out and poll-storm blockers for real 1M users remain, even though they are honestly listed, so I score it 88. Succinctness also stays below 90 at 88. session-view.tsx is 1,361 lines, dashboard/page.tsx 1,730 and mock-data.ts 1,748, and several new gate checks in ballot-themes.test.mjs match source text with regexes, so they would break on harmless reformatting. Neither is a blocker.


Minor notes:
- session-view.tsx ~473: the forward-only merge is right in general but wrong for one case. A re-open (ranking → polling, next cycle) is a backward rank move. If that re-open's fire-and-forget /api/sessions write fails (queueSessionSync swallows errors with .catch(() => {})), a fresh page load shows the stale 'ranking' over the backend's true 'polling'. statusAdvances in lib/session-utils.ts already handles cycles, so applying the same current_cycle check here would close the gap.
- lib/ballot-themes.ts: the new `useEffect(() => setAttempt(0), [sessionId, level, category])` runs alongside the fetch effect. When attempt was not 0, a session change fetches once with the old attempt and then again after the reset, so a new session can trigger two fetches. Harmless, but it is the double fetch the round tried to remove.
- lib/api.ts sessionSyncChain: the per-code Map is never pruned. This only matters in long-lived moderator tabs and is negligible.
- tests/ballot-themes.test.mjs round-4 checks: they match source text with regexes (e.g. `prev\.then\(\(\) => syncSessionToKV\(`). This tests the wording, not the behaviour, so a harmless refactor can turn it red. Prefer behavioural checks where the module can be imported.
- Scalability stays below 90 until HP-01/02/06 (fan-out tier, poll back-off) and HP-04 (dashboard ring buffer) land. Those need INFRA and APPROVAL, not code alone, so the score ceiling sits with the operator's choices, not this loop.
- Succinctness: the three protected files (session-view 1,361, dashboard 1,730, mock-data 1,748 lines) are still the main drag. Splitting them is APPROVAL-gated under the Trinity rule and is worth a backlog line.

### Pangu (cutting-edge) — APPROVED

I read the 7961e79 fold (session-view.tsx, lib/api.ts, lib/ballot-themes.ts, lib/mock-data.ts) against the round-4 notes and checked each fix in the code. In session-view.tsx (around line 473), the `ahead()` check means the /api/sessions or Supabase copy can only move status forward of the backend's, using the shared statusRank. In lib/api.ts (lines 196-201), `queueSessionSync` chains each `syncSessionToKV` call one at a time per short code, and its `.catch` keeps one failed write from blocking the ones after it. The new `ballotDone` flag keeps the session's real status, so a re-open into polling resets the ballot and my ranked order. A SIM run still closes locally as before. In ballot-themes.ts, `setAttempt(0)` resets on a new session, level or category. Retry now shows loading, and an empty answer is re-checked at most every 5 s (`BALLOT_EMPTY_RECHECK_CAP_MS`). The SIM validator's label-based category check matches the backend's `_category_key` in cube6_ai/pipeline.py (lines 393-412): same substring order, and the exact-label map gives the same result. I ran the gates: tests/ballot-themes.test.mjs passed 28/28 and tests/cube-sim-live.test.mjs passed 837/837. The real scaling limits that remain, the GET /themes read burst (HP-31, CODE+INFRA) and Path C forgery (HP-30, APPROVAL), are recorded honestly in the backlog with the right Needs. Scalability now reaches 90: the ordered sync, capped re-checks and jittered backoff bound the client side, and edge-caching the immutable theme set is the backlogged next step. Succinctness reaches 90: there is one sync queue and one ballot rule, and the changes are small and commented. Scope items 1-3 are operational under this lens.


Minor notes:
- lib/api.ts:196 sessionSyncChain is never pruned. A moderator tab keeps one finished Promise per short code it has created or updated, which is harmless at normal moderator volumes. It could delete its entry when `next` settles and is still the stored tail.
- lib/mock-data.ts:940 labelCat falls back to the stored theme01_category when the label matches no category, but the backend's _category_key returns None there. The two agree on every canonical label; they would differ only for an unlabelled or non-English parent row in SIM.
- session-view.tsx:406 the ballotDone reset depends on the client seeing status 'polling'. If a re-open went from ranking to polling to ranking again between two status polls, a voter could keep a stale ballotDone. This is unlikely given the poll interval, but resetting on a cycle or reopen counter would be more robust.
- HP-31 is the next real step toward 1M scale: the theme set does not change once theming finishes, so an edge cache keyed on session id plus theming run, together with `?level=&category=` filtering, would turn the ranking-open burst into a cache hit.

### Sofia (multi-perspective) — APPROVED

I read the 7961e79 diff from four angles: the participant, the moderator, the SIM operator and the 1M-scale operator. Every round-4 minor note I checked lands as described.

Participant: session-view.tsx:402-406 adds a ballotDone flag, and the session keeps its real status, so the 1.5 s poll (isActive includes "ranking") keeps running. A re-open into the next cycle still reaches the voter. The KV/Supabase path does not regress ranking to polling, but the API fallback does, through statusAdvances, which treats a higher current_cycle as forward. Polling then clears ballotDone and myRankedOrder.

Moderator: api.ts queueSessionSync chains the /api/sessions writes for each short code. Start then poll stays in order, and an update can no longer race the create that saves the write key. Page load moves status forward only (session-view.tsx:473 `ahead`), so a stale copy at the edge cannot show an earlier status.

SIM: mock _validateMockBallot now picks category parents by label, the same way the backend's _category_key does, so SIM and LIVE behave alike.

Scale: the ballot hook resets backoff when the session, level or category changes, and re-checks an empty-but-healthy answer at most every 5 s (BALLOT_EMPTY_RECHECK_CAP_MS). The GET /themes read burst that remains is recorded as HP-31 (CODE+INFRA). Path C forgery is HP-30 (APPROVAL). Both have correct Needs.

Tests run read-only: test:ballot-themes 28/0, test:cube-sim-live 837/0, test:status-advance 7/0, test:sim-console-driver 20/0, test:theme-tiers 8/0, test:worker-api-routes 39/0, backend tests/cube7 245 passed (including the SQL tally parity test).

Scalability reaches 90; what holds it there is HP-31, which is honestly recorded. Succinctness is 89, just short of 90. The new logic is small and well commented, but session-view.tsx is still a very large component that carries status merge, Trinity sends, ballot and results together. Scope items 1–3 work in both modes, and nothing I found blocks approval.


Minor notes:
- A voter who reloads after voting can see an error. ballotDone and everSubmitted live only in React state, so a reload during ranking shows the ballot again with replace_last:false. The backend answers 'already submitted' (ranking_submission.py:149) and theme-ranking-dnd.tsx:240 shows a destructive error toast. The vote is safe, but the screen is wrong. Fix: send replace_last:true on a first submit after reload, or treat an 'already submitted' answer as done.
- sessionSyncChain (api.ts) keeps one settled promise per short code for the life of the tab. The size is trivial for one moderator; deleting the entry when the chain settles to the same promise would keep the map empty.
- The participant poll at session-view.tsx:652 still picks its best status by rank alone, and only the API fallback recognises a re-open (statusAdvances with current_cycle). A re-open therefore reaches a voter only after the KV/Supabase comparison finds nothing ahead. That works, but it is one more API read per tick while ranking. Using statusAdvances on the KV/Supabase candidates too would make the rule one rule.
- Succinctness is 89, just short of 90. session-view.tsx combines status merge, Trinity sends, ballot and results. Moving the status-merge rule (page load plus poll) into lib/session-utils, next to statusAdvances, would give it one owner and its own test.
