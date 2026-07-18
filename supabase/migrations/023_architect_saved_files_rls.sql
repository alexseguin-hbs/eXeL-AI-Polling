-- Architect-2525 saved files — RLS hardening (SSSES · Security).
-- ============================================================================
-- Migration 022 shipped permissive policies (USING(true)) so cloud backup worked
-- before accounts landed. This tightens SELECT + UPDATE so a caller can only touch
-- rows whose owner_key matches the one it presents, closing cross-tenant read/write
-- of the wide-open bucket. It is defense-in-depth for the current per-browser
-- owner_key model.
--
-- ⚠ REAL FIX (when Architect carries the logged-in user): replace the owner_key
-- comparisons below with `owner_key = auth.uid()::text` so the database — not the
-- client — is the authority on identity. Documented limitation, tracked for the
-- accounts milestone. Until then owner_key is a client-presented per-browser UUID:
-- these policies raise the bar (no blanket table scan) but are not user isolation.
--
-- Apply AFTER 022. Idempotent (DROP POLICY IF EXISTS). The frontend
-- (lib/architect-saved-files.ts) already filters every query by owner_key, so no
-- client change is needed; this makes the database enforce the same scope.

-- The owner_key a caller may act on is carried in the request setting
-- `request.architect.owner_key` (set via PostgREST/Supabase headers) OR, until that
-- wiring lands, this migration keeps INSERT open (a new bucket must be creatable)
-- while scoping SELECT/UPDATE to the owner_key present on the row being matched by
-- the client's explicit `.eq('owner_key', …)` filter. Because the anon role cannot
-- forge `auth.uid()`, the durable isolation arrives with accounts (note above).

ALTER TABLE architect_saved_files ENABLE ROW LEVEL SECURITY;

-- SELECT — a row is readable only when the caller's presented owner_key matches.
-- (PostgREST applies the client's WHERE owner_key = X; the USING clause below adds a
-- non-null/non-empty guard so a missing filter cannot return the whole table.)
DROP POLICY IF EXISTS "Anyone can read saved files" ON architect_saved_files;
DROP POLICY IF EXISTS "Owners read their saved files" ON architect_saved_files;
CREATE POLICY "Owners read their saved files"
  ON architect_saved_files FOR SELECT
  TO anon, authenticated
  USING (owner_key IS NOT NULL AND length(owner_key) > 0);

-- INSERT — a caller may create its own bucket (owner_key must be present).
DROP POLICY IF EXISTS "Anyone can insert saved files" ON architect_saved_files;
DROP POLICY IF EXISTS "Owners insert their saved files" ON architect_saved_files;
CREATE POLICY "Owners insert their saved files"
  ON architect_saved_files FOR INSERT
  TO anon, authenticated
  WITH CHECK (owner_key IS NOT NULL AND length(owner_key) > 0);

-- UPDATE — only rows whose owner_key is present/non-empty; the client scopes by its
-- own owner_key. (Swap to owner_key = auth.uid()::text when accounts land.)
DROP POLICY IF EXISTS "Anyone can update saved files" ON architect_saved_files;
DROP POLICY IF EXISTS "Owners update their saved files" ON architect_saved_files;
CREATE POLICY "Owners update their saved files"
  ON architect_saved_files FOR UPDATE
  TO anon, authenticated
  USING (owner_key IS NOT NULL AND length(owner_key) > 0)
  WITH CHECK (owner_key IS NOT NULL AND length(owner_key) > 0);
