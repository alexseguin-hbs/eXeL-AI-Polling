# 12-AsM alignment — round 3 (2026-10-07, code at 859b97b, LIVE: Verify Live #2605)

**Approved: 8 / 12** (Thor, Enlil, Thoth, Athena, Aset, Asar, Pangu, Sofia). Means: Security 89.6 · Stability 89.8 · Scalability 88.9 · Efficiency 90.7 · Succinctness 87.8

Trend: round 1 0/12 → round 2 10/12 → round 3 8/12. Thor and Krishna's round-2 blockers are closed (Thor approves); the four NOT_APPROVED lenses all found defects in the new real-session ballot path that round 2 introduced — a regression class, folded below.

| Lens | Verdict | Sec | Stab | Scal | Eff | Succ |
|---|---|---|---|---|---|---|
| Thor (risk & security stress) | APPROVED | 90 | 91 | 88 | 90 | 88 |
| Odin (predictive / future-proof) | NOT_APPROVED | 90 | 86 | 87 | 90 | 88 |
| Enlil (implementation & build verification) | APPROVED | 90 | 90 | 88 | 90 | 87 |
| Krishna (integration & cross-module) | NOT_APPROVED | 89 | 88 | 88 | 91 | 88 |
| Enki (diversity & edge cases) | NOT_APPROVED | 88 | 85 | 88 | 90 | 87 |
| Thoth (data & analytics deep dive) | APPROVED | 90 | 92 | 91 | 92 | 89 |
| Athena (strategic test planning) | APPROVED | 91 | 91 | 88 | 90 | 87 |
| Christo (consensus & user-flow) | NOT_APPROVED | 86 | 87 | 89 | 90 | 87 |
| Aset (consistency validation) | APPROVED | 90 | 92 | 90 | 91 | 88 |
| Asar (synthesis & outcome) | APPROVED | 90 | 92 | 89 | 91 | 87 |
| Pangu (cutting-edge) | APPROVED | 90 | 92 | 91 | 92 | 90 |
| Sofia (multi-perspective): participant, moderator, operator/HI, integrator/SDK consumer and auditor views across SIM and LIVE | APPROVED | 91 | 92 | 90 | 91 | 88 |

## Folded after this round

- **Odin + Enki** — a failed GET /themes became an empty ballot that was never retried (Submit posted `[]`, refused). `useSessionBallotThemes` now returns loading / ready / failed: an empty result keeps waiting, a failure shows Retry and retries on its own with 1.5→30 s jittered backoff, the first load is spread over 0–1.5 s; the ballot renders only with themes in it. Label filter aligned to the backend's exact-empty rule.
- **Odin** — the ranking-open read burst on GET /themes recorded as HP-31 (CODE + INFRA) with the cache-and-filter fix.
- **Krishna** — against the real backend nothing wrote the keyed /api/sessions record, so the round-2 Path C guard refused every backend session. `lib/api.ts` now writes it after the moderator's create and each transition (`LIVE_SESSION_WRITE`), the same call mock mode makes.
- **Christo** — a participant's See results called the moderator-only close route; it now moves only their own view to results. The results card shows the participant's own submitted order instead of numbering the server's row order.
- Gate: `tests/ballot-themes.test.mjs` 24 checks (retry/backoff/jitter, failed state, no /close on the participant path, own order, the LIVE bridge regex).

## What each lens said (verbatim)

### Thor (risk & security stress) — APPROVED

The one thing I asked for last round is done. The unauthenticated write to Trinity Path C is closed in the code, and the part still open is recorded honestly in the backlog. In frontend/functions/api/responses.js, a POST now has to pass three checks before it touches the store. First, a short-code format check (`/^[A-Z0-9]{4,16}$/`). Second, a per-address budget (`overLimit(request, "responses", 600)`). Third, a check that /api/sessions holds a keyed record for that code in polling status (`if (!meta || !meta.write_key_hash) ... 404`, `if (meta.status !== "polling") ... 409`). Bad codes, draft codes and closed codes take no rows, so the feed cannot be filled with ~500 forged rows that evict the real ones. Text and summaries are capped at 3333 characters, and the stored list is capped at 500 entries. Someone who knows a live code can still forge rows while the session polls. That is recorded as HP-30 in docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md with a concrete fix (an HMAC credential issued at join, signed with a Worker secret) and Needs = APPROVAL + Worker secret. The fix touches the protected Path C client, so that Needs entry is correct. I re-ran the checks: test:worker-api-routes 39/0, test:ballot-themes 15/0, test:cube-sim-live 837/0, backend tests/cube7 245 passed. Under my lens, scope items 1–3 are operational, and nothing I found is unrecorded and blocking.


Minor notes:
- frontend/edge-rate.js overLimit is per colo, not atomic, and lets requests through when the counter fails (`catch { return false; }`). That is fine for a backup path and its header comment says so, but 600 requests a minute per address is a soft limit, not a hard quota.
- GET /api/responses?session=<code> needs no authentication, so anyone who knows a code can read that session's Path C feed (clean_text plus summaries). The code is the only secret here. Consider requiring the session to be live, or recording this next to HP-30.
- In responses.js, body.participant_id and body.language_code are stored unchecked (no type or length limit). A long string can make one entry bigger than the text cap allows. Add a UUID/length check when the HP-30 credential work lands.
- On the Cache API fallback (no RESPONSES KV binding), the session record and the response list are both per colo. A moderator's session record may be missing at another edge, so legitimate Path C writes there get a 404. Paths A and B still deliver, but binding the KV namespace removes this.

### Odin (predictive / future-proof) — NOT_APPROVED

