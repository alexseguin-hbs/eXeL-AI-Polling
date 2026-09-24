# Claude Code — build / update S1–S19
# PRJ-34 De-Risking Strategies — Crisis + Resilience
# 23 September 2026

You are updating the eXeL AI Polling / Gate Review S1–S19 deck for PRJ-34.  
This file is the implementation spec. Follow it. Do not invent strategy.

---

## 0. Mission

Produce two decks from frozen text:

1. `PRJ-34_DRS_Crisis_Resilience_INTERNAL_G2.pptx` — full gate deck  
2. `PRJ-34_DRS_Crisis_Resilience_EXTERNAL.pptx` — partner/customer twin

Source of slide words:  
`canonical/DRS_Crisis_Resilience_S1-S19_Slide_Manuscript_v0.5.md`

Source of long-form backup / speaker notes:  
`canonical/DRS_Crisis_Resilience_Full_Text_Writeup_v0.4.md`

Layout reference only:  
`eXeL AI Polling.pdf` (PRJ-31 template). Copy structure, colors, footer discipline if a .pptx template exists. **Do not copy PRJ-31 numbers, product name, or NBA.**

If no .pptx template is in the workspace, build 19-slide widescreen 16:9 decks from v0.5. Keep typography and footer consistent. Do not design a new strategy.

---

## 1. Locked facts — do not “improve”

| Item | Value |
|---|---|
| Project | PRJ-34 De-Risking Strategies — Crisis + Resilience |
| Stage | G2 Plan |
| Ask | Approve G2. Release $280k of $620k MVP 1. First paid DP 2027-Q3 |
| CrisisCommand | Proposed complementary integration. Not a partnership. Not an assumed API |
| R-CORE | Architecture. SKU = Replay + Readiness — powered by R-CORE |
| NBA pairs | Utility/Industrial ↔ GridOS · Healthcare ↔ Veoci Vitals EM · Campus ↔ YUDU Sentinel |
| NPV | $0.16M at 12%, 2026 = t0 |
| IRR | ~20% |
| SAM | $268M universe / $67M near-term. Not $220M |
| CTS IA $/yr | Campus 16 · Health 39 · Utility comm. 53 · Industrial 59 |
| Change rule | Do not rewrite waterfalls, prices, or claims from model opinion |

Two labels, always separate on INTERNAL:

- Modeled Value → Evidence-Based Capture Range  
- Design-Partner WTP Hypothesis → To Be Tested  

G2 master question (S1 and S19, verbatim):

> Can DRS prove that verified authority + resource fulfillment + provenance + replay creates enough incremental value beside the customer’s existing NBA to support a paid attach product?

Footer on every slide (verbatim):

> Human-authored strategy · AI-assisted synthesis by eXeL AI · cross-review informed by Grok · final authority: De-Risking Strategies · v0.5 · IA for feedback

Also show: `PRJ-34 · G2 Plan · Confidential` on INTERNAL. Drop “Confidential” logic only if HI says so. EXTERNAL footer same provenance, no internal capture-percent callouts.

---

## 2. Banned strings — fail the build if present

Grep the finished decks for these. If found, fix before delivery.

Partnership / over-claim  
- partnered CrisisCommand  
- CrisisCommand partnership  
- CrisisCommand API (as if it exists)  
- we ingest their strategy object today  

Certification (unverified)  
- SOC 2 Type II report expected  
- HEALTH refuses PHI  
- HIPAA system of record  
- FedRAMP authorized (as a DRS or CC fact)

Product clones  
- SAIDI reduction (as a DRS result)  
- SAIFI / CMI avoided by DRS  
- Storm Manager replacement  
- HICS 201  
- Joint Commission packet  
- mass notification composer  
- SITREP composer as a DRS object  
- we notify in under 60 seconds  

Retired numbers  
- IRR 14%  
- NPV $0.2M  
- SAM $220M  
- event burst 18%  
- G6 Maximize  
- first revenue 2026-Q2  

PRJ-31 bleed  
- Sovereign Deep-Strike  
- Datalink  
- $16.2M  
- 45% IRR  
- 0.5-year payback  

Wrong brands  
- DRS logo on the R-CORE slide (S11 uses R-CORE logo)  
- Ad-Fusion  

