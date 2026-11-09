# CRS Traceability Delta — Original Polling Design Rounds + Scale / Voice / Transparency

> **Date added:** 2026-11-09 (America/Chicago)  
> **Scope:** Docs-only. Captures CRS rows added from the operator's original pre-AI polling sketches (Round 1–3 + Pay to View) plus steered scale, moderator-transparency, and dual-role live voice items.  
> **Status rule:** **Planned** or **In progress** only — never **Implemented** in this delta.  
> **Canonical numbering:** `Requirements.txt`. Cube specs: `docs/CUBES_1-3.md`, `docs/CUBES_4-6.md`, `docs/CUBES_7-9.md`.  
> **Does not modify** `docs/CRS_TRACEABILITY_2026-07-03.md` (pre-existing delta remains as-is).  
> **Does not touch** `docs/traceability/*.ledger.json` (pre-existing release-ancestor failures on main are unchanged by this PR).

## Ownership

| CRS | Cube | Title | Status |
|-----|------|-------|--------|
| CRS-09.08 | Cube 6 (theming) / Cube 7 (prioritization) | 1M live theming+prioritization; Theme02 <3s; metrics shown | Planned |
| CRS-15.09 | Cube 3 | Live voice-to-text for Moderator **and** Participants | Planned |
| CRS-22.04 | Cube 7 | Moderator final decision transparency (show group #1 + reason) | Planned |
| CRS-36 | Cube 7 | Round 1 variable auto-select (e.g. 40% · 4/10) | Planned |
| CRS-36.01–.03 | Cube 7 | Auto-select config / ballot subset / replay hash | Planned |
| CRS-37 | Cube 7 | Round 2 top-3 · 3/2/1 (`top3_points`) | **In progress** |
| CRS-37.01–.04 | Cube 7 | Subset ballot / per-category / aggregate / impl track | **In progress** |
| CRS-38 | Cube 7 | Round 3 Expert Opinion (3 experts → AI 1-pager) | Planned |
| CRS-38.01–.03 | Cube 7 | Expert UI / AI 1-pager / audit | Planned |
| CRS-39 | Cube 9 | Pay to View details 1 / 2 / 3 | Planned |
| CRS-39.01–.03 | Cube 9 | Tier map / unify gates / no live charges in test | Planned |

## Numbering note

Polling Requirements.txt continues CRS-01…35 with **CRS-36…39** for original-design rounds. Vision Innovation Project ids in `frontend/lib/innovation-data.ts` (CRS-36→93) are a **separate product surface** and are not these rows. Design matrix after CRS-35 historically jumped to CRS-94.* for Vision R-CORE; this delta inserts polling CRS-36…39 before that Vision block in `frontend/lib/crs-matrix-data.ts`.

## Sources (no secrets)

- Operator sketches under `/workspace/original-polling-design/` (Round 1 auto-select; Round 2 top-3 3/2/1 Support/Concerns/Neutral; Round 3 Expert Opinion; Pay to View 1/2/3).
- Workflow map `/workspace/fleet/exel-ai-quality/map.md` (main vs original design gaps).
- Sandbox `.txt` / zip may contain a historical API key — **never copy or repeat it** in repo docs.

## Existing coverage (why sub-items, not duplicates)

| Need | Existing CRS | Action |
|------|--------------|--------|
| Live STT capability | CRS-15.03 (paid realtime); Cube 3 also defines CRS-15.04–.08 for CB/semaphore/WS | **Add CRS-15.09** for explicit Moderator+Participant input-path coverage |
| Lead override + justification | CRS-22 / .01 / .02 | **Add CRS-22.04** so participants still see group #1 + reason when #1 is not adopted |
| 1M / theming budgets | Requirements burst 1M; Cube 6 `scale_pipeline.py` 60s budget | **Add CRS-09.08** for Theme02 **<3s** + **metrics shown** (stronger/clearer than 60s full pipeline) |
| Full-set Borda ranking | CRS-11 / CRS-12 | **Add CRS-36/37** for original Round 1–2 ballot shape (`top3_points`) without changing Borda claims |
| Export / paid depth | CRS-14.* content tiers | **Add CRS-39** for original Pay to View Detail 1/2/3 unification |

## Cube last-updated stamps touched

| Cube | Doc | Stamp |
|------|-----|-------|
| 3 | `docs/CUBES_1-3.md` | CRS-15.09 added 2026-11-09 |
| 6 | `docs/CUBES_4-6.md` | CRS-09.08 planned 2026-11-09 |
| 7 | `docs/CUBES_7-9.md` | original-design rounds added 2026-11-09 |
| 9 | `docs/CUBES_7-9.md` | Pay-to-View CRS-39 added 2026-11-09 |