Odin, round 3, reviewing 859b97b. Everything I re-checked holds:
- The ballot rule is correct end to end. ballot-themes.ts mirrors submit_user_ranking: Theme02 rows at the session's theme2_voting_level, non-empty label, scoped to theme01_category through the same risk/support/neutral keying. The model default is theme2_9 on both sides, and GET /themes enriches theme_level the same way.
- The Postgres advisory lock (pg_advisory_xact_lock(hashtext('agg:session:cycle'))) correctly serializes overlapping aggregations before the delete+insert.
- The Path C write guard (keyed session, polling status, 600/min per address) is in place. Its residual is honestly recorded as HP-30, and the blob race as HP-09.
- Gates are green: backend tests/cube7 245 passed; frontend ballot-themes 15/15, cube-sim-live 837/837, sim-console-driver 20/20, worker-api-routes 39/39, mock-rankings 40/40.
- The backlog is honest on every 1M blocker (HP-01..06, HP-09/10/12/13/25/28/30), and HP-29 holds the 10M/100M work per the operator.

Two forward-looking gaps came in with this round's new ballot path:
1. A failed theme fetch silently becomes an empty ballot that is never retried. That voter then gets a backend error they cannot act on, until they reload. At 1M, when status flips to ranking, some failures are certain.
2. The theme set is immutable at that point, yet every participant fetches it uncached and unfiltered at the same instant, and the backlog does not list this.

Both are small. Fixing the first and recording (or caching) the second would earn my approval.

- **Required:** Treat a failed ballot load as a load error, not as an empty ballot. On a failed GET /sessions/{id}/themes, keep the state null (still loading) and retry with backoff and jitter (for example 1.5 s up to 30 s), or show a visible retry state. Never render ThemeRankingDnD with zero themes in a real session. Add a case to tests/ballot-themes.test.mjs (or a source gate) asserting that a rejected fetch never produces [] in the ballot.
  - File: `frontend/lib/ballot-themes.ts`:91
  - Evidence: `.catch(() => { if (live) setThemes([]); });` — session-view.tsx:1228 then renders the ballot whenever `liveBallot !== null`, so [] reaches `<ThemeRankingDnD themes={ballotThemes}>`. The effect only re-runs when sessionId, level or category changes, so nothing refetches. Submit then posts `ranked_theme_ids: []` and the backend refuses it with `Expected {len(valid_ids)} themes at level {level_num}.` (ranking_submission.py:132). The participant sees that sentence as a toast on every retry, and only reloading the page recovers.
  - Why it blocks: This defect was added this round and is not in the backlog. At the 1M target, a transient 429 or 5xx on GET /themes is certain at the moment of the polling→ranking flip, because every participant fetches at once. Each affected voter is stuck behind an error message that cannot be acted on and is never retried, so their votes silently fail to reach the aggregate. That falls under scope item 3 (1M voting on 9 themes).
- **Required:** Record the ranking-transition thundering herd on GET /sessions/{id}/themes in the backlog, with a correct Needs. Every participant's ballot load becomes one uncached query through get_session_themes_enriched at the same instant. The fix to record: the theme set is immutable once theming finishes, so serve it with Cache-Control / an edge cache keyed on session id plus theming run (or an in-process memo), and have the client send ?level=&category= so the payload is just the ballot. Alternatively, implement that cache now.
  - File: `backend/app/cubes/cube6_ai/router.py`:92
  - Evidence: `@router.get("/themes")` → `enriched = await service.get_session_themes_enriched(db, session_id)` on every request. pipeline.py:416 has no cache, and the endpoint has no rate limit or Cache-Control. The new client hook (ballot-themes.ts:85) calls `/sessions/${sessionId}/themes` without level/category filters as soon as status becomes ranking or closed (session-view.tsx:392-396). The backlog file has no entry for theme reads (grep for themes/cache/herd finds nothing). HP-02 covers status polling only.
  - Why it blocks: This new 1M read path entered the system this round and is unlisted. The rule for this review is that an unlisted scale defect blocks while a listed one does not. Recording it honestly, with Needs CODE or INFRA, is enough to earn approval.

Minor notes:
- ballotThemeRows filters `(r.label || "").trim() !== ""` but the backend filters `Theme.label != ""`. A whitespace-only Theme02 label (unlikely from Cube 6) would be dropped on the client and still required by the server, giving a 422 mismatch. Align either side to exact-empty, or trim server-side too.
- useSessionBallotThemes fetches once when status enters ranking. If a moderator re-runs theming during ranking (a new cycle), an already-open ballot keeps the old ids until reload. That is acceptable today; note it for living-vote cycles.
- The backend submit_user_ranking parameter default is still theme2_voting_level="theme2_3" (ranking_submission.py:44), while the model and schema default to theme2_9. The router always passes the session value, so this is harmless, but the stale default could mislead a future caller such as sim_seed or the SDK.
- HP-09 (Path C single blob) will also reach the store's per-value size limit at roughly 7k max-length entries per session, not only lose concurrent writes. Worth one sentence in HP-09 so the sharding fix covers size as well as the race.

### Enlil (implementation & build verification) — APPROVED

I checked the build at 859b97b in /tmp/claude-0/wtm, read-only, and approve it. The build is green and every round-2 fold is implemented as described.

Build and test results:
- Backend: `ENVIRONMENT=test python3 -m pytest` gives 3425 passed, 66 skipped, 0 failed. `tests/cube7/test_sql_tally_parity.py` passes on its own (9/9). `scripts/sim_1m.py --help` runs and states the local-only and no-provider refusals.
- Frontend: `build:parity` (lint gate plus typecheck gate) exits 0. `npx tsc --noEmit` reports 0 `error TS` with or without the CLAUDE.md filter.
- Scope gates, all passing: worker-api-routes 39, cube-sim-live 837, ballot-themes 15, sim-console 35, sim-console-driver 20, sim-live-source 55, mock-rankings 40, theme-tiers 8, theme-ranked 12, ranking-shape 8, status-advance 7, cube10-unlock 10, realtime-ranking 8, embed-webc 23, lexicon-coverage 129.
- GitHub checks on 859b97b: gate, backend, verify and Workers Builds pass. ship is skipped. e2e (the Financial cloud e2e you excluded) and Supabase Preview fail. I did not look into Supabase Preview, which needs Supabase cloud.

