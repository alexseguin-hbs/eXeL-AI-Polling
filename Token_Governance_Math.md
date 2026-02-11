# Token Governance Math — Formal Specification

This document defines the exact mathematical formulas for the SoI Trinity Token system,
governance compression, and all related calculations. Implementations MUST follow these
formulas exactly.

---

## 1) Token Definitions

### SI (Shared Intention)
```
SI_tokens = floor(active_minutes)
```
- 1 minute of active participation = 1 SI
- `active_minutes = sum(end_time - start_time)` for all tracked actions in session
- Only accumulated during polling/voting phases
- Minimum granularity: 1 second (fractional minutes accumulate)

### HI (Human Intelligence)
```
HI_tokens = active_hours * HI_rate
HI_rate = org_override OR default_minimum_wage / 60  (per minute)
default_minimum_wage = 7.25 USD/hr → 0.12083 HI/min
```
- Compensated skilled time
- Only assigned during project execution phases (NOT polling)
- `org_override` allows per-organization rate customization

### AI (Artificial Intelligence)
```
AI_tokens = SI_tokens * AI_multiplier
AI_multiplier = default(5) OR session_config.ai_multiplier
```
- Measures time saved / scaled impact via automation
- Generated when AI pipeline processes inputs attributable to a participant's contribution

---

## 2) Token Lifecycle States

```
simulated → pending → approved → finalized
                                    ↓
                                 reversed
```

State transition rules:
- `simulated`: Created during simulation runs. Cannot be redeemed. Auto-expires if not promoted.
- `pending`: Created during live sessions. Awaiting session close + reconciliation.
- `approved`: Session closed, reconciliation complete, no disputes within window.
- `finalized`: Approved + dispute window elapsed. Immutable. Redeemable (HI only).
- `reversed`: Dispute upheld OR governance override. Creates offsetting negative entry.

Reversal rule (append-only):
```
reversed_entry = {
    original_entry_id,
    delta_SI: -original.delta_SI,
    delta_HI: -original.delta_HI,
    delta_AI: -original.delta_AI,
    reason,
    resolved_by,
    timestamp
}
```

---

## 3) Governance Weight Damping

Prevents any single actor from dominating governance outcomes.

### Base governance weight:
```
W_base(user) = SI_balance(user) + (HI_balance(user) * HI_weight_factor)
HI_weight_factor = 0.5  (HI counts at half weight for governance)
```

### Damped weight (per-session):
```
W_damped(user, session) = W_base(user) * damping_factor(user, session)

damping_factor(user, session) = min(1.0, max_influence / W_base(user))
max_influence = total_governance_pool(session) * influence_cap
influence_cap = 0.15  (no single user > 15% of total governance weight)
```

### Per-session governance pool:
```
total_governance_pool(session) = sum(W_base(user)) for all participants
```

---

## 4) Quadratic Vote Normalization

Diminishing returns on repeated votes to prevent plutocratic capture.

### Vote weight:
```
vote_weight(user) = sqrt(tokens_staked(user))
```

### Normalized vote:
```
normalized_vote(user) = vote_weight(user) / sum(vote_weight(all_voters))
```

### Effective ranking contribution:
```
ranking_score(theme, user) = user_rank_position(theme) * normalized_vote(user)
final_rank(theme) = sum(ranking_score(theme, user)) for all voters
```

Themes are ordered by `final_rank` ascending (lower = higher priority).

---

## 5) Token Velocity Caps

Prevents gaming through rapid token transfers.

```
max_transfer_per_day(user) = max(
    floor(0.10 * total_balance(user)),
    minimum_daily_transfer
)
minimum_daily_transfer = 10  (configurable per org)
```

### Redemption velocity (HI only):
```
max_redemption_per_day(user) = min(
    floor(0.05 * HI_balance(user)),
    treasury_available * per_user_treasury_cap
)
per_user_treasury_cap = 0.02  (no single user > 2% of treasury per day)
```

---

## 6) Reputation Multipliers

Earned trust increases governance weight over time.

```
reputation_score(user) = base_reputation * consistency_bonus * tenure_factor

base_reputation = 1.0 (all users start equal)

consistency_bonus = 1 + (0.1 * consecutive_sessions_participated)
  capped at max_consistency_bonus = 2.0

tenure_factor = 1 + log2(1 + total_sessions_completed / 10)
  capped at max_tenure_factor = 3.0

effective_governance_weight(user) = W_damped(user) * reputation_score(user)
```

