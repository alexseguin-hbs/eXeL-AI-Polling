-- 053 SensorFusion-2525: every Level-2 correction is bound to the signed-in member, and every
-- "different person" check ignores case and spacing. MoT decision B (2026-11-09).
-- Applied live 2026-11-09 07:18 CST as migration sensor_fusion_correction_binding (history version 20261109131819); SIMULATED rolled-back proof 7/7.
-- Closes the 044 gap: the corrections INSERT policy (044 lines 106-109) checked membership only, so a
-- member could file a correction under someone else's name; 044's corrected_by <> labeled_by was case-sensitive.
-- Additive only: new columns, functions, triggers, one RESTRICTIVE policy, new CHECK constraints.
-- Nothing in 040-045 is dropped or rewritten, so every existing rule still applies on top of these.
-- Idempotent: safe to re-run.

-- 1. One canonical member key. Mirrors memberName() in frontend/lib/sensor-fusion/workflow.ts:
--    upper-case, keep A-Z 0-9 space . _ -, collapse spaces, trim; empty becomes GUEST.
CREATE OR REPLACE FUNCTION public.sensor_fusion_member_key(raw TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT COALESCE(
    NULLIF(btrim(regexp_replace(regexp_replace(upper(COALESCE(raw, 'guest')), '[^A-Z0-9 ._-]', '', 'g'), '\s+', ' ', 'g')), ''),
    'GUEST'
  );
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_member_key(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sensor_fusion_member_key(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.sensor_fusion_member_key(TEXT) TO authenticated, service_role;

-- 2. A seat carries the member's name. Set by the server only (sensor_fusion_members has no write policy).
--    Two seats in one project cannot share a name, in any case or spacing.
ALTER TABLE public.sensor_fusion_members ADD COLUMN IF NOT EXISTS display_name TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS sensor_fusion_members_display_key
  ON public.sensor_fusion_members (project_id, public.sensor_fusion_member_key(display_name))
  WHERE display_name IS NOT NULL;

-- 3. Who actually filed the correction / shared the label (auth uid, not a typed name).
ALTER TABLE public.sensor_fusion_label_corrections ADD COLUMN IF NOT EXISTS corrected_by_uid UUID DEFAULT auth.uid();
ALTER TABLE public.sensor_fusion_labels ADD COLUMN IF NOT EXISTS inserted_by_uid UUID DEFAULT auth.uid();

-- 4. Bind a correction to the caller before it is written.
--    - corrected_by_uid is always the caller's uid (a client-supplied uid is overwritten).
--    - corrected_by must be the caller's own seat name (any case/spacing) and is stored as that seat name.
--    - when label_id points at a label in this project, labeled_by is taken from that label, so omitting
--      or misspelling labeled_by cannot skip the independence check.
--    Server-side writes (no auth.uid()) keep their values; the CHECK constraints below still apply to them.
CREATE OR REPLACE FUNCTION public.sensor_fusion_correction_bind()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
  seat_name TEXT;
  label_project TEXT;
  label_by TEXT;
BEGIN
  IF me IS NULL THEN
    RETURN NEW;
  END IF;
  NEW.corrected_by_uid := me;

  SELECT m.display_name INTO seat_name
    FROM public.sensor_fusion_members m
   WHERE m.project_id = NEW.project_id AND m.member_id = me;
  IF seat_name IS NULL THEN
    RAISE EXCEPTION 'sensor_fusion: a named seat in this project is required to file a correction'
      USING ERRCODE = '42501';
  END IF;
  IF public.sensor_fusion_member_key(NEW.corrected_by) <> public.sensor_fusion_member_key(seat_name) THEN
    RAISE EXCEPTION 'sensor_fusion: a correction can only be filed under your own member name'
      USING ERRCODE = '42501';
  END IF;
  NEW.corrected_by := seat_name;

  IF NEW.label_id IS NOT NULL THEN
    SELECT l.project_id, l.labeled_by INTO label_project, label_by
      FROM public.sensor_fusion_labels l
     WHERE l.id = NEW.label_id;
    IF FOUND THEN
      IF label_project IS DISTINCT FROM NEW.project_id THEN
        RAISE EXCEPTION 'sensor_fusion: the corrected label belongs to another project'
          USING ERRCODE = '42501';
      END IF;
      IF label_by IS NOT NULL THEN
        NEW.labeled_by := label_by;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_correction_bind() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sensor_fusion_correction_bind() FROM anon, authenticated;

DROP TRIGGER IF EXISTS sensor_fusion_correction_bind ON public.sensor_fusion_label_corrections;
CREATE TRIGGER sensor_fusion_correction_bind
  BEFORE INSERT ON public.sensor_fusion_label_corrections
  FOR EACH ROW EXECUTE FUNCTION public.sensor_fusion_correction_bind();

-- 5. Stamp who shared each label (informational provenance; the label rules from 042/044 are unchanged).
CREATE OR REPLACE FUNCTION public.sensor_fusion_label_stamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.inserted_by_uid := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.sensor_fusion_label_stamp() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sensor_fusion_label_stamp() FROM anon, authenticated;

DROP TRIGGER IF EXISTS sensor_fusion_label_stamp ON public.sensor_fusion_labels;
CREATE TRIGGER sensor_fusion_label_stamp
  BEFORE INSERT ON public.sensor_fusion_labels
  FOR EACH ROW EXECUTE FUNCTION public.sensor_fusion_label_stamp();

-- 6. RESTRICTIVE: ANDed with the 044 membership policy. A signed-in member can only append a correction
--    whose corrected_by_uid is their own uid.
DROP POLICY IF EXISTS "Corrections are filed as the signed-in member" ON public.sensor_fusion_label_corrections;
CREATE POLICY "Corrections are filed as the signed-in member"
  ON public.sensor_fusion_label_corrections
  AS RESTRICTIVE
  FOR INSERT
  TO authenticated
  WITH CHECK (corrected_by_uid = auth.uid());

-- 7. Independence ignores case and spacing (044 compared corrections case-sensitively; labels used lower() only).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensor_fusion_correction_independent_ci') THEN
    ALTER TABLE public.sensor_fusion_label_corrections
      ADD CONSTRAINT sensor_fusion_correction_independent_ci
      CHECK (
        labeled_by IS NULL
        OR public.sensor_fusion_member_key(corrected_by) <> public.sensor_fusion_member_key(labeled_by)
      );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sensor_fusion_labels_independent_reviewer_ci') THEN
    ALTER TABLE public.sensor_fusion_labels
      ADD CONSTRAINT sensor_fusion_labels_independent_reviewer_ci
      CHECK (
        reviewed_by IS NULL
        OR labeled_by IS NULL
        OR public.sensor_fusion_member_key(reviewed_by) <> public.sensor_fusion_member_key(labeled_by)
      );
  END IF;
END $$;
