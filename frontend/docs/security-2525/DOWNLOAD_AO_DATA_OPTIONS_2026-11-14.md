# SECURITY-2525 — "Download any area of the world around an AO center (42 km)"

**Decision artifact · 2026-11-14 · Workstream D (payments / Supabase / infra)**
**Status: REPORT ONLY — no code changed, nothing committed, this is an H.I. decision input.**

> Operator ask (as relayed): *Settings → download any area of the world around a created
> AO's center (42 km)*, in Security-2525 Mission Planning. This doc states the real
> constraint, the current blocker (measured first-hand today), and **three real
> architecture options** with pros/cons/risk and the infra the operator / Grok must set,
> then a recommendation. Grok (or whoever implements) picks the option; this is the
> methods-not-code feedback the operator reviews first.

---

## 1. The constraint (what the system actually is today)

Verified against the real tree (`HEAD c1a4723bc`, `origin/main c1a4723bc`, behind 0):

- **The live app is a static Next export served by a Cloudflare Worker.** There is no
  always-on Python backend in the request path. Mission Planning is pure client code:
  `frontend/components/security-2525/mission-planning.tsx`.
- **Map data is build-time, pre-generated, keyed by a fixed dictionary.** Two Python
  scripts, run at build time (not in prod), write static JSON into
  `frontend/public/security-2525/`:
  - `scripts/security-2525/build_osm_overpass.py` → `osm-<key>.json`
    (roads by tier + waterways + water polygons), one entry per key in its hardcoded
    `BASES` dict (campblanding, nasjax, dallas, paris, …).
  - `scripts/security-2525/build_dem.py` → `dem-<key>.json`
    (real elevation grid, GEBCO 2020 via opentopodata), one entry per key in its
    hardcoded `REGIONS` dict.
- **The client loads a tile through a 4-rung cache ladder** (`frontend/lib/tile-cache.ts`):
  `memory → localStorage → Supabase map_tiles → origin (/security-2525/*.json)`, writing
  each miss back UP the ladder. In-flight de-dup; every rung degrades gracefully.
- **Custom AOs already exist but have no data.** `enterCoord` / `enterPoint`
  (`mission-planning.tsx:5054`, `:5086`) create/reuse a `custom-grid-<code>` AO anywhere
  on Earth the operator taps. `pickDemKey` (`:557`) only resolves to one of the *predefined*
  `REGIONS`; a custom AO over, say, Hawaii or the Sahel returns **no real roads and no real
  elevation** — the map falls back to coarse Natural-Earth / synthetic relief. **This gap
  is exactly what the feature closes:** pull real OSM + DEM for an arbitrary AO center.

**The 42 km number has a real size consequence.** Current tiles, measured:

| Existing tile | Radius | Tiers | File size |
|---|---:|---|---:|
| `osm-campblanding.json` | 16 km | full | 1.39 MB |
| `osm-capitol.json` | ~20 km | full | 3.21 MB |
| `osm-dallas.json` | 100 km | **major-only + coarse** | 5.69 MB |
| `dem-*` (base grids) | 40×40 over ~133 km box | — | 8–21 KB |

A **42 km radius = an 84 km box ≈ 6.9× the campblanding box area.** At *full* street tiers
over dense urban terrain that extrapolates to **~8–10 MB per OSM tile** — too heavy for a
phone. The existing code already solved this for the 100 km metros by dropping to
`MAJOR_ONLY` tiers + coarser `simplify` (dallas stays ~5.7 MB at 100 km). So **a 42 km AO
tile is only phone-viable at major-only / coarse-simplify tiers, or at full tiers for rural
low-density areas.** Any option below must carry a tier/simplify budget, not just "fetch the
box." **DEM at 42 km is trivial** (a 40×40 grid is still ~8–20 KB).

---

## 2. The current blocker (measured today, 2026-11-14, from the cloud egress)

The two data sources behave **asymmetrically** right now — this is the crux of the decision:

