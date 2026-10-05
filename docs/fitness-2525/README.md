# Fitness-2525

Ironman Cozumel daily tracking on the eXeL Autonomous Command Network chrome (Security-2525 Mission PLANNING layout) with Financial-2525 energy methodology (`$/min` · `$/sec`).

## Routes (case-sensitive on the Worker)

| Path | Role |
|------|------|
| `/Fitness-2525/` | **Primary** live URL |
| `/fitness-2525/` | Lowercase alias |
| `/main/Fitness-2525/` | Main-shell alias |

Live: `https://exel-ai-polling.explore-096.workers.dev/Fitness-2525/`

## Cloud namespaces

Owner key: `SHA-256` hex of `fit2525:` + Auth0 `user.sub` (mirrors Financial `fin2525:`).

| `p_name` | Payload |
|----------|---------|
| `fit-day-YYYY-MM-DD` | One `FitDay` blob (weight, steps, calories_in/out, workouts[], checkins[], deficit note, optional `energy_cost_per_kcal`, `coach_note`) |
| `fit-index` | `{ days: string[], at: number }` |

RPCs: `innovation_state_get` / `_put` / `_list` / `_del` (migration 030). Until Auth0 sign-in, the UI keeps a **local/device** copy and explains that cloud needs Auth0.

## Energy methodology

- Accrual-style **ENERGY UNITS** hero: fuel (intake) · burn (out) · deficit Δ.
- REAL-TIME chart MoT toggle: **`$/min`** / **`$/sec`** (fuel≈income, burn≈expenses, net≈deficit).
- Calorie and `$/kcal` fields stay **blank** until the athlete sets them — no invented defaults.
- Deficit banner when both calories are present and intake < burn.

## Connections (Strava / Garmin)

Per-user OAuth via Worker `/api/fitness-2525/{strava,garmin}/*`. UI: CONNECTIONS tab → `components/fitness-2525/connections.tsx`. Setup: [INTEGRATIONS.md](./INTEGRATIONS.md).

## AI coaching

Same-origin Worker `POST /api/ai` with `task: "draft"` via `lib/ai.ts` → `lib/fitness-2525/ai.ts`. Providers: OpenAI, Grok/xAI, Gemini, Claude (Worker secrets). Notes are editable and can be saved into the day's `checkins` / `coach_note`.

## Key files

- `frontend/lib/fitness-2525/{cloud,types,energy,ai,integrations}.ts`
- `frontend/components/fitness-2525/{command-ux1,connections}.tsx`
- `frontend/fitness-2525-core.js` (+ minimal `worker.js` route)
- `frontend/app/Fitness-2525/page.tsx` (+ aliases)

## Local

```bash
cd frontend && npm run dev
# open http://localhost:3000/Fitness-2525/
```

Skip a full `next build` if packages are not installed; files are typecheck-oriented TypeScript.