If a number is used, it must already appear in v0.5. New dollars are forbidden.

---

## 3. INTERNAL vs EXTERNAL

Build INTERNAL first, then clone to EXTERNAL and apply every `[EXT:]` substitution in v0.5.

EXTERNAL must remove or replace:

| Slide | Remove from EXTERNAL |
|---|---|
| S3 | Contribution-at-12% commentary |
| S8–S10 | “53% / 110% / 92% of modeled value” lines |
| S13 | Full tension table |
| S17 | Cash path, NPV, IRR, SAM method |

EXTERNAL substitute line (v0.5):  
“Pricing is under design-partner validation. Value from measured fulfillment, provenance, and replay beside the NBA.”

Keep on EXTERNAL: thesis, fences, CONOPS, recipient chain, NBA wedges, horizons, MVP scope, master question, operational metrics.

---

## 4. Slide-by-slide build map

Use v0.5 section headings as the words. This map only adds layout and notes.

### S1 Executive summary
Layout: title + one-sentence + three columns (segments / defend / ask) + master question bar at bottom.  
Must include: proposed integration line, six differentiators, do-not-claim strip, $280k of $620k, 2027-Q3, master question.  
Notes: pipeline table from v0.5.

### S2 Overview
Layout: missing-layer list (left) · chips (right) · thesis sentence.  
Chips exactly: G2 Plan · $620k / $280k · NRE $1.46M · NPV $0.16M · IRR ~20% · payback ~36 mo · Y3 GM 80–82%.  
Cash series in notes: −260 / −765 / +120 / +1,410.

### S3 Segmentation
Layout: X/Y/Z + WTP/CTS table.  
Must show CTS formula and the four CTS totals.  
Must show the two labels (Modeled Value vs DP WTP).  
Must state: at 12% of modeled value, contribution is negative in every row.  
Industrial = subcase, not fourth segment.  
Campus X/Y/Z marked unvalidated.

### S4 CONOPS
Layout: Before / During / After swim. Revision card in center: What changed? Why? Who authorized? What do I do now?  
Degraded-mode callout: cache last authorized plan + bridge to SMS/Sentinel. Do not rebuild Sentinel.

### S5 Problem
Layout: problem statement · outcomes · four-line status-quo map (GridOS / Veoci / Sentinel / CrisisCommand) · none close the recipient chain.

### S6 Product
Diagram slide. Four layers stacked.  
Center spine, large:  
Requester → validation/entitlement → quantity → assignment → fulfillment → timestamp  
Do not draw a SITREP composer, HICS form, or notify composer as a DRS object.

### S7 Personas + stories
Three persona bands + principle “AI recommends. Humans command.”  
Stories 1.0, 1.1, 1.2, 1.4, 1.5, 1.6, 2.0, 2.1, 3.0 from v0.5. Do not drop 1.4–1.6.

### S8 Utility / industrial vs GridOS
Split: NBA does | DRS adds | do not claim.  
Positioning line verbatim: GridOS operates the grid. DRS coordinates the crisis around it.  
Box: five Plant GM numbers.  
Value block uses two labels, not a single “price.”  
ORNL figures in notes only, never as DRS savings.

### S9 Healthcare vs Veoci
NBA does | narrowed wedge (four bullets) | do not claim.  
Positioning line verbatim from v0.5.  
Value block: modeled $49k · 12% = $6k · DP hyp. $54k · list aspiration $90k.  
INTERNAL only: ~110% of modeled value.

### S10 Campus vs Sentinel
NBA does | DRS adds | do not claim.  
Positioning line verbatim.  
Winter-freeze six questions on-slide.  
Sentinel price: G-Cloud £5,000/licence/year, context only.  
Value block: modeled $24k · 12% = $3k · DP $22k · aspiration $36k.  
INTERNAL only: ~92% of modeled value.

### S11 R-CORE
R-CORE logo, not DRS logo.  
Horizons verbatim:  
Baseline 2027 — coordination, allocation, provenance, recipient trace, degraded-mode cache  
2030 — cross-system replay, simulation, qualification, multi-event memory  
2525 — recursive continuity across institutions and generations  
Loop + “Every crisis becomes evidence…”  
2525 is vision, not this year’s product.

### S12 Competition
Three clusters + DRS position (high Y, high Z, rising X).  
Everbridge et al. in notes only.