- **Elevation (DEM) is REACHABLE.** First-hand probe:
  `GET https://api.opentopodata.org/v1/gebco2020?locations=30.45,-97.63` →
  `{"status":"OK", ...,"elevation":226.0}`. The DEM half of the pipeline works from here.
- **OSM (Overpass) is DOWN on every mirror we have.** First-hand probe of all three:
  - `overpass-api.de/api/status` → `curl (35) Recv failure: Connection reset by peer`
  - `overpass.kumi.systems/api/status` → `curl (28) Operation timed out` (20 s, 0 bytes)
  - `overpass.osm.ch/api/status` → HTML error page, not the API status text

  This matches `build_osm_overpass.py`'s own 3-attempt/20 s-backoff retry loop
  (`:117-123`) failing. **So the roads/water half cannot be generated from this
  environment at all right now.** It is unclear whether this is a global Overpass incident
  or specific to our cloud egress IP (rate-limit / block). Either way, **any option that
  depends on Overpass from *our* infra is blocked until a working OSM source is secured.**

> Net: the feature is **half-blocked**. DEM can ship on any of the three options
> immediately. OSM needs a reliable source first — and that choice is what separates the
> three options below.

---

## 3. Three real architecture options

Each is a genuine, distinct way to get real OSM + DEM for an arbitrary 42 km AO. All reuse
the existing cache ladder (`tile-cache.ts`) so a tile, once fetched by anyone, warms
localStorage + the shared Supabase `map_tiles` table for everyone.

### Option A — Client-side runtime fetch + cache from a CORS-enabled source

