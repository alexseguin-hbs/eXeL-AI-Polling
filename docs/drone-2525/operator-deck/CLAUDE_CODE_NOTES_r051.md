# r.051 — qualification bridge only (eXeL AI + operator)

HEAD HTML: `drone-2525_v.00.00_r.051.html`
Do not merge Round 8–10 (42 aircraft, winners-circle, foil scale, palette fork) into this revision.

## What r.050 did not actually do (now closed)

1. `designate()` now writes `state.desig.phase='amber'` (not only the broadcast).
2. `fireN` on amber → `AMBER_NO_APPROVE`. Missing desig → `NO_RED_BOX`.
3. BroadcastChannel receive handles `DESIG` (peer amber) and `APPROVE` (peer red).
4. HUD/toast says **HI-2** vs **PEER**.
5. `metricsOf` / `decide` stamp **rev:'0.051'** (was 0.044).
6. `replayScrub` reads `verb` / `result`.
7. `feed()` is display-only. Not in the hash stream.

## Five gates for the auto run (unchanged)

1. Deck parity before expansion.
2. State truth before UI truth (`phase:'amber'` is on the object).
3. Network parity both directions + solo HI-2 labeled.
4. Evidence integrity (rev, scrubber, hash hygiene).
5. `ASM_CUP_99.*` immutable. Sidecar for new metrics.

R-CORE: r.050 RECORD → r.051 QUALIFY the contract → later IMPROVE the game.
Next HTML number: **r.052** only if this file changes again.
