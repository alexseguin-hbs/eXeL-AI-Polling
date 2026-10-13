# Claude Code notes — Drone-2525 operator deck r.206 (2026-10-13)

**Ask (operator 2026-10-12 ~21:15 CST, verbatim as typed):** "I need 12 AsM Fleet to test; youbknow mybcriteria but fail toninplment; test and somulate until no phantomntargets and ensure all targets and siloeets have the proper color boxing with button when bulleseye osnover target"

The fleet he ordered — 145 agents, twelve Masters, every finding refuted three ways — is `docs/assessments/2026-10-13_drone2525_fleet12_phantom_and_colour.md`, committed alone before this code. It was ordered onto the r.204 bytes; **r.204 and then r.205 shipped while it worked**, and under the no-rework law it re-played every confirmed finding on the bytes on his phone rather than re-reporting what was closed. Four defects closed by r.205 are recorded there so they are not rebuilt. **Five were still open. Those five are r.206.**

## Found first — verified on the shipped r.205 bytes before a line was written

`scratchpad/r206/probe1.mjs` and `probe2.mjs`, 390×844, on the served r.205:

| | measured on r.205 | measured on r.206 |
|---|---|---|
| **D1** after `releaseAuthority`: two released plates | `mist:true, phase:null, slot:null`, **0 boxes drawn**, painted **`#E24B3B`** — while the never-marked neighbour paints `#E8D5B0`. Never heals. | `mist:false`, painted `#E8D5B0` |
| **D2** aim points with the bullseye strictly inside exactly one silhouette | 10 tested, **2 gave the box to another plate** (bullseye inside C-300, the box to C-200R) | 10 tested, **0** |
| **D3** a red mark standing, then the MAP | FIRE **stays lit** on a view with no bullseye, through the whole session and after its own refusal | nothing lit on the map; FIRE relights on return |
| **D4** 40 offsets walked off one mark, amber and red | they answer differently at **11** (at 8.4 px clear: amber lights APPROVE, red lights nothing) | **0** |
| **D5** the recital on an UNMARKED plate | `rgb(240, 160, 32)` — the amber of a mark | `rgb(201, 162, 39)` — the gold its own TARGET FIRST already uses |

## The fix — the class, not the instance (11 asserted edits)

1. **A target with no box is the plain silhouette.** `releaseAuthority` released the mark and left the mist flag standing, and r.205's painter reads that flag *where there is no phase* — so the orphan was red by construction. The door now clears the flag on every plate it releases, and on the Capitol pops and drones that carry it too. Eleven call sites share this door (re-mark, room start, scene change, reset, target down/gone, a peer's reset, a lane change). `rangeReset` was already clean, **which is why r.205's own `SILHOUETTE_COLOUR_IS_THE_PHASE` is green over this** — its release leg calls `rangeRelease`, the one door that already cleared it.
2. **The box goes to the silhouette the bullseye is ON.** The admission margin was 8 px and the tie-break was world metres, so a nearer plate beside the pip took the box, the round and the kill. Two passes now: strictly inside first, the 8 px reach only as a fallback, and within each pass the nearest to the **outline** wins, metres breaking an exact tie alone. The reach stays so a 300 m plate is still takeable. The deck's own r.147 line already declared it: *LOCK is the target nearest the bullseye on the picture, never the nearest in metres.*
3. **No bullseye, nothing lit.** `phys()`'s map early return painted the score and the strip and never reached `paintCues`, the buttons' only writer. It reaches it now. `paintCues` is HUD-only — the three buttons, RELOAD's call, RESTART's word, the light, the timer, the pose card — so none of his rasters move.
4. **One meaning of "under the bullseye" for amber and red.** `stepFor` carried the on-target test on the red branch only. **Amber is narrowed to red's rule; red is deliberately NOT widened** — widening it would light a button the deck then refuses, undo what r.204 earned, and fail the green transit leg. The strip's amber branch says AIM ON IT in the same band.
5. **Amber means marked, and only marked.** The recital's unmarked line takes `#C9A227`, the gold its own "TARGET FIRST" already used; the LAST line takes the ivory.

## Gates — each red on the r.205 bytes first, each failing with NOT EXERCISED rather than passing by omission

Red-first run: the four rows inserted into the r.205 bytes and nothing else changed (`scratchpad/r206/redfirst/rows`, served at :4745).