### S13 Value equation
INTERNAL: formula + the full seven-column tension table from v0.5.  
EXTERNAL: formula + [EXT:] sentence, no table.

### S14 WTP + commercial model
Four SKUs from v0.5. No 18% burst. Surge pack priced before the event.  
Outcome targets as printed.

### S15 Three resource plans
3-column table Conservative / Baseline / Aggressive. Include “who may receive.”  
Caption: switch = new plan version. Provenance is the product.

### S16 Validation matrix
Column headers from v0.5. Starter rows with empty Result.  
Caption: real ≠ hypothesized until one DP · one segment · one pre-registered metric.

### S17 Financials
INTERNAL only full path.  
FY26 0 / −260 · FY27 95 / −765 · FY28 940 / +120 · FY29 2,390 / +1,410 ($k).  
NPV $0.16M · IRR ~20% · flag: path more aggressive than waterfalls justify.  
Market: 6,700 × $40k = $268M · ×25% = $67M SAM · Y3 SOM $1.85M.  
EXTERNAL: omit this slide’s cash and SAM method; keep one sentence that pricing is under validation. If that leaves the slide thin, collapse S17 EXTERNAL to a commercial-model recap of S14 only.

### S18 MVP / roadmap
Three horizons mapped to MVP 1 / 2 / 3.  
MVP 1 in-scope includes cache + notify-channel bridge.  
Dates from v0.5.  
$620k envelope · $280k now.

### S19 Risks + decision
Risk table from v0.5 (top scores).  
Six-point ask.  
Gate-exit bullets.  
Master question bar, same words as S1.

---

## 5. Speaker notes rule

Notes come from v0.4, shortened. Notes may include analogue prices and ORNL context. Notes may not introduce new dollars or new claims.  
Every numeric note starts with “IA.”

---

## 6. Visual rules

- 16:9. One idea per slide. v0.5 is already slide-density; do not add paragraphs from v0.4 onto the canvas.  
- Label every number “IA.”  
- S6 recipient chain and S11 horizons are diagram-first.  
- Do not render images inside markdown-style tables as pictures of tables if a native table works.  
- De-Risking Strategies identity on section opens. R-CORE logo only on S11.  
- Do not use stock-photo “crisis” montage as an argument.

---

## 7. Build order

1. Read v0.5 end to end.  
2. Read this spec.  
3. Build INTERNAL 19 slides.  
4. Grep banned strings.  
5. Clone EXTERNAL. Apply [EXT:] and the removal table.  
6. Grep EXTERNAL for 110%, 92%, 53% capture, “contribution-negative,” NPV, IRR, SAM $67M. Those belong on INTERNAL only (SAM method may stay INTERNAL S17).  
7. Add provenance footer.  
8. Pack both pptx into PRJ-34 root.  
9. Stop. Do not revise waterfalls.

---

## 8. Acceptance test

INTERNAL pass when:

- 19 slides, S1–S19 titles match v0.5  
- Master question on S1 and S19, verbatim  
- CrisisCommand = proposed complementary integration  
- S6 shows the recipient chain  
- S11 shows 2027 / 2030 / 2525 verbatim and R-CORE logo  
- S13 shows both economic labels and the tension table  
- NPV $0.16M, IRR ~20%, SAM $67M near-term  
- CTS four totals present  
- No banned strings  
- Footer present on all slides  

EXTERNAL pass when:

- Same operational story  
- No tension table, no 110/92/53% capture callouts, no cash-path chips  
- Pricing sentence is the [EXT:] line  
- Still no banned strings  

Fail if PRJ-31 product or financials appear anywhere.

---

## 9. If something is missing

If a logo, template .pptx, Polling.pdf, Resilience 2023 PDF, or VISION · 2525 is not in the workspace, build with a text placeholder (“R-CORE logo TK”) and list the gap. Do not scrape a new strategy to fill the hole. Do not download competitor marketing into the deck as if it were ours.

---

## 10. What you are not being asked

- Do not change DP prices or list aspirations.  
- Do not add a fourth segment.  
- Do not promote 2525 to a 2027 SKU.  
- Do not write a new executive narrative.  
- Do not reconcile modeled value to DP price by inflating formulas.

Build the slides. Leave the gate decision to HI.
