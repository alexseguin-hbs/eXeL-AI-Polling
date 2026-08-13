# Vision 2525 — Revision Difference Intelligence (Compare UX) · Consolidated R-CORE Spec

> **Source.** Consolidation of two independent specs (Grok + eXeL AI) the operator produced from one
> prompt, merged **per R-CORE principles** (reuse before rebuild; deterministic truth; AI is interpretation
> only; ship in gated slices). This is the build guide for the "R-CORE Changes Protocol" (plan item P3):
> the canonical way a reader understands how the living document changed. Authored **MoT**, directed **TH**.

## Master of Thought ruling (both specs agree)
Build the Difference View as an **extension of the existing Replay + Compare engine**, never a parallel
system. The authoritative pipeline is permanent:

```
LEDGER → REPLAY STATE → DETERMINISTIC DIFF → RULE-BASED CLASSIFICATION
       → (optional) AI INTERPRETATION → HUMAN AUTHORITY → DISPLAY
```

- **Replay state = truth. Exact diff = evidence. Rule-based classification = derived analysis. AI = interpretation.**
- AI never silently becomes Ledger history; the whole Difference View must work with AI **disabled**.
- Default comparison question: **"Selected revision ↔ Current."** Auto-activate when the slider leaves VMAX.
- Single-column, mobile-first, reuse existing tokens. Never two side-by-side full documents.

## R-CORE reuse map (verified against `docs/SOI_VISION2525_LIVING_DOCUMENT.html`)
Extend these — do not replace:

| Existing primitive | Location | Role in the new view |
|---|---|---|
| `replay(v, order, fresh)` | ~18077 | Authoritative historical state; source of before/after |
| `stateHash(v, order, fresh)` | ~18167 | Cache keys; parity proof |
| `compare(a, b)` | ~18269 | Returns `{id,kind,v,why}` rows (added/revised/removed/carried), order-independent — the deterministic diff |
| `improvements(v)` | ~18293 | Per-release changed blocks over `ALL_ORDER` |
| `renderCompare()` | ~19349 | The `.cmp` panel (`#cmpA/#cmpB` selects, `#cmpPrev`, `#cmpFirst`) |
| `renderKeyImp()` | ~19335 | Key-improvements panel |
| CSS `.cmp .cmp-ctl .cmp-sum .k-add .k-rev .k-rem .k-car .pill .scroll` | ~455-475 | Reuse; add only `.diff-*` where genuinely new |
| Inline `section.blk.cmp-add / .cmp-rev` | ~472 | Changed-block treatment |

**Gate assertions that MUST keep passing** (`scripts/lv-gate-vision2525.mjs` §2b): `compare(1,VMAX)` rows == block
count · removed == 0 · added+revised+carried == blocks · `compare(v,v)` empty · order-independent ·
`improvements(VMAX)` non-empty unless engine-only · `#bCmp` → `.cmp` with **exactly 2** `.cmp-ctl select` ·
`#cmpFirst` → `section.blk.cmp-add,.cmp-rev` count == blocks − carried. Any extension must not violate these.

## Data contracts
```ts
interface DiffResult {
  from: number; to: number; fromHash: string; toHash: string;
  releasesCrossed: number; added: BlockDiff[]; revised: BlockDiff[]; removed: BlockDiff[];
  carriedCount: number; sectionsAffected: string[]; categories: Record<Category, number>;
  majorChanges: BlockDiff[]; topImprovements: BlockDiff[]; timeline: ChangeEvent[]; compareHash: string;
}
interface BlockDiff {
  id: string; title: string; sectionId?: string; kind: "added"|"revised"|"removed"|"carried";
  fromVersion?: number; toVersion?: number; why: string;
  beforeHtml?: string; afterHtml?: string;            // derived from replay(from)/replay(to) ONLY
  impact: "L1"|"L2"|"L3"|"L4"|"L5"; category: Category;
  risksReduced?: string[]; humanAuthority?: {status:"unknown"|"pending"|"approved"|"rejected"};
}
type Category = "definition"|"economics"|"governance"|"legal"|"rcore"|"qualification"
             |"security"|"reader"|"translation"|"correction"|"other";
```

