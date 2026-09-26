# PRJ-34 — Concept (G1) financials in the Concept column + TAM/SAM (operator 2026-09-26)

## Verbatim asks
> remember this is G1
>
> ensure financials align to a concept column
>
> also take a stab at total available market and service available market TAM and SAM

Sent with a screenshot of the Innovation-Pod "Changes · Approvals" view (Gate Review History + PRB Reviews +
Approvals). In it, every financial figure (Market CAGR 161.1 %, 1-Yr/3-Yr Incremental Revenues, NPV $1M 10-yr,
Value Prop $248M, R&D Spend $11,200k …) sits in the **Plan** column because the project's current gate reads
**G2 · Plan**; the Market **TAM, $** and **SAM, $** rows are blank, and the footnote reads
"no source yet: TAM, $ · SAM, $ · Competitive NBA Price, $".

## Reading of record
- **"this is G1"** = the project is at **Concept (G1)**, not Plan (G2). The DRS master already declares
  `project.stage "Concept (G1) · future-state validation"`; only the Pod code row lagged at `gate: "G2"`.
- **"align financials to a concept column"** = the recorded business case must render in the **Concept** column
  of the Gate Review History (the CSRA matrix places each `now` value in the current gate's column), and the PRB
  panel must read **Current Gate G1 · Concept**. Achieved by the one-field flip `gate: "G2" → "G1"` on the PRJ-34
  row (frontend/lib/innovation-data.ts); everything else derives through `visibleYearCount`/`GATE_STAGE`.
  Same numbers (nreK 11200 · fullRev10yM 248 · NPV · Competitive-NBA are gate-independent roll-ups of the full
  11-year plan); storage stays 11 years (lossless); the S10 input grid shows the correct 4-year Concept window.
- **"take a stab at TAM and SAM"** = populate the blank rows with a DECLARED (IA, never buyer-validated) estimate,
  grounded in published market reports:
  - **TAM ≈ $30B (2026)** — the Critical Event Management (CEM) platform category CrisisCommand aims to absorb:
    CEM $23.45B (2023) → $45.18B (2030) @ 9.2 % CAGR → ~$30B interpolated for 2026.
    (forinsightsconsultancy CEM platforms market)
  - **SAM ≈ $10B (2026)** — the crisis-management software segment it directly serves, a coherent ~1/3 of TAM:
    ~$9.5–9.8B (2025) → ~$10B (2026) @ ~5.9 % CAGR.
    (giiresearch/TBRC crisis-management-software market; openpr ~6 % CAGR)
  Carried on the Pod row as `tamUsdM 30000 / samUsdM 10000` ($M); recorded with sources in the DRS master
  `marketSizing`; rendered in the Concept column; dropped from the "no source yet" gap list. Other projects keep
  TAM/SAM as named gaps (the tool never invents a figure without a basis).

## Shipped as DRS revision 0.131 (decision D133), gated + pushed both refs
Pod gate G2→G1 (+ locked innovation-time.test.mjs assertion G2→G1); TAM/SAM per-project field + CSRA render +
marketSizing sources; plus the fleet-fold records hygiene batched in (iterations[].n renumbered clean 1..N;
drs-render true count + monotonic-n gate; S2 status cell → rev 0.131 · D1–D133; rendered model-identifier
references scrubbed from the deck cells, "redact at render, keep the record").

## Noted, not changed without a yes
The "Market CAGR, %" row reads **161.1 %** — the project's IA revenue-ramp CAGR, not a market growth rate. Left
as-is; can be aligned to the sourced category CAGR (~9 % CEM / ~6 % crisis-mgmt sw) on the operator's word.
Competitive NBA Price, $ stays a named gap (not requested).