What I verified in the code:
- **Krishna fold.** `frontend/lib/ballot-themes.ts` `ballotThemeRows` follows `cube7/ranking_submission.py` lines 70–111. It keeps non-empty Theme02 rows at the session's voting level, whose parent is a Theme01 row, filtered through the same risk/support/neutral mapping when a category is set. `ThemeRead` carries `theme_level`, `parent_theme_id` and `theme01_category`, so the client has what it needs. `session-view.tsx` uses it only when not in simulation, with a loading state while themes arrive. The Trinity Paths A–C send code is untouched. The Admin Console driver now uses the same function instead of its own filter.
- **Thor fold.** `functions/api/responses.js` lines 110–116 checks the per-address budget first. It then refuses a session with no write-key hash (404) and a session not in polling status (409). The keyless lobby-count rise is capped with `Math.min(incomingCount, existingCount + KEYLESS_COUNT_STEP)`. Worker route errors go through `routeFailed()`, which returns a generic 502 and logs the detail.
- **Minor folds.**
  - `pg_advisory_xact_lock` is applied only on Postgres (`_is_postgres`; `text` is imported).
  - The Python tally keeps ballot and participant lists aligned when it skips unreadable ballots.
  - Cube 5 time start/stop resolve the participant from `verify_participant_token` first, then the user's participant record.
  - `PHASE_A_WAIT_S` is 85.0.
- **Backlog.** HP-30 (forging inside a live polling session) is listed with Needs APPROVAL + Worker secret, so it is honestly recorded.

Nothing I checked blocks scopes 1–3. The remaining issues are minor and listed in the notes.


Minor notes:
- In LIVE (real-backend) sessions, Path C is now a request that always fails. `session-view.tsx` line 786 still POSTs every response to `/api/responses`. Only mock mode creates the keyed `/api/sessions` record (`syncSessionToKV` in `lib/mock-data.ts` is the only writer), so these POSTs now get a 404. Nothing displays them in LIVE: the dashboard's KV poll reads only session metadata, so nothing is lost. A real session now has two working send paths (A, B), not three. Record this next to HP-30 so the Trinity table in CLAUDE.md stays true.
- A failed theme load in a real session leaves an empty ballot. `useSessionBallotThemes` (`lib/ballot-themes.ts` around lines 80–92) fetches GET /themes once per session, level and category, and turns any failure into `[]` with no retry. `ThemeRankingDnD` then shows no themes. Submitting sends an empty ballot; the backend's 422 detail appears as a toast. That is not silent, but the participant can only recover by reloading. A retry or an empty-state message would close this.
- The client trims labels and the backend does not. `ballotThemeRows` checks `(r.label || '').trim() !== ''`; the backend checks `Theme.label != ''`. A Theme02 label made only of spaces would be valid on the server but left off the client ballot, and the submission would then fail with 'missing'. Cube 6 writes `''` for empty slots, so this is theoretical. Using one rule on both sides would remove it.
- The client also accepts a parent's own `theme01_category` when its label does not match (`parentCategory` falls back to `row.theme01_category`). The backend matches on the label only. This does no harm today, because GET /themes leaves that field empty on parent rows, but the two rules are not identical.
- The advisory-lock branch in `_write_aggregation` runs only on Postgres, and the parity suite runs on SQLite. The new SQL is not exercised by any test in this repo; it relies on `sim_compare.py` or a Postgres CI job.
- In mock mode, a default session such as DEMO2026 that another browser already keyed gets a 403 from `syncSessionToKV` on the moderator's own transitions. The 403 is now logged to the console. Its Path C writes then get 409 or 404. Paths A and B still deliver, so this is backup-path behaviour only.
- There is housekeeping debt left: the react-hooks exhaustive-deps lint warning in `lib/lexicon-context.tsx` line 346, a class-scoped fixture written as an instance method in `tests/cube6/test_scale_pipeline.py` (a pytest deprecation warning), and the failing Supabase Preview check on HEAD, which I did not investigate.

### Krishna (integration & cross-module) — NOT_APPROVED

My round-2 blocker is fixed. A real LIVE participant ballot now ranks the session's own Cube 6 Theme02 UUIDs, using the same rule as the backend's valid_ids: voting level, non-empty labels, theme01_category parent scope. It is shared by session-view.tsx and the Admin Console driver and gated by tests/ballot-themes.test.mjs. I checked each step from the end of Cube 6 through GET /themes, the client filter and POST /rankings with X-Participant-Token to submit_user_ranking. Frontend gates and the backend cube6/7 suites (447 passed) are green. One new cross-module problem, introduced in this round and not in the backlog: the Path C write guard (functions/api/responses.js:115) needs a keyed /api/sessions record, and only mock mode writes one. As a result Trinity Path C and Channel C fail silently for every backend-created LIVE session, so SIM and LIVE no longer behave alike on this path. Either record it as an HP row with the correct Needs or bridge the KV record from the LIVE create/transition flow, and I would approve. Everything else under my lens is minor.

- **Required:** Close or record the cross-module gap the round-2 Path C write guard opened in LIVE (real-backend) mode. The guard accepts a POST only when /api/sessions holds a keyed record in 'polling' status. Only mock-data's syncSessionToKV writes that record, and it runs only in mock mode, so for every backend-created session Trinity Path C (and moderator Channel C) now gets a 404 every time, with no error shown. Either have the LIVE create/transition flow write the keyed /api/sessions record (create plus each status change), or add an HP row to the backlog stating that Path C/Channel C do not work for LIVE-backend sessions until that bridge exists, with the correct Needs. HP-30 only covers forgery inside a keyed session; it does not record this.
  - File: `frontend/functions/api/responses.js`:115
  - Evidence: responses.js:115-116 `if (!meta || !meta.write_key_hash) return json({ error: "No live session with that code" }, 404); if (meta.status !== "polling") ...`. The header comment assumes 'a moderator created or transitioned it'. grep shows syncSessionToKV is called only in lib/mock-data.ts (lines 1251 create, 1334 join, 1585 update), reached via handleMockRequest when MOCK_MODE (api.ts:10, NEXT_PUBLIC_MOCK_MODE !== 'false'). No /api/sessions write exists in app/dashboard/page.tsx, components/, or the non-mock path of lib/api.ts. session-view.tsx:786-796 still POSTs Path C for every session and swallows the failure with `.catch(() => {})`.
  - Why it blocks: Scope item 2 requires Cubes 1-10 to behave alike in SIM and LIVE. CLAUDE.md marks Trinity Redundancy as locked (3 send paths, 4 receive channels). Since 859b97b one send path and one receive channel are dead in LIVE mode, the failure is silent, and the backlog does not list it, which under scope rule 4 makes it an unlisted defect. Responses still arrive over A/B/D, so this is not an outage; recording it honestly (or adding the small KV bridge) earns approval.

