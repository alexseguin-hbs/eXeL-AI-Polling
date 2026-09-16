# OPERATOR ASK — 2026-09-16 (overnight) · the FOIL game, the N ladder, and the winners' circle

> **PERSIST FIRST.** Written before any analysis, per CLAUDE.md. Verbatim, including its typing. The
> interpretation lives below the fold and in the CRS, where it can be argued with.

## The ask, verbatim

> 1.111x0.777
> remember this is for drone-2525
> ensure camera and aircraft views are bow adopted to FOIL design (xbat), which we will not say in
> Drone-2525 so as not to upset Shield AI.
> Long term goal is many play game and 11.1 percent play our game to advance to winners circle and
> tournament where one team is able to play another team on actual physical laster tag drone game .
> Have 12 AsM do simulation of 1v1 then 2v2 then 3v3 (2 HI v 2HI, 4hi v 4HI, an 6HI v 4 Hi) tot work out
> complexities in spiral tests st each addition of 2 more drones (+one oer side).  keep going till N=21
> drones.  Come ip with lasers yag rules and shields and laser time on target for bringing down drone safey
> to ground with special lighting effects; take inspiration from Independence day and Enders game, and Laser
> tag Battle House arena in Barrington outside Chicago.
> remember you have version and revision of these additions so Drone-2525 has same tractability and
> comparison features as Vision-2525
> Remember 1.11 m x.777 is for lofty goal of demos at Capital of texas in Austin texas first in video game,
> sim, and eventually Drone-2525 and Mission Planning in Security-2525 will meege
> incorporate all feedback in 8 hrs overnight
> all aircrafts will have mini version with ability to size up and scale perfectly larger size 11.111 by
> 7.777
> ensure https://exel-ai-polling.explore-096.workers.dev/drone-2525/
>
> is active
> ensure draft of game is here
>
> https://exel-ai-polling.explore-096.workers.dev/drone-2525/
> remember stationary, then targets , then flying drones then flying drone as 2 HI pair.
>
> game should expand so in person challenge attracts talent of 11.1% to play winners circle where one gets
> to play on actual physical systems
> andSPIRAL TEST as you work 1v1, taking lessons into 2v2 systems (4HI = 2HI v 2 HI).  go to 21 v21 (42 v 42
> HI).

## THE NAMING RULE — the first thing, because it constrains everything else

> *"ensure camera and aircraft views are bow adopted to FOIL design (xbat), which we will not say in
> Drone-2525 so as not to upset Shield AI."*

**Drone-2525 calls the aircraft the FOIL. It does not use the other name.** Not in a label, not in a
lexicon value, not in a CRS row, not in a component, not in a shipped document, not in the exports.

One quarantined exception, declared rather than hidden: `airframe.geometry.source` and `.sourceNote` in
`docs/drone-2525/drone-2525.v00.00.json` cite the Security-2525 **file path** the geometry is derived from.
A derivation that cannot name its source cannot be verified, and the 2026-09-16 axis correction is recorded
in that same note. The gate `frontend/tests/drone-naming.test.mjs` permits the name in those two fields and
nowhere else. **Flagged for the operator:** if he wants even the path gone, the wire source can be carried
into a neutral Drone-2525 location — at the cost of a second copy that can drift from Security-2525's.

## A CORRECTION TO THE RECORD — the seat count was half

`docs/asks/2026-09-16_foil_1m_five_levels_world.md` recorded, from *"remember 42 HI pilots 21 aircrafts in
simulation"*:

> 21 friendly aircraft × 2 seats = 42 human crew, flying against 21 machine-crewed opponents. **42 people in
> the world, 42 aircraft in the air.**

This ask settles it: *"go to 21 v21 (42 v 42 HI)"*. The 42 HI is **one side**. The full contest is:

> **42 aircraft (21 v 21) and 84 human seats (42 v 42).** Each aircraft carries a pilot and a targeteer;
> both sides are crewed by people, not one side by machines.

The earlier reading was half the humans. It is corrected here rather than quietly changed, because the
record is what makes a wrong assumption findable.

## The ladder being asked for

*"1v1 then 2v2 then 3v3 (2 HI v 2HI, 4hi v 4HI, an 6HI v 4 Hi) … at each addition of 2 more drones (+one
per side) … keep going till N=21 drones."*

| step | aircraft | seats | read as |
|---|---|---|---|
| 1v1 | 2 | 4 | 2 HI v 2 HI |
| 2v2 | 4 | 8 | 4 HI v 4 HI |
| 3v3 | 6 | 12 | 6 HI v 6 HI |
| … | +2 per step | +4 per step | one more aircraft per side |
| **21v21** | **42** | **84** | **42 HI v 42 HI** |

The operator's third row reads "6HI v 4 Hi". Taken as a typo for 6 v 6, since the pattern he states is
"+one per side" and every other row is symmetric. **Recorded as an assumption**; asymmetric contests (a
side down an aircraft) fall out of the same ladder for free and are worth having, so the model supports
them rather than forbidding them.

## Build order, restated

*"stationary, then targets, then flying drones then flying drone as 2 HI pair."* — already the shipped
order (DRN-01…DRN-09); this ask confirms it rather than changing it.

## The long game

*"many play game and 11.1 percent play our game to advance to winners circle and tournament where one team
is able to play another team on actual physical laster tag drone game."* The 11.1 % is not a new number: it
is the R-CORE recursion gate, 1/9, from `docs/MODE_R-CORE_SPEC.md`. The progression is
**open play → the top 11.1 % → the winners' circle → a physical laser-tag match between two teams.**

## Named inspirations, and what is taken from each

- **Independence Day** — the shield that must be brought down before the shot lands, and the beam that is
  visibly *held* on a target rather than fired and forgotten.
- **Ender's Game** — the ladder itself: the same game at rising N, where what breaks is never the physics
  but the coordination; and freeze-not-destroy, which is why a hit brings an aircraft down rather than
  deleting it.
- **Battle House laser tag, Barrington, Illinois** — an actual arena people walk into: scored, timed,
  team-against-team, with a lobby and a result. The physical end of the progression.

## Scale

*"all aircrafts will have mini version with ability to size up and scale perfectly larger size 11.111 by
7.777"*, and *"1.11 m x .777 is for lofty goal of demos at Capital of texas in Austin texas first in video
game, sim, and eventually Drone-2525 and Mission Planning in Security-2525 will meege"*.

Both scales are already generated from one model (`docs/drone-2525/exports/foil-1.111.*` and
`foil-11.111.*`, `sha256` in their `.hash.json`). What this ask adds is that the scale is **selectable at
run time** and that everything derived from it — planform, stall speed, glyph unit, the screen-size bands —
follows the selection instead of being retyped.

## The time budget

*"incorporate all feedback in 8 hrs overnight."* Taken as: work continuously and autonomously, ship in
gated increments, and report what was and was not reached. Nothing here is reported as done that a gate has
not proven.
