# DD-55 step 1 — red first, before the two gates were wired

## 1 · `gen-rcore-revisions --check` refuses a generated module that is behind its ledger

The generator ran **nowhere** — not in a package script, not in `prebuild`, not in CI, not in any workflow. It
was manual only, so a ledger could be appended to and the committed `.gen.ts` left behind, and every R-CORE panel
would quietly show a history that is not the ledger, with nothing in the repository to catch it.

Because all eight generated modules were already in sync, the red had to be **engineered honestly**: one real
entry was appended to `docs/traceability/settings.ledger.json` and nothing was regenerated.

```
ok     soi-drs-revisions.gen.ts ← 131 DRS revisions
ok     drone-ledger.gen.ts ← 88 ledger entries
ok     security-ledger.gen.ts ← 4 ledger entries
STALE  lib/2525-core/settings-ledger.gen.ts — re-run node scripts/gen-rcore-revisions.mjs
ok     easter-egg-ledger.gen.ts ← 6 ledger entries
ok     architect-ledger.gen.ts ← 4 ledger entries
ok     celestial-ledger.gen.ts ← 3 ledger entries
ok     financial-ledger.gen.ts ← 166 ledger entries

gen-rcore-revisions --check: 1 generated file(s) are behind their ledger
exit 1
```

The probe entry was reverted immediately; `git status` on `docs/traceability/` and `frontend/lib/2525-core/` is
clean, and the check is green again. The idiom is the one `scripts/manta-render.mjs` already uses.

## 2 · `projects-registry` refuses an unclassified route, and a panel that does not mount

**A new route appears and nobody classified it:**

```
FAIL: every top-level route is classified: unclassified = /probe-2525
projects-registry: 84 passed, 1 failed · 28 top-level routes classified
```

**A project claims a panel that does not actually mount the shared badge** (the likelier mistake — a row written
optimistically):

```
FAIL: /light-codex MOUNTS the shared badge in components/light-codex-cube.tsx
projects-registry: 86 passed, 1 failed
```

Both probes were reverted. Green state:

```
projects-registry: 85 passed, 0 failed · 27 top-level routes classified · 10 projects,
4 still owed a record · 10 ledgers, 0 orphans
```

and the four owed are printed by name on every run, so they cannot be forgotten:

```
OWED   /SensorFusion-2525 — its record is app/SensorFusion-2525/ledger.ts, hand-written TypeScript OUTSIDE
                            docs/traceability, outside the generator and outside every gate
OWED   /light-codex        — his own answer: "The /light-codex world". Needs a ledger and a panel.
OWED   /vision-2525        — no ledger, no shared panel; the living document has its own implementation
OWED   /encrypted-messaging— the launcher calls it ATLANTIS-2525; lowest value, therefore last
```

## 3 · The floor assertions

Both gates assert their own walk found something (`routes >= 20`, `ledgers >= 8`, `projects >= 6`), so a walk that
finds nothing **fails** instead of passing 0 of 0.
