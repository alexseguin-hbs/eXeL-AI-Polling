# Livelihood Jurisdiction Adapters — implementation record (r204)

> **Companion to the living document.** The white paper (`docs/SOI_VISION2525_LIVING_DOCUMENT.html`,
> §6 `livelihood.direct`/`bonus.bridge`, §16 `shield.continuity`/`reg.adapters`, §18 `unit.ontology`)
> carries the **architecture**. This file carries the **current law** — the concrete per-jurisdiction
> cards the architecture switches on. Cards are data for implementation (Cube 16 Accords / Cube 14
> Payments / Cube 5 Gateway), deliberately kept OUT of the 77,777-word paper budget.
>
> **Design for jurisdiction-specific qualification and fail-closed deployment — never “compliant” as a blanket claim. Nothing here is legal advice.** Every capability marked `ALLOW` or `LICENSED-PARTNER` requires
> securities, payments, tax, employment, and (for housing) lending/source-of-funds counsel sign-off in
> that jurisdiction **before any live money moves**. A card whose `reviewed` date is stale **fails closed**.

## Global rules
- **Default-deny.** A financial capability does not activate until an adapter affirmatively qualifies it.
  Recognition (♡/◬), Replay, 웃 accounting, and the Innovation Pods may continue where lawful even when
  every financial capability is off.
- **Classify-before-delivery.** Every economic event passes the 12-gate check below before settlement.
- **External-authority supremacy.** A lender, underwriter, court, tax authority, or sanctions regime can
  always say no; the framework never overrides it. Replay provides provenance, not permission.
- **Fail-closed, not fall-over.** An adverse ruling disables ONE pathway in ONE jurisdiction; the rest of
  the framework keeps running.

## The 12 classification gates (all must resolve before an event settles)
1. Instrument · 2. Securities · 3. Payments (money-transmission / e-money / stored-value) ·
4. Virtual-assets · 5. Employment (employee/contractor/volunteer) · 6. Wage (minimum/overtime/timing) ·
7. Tax (income/payroll/withholding/fringe/reporting) · 8. AML-KYC (+ Travel Rule) · 9. Sanctions ·
10. Consumer/lending (bonus, mortgage, source-of-funds, disclosures) · 11. Privacy/data (localization,
retention) · 12. Accounting/custody (who holds funds, when, under what fiduciary arrangement).
→ all resolved = **QUALIFIED / LIVE**; anything unresolved = **RECOGNITION-ONLY / SANDBOX / BLOCKED**.

## Capability manifest (per card)
`recognition · HI-compensation · Bonus · Livelihood-Direct · Housing-Bonus · transferability · custody ·
cross-border-payment · public-offering · AML/KYC · tax · sanctions · Human-Authority · Replay`
— each: **UNREVIEWED → COUNSEL-REVIEW → ALLOW / MODIFY / LICENSED-PARTNER / BLOCK → EXPIRED → FAIL-CLOSED** (default-deny; a stale review fails closed). Plus: `controlling-law`, `counsel`, `reviewed`
(date), `expires` (fail-closed), `replay-hash`.

---

## Cards

### 🇺🇸 United States — controlling: SEC (Howey/Reves) · FinCEN + state MTLs · IRS (§119/§132/§409A/§83) · ERISA · CFPB
- recognition ALLOW · HI-compensation ALLOW (W-2/1099, withhold first) · Bonus ALLOW (supplemental wage;
  Home Continuity Bonus DESIGNED to vest at closing (§83) and pay in the §409A short-term-deferral window — actual forfeiture/timing counsel-reviewed) · Livelihood-Direct
  ALLOW (post-tax split-deposit via licensed processor; in-kind hub via §119) · Housing-Bonus
  LICENSED-PARTNER (EAH papering; lender/underwriting + source-of-funds gate) · transferability BLOCK ·
  custody LICENSED-PARTNER (payroll/bank/escrow moves money; framework non-custodial) · cross-border
  LICENSED-PARTNER · public-offering BLOCK (nothing offered/appreciates) · AML/KYC as applicable · tax
  classify-first (no §134 for private frameworks) · sanctions SCREEN · Human-Authority + Replay REQUIRED.
- Note: personal use of company vehicles imputed at ALV; §274(o) disallows the entity's §119-meals
  deduction from 2026 (excludable to worker, real cost to treasury). ERISA is the live risk if a payment
  stream reads as a plan — the funded reserve answers it. **counsel · reviewed pending · fails closed.**

