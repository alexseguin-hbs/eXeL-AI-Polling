-- 030 · innovation_state — REAL authorisation (replaces the no-op policies from 028/029)
-- ============================================================================================
-- DEFECT (adversarial audit, CRITICAL): 028/029 defined every policy as
--     USING (owner_key IS NOT NULL AND length(owner_key) > 0)
-- That is a NOT-NULL check, not authorisation. It is TRUE for every row in the table, so with the
-- public anon key `select * from innovation_state` dumped the whole table, and DELETE/UPDATE were
-- open to anyone. The client-side `.eq("owner_key", ownerKey())` in lib/innovation-store.ts is a
-- convenience filter, never a control — the client chooses it.
--
-- CHOSEN FIX — option (b): keep anonymous use, but make rows UNGUESSABLE and NON-ENUMERABLE.
-- ---------------------------------------------------------------------------------------------
-- The app has no accounts today; ownerKey() is a per-browser UUID, so auth.uid() cannot be the
-- only key without deleting anonymous cloud sync outright (option (a)), and flipping the shared
-- browser client to Supabase anonymous sign-in (option (c)) would change the auth role of EVERY
-- other feature that shares lib/supabase.ts — including the Trinity-Redundancy realtime path,
-- which is sacred code. Neither is acceptable collateral for this fix.
--
-- So: the anon role loses ALL direct table access, and the only way in is four SECURITY DEFINER
-- RPCs that require the exact 128-bit owner key as an argument.
--
--   * bare `select * from innovation_state` as anon → ZERO rows (no permissive anon policy exists,
--     and the table grants are revoked), so the table cannot be dumped or enumerated.
--   * a caller who does not hold owner X's UUID cannot read, update or delete owner X's rows —
--     there is no listing endpoint and no wildcard: every RPC scopes by an exact equality on the
--     supplied key, which must look like a UUID/hex id (>= 32 chars) and may never be 'anon'.
--   * an authenticated user additionally gets a real auth.uid()-keyed policy on user_id, which is
--     the migration path to accounts.
--
-- TRADE-OFF, PLAINLY: this is a bearer-capability model, not identity. Possession of the owner_key
-- UUID *is* the authorisation — anyone who obtains a user's key (shoulder-surfing localStorage,
-- an XSS on our own origin, a shared device) gets that user's rows. What it buys over the old
-- policy is that the key is 122 bits of entropy, is never enumerable, and is never returned by any
-- read path — so the table can no longer be scraped wholesale by anyone holding the public anon
-- key, which is the live CRITICAL. Real identity arrives with accounts: rows written while signed
-- in are stamped with user_id and are then locked to that auth.uid() (see the claim guard in
-- innovation_state_put), so the cutover neither orphans rows nor lets a client claim someone else's.
--
-- ORG-CUTOVER COLUMNS (audit point): the 028 schema had NO identifying column beyond owner_key, so
-- at org cutover we would have had to orphan every row or let a client assert ownership of an
-- arbitrary UUID. `user_id` + `created_at` are added NOW, while data volume is small, to keep that
-- option open. They are nullable/defaulted so nothing existing breaks.
--
-- Idempotent. Safe to re-run. Does not rewrite 028/029 — it supersedes their policies.

-- ── 1 · org-cutover columns ──────────────────────────────────────────────────────────────────
ALTER TABLE innovation_state
  ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE innovation_state
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Backfill created_at for rows that predate the column (the column default stamped them with the
-- migration time; their true floor is their last write).
UPDATE innovation_state SET created_at = updated_at WHERE created_at > updated_at;

CREATE INDEX IF NOT EXISTS ix_innovation_state_user ON innovation_state(user_id);

-- ── 2 · tear down the no-op policies ─────────────────────────────────────────────────────────
ALTER TABLE innovation_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners read innovation state"   ON innovation_state;
DROP POLICY IF EXISTS "Owners insert innovation state" ON innovation_state;
DROP POLICY IF EXISTS "Owners update innovation state" ON innovation_state;
DROP POLICY IF EXISTS "Owners delete innovation state" ON innovation_state;

-- ── 3 · the only direct-table policy: a real auth.uid() match, authenticated only ─────────────
-- No policy is created for the `anon` role. With RLS enabled and no permissive policy, every anon
-- SELECT/INSERT/UPDATE/DELETE against the table matches zero rows. An authenticated caller sees
-- ONLY rows they have claimed (user_id = auth.uid()); unclaimed rows (user_id IS NULL) are still
-- invisible to them, so `select *` never leaks another owner's blob.
DROP POLICY IF EXISTS "innovation_state owner by auth uid" ON innovation_state;
CREATE POLICY "innovation_state owner by auth uid"
  ON innovation_state FOR ALL
  TO authenticated
  USING      (user_id IS NOT NULL AND user_id = auth.uid())
  WITH CHECK (user_id IS NOT NULL AND user_id = auth.uid());

-- Defence in depth: strip the anon role's table grants entirely, so the denial is a hard
-- permission error at the gateway rather than a silent empty result set.
REVOKE ALL ON TABLE innovation_state FROM anon;

-- ── 4 · owner-key shape guard ────────────────────────────────────────────────────────────────
-- A valid owner key is a crypto-minted UUID (36 chars) or 32-char hex. Anything shorter is a
-- guess; the literal 'anon' is the shared-bucket key minted by the old client bug and is banned
-- outright so no legacy row can be reached or created under it.
CREATE OR REPLACE FUNCTION innovation_state_owner_ok(p_owner TEXT)
RETURNS BOOLEAN
LANGUAGE sql IMMUTABLE
AS $$
  SELECT p_owner IS NOT NULL
     AND length(p_owner) >= 32
     AND length(p_owner) <= 64
     AND p_owner ~ '^[A-Za-z0-9-]+$'
     AND lower(p_owner) <> 'anon';
