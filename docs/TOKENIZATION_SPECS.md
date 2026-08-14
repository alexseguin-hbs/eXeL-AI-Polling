# Tokenization Specs — extracted from Vision 2525 White Paper (77,777 words)

> **Provenance.** Produced by the AsM Fleet (7-agent workflow `wo3aqvhud`, 2026-08-12): six cluster
> readers swept the full 77,777-word White Paper, extracted every tokenization insight, summarized each
> into ~111 words, and one MoT synthesis rolled them into this executable spec list mapped to the
> **existing** eXeL AI-Polling tool (Cube 8 tokens, `/api/v1` REST API, Cube 6 summarization, Cube 7
> ranking, Cube 9 reports, `core/hi_rates.py`). Written **MoT** (AI synthesis of the human corpus).
>
> **R-CORE law applies.** Every spec below is EXTEND/ALIGN over the existing implementation — never a
> rebuild. Before opening code for any TOK-## item, grep-verify it isn't already shipped (cite file:line),
> and if it exists → reuse/extend. The "Verified state" column records what has already been checked.

## Canonical instruments (the four coins + the rail)

| Glyph | Name | Intelligence | Acquired by | Purchasable | Transferable | Economic claim |
|:---:|------|------|------|:---:|:---:|:---:|
| Seed | Membership | *beside* the Trinity | one-time purchase = local-min-wage-hour ÷ 7 | **yes** | no | no (residual reserve at shutdown only) |
| ♡ | Shared Intent (S.I.) | Purpose | voluntary, POD-witnessed | no | no | no (clockless ladder 1/3/7) |
| 웃 | Human Intelligence (H.I.) | Human | contributed time (hours × M) | no | no | settlement claim in local currency |
| ◬ | Artificial Intelligence (A.I.) | Scale | witnessed acceleration vs frozen baseline | no | no | redeems only through the accelerator it triggers |
| 💵 | Cash | — | the settlement rail (not a fifth intelligence) | — | — | — |

**Invariants (machine-checkable):** `Seed.purchasable=yes · Seed.economicClaim=no · Seed.transferable=no`;
`웃/♡/◬.purchasable=no`. No capital manufactures Human Intelligence, buys Shared Intent, or mints AI
acceleration; no participation instrument is a claim on enterprise profit; every money/recognition path
terminates **before** sovereignty.

## Spec list (execution order)

`TOK-01 → 02 → 03 → 04 → 05 → 06 → 07 → 10 → 24 → 08 → 11 → 12 → 13 → 09 → 14 → 15 → 16 → 17 → 21 → 18 → 20 → 19 → 22 → 23 → 25 → 26 → 27`