Minor notes:
- Previous item (1) is DONE and verified. lib/ballot-themes.ts ballotThemeRows applies the same rule as cube7 ranking_submission.py: non-empty Theme02 at the voting level, parent scoped by _category_key when theme01_category is set. It reads GET /themes enriched rows, whose cluster_metadata['level'] comes from phase_b._store_results and gives theme_level null for parents. session-view.tsx:392-399 uses it outside simulation and keeps SIM_THEMES for simulation only. ThemeRankingDnD posts those UUIDs to POST /rankings, and api.ts attaches X-Participant-Token. The router passes session.theme2_voting_level/theme01_category; the model default is theme2_9, matching the frontend default. The Admin Console driver uses the same helper, and its session is created with theme2_9 + risk (sim-console-driver.ts:84-85). Gates pass: ballot-themes 15/15, sim-console-driver 20/20, cube-sim-live 837/837, mock-rankings 40/40, worker-api-routes 39/39; backend cube6+cube7 447 passed.
- Small difference: the client drops labels that are only whitespace (`label.trim() !== ""`), while the backend excludes only exact `""`. A whitespace-only Theme02 label from a provider would give the client one fewer id than valid_ids and a 400 response. Unlikely, but aligning one side would remove the risk.
- session-view onComplete ('See results') calls POST /sessions/{id}/close for a real session. A plain participant gets a 403 that is swallowed and the session is closed locally. A user holding the moderator or admin role who votes from the participant page would close the session for everyone. Consider dropping the close call from the participant path.
- useSessionBallotThemes loads once per (session, level, category). If the moderator re-runs theming during ranking, the ballot keeps stale ids until reload, and the backend answers 400 with a clear message. If no themes exist, the participant sees an empty ballot rather than a reason. Both are minor.

### Enki (diversity & edge cases) — NOT_APPROVED

Enki round 3 on 859b97b. Checked: ballot-themes.ts against the backend's submit_user_ranking valid_ids rule (category mapping, the level suffix and empty padding slots excluded all match), the Path C write guard in functions/api/responses.js, the keyless count cap in sessions.js, the SQL and Python tally parity on edge ballots (unreadable, empty and duplicate-element ballots are counted the same way on both paths; Borda width is the longest ballot on both), the advisory lock and the influence cap with N<7 voters. Tests run: backend 3421 passed and 66 skipped with tests/live_db deselected (that suite errored at setup, most likely because no local Postgres is available here, so it was not exercised); cube7 245/245; frontend ballot-themes 15/15, cube-sim-live 837/837, sim-console-driver 20/20, mock-rankings 40/40, worker-api-routes 39/39. Scope 1–3 is operational with one exception: a real-session participant whose GET /themes fails is left with an empty ballot that can still be submitted and only fails, with no retry. This is new in this round and not in the backlog. Fixing it, with a gate, earns my approval. Everything else I found is minor (see the minor notes).

- **Required:** In a real session, when the participant's ballot fetch fails, show an error with a retry (with backoff) instead of an empty ballot that can still be submitted. When GET /sessions/{id}/themes rejects, useSessionBallotThemes sets the ballot to [] for good and never fetches again. session-view then renders ThemeRankingDnD for any non-null ballot, so the participant sees '0 responses into 0 themes', Submit unlocks after the 2 s default-accept timer, and the POST comes back 400 with the raw backend text ('No themes found at level 9 ...' / 'Theme ID mismatch: missing={UUID(...)}'). Two fixes: (a) keep the 'loading' state, or a separate 'failed' state with a Retry button, for a rejected fetch, and retry a few times with jittered backoff; (b) when the ballot is empty, say that ranking is not available yet, and never show a Submit that can only fail. Add both cases to tests/ballot-themes.test.mjs (rejected fetch leads to a retry or failed state, not []; an empty ballot shows no Submit).
  - File: `frontend/lib/ballot-themes.ts`:95
  - Evidence: ballot-themes.ts: `.catch(() => { if (live) setThemes([]); });` and the effect only re-runs on [sessionId, level, category]. session-view.tsx:1228: `{session?.status === "ranking" && (simulationMode || liveBallot !== null) && (<ThemeRankingDnD ... themes={ballotThemes}` where ballotThemes = `liveBallot ?? []`. theme-ranking-dnd.tsx:186-190: Submit is enabled after a 2000 ms timer, whatever the number of themes. The backlog (docs/backlog/2026.10.06_21.36..04_high_priority_backlog_1M_polling.md) has no row on ballot loading or retry; HP-03 covers only ballots kept per tab.
  - Why it blocks: Scope 3 is 1M live voting. When ranking opens, every participant sends GET /themes at the same moment, so some requests will fail (429, 5xx, a mobile network drop). Each of those participants is then left with a ballot that cannot be cast and a cryptic error, and nothing tells them that reloading fixes it. This defect is new in 859b97b (the round-2 Krishna fold), verified in the code, and not in the backlog.

