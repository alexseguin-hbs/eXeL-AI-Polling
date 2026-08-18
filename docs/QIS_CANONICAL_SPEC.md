# Vision • 2525 — Qualified Innovation Score (QIS)
## Final Canonical Lock · Human + AI Specification
**Honor the Past • Measure the Present • Build the Future**

> Canonical implementation spec for QIS, vetted by eXeL AI + Grok + H.I. and locked by the operator
> (2026-08-15). The Vision 2525 living document (`docs/SOI_VISION2525_LIVING_DOCUMENT.html`) states the
> QIS doctrine and basis example in prose; this file holds the full regression vectors and the
> implementation invariants that any implementation (Claude Code · Grok · eXeL AI) must enforce.
> QIS **replaces the prior "growth-factor" framing** as the single canonical financial-innovation
> measurement. There must be no competing financial-growth measurement anywhere in the system.

## Purpose
Qualified Innovation Score (QIS) is Vision • 2525's canonical **absolute** financial measurement of
innovation performance and the measurement basis for incentives tied to qualified financial innovation
growth. QIS begins with four auditable financial facts and never replaces them:

    R | GP | OI | QRD   =   Revenue · Gross Profit · Operating Income · Qualified R&D

The same equation measures a Project, a Group of Projects, or the entire eXeL Portfolio. The measurement
boundary changes; the mathematics does not.

## 1. Four canonical financial metrics
- **R** = Revenue
- **GP** = Gross Profit
- **OI** = Operating Income
- **QRD** = Qualified R&D Spend

R, GP, OI enter QIS at their recorded absolute values. QRD passes through one transformation → Effective
R&D (ERD).

## 2. One-third R&D innovation commitment
Qualified R&D target = exactly one-third of Revenue:

    RDT_t = R_t / 3          (display: "33.333% of Revenue" — display notation only; compute with 1/3 EXACT)

Qualified R&D receives 100% recognition through the one-third target, and 50% marginal recognition above it:

    ERD_t = QRD_t − ½ · max(0, QRD_t − R_t/3)

Equivalently:

    ERD_t = QRD_t                              if QRD_t ≤ R_t/3
    ERD_t = R_t/3 + 0.5·(QRD_t − R_t/3)        if QRD_t >  R_t/3

Curve: **100% recognition to target → 50% marginal recognition beyond target.** Rewards reaching the
one-third commitment and keeps recognizing research beyond it, while preventing spend alone from dominating.

## 3. The one QIS equation

    QIS_t = (R_t + GP_t + OI_t + ERD_t) / 4
          = 0.25·R_t + 0.25·GP_t + 0.25·OI_t + 0.25·ERD_t

One QIS function. It does not change Basis → Future, nor Project → Group → eXeL Portfolio. Only the
measurement boundary changes.

## 4. Basis → Future → Growth
    B = [R_B, GP_B, OI_B, QRD_B]      (Basis — frozen state innovation growth is measured from)
    F = [R_F, GP_F, OI_F, QRD_F]      (Future — observed state at the qualified measurement point)

Compute ERD separately for each state, apply the identical QIS equation:

    QIS_B = (R_B + GP_B + OI_B + ERD_B) / 4
    QIS_F = (R_F + GP_F + OI_F + ERD_F) / 4

    ΔQIS  = QIS_F − QIS_B                        (Primary Absolute Growth)
    ΔQIS% = (ΔQIS / QIS_B) × 100    when QIS_B > 0
    ΔQIS% = N/A (display default)   when QIS_B ≤ 0   (true QIS_B, QIS_F, ΔQIS still preserved)

Percentages, CAGR, margins, multiples may provide context; they do not replace the canonical QIS record.

## 5. Three scales — one measurement
`PROJECT → GROUP OF PROJECTS → eXeL PORTFOLIO`. For a Group/Portfolio, **never average project QIS.**
Aggregate the underlying absolutes first, then ERD, then one QIS:

    R_Σ = Σ R_j ; GP_Σ = Σ GP_j ; OI_Σ = Σ OI_j ; QRD_Σ = Σ QRD_j
    ERD_Σ = f(R_Σ, QRD_Σ)
    QIS_Σ = (R_Σ + GP_Σ + OI_Σ + ERD_Σ) / 4

Non-negotiable rollup: **Aggregate four absolutes → ERD → QIS → ΔQIS → ΔQIS%.** Never mean(QIS_i); never
mean(ΔQIS_i%). Preserves economic scale — a small project cannot outweigh a large portfolio component
merely because each produced one score.

## 6. Evidence → Measurement → Qualification → Incentive (layer separation)
    Evidence:      R | GP | OI | QRD
    Measurement:   ERD → QIS → ΔQIS → ΔQIS%
    Decision:      Qualification
    Policy:        Incentive

Financial evidence is preserved; measurement is deterministic; qualification evaluates the result;
incentive policy acts afterward. A future incentive policy can change without rewriting historical
financial evidence or historical QIS. **QIS itself creates no recognition, 웃 H.I., ◬ A.I., 🎁 Bonus,
🏠 Livelihood, compensation, ownership, or any other economic right.**

## 7. Ownership firewall — if ever authorized
**QIS ≠ Ownership.** QIS does not create, promise, issue, allocate, or vest ownership. If an ownership
incentive is ever separately authorized, its financial-growth basis shall use only ΔQIS and ΔQIS%
computed from R, GP, OI, QRD at the applicable Project / Group / eXeL-Portfolio boundary. Ownership
eligibility, allocation, issuance, vesting, governance, taxation, securities compliance, qualification,
and Human Authority remain separate policy and legal layers. The policy may consume the measurement; it
may not invent a competing financial-growth measurement system.