| ID | Title | Maps to | Verified state |
|----|-------|---------|----------------|
| **TOK-01** | Kill money-mints-recognition + strip `HI_weight_factor` | `cube8_tokens/service.py`; `Token_Governance_Math.md` | **SHIPPED** — service.py:75-90 enforces "money is never an on-ramp" (웃 = hours × 4.807, currency-free); `HI_weight_factor` deleted 2026-08-06 (Token_Governance_Math.md:78). No action. |
| **TOK-02** | Rate at settlement, not mint; frozen vintage stamp | Cube 8 ledger schema + settlement resolver; `hi_rates.py` | Partially shipped — `hours_to_hi` currency-free; `settle_hi_to_currency` stamps rate at settlement. GAP: verify vintage columns (jurisdiction, earn_date, wage_rate) + greater-of(vintage, current) floor (D9). |
| **TOK-03** | Canonical instrument ontology + invariant tests | Cube 8 `instrument_registry.py` (new) + discovery endpoint | GAP: enumerate 5 instruments with boolean invariants; pytest fails on any violation. |
| **TOK-04** | Seed Token model — 1/7 wage hour, vintages, contribution-only exit | Cube 8 `SeedToken` model + `hi_rates.py` | GAP: region+issue_year vintage keys; overage→years `floor((cur−yours)÷yours)`; memorial-Seed path. |
| **TOK-05** | Currency-free 웃 minting in Gateway (hours × 4.807) | Cube 5 Gateway mint; Cube 8 ledger | Largely shipped (`HI_PER_HOUR` = 4.807). GAP: confirm no rate parameter on any Cube 5 mint call + determinism test. |
| **TOK-06** | 9,999/yr ceiling with rolling-floor carry-forward | Cube 8 lifecycle; `secured_years = floor(cum_웃 / 9999)` | GAP: pure carry-forward accumulator + multi-year rollforward test. |
| **TOK-07** | Two-tranche split — wage-floor draws now, acceleration in escrow | Cube 8 settlement; Cube 23 De-Risk, Cube 25 sign-off | GAP: tranche discriminator on ledger; wage-floor cap-exempt (D10), acceleration escrow-locked. |
| **TOK-08** | 웃 extinction at death + Seed memorial option | Cube 8 lifecycle (`EXTINGUISHED` + reserve re-commit) | GAP: death transition zeroes cum 웃, re-commits reserve; log defect 22 (collision w/ elected-term). |
| **TOK-09** | Multiplier bands, four guards, reach-rate escalation ladder | Cube 8 band registry; reach-rate feed from Cube 9 | GAP: prospective-only versioned band table; reach thresholds 80/60/40 → freeze flag. |
| **TOK-10** | 103-jurisdiction settlement ladder + Global Agreed Standard | `core/hi_rates.py` (59 → 103, tier tags) | GAP: tag each entry Tier 1-pub(29)/1-pend(37)/2(35)/3(13); Global Agreed Standard fallback ≠ $0. |
| **TOK-11** | Shield V funded-reserve rule (replace 0.20 alert) | Cube 8 reserve accounting; Cube 9 monthly coverage | GAP: `coverage = reserve ÷ committed_instalments`; gate mint on <1.00; deprecate 0.20 alert (defect 14). |
| **TOK-12** | Escrow rail, 1/3/5-yr election, draw modes, Base-3600 ledger | Cube 8 settlement + Cube 5 escrow; Base-3600 codec | GAP: escrow pre-fund + draw-mode (manual/threshold/5×day) + term election; Base-3600 `N.mmmm..ssss` codec + round-trip test. |
| **TOK-13** | Privacy-preserving anti-sybil proof-of-personhood at settlement | Cube 8 settlement gate + `core/auth.py` | GAP (D5): participation stays anonymous; settlement-only ZK pass/fail token near 9,999 boundary. |
| **TOK-14** | Reach rate + 8 objective outcome metrics | Cube 9 Reports (fixed 2,080-h FTE denominator) | GAP: `reach_rate` metric endpoint; <0.6 alert; feeds TOK-09 escalation. |
| **TOK-15** | Return-on-contribution — retrospective, per-region | Cube 9 Reports | GAP: backward-looking only, never in solicitation, published even below 1.00, per-region. |
| **TOK-16** | ♡ clockless ladder (Noted 1 / Adopted 3 / Foundational 7), POD-witnessed via CQS | Cube 6 CQS + Cube 7 ranking; Cube 8 ledger | GAP: map D12 ladder onto CQS output; non-compounding closed ledger entries. |
| **TOK-17** | Witnessed-hours evidence chain that mints 웃 (POD of 3) | Cube 4 Collector + Cube 5 Gateway; Cube 8 ledger | GAP: 8-step pod session (clock-in → cross-review); MoT minutes recorded separately from 웃; 60-s summary reuses Cube 6 33-word tier. |
| **TOK-18** | ◬ accelerator vs frozen baseline (D4 securities, D11 signer) | Cube 8 (◬ → 웃-equiv); Cube 24/25/27 | GAP: `delta(actual, frozen_baseline) → 웃-equiv`, D4 delta-only input, D11 conflict-excluded signer graph to Replay. |
| **TOK-19** | The Wall — sovereignty one-vote vs prioritization quadratic cap | Cube 7 ranking (verify 15% cap); new sovereignty scaffold | Prioritization SHIPPED — verify `ranking_aggregation.py:32-43` (√hours, 15% cap, 164 tests). GAP: distinct unweighted sovereignty-vote model (shares no code). |
| **TOK-20** | Funding Loop P score + settlement-origin-only escrow fueling | Cube 8 funding-loop + Cube 14 Payments | GAP: 4-term P-score fn; settlement-origin provenance gate; identical 웃/$ rate invariant (0.990317). |
| **TOK-21** | Four continuity metrics, Continuity Index, shutdown reserve split | Cube 8 treasury/shutdown | GAP: 4 metrics in one shared module; delta-based Index; Guarantee→Holder→Trust strict order. |
| **TOK-22** | Off-switch sovereignty vote, vintage buyback, counter-signature brake | Cube 8 buyback + TOK-19 scaffold; Cube 17 | GAP: off-switch thresholds (0.1%/40%/60%/180d/90d) as proposed constants; Seed vintage-price buyback; defect 16 flagged unratified. |
| **TOK-23** | Ledger-transport separation; QUAI/QI provenance-vs-settlement | Cube 8 transport abstraction; Cube 17 | GAP: transport-adapter interface (permissioned DB / on-chain); QUAI hash-anchor separate from QI settlement. |
| **TOK-24** | Adaptive / Structural / Immutable classification on every provision | Cross-cube governance metadata; Cube 8 constants; `hi_rates.py` | GAP: classification tag on every governance constant; amendment path blocks Immutable changes. |
| **TOK-25** | Funding/governance ceilings (D14) + zero-min-wage pod rate | Cube 8 funding validation + `hi_rates.py`; Cube 16 | GAP: rolling-window 20%/10%/15% ceilings; pod-proposed dated/sourced rate for zero-min-wage jurisdictions. |
| **TOK-26** | Contribution receipt as four artefacts in one ledger record | Cube 9 Reports (four-view export) | GAP: one ledger record → transcript / portfolio / governance / settlement views; portfolio blurb via Cube 6. |
| **TOK-27** | Anchor 1/3/5-yr payout guarantee in a constitutional Accords article | Living-document ledger (Accords article) + Cube 16 | GAP: append-only ledger block anchoring the guarantee as Immutable (TOK-24), cross-ref Shield V (TOK-11). |
| **TOK-28** | POD-join identity verification to US REAL standard (operator, 2026-08-13) | Cube 1 Session join + `core/auth.py`; new Supabase `identity_verification` table (RLS-sealed) | GAP — NEW. Extends TOK-13 (anti-sybil) to POD JOIN. See detail below. |

