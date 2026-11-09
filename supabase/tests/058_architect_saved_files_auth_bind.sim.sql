-- SIMULATED rolled-back proof for 058 (Architect cloud-save claim bind).
-- Runs inside one transaction; final RAISE rolls everything back. Result is in the error text:
-- "SIM058 RESULT pass=N fail=M | ...". Apply 058 first (or paste 058 then this in one script).
-- Does NOT leave rows, columns-only changes that survive rollback are none (DDL rolls back too).

DO $sim$
DECLARE
  a text := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'; -- 36-char bearer
  b text := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  got jsonb;
  pass int := 0; fail int := 0; log text := '';
  refused boolean;
BEGIN
  -- Ensure columns/functions from 058 exist (caller must have applied 058 in this txn or earlier).
  PERFORM 1 FROM information_schema.columns
   WHERE table_schema='public' AND table_name='architect_saved_files' AND column_name='user_id';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SIM058 RESULT pass=0 fail=1 | FAIL:user_id-column-missing (apply 058 first)';
  END IF;

  -- Clean any leftover sim names (should not exist; belt)
  DELETE FROM public.architect_saved_files WHERE name LIKE 'sim058-%';

  -- 1 · anon bearer put/get round-trip (auth.uid() null)
  PERFORM set_config('request.jwt.claims', '', true);
  EXECUTE 'SET LOCAL ROLE anon';
  PERFORM public.architect_saved_files_put(a, 'sim058-ws', '{"ok":true}'::jsonb, 'sim');
  got := public.architect_saved_files_get(a, 'sim058-ws');
  IF got ? 'ok' AND (got->>'ok') = 'true' THEN
    pass := pass + 1; log := log || ' ok:anon-put-get';
  ELSE
    fail := fail + 1; log := log || ' FAIL:anon-put-get';
  END IF;

  -- 2 · other bearer cannot read a's row via get (exact key required — wrong key → null)
  got := public.architect_saved_files_get(b, 'sim058-ws');
  IF got IS NULL THEN pass := pass + 1; log := log || ' ok:cross-bearer-null';
  ELSE fail := fail + 1; log := log || ' FAIL:cross-bearer-null'; END IF;

  -- 3 · invalid owner rejected on put
  refused := false;
  BEGIN
    PERFORM public.architect_saved_files_put('anon', 'sim058-ws', '{"x":1}'::jsonb, null);
  EXCEPTION WHEN invalid_parameter_value OR check_violation OR others THEN
    IF SQLSTATE IN ('22023','42501') THEN refused := true; END IF;
  END;
  IF refused THEN pass := pass + 1; log := log || ' ok:reject-anon-literal';
  ELSE fail := fail + 1; log := log || ' FAIL:reject-anon-literal'; END IF;

  EXECUTE 'RESET ROLE';

  -- 4 · authenticated as uid_a: p_owner must equal auth.uid()::text
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_a::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';

  refused := false;
  BEGIN
    -- wrong owner while signed in
    PERFORM public.architect_saved_files_put(b, 'sim058-auth', '{"n":1}'::jsonb, null);
  EXCEPTION WHEN insufficient_privilege OR others THEN
    IF SQLSTATE = '42501' THEN refused := true; END IF;
  END;
  IF refused THEN pass := pass + 1; log := log || ' ok:auth-owner-mismatch';
  ELSE fail := fail + 1; log := log || ' FAIL:auth-owner-mismatch'; END IF;

  -- matching owner: put claims user_id
  PERFORM public.architect_saved_files_put(uid_a::text, 'sim058-auth', '{"n":2}'::jsonb, null);
  -- Verify as table owner (authenticated has no table SELECT after REVOKE)
  EXECUTE 'RESET ROLE';
  IF EXISTS (
    SELECT 1 FROM public.architect_saved_files
     WHERE owner_key = uid_a::text AND name = 'sim058-auth' AND user_id = uid_a
  ) THEN pass := pass + 1; log := log || ' ok:auth-claim-stamp';
  ELSE fail := fail + 1; log := log || ' FAIL:auth-claim-stamp'; END IF;

  -- 5 · other authenticated user cannot overwrite claimed row
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_b::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  refused := false;
  BEGIN
    -- even with correct-shape key = uid_a text, uid_b JWT must fail owner match first
    PERFORM public.architect_saved_files_put(uid_a::text, 'sim058-auth', '{"n":3}'::jsonb, null);
  EXCEPTION WHEN insufficient_privilege OR others THEN
    IF SQLSTATE = '42501' THEN refused := true; END IF;
  END;
  IF refused THEN pass := pass + 1; log := log || ' ok:other-auth-blocked';
  ELSE fail := fail + 1; log := log || ' FAIL:other-auth-blocked'; END IF;

  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', '', true);

  -- 6 · anon cannot read/overwrite a claimed row (user_id set)
  EXECUTE 'SET LOCAL ROLE anon';
  got := public.architect_saved_files_get(uid_a::text, 'sim058-auth');
  IF got IS NULL THEN pass := pass + 1; log := log || ' ok:anon-cannot-read-claimed';
  ELSE fail := fail + 1; log := log || ' FAIL:anon-cannot-read-claimed'; END IF;

  refused := false;
  BEGIN
    PERFORM public.architect_saved_files_put(uid_a::text, 'sim058-auth', '{"n":4}'::jsonb, null);
  EXCEPTION WHEN insufficient_privilege OR others THEN
    IF SQLSTATE = '42501' THEN refused := true; END IF;
  END;
  IF refused THEN pass := pass + 1; log := log || ' ok:anon-cannot-put-claimed';
  ELSE fail := fail + 1; log := log || ' FAIL:anon-cannot-put-claimed'; END IF;

  EXECUTE 'RESET ROLE';

  -- 7 · table still deny-all for anon (no direct select)
  EXECUTE 'SET LOCAL ROLE anon';
  refused := false;
  BEGIN
    PERFORM 1 FROM public.architect_saved_files LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN refused := true;
  END;
  -- With RLS + no policy, SELECT may return 0 rows rather than raise — both OK if no data leaks.
  IF refused OR NOT FOUND THEN
    pass := pass + 1; log := log || ' ok:table-deny-or-empty';
  ELSE
    -- If SELECT succeeded and returned a row, fail
    fail := fail + 1; log := log || ' FAIL:table-readable';
  END IF;
  EXECUTE 'RESET ROLE';

  RAISE EXCEPTION 'SIM058 RESULT pass=% fail=% |%', pass, fail, log;
END;
$sim$;