## 8. Canonical Basis (locked)
    R_B = $1,111,111 ; GP_B = $333,333 ; OI_B = $111,111 ; QRD_B = $100,000
    QRD_B < R_B/3  →  ERD_B = $100,000
    QIS_B = (1,111,111 + 333,333 + 111,111 + 100,000) / 4 = 1,655,555 / 4 = $413,888.75

This Basis remains frozen when evaluating the Future scenarios below.

## 9. Twelve-scenario regression suite (deterministic vectors)
Scenarios 7–12 hold R, GP, OI constant and change only QRD — isolating the one-third target + 50% marginal
ERD rule. Use these as regression vectors for any QIS implementation.

| # | Scenario | Revenue | Gross Profit | Operating Income | Qualified R&D | R&D %Rev | Effective R&D | Base QIS | Future QIS | Δ QIS | Δ QIS % |
|---|----------|--------:|-------------:|-----------------:|--------------:|---------:|--------------:|---------:|-----------:|------:|--------:|
| 1 | Loss | $3,333,333 | $1,111,111 | -$333,333 | $150,000 | 4.50% | $150,000 | $413,888.75 | $1,065,277.75 | +$651,389.00 | +157.38% |
| 2 | Loss | $3,333,333 | $1,111,111 | -$111,111 | $222,222 | 6.67% | $222,222 | $413,888.75 | $1,138,888.75 | +$725,000.00 | +175.17% |
| 3 | Break-even | $3,333,333 | $1,111,111 | $0 | $400,000 | 12.00% | $400,000 | $413,888.75 | $1,211,111.00 | +$797,222.25 | +192.62% |
| 4 | Positive | $3,333,333 | $1,111,111 | $111,111 | $600,000 | 18.00% | $600,000 | $413,888.75 | $1,288,888.75 | +$875,000.00 | +211.41% |
| 5 | Positive | $3,333,333 | $1,111,111 | $222,222 | $800,000 | 24.00% | $800,000 | $413,888.75 | $1,366,666.50 | +$952,777.75 | +230.20% |
| 6 | Near Target | $3,333,333 | $1,111,111 | $333,333 | $1,000,000 | 30.00% | $1,000,000 | $413,888.75 | $1,444,444.25 | +$1,030,555.50 | +248.99% |
| 7 | Target | $3,333,333 | $1,111,111 | $666,666 | $1,111,111 | 33.333% | $1,111,111 | $413,888.75 | $1,555,555.25 | +$1,141,666.50 | +275.84% |
| 8 | 36% R&D | $3,333,333 | $1,111,111 | $666,666 | $1,200,000 | 36.00% | $1,155,555.50 | $413,888.75 | $1,566,666.38 | +$1,152,777.63 | +278.52% |
| 9 | 40% R&D | $3,333,333 | $1,111,111 | $666,666 | $1,333,333 | 40.00% | $1,222,222.00 | $413,888.75 | $1,583,333.00 | +$1,169,444.25 | +282.55% |
| 10 | 45% R&D | $3,333,333 | $1,111,111 | $666,666 | $1,500,000 | 45.00% | $1,305,555.50 | $413,888.75 | $1,604,166.38 | +$1,190,277.63 | +287.58% |
| 11 | 50% R&D | $3,333,333 | $1,111,111 | $666,666 | $1,666,667 | 50.00% | $1,388,889.00 | $413,888.75 | $1,624,999.75 | +$1,211,111.00 | +292.62% |
| 12 | 60% R&D | $3,333,333 | $1,111,111 | $666,666 | $2,000,000 | 60.00% | $1,555,555.50 | $413,888.75 | $1,666,666.38 | +$1,252,777.63 | +302.68% |

## 10. Implementation invariants (Claude Code · Grok · eXeL AI)
1. **Four-source** — QIS must always be traceable to R, GP, OI, QRD.
2. **Exact-third** — `RDT = R/3` (never `R × 0.33333`).
3. **ERD** — 100% recognition through R/3; 50% marginal above R/3.
4. **Equation** — `QIS = (R + GP + OI + ERD)/4`.
5. **Basis** — Basis inputs frozen before Future is evaluated.
6. **Growth** — `ΔQIS = QIS_F − QIS_B`.
7. **Percentage** — `ΔQIS% = ΔQIS/QIS_B×100` only when QIS_B > 0.
8. **Scale** — aggregate absolutes first; never average QIS or ΔQIS%.
9. **History** — incentive-policy changes never rewrite historical QIS.
10. **Ownership** — QIS creates no ownership; if ever authorized, ΔQIS and ΔQIS% are the sole
    financial-growth inputs.

Anything violating these invariants is **not** canonical QIS.

## 11. Machine-readable conceptual spine
    Evidence:        R | GP | OI | QRD
      ↓ R&D qualification
    QRD → ERD
      ↓ measurement
    ERD → QIS_B → QIS_F
      ↓ growth
    ΔQIS → ΔQIS%
      ↓ decision
    Qualification
      ↓ policy
    Incentive

## Final lock
    R|GP|OI|QRD → ERD → QIS → ΔQIS → ΔQIS% → Qualification → Incentive

The four absolutes are the evidence. ERD applies the innovation commitment. QIS measures the state. ΔQIS
measures absolute growth. ΔQIS% expresses that growth relative to Basis. Qualification interprets
eligibility. Incentive policy acts last.

**Honor the Past • Measure the Present • Build the Future**
Vision • 2525 QIS Canonical Lock: FINAL.
