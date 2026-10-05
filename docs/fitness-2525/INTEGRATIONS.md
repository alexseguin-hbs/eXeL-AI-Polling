# Fitness-2525 · Strava & Garmin Connect Integrations

Per-user OAuth so any Auth0-signed-in athlete can **Connect Strava** / **Connect Garmin**, authorize **their own** account, and see connection status + athlete name in the CONNECTIONS tab.

Live page: `https://exel-ai-polling.explore-096.workers.dev/Fitness-2525/` (alias `/fitness-2525/`).

Tokens are stored **server-side only** (Worker KV or Supabase `innovation_state` RPCs), keyed by Auth0 `user.sub`. Never in `localStorage`.

---

## Architecture

| Piece | Path |
|-------|------|
| Worker handler | `frontend/fitness-2525-core.js` |
| Router (minimal) | `frontend/worker.js` — import + `/api/fitness-2525` registration (mirrors `/api/ai`) |
| UI card | `frontend/components/fitness-2525/connections.tsx` |
| Client API | `frontend/lib/fitness-2525/integrations.ts` |
| Host tab | `frontend/components/fitness-2525/command-ux1.tsx` (additive CONNECTIONS tab) |

### Routes

**Strava**

| Method | Path | Role |
|--------|------|------|
| POST/GET | `/api/fitness-2525/strava/connect` | Returns `{ url }` authorize redirect (Auth0 Bearer required) |
| GET | `/api/fitness-2525/strava/callback` | Token exchange → redirect `/Fitness-2525/?tab=CONNECTIONS&strava=connected` |
| GET | `/api/fitness-2525/strava/status` | `{ connected, name, last_sync, configured }` |
| POST | `/api/fitness-2525/strava/disconnect` | Revoke + delete tokens |
| POST | `/api/fitness-2525/strava/sync` | Pull last ~14 days of activities → `fit-day-*` workouts |
| GET | `/api/fitness-2525/strava/webhook` | Hub verification (`hub.challenge` echo) |
| POST | `/api/fitness-2525/strava/webhook` | Activity create/update → fetch activity → map into FitDay |

**Garmin** (OAuth 2.0 **PKCE** — official Connect Developer Program)

| Method | Path | Role |
|--------|------|------|
| POST/GET | `/api/fitness-2525/garmin/connect` | PKCE authorize URL, or `{ pending: true }` when secrets unset |
| GET | `/api/fitness-2525/garmin/callback` | Code + `code_verifier` → tokens |
| GET | `/api/fitness-2525/garmin/status` | Status or pending-approval payload |
| POST | `/api/fitness-2525/garmin/disconnect` | Deregister + delete tokens |
| POST | `/api/fitness-2525/garmin/push` | Acknowledge / refresh (data arrives via Garmin push once approved) |

Authorize / token endpoints used:

- Strava authorize: `https://www.strava.com/oauth/authorize` (scope `read,activity:read_all`, `approval_prompt=auto`)
- Strava token: `https://www.strava.com/oauth/token`
- Garmin authorize: `https://connect.garmin.com/oauth2Confirm`
- Garmin token: `https://diauth.garmin.com/di-oauth2-service/oauth/token`

---

## Owner setup — Strava (self-serve, works today)

### 1. Create a Strava API application