Minor notes:
- functions/api/responses.js runs (body.short_code || "").toUpperCase() and (body.text || "").trim() without checking the type. A JSON body of null, or a numeric short_code or text, throws, and worker.js turns that into a generic 502 'service unavailable' where a 400 is the right answer. sessions.js already guards with `if (!body || typeof body !== "object")`; reuse that guard and add typeof checks.
- ranking_aggregation.py:417 takes pg_advisory_xact_lock only after tally_rankings has run. Two overlapping aggregations stop colliding on the unique constraint, but whichever commits last wins even if its ballot snapshot is older. Taking the lock before the tally would make the last writer's result also the freshest.
- session-view.tsx onComplete (real session) posts /sessions/{id}/close as the participant. Cube 1 close requires moderator or admin, so it always gets 403 and falls back to a local 'closed'. It is harmless, but it sends a wasted, refused privileged call from every participant; just advance locally.
- ballot-themes.ts drops a Theme02 whose label is whitespace only ((r.label||'').trim() !== ''), while the backend drops only label == ''. Today they agree, because Cube 6 emits either '' or a real label. If a padding slot ever comes through as ' ', the client ballot is one short and the submit gets a 422. Match the backend rule exactly, or trim on the backend too.
- Fixed public demo codes (DEMO2026, STATIC01, PAST0001) are never created through createSession, so the first browser that POSTs settings for one of them to /api/sessions claims its write key, and a keyed write every 24 h keeps it. The claimant then controls the title, question and status other devices hydrate from KV, and can close Path C for that code. Consider reserving demo codes in sessions.js, or adding this to the HP-11 row.
- The mock-mode KV payload (syncSessionToKV) does not carry theme01_category, so a cross-device participant on the MOCK_MODE site builds a ballot with no category scope. Its ballots stay on that device anyway (HP-03), so this is recorded in practice; worth one line in HP-03.

### Thoth (data & analytics deep dive) — APPROVED

I re-checked the round-3 changes that touch the data path, at 859b97b, and found nothing that blocks approval.

(1) The two tallies follow one rule for unreadable ballots. The Python path in ranking_aggregation.py:346-352 drops a ballot that is not a list, and the participant id goes only when its ballot is kept, so the two lists stay aligned for the quadratic weights. The SQL path drops the same rows with `WHERE jsonb_typeof(ids) = 'array'` in the temp-table build; a dict with a null or missing key gives a null there and is dropped too. Both paths use the longest ballot as the Borda width (`_ballot_width`, and `max(jsonb_array_length)` in SQL). The streamed SQL replay hash matches Python's `sorted(rankings)`. Theme ids use only [0-9a-f-], which all sort above ',', and the C collation is byte order. A ballot that is a prefix of another sorts first under both orders.

(2) The advisory lock (`pg_advisory_xact_lock(hashtext('agg:{sid}:{cycle}'))`, :416-417) is taken before the delete-then-insert. Two concurrent aggregations of one session and cycle now write one after the other, and the second writer's result stands.

(3) lib/ballot-themes.ts reproduces the backend's valid_ids rule from ranking_submission.py:65-111: non-empty Theme02 rows at the session's level, under Theme01 parents of the session's category. It reads the level from theme2_voting_level, which router.py:128-130 also passes to the backend, and the backend default is theme2_9. The Admin Console driver creates its session with theme2_voting_level 'theme2_9' and theme01_category 'risk' (sim-console-driver.ts:84-85) and ballots with `ballotThemeRows(rows, "9", "risk")`, so its ballot is the full valid set.

Runs at 859b97b:
- backend tests/cube7 and tests/cube6: 447 passed, 10 skipped.
- test_sql_tally_parity.py: 9 passed against a real local Postgres, not skipped.
- frontend: test:ballot-themes 15/15, test:mock-rankings 40/40, test:cube-sim-live 837/837, test:ranking-shape 8/8, test:sim-live-source 55/55.

The 1M harness (sim_1m.py) seeds 3 Theme01 parents with 9 Theme02 each and votes on 9. sim_compare exits 1 when the result hash differs from the baseline. The backlog records the per-stage measurements (summaries, then Theme01, then Theme02 at 9/6/3, then ranking) as HP-26, so that gap is honest.


Minor notes:
- No parity test covers the rule that drops unreadable ballots. test_sql_tally_parity.py seeds no non-list ballot, and no dict ballot with a null or missing ranked_theme_ids. Add one case so the Python and SQL paths cannot drift apart again on this rule.
- ballot-themes.ts parentCategory uses `categoryKey(row.label) ?? row.theme01_category`, but the backend's _category_key reads only the label. If a parent's label names no category while its enriched theme01_category is set, the client can include children that the backend refuses. This should be rare with the canonical labels, but matching the backend exactly (label only) removes the case.
- The Python path joins ballot ids with `",".join(r)`, which assumes string elements. A stored ballot that is a list of non-strings would raise there, while SQL casts with jsonb_array_elements_text. Submission validation makes this unreachable today.

### Athena (strategic test planning) — APPROVED

I approve scope 1–3 at 859b97b. The test plan still covers the three layers I asked for in round 1, and both round-2 folds now have gates that run in test:ci.

**Frontend, run locally:**
- ballot-themes: 15/0
- worker-api-routes: 39/0. Covers the Path C guard: unknown code 404, draft/ranking 409, flood 429.
- cube-sim-live: 837/0
- sim-console-driver: 20/0
- sim-console: 35/0

package.json confirms test:ci includes test:ballot-themes, test:worker-api-routes, test:cube-sim-live and test:sim-console-driver.

**Backend, against local Postgres, ENVIRONMENT=test:** tests/live_db + tests/cube7 (with the SQL-tally parity test) + tests/cube5 + test_api_contract_gates.py gave 417 passed, 0 skipped. tests/live_db alone passed twice in a row (4/4).

**One failure I traced to the test harness, not the app.** My first combined run failed test_openapi_sweep with 6 responses of 500. The same test passed alone and in two full re-runs. tests/live_db/conftest.py `_fresh_database()` runs `drop database if exists "{DB_NAME}" with (force)` on a fixed name (live_db_test). Several reviewers running the suite at once on one Postgres therefore delete each other's database. CI runs a single job, so it is not exposed. This is a harness-isolation note, not an app defect.

**Cube 5 time tracking:** X-Participant-Token is covered in tests/cube5/test_router_endpoints.py:151-153.

**Backlog check:** the open items under my lens are listed with honest Needs:
- HP-13 load test against hosted infra: INFRA
- HP-26 per-stage performance meter and run hash: CODE
- HP-30 Path C forgery inside a live session: APPROVAL + Worker secret

HP-08 is correctly marked FIXED. No unlisted defect blocks scope 1–3.


