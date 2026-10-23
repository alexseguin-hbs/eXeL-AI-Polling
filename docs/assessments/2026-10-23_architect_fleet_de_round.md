# ARCHITECT-2525 — 48-fleet D/E review round (2026-10-23)

Run `wf_390766d2-32a`: 36 specialists (12 AsM × 3 — builder · adversary · voter), 3 pods (RECORD · FIGHT ·
MEANING), MoT-synthesized. 36/36 done, 0 errors, 1.47M subagent tokens, ~15.6 min.

## The headline — a procedural BLOCKING that caught the Master of Thought
All 12 AsM voted **BLOCKING on the tree-SHA gate**: the agent prompts pinned `HEAD = ab3502fe5`, and the MoT
kept committing while the fleet ran (`ab3502fe5` → `03db0b672` → `feb80f219` → `f85d4f4a1` → `6088a4f39`), so
the worktree advanced under the agents and they correctly refused to certify a tree that did not match their
pin — some measured two different HEADs between their own consecutive reads. **This is the MoT's error** (a
moving-SHA pin during a live worktree), and it is exactly the stale/moving-tree failure the tree-check rule
exists to prevent. **Lesson (binding for every future review fleet): run review agents against a FROZEN tree —
do not commit while the fleet runs, or pin to a stable detached checkout.**

## What still came through — Thoth's substantive verification of A/B/C (read-only, byte-identity confirmed)
Thoth (RECORD) verified `git diff --stat ab3502fe5 f85d4f4a1` on `units.ts`, `serialize.ts`, `wire-core/sha256.ts`
is EMPTY (byte-identical to the pinned commit; the drift only ADDED Block D files; no firewall file touched),
then re-read the files and **CONFIRMED all five claims — "the specialists were NOT green-but-false":**
1. integer-µm only / zero float literals (presentation divisions only);
2. `assertSafeInt` guards the DERIVED area product AND aggregate (§24 — the product, not the edge, nears 2^53);
3. UTF-8 via `sha256Hex`, the FNV-1a/charCodeAt/UTF-16 hasher physically absent from the canonical path;
4. volatile fields excluded at every depth (`local_date`/`timestamp_ms` nested on the event, dropped per §3.2);
5. entity arrays sorted on the RAW case-preserved `entity_id` (no `toLowerCase`), undefined omitted not null-filled.

## Two ENHANCE findings — FOLDED this round (advisory #2: make the fleet's work count)
- **serialize chokepoint:** `canonicalize`'s number branch rejected only non-finite; §24 enforcement lived only
  upstream. → Added `Number.isSafeInteger` enforcement at the serialization chokepoint itself
  (`serialize.ts`); a float or unsafe-int canonical dimension is now refused at serialize, gated in
  `test:architect-canonical-serialize` (two new throws). No regression — every valid project is all safe ints.
- **float-scan coverage:** the float-literal source-scan covered only `units.ts`. → Extended the scan to
  `serialize.ts` in the same gate.

## NOTEs (recorded, no action)
- The entity sort uses JS `</>` (UTF-16 code-unit order) vs the spec's UTF-8 byte order — identical for any
  valid `entity_id` (ASCII hex-UUID / base64 GlobalId), and both production and the independent §10 canonicalizer
  use the same comparison, so it is invisible to the independence cross-check. Theoretical only.
- `canonicalize` throws on `undefined` array elements / bigint / symbol / function — an intentional determinism
  choice, not a defect.

## What the round did NOT deliver, and why that is acceptable
The other 11 voters stopped at the tree gate without a substantive Block D/E map. That map is not lost: the MoT
holds it from the plan's Block D/E file:line sections and its own read-only recon (the RoomCell shape at
`room-layout.ts:10`, the edit-path call sites at `architect-design.tsx:111/:127`, and the Block E product-truth
inventory in `Plan_Arch_003.md`). Block D/E proceed from those; **a FINAL review fleet runs against a FROZEN
HEAD before the two-commit closeout** (the "AsM review before push" law), so the fleet certifies the finished
implementation rather than a moving one.
