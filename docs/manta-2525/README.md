# Manta-2525 — Domain Play on the Level-3 substrate

> **This output is for conceptual critique only.** It is not a design baseline, safety case, certification
> approval, procurement authority, construction authorization, operational doctrine, hurricane-safety advice,
> or human-test plan. All safety-critical domains remain 🔴 Red until validated by qualified human experts.

The eXeL MANTIS / MANTA TRINITY package (v1.7.1) as a structured critique-and-modelling project.
This folder is the first artefact of the Manta-2525 Domain Play — until 2026-09-03 it was cited in
`cube-status.tsx` and `CUBE_19_27_LEVEL_3_FRAMEWORK.md` §6 and existed nowhere on disk.

| File | What it is | Edit? |
|---|---|---|
| `MANTA_TRINITY_HANDOFF_v1.7.1.md` | The operator's handoff, **verbatim** (sha256 `5b6099ec…2671e8`). Source of truth for this folder. | never — append a new version |
| `images/*.png` | The two infographics as received. | never |
| `INFOGRAPHIC_TRANSCRIPT.md` | The images' claims as text, so they can be checked. | when the images change |
| `manta-trinity.v1.7.1.json` | The package parsed into one data model: platforms, gates, assumptions, bounds, risks, doctrine. | **yes — this is the one editable source** |
| `REVIEW_GATES.md` · `ASSUMPTIONS_REGISTER.md` · `RISK_MATRIX.md` | **Generated** from the JSON by `scripts/manta-render.mjs`. | never — regenerate |
| `CRITIQUE_v1.7.1.md` | The critique report: what the documents get right, where they contradict each other, what the equations cannot bound. | as a new version |
| `MINI_99-33_HYDROSTATICS_SCOPING.md` | What to hand a licensed naval architect for the first gate. | as a new version |

## Tools

```
node scripts/manta-render.mjs            # regenerate the three views from the JSON
node scripts/manta-render.mjs --check    # fail if a view is stale (runs in pre-commit)
node scripts/manta-bounds.mjs --reproduce   # recompute every table in the handoff from its own equations
node scripts/manta-bounds.mjs pressure --depth 33          # the four bounding calculators
node scripts/manta-language-gate.mjs     # flag language that outruns the Red gates (runs in pre-commit)
```

Every calculator prints **"Bounding estimate only; not design evidence."** on every run.

## The eXeL poll

The polling engine (`/`) collects and themes critique of this package. Polling informs critique; it does
not validate engineering, replace experts, or authorize physical development. Flow:
eXeL Poll → Theming & Prioritization → Expert Validation → Review Lanes → Formal Gates.

*Humanity decides. Technology assists. Wisdom guides. Trust must be proven.*