Minor notes:
- tests/live_db/conftest.py `_fresh_database` drops and recreates a fixed database name `with (force)`. Two runs at once on one Postgres break each other: I saw a spurious failure of 6 responses of 500 in test_openapi_sweep that did not reproduce on 3 re-runs. A per-run name (for example live_db_test_<pid>) would make the proof safe to run in parallel.
- tests/ballot-themes.test.mjs tests the TS copy of the valid_ids rule against hand-made rows, plus regex checks on the source. No shared fixture or live check feeds lib/ballot-themes.ts output into cube7 submit_user_ranking. If the backend rule drifts (for example the theme01_category scoping), the TS gate will not notice. A small JSON fixture both suites read would close this.
- The Postgres advisory lock in ranking_aggregation.py:417 (`pg_advisory_xact_lock(hashtext(:k))`) has no test. Nothing runs two concurrent aggregate_rankings for one session and cycle against live_db to show they serialize instead of failing on the unique constraint.
- HP-26 (per-stage meter and run hash) remains the main gap in the test plan for the 1M claim: sim_1m.py still times only aggregation. It is honestly marked CODE in the backlog.

### Christo (consensus & user-flow) — NOT_APPROVED

The round-2 Krishna fold holds up. Real-session ballots now carry the session's own Cube 6 Theme02 UUIDs, using the same rule as the backend's submit_user_ranking (level, non-empty label, theme01_category parent scope). The Admin Console driver uses the same helper, and every related frontend gate passes. What stops my sign-off is the end of the participant's journey, which no gate exercises. In a real session, the participant's 'See results' calls the moderator-only POST /sessions/{id}/close (session-view.tsx:1240). If the moderator is signed in on that device, this closes the round for every voter. For anyone else it returns 403, and their own view quietly shows 'closed' while the session is still running. The results card that follows (session-view.tsx:1271) numbers the server's theme row order as ranks #1..#N under 'Results summary'. It never shows the aggregate the voters produced or the participant's own order. Neither defect is in the high-priority backlog. Fixing both (participant-local results phase plus the GET /rankings aggregate or the personal order) would earn my approval.

