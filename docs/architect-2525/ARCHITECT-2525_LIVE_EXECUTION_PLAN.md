# ARCHITECT-2525 · LIVE EXECUTION PLAN (shareable)

| | |
|---|---|
| Date | 2026-11-08 |
| Authority | H.I. Thought Master |
| Coordinator | MoT / Claude Code |
| Product of record | **`/Architect-2525/` (LIVE), modified in place** |
| Deprecated | `/Architect-2525/future` — **deleted entirely**, history preserved in git + R-CORE |
| Verbatim sources | `docs/architect-2525/decisions/2026.11.08_HI_live_product_bom_ruling.md` (+ `.sha256`) · `…_MoT_12asm_review_bom_handoff.md` · `…_HI_icon_pricing_and_phase_sqft_cost_model.md` |

> Operating rule: **Preserve capability. Repair truth. Prove improvement live.** Humanity decides · Technology assists ·
> R-CORE remembers · SPIRAL verifies · SSSES qualifies · Trust must be proven.

This is the shareable consolidation. The three decision records above are the verbatim, sha256-frozen sources; where this
file and a source differ, the source wins.

---

## 1 · Binding product truths (H.I.)
1. `/Architect-2525/` is the product of record, improved in place. `/Architect-2525/future` is deleted; its failure
   history (R-CORE revs 30/31/32, git, screenshots) is preserved, never rewritten.
2. **Canonical house (one physical model):** 12 ft outer module · 10 ft clear room · 1 ft reserved wall/service zone per
   side · 3×3 grid · **36×36 ft shell · 900 ft² clear · 1,296 ft² gross · 396 ft² difference.** Outer-module origins
   0/12/24 ft; clear-room origins 1/13/25 ft. One geometry source feeds plan drawing, dimensions, Overview, Design,
   Project Health, take-off, simulation, files and replay. A 30×30 shell is wrong and is removed. The 1-ft zone is the
   reserved wall/service zone, not the structural wall thickness (assemblies are separate data).
3. **Cost is bottom-up / BOM-driven** (see §3). Totals are derived and roll up; never a manually-maintained competing card.
4. **Domains stay separate:** Budget Target ≠ BOM-based Build Estimate ≠ Project Labor Cost ≠ Global Recognition ≠ Local
   Settlement. No ambiguous generic "Project Cost."
5. **Authority:** Reference claim ≠ Design target ≠ Project qualification; Submit ≠ Review ≠ Approve ≠ Build-Ready;
   approve/qualify/build-ready require an attributable authenticated human; no AI silently promotes those.
6. Preserve every useful capability: Overview · Design · Simulate · Review · Build · Lifecycle · Vision Tree · the
   139-object asset library · 2D Plan · 3D · Walk · file save/upload · Project Health · R-CORE/Replay · construction
   phases · BIM import/export · labor engine. Make them describe and manipulate ONE project.

## 2 · The 12 AsM execution refinements (MoT, de-risking — do not change product truth)
1. One geometry source + one take-off/pricing module; the BOM **replaces** the manual total in `architect-estimate.ts`.
2. The 30→36 geometry change ships a migration + WireGuard (re-seat untouched saved designs, keep arranged ones) + a
   geometry-contradiction gate; the immutable seed stays immutable; run `architect-canonical-*` before ship.
3. Every estimate record carries `design_revision` + `price_book_revision`; a replay test reproduces an old
   (design, price-book) total.
4. The legacy $240,000 ten-row model is a REFERENCE/variance baseline only; reconcile, never force-equal.
5. Phase-enum audit first → ONE canonical phase id across Vision Tree / BOM / Project Health / Replay / Plan·3D filter.
6. RECOMMENDED ≠ PLACED (recommended is a suggestion, no `ASSET_PLACED` event, distinct render); per-room default is a
   curated set, expert-placed; all 139 reachable; never auto-seed all 139.
7. BOM is pure/deterministic (replay law); the price book is a dated, versioned data file (pure input), never a live
   fetch inside canonical calc; "same inputs → same total" is gated.
8. Human cost copy passes the `architect-voice` gate (plain words); schema terms only in Advanced/CAD + data.
9. UNPRICED → null (not $0), surfaced in coverage; wall benchmarks REFERENCE/UNVERIFIED; price-refresh writes a
   provenance delta.
10. Exact estimate equation; no double-count of material/labor; gated.
11. Simple-first cost UX: one number + coverage + price-book date; depth behind "View breakdown"; lead with geometry.
12. Bind the order: R1 geometry + expert placement ship & review FIRST, then the BOM engine staged.

## 3 · Cost architecture — BOM-driven, per-phase $/ft² WITH ERROR BARS
```
unit price × quantity = BOM LINE → ASSEMBLY → SYSTEM → PHASE ($/ft² range) → WHOLE-PROJECT ESTIMATE ($/ft² range + total)
                                                    (+ labor / equipment / logistics / allowances / waste / margin)
```
- **Every building element and every phase carries a $/ft² estimate WITH ERROR BARS (low–high range)** — the USA-standard
  way to express build cost — derived from the **BOMs AND take-offs** (quantities × unit-price ranges + labor/equipment),
  **plus a separate margin line.** A geometry/design change updates quantities → updates the $/ft² range → rolls up. The
  error bar widens where evidence is weaker.
- **The 11 canonical build phases (locked order):** 1 Foundation · 2 Framing · 3 Roof · 4 Plumbing · 5 Sewer ·
  6 Electrical · 7 Air Flow · 8 Internet · 9 Security · 10 Insulation · 11 Finish.
