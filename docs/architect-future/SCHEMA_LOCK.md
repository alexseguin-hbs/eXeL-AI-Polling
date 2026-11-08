# ARCHITECT-2525 / FUTURE — SCHEMA LOCK

> Part of the Architect-2525/Future Phase-0 contract set. The plan of record is [`ARCHITECT-2525_FUTURE_PLAN.md`](./ARCHITECT-2525_FUTURE_PLAN.md); this document is the named artifact for its section(s). Humanity decides. Technology assists. R-CORE remembers. SPIRAL verifies. SSSES qualifies. Trust must be proven.

**Plan of record section(s): §7–§12.**

The locked V2 types: SpaceEntityV2 (12/10/1 µm), WallAssembly (service zone ≠ wall), OpeningDefinition, PlacedAsset (position_um + rotation_deg, semantic id only), the four economic domains (branded), the three rating records, ActorRef, the evidence vocabulary and the 22 R-CORE event types. Implemented in lib/architect-future/domain/* and rcore/events.ts; the type-level negatives are lib/architect-future/contracts/schema-expectations.ts (validated by tsc/next build).