The browser, when the operator hits **Settings → Download this AO**, fetches OSM + DEM for
the AO's 42 km box directly from CORS-enabled public endpoints, normalizes to the existing
`osm-<key>.json` / `dem-<key>.json` schema, and writes the result through the cache ladder
(memory + localStorage + Supabase upsert). Key = `custom-grid-<code>` (already the AO's key).

- **OSM source:** a CORS-enabled Overpass instance (the public `overpass-api.de` *does*
  send `Access-Control-Allow-Origin: *` to browsers; the failure above is egress-level, not
  CORS) or a hosted alternative (e.g. an Overpass-API-compatible endpoint). DEM source:
  opentopodata (CORS-enabled, confirmed reachable), rate-limited to ~1 req/s.
- **Pros**
  - **Zero new server infra.** Nothing to deploy; the static-export + Worker model is
    untouched. Pure client code + the Supabase table that already exists.
  - Ships **DEM today** regardless of the Overpass outage (opentopodata is reachable and
    CORS-OK from a browser).
  - **Per-operator, on-demand** — only AOs someone actually opens get pulled; naturally
    sharded across users; the Supabase write-back means the second viewer of an AO pays
    nothing.
  - Reuses `getTile`/`lsPut`/`map_tiles` verbatim — lowest-surface change.
- **Cons**
  - **Depends on the public endpoint's CORS + uptime from the *end user's* network**, not
    ours. Today's outage would still bite every operator whose browser can't reach a mirror.
  - **Overpass throttles browsers hard** (public mirrors cap concurrent slots); a 42 km
    full-tier query can time out or 429 on the client, with no server to retry/back-off
    centrally.
  - **Client must own the 42 km size budget** (tier selection, simplify) — porting the
    Python `simplify()` + tier map into TS, or accepting big payloads.
  - opentopodata's **1 req/s** politeness means ~16–20 s of sequential calls per DEM tile
    from the browser (a visible progress bar, not instant).
- **Risk:** Medium. The feature's reliability = the public mirror's reliability as seen
  from arbitrary end-user networks. No central control, no API key to raise limits, and a
  bad actor could spam opentopodata from our origin and get the origin rate-limited for all
  users. A browser timeout leaves a half-written tile unless the write is transactional.
- **Infra the operator / Grok must set:**
  - Confirm/choose a **CORS-enabled Overpass endpoint** (and ideally a paid/hosted one with
    a key, stored as a Supabase/Worker secret — never in client JS).
  - Ensure the **Supabase `map_tiles` table exists** (`docs/security-2525/supabase_map_tiles.sql`,
    referenced by `tile-cache.ts:18`) with insert policy for the write-back.
  - A **client-side port of the tier/simplify budget** so 42 km tiles stay phone-sized.

### Option B — Build / CI data-gen step keyed off saved custom AOs

Saved custom AOs become **inputs to the existing Python pipeline.** The operator's
`custom-grid-<code>` AOs (center + 42 km) are persisted (today in localStorage; this option
promotes them to a committed/Supabase manifest, e.g. `custom-aos.json`). A CI job runs
`build_osm_overpass.py` + `build_dem.py` over that manifest, commits the resulting
`osm-<code>.json` / `dem-<code>.json`, and the next deploy serves them as ordinary static
tiles — identical to how campblanding/dallas work now.

- **Pros**
  - **Exactly matches the current, proven architecture** — the tiles are the same schema,
    same origin path, same cache ladder; the determinism/size discipline already lives in
    the Python (`simplify`, `MAJOR_ONLY`, retry loop).
  - **Best quality + smallest payloads** — generation happens once, offline, with coarsening
    tuned; phones only ever download a finished ~1–5 MB tile.
  - **Central retry/back-off already exists** (3 attempts, 20 s sleep) and can run against a
    CI egress that *does* reach Overpass (GitHub-hosted runners are not our blocked IP) — so
    it **routes around today's cloud-egress Overpass outage** by running elsewhere.
  - No new runtime dependency; the live app stays a static export.
- **Cons**
  - **Not real-time.** "Download this AO" becomes "queue this AO for the next build" — a
    commit + deploy cycle (minutes), not an in-session action. That may not match the
    operator's mental model of a Settings button that fills the map now.
  - Needs a **manifest of custom AOs to exist somewhere CI can read** — a new persistence
    step (promote localStorage AOs → committed file or a Supabase table the CI reads).
  - **Still blocked if CI egress also can't reach Overpass.** Must verify GitHub runners
    reach a mirror (likely, but unconfirmed — different IP than our cloud egress).
  - Committing per-AO tiles can **bloat the repo** if operators save many AOs.
- **Risk:** Low–Medium on correctness (it's the path we already trust), but **Medium on
  UX-fit** — it answers "pre-provision known AOs" better than it answers "download *any*
  area, now." Repo-bloat and the manifest plumbing are real but bounded.
- **Infra the operator / Grok must set:**
  - A **custom-AO manifest** (committed `custom-aos.json` or a Supabase table) + the UI that
    writes to it when an AO is saved.
  - A **CI workflow** (GitHub Actions) that runs the two scripts over new manifest entries,
    commits tiles, and triggers a deploy — with a check that the runner reaches Overpass.
  - A 42 km tier/radius profile added to the scripts' dicts (they are currently
    base-by-base; parameterize by center + radius).

### Option C — Small server / Worker fetch endpoint (proxy + cache)

Add a **thin Cloudflare Worker route** (the app already ships a Worker: `frontend/worker.js`,
which routes `/api/responses` → a Pages function) — e.g. `GET /api/ao-data?lat=&lon=&r=42` —
that server-side fetches Overpass + opentopodata, normalizes to the tile schema, caches in
**Workers KV / Cache API** (and/or upserts Supabase `map_tiles`), and returns the tile with
proper CORS. The client "Download this AO" button calls this one endpoint.

- **Pros**
  - **One controlled choke point.** Central API key, central rate-limit/back-off, central
    retry across *multiple* Overpass mirrors, central cache — the browser never talks to
    Overpass directly, so public-mirror CORS/throttling stops being the user's problem.
  - **Real-time** like Option A (in-session fill) but **reliable** like Option B (server
    owns retries + mirror failover + the size/tier budget in one place).
  - Fits the existing Worker; KV gives a **durable, cross-PoP shared cache** — unlike the
    per-PoP Cache API gap already documented for `/api/responses` (CLAUDE.md Trinity note),
    a KV namespace here would be bound properly from the start.
  - Can **secure a paid Overpass key** server-side (never shipped to the client).
- **Cons**
  - **Most new infra + most moving parts** — a new Worker route, a KV namespace binding
    (the existing `RESPONSES` KV is *commented out* in `wrangler.jsonc`, so binding
    discipline is a known weak spot here), and operational ownership of a proxy.
  - **Still blocked by the Overpass outage** if the Worker's egress also can't reach a
    mirror. Cloudflare Workers egress from a different network than our cloud dev egress, so
    it *may* reach Overpass where we can't — **must be verified**, not assumed.
  - A public proxy endpoint is an **abuse surface** (someone hammering `/api/ao-data` to
    proxy-scrape OSM) → needs its own rate-limit + auth.
  - Worker CPU/time limits on a big 42 km full-tier parse; may need to stream or cap tiers.
- **Risk:** Medium–High on delivery effort/ops; Medium on the same upstream-Overpass
  dependency; the KV-binding footgun is a concrete, already-seen failure mode in this repo.
- **Infra the operator / Grok must set:**
  - A **Workers KV namespace** + a *real* binding in `wrangler.jsonc` (learn from the
    commented-out `RESPONSES` binding — bind it for real and gate it with a test).
  - An **Overpass endpoint + key** stored as a **Worker secret** (never echoed, never in
    client JS), plus mirror-failover config.
  - **Rate-limiting / auth** on the new route, and a tier/radius budget server-side.

---

## 4. Recommendation

**Ship DEM now on Option A; adopt Option C as the OSM path, with Option B as the offline
fallback for heavy/known AOs. Do not block the whole feature on Overpass.**

Reasoning, grounded in what was measured today:

1. **DEM is unblocked and CORS-OK.** There is no reason to wait: wire the "Download this
   AO" button to fetch opentopodata client-side (Option A, DEM only) and write through the
   existing cache ladder. Real elevation contours light up for *any* custom AO immediately,
   with zero new infra. This is the fast, honest win.

2. **OSM is the real problem, and it needs a controlled choke point, not the browser.**
   The outage proves the public mirrors are unreliable from at least one network, and
   Overpass throttles browsers hardest. **Option C (Worker proxy + KV cache + server-held
   key + mirror failover)** is the design that makes OSM reliable: one place to retry, fail
   over, rate-limit, and cache across PoPs. Its main cost is infra discipline — and this
   repo has a documented KV-binding footgun (`wrangler.jsonc` `RESPONSES` commented out),
   so **bind the KV for real and gate it with a test** as part of the work.

3. **Keep Option B as the pre-provision path for known / heavy AOs.** For AOs the operator
   saves and revisits (bases, recurring AORs) a committed CI-generated tile is smaller,
   higher quality, and deterministic — exactly today's proven model. It also routes around
   the cloud-egress Overpass outage by running on CI, which likely reaches a mirror. Use it
   for the "save this AO permanently" case, not the "download any area right now" case.

**First mechanical step before any of this ships: secure one working, reliable Overpass
source** (confirm a mirror reachable from the Worker's egress, or stand up / pay for a
hosted Overpass with a key in a Worker secret). Until that exists, the OSM half of the
feature cannot be made reliable on *any* option — and the operator should be told that
plainly rather than shipping a button that silently returns no roads.

**Residual gaps / open questions for the operator (H.I. decision):**
- Is "42 km" a fixed radius or a Settings-adjustable one? (affects tier budget + size caps)
- Full street tiers or major-only at 42 km? (phone-size tradeoff is real: ~8–10 MB vs ~1 MB)
- Is a known-reachable Overpass endpoint (mirror or paid) available, and from which egress?
- Where do saved custom AOs persist (localStorage today) — promote to Supabase for B/C?
- Acceptable UX for DEM's ~16–20 s sequential fetch (progress bar) vs a cached-only mode?

---

*Methods-not-code feedback per CLAUDE.md (feedback = name the methods/files/tests, don't
write the code). No scores, users, or charges invented; no secrets echoed. First-hand
probes run 2026-11-14 from the cloud egress. Workstream D — payments / Supabase / infra.*