- **Every priced line** carries: item_id · canonical item/assembly ref · description · quantity · unit · unit_price ·
  extended_price · currency · price_source · source_type · supplier/price-book id · effective_date · region ·
  evidence_state · calculation_version · **design_revision · price_book_revision**.
  Source authority: SUPPLIER_QUOTE · CONTRACT_PRICE · PRICE_BOOK · MARKET_REFERENCE · USER_ENTERED · ASSUMED · UNPRICED.
- **Construction method selects the active BOM:** FRAME → frame BOM; PRINT → printed-system BOM (frame studs NOT current);
  UNDECIDED → comparison only. Never keep stale Frame quantities under Print.
- **Drill-down both ways** (total → system → assembly → line → qty → unit price → source; and deterministic roll-up).
- **Design-rev ≠ price-book-rev**; a price refresh changes cost without changing the design, and writes a provenance delta.
- **Estimate health:** % priced · unpriced count · stale/unverifiable/missing-qty/duplicate · method conflict ·
  geometry/BOM mismatch · price-book age · estimate delta.
- **Human-facing:** "Current Build Estimate $X–$Y · from the BOM · price book <market/date> · coverage 97% · 3 not yet
  priced", then "View breakdown."

### ICON cement 3D-printed wall-system references (WALL-SYSTEM ONLY)
A dedicated wall-system comparison surface — **these are NOT whole-house costs and NOT inputs to the project total:**

| Wall-system benchmark | Value | Authority |
|---|---|---|
| Conventional industry reference | ≈ $34 / wall ft² | REFERENCE (standard industry) |
| ICON Phoenix | ≈ $25 / wall ft² | HISTORICAL REFERENCE |
| ICON Titan | **$20 / wall ft²** | TITAN TARGET / REFERENCE (single target, never a range) |

R-22 / fire / wind / termite / mold / flood are ICON **wall-system** targets/references only — they never auto-qualify the
whole house. **Never imply `$34/wall ft² × house area = $240,000`** or `Titan $20 = total project cost`.

## 4 · Execution sequence (each shipped to LIVE, then reviewed)
- **R0 — DONE (shipped):** persisted the ruling + AsM review (sha256); deleted `/future` entirely (route, lib, components,
  tests, and the greenfield docs); shipped the feng-shui `DECOR_DEFAULTS` default-item reduction. History preserved.
- **R1 — geometry 36×36-true** (first visible outcome): one geometry source → 12/10/1 · 36×36 · 900 clear · 1,296 gross;
  remove any 30-ft shell; Overview/Design/Health agree; service-zone wording; migration + WireGuard + contradiction gate;
  run `architect-canonical-*`. Recorded as R-CORE **rev-33 (carries the decision + the /future-entire-deletion capture +
  the geometry code)**. Before/after screenshots at 375/428/768/1200.
- **R2 — expert interior-design placement + room density:** real `STANDARD_LAYOUTS` for the 8 non-master rooms (perimeter,
  open centre, anchors oriented, door/windows clear); REQUIRED/PLACED/RECOMMENDED/LIBRARY distinct; curated per-room
  defaults; all 139 reachable; Vision Tree ↔ phase alignment (one canonical phase id). Screenshots of all 9 rooms.
- **R3 — BOM cost engine (staged a–e):** data model + dated price book → per-phase $/ft² ranges + margin → quantities from
  geometry/method → automatic recalculation → simple-first cost UX with drill-down + design-rev/price-rev separation →
  price-health checks; the BOM replaces the manual estimate; $240k kept as reference.

## 5 · Acceptance / regression (behavioral — the live product must pass)
A geometry one-house (36 shell · 10×10 clear · 36'-0" plan · 1,296 gross · 900 clear · no 30'-0"). B Health agrees with
Design. C economic domains distinct (no ambiguous "Project Cost"). D estimate BOM-derived, drills to lines, recalcs on
design/price change, design-rev ≠ price-book-rev, $240k shown as reference, **each phase a $/ft² range + margin**.
E ratings REFERENCE/UNVERIFIED unless project-qualified. F method controls take-off. G Vision Tree wording; raw tree under
Advanced/CAD; nodes carry phase/system metadata. H tree/phase alignment uses one element-id set. I room density: never
auto-seed 139; placed ≠ recommended; curated per room. J asset persistence: arm→place→disarm, canonical event,
move/rotate persist, save/reload, same instance in Plan/3D/Walk. K mobile at 375/428/768/1200 (not mouse-only). L Submit ≠
Approve; approval/qualification/build-ready need an authenticated human. M history recoverable, R-CORE append-only,
/future deletion preserves git/audit evidence.

## 6 · Review model (after each shipped round)
Grok attacks behavior/calculations · eXeL AI reviews truth architecture/evidence/authority/UX · DeepSeek checks
requirement integrity + regression · Thought Master judges "did Architect-2525 measurably improve without breaking what
worked" · MoT adjudicates. Execution uses the 48-AsM fleet (parallel audit + adversarial review + Playwright at the four
viewports) for redundancy that minimizes errors. Feedback goes to the repo and folds into the next revision.

## 7 · Stop conditions (escalate to MoT)
Changing the approved 12/10/1 geometry · restoring /future as a competing product · erasing history · treating the 139
catalog as default project contents · merging reference claims into qualification · ambiguous cost totals · using a fixed
total as authoritative despite a contradictory BOM.
