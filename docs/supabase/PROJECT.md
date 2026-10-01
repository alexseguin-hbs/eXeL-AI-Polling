# Supabase project — connection record (operator 2026-10-01, 7:25 AM, after the restore)

Saved verbatim from the operator's message. Only PUBLIC values live here: the project URL and the publishable key are
designed to ship in the browser. The database password is NOT stored (the connection string keeps its placeholder); it
belongs in the GitHub secret `SUPABASE_DB_URL` only.

| Item | Value |
|---|---|
| Project | eXeL-AI-Polling · ref `ppgfjplawtlrfqpnszyb` · org alexseguin-hbs (FREE) · branch main (PRODUCTION) |
| Region / compute | East US (Ohio) · us-east-2 · t4g.nano (NANO) |
| Project URL | https://ppgfjplawtlrfqpnszyb.supabase.co |
| Publishable key | `sb_publishable_OuwQNsFT59F2vzlaXnLIhg_7XrzeY2z` |
| Direct connection string | `postgresql://postgres:[YOUR-PASSWORD]@db.ppgfjplawtlrfqpnszyb.supabase.co:5432/postgres` |

CLI setup:
```
supabase login
supabase init
supabase link --project-ref ppgfjplawtlrfqpnszyb
```

State at save: restored by the operator 2026-10-01 ~7:22 AM CDT, status "Coming up…". Paused 2026-09-30 after 7 idle days
(free tier); `.github/workflows/supabase-keepalive.yml` now queries it twice a day so that never recurs.
Screenshots: `docs/supabase/2026-10-01_restore_status.png`, `docs/supabase/2026-10-01_connect_menu.png`.
