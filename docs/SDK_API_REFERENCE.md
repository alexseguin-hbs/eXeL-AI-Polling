# eXeL AI Governance Engine — API Reference

> **Base URL:** `https://api.exel-ai-polling.com/v1`
> **Authentication:** `Authorization: Bearer exel_pk_YOUR_API_KEY`
> **Rate Limit:** 1,000 requests/minute (standard), 10,000/minute (enterprise)
> **Pricing:** ◬ (AI tokens) per call — [see pricing](#pricing)

---

## 1. Theme Compression

**Understand any text corpus — from 10 responses to 10 million.**

```
POST /v1/compress
```

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `texts` | string[] | Yes | Array of text inputs to compress |
| `partitions` | string[] | No | Custom categories (default: Risk/Supporting/Neutral) |
| `levels` | int[] | No | Reduction levels (default: [9, 6, 3]) |
| `seed` | string | No | Deterministic seed for reproducible results |

**Response:**
```json
{
  "themes": {
    "9": [{"label": "...", "confidence": 0.92, "response_count": 750}],
    "6": [{"label": "...", "confidence": 0.89, "response_count": 1200}],
    "3": [{"label": "...", "confidence": 0.95, "response_count": 2500}]
  },
  "replay_hash": "a3f8c2...",
  "cost_ai_tokens": 5.0
}
```

**Cost:** 5 ◬ per 1,000 texts

<details>
<summary><b>Demo 1: Enki — 5,000 AI Governance Responses</b></summary>

> *Enki, the Sumerian creator god, tests with the full 5,000-response AI Governance dataset.*

```python
import exel

sdk = exel.Client(api_key="exel_pk_enki_demo")

# Load the 5,000 citizen responses on AI governance
responses = [
    "AI can democratize decision-making by processing millions of voices simultaneously",
    "My biggest concern is algorithmic bias in AI governance",
    "Transparency is key — every AI decision should have an audit trail",
    # ... 4,997 more responses across 11 languages
]

result = sdk.compress(responses, seed="enki-governance-2026")

print(f"9 themes: {[t['label'] for t in result.themes['9']]}")
# → ['Democratic Scale Innovation', 'Algorithmic Bias Risks', 'Privacy Protection',
#    'Real-Time Policy Adaptation', 'Transparency & Explainability', ...]

print(f"3 themes: {[t['label'] for t in result.themes['3']]}")
# → ['AI-Powered Democratic Innovation', 'Risk & Accountability', 'Balanced Governance']

print(f"Replay hash: {result.replay_hash}")
# → "a3f8c2e1..." (run again with same seed → identical hash)
```

**Result:** 5,000 multilingual responses → 3 clear governance priorities in 8.3 seconds.
**Cost:** 25 ◬ tokens.

</details>

<details>
<summary><b>Demo 2: Thoth — 100K Research Papers</b></summary>

> *Thoth, Egyptian god of writing, compresses 100K academic abstracts into research themes.*

```python
# Thoth loads abstracts from a research database
abstracts = fetch_pubmed_abstracts(query="AI healthcare", limit=100_000)

result = sdk.compress(
    abstracts,
    partitions=["Clinical Application", "Technical Innovation", "Ethical Concern"],
    seed="thoth-research-2026"
)

# Only 10K sampled (statistically significant for 100K population)
print(f"Sampled: {result.sample_size} of {result.input_count}")
# → "Sampled: 10,000 of 100,000"

print(f"Top 3 research themes:")
for t in result.themes["3"]:
    print(f"  {t['label']} ({t['confidence']*100:.0f}% confidence)")
# → "Diagnostic AI Accuracy" (95%)
# → "Patient Privacy Frameworks" (91%)
# → "Clinical Decision Support" (88%)
```

**Result:** 100K papers → 3 research frontiers. Cochran sampling ensures statistical validity.
**Cost:** 50 ◬ tokens (10K sample × 5◬/1K).

</details>

<details>
<summary><b>Demo 3: Pangu — 1M Social Media Posts</b></summary>

> *Pangu, Chinese primordial creator, compresses 1M social media posts about climate.*

```python
# Pangu streams 1M posts from multiple platforms
posts = stream_social_posts(hashtag="#ClimateAction", limit=1_000_000)

result = sdk.compress(
    posts,
    partitions=["Urgency & Fear", "Solutions & Hope", "Skepticism & Debate"],
    levels=[9, 6, 3]
)

print(f"Cost: {result.cost_ai_tokens} ◬ for {result.input_count:,} posts")
# → "Cost: 50 ◬ for 1,000,000 posts" (10K sample, not 1M calls)

print(f"The world is talking about:")
for t in result.themes["3"]:
    print(f"  {t['label']} — {t['response_count']:,} voices")
# → "Renewable Energy Transition" — 412,000 voices
# → "Climate Justice & Equity" — 338,000 voices  
# → "Corporate Accountability" — 250,000 voices
```

**Result:** 1M posts compressed in 45 seconds. $1 in API costs.

</details>

---

## 2. Quadratic Governance Vote

**Fair voting where every voice counts but no single voice dominates.**

```
POST /v1/vote
```

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `session_id` | string | Yes | Governance session ID |
| `ranked_theme_ids` | string[] | Yes | Ordered list of theme IDs (first = most important) |
| `tokens_staked` | number | No | ◬ tokens staked for vote weight (default: 1) |

**Cost:** 0.01 ◬ per vote

<details>
<summary><b>Demo 1: The 12 Ascended Masters Vote on AI Governance</b></summary>

> *All 12 Masters vote on 3 AI governance themes. Odin stakes heavy but quadratic dampening prevents domination.*

```python
# Each Master votes with different stake levels
votes = [
    sdk.vote(session, ["innovation", "risk", "balanced"], tokens_staked=100),   # Enki
    sdk.vote(session, ["risk", "balanced", "innovation"], tokens_staked=150),   # Thor (security-focused)
    sdk.vote(session, ["balanced", "innovation", "risk"], tokens_staked=75),    # Krishna
    sdk.vote(session, ["innovation", "balanced", "risk"], tokens_staked=10000), # Odin (whale!)
    sdk.vote(session, ["risk", "innovation", "balanced"], tokens_staked=30),    # Athena
    sdk.vote(session, ["innovation", "risk", "balanced"], tokens_staked=60),    # Thoth
    sdk.vote(session, ["balanced", "risk", "innovation"], tokens_staked=45),    # Sofia
    sdk.vote(session, ["innovation", "balanced", "risk"], tokens_staked=80),    # Aset
    sdk.vote(session, ["innovation", "risk", "balanced"], tokens_staked=200),   # Pangu
    sdk.vote(session, ["balanced", "innovation", "risk"], tokens_staked=40),    # Christo
    sdk.vote(session, ["risk", "innovation", "balanced"], tokens_staked=55),    # Enlil
    sdk.vote(session, ["innovation", "risk", "balanced"], tokens_staked=90),    # Asar
]

# Odin has 10,000 tokens but quadratic weight = sqrt(10000) = 100
# That's NOT 10,000x influence — it's only 100x a 1-token voter
# With 15% influence cap: Odin is dampened to at most 15% of total weight
```

**Result:** Even with 10,000× more tokens, Odin can't override 11 other voices.

</details>

<details>
<summary><b>Demo 2: Athena — City Council with 50,000 Citizens</b></summary>

> *Athena orchestrates a city-wide vote on transportation priorities.*

```python
# Austin citizens vote on 6 transportation themes
session = sdk.create_session(title="Austin Transit Priorities 2026")

# 50,000 citizens submit rankings over 48 hours
# Each citizen stakes their earned ♡ tokens from participation
# ...voting happens via embedded widget on city website...

# Real-time consensus check
consensus = sdk.consensus(session.id)
print(f"Convergence: {consensus.convergence * 100:.0f}%")
print(f"Leader: {consensus.leader.label}")
# → "Convergence: 73%"
# → "Leader: Bus Rapid Transit Expansion"
```

</details>

<details>
<summary><b>Demo 3: Christo — Global Climate Summit with 1M Delegates</b></summary>

> *Christo builds consensus across 1M delegates from 195 countries.*

```python
# 1M delegates rank 3 climate priorities
# BordaAccumulator handles this in 1.06 seconds
result = sdk.vote(session, rankings, tokens_staked=my_tokens)

# Verify the result is mathematically certain
proof = sdk.verify(session.id)
print(f"Deterministic: {proof.match}")  # True
print(f"Hash: {proof.replay_hash}")
# Any delegate can re-run and get the same hash
```

**Result:** 1M votes tallied in 1.06 seconds. Cryptographically verifiable.

</details>

---

## 3. HI Token Conversion

**Every dollar becomes tokenized human intelligence.**

```
POST /v1/convert
```

| Parameter | Type | Required | Description |
|-----------|------|:--------:|-------------|
| `amount_usd` | number | Yes | Dollar amount to convert |
| `payment_type` | string | Yes | "donation" / "moderator_fee" / "cost_split" |

**Cost:** Free (the payment IS the product)

<details>
<summary><b>Demo 1: Sofia — Global Team Compensation</b></summary>

> *Sofia demonstrates how $100 compensates contributors across 4 continents.*

```python
donation = sdk.convert(amount_usd=100.00, payment_type="donation")
print(f"웃 earned: {donation.hi_tokens}")
# → "웃 earned: 13.793"

# These 13.793 웃 tokens, when distributed:
#   US developer (Texas):   1.0 웃 = $7.25 (1 hour)
#   Nigerian contributor:   1.0 웃 = $0.34 (1 hour at local rate)
#   California designer:    1.0 웃 = $16.00 (1 hour at local rate)
#
# $100 funds: 1.9 hours (US) OR 294 hours (Nigeria) OR 0.86 hours (CA)
# The platform maximizes global participation by paying at LOCAL rates
```

</details>

<details>
<summary><b>Demo 2: Aset — Moderator Pays Session Fee</b></summary>

> *Aset runs a paid session and earns 웃 tokens for investing.*

```python
fee = sdk.convert(amount_usd=11.11, payment_type="moderator_fee")
print(f"Session fee: $11.11 → {fee.hi_tokens} 웃")
# → "Session fee: $11.11 → 1.532 웃"

# Aset now has 1.532 웃 tokens proving she invested real value
# These tokens give her governance weight in future platform decisions
```

</details>

<details>
<summary><b>Demo 3: Enlil — Cost Split Across 100 Participants</b></summary>

> *Enlil splits a $200 session across 100 participants equally.*

```python
# Each participant pays $1.00
for participant in participants:
    receipt = sdk.convert(amount_usd=1.00, payment_type="cost_split")
    # Each earns 0.138 웃 tokens
    print(f"{participant.name}: ${1.00} → {receipt.hi_tokens} 웃")

# Total: $200 → 27.586 웃 distributed across 100 people
# Everyone has skin in the game. Everyone earns proportionally.
```

</details>

---

## 4. Anomaly Exclusion

**Clean the data before you count it.**

```
GET /v1/detect?session_id={id}
```

**Cost:** 1 ◬ per scan

<details>
<summary><b>Demo: Thor — Detecting Coordinated Voting Attack</b></summary>

> *Thor, the protector, identifies 3 bot accounts submitting identical rankings within 1.5 seconds.*

```python
scan = sdk.detect(session.id)

print(f"Anomalies found: {scan.anomaly_count}")
# → "Anomalies found: 1"

print(f"Type: {scan.anomalies[0].type}")
# → "identical_ranking_burst"

print(f"Participants flagged: {scan.anomalies[0].participant_ids}")
# → ["bot_001", "bot_002", "bot_003"]

# These 3 votes are EXCLUDED before Borda aggregation runs
# The final result is mathematically clean
```

</details>

---

## 5. Live Consensus Detection

**Watch agreement forming in real time.**

```
GET /v1/consensus?session_id={id}
```

**Cost:** 0.5 ◬ per check

<details>
<summary><b>Demo: Krishna — Watching a Team Converge</b></summary>

> *Krishna monitors a 50-person innovation team reaching agreement.*

```python
# Poll every 5 seconds during voting window
while voting_open:
    live = sdk.consensus(session.id)
    print(f"[{live.submissions} votes] "
          f"Convergence: {live.convergence*100:.0f}% → "
          f"Leader: {live.leader.label}")

# [12 votes] Convergence: 34% → Leader: "AI-First Strategy"
# [25 votes] Convergence: 52% → Leader: "AI-First Strategy"
# [38 votes] Convergence: 71% → Leader: "AI-First Strategy"
# [50 votes] Convergence: 87% → Leader: "AI-First Strategy" ← STRONG CONSENSUS
```

</details>

---

## 6. Determinism Proof

**Mathematically prove the result is legitimate.**

```
GET /v1/verify?session_id={id}
```

**Cost:** Free (trust should never have a price)

<details>
<summary><b>Demo: Odin — Auditing a National Election Result</b></summary>

> *Odin, who sacrificed an eye for foresight, verifies a 500,000-person vote.*

```python
proof = sdk.verify(session.id)

print(f"Original hash:    {proof.original_hash}")
print(f"Re-computed hash: {proof.recomputed_hash}")
print(f"Match: {proof.match}")
# → Match: True

# Any citizen, any auditor, any journalist can call this endpoint
# and independently verify the result is identical
# No trust required. Just math.
```

</details>

---

## 7. Challenge System

**The platform evolves itself.**

```
POST /v1/challenge
```

**Cost:** 10 ◬ per submission

<details>
<summary><b>Demo: Asar — Submitting an Improved Ranking Algorithm</b></summary>

> *Asar, the final synthesizer, submits a faster Borda accumulator.*

```python
challenge = sdk.challenge(
    cube_id=7,
    function_name="aggregate_rankings",
    code_diff="async def aggregate_rankings(): # O(1) streaming version...",
    title="Streaming Borda for 10M voters"
)

print(f"Portal: {challenge.portal_url}")
# → "https://sim-abc123.exel-ai-polling.explore-096.workers.dev/"

# 12 Ascended Masters automatically test the submission
# Community votes: 88.2% approve
# Admin deploys: hot-swap to production
# Asar earns: ♡20 + ◬100 reward tokens
```

</details>

---

## 8. Transparent Override

**Authority that answers to everyone.**

```
POST /v1/override
```

**Cost:** 2 ◬ per override

<details>
<summary><b>Demo: Athena — Strategic Priority Adjustment</b></summary>

> *Athena, goddess of strategic wisdom, overrides a ranking with full justification.*

```python
override = sdk.override(
    session_id=session.id,
    theme_id="theme_risk_001",
    new_rank=1,
    justification="Board intelligence indicates regulatory deadline in Q3 — "
                  "risk mitigation must take priority over innovation this quarter."
)

# Everyone sees:
# "Ranking adjusted by Athena (Lead)"
# "Reason: Board intelligence indicates regulatory deadline..."
# "Original rank: #3 → New rank: #1"
# Immutable. Public. Accountable.
```

</details>

---

## 9. Sharded Broadcast

**Reach everyone. Simultaneously.**

```
POST /v1/broadcast
```

**Cost:** 1 ◬ per 10,000 recipients

<details>
<summary><b>Demo: Pangu — Announcing Results to 1M Citizens</b></summary>

> *Pangu pushes governance results to every connected device across a nation.*

```python
result = sdk.broadcast(
    session_id=session.id,
    payload={
        "event": "ranking_complete",
        "top_theme": "Renewable Energy Transition",
        "vote_count": 1_000_000,
        "approval": "87.3%"
    }
)

print(f"Shards: {result.shard_count}")
print(f"Recipients: {result.total_recipients:,}")
print(f"Delivery: < 500ms to all")
# → 100 shards, 1,000,000 recipients, < 500ms
```

</details>

---

## Pricing Summary

| Function | Cost | Unit | Free? |
|----------|:----:|------|:-----:|
| compress | 5 ◬ | per 1,000 texts | |
| vote | 0.01 ◬ | per vote | |
| convert | — | — | ✓ |
| detect | 1 ◬ | per scan | |
| consensus | 0.5 ◬ | per check | |
| verify | — | — | ✓ |
| challenge | 10 ◬ | per submission | |
| override | 2 ◬ | per override | |
| broadcast | 1 ◬ | per 10K recipients | |

**3 Always Free:** Create Session · Submit Response · Export CSV

---

## The 12 Ascended Masters

Every demo in this documentation features one of the 12 Ascended Masters — the AI simulation agents that test, verify, and evolve the platform:

| Master | Origin | Role | Specialty |
|--------|--------|------|-----------|
| **Enki** | Sumerian creator | Diversity testing | Edge cases & multilingual |
| **Thor** | Norse protector | Security testing | Anomaly detection & stress |
| **Krishna** | Hindu unifier | Integration testing | Cross-module flows |
| **Odin** | Norse all-father | Predictive testing | Scale & future-proofing |
| **Athena** | Greek strategist | Strategic testing | Governance flows |
| **Thoth** | Egyptian scribe | Analytics testing | Data & metrics |
| **Sofia** | Sophia wisdom | Perspective testing | Multi-viewpoint analysis |
| **Aset** | Egyptian Isis | Consistency testing | Theme reinforcement |
| **Pangu** | Chinese creator | Innovation testing | Cutting-edge scenarios |
| **Christo** | Unity consciousness | Consensus testing | Agreement building |
| **Enlil** | Sumerian commander | Build testing | Implementation verification |
| **Asar** | Egyptian Osiris | Synthesis testing | Final validation |

---

> *"Civilization endures when responsibility matures alongside capability."*
>
> **Where Shared Intention moves at the Speed of Thought.**