- **Required:** When a participant presses 'See results' in a real session, do not call the moderator-only close transition. Only move the participant's own view to the results phase. Closing the session must stay a moderator action on the dashboard.
  - File: `frontend/components/session-view.tsx`:1240
  - Evidence: In the ThemeRankingDnD onComplete for a non-simulation session: `const updated = await api.post<Session>(`/sessions/${sessionId}/close`); setSession(updated);` with comment 'Transition session to closed via API (mock or real)'. The backend route `/{session_id}/close` is `require_role("moderator", "admin")` (cube1_session/router.py:375-382). lib/api.ts:120-126 attaches the Auth0 bearer token whenever one is available, so the request carries the moderator's token if he is signed in on that device. theme-ranking-dnd.tsx:351 wires the participant's 'See results' button straight to onComplete.
  - Why it blocks: This breaks consensus. A moderator who votes as a participant on his own signed-in phone (the operator's normal way of testing) closes the ranking round for every voter as soon as he presses 'See results', and ballots still being cast are cut off. For an ordinary participant the call returns 403 and the view quietly shows 'closed' on that device only, so the screen says the session ended when it did not. This is an unlisted defect on the scope-2 participant path and is not in the backlog.
- **Required:** In a real session, the participant's results card should show either the live aggregate (GET /sessions/{id}/rankings, the same call flower-visualization.tsx:125 already makes, run through normalizeRankings) or the participant's own submitted order. It must not number the server's theme row order as ranks 1..N.
  - File: `frontend/components/session-view.tsx`:1271
  - Evidence: The results phase maps `ballotThemes.map((theme, i) => ... t("cube10.sim.rank_number").replace("{0}", String(i + 1)))`. Outside simulation, ballotThemes is `liveBallot`, which ballot-themes.ts documents as 'in the server's row order — the backend's valid_ids is a set, so order carries no vote'. The card title is cube10.sim.results_summary.
  - Why it blocks: Under a 'Results summary' heading every participant sees '#1 … #9' for an order that no one voted for. It is neither the aggregated Borda result nor the participant's own ballot. The consensus the 1M-ballot tally computes never reaches the voter, so the poll-to-vote-to-result loop (scope 2/3) is not closed for the participant.

Minor notes:
- Empty or failed ballot load: useSessionBallotThemes turns a fetch error into [] (`.catch(() => { if (live) setThemes([]); })`) and fetches only once per status change. The ranking card then renders with 0 themes and an enabled Submit button after 2 s, and posting [] returns the backend error 'No themes found'. A 'themes not ready, retrying' state with a re-fetch would make this honest.
- ballot-themes.ts matches the backend valid_ids rule exactly: Theme02 at cluster_metadata level, a non-empty label, a parent allowlist through the same _category_key, and pipeline.get_session_themes_enriched gives parents theme_level None. Gates are green: test:ballot-themes 15/15, test:cube-sim-live 837/837, test:sim-console-driver 20/20, test:mock-rankings 40/40, test:sim-console 35/35.
- theme-ranking-dnd.tsx screen-reader announcements are hardcoded English ('Picked up theme at position …'), outside the t() lexicon. This is a minor i18n gap.
- The living re-vote (replace_last) and the submit-failure path that never advances silently (C7-5) are sound consensus behaviour.
- HP-03 (deployed MOCK_MODE ballots are per tab) is honestly recorded as DECISION + INFRA, and I did not count it against this verdict.

### Aset (consistency validation) — APPROVED

I approve 859b97b. I checked the round-2 folds for agreement between the client and the backend, and between SIM and LIVE. They agree.

(1) The ballot rule matches the backend. frontend/lib/ballot-themes.ts:ballotThemeRows uses the same rule as cube7 ranking_submission.py:65-103. A row counts when it is a Theme02 row (parent_theme_id set), sits at cluster_metadata level == the session's theme2_voting_level digit, has a non-empty label, and, when theme01_category is set, its parent's label maps through _category_key. The client's categoryKey does the same substring mapping as pipeline.py:400-413. The fields it reads (theme_level, parent_theme_id, theme01_category) are the ones get_session_themes_enriched emits (pipeline.py:444-458). The client defaults to level "9", which matches models/session.py:117 (default "theme2_9") and session-view.tsx:377.

(2) Both callers build the ballot the same way. session-view.tsx:392-399 uses SIM_THEMES only in simulationMode. The Admin Console driver (sim-console-driver.ts:178) calls ballotThemeRows(rows, "9", "risk"), which matches the session it creates (lines 84-85: theme2_voting_level theme2_9, theme01_category risk). LIVE sim ballots go through sim_seed.py:203-205, which passes the same level and category as router.py:127-129.

(3) The SIM and LIVE ranking maths still agree. mock-data.ts:909 sets the Borda width to the longest ballot, which is the backend's _ballot_width / _sql_tally rule (ranking_aggregation.py:212-213, 259-260). The advisory lock behind HP-08 FIXED is in the code (ranking_aggregation.py:417). The console's finish label is at sim-console-driver.ts:216.

(4) The Path C write guard (functions/api/responses.js:113-116) leaves LIVE mode as it was. In LIVE mode the moderator never read /api/responses; only mock-data's GET reads it (mock-data.ts:1429). The keyed record comes from syncSessionToKV on mock create, transition and join. The remaining forgery risk is recorded honestly as HP-30 (APPROVAL + Worker secret).

Gates I ran:
- frontend: ballot-themes 15/15, cube-sim-live 837/837, mock-rankings 40/40, sim-console 35/35, sim-console-driver 20/20, worker-api-routes 39/39, sim-parity 3/3, theme-ranked 12/12, ranking-shape 8/8
- backend (ENVIRONMENT=test): tests/cube7 + tests/cube10, 754 passed, 16 skipped


Minor notes:
- backend/app/cubes/cube7_ranking/router.py:127 and cube10_simulation/sim_seed.py:203 fall back to getattr(session, 'theme2_voting_level', 'theme2_3'), while the model, the schema, the service and the client all default to theme2_9. The fallback never runs, because the column always exists, but it is a stale default and should read theme2_9. ranking_submission.py:44 has the same stale default.
- frontend/lib/types.ts Session has no theme01_category, although SessionRead (backend/app/schemas/session.py:130) returns it. session-view.tsx:395 reaches it through an inline cast. Adding the optional field would let the ballot's category be type-checked.
- ballot-themes.ts filters (label).trim() !== '', while the backend filters Theme.label != '' with no trim. The client is stricter, so it never sends an id the backend refuses. A whitespace-only label would still be votable via the API but hidden in the UI.
- sim-console-driver.ts:179 falls back to Theme01 parent ids when fewer than 2 Theme02 rows exist. A LIVE session with theme01_category='risk' would refuse those ballots. The refusal is surfaced as a 'cast ballots' error, not hidden, so this is honest. A clearer message there would help.

### Asar (synthesis & outcome) — APPROVED

At 859b97b, scope items 1 to 3 work end to end, and every residual I found is either minor or recorded honestly in the backlog. I ran the checks myself. The backend suite gave 3425 passed, 66 skipped and 0 failed under ENVIRONMENT=test, including tests/cube7 at 245/245. Through npm (the ts-alias loader), the frontend gates passed: ballot-themes 15/15, cube-sim-live 837/837, sim-console-driver 20/20, sim-console 35/35, mock-rankings 40/40, worker-api-routes 39/39 and sim-parity 3/3. The two round-2 blockers are closed in the code. (Krishna) frontend/lib/ballot-themes.ts uses the same rule as cube7 ranking_submission.py:65-127: non-empty Theme02 rows at the session's voting level, limited to the theme01_category parents (via the same risk/support/neutral _category_key mapping). session-view.tsx:392-399 uses it only outside simulation, and only once the session is in ranking or closed. Simulation keeps SIM_THEMES, so a real human ballot no longer sends the 't1'..'t9' placeholders that the backend refused with 422. (Thor) frontend/functions/api/responses.js:111-116 returns 429 over the per-address budget, 404 when no keyed session exists, and 409 when the session is not polling. The remaining risk of forged rows inside a live polling session is HP-30, with its fix and 'APPROVAL + Worker secret' stated. The minor notes I checked are in place. ranking_aggregation.py:417 takes pg_advisory_xact_lock per session and cycle. sim_1m.py and sim_compare.py exist, and HP-08 is marked FIXED with its reason. Two minor issues remain. First, the client drops labels that are only whitespace (label.trim()), but the backend's check is only Theme.label != "". A whitespace-only Theme02 label is unlikely, since Cube 6 pads empty slots with "", but if one appeared the client would leave out a row the backend expects and the vote would get a 422. Second, until GET /themes answers, the participant sees an empty ranking list (liveBallot ?? []), with no loading or error state.


Minor notes:
- ballot-themes.ts ballotThemeRows filters (r.label || '').trim() !== '', but ranking_submission.py only checks Theme.label != ''. Make the two rules match (strip on the server, or skip the trim on the client) so a whitespace-only label cannot break a ballot with a 422.
- session-view.tsx:397-399: outside simulation, ballotThemes falls back to [] while GET /themes loads or if it fails. Show a loading or 'themes not ready' state so the participant does not see an empty ranking list.
- Running node --test directly on ballot-themes.test.mjs fails with ERR_MODULE_NOT_FOUND because it needs the ts-alias loader. Give its header the same 'run via npm run test:ballot-themes' note that cube-sim-live now carries.

### Pangu (cutting-edge) — APPROVED

I checked 859b97b and it holds up. The round-2 blocker, real-session ballots sending the placeholder ids t1..t9, is fixed. frontend/lib/ballot-themes.ts copies the backend's valid_ids rule into a pure helper: a non-empty Theme02 at the voting level whose parent is a Theme01 (theme_level == null), filtered to the session's category. session-view.tsx:391-399 calls useSessionBallotThemes only outside simulation and only in ranking or closed status. It shows a loading line while liveBallot is null (line 1225), and the change touches only the ranking JSX, not Paths A–C. The Admin Console driver imports the same ballotThemeRows, so the UI and the console build the ballot the same way. Concurrent aggregation now serializes on pg_advisory_xact_lock(hashtext('agg:session:cycle')) (ranking_aggregation.py:417). The Path C write guard refuses a POST to anything but a keyed record in polling status (functions/api/responses.js:116), with a budget of 600 per address per minute (line 24). The leftover forging risk is HP-30 (Needs APPROVAL + Worker secret), and quadratic Borda at 1M is in the backlog as CODE. Both are honest entries. Tests I ran: ballot-themes 15/15, cube-sim-live 837/837, sim-console-driver 20/20, worker-api-routes 39/39 and mock-rankings 40/40, all through the npm scripts (raw `node --test` fails without the ts-alias loader). Backend tests/cube7 plus tests/core pass 354/354 under ENVIRONMENT=test. Scope 1–3 is operational under my lens, and what remains is minor.


Minor notes:
- ballot-themes.ts useSessionBallotThemes sets an empty list on fetch failure or when no themes are found. session-view.tsx:1227 then renders ThemeRankingDnD with zero themes and an enabled 'Confirm order' (theme-ranking-dnd.tsx:190 canSubmit does not check themes.length). An empty ballot is refused server-side with a 400, so nothing is corrupted, but the participant sees an empty card instead of a 'themes not ready, retry' message. Guard on ballotThemes.length === 0 and show a retry.
- The ballot loads once per (sessionId, level, category). If a participant enters ranking before the Cube 6 Theme02 rows are written, nothing refetches them. Add a refetch or a short poll while the result is empty.
- categoryKey uses substring matching ('risk', 'support', 'neutral'), the same as the backend's _category_key. Both sides should eventually read a stored theme01_category enum instead of parsing label text, so that a translated or renamed Theme01 label cannot move a ballot to the wrong category.
- Next for 1M: a stake-weighted SQL tally, so that quadratic_borda gets the same Postgres path and memory profile as equal-weight Borda (already recorded in the backlog as CODE).

### Sofia (multi-perspective): participant, moderator, operator/HI, integrator/SDK consumer and auditor views across SIM and LIVE — APPROVED

I approve round 3. I checked the 859b97b changes from five points of view, and each held up in the code.

Participant (LIVE). frontend/lib/ballot-themes.ts follows the backend's valid_ids rule in cube7 ranking_submission.py lines 101-111: Theme02 rows only (a non-null parent), at the level taken from theme2_voting_level, with a non-empty label, and limited to the parents of theme01_category when one is set. session-view.tsx (lines 391-399) calls useSessionBallotThemes only outside simulation, and only when the status is ranking or closed. SIM_THEMES now appears only in simulation. GET /sessions/{id}/themes uses get_optional_current_user, so an anonymous participant can read it. Parent rows carry theme_level=None (pipeline.get_session_themes_enriched), which matches the client's parent test. SessionRead returns theme01_category and theme2_voting_level, so the hook gets the inputs it needs.

Moderator and auditor. The Admin Console driver imports the same ballotThemeRows, so the page and the console build ballots by one rule. The Python tally now skips an unreadable ballot and its participant together, which keeps the quadratic weights in line, and it matches the SQL tally's jsonb_typeof filter. Two concurrent aggregations of one session and cycle now queue on a pg_advisory_xact_lock instead of colliding at commit.

Integrator. Worker routes return one generic 502 and log the details. Cube 5 time start/stop accept X-Participant-Token (verify_participant_token), with a fallback to the JWT participant.

Operator. /api/responses accepts a POST only for a keyed /api/sessions record in polling status, under a per-address budget of 600 per minute (enough for the 100-response Spiral Test from one address). The remaining forging risk inside a live session is recorded honestly as HP-30, Needs APPROVAL + Worker secret.

What I ran:
- npm run test:ballot-themes: 15 passed, 0 failed.
- test:worker-api-routes: 39 passed, 0 failed.
- test:cube-sim-live: 837 passed, 0 failed.
- Backend pytest tests/cube7, tests/cube5 and tests/core (ENVIRONMENT=test): 481 passed.

None of the minor notes below blocks scope 1-3. Running ballot-themes.test.mjs with bare `node --test` fails because it needs the ts-alias loader; through npm it passes.


Minor notes:
- Participant with an empty LIVE ballot: if GET /themes fails or returns no valid rows, useSessionBallotThemes sets [] (catch → setThemes([])), and session-view.tsx line 1228 then renders ThemeRankingDnD with zero themes and a Submit button but no explanation. The submit would get the backend's 'no valid themes' 400 as a toast. One sentence such as 'Themes are not ready yet — try again shortly' plus a retry would serve the participant better.
- Label edge case: the client filters on `(r.label || '').trim() !== ''`, while the backend filters on `Theme.label != ''` exactly. A label made only of whitespace would be valid on the server but missing from the client's ballot, so the ballot would get a 400 for a missing id. The Cube 6 padding writes '' exactly, so this cannot happen today. Using the exact comparison in ballot-themes.ts would keep the client rule identical to the server's.
- Live MOCK_MODE site: a phone participant's ballot is built from that phone's local mockResponses only (mock GET /themes builds themes on demand from local rows), so it can differ from the moderator's themes. This is part of HP-03 (voting is per tab under MOCK_MODE). HP-03 should say outright that the ballot's themes are per device too, so the operator is not surprised when he tests on his phone.
- Path C for the seeded demo sessions (e.g. DEMO2026, which starts in polling): no keyed /api/sessions record exists until a moderator browser creates or changes it. Until then /api/responses now returns 404 for that code, and Path C is off for the demo while Paths A and B (Supabase) still carry responses. This is worth one line beside HP-30 so it is not mistaken for a Trinity regression.
- Participant onComplete in session-view.tsx (lines 1238-1243, pre-existing) POSTs /sessions/{id}/close from the participant's browser. LIVE answers 403 (require_role moderator), which is caught. In mock mode the close changes only the local copy, because the KV sync needs the write key. The result is harmless, but a participant should not call a moderator transition. Advancing locally would be cleaner.
