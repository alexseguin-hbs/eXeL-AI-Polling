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

## GitHub integration (operator 2026-10-01 7:28 AM: "reconnect supabase and complete all github items; update user specific github repo")
Screenshot: `docs/supabase/2026-10-01_github_integration.png`.

| Setting (Supabase → Project → Integrations → GitHub) | Value |
|---|---|
| GitHub repository | `alexseguin-hbs/eXeL-AI-Polling` |
| Working directory | `.` — the repo root holds `supabase/` (`supabase/config.toml` + `supabase/migrations/`) |
| Production branch | `main` |
| Deploy to production | **OFF until the history job below is green** — then ON |
| Automatic branching / preview branches | OFF (a paid feature; the project is on FREE) |

Why "Deploy to production" waits: all 31 files in `supabase/migrations/` (001–038) were applied by hand in the SQL editor, so
Supabase's history table does not know them. With the toggle ON, the next merge to `main` would re-run every one, and ten of
them contain DROP statements. **Run once:** GitHub → Actions → "Supabase migration history" → Run workflow (type the database
password, or set the `SUPABASE_DB_URL` secret). It records 001–035 as applied without running SQL, proves 036 · 037 · 038 from
the database itself before recording them, and lists local vs remote. When it is green, turn "Deploy to production" ON; from
then on a new migration merged to `main` is applied automatically, once.
Every other Supabase item in GitHub: `supabase-keepalive.yml` (twice a day, green 2026-10-01 12:33 UTC) · `apply-migration.yml`
(one file, default ref filled in) · `deploy.yml` / `verify-live.yml` (the site; they read the two NEXT_PUBLIC_* secrets when set).
