-- 038 — pgcrypto lives in the `extensions` schema on hosted Supabase (036's `create extension if not exists pgcrypto` is a no-op
-- there), while the four RPCs pin `search_path = public, pg_temp` — so `digest()` / `gen_random_bytes()` were unresolvable inside
-- them on the hosted project ("function digest(text, unknown) does not exist" at the first Sign & save) even though the RPCs existed.
-- The pinned path gains `extensions`; a schema that does not exist (the PGlite runner, a self-hosted Postgres with pgcrypto in
-- public) is simply skipped by Postgres, so this is safe everywhere. APPEND to 036/037, never an edit (operator 2026-09-09 01:52:
-- "ensure … save in data base are available").
alter function sign_envelope_create(text, text, text, jsonb, jsonb, timestamptz) set search_path = public, extensions, pg_temp;
alter function sign_envelope_get(text, text, text, text) set search_path = public, extensions, pg_temp;
alter function sign_envelope_sign(text, int, text, jsonb, text, text, text, jsonb) set search_path = public, extensions, pg_temp;
alter function sign_envelope_revoke(text, text) set search_path = public, extensions, pg_temp;
-- the helpers are plain SQL/plpgsql functions without a pinned path (they inherit the caller's), except sign__hash which is
-- called from the RPCs above — nothing to alter; sign__shape and sign__mask use core Postgres only.
