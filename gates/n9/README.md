# N9 SSSES + SPIRAL gate suite (share with Claude Code MoT)

**One command (from repo root):**
```bash
node gates/n9/runner/run-n9.mjs
```

**Self-tests only (validators + anti-mint):**
```bash
node gates/n9/runner/run-suite.mjs --group n1_baseline_tooling --strict-n1
```

**List groups:** `node gates/n9/runner/run-suite.mjs --list`  
**Assertions only (no heavy pytest/npm):** `node gates/n9/runner/run-suite.mjs --assertions-only`

## Dependencies
- Node.js 20+ (repo standard)
- Optional: Python 3 + pytest for backend groups (`n2`, `n8` jurisdiction)
- Optional env (never default-on): `N9_LIVE_READONLY=1`, `N9_STRIPE_SANDBOX=1`, `N9_SUPABASE_READONLY=1`, `RLS_PROBE_*`
- **No** production writes, provider charges, or load tests by default

## What this is
- Reuses existing `npm run test:*` / pytest commands via `runner/manifest.json`
- Exact **111/333** validators with **negative** tests (`tests/`)
- Evidence under `gates/n9/.evidence/run-*/` (gitignored): command, stdout hash, exit, duration, status
- ROUND schema: `schema/round.schema.json` + `lib/validate-round.mjs`
- **Refuses** minting nine `complete` rounds from one suite fingerprint

## What this is not
- Not fabricated AsM/MoT bodies or independent fleet sign-offs
- Not SSSES=100 from test counts
- Not HTML / user final results (held until N1–N9 gate + H.I.)
- Not a merge of PR1/3/4/5

## Worker evidence pointers (box-local; not in git)
- Payments QA: `/cursor/stores/store-4ff5b235-5045-41af-8897-1124f2ebc55e/qa/BASELINE-QA-t71-t72.md`
- Pod: `/workspace/research-exel/artifacts/workers/pod/` (head `787bfb5`)
- SensorFusion: `/workspace/research-exel/artifacts/workers/sensorfusion/` (head `7150bcc`)

## Doctrine
See `DOCTRINE.md`.
