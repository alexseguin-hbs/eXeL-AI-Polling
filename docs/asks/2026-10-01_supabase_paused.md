# Ask · 2026-10-01 · Supabase project paused — keep it alive

Operator, verbatim (with a phone screenshot of the Supabase email, `2026-10-01_supabase_paused.png`):

> you need to start updating Supabase; this is unacceptable

The email (ant.wilson@supabase.com, 7:47 PM): "Your Supabase Project eXeL-AI-Polling has been paused. To optimize cloud
resources, we automatically pause free-tier projects after 7 days of inactivity. Your project eXeL-AI-Polling (ID:
ppgfjplawtlrfqpnszyb) … You can unpause your project from the dashboard within 90 days."

## Reading
1. The class: nothing guaranteed the database saw activity at least once every 7 days. Visits to the site do not
   reliably reach Supabase (most surfaces work offline-first), and the Actions Deploy door reads no Supabase secrets.
2. The fix of the class: a scheduled GitHub Action (`supabase-keepalive.yml`) that queries the project's REST API
   every day, from a runner (the sandbox proxy cannot reach supabase.co). Credentials: the repo secrets if set;
   otherwise the public URL + anon key the live site already ships in its JavaScript (the anon key is public by design).
3. It fails RED when the project is paused or unreachable, so a pause is seen the same day, never by email a week later.
4. Restoring the paused project is one operator action: Supabase dashboard → project eXeL-AI-Polling → Restore.
   The keepalive cannot unpause a project (that needs a Supabase access token, which the session does not hold).