### 🇨🇳 China — controlling: PBOC / 2026-02-06 framework — virtual-currency business illegal; RWA tokenization restricted
- recognition REVIEW (render ♡/웃/◬ as non-transferable internal records / ordinary DB measures) ·
  HI-compensation LOCAL-LAW-REVIEW (conventional fiat payroll only) · Bonus MODIFY (fiat only) ·
  Livelihood conventional benefit/payment rails · crypto settlement **BLOCK** · token issuance/trading
  **BLOCK** · RWA tokenization BLOCK absent authorization · Replay = non-financial record architecture.
  **counsel required before anything beyond conventional compensation.**

### 🇩🇪 Germany / 🇪🇺 EU — controlling: MiCA · PSD2/PSD3 · e-money directive · GDPR · benefits-in-kind tax
- Determine FIRST whether an instrument is a crypto-asset at all; a non-transferable evidentiary record is
  not an EMT/ART/utility token. Do NOT give recognition a stable-currency redemption claim (would read as
  e-money token). Payments via authorized PSPs; company-provided accommodation taxed per local BIK rules.
  transferability BLOCK · public-offering REVIEW. **counsel required.**

### 🇧🇷 Brazil — controlling: BCB Resolution 520 (2025-11-10, VASP) · CVM · labour law
- Fiat compensation + Livelihood on conventional regulated rails unless counsel finds an instrument/activity
  outside the VASP/payments regimes or a licensed-partner structure exists. Whether a guaranteed stream
  creates employment is unresolved and material — **counsel before opening.**

### 🇦🇪 UAE — TWO adapters: Dubai/VARA (rulebooks eff. 2025-06-19) · DIFC/DFSA Crypto Token (eff. 2026-01-12)
- VARA regulates VA issuance/transfer/settlement/custody/broker-dealer; DFSA authorization needed for
  relevant financial services involving Crypto Tokens (use of a token is not by itself a financial
  service). UAE AML/CFT is a separate layer. Route each of Dubai-non-DIFC and DIFC through its own card.

### 🇮🇳 India — controlling: Income-tax Act §115BBH (30% on VDA transfer; loss-offset restrictions) · FCRA
- Keep recognition OUT of VDA classification (non-cash, non-transferable, non-redemption). Ordinary INR
  compensation/bonuses via lawful payroll/payment channels. FCRA tightly controls foreign contribution to
  civic activity. **counsel + tax review before any token-like implementation.**

### 🇮🇱 Israel — controlling: securities + payment-services + AML/CFT (Bank of Israel 2026-07 proposed VC-payment AML updates) · tax
- Dedicated securities + payment-services + AML + tax adapter before activating anything beyond
  conventional compensation/benefit rails. **counsel required.**

### 🇷🇺 Russia — controlling: Bank of Russia Digital Financial Assets framework (non-qualified-investor limits, e.g. ₽600,000/yr)
- Keep recognition independent of a Russian DFA unless counsel affirmatively places the implementation in
  that regime and the system intends to comply. Cross-border activity needs sanctions screening
  independent of token classification.

### 🇺🇦 Ukraine — **ADAPTER PENDING CURRENT LOCAL COUNSEL QUALIFICATION**
- Insufficient current authoritative primary material to assert a 2026 configuration. Virtual-asset,
  payments, employment, tax, AML, plus wartime legal/regulatory conditions must be reviewed by local
  counsel. **Fails closed until qualified.** (Better governance than filling the gap with an assumption.)

### 🇮🇷 Iran — MOST RESTRICTIVE — sanctions + cross-border restrictions are independent gates
- Financial functionality **unavailable** unless sanctions counsel AND every relevant financial
  institution affirmatively determine the specific activity, participant, counterparties, and payment
  route are lawful. **No sanctions "workaround."** Recognition/research/coordination functionality is
  separated from financial functionality and independently reviewed. Protects the global network from one
  prohibited transaction contaminating the rest.

### 🇸🇬 Singapore — controlling: MAS (Securities and Futures Act, Payment Services Act)
- Payment-services licensing analysis before any custody/transmission. No posted hourly minimum wage → the
  Seed pricing rule and 웃 wage anchor need a locally-agreed reference (see Accords R5). transferability BLOCK.

---

## Maintenance
- Each card carries `reviewed`/`expires`; a stale card **fails closed** automatically (Cube 16 job).
- New jurisdictions are added as cards, never by relaxing the global default-deny.
- The white paper's `reg.adapters` block is the canonical architecture; this file is its living data.
