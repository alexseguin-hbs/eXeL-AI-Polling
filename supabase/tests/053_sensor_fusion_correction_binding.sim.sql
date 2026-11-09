-- SIMULATED database proof for 053 (no real users). Two throwaway seats exist only inside this
-- transaction; the final RAISE rolls everything back, so nothing is left behind. Result is in the error text:
-- "SIM053 RESULT pass=N fail=M | ...". Run after 053 is applied (or after it in the same script for a dry run).
DO $sim$
DECLARE
  a UUID := gen_random_uuid();
  b UUID := gen_random_uuid();
  c UUID := gen_random_uuid();
  lid UUID;
  got_by TEXT; got_uid UUID; got_lab TEXT;
  pass INT := 0; fail INT := 0; log TEXT := '';
  refused BOOLEAN;
  proj CONSTANT TEXT := 'sim-053-rollback';
BEGIN
  INSERT INTO public.sensor_fusion_members (project_id, member_id, display_name)
  VALUES (proj, a, 'Sim Tester A'), (proj, b, 'Sim Tester B');
  INSERT INTO public.sensor_fusion_labels (owner_key, picture_id, name, x1, y1, x2, y2, project_id, level, labeled_by)
  VALUES (a::text, 'sim_0001.png', 'deer', 1, 1, 10, 10, proj, 1, 'Sim Tester A') RETURNING id INTO lid;

  -- Two seats cannot share a name in different case.
  refused := false;
  BEGIN
    INSERT INTO public.sensor_fusion_members (project_id, member_id, display_name) VALUES (proj, c, 'SIM  tester a');
  EXCEPTION WHEN unique_violation THEN refused := true; END;
  IF refused THEN pass := pass + 1; log := log || ' ok:dup-seat-name'; ELSE fail := fail + 1; log := log || ' FAIL:dup-seat-name'; END IF;

  EXECUTE 'SET LOCAL ROLE authenticated';

  -- As member B.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  -- B files under A's name -> refused.
  refused := false;
  BEGIN
    INSERT INTO public.sensor_fusion_label_corrections (project_id, picture_id, label_id, corrected_by, kind, from_box, to_box)
    VALUES (proj, 'sim_0001.png', lid, 'Sim Tester A', 'adjust', '{}', '{}');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN refused := true; END;
  IF refused THEN pass := pass + 1; log := log || ' ok:spoof-name'; ELSE fail := fail + 1; log := log || ' FAIL:spoof-name'; END IF;

  -- B sends A's uid -> stored uid is B's own.
  INSERT INTO public.sensor_fusion_label_corrections (project_id, picture_id, label_id, corrected_by, corrected_by_uid, kind, from_box, to_box)
  VALUES (proj, 'sim_0001.png', lid, 'sim tester b', a, 'adjust', '{"x":1}', '{"x":2}')
  RETURNING corrected_by, corrected_by_uid, labeled_by INTO got_by, got_uid, got_lab;
  IF got_uid = b AND got_by = 'Sim Tester B' AND got_lab = 'Sim Tester A' THEN pass := pass + 1; log := log || ' ok:uid-bound+independent-allowed';
  ELSE fail := fail + 1; log := log || ' FAIL:uid-bound uid=' || coalesce(got_uid::text,'null') || ' by=' || coalesce(got_by,'null'); END IF;

  -- As member A (the labeler).
  PERFORM set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);

  -- Self-review, different case/spacing, labeled_by omitted -> refused.
  refused := false;
  BEGIN
    INSERT INTO public.sensor_fusion_label_corrections (project_id, picture_id, label_id, corrected_by, kind, from_box, to_box)
    VALUES (proj, 'sim_0001.png', lid, '  SIM tester   A ', 'reject', '{}', '{}');
  EXCEPTION WHEN check_violation THEN refused := true; END;
  IF refused THEN pass := pass + 1; log := log || ' ok:self-review-case'; ELSE fail := fail + 1; log := log || ' FAIL:self-review-case'; END IF;

  -- Self-review on a label row (reviewed_by = labeled_by in another case) -> refused.
  refused := false;
  BEGIN
    INSERT INTO public.sensor_fusion_labels (owner_key, picture_id, name, x1, y1, x2, y2, project_id, level, labeled_by, reviewed_by)
    VALUES (a::text, 'sim_0001.png', 'deer', 1, 1, 10, 10, proj, 2, 'Sim Tester A', 'SIM TESTER A ');
  EXCEPTION WHEN check_violation THEN refused := true; END;
  IF refused THEN pass := pass + 1; log := log || ' ok:label-self-review-case'; ELSE fail := fail + 1; log := log || ' FAIL:label-self-review-case'; END IF;

  -- Not a member -> refused.
  PERFORM set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  refused := false;
  BEGIN
    INSERT INTO public.sensor_fusion_label_corrections (project_id, picture_id, corrected_by, kind, from_box, to_box)
    VALUES (proj, 'sim_0001.png', 'Nobody', 'adjust', '{}', '{}');
  EXCEPTION WHEN insufficient_privilege OR check_violation THEN refused := true; END;
  IF refused THEN pass := pass + 1; log := log || ' ok:non-member'; ELSE fail := fail + 1; log := log || ' FAIL:non-member'; END IF;

  EXECUTE 'RESET ROLE';
  PERFORM set_config('request.jwt.claims', '', true);

  -- Server path (no auth.uid()) still cannot write a same-person correction in another case.
  refused := false;
  BEGIN
    INSERT INTO public.sensor_fusion_label_corrections (project_id, picture_id, corrected_by, labeled_by, kind, from_box, to_box)
    VALUES (proj, 'sim_0001.png', 'ANN', 'ann', 'adjust', '{}', '{}');
  EXCEPTION WHEN check_violation THEN refused := true; END;
  IF refused THEN pass := pass + 1; log := log || ' ok:server-case'; ELSE fail := fail + 1; log := log || ' FAIL:server-case'; END IF;

  RAISE EXCEPTION 'SIM053 RESULT pass=% fail=% |%', pass, fail, log;
END
$sim$;