## TOK-28 — POD-join identity verification (US REAL standard)

**Operator directive (2026-08-13).** The POD Lead creates a session and a scannable QR code. When a
person joins who is **not logged in**, capture their **email**, then require a **verified driver's-license
number** proving identity to **United States REAL ID standards**. The DL number must be held **behind a
super-secure Supabase firewall** — never exposed to the client, other participants, or ordinary queries.

**Design (extends, does not replace, TOK-13 / D5).** TOK-13 keeps *ordinary participation anonymous* and
puts personhood proof at *settlement*. TOK-28 adds an **optional, POD-scoped** identity gate the Lead can
require for a given session (e.g. when the outcome carries real value), consistent with D5: still no
biometric harvesting, minimum data, verify to the standard the law already recognizes.

- **Capture (join flow, Cube 1 / `/soi-session`):** logged-in joiners are already identified via Auth0;
  non-logged-in joiners provide `email` + a `dl_number` + issuing `state`. The client sends these once
  over TLS to a server endpoint; the client **never stores** and **never receives back** the DL number.
- **Verification to REAL standard:** validate the DL against the REAL ID rules for the issuing state
  (format/checksum now; pluggable AAMVA/DMV verification provider later via the circuit-breaker pattern).
  Store only a **verification verdict + a salted hash**, plus the minimum needed for lawful audit.
- **Supabase firewall (the "super-secure" store):** a dedicated `identity_verification` table with
  **RLS default-deny** (no `anon`/`authenticated` read; **service-role only**), the DL number **encrypted
  at rest** (pgcrypto / KMS-wrapped column) and **never selected** by any client query or view. A
  Postgres migration ships the table, the RLS policies, and a `SECURITY DEFINER` function that writes the
  record and returns only `{verified: bool, verification_id}` — the number never crosses the API boundary.
- **Maps to:** Cube 1 join endpoints + `core/auth.py` (verdict gate) · Supabase migration
  (`identity_verification` + RLS) · `/soi-session` join UI (email + DL fields for non-logged-in joiners) ·
  reuses the settlement personhood gate from TOK-13 so a POD-verified person needs no re-proof at settlement.
- **First step:** ship the `identity_verification` migration (RLS default-deny, encrypted `dl_number`,
  `SECURITY DEFINER` writer returning verdict only), then add the server verify endpoint and gate POD join
  on it when the Lead marks a session "identity-required."
- **Non-negotiables:** DL number is write-only from the client's perspective; never logged, never in an
  error message, never returned; RLS proven by a test that a client role cannot read the column.

## Notes for executors
- The White Paper is the **specification of the target state**; several TOK items narrate *past* corrections
  the backend has already made (TOK-01 confirmed shipped). **Always grep-verify current code first** — the
  gap is usually smaller than the 111-word insight implies.
- `HI_PER_HOUR = 4.807` (= 9,999 ÷ 2,080) is the locked, currency-free mint coefficient. Never a dollar figure.
- Full fleet output (all 27 specs + 30+ raw 111-word insights): workflow run `wf_681a257c-9e3`.

---