---

## 7) Drift Detection

Monitors theme stability between clustering runs.

### Centroid drift:
```
drift(cluster_i) = 1 - cosine_similarity(centroid_previous_i, centroid_new_i)

cosine_similarity(A, B) = dot(A, B) / (norm(A) * norm(B))
```

### Session-level drift score:
```
session_drift = mean(drift(cluster_i)) for all clusters

ALERT if session_drift > drift_threshold
drift_threshold = 0.15 (configurable)
```

### Cluster stability score:
```
stability(cluster_i) = 1 - drift(cluster_i)
session_stability = mean(stability(cluster_i))
```

Report stability as percentage: `stability * 100`

---

## 8) Cluster Determinism

### Reproducibility hash:
```
reproducibility_hash = SHA256(
    sorted_input_texts +
    embedding_model_id +
    embedding_model_version +
    str(n_clusters) +
    str(random_state) +
    str(batch_size) +
    cube_dependency_graph_hash
)
```

### Verification:
Given identical `reproducibility_hash`, the system MUST produce:
- Identical cluster assignments
- Identical theme labels (after deterministic sort)
- Identical confidence scores
- Identical ranking aggregations

### Cube dependency graph hash:
```
cube_graph_hash = SHA256(
    cube_id + ":" + cube_version
    for each cube in sorted(dependency_graph)
)
```

---

## 9) Treasury Accounting

### Treasury balance:
```
treasury_balance = total_deposits - total_redemptions - total_reserved

total_reserved = sum(pending_redemption_requests)
```

### HI redemption check:
```
can_redeem(user, amount) =
    amount <= max_redemption_per_day(user)
    AND amount <= HI_balance(user)
    AND amount <= (treasury_balance - total_reserved) * per_user_treasury_cap
```

### Treasury health metric:
```
treasury_coverage_ratio = treasury_balance / total_outstanding_HI
ALERT if treasury_coverage_ratio < 0.20
```

---

## 10) Token Dispute Workflow

### Dispute states:
```
flagged → under_review → resolved_upheld | resolved_rejected
```

### Dispute record:
```
{
    dispute_id,
    original_entry_id,
    flagged_by,
    reason,
    evidence,
    status,
    assigned_to,
    resolution_notes,
    resolved_by,
    created_at,
    resolved_at
}
```

### Resolution actions:
- `resolved_upheld`: Create reversal entry (see Section 2). Update original lifecycle to `reversed`.
- `resolved_rejected`: No token changes. Log resolution rationale.

### Auto-escalation:
```
IF dispute unresolved for > escalation_window (default 72 hours):
    escalate to next role tier (User → Lead → Admin)
```

---

## 11) Cost-Per-Response Modeling

### Embedding cost:
```
embedding_cost_per_response = (tokens_per_response / 1000) * price_per_1k_tokens
tokens_per_response ≈ word_count * 1.3  (average tokenization ratio)
```

### Batch efficiency:
```
batch_cost = ceil(total_responses / batch_size) * per_batch_overhead + total_embedding_cost
per_batch_overhead = API_call_latency * compute_cost_per_second
```

### Clustering cost:
```
clustering_cost = O(n * k * d * iterations)
  n = number of responses
  k = number of clusters
  d = embedding dimensions
  iterations = max_iter for MiniBatchKMeans
```

### Total cost per 1M responses (estimate):
```
total_cost_1M = embedding_cost_1M + clustering_compute_cost + storage_cost + infra_overhead
```

---

## 12) Governance Compression Summary

The governance compression pipeline:

1. **Ingest** — Collect responses, validate, anonymize
2. **Embed** — Batch embedding generation (async worker fleet)
3. **Cluster** — MiniBatchKMeans with deterministic seed
4. **Summarize** — Theme label + description generation
5. **Classify** — Theme01 (Risk/Support/Neutral) with confidence
6. **Reduce** — 9 → 6 → 3 theme reduction per category
7. **Assign** — Map each response to reduced theme at each level
8. **Rank** — Quadratic-weighted participant ranking
9. **Compress** — Final governance output: priorities + confidence + token attribution
10. **Audit** — Append-only ledger entry for every action