1. Open [https://www.strava.com/settings/api](https://www.strava.com/settings/api) while signed into the owner Strava account.
2. Create an application (or edit the existing one).
3. **Authorization Callback Domain** must be exactly:

   ```text
   exel-ai-polling.explore-096.workers.dev
   ```

   (no `https://`, no path). Localhost is already allowed by Strava for dev.
4. Note **Client ID** and **Client Secret**.
5. Choose a random verify string for webhooks (e.g. `openssl rand -hex 16`) → this is `STRAVA_VERIFY_TOKEN`.

Callback URL the Worker uses (must stay under that domain):

```text
https://exel-ai-polling.explore-096.workers.dev/api/fitness-2525/strava/callback
```

### 2. Set Worker secrets

From `frontend/` (or the deploy workspace that runs wrangler for `exel-ai-polling`):

```bash
cd frontend
npx wrangler secret put STRAVA_CLIENT_ID
npx wrangler secret put STRAVA_CLIENT_SECRET
npx wrangler secret put STRAVA_VERIFY_TOKEN
```

**Storage** (pick one; the handler auto-detects):

| Option | Secrets / bindings | Notes |
|--------|--------------------|-------|
| **A · Supabase (recommended if already used)** | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (or anon key) | Tokens under owner `sha256(fit2525tok:{auth0_sub})`, names `strava` / `garmin`. Fit days still use `sha256(fit2525:{sub})` + `fit-day-*`. |
| **B · KV** | Bind a namespace as `FITNESS_STORE` (or reuse `SIGN_FILES` / `RESPONSES` / `SITE_STATE`) in `wrangler.jsonc` | Keys `fit:{owner}:{name}`. |

Optional:

```bash
npx wrangler secret put AUTH0_DOMAIN          # default: exel-ai-polling.us.auth0.com
npx wrangler secret put FIT_OAUTH_STATE_SECRET # HMAC for OAuth state; falls back to STRAVA_CLIENT_SECRET
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

### 3. Deploy Worker

Another helper may push/deploy. After secrets are set, a normal Workers Static Assets deploy ships `worker.js` + `fitness-2525-core.js`.

### 4. Register Strava webhook subscription

After deploy (replace IDs/tokens):

```bash
curl -X POST https://www.strava.com/api/v3/push_subscriptions \
  -F client_id=$STRAVA_CLIENT_ID \
  -F client_secret=$STRAVA_CLIENT_SECRET \
  -F callback_url=https://exel-ai-polling.explore-096.workers.dev/api/fitness-2525/strava/webhook \
  -F verify_token=$STRAVA_VERIFY_TOKEN
```

Strava will GET the callback with `hub.mode=subscribe&hub.verify_token=…&hub.challenge=…`; the Worker echoes `{ "hub.challenge": "…" }`.

List / delete subscriptions:

```bash
curl "https://www.strava.com/api/v3/push_subscriptions?client_id=$STRAVA_CLIENT_ID&client_secret=$STRAVA_CLIENT_SECRET"
curl -X DELETE "https://www.strava.com/api/v3/push_subscriptions/{id}?client_id=$STRAVA_CLIENT_ID&client_secret=$STRAVA_CLIENT_SECRET"
```

### 5. HI test (Strava)

1. Deploy + secrets set.
2. Open `/Fitness-2525/` → **SIGN IN** (Auth0) → tab **CONNECTIONS**.
3. **Connect Strava** → authorize your athlete → land back with status **Connected as \<name\>**.
4. **Sync now** → recent activities appear as workouts on the matching `fit-day-YYYY-MM-DD` (sport, start, duration, distance, avg HR, kcal).
5. Create/update an activity in Strava → webhook should update the same day record (may take a few seconds after Strava delivers the event).
6. **Disconnect** → status returns to **Not connected**; Strava app list no longer shows the app (or shows revoked).

---

## Owner setup — Garmin (business approval required)

Garmin Connect Developer Program (Health / Activity API) uses **OAuth 2.0 with PKCE** and requires business/developer approval — it is **not** self-serve like Strava. Do **not** use unofficial scraping libraries.

1. Apply: [Garmin Connect Developer Program](https://developerportal.garmin.com/developer-programs/connect-developer-api).
2. When approved, create an app and note **Client ID** / **Client Secret**.
3. Register redirect URI:

   ```text
   https://exel-ai-polling.explore-096.workers.dev/api/fitness-2525/garmin/callback
   ```

4. Set secrets and redeploy:

   ```bash
   npx wrangler secret put GARMIN_CLIENT_ID
   npx wrangler secret put GARMIN_CLIENT_SECRET
   ```

5. Configure Garmin push endpoints (Activity / Health) in the developer portal to your Worker when ready (same origin paths can be extended; `/api/fitness-2525/garmin/push` is the authenticated athlete "sync" stub).

**Until secrets are set**, the UI shows:

> Garmin pending developer approval — connect Garmin to Strava meanwhile

with a link to the developer program. Athletes can link their Garmin device to Strava so activities still flow through the Strava integration.

---

## Auth model

1. Browser obtains Auth0 access/ID token (`getAccessTokenSilently` / `getIdTokenClaims().__raw`).
2. Worker verifies RS256 JWT against `https://{AUTH0_DOMAIN}/.well-known/jwks.json`.
3. OAuth `state` is HMAC-signed and embeds `auth0_sub` so the callback binds tokens to the correct user without re-sending the Auth0 header.
4. Public status responses never include access/refresh tokens.

---

## Activity → FitDay mapping (Strava)

| Strava field | FitWorkout / FitDay |
|--------------|---------------------|
| `sport_type` / `type` | `type` (bike/run/swim/strength/…) |
| `name` | `title` |
| `start_date_local` | `timing` + day namespace date |
| `moving_time` | `minutes` + `garmin.duration` |
| `distance` (m) | `distance` km |
| `average_heartrate` | `garmin.avg_hr` |
| `calories` or `kilojoules÷4.184` | `calories` / `garmin.kcal` |
| id | `id = strava-{id}`, `status = completed` |

Webhook + sync **union** workouts by id into the user's `fit-day-YYYY-MM-DD` via the same cloud owner key as the UI (`sha256(fit2525:{sub})`).

---

## Unverifiable without deploy

- Live OAuth redirects against Strava/Garmin.
- Webhook delivery and hub verification on the production hostname.
- Token persistence against real KV/Supabase secrets.
- End-to-end "Connected as \<athlete\>" after authorize.

Local `npm run dev` renders the CONNECTIONS card and sign-in prompt; `/api/fitness-2525/*` returns only after a Worker deploy (static Next export has no API routes).