## r204 — 🏠 Livelihood + 🎁 Bonus specs (TOK-29 → TOK-34)

Validated by a 24-agent Fable-5 deliberation (IRS/SEC/FinCEN examiners survived). The living document
carries the doctrine (§6 `livelihood.direct`/`bonus.bridge`, §16 `shield.continuity`/`reg.adapters`,
§18 `unit.ontology`); the concrete jurisdiction cards live in `docs/LIVELIHOOD_JURISDICTION_ADAPTERS.md`.

| # | Spec | Maps to | Gap / build |
|---|------|---------|-------------|
| **TOK-29** | **🏠 Livelihood Direct** — a DESTINATION for already-earned, already-classified value (Home/Mobility/Essentials/Human-Development), not a token/currency. Pay-Person-First: 웃 → compensation → classify + withhold → person elects Cash or Livelihood → licensed rail → provider → Replay receipt. | Cube 8 (election) · Cube 14 Payments (split-deposit rails) · Cube 5 (classify gate) · Cube 9 (receipt) | GAP: `LivelihoodElection` model (categories as adapters, not currencies); non-custodial instruction only; in-kind vs cash rail flag. |
| **TOK-30** | **🎁 Bonus + Transformation Bridge** — recognition (♡/◬/loyalty) NEVER converts to cash; it only QUALIFIES a person for a separately-authorized, separately-funded, discretionary Bonus under Human Authority, classified before payment. No points→dollars. | Cube 8 (Bonus) · Cube 7 (Human Authority) · Cube 9 (Replay) | GAP: `Bonus` model with `separatelyFunded=true`, `fromRecognitionConversion=false`; qualification→award decision record; short-term-deferral pay window. |
| **TOK-31** | **🏠 Home Continuity Bonus** — housing sub-rail. W-2 supplemental-wage bonus vesting at closing (§83), paid in the §409A short-term-deferral window, wired to the closing agent, papered as Employer-Assisted Housing (EAH) so FNMA/FHA accept the source; lender/underwriting + CFPB source-of-funds are independent gates. Lease-to-own accrues a purchase-price credit (real-property interest), never a cash-redeemable balance. **Recognition gates the Bonus, never the bed** (a hub bed is role/§119, not points). | Cube 14 Payments + Cube 8 · lender partners | GAP: EAH program record; §83 vest-at-event; §409A window enforcement; rent-credit/shared-equity ledger; CLT/limited-equity-coop wrapper kept community-wide (not work-gated). |
| **TOK-32** | **Two-Track Tax Doctrine** — Track 1: §119 in-kind working-condition hub (entity/SPV OWNS the home + vehicles, on business premises, employer convenience, condition of engagement, **NO cash-in-lieu ever**, W-2 only; §119(c) foreign-camp for the rotation). Track 2: taxed cash (웃 = W-2, withheld first; Livelihood Direct = post-tax routing). A full no-tax cash redirect is NOT lawful (§134 is statute-only) — the §119 hub + taxed cash is the honest BAH/BAS equivalent. | Cube 5 (classify) · Cube 14 · `hi_rates.py` | GAP: hub §119-file (three prongs) or default to taxable in-kind at FMV on W-2; vehicle personal-use imputed at ALV; §274(o) meal-deduction cost noted. |
| **TOK-33** | **Classify-Before-Delivery + 12-gate firewall** — every economic event is classified (instrument · securities · payments · virtual-asset · employment · wage · tax · AML/KYC · sanctions · consumer/lending · privacy · custody) BEFORE settlement; unresolved → RECOGNITION-ONLY/SANDBOX/BLOCKED; changing destination never changes classification. | Cube 5 Gateway (firewall) · Cube 9 (Replay evidence) | GAP: 12-gate classification service; per-event `ClassificationRecord` (RLS); "SETTLEMENT PENDING — JURISDICTIONAL GATE" state that never erases contribution. |
| **TOK-34** | **Jurisdiction adapters + Continuity (Coordination-Without-Capture)** — per-jurisdiction capability manifest (allow/modify/licensed-partner/block), global default-deny, fail-closed expiry, external-authority supremacy; one constant ontology, many lawful local rails; comply locally rather than escape globally; "no regulator must trust us blindly — we prove what we're doing." | Cube 16 Accords (adapter registry) · Cube 17 (transport) | GAP: `JurisdictionAdapter` table (manifest + controlling-law + counsel sign-off + reviewed/expires + replay-hash + fail-closed job); 12 cards seeded from `LIVELIHOOD_JURISDICTION_ADAPTERS.md`; counsel sign-off gate before live money. |
