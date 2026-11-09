-- 059 · SensorFusion-2525: anonymous seats, shared class list, append-only work events + ♡ time credit.
-- CRS-05.04, CRS-08.04–08.06, CRS-19.07–19.08, CRS-24.03, CRS-25.02, CRS-32.04 (dated 2026-11-09).
-- Additive only. RLS on. Preserves 040–054 invariants (uid binding, member_key uniqueness, no client INSERT on members except via join RPC).
-- ♡/◬ reuse Cube 5: ♡=ceil(minutes), ◬=5×♡, 웃=0 while human_enabled=false. No per-box ♡ rate.
-- Applied live: ONLY after merge. SIM: supabase/tests/059_sensor_fusion_anon_heart_trace.sim.sql.

-- 1 · seat anonymity flag
ALTER TABLE public.sensor_fusion_members
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN NOT NULL DEFAULT false;

-- 2 · shared project class list (CRS-08.04 / 08.05)
CREATE TABLE IF NOT EXISTS public.sensor_fusion_classes (
  class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  name_key TEXT NOT NULL,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_by_uid UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  merged_into UUID REFERENCES public.sensor_fusion_classes(class_id),
  CONSTRAINT sensor_fusion_classes_name_len CHECK (char_length(canonical_name) BETWEEN 1 AND 64)
);

CREATE UNIQUE INDEX IF NOT EXISTS sensor_fusion_classes_project_key
  ON public.sensor_fusion_classes (project_id, name_key)
  WHERE merged_into IS NULL;

CREATE INDEX IF NOT EXISTS sensor_fusion_classes_project_use
  ON public.sensor_fusion_classes (project_id, use_count DESC);

ALTER TABLE public.sensor_fusion_classes ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sensor_fusion_classes FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.sensor_fusion_classes TO authenticated;
GRANT ALL ON TABLE public.sensor_fusion_classes TO service_role;

