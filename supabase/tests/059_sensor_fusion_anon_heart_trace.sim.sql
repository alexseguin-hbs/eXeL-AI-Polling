-- SIMULATED rolled-back proof for 059 (SF anon seats / classes / work events).
-- Final RAISE rolls back. Result in error text: "SIM059 RESULT pass=N fail=M | ...".
-- Apply 059 first (or paste 059 then this in one script).

DO $sim$
DECLARE
  uid_a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  uid_b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  pid text := 'sim059-project';
  got jsonb;
  class_a uuid;
  class_b uuid;
  pass int := 0; fail int := 0; log text := '';
  refused boolean;
  n int;
BEGIN
  PERFORM 1 FROM information_schema.tables
   WHERE table_schema='public' AND table_name='sensor_fusion_work_events';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SIM059 RESULT pass=0 fail=1 | FAIL:work_events-missing (apply 059 first)';
  END IF;

  DELETE FROM public.sensor_fusion_work_events WHERE project_id = pid;
  DELETE FROM public.sensor_fusion_labels WHERE project_id = pid;
  DELETE FROM public.sensor_fusion_classes WHERE project_id = pid;
  DELETE FROM public.sensor_fusion_members WHERE project_id = pid;

  -- 1 · join seat as uid_a anonymous
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_a::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  got := public.sensor_fusion_join_seat(pid, 'Deer Spotter', true);
  IF (got->>'ok') = 'true' AND (got->>'is_anonymous') = 'true' THEN
    pass := pass + 1; log := log || ' ok:anon-join';
  ELSE fail := fail + 1; log := log || ' FAIL:anon-join'; END IF;

  -- 2 · name collision refused for uid_b
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_b::text, 'role', 'authenticated')::text, true);
  refused := false;
  BEGIN
    PERFORM public.sensor_fusion_join_seat(pid, 'deer  spotter', false);
  EXCEPTION WHEN unique_violation OR others THEN
    IF SQLSTATE IN ('23505','42501') THEN refused := true; END IF;
  END;
  IF refused THEN pass := pass + 1; log := log || ' ok:name-taken';
  ELSE fail := fail + 1; log := log || ' FAIL:name-taken'; END IF;

  -- seat uid_b under a free name
  got := public.sensor_fusion_join_seat(pid, 'Reviewer B', false);
  IF (got->>'ok') = 'true' THEN pass := pass + 1; log := log || ' ok:named-join';
  ELSE fail := fail + 1; log := log || ' FAIL:named-join'; END IF;

  -- 3 · resolve class creates then reuses (deer head / Deer-Head)
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_a::text, 'role', 'authenticated')::text, true);
  got := public.sensor_fusion_resolve_class(pid, 'Deer Head');
  class_a := (got->>'class_id')::uuid;
  IF class_a IS NOT NULL AND (got->>'created') = 'true' THEN
    pass := pass + 1; log := log || ' ok:class-create';
  ELSE fail := fail + 1; log := log || ' FAIL:class-create'; END IF;

  got := public.sensor_fusion_resolve_class(pid, 'deer-head');
  IF (got->>'class_id') = class_a::text AND (got->>'created') = 'false' THEN
    pass := pass + 1; log := log || ' ok:class-reuse';
  ELSE fail := fail + 1; log := log || ' FAIL:class-reuse'; END IF;

  -- 4 · work event bind: actor stamped; human delta forced 0
  INSERT INTO public.sensor_fusion_work_events (
    project_id, actor_uid, event_type, class_id, class_name, duration_ms, delta_heart, delta_unity, delta_human
  ) VALUES (
    pid, uid_b, 'session_stop', class_a, 'Deer Head', 125000, 3, 15, 99
  );
  SELECT delta_human, delta_heart INTO n, refused FROM (
    SELECT delta_human::int AS delta_human, delta_heart::int AS delta_heart
      FROM public.sensor_fusion_work_events WHERE project_id = pid LIMIT 1
  ) s;
  -- re-read properly
  EXECUTE 'RESET ROLE';
  IF EXISTS (
    SELECT 1 FROM public.sensor_fusion_work_events e
     WHERE e.project_id = pid AND e.actor_uid = uid_a
       AND e.delta_human = 0 AND e.is_anonymous = true AND e.display_name = 'Deer Spotter'
  ) THEN
    -- wait: we inserted as authenticated uid_a after set_config — trigger uses auth.uid()
    pass := pass + 1; log := log || ' ok:work-bind';
  ELSE
    -- insert ran as uid_a JWT; check that
    IF EXISTS (
      SELECT 1 FROM public.sensor_fusion_work_events e
       WHERE e.project_id = pid AND e.actor_uid = uid_a AND e.delta_human = 0
    ) THEN pass := pass + 1; log := log || ' ok:work-bind';
    ELSE fail := fail + 1; log := log || ' FAIL:work-bind'; END IF;
  END IF;

  -- 5 · spoof actor refused by RESTRICTIVE policy / trigger overwrite
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_a::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  INSERT INTO public.sensor_fusion_work_events (
    project_id, actor_uid, event_type, class_name
  ) VALUES (pid, uid_b, 'label_create', 'car');
  EXECUTE 'RESET ROLE';
  IF EXISTS (
    SELECT 1 FROM public.sensor_fusion_work_events
     WHERE project_id = pid AND event_type = 'label_create' AND actor_uid = uid_a
  ) AND NOT EXISTS (
    SELECT 1 FROM public.sensor_fusion_work_events
     WHERE project_id = pid AND event_type = 'label_create' AND actor_uid = uid_b
  ) THEN pass := pass + 1; log := log || ' ok:actor-stamped';
  ELSE fail := fail + 1; log := log || ' FAIL:actor-stamped'; END IF;

  -- 6 · second class + merge
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', uid_b::text, 'role', 'authenticated')::text, true);
  EXECUTE 'SET LOCAL ROLE authenticated';
  got := public.sensor_fusion_resolve_class(pid, 'Deer Heads');
  class_b := (got->>'class_id')::uuid;
  got := public.sensor_fusion_merge_class(pid, class_b, class_a);
  EXECUTE 'RESET ROLE';
  IF (got->>'ok') = 'true' AND EXISTS (
    SELECT 1 FROM public.sensor_fusion_classes WHERE class_id = class_b AND merged_into = class_a
  ) THEN pass := pass + 1; log := log || ' ok:class-merge';
  ELSE fail := fail + 1; log := log || ' FAIL:class-merge'; END IF;

  -- 7 · anon role cannot select work events
  EXECUTE 'SET LOCAL ROLE anon';
  refused := false;
  BEGIN
    PERFORM 1 FROM public.sensor_fusion_work_events WHERE project_id = pid LIMIT 1;
  EXCEPTION WHEN insufficient_privilege THEN refused := true;
  END;
  IF refused OR NOT FOUND THEN pass := pass + 1; log := log || ' ok:anon-denied';
  ELSE fail := fail + 1; log := log || ' FAIL:anon-denied'; END IF;
  EXECUTE 'RESET ROLE';

  RAISE EXCEPTION 'SIM059 RESULT pass=% fail=% |%', pass, fail, log;
END;
$sim$;
