# eXeL AI Polling — Developer SDK

> **"Where Shared Intention moves at the Speed of Thought."**

---

## What This Is

A governance engine that lets any community — from a team of 5 to a nation of millions — make decisions together, in real time, with intelligence.

You embed it. Your users decide. The platform grows itself.

---

## 9 Functions That Change How Decisions Are Made

### 1. `sdk.compress(texts)` — Understand Anything

Give it a million voices. Get back three truths.

The Theme Compression Engine reads any collection of text — citizen feedback, customer reviews, research papers, social commentary — and distills it into a hierarchy of meaning: 9 themes, then 6, then 3. Not summarization. *Understanding.*

> *"What do a million people actually care about?"*
> Now you can answer that in under 60 seconds.

---

### 2. `sdk.vote(session, rankings)` — Govern Fairly

Democracy where every voice counts, but no single voice dominates.

Quadratic voting means the weight of your stake follows the square root curve — enough to be meaningful, not enough to be tyrannical. Built-in anti-sybil detection catches coordinated manipulation before it corrupts the count. 66.6% supermajority ensures real consensus, not slim margins.

> *"Can 1,000,000 people make a decision together without being gamed?"*
> Yes. In 1.06 seconds.

---

### 3. `sdk.convert(amount)` — Value Human Time

Every dollar invested becomes tokenized human intelligence.

$7.25 — one hour of minimum wage — becomes 1.0 웃 token. These tokens track who contributes, who invests, who believes in the platform enough to put money behind it. When revenue flows, 웃 tokens determine who gets paid — at *their* local minimum wage, anywhere in the world.

> *"How do you fairly compensate a global community?"*
> You measure their contribution in time, not currency.

---

### 4. `sdk.detect(session)` — Clean Before You Count

Most systems count all votes, then flag bad ones. We remove bad actors *before* the math happens.

Anomaly detection identifies coordinated voting patterns — three identical rankings within two seconds, rapid-fire submissions from suspicious accounts — and excludes them from the aggregation. The result is always clean.

> *"Can you trust the result?"*
> When the math never touches corrupted data, yes.

---

### 5. `sdk.consensus(session)` — See Agreement Forming

While voting is still happening, watch the crowd converge.

A live convergence score (0 to 1) tells you how strongly the community agrees. An emerging leader shows which theme is winning. Partial scores reveal the full landscape of opinion. The moderator sees consensus forming in real time — not after the fact.

> *"When does the crowd know what it wants?"*
> You can watch that moment arrive.

---

### 6. `sdk.verify(session)` — Prove It's Real

Run the same vote twice. Get the exact same result. Prove it with cryptography.

The determinism proof re-runs the entire aggregation on the same inputs and produces a SHA-256 hash. If it matches, the result is provably identical. No black boxes. No "trust us." Mathematical certainty.

> *"Is this result legitimate?"*
> Here's the hash. Check it yourself. It's free.

---

### 7. `sdk.challenge(cube, code)` — Build the Future

Submit code to improve the platform itself. The community decides if it ships.

Unplug any component, write a better version, test it against real production data. If 66.6% of token holders approve, an admin deploys it live. AI and humans compete — the best implementation wins regardless of source.

> *"What if the software could evolve like a living thing?"*
> It can. And the community guides the evolution.

---

### 8. `sdk.override(session, theme, rank, reason)` — Lead Transparently

Authority exists. But it answers to everyone.

A leader can override a community ranking — move a theme from #3 to #1. But they *must* explain why. The justification is permanent, public, and immutable. Everyone sees who changed what and the reason. Power with accountability.

> *"How do you balance leadership with democracy?"*
> You let leaders lead, and make their decisions visible.

---

### 9. `sdk.broadcast(session, payload)` — Reach Everyone

Push a message to a million people at once.

Results, theme reveals, ranking updates — delivered simultaneously to every connected device. 100 broadcast shards ensure no single channel is overwhelmed. Whether you have 10 participants or 10 million, everyone gets the result at the same time.

> *"Can real-time governance work at planetary scale?"*
> Yes. We've proven it at 1,000,000 and it took 1 second.

---

## 3 Things That Are Always Free

| What | Why It's Free |
|------|--------------|
| **Create a session** | Starting a conversation should never cost anything |
| **Submit a response** | Every voice deserves to be heard |
| **Export results** | The truth belongs to everyone |

---

## Pricing

All paid functions consume ◬ (AI tokens). You earn ◬ by participating. You buy ◬ with dollars. The economy is circular.

| Function | Cost | Unit |
|----------|:----:|------|
| compress | 5 ◬ | per 1,000 texts |
| vote | 0.01 ◬ | per vote |
| detect | 1 ◬ | per scan |
| consensus | 0.5 ◬ | per check |
| challenge | 10 ◬ | per submission |
| override | 2 ◬ | per override |
| broadcast | 1 ◬ | per 10,000 recipients |
| convert | Free | payments *are* the product |
| verify | Free | trust should never have a price |

**Example:** A session with 10,000 responses, 5,000 voters, broadcast to all:

```
compress:   50 ◬ (10K texts)
votes:      50 ◬ (5K × 0.01)
scan:        1 ◬
consensus:   2.5 ◬ (5 checks)
broadcast:   0.5 ◬
─────────────────
Total:     104 ◬
```

At 1,000,000 responses with 500,000 voters: **~10,000 ◬** — governance for a nation at the cost of a small business tool.

---

## Quick Start

```typescript
import { ExelPolling } from '@exel-ai/sdk';

const sdk = new ExelPolling({ apiKey: 'exel_pk_...' });

// Compress 10,000 citizen comments into 3 priorities
const themes = await sdk.compress(comments);
console.log(themes.themes_3);
// → ["Healthcare Access", "Education Reform", "Economic Equity"]

// Let people rank the priorities
const vote = await sdk.vote(sessionId, myRankings);

// Watch consensus form in real time
const live = await sdk.consensus(sessionId);
console.log(`${live.convergence * 100}% converged on: ${live.leader.label}`);

// Prove the result is legitimate
const proof = await sdk.verify(sessionId);
console.log(`Deterministic: ${proof.match}`); // true
```

---

> *"The future does not belong to the most powerful intelligence.*
> *It belongs to those who master its direction."*

**Where Shared Intention moves at the Speed of Thought.**
