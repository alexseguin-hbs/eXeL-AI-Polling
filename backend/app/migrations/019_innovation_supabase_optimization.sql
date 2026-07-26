-- Migration 019: Supabase optimization for the Innovation / API-first / polling hot paths
-- Run in Supabase SQL Editor. Version: 2026.07.26
--
-- Idempotent + table-guarded: every block checks to_regclass first, so applying this against
-- a database that is missing any table is safe (the block is skipped, the batch continues).
-- Mirrors the ORM composite indexes (usage_records, scoping, api_keys, webhooks) so the same
-- performance holds whether tables were created via ORM create_all or raw SQL migrations, and
-- adds indexes for the read-heavy polling + dataset paths that had none.
--
-- 12 Ascended Masters SSSES audit → optimization:
--   Thoth (analytics):  composite indexes on every org+time and session aggregation path
--   Thor  (security):   API-key hash/prefix lookups indexed (no full scan on auth)
--   Enlil (build):      idempotent + guarded so re-runs and partial schemas never abort
--   Krishna (integ.):   responses/feedback polling indexes for the Trinity + risk market

-- ═══ Usage metering — GET /usage summarize by org+metric+time, session-scoped billing ═══
DO $$ BEGIN
  IF to_regclass('public.usage_records') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_usage_org_metric_time ON usage_records(org_id, metric, occurred_at);
    CREATE INDEX IF NOT EXISTS ix_usage_session ON usage_records(session_id);
  END IF;
END $$;

-- ═══ Scoping tree — Project → Differentiator → Specification subtree reads ═══
DO $$ BEGIN
  IF to_regclass('public.projects') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_projects_org_status ON projects(org_id, status);
  END IF;
  IF to_regclass('public.differentiators') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_differentiators_project ON differentiators(project_id, status);
  END IF;
  IF to_regclass('public.specifications') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_specifications_differentiator ON specifications(differentiator_id, status);
  END IF;
END $$;

-- ═══ API keys — dual-auth path (authenticate by hash, list by org, prefix lookup) ═══
DO $$ BEGIN
  IF to_regclass('public.api_keys') IS NOT NULL THEN
    CREATE UNIQUE INDEX IF NOT EXISTS ux_api_keys_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS ix_api_keys_org_active ON api_keys(org_id, is_active);
    CREATE INDEX IF NOT EXISTS ix_api_keys_prefix ON api_keys(key_prefix);
  END IF;
END $$;

-- ═══ Webhooks — fan-out per session + delivery status sweep ═══
DO $$ BEGIN
  IF to_regclass('public.webhook_subscriptions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_webhook_sub_session ON webhook_subscriptions(session_id);
    CREATE INDEX IF NOT EXISTS ix_webhook_sub_active ON webhook_subscriptions(is_active);
  END IF;
  IF to_regclass('public.webhook_deliveries') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_webhook_del_sub ON webhook_deliveries(subscription_id);
    CREATE INDEX IF NOT EXISTS ix_webhook_del_status ON webhook_deliveries(status);
  END IF;
END $$;

-- ═══ Product feedback — Cube 10 FB loop + Innovation risk poll (stats by cube, recency) ═══
DO $$ BEGIN
  IF to_regclass('public.product_feedback') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_product_feedback_cube ON product_feedback(cube_id);
    CREATE INDEX IF NOT EXISTS ix_product_feedback_created_desc ON product_feedback(created_at DESC);
  END IF;
END $$;

-- ═══ Responses — Trinity live-delivery + REST poll (session_code + recency is the hot read) ═══
DO $$ BEGIN
  IF to_regclass('public.responses') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_responses_session_created ON responses(session_code, created_at);
  END IF;
END $$;

-- ═══ Sim datasets — dataset_source loader: WHERE dataset_name ORDER BY row_index ═══
DO $$ BEGIN
  IF to_regclass('public.sim_datasets') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS ix_sim_datasets_name_row ON sim_datasets(dataset_name, row_index);
  END IF;
END $$;

-- ═══ Refresh planner statistics on the touched tables (cheap, improves plans immediately) ═══
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'usage_records','projects','differentiators','specifications','api_keys',
    'webhook_subscriptions','webhook_deliveries','product_feedback','responses','sim_datasets'
  ] LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE 'ANALYZE ' || quote_ident(t);
    END IF;
  END LOOP;
END $$;
