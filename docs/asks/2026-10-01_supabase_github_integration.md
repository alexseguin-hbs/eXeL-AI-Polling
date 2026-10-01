# Ask · 2026-10-01 7:28 AM · Supabase ⇄ GitHub integration

Operator, verbatim (screenshot `docs/supabase/2026-10-01_github_integration.png` — Supabase Integrations → GitHub, repository
alexseguin-hbs/eXeL-AI-Polling, working directory ".", Deploy to production ON):

> reconnect supabase and complete all github items; update user specific github repo

## Reading
1. The repo side: `supabase/config.toml`; a one-time job that records the hand-applied migrations in Supabase's history (no SQL
   run; 036–038 proven before recorded); the project ref filled in; the settings and steps in `docs/supabase/PROJECT.md`.
2. The dashboard side is the operator's: keep "Deploy to production" OFF until the history job is green (ten migrations contain
   DROP statements and would re-run), then ON.
