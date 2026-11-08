# ARCHITECT-2525 / FUTURE — HASH AND SERIALIZATION

> Part of the Architect-2525/Future Phase-0 contract set. The plan of record is [`ARCHITECT-2525_FUTURE_PLAN.md`](./ARCHITECT-2525_FUTURE_PLAN.md); this document is the named artifact for its section(s). Humanity decides. Technology assists. R-CORE remembers. SPIRAL verifies. SSSES qualifies. Trust must be proven.

**Plan of record section(s): §10.**

The V2 hash includes canonical state, excludes view state (camera/orbit/selection/drawer/tab/armed-tool/animation). Action→hash table (orbit/select/arm keep H0; place→H1; rotate→H2; save/reload→H2; geometry change→H3). The serializer/hasher wrap the donor canonicalHash (serialize.ts:85) + wire-core/sha256 — never a second SHA-256 (Grok's hash.ts, deleted).