$$;

-- ── 5 · the four scoped RPCs (the ONLY way anon reaches this table) ──────────────────────────
-- SECURITY DEFINER so they run as the table owner and bypass RLS by design; every one of them
-- hard-scopes by an exact owner_key equality supplied by the caller, plus a claim check so a row
-- already bound to an auth.uid() can never be read or written through the anonymous key path.
-- `SET search_path = public, pg_temp` pins resolution (no search_path hijack).

CREATE OR REPLACE FUNCTION innovation_state_get(p_owner TEXT, p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v JSONB;
BEGIN
  IF NOT innovation_state_owner_ok(p_owner) THEN RETURN NULL; END IF;
  SELECT s.payload INTO v
    FROM innovation_state s
   WHERE s.owner_key = p_owner
     AND s.name = p_name
     AND (s.user_id IS NULL OR s.user_id = auth.uid());
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION innovation_state_list(p_owner TEXT, p_names TEXT[] DEFAULT NULL)
RETURNS TABLE (name TEXT, payload JSONB)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT innovation_state_owner_ok(p_owner) THEN RETURN; END IF;
  RETURN QUERY
    SELECT s.name, s.payload
      FROM innovation_state s
     WHERE s.owner_key = p_owner
       AND (p_names IS NULL OR s.name = ANY (p_names))
       AND (s.user_id IS NULL OR s.user_id = auth.uid())
     ORDER BY s.name;
END;
$$;

CREATE OR REPLACE FUNCTION innovation_state_put(p_owner TEXT, p_name TEXT, p_payload JSONB)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE ts TIMESTAMPTZ;
BEGIN
  IF NOT innovation_state_owner_ok(p_owner) THEN
    RAISE EXCEPTION 'innovation_state: invalid owner key' USING ERRCODE = '22023';
  END IF;
  IF p_name IS NULL OR length(p_name) = 0 OR length(p_name) > 120 THEN
    RAISE EXCEPTION 'innovation_state: invalid namespace' USING ERRCODE = '22023';
  END IF;
  IF p_payload IS NULL OR pg_column_size(p_payload) > 2097152 THEN   -- 2 MiB per namespace
    RAISE EXCEPTION 'innovation_state: payload missing or too large' USING ERRCODE = '22023';
  END IF;
  -- A row already claimed by a signed-in account is off-limits to the anonymous key path and to
  -- any other account. This is what stops "a client asserting ownership of an arbitrary UUID".
  IF EXISTS (
    SELECT 1 FROM innovation_state s
     WHERE s.owner_key = p_owner AND s.name = p_name
       AND s.user_id IS NOT NULL AND s.user_id IS DISTINCT FROM auth.uid()
  ) THEN
    RAISE EXCEPTION 'innovation_state: row is claimed by another account' USING ERRCODE = '42501';
  END IF;

  INSERT INTO innovation_state (owner_key, name, payload, user_id, created_at, updated_at)
  VALUES (p_owner, p_name, p_payload, auth.uid(), now(), now())
  ON CONFLICT (owner_key, name) DO UPDATE
    SET payload    = EXCLUDED.payload,
        updated_at = now(),
        -- first signed-in write claims the row; later anonymous writes never un-claim it
        user_id    = COALESCE(innovation_state.user_id, EXCLUDED.user_id)
  RETURNING innovation_state.updated_at INTO ts;
  RETURN ts;
END;
$$;

CREATE OR REPLACE FUNCTION innovation_state_del(p_owner TEXT, p_name TEXT)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE n INTEGER;
BEGIN
  IF NOT innovation_state_owner_ok(p_owner) THEN RETURN 0; END IF;
  DELETE FROM innovation_state s
   WHERE s.owner_key = p_owner
     AND s.name = p_name
     AND (s.user_id IS NULL OR s.user_id = auth.uid());
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

-- ── 6 · grants ───────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON FUNCTION innovation_state_owner_ok(TEXT)              FROM PUBLIC;
REVOKE ALL ON FUNCTION innovation_state_get(TEXT, TEXT)             FROM PUBLIC;
REVOKE ALL ON FUNCTION innovation_state_list(TEXT, TEXT[])          FROM PUBLIC;
REVOKE ALL ON FUNCTION innovation_state_put(TEXT, TEXT, JSONB)      FROM PUBLIC;
REVOKE ALL ON FUNCTION innovation_state_del(TEXT, TEXT)             FROM PUBLIC;

GRANT EXECUTE ON FUNCTION innovation_state_get(TEXT, TEXT)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION innovation_state_list(TEXT, TEXT[])     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION innovation_state_put(TEXT, TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION innovation_state_del(TEXT, TEXT)        TO anon, authenticated;

-- ── 7 · quarantine the shared-bucket rows the old client bug created ─────────────────────────
-- ownerKey() used to return the literal 'anon' whenever localStorage threw (Safari Private
-- Browsing, iOS Lockdown Mode, partitioned webviews), so every such user shared ONE row per
-- namespace and clobbered each other. Those rows have no single owner and can never be attributed;
-- they are unreachable through the RPCs above (the guard bans 'anon') and are removed here so the
-- shared bucket cannot be resurrected.
DELETE FROM innovation_state WHERE owner_key = 'anon' OR length(owner_key) < 32;