DROP POLICY IF EXISTS "Members read project classes" ON public.sensor_fusion_classes;
CREATE POLICY "Members read project classes"
  ON public.sensor_fusion_classes FOR SELECT TO authenticated
  USING (public.sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "Members add project classes" ON public.sensor_fusion_classes;
CREATE POLICY "Members add project classes"
  ON public.sensor_fusion_classes FOR INSERT TO authenticated
  WITH CHECK (
    public.sensor_fusion_is_member(project_id)
    AND (created_by_uid IS NULL OR created_by_uid = auth.uid())
  );

DROP POLICY IF EXISTS "Members bump class use_count" ON public.sensor_fusion_classes;
CREATE POLICY "Members bump class use_count"
  ON public.sensor_fusion_classes FOR UPDATE TO authenticated
  USING (public.sensor_fusion_is_member(project_id))
  WITH CHECK (public.sensor_fusion_is_member(project_id));

-- class name_key helper (match key only; mirrors frontend classNameKey)
CREATE OR REPLACE FUNCTION public.sensor_fusion_class_key(raw TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(
      regexp_replace(
        regexp_replace(
          lower(btrim(COALESCE(raw, ''))),
          '[\s_\-]+', '', 'g'
        ),
        '[^a-z0-9]', '', 'g'
      ),
      ''
    ),
    'unnamed'
  );
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_class_key(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sensor_fusion_class_key(TEXT) TO authenticated, service_role;

-- optional FK from labels → classes (nullable; free-text name preserved)
ALTER TABLE public.sensor_fusion_labels
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES public.sensor_fusion_classes(class_id);

-- 3 · append-only work events (CRS-19.07/19.08, CRS-24.03, CRS-25.02, CRS-32.04)
CREATE TABLE IF NOT EXISTS public.sensor_fusion_work_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  actor_uid UUID NOT NULL,
  display_name TEXT,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  picture_id TEXT,
  label_id UUID,
  event_type TEXT NOT NULL
    CHECK (event_type IN (
      'label_create','label_edit','correction','review_l2',
      'class_merge','session_start','session_stop','class_reuse','class_create'
    )),
  class_id UUID,
  class_name TEXT,
  before_box JSONB,
  after_box JSONB,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  time_entry_id TEXT,
  delta_heart NUMERIC(12,4) NOT NULL DEFAULT 0,
  delta_unity NUMERIC(12,4) NOT NULL DEFAULT 0,
  delta_human NUMERIC(12,4) NOT NULL DEFAULT 0,
  ledger_row_id TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS sensor_fusion_work_events_project_at
  ON public.sensor_fusion_work_events (project_id, at DESC);
CREATE INDEX IF NOT EXISTS sensor_fusion_work_events_actor_at
  ON public.sensor_fusion_work_events (actor_uid, at DESC);

ALTER TABLE public.sensor_fusion_work_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sensor_fusion_work_events FROM anon;
-- append-only: SELECT + INSERT; no UPDATE/DELETE for authenticated
GRANT SELECT, INSERT ON TABLE public.sensor_fusion_work_events TO authenticated;
GRANT ALL ON TABLE public.sensor_fusion_work_events TO service_role;

DROP POLICY IF EXISTS "Members read project work events" ON public.sensor_fusion_work_events;
CREATE POLICY "Members read project work events"
  ON public.sensor_fusion_work_events FOR SELECT TO authenticated
  USING (public.sensor_fusion_is_member(project_id));

DROP POLICY IF EXISTS "Members append own work events" ON public.sensor_fusion_work_events;
CREATE POLICY "Members append own work events"
  ON public.sensor_fusion_work_events
  AS RESTRICTIVE
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_uid = auth.uid()
    AND public.sensor_fusion_is_member(project_id)
  );

-- permissive twin so RESTRICTIVE AND membership both apply
DROP POLICY IF EXISTS "Members may insert work events in project" ON public.sensor_fusion_work_events;
CREATE POLICY "Members may insert work events in project"
  ON public.sensor_fusion_work_events
  FOR INSERT TO authenticated
  WITH CHECK (public.sensor_fusion_is_member(project_id));

-- stamp actor_uid = auth.uid(); refuse spoof
CREATE OR REPLACE FUNCTION public.sensor_fusion_work_event_bind()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
  seat_name TEXT;
  seat_anon BOOLEAN;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'sensor_fusion: work events require auth.uid()' USING ERRCODE = '42501';
  END IF;
  NEW.actor_uid := me;
  SELECT m.display_name, m.is_anonymous INTO seat_name, seat_anon
    FROM public.sensor_fusion_members m
   WHERE m.project_id = NEW.project_id AND m.member_id = me;
  IF seat_name IS NOT NULL THEN
    NEW.display_name := seat_name;
  END IF;
  IF seat_anon IS NOT NULL THEN
    NEW.is_anonymous := seat_anon;
  END IF;
  -- 웃 remains 0 while H.I. unfunded (CRS-25.02); callers should send 0; force here too
  NEW.delta_human := 0;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_work_event_bind() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sensor_fusion_work_event_bind() FROM anon, authenticated;

DROP TRIGGER IF EXISTS sensor_fusion_work_event_bind ON public.sensor_fusion_work_events;
CREATE TRIGGER sensor_fusion_work_event_bind
  BEFORE INSERT ON public.sensor_fusion_work_events
  FOR EACH ROW EXECUTE FUNCTION public.sensor_fusion_work_event_bind();

-- 4 · anonymous / named seat join RPC (CRS-05.04) — no client INSERT on members table
CREATE OR REPLACE FUNCTION public.sensor_fusion_join_seat(
  p_project_id TEXT,
  p_display_name TEXT,
  p_is_anonymous BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
  canon TEXT;
  existing_uid UUID;
  existing_name TEXT;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'sensor_fusion_join_seat: sign in required' USING ERRCODE = '42501';
  END IF;
  IF p_project_id IS NULL OR length(btrim(p_project_id)) < 1 OR length(p_project_id) > 128 THEN
    RAISE EXCEPTION 'sensor_fusion_join_seat: invalid project' USING ERRCODE = '22023';
  END IF;
  canon := NULLIF(btrim(p_display_name), '');
  IF canon IS NULL OR length(canon) > 64 THEN
    RAISE EXCEPTION 'sensor_fusion_join_seat: invalid display name' USING ERRCODE = '22023';
  END IF;

  -- already seated?
  SELECT member_id, display_name INTO existing_uid, existing_name
    FROM public.sensor_fusion_members
   WHERE project_id = p_project_id AND member_id = me;
  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'project_id', p_project_id,
      'member_id', me,
      'display_name', existing_name,
      'is_anonymous', (SELECT is_anonymous FROM public.sensor_fusion_members WHERE project_id = p_project_id AND member_id = me),
      'already', true
    );
  END IF;

  -- name collision (case/spacing independent)
  IF EXISTS (
    SELECT 1 FROM public.sensor_fusion_members m
     WHERE m.project_id = p_project_id
       AND public.sensor_fusion_member_key(m.display_name) = public.sensor_fusion_member_key(canon)
  ) THEN
    RAISE EXCEPTION 'sensor_fusion_join_seat: display name taken' USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.sensor_fusion_members (project_id, member_id, display_name, is_anonymous)
  VALUES (p_project_id, me, canon, COALESCE(p_is_anonymous, false));

  RETURN jsonb_build_object(
    'ok', true,
    'project_id', p_project_id,
    'member_id', me,
    'display_name', canon,
    'is_anonymous', COALESCE(p_is_anonymous, false),
    'already', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_join_seat(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sensor_fusion_join_seat(TEXT, TEXT, BOOLEAN) TO authenticated, service_role;

-- 5 · resolve-or-create class (reuse first)
CREATE OR REPLACE FUNCTION public.sensor_fusion_resolve_class(
  p_project_id TEXT,
  p_canonical_name TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
  k TEXT;
  row_id UUID;
  row_name TEXT;
  created BOOLEAN := false;
BEGIN
  IF me IS NULL OR NOT public.sensor_fusion_is_member(p_project_id) THEN
    RAISE EXCEPTION 'sensor_fusion_resolve_class: member required' USING ERRCODE = '42501';
  END IF;
  IF p_canonical_name IS NULL OR length(btrim(p_canonical_name)) < 1 THEN
    RAISE EXCEPTION 'sensor_fusion_resolve_class: empty name' USING ERRCODE = '22023';
  END IF;
  k := public.sensor_fusion_class_key(p_canonical_name);

  SELECT class_id, canonical_name INTO row_id, row_name
    FROM public.sensor_fusion_classes
   WHERE project_id = p_project_id AND name_key = k AND merged_into IS NULL
   LIMIT 1;

  IF row_id IS NULL THEN
    INSERT INTO public.sensor_fusion_classes (project_id, canonical_name, name_key, use_count, created_by_uid)
    VALUES (p_project_id, btrim(p_canonical_name), k, 1, me)
    RETURNING class_id, canonical_name INTO row_id, row_name;
    created := true;
  ELSE
    UPDATE public.sensor_fusion_classes
       SET use_count = use_count + 1
     WHERE class_id = row_id;
  END IF;

  RETURN jsonb_build_object(
    'class_id', row_id,
    'canonical_name', row_name,
    'name_key', k,
    'created', created
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_resolve_class(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sensor_fusion_resolve_class(TEXT, TEXT) TO authenticated, service_role;

-- 6 · class merge (CRS-08.06) — moderator/member; append work event expected from client
CREATE OR REPLACE FUNCTION public.sensor_fusion_merge_class(
  p_project_id TEXT,
  p_from_class UUID,
  p_into_class UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
  from_key TEXT;
  into_key TEXT;
BEGIN
  IF me IS NULL OR NOT public.sensor_fusion_is_member(p_project_id) THEN
    RAISE EXCEPTION 'sensor_fusion_merge_class: member required' USING ERRCODE = '42501';
  END IF;
  IF p_from_class IS NULL OR p_into_class IS NULL OR p_from_class = p_into_class THEN
    RAISE EXCEPTION 'sensor_fusion_merge_class: invalid ids' USING ERRCODE = '22023';
  END IF;

  SELECT name_key INTO from_key FROM public.sensor_fusion_classes
   WHERE class_id = p_from_class AND project_id = p_project_id AND merged_into IS NULL;
  SELECT name_key INTO into_key FROM public.sensor_fusion_classes
   WHERE class_id = p_into_class AND project_id = p_project_id AND merged_into IS NULL;
  IF from_key IS NULL OR into_key IS NULL THEN
    RAISE EXCEPTION 'sensor_fusion_merge_class: class not found' USING ERRCODE = '22023';
  END IF;

  UPDATE public.sensor_fusion_labels
     SET class_id = p_into_class
   WHERE project_id = p_project_id AND class_id = p_from_class;

  UPDATE public.sensor_fusion_classes
     SET merged_into = p_into_class,
         use_count = 0
   WHERE class_id = p_from_class AND project_id = p_project_id;

  UPDATE public.sensor_fusion_classes c
     SET use_count = use_count + COALESCE((
       SELECT COUNT(*)::int FROM public.sensor_fusion_labels l
        WHERE l.project_id = p_project_id AND l.class_id = p_into_class
     ), 0)
   WHERE c.class_id = p_into_class;

  RETURN jsonb_build_object(
    'ok', true,
    'from_class_id', p_from_class,
    'into_class_id', p_into_class,
    'from_key', from_key,
    'into_key', into_key
  );
END;
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_merge_class(TEXT, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sensor_fusion_merge_class(TEXT, UUID, UUID) TO authenticated, service_role;
