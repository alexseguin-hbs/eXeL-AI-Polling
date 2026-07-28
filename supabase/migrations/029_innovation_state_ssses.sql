-- SoI-2525 (System of Innovation) durable state — SSSES hardening on top of 028_innovation_state.sql.
--
-- Adds:
--   • DELETE RLS policy  — completeness: a retired namespace (e.g. a per-project blob whose project was
--     removed) can drop its durable row via lib/innovation-store.ts deleteState(), scoped to the owner.
--   • updated_at index   — efficiency: recency-ordered reads / "most recently synced" queries without a
--     full scan; pairs with the batch loadAllState() single-round-trip hydrate.
--
-- Idempotent + optional: like 028, the frontend degrades gracefully to localStorage if these are absent.
-- Scoping mirrors 028 (owner_key = per-browser id now → auth.uid()::text when accounts land).

CREATE INDEX IF NOT EXISTS ix_innovation_state_updated ON innovation_state(owner_key, updated_at DESC);

DROP POLICY IF EXISTS "Owners delete innovation state" ON innovation_state;
CREATE POLICY "Owners delete innovation state"
  ON innovation_state FOR DELETE
  TO anon, authenticated
  USING (owner_key IS NOT NULL AND length(owner_key) > 0);