```
boot QA 231/236 on r.205 + the four rows      →      boot QA 235/236 on r.206 (only SYNC_DIRECT, offline)

RED  NO_COLOUR_WITHOUT_A_MARK               two marked (one approved), then releaseAuthority: targets still wearing a
                                            colour with no mark 2 (200 M RIGHT, 100 M CENTRE) · boxes drawn 0
RED  THE_BOX_GOES_TO_THE_PLATE_UNDER_THE_PIP  11 aim points … the box went elsewhere 2 times (the bullseye inside
                                            300 M, the box to 200 M RIGHT)
RED  BUTTONS_ARE_DARK_OFF_THE_PICTURE       on the MAP, after one real frame, lit fFire (want none)
RED  ONE_MEANING_OF_UNDER_THE_BULLSEYE      they answer differently at 11 of them · the recital on an UNMARKED plate
                                            rgb(240, 160, 32)
```

`NO_COLOUR_WITHOUT_A_MARK` calls **`releaseAuthority`**, not `rangeRelease` — that distinction is the whole point of the row. `THE_BOX_GOES_TO_THE_PLATE_UNDER_THE_PIP` counts the aim points it actually tested and fails if none qualified. `BUTTONS_ARE_DARK_OFF_THE_PICTURE` runs one real frame on the map and fails if FIRE was not lit on the picture first. `ONE_MEANING_OF_UNDER_THE_BULLSEYE` fails if the offset walk did not run, **and it reads the LAST line where that line is actually reachable** — on the map, and in a room: in solo play on the picture the r.205 "nothing under the bullseye" clause shadows it, so a leg that aimed at the sky would have measured the wrong branch and gone green over D5's second half (the round caught exactly that). `tests/drone-playable.test.mjs` pins all five invariants in the served bytes — including the recital's colour, the pin the fleet warned would move with this revision.

## Owed — said plainly

- **`approveDesig` has no on-target test, so after r.206 a DARK APPROVE still acts if pressed** — and the round that reviewed this cut measured
  the rest of it: at 9.26 px clear of the outline, with all three buttons dark and the strip reading `AMBER · T1 · 100 M CENTRE · AIM ON IT`,
  clicking APPROVE turns the slot red and books an APPROVE row — into the record, the replay hash and the room. **I built that fix and took it
  back out**: adding the on-target test to `approveDesig` turned four long-standing rows red (`RANGE_MISS_300_OFF20`, `PHASE_NEEDS_RELOAD`,
  `AUTHORITY_HAS_ONE_CONSUMER`, `A_PRESS_NEVER_TOUCHES_A_TARGET_YOU_ARE_NOT_ON`) because each approves without aiming first. They are right to
  aim, and correcting them is honest work — but it changes an action four invariants depend on, which is the fleet's own reason for making it
  its own revision. **r.207, first item**, with those four legs rewritten to aim. FIRE has refused this since r.141; APPROVE will.
- **r.207: the range officer's opening on QUAL 40** (his 18:25 and 04:34 words) and **the lamp that leads its window** instead of trailing it — measured by three independent reviewers and by me: GREEN is lit 0.00 s of the time a soldier may fire and 17.00 s of the time he may not; the deck's own comment states the right rule and the code does the opposite; both training modes already have it right. With it, **a cue for a target that is up but off the picture** (15 of 40 appearances at 428×926) and **TRAIN DOWN's clock**, which over-reads 0.42–0.50 s and truncates with `floor()`.
- **His call, not mine:** the lane signs clipped at the edge. Either an edge sign that cannot be drawn whole is not drawn, or r.159 — his own rule that a sign stays on its post's line, gated to 1 px — relaxes for the outermost signs.
- Still carried: the LIVE room's reading (CLASS 1e) and his 20:55 twenty-person drill; three times a table the glass says PRESS RELOAD on a magazine just filled; `hudKeepOut` in CSS pixels with no ResizeObserver; the lane picker reading LANE 21 on every QR-opened lane; 428×926 not among the four CI viewports; the 360-px phones red and undeclared; R-CORE in the shared format.

Artefact commit `c707fba`; the carried deck's sha256 is `fe10269f5c8691d83f417e4617ea59f6cc72f622c00239d7b460a49169219e38`.
