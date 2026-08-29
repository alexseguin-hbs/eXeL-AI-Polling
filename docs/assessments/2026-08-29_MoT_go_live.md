# Master of Thought — The Path to Live (999 words)
### Internal tokens · external Stripe · API polling · prioritization · time & token by Innovation Pod

Thought Master —

Here is the honest shape of what stands, and the road from a beautiful document
to a living instrument that measures a recorded hour and settles it.

**What already exists.** The polling and prioritization engine is real: 109 REST
endpoints across ten cubes at `/api/v1`, OpenAPI docs, Auth0 RBAC, rate limiting,
the Trinity Redundancy delivery path proven with live human input. The tokenomics
substrate is not a sketch either. `UsageRecord` is an append-only, per-org meter
(metric · quantity · cost in ◬ · api-key/session/scope provenance). `record_usage`
already fires from webhook delivery, CSV export, AI inference, and every API-key
call. `estimate_cost` prices each metric from an authoritative ◬ table into ◬ and
USD, and `create_usage_billing_checkout` turns that into a real, pay-for-what-you-
used Stripe Checkout, completed by the existing payment webhook. The metering→
billing loop is closed end to end. The three monetization tiers are specified:
Free (≤19 users, donate after results), Moderator-Paid ($11.11 upfront), and
Cost-Split (50% moderator + 50%/N users), with donation always **after** results,
never gating them.

**The two currencies, kept clean.** Internal value and external money must never
blur. **Internal tokens** — ♡ Shared Intent (recognition, the why), ◬ AI
acceleration (recognition of leverage), 웃 Human Intelligence (the recorded hour,
`웃 earned = M × hours`, 9,999/yr settlement boundary with roll-forward). These are
recognition and contribution records, **not money** — no redemption rate, no
appreciation, no claim on profit merely by being held. **External money** — Stripe,
in real currency, for what the platform actually costs to run and for the tiers
above. The bridge between them is one-directional and lawful: recognition qualifies
a person or a project; a **separately budgeted, approved** economic event follows;
classification precedes settlement; a licensed rail moves the funds. The canonical
gate you locked holds: **planning → scope → approve budget (hours + local currency)
→ witnessed work → 웃 issues.** Before approval it is all planning, and planning
earns ♡ and ◬, never 웃.

**Time and token by Innovation Pod — the missing measurement.** This is the next
build, and it is the keystone. The `◬♡웃 Session` (`/soi-session`) pod must become
the unit of account: a pod of three scopes a line of work, a budget-approval gate
(hours + currency) precedes any 웃, and from the moment work is witnessed the pod
accrues — **time** (MoT, the A.B..C / Base-3600 nomenclature, second-exact) and
**tokens** (♡ during ideation, ◬ where AI is used, 웃 only post-approval on
witnessed hours). Every accrual is stamped with its pod id and its scope
(Project → Differentiator → Specification), so the ledger answers, per pod: how
many hours, how many ◬ from AI leverage, how much 웃 became payable, and — through
`estimate_cost` and the Stripe rail — what that costs and what it earned. SoI-2525
surfaces the QIS spine (R | GP | OI | QRD → ERD → QIS → ΔQIS) so a project's
qualified-innovation growth, not a guess, sizes the reward pool. Recognition never
becomes the accelerator's input; QIS never issues 웃 directly. The firewalls stay.

**The API-first path to going live.** The instrument is embeddable by design — the
web UI is one consumer of the same REST surface. To go live:

1. **Wire usage metering to the pod.** Every `record_usage` call carries pod id +
   scope. A pod's dashboard reads its own `summarize_usage` — time, ◬, 웃, and the
   ◬→USD cost block — in real time. This is the "track time and token by Innovation
   Pod" you asked for, made concrete.
2. **Turn on Stripe for real.** The Checkout and Payment-Intent flows exist; they
   need live keys (operator-held), the tier logic bound to session creation, and
   the donation prompt after results. Cost-Split computes `estimate/2` for the
   moderator and `(estimate/2)/N` per user.
3. **Publish the SDK.** `@exel-ai/sdk` (TypeScript) and `exel-ai-sdk` (Python)
   wrapping the 109 endpoints, so a company embeds polling + prioritization into
   its own product and is metered per org, per pod, per scope.
4. **Prioritization as the product.** The ranking cube already does deterministic
   Borda aggregation with governance compression and live updates. Exposed via API
   with anti-sybil and weight-damping, it is the sellable core: poll, theme,
   prioritize, simulate — at the Project/Differentiator/Specification level.

**What remains, plainly.**
- **Feedback → database:** set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in
  Cloudflare Pages and run migration `020` — the annotation loop then lands in the
  table (operator-only, five minutes).
- **The pod meter:** build the pod id + scope stamp into `record_usage`, and the
  per-pod dashboard. This is the largest remaining piece and the one that makes
  time-and-token real.
- **Stripe live:** keys, tier binding, donation prompt.
- **QIS surfaced in SoI-2525;** the ◬♡웃 Session geared to the Trinity (roles,
  glyphs, budget gate).
- **Deploy secrets** so the GitHub Action and `wrangler` verify LIVE rather than
  UNVERIFIED, and the container-reset fragility is watched.
- **Sacred-totals ruling** (WARN or re-fit) and the chrome-translation tail.

**The through-line.** Recognition is not money; qualification is not conversion;
the pod is the meter; the hour is the unit; Stripe is the rail; the API is the
product. When a pod can show its recorded hours, its ◬ and 웃, and its cost and
earning in one honest view — and a company can call that through the SDK and pay
by Stripe for what it used — the Polling and Prioritization tool is live.

*Where Shared Intention moves at the Speed of Thought.*

— Master of Thought
*Humanity decides · Technology assists · Wisdom guides · Trust must be proven.*
