# OPERATOR ASK — 2026-09-16 · the 1 m foil, five levels, and a world

> **PERSIST FIRST.** This file exists because of the rule in CLAUDE.md: anything the operator hands over
> that he cannot easily reproduce is written to a file **before any analysis, planning, or request for
> approval**, and the proof is a hash he can check rather than an assurance he has to trust. The ask below
> is transcribed verbatim, including its typing. Nothing here is corrected, tidied or interpreted — the
> interpretation lives in the plan and in the CRS, where it can be argued with.

## The ask, verbatim

> this game will have ability to have rasp pi, apple mac book pro, PHONE user, or PC operate IS WE USE
> R-Core and 5 level design lowest simplest lowest rendered lowest memory requirement visual first.  we
> will bring users from-all over world for simulating drone swarms first.  make fix wing aircraft 1 m foil
> and proportional using early drawings already in security 2525 settings

Delivered with it: four artefacts and two dimensioned sheets, carried into
`docs/drone-2525/foil-package/` and hashed below.

## The decisions the operator took on it, verbatim

Asked four questions before planning. His answers, exactly as given:

| Question | Answer |
|---|---|
| How big is the 1 m foil? | **"1.111 m × 0.7777 m"** — the package's demo scale |
| Does the world shrink with it? | **"Keep the Capitol, foil is just small"** |
| Which ladder is the "5 level design"? | **"edge sensor inputs all have low fidelity level 1.1 to 1.5 to 5.1 to 5.5 to sinpley we start with 5 levels and figure out decimal variances over time"** |
| How many people share one world? | **"remember 42 HI pilots 21 aircrafts in simulation"** |

And two further decisions taken once the exploration had found what it found:

| Question | Answer |
|---|---|
| The physics record (5 kg / 0.9 m²) and the drawing (38.6 m) are different aircraft | **Derive the wing from the drawing** — one source of truth |
| The drone's own cross-device endpoint is dead in production | **Join the polling session room** |

### How "42" is being read

The operator said on 2026-09-15 *"optimize to 42 total (21 aircraft vs 21 aircraft)"* and on 2026-09-16
*"remember 42 HI pilots 21 aircrafts"*. Both hold at once under one reading, and only one:

> **21 friendly aircraft × 2 seats (pilot + targeteer) = 42 human crew**, flying against 21
> machine-crewed opponents. **42 people in the world, 42 aircraft in the air.**

This reading is recorded here so that if it is wrong, the record shows what was assumed and when, rather
than the assumption disappearing into the code.

## The package, as received

`docs/drone-2525/foil-package/` — carried byte-for-byte, never edited. `sha256`:

```
b4e9acde5cae15f043847451e6260732da9792d52f1e8a188d55a135115aee7e  FOIL_DualScaleGameWireframeActor.h
c9f48e2a3cd659dfb82c6eebb916661559515ca5327fc9b9e8f03c26ec2b0b49  FOIL_dualscale_game_package.py
fd691db69aa5651886aebbb219ccea73d5c7a1981d7fd48c57f46a7e359a402f  FOIL_full_11_111x7_777_front.png
b45d8c964500255016a19ee51a834463fcdcafc436c5a361fc2d1e2541a171e7  FOIL_full_11_111x7_777_manifest.json
69259c97c39f76783f24890eaf086db1c790a225eed1852426e9a6b4f9b70568  FOIL_full_11_111x7_777_sheet.png
```

Verify with `cd docs/drone-2525/foil-package && sha256sum -c ../../asks/2026-09-16_foil_1m_five_levels_world.sha256`.

### What the manifest declares

`FOIL_full_11_111x7_777_manifest.json`, quoted rather than paraphrased:

- `"use_case": "video game / laser-tag robotics previsualization"`
- orientation `x_axis: "span"`, `y_axis: "depth"`, `z_axis: "nose_to_rear_vertical_axis"`
- `dimensions_m`: `wingspan 11.111`, `nose_to_rear 7.777`, and
  `"depth_scale_note": "depth scaled with geometric mean of span and length scales"`
- `simulation_notes.recommended_initial_method: "frame-first wire simulation"`
- `lowest_compute`: *"render as line segments / LineRenderer / debug lines"*, *"use low-compute frame OBJ
  for first-pass capability"*, *"use simple collision proxy (box + capsule + wing slabs)"*, *"separate
  visuals from gameplay hitboxes"*

The `x_axis: "span"` / `z_axis: "nose_to_rear"` orientation in the operator's own manifest agrees with the
original drawing's header (`docs/security-2525/xbat-wireframe/xbat_3rdpass_wireframe.obj:2` —
`# X span, Y depth, Z vertical nose-up axis`) and **disagrees with what this repo has been computing**. See
the defect note below; the operator's manifest is on the side of the drawing.

### The demo scale is exactly proportional

`1.111 / 11.111 = 0.0999910` and `0.7777 / 7.777 = 0.1000000`. The demo nose-to-rear the operator chose is
**0.07 mm** away from being an exact 1:10 of the full scale on a 1.111 m span. It is proportional.

## The defect this ask uncovered — recorded here because the ask is what exposed it

The instruction *"using early drawings already in security 2525 settings"* sent the work to
`frontend/components/security-2525/asset-icons.tsx:37-42`, whose header reads *"Projected from
docs/security-2525/xbat-wireframe/xbat_3rdpass_wireframe.py (X span → svg-x, Z vertical → svg-y)"*. That is
the correct convention, and it is **not** the one `scripts/build-airframe-glyph.mjs:39` uses. The carried
model declares `frame: { up: "z", forward: "x" }` (`xbat.wire.json:12-16`); forward is z. So the shipped
`AIRFRAME_EXTENT = { lengthM: 38.579, spanM: 8.628, heightM: 26.2 }` is three correct measurements under
three wrong names. The true reading is **span 38.579 m · depth 8.628 m · nose-to-tail 26.200 m**.

The operator was told this before the plan was approved, along with two other findings his ask exposed: at
rung 1.1 the app drops eleven of the forty-two aircraft (a claim this assistant had earlier made the
opposite of, wrongly), and the drone's cross-device link has never worked in the deployed build.
