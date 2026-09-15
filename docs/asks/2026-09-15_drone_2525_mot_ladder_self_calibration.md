# Drone-2525 — the MoT ladder, self-calibration, and multi-sensor fusion

**Operator, 2026-09-15. Persisted verbatim BEFORE any analysis or planning (CLAUDE.md: persist first).**
Four reference files supplied with this ask are carried into `docs/asks/refs/` and hashed below.

---

## The ask, verbatim

> drone-2525 will have 5 levels for resolution and 5 levels for edge compute.  we will have 1.1 to 1.5 for
> settings (system calibrated to max FPS), using similar test as we have in security-2525 demo.  Ultimately
> this will be used to test new compute and sensor for self test of edge compute and edge sensor for robotics
> and complex systems with-a. self calibration goal of 6 - 15 minutes in first release.
>
> See multi sensor fusion
>
> Harvard Presentation:
> * https://docs.google.com/presentation/d/1Rzz1mI6PWXurMclaG8uz2x-J1N_iiXwgqOGg3NJBqnU/edit
> * https://d3.harvard.edu/platform-hbapideation/submission/exel-ai-empowering-the-ai-developers-of-tomorrow/
>
> conaider 83 starwars mock up as level 1.1 for everything related to R-Core and the future of self
> calibrating robotics. Technically FPS should be faster with 1.1 settings for sensor and edge compute as well
> as other R-Core settings related to robotixs remember 1.1 to 1.5 , 2.1 to 2.5, and up to 5.1 to 5.5
>
> [ref r.003] Heres an example from grok to ensure you plan effectively
> [ref r.005] See small updates
> [ref r.006] update with control scheme body / head and single vs double tap
> [ref r.011] r.011 is reconfigured slightly for rcore and vision 2525 .  update your configuration per attached
>
> we are basically R-Core manually using grok as a mirror to enhance your master plan. 😇

## The observation supplied with it, verbatim

> this was a grok observation
>
> Pulling R-CORE and the 13 Vision-2525 sections from the living doc and PDF, then wiring self-calibrating
> compute/sensor profiles to a 1080p30 stream standard.Implementing the 13-section Vision ladder, R-CORE
> layers, robot-selected compute/sensor HAL, and self-calibration to a 1080p30 reference
> stream.drone-2525_v.00.00_r.011.html — R-CORE + Vision 13 are in the loop. The robot can pick compute and
> sensors, then self-calibrate toward 1080p30.
>
> From the 13-section paper (wired, not pasted)
> R-CORE is the nervous system: observe, preserve, test, improve. COMM carries the signal. EDGE puts
> intelligence at the point of need. HI stays in authority.
>
> § | Layer | In this sim
> I | HUMANITY | HI AUTH / WATCH approve
> II | R-CORE | CIL·HIL·SIL·COM + CAL log
> III | COMM-2525 | BroadcastChannel peers
> IV | LINK-2525 | same gimbal on turret / VTOL / Manta / droid
> V | EDGE-2525 | modular sensors EO→IR→ACOUSTIC→MAG→CHEM
> VI | SYNC-2525 | REC ON samples
> VII | UCRS-2525 | Capitol lawn grid
> VIII | SIM+REPLAY | WIRE-1 + train pack
> IX | QUALIFY | SSSES
> X | COLLECTIVE | HI / AI crew
> XI | HAL | robot or operator picks compute
> XII | STEWARD | battery / range
> XIII | LEXICON | MoT 1.1–5.5
>
> Robot-selected compute + sensors (HAL)
> Top bar HAL AUTO | PI | EDGE | ACCEL.
> * AUTO — unit picks PI / EDGE / ACCEL from measured FPS
> * PI-CLASS — 66 ms frame budget, CNN 18 ms first
> * EDGE-SOC — 33 ms, CNN 12 ms
> * ACCEL — 16 ms, CNN 8 ms
> CNN reserve is subtracted before paint. Sensor is never starved to pretty-up the picture.
>
> Self-cal to the 1080p30 standard
> Reference stream: 1920×1080 @ 30 Hz.
> Cal loop (visible, never silent):
> 1. Hold 30 Hz if possible
> 2. Drop a sensor module (CHEM → MAG → ACOUSTIC → IR; EO last)
> 3. Drop resolution 1080p30 → 720p30 → 480p30
> 4. Last resort 480p15
> 5. Three seconds of headroom climbs the other way
>
> DATA shows STREAM · HAL · SENSORS · CAL. HUD stamps the live stream id. SAVE/EXPORT include hal, stream,
> mods, and the Vision-13 ladder so Unity/Unreal can apply the same LOD contract.

---

## Reference files carried into the repo (hashes the operator can check)

| file | sha256 |
|---|---|
| `docs/asks/refs/v00.00_r.003_drone-2525.html` | `8797f2352741c7b63719dbe1e34a20b4d103d20f61ff5bdb1585556afad73e86` |
| `docs/asks/refs/drone-2525_v.00.00_r.005.html` | `d14061177d8e88eaef462dd6ee1c071b0183c68c82599c461eae21de95d293da` |
| `docs/asks/refs/drone-2525_v.00.00_r.006.html` | `b8df99d62ecc7faea16c2c5438c77dcdf8b4f5c7df5fdf875dd03ba4fded8dd9` |
| `docs/asks/refs/drone-2525_v.00.00_r.011.html` | `806e45219aa1fe29e16b1ce72db8578d67117098ed01426594ce5e89db51066b` |

These are the operator's own mirror-round artefacts. They are a SPECIFICATION INPUT, not code to copy: the
repo's implementation carries the same contract under the WIREFRAME-CORE rules (one editable source, gates,
33 languages, no `Math.random`, refuse rather than clamp).

## Provenance links supplied (not fetched here; recorded so they are not lost)

- Harvard presentation: https://docs.google.com/presentation/d/1Rzz1mI6PWXurMclaG8uz2x-J1N_iiXwgqOGg3NJBqnU/edit
- Harvard D3 submission: https://d3.harvard.edu/platform-hbapideation/submission/exel-ai-empowering-the-ai-developers-of-tomorrow/
