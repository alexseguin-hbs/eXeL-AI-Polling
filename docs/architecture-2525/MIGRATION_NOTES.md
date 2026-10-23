# ARCHITECT-2525 v1.2 — Migration notes (.arch2525 V1 → V2)

> What changed in persistence between the legacy single-JSON `.arch2525` (V1) and the deterministic store-only ZIP
> (V2), what happens to a V1 file when it is opened or migrated, and **why each choice was made**. Reasons are kept,
> not just the dispositions (advisory #9) — a note that says only "we changed X" tells the next reader nothing about
> whether they may change it back.
>
> Source of truth: `frontend/lib/architect-2525/canonical/package.ts`. Gates:
> `test:architect-canonical-package` (13), `test:architect-canonical-package-hostile` (12).

## Why V2 exists at all

V1 was a single JSON blob: the current project state, no history, no integrity seal, no hostile-input guard. The v1.2
truth loop needs three things V1 cannot give:

1. **The R-CORE chain must survive save and reload** — the §27 "survives" clause requires that `Replay(head)` on a
   *reloaded* project still reconstructs the stored hash. A file that carries only current state loses the memory.
2. **The package hash must be reproducible** — two saves of the same revision must hash identically regardless of
   when they were written or in what order the archive laid its bytes, or a reviewer cannot attest the file.
3. **An opened file is untrusted input** — a signer or a reviewer may be handed any bytes; the reader must fail
   CLOSED on hostile input, never crash and never partially load.

## Disposition table (V1 concept → V2 disposition → why)

| V1 | V2 disposition | why |
|---|---|---|
| single `project.json` blob | one entry **`project.json`** inside a store-only (uncompressed) ZIP | an archive lets the chain and the seal travel beside the state without a bespoke envelope; store-only (no DEFLATE) keeps the bytes a pure function of content, not of a compressor's state |
| *(none — V1 had no history)* | **`snapshots/` + `deltas/`** entries carrying the R-CORE chain | the "survives" clause: reload must re-verify root→head and replay the current revision. New in V2; V1 reloads start a fresh single-snapshot chain (see below) |
| *(none)* | **`manifest.json`** = `{schema_version, min_reader_version}` | forward-compat: a future feature may stamp a higher `min_reader_version`; an older reader then refuses rather than mis-parses (§36.06) |
| *(none)* | **`manifest.seal.json`** = `{package_hash, schema_version, min_reader_version, entries}`, **outside** the sealed data | the reader recomputes `package_hash` on load and fails CLOSED if it ≠ the seal; the seal sits outside the hashed set so it cannot hash itself |
| file bytes *were* the identity | `package_hash` over **normalized paths + per-entry content hashes**, never the ZIP bytes | archive timestamps, entry order and compression are "accidents"; hashing content makes two saves of one revision identical cross-OS and time-invariant. The writer takes an **injected clock** (`nowMs`), never calls `Date.now` internally |
| no size/shape guard | caps: **≤ 64 entries, ≤ 4,000,000 bytes/entry, ≤ 16,000,000 bytes total**; null-proto reviver strips `__proto__`/`constructor`/`prototype`; ZIP-magic checked first | hostile-input rejection — zip-bomb, oversized, path-traversal, prototype-pollution — on the V1 JSON adapter **and** every V2 entry, because V2 is now the default format |

## What happens to a legacy V1 file

`readPackage(bytes)` detects the format by **ZIP magic first**: a ZIP → `readPackageV2`, otherwise → `readPackageV1`.
A V1 file still opens — it is never orphaned. On a V1 load (`readPackageV1`):

- the bytes are size-capped (≤ 4,000,000) and parsed through the **same hostile-safe reviver** as V2;
- every imported entity's `evidence.authority_state` is stamped **`IMPORTED`** — it came from another file, so it is
  not ASSUMED (our seed), not OBSERVED, not CALCULATED; `IMPORTED` is one of the four anticipatory AuthorityStates,
  and this is the *one* path in the app that emits it (a V1 session never does otherwise);
- `assertSafeInt` is applied after any unit conversion, so a V1 dimension that does not fit integer-µm is refused at
  the door rather than silently floated;
- the project is wrapped in a **minimal R-CORE** — one snapshot, **no events** — because a V1 file carries no history
  to replay. `package_hash` is `""` and `schema_version` is `0` for a V1 read (it was never sealed).

## Migrating V1 → V2

`migrateV1toV2(v1Bytes)` reads the V1 file and writes a V2 ZIP: the imported (IMPORTED-authority) project, sealed,
with the minimal chain. It round-trips — `test:architect-canonical-package` proves a migrated file reopens to the same
ids and geometry. The seam is deliberately a **pure function** so the same shape serves a future **V2 → V3** migration
without a second mechanism.

## Forward compatibility (V2 → future)

- `MIN_READER_VERSION = 1`, `OUR_READER_VERSION = 1`, `SCHEMA_VERSION = 1` today.
- `readPackageV2` refuses a file whose `min_reader_version` exceeds `OUR_READER_VERSION` with a clear message — a
  newer file is **not mis-parsed into a lossy load**; the reader says it is too new.
- A feature that changes the on-disk shape stamps a higher `min_reader_version` via `writePackageV2(…, {minReaderVersion})`
  and adds a `migrateV1toV2`-shaped seam for the prior version. The gate carries a synthetic future-version fixture to
  prove the refusal branch stays live.

## What did NOT change (firewall)

- The legacy app's own `.arch2525` round-trip (`lib/architect-project-file.ts`) is untouched — the canonical package
  is a new, parallel format; the legacy UI keeps reading its own files until Block D rewires the reader.
- No canonical field was added for persistence that is not reserved by the spec: `financial_record_id` /
  `financial_record_hash` remain present-and-null (§3.3), nothing else.