## Rule-based classifiers (deterministic; AI may *recommend* but never override)
**Impact (L1 editorial · L2 clarification · L3 functional · L4 governance/economic · L5 constitutional/ontology).**
High-impact by block-id pattern (deterministic first): `^unit\.`, `^gov\.`, `^legal\.`, `^off\.`, `fund.tiers`,
`fund.escrow`, `fund.metrics`, `rcore.*` → L4/L5. Others default L2/L3; pure paper/brief/outline chrome → L1.

**Category** by id prefix: `unit.*`→definition/economics · `fund.*`→economics · `gov.*`→governance ·
`legal.*`→legal · `off.*`→governance · `rcore.*`→rcore · `paper./brief./outline./nose.`→reader ·
`open.defects`→correction · else other.

## Components (single-column, sticky under the deck only)
1. **Difference Overview Card** — `Selected rX → Current rVMAX`, releases crossed, revised/added/removed,
   sections affected, major-change count, highest-impact areas, optional AI summary (labeled). ≤30% vp desktop / ≤40% mobile.
2. **Change Intelligence Bar** — timeline markers colored by category; click → jump/filter.
3. **Diff Strip** — chips of changed blocks with impact badges; tap → scroll + focus + expand card.
4. **Change Card** — Before (rX) → After (current) → Why → Impact → Risk reduced → Evidence → Human Authority.
5. **Evolution view** — concept lineage across intervening releases (one node per meaningful state).
6. **Modes** — Overview · Meaning (AI) · Exact Diff · Evolution. Default Overview.

## Visual language (reuse tokens)
Red = old/removed span · Green = new span · Gold edge = revision/clarification · Purple edge =
governance/constitutional · Cyan edge = R-CORE/Replay · Gray = unchanged context. **Never paint whole
paragraphs red/green** — only changed spans. Every state carries a **text label** (accessibility).

## Slice plan (one gated commit per slice)
- **R1** `diffResult()` + impact/category classifiers + `topImprovements()` (pure; extends `compare()`), with in-gate assertions that its ids/counts match `compare()` and before/after match `replay()`.
- **R2** Auto Compare-to-Current when `active < VMAX`.
- **R3** Difference Overview Card (counts, sections, highest impact, Top-7) — reuse `.cmp*`/`.k-*`.
- **R4** Diff Strip + jump-to-block.
- **R5** Inline changed-block treatment (spans, not paragraphs) + labels.
- **R6** Deterministic Before/After excerpts (sentence diff → word diff on changed sentences; pure, no AI).
- **R7** Impact + category filters.
- **R8** Overview/Meaning/Exact-Diff/Evolution mode tabs.
- **R9** Evolution lineage view + concept search.
- **R10** Provider-neutral semantic adapter interface (no coupling to any provider).
- **R11** Optional AI summary + compareHash cache + graceful fallback + "AI interpretation" label.
- **R12** Translation-aware status (canon-updated/translated/human-verified/semantic-drift) — architecture only.
- **R13** Mobile / accessibility / performance convergence (375×812, 390×844, 844×390, 1280+).

## Acceptance (deterministic core)
Selecting any past revision instantly shows the Overview; counts match `compare()` exactly; clicking a change
jumps to its block + card; Exact Diff works with **no network**; AI (when on) is labeled and falls back
cleanly; exiting comparison clears all chrome; mobile never dominates; viewing comparisons never mutates the
Ledger or changes replay hashes.

## Out of scope (first pass)
Full word-level GitHub diff of the whole paper · three-way (A vs B vs C) · editing from Compare · auto-canonizing
AI summaries · persistent user compare history · Sankey/network graphics.
