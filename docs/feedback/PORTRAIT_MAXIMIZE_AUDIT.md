# PORTRAIT / MAXIMIZE AUDIT — `/innovation`
**AsM triad:** Aset (consistency) · Sofia (multi-perspective) · Christo (consensus) — MoT synthesis at the end.
**Mode:** READ-ONLY. No code touched. Evidence: `frontend/app/innovation/page.tsx` (5,856 LOC), `frontend/scripts/slide-shots.mjs`, operator photo IMG_8295.
**Scope law:** relocate/normalise only. **Do NOT add a maximize control where none exists today.**

---

## PART 1 — MAXIMIZE CONTROL INVENTORY

| # | Control | file:line | Placement today | Icon / label | In its own box? |
|---|---------|-----------|-----------------|--------------|-----------------|
| M1 | Rack & Stack (Portfolio Prioritization) | `page.tsx:606-609` | **LEFT cluster** of the card header (`flex items-center gap-2` @ `:602`), squeezed between the `<h2>` and the Budget button | `⤢`/`⤡`, `t("innovation.max.expand"/"restore")` ✅ | Yes (section @ `:598-600`) but **wrong corner** |
| M2 | ChartFrame (generic chart/table wrapper) | `page.tsx:1021-1022` | `absolute right-1 top-1 z-[2]` — **upper-right of its own frame** ✅ | `⤢`/`⤡`, raw English `"Full screen"/"Restore"` ❌ | Yes — **this is the reference** |
| M3 | Project deep-dive | `page.tsx:2312-2315` (overlay `:899-907`) | Last item of a **wrapping** row (`flex flex-wrap items-center justify-between` @ `:2306`); at 390px it wraps below the Outcome-brief button and stops being "upper right" | `⤢`/`⤡`, raw English | Yes, but position is wrap-dependent |
| M4 | Value Proposition full-screen | `page.tsx:2325-2326` (overlay class `:2320`) | Inside the right cluster `:2323` but **BEFORE** the HI/AI toggle → not the corner-most control | `⤢`/`⤡`, raw English | Yes, wrong order |
| M5 | Pipeline by Gate — maximize | `page.tsx:5306` | Right cluster, after the "Unofficial Framework" tag → corner-most ✅ | `⤢` icon-only | Yes ✅ |
| M6 | Pipeline by Gate — **restore** | `page.tsx:5293` | Overlay header right | **`⤡ Minimize`** — icon **+ word**, and `px-2 py-0.5` (every other restore is icon-only `px-1.5`) ❌ | n/a |
| — | Present-mode native fullscreen | `page.tsx:3199` (`el.requestFullscreen?.()`) | Deck only; different idiom (browser fullscreen, no corner glyph) | — | **Out of scope** — do not normalise |

**ChartFrame call sites (inherit M2 automatically):** `:3248` (MiniFinChart in slide field) · `:3407` (slide chart field) · `:5636` (Dependency Constellation).

**Surfaces with NO maximize — leave them alone:** Growth Model `:4830` · Allocation & upside `:5416` · Rollup `:5446` · Financial Map `:5147` · Intelligence Load `:5530` · Gate Requirements `:4080` · Risk Register `:5728`.

### Canonical treatment (ONE recipe)
> **Upper-right of its own box · single `⤢`/`⤡` glyph, icon-only · lexicon strings · last child of the header's right-hand cluster.**

- **In-flow (card header) recipe** — use for M1, M3, M4, M5, M6:
  `className="ml-auto shrink-0 rounded-md border border-slate-700 px-1.5 py-0.5 text-[13px] leading-none text-slate-300 hover:bg-slate-800"`
  `title` **and** `aria-label` = `t(max ? "innovation.max.restore" : "innovation.max.expand")` (keys already exist — `frontend/lib/lexicon-data.ts:1349-1350`).
- **Absolute (frame overlay) recipe** — M2 only, already correct:
  `className="absolute right-1 top-1 z-[2] rounded-md border border-slate-700 bg-[#0b0f14]/85 px-1.5 py-0.5 text-[13px] leading-none text-slate-300 hover:bg-slate-800"`.

### Exact call sites that must change
1. **`:606-609`** — move the whole `<button>` out of the left cluster (`:602-620`) and make it the **last child of the right cluster** (`:621-631`, after the level segmented control). Swap `px-2 … text-[11px]` → the in-flow recipe. *(Lexicon already correct — do not touch the `t()` calls.)*
2. **`:2312-2315`** — keep in place, add `ml-auto shrink-0`, replace `"Restore"/"Maximize deep-dive"` with the two lexicon keys. Guarantees it stays right-most when the row wraps.
3. **`:2325-2326`** — reorder: move the button to **after** the HI/AI toggle `<div>` (`:2327-2334`) inside cluster `:2323`; apply the in-flow recipe + lexicon keys.
4. **`:5293`** — drop the word `Minimize` (icon-only `⤡`), `px-2` → `px-1.5`, add lexicon keys, `rounded` → `rounded-md`.
5. **`:5306`** — `rounded` → `rounded-md`; lexicon keys instead of `"Maximize"`.
6. **`:1021-1022`** — `rounded` → `rounded-md`, `text-[11px]` → `text-[13px] leading-none`, raw English → lexicon keys. Everything else is already canonical.

After these six edits every maximize on `/innovation` is the same glyph, same box, same corner, same 2 strings.

---

## PART 2 — PORTRAIT OVERFLOW RISK REGISTER (390 × 844)

Usable inner width at 390: `390 − page px-5 (40) − card p-4 (32) ≈ 318px`.

| ID | Surface · file:line | What breaks at 390px | MINIMIZE strategy |
|----|--------------------|----------------------|-------------------|
| **R1 🔴** | Rack & Stack **product** table `:744-769` (rows `:954-982`) | 10 columns (grip · # · Project # · Gate · Conf · NRE · P-wt Rev · NPV · Cum · ▲▼) on `<table className="w-full text-sm">` with **no `min-w`**. Parent `:650` is `overflow-x-auto`, but a `w-full` table never exceeds its container → **it compresses instead of scrolling**: the name cell squeezes to ~40px and `{p.division} · {p.category}` (`:966`) wraps 3-4 lines. This is IMG_8295. | Add `min-w-[720px]` to the `<table>` at `:745` so `:650`'s `overflow-x-auto` actually engages. **Reuse the proven pattern** at `:4160` (`min-w-[720px]`) / `:5688` (`min-w-[560px]`). Second lever, zero new code: default `rowMode="cards"` on portrait phone — the card renderer already exists at `:718-742`. |
| **R2 🔴** | Rack & Stack **material/BOM** table `:773-817` | 9 columns, 6 of them `$` money (`Labor · Material · Machining · Other · Std cost · Extended`) + a free-text Description. Same `w-full text-sm`, no `min-w`. Worst compression on the page. | `min-w-[820px]` on `:773`. |
| **R3 🟠** | Rack & Stack **group** table `:687-708` | 7 columns, same `w-full` / no `min-w`. Header labels `# Proj`, `P-wt Rev`, `Cum` survive; the level label column collapses. | `min-w-[560px]` on `:687`. |
| **R4 🔴** | Level segmented row `:625-630` | `flex flex-wrap overflow-hidden rounded-md border` — 5 buttons (`BU · SBU · Alpha Grp · Product # · Material #`) ≈ 278px + ScopeFilter ≈ 120px in the same right cluster. **`flex-wrap` inside a `rounded-md border overflow-hidden` pill breaks the pill**: the second row renders with square ends and a stray border. | Replace `flex-wrap` with `flex-nowrap overflow-x-auto whitespace-nowrap`. The exact portrait recipe already exists at `:4857` — copy it, do not invent: `flex-nowrap gap-1.5 overflow-x-auto whitespace-nowrap text-[10px] [&_button]:px-2 [&_button]:py-0.5`. |
| **R5 🔴** | `ScopeFilter` dropdown `:1426` | Panel is `absolute z-50 mt-1 w-64` (256px) with an implicit `left-0`. Its trigger `:1419` sits in the **right** cluster, so at 390px the panel opens past the viewport right edge — BU/SBU/Alpha chips (`:1405-1412`) are clipped and unclickable. **Direct violation of "a selectable control must be fully visible."** Gets worse once M1 moves into the same cluster. | Add `right-0` (i.e. `left-auto right-0`) to `:1426`, and `max-w-[calc(100vw-2rem)]` so it never exceeds the viewport. Same dropdown is reused on the Growth Model at `:4858` — one fix covers both. |
| **R6 🟠** | Card header `:601-632` | Two clusters × 5 controls; at 390 it wraps to 4-5 lines (~140px of chrome before any data). Title string at `:604` is a full sentence ("drag priority across the funding line"). | After R4, shorten the `<h2>` on portrait (title only, move the verb sentence into the existing footer hint at `:820-821` — that string already says it). No new component. |
| **R7 🟠** | `ValueEquationPanel` rows `:1525-1540` | `overflow-x-auto` wrapper (`:1525`) around `grid grid-cols-[1fr_auto_auto_auto_auto]` (`:1526`, `:1534`). A `1fr` first track **shrinks**, so the wrapper never scrolls and the driver name clips to ~30px. Same class of bug as R1. | Add `min-w-[420px]` to the two grid rows (`:1526`, `:1534`). |
| **R8 🟠** | ProjectDetail metrics grid `:2465` | `grid-cols-3` at 390 ⇒ ~100px/tile; labels carry `truncate` (`:2468`) so long metric names **silently clip** (readable only via `title`). | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` — one class change, tiles become legible; nothing hides. |
| **R9 🔴** | ProjectDetail exec strip `:2487-2492` | `grid grid-cols-4 gap-2` ⇒ ~73px/cell. `COGS/MSRP/Margin` fit; **`Customer` (`:2491`) has no `truncate` and no wrap guard** → a real customer name blows the cell and pushes the grid wider than the card. | `grid-cols-2 sm:grid-cols-4` + `truncate` (with `title`) on the Customer value. |
| **R10 🟠** | Dependency Constellation control bar `:5617-5634` | `flex flex-wrap` holding a 4-button group (`:5619`), a **5-button** group (`:5626`, ≈260px), a Reset button and an `ml-auto` help sentence. At 390 this wraps to ~6 rows and `ml-auto` puts the hint in a random slot. Both pill groups are `overflow-hidden` non-wrapping, so they *push* rather than clip — legal but hostile. | Apply the R4 / `:4857` single-line horizontal-scroll recipe to the `:5617` row; drop the help sentence to its own line below on portrait. |
| **R11 🟠** | Rollup table `:5447-5448` | `overflow-x-auto` + `w-full text-sm`, 5 columns, **no `min-w`** → compresses (same failure family as R1/R3). | `min-w-[520px]` on `:5448`. |
| ✅ | Pipeline by Gate `:5212-5213` | `-mx-1 overflow-x-auto px-1` + `grid min-w-[680px] grid-cols-7` | **Correct — use as the reference pattern for R1-R3/R11.** |
| ✅ | Gate Requirements `:4159-4160` (`min-w-[720px]`), gate cards `:4125-4130` (`min-w-[104px]`), view tabs `:572` (`overflow-x-auto` + `whitespace-nowrap`), ROI cash chart `:5379-5380` (`minWidth:360`), Growth Model selectors `:4857` | Scroll correctly at 390 | No action |
| ✅ | Maximized stack container `:650` (`flex-1 min-h-0 overflow-auto`), `FundingDivider` colSpans (`:703` = 7 for the 7-col table, `:953` = 10 for the 10-col table) | Verified correct | **Do not "fix"** |

**Pattern law extracted:** on this page, `overflow-x-auto` + `w-full` **without `min-w-[…]`** is a no-op. Every 🔴 in this register is that one mistake. Grep gate before commit:
`grep -n 'overflow-x-auto' app/innovation/page.tsx` → each hit's child table/grid must carry a `min-w-[…]` or an `auto`/`fixed` track.

---

## PART 3 — SCREENSHOT-GATE EXTENSION SPEC (`frontend/scripts/slide-shots.mjs`)

Today the script only reaches **Present mode** (`openSlide`, `:146-157`) and audits `[data-slide-canvas]` (`AUDIT`, `:85-143`). It never sees the page surfaces in Part 2. Extend, do not fork — reuse `serve()` (`:57`), `launch()` (`:70`), the failure array and the exit line (`:220`).

**1 · Route & viewport.** `http://127.0.0.1:${PORT}/innovation/` at **390×844 only** for the page pass (`VIEWPORTS[0]`, `:50`). Desktop 1440×810 is optional parity; the defect class is portrait-specific.

**2 · Unlock.** Already solved — keep `ctx.addInitScript` (`:171-174`) setting `sessionStorage["innovation-unlocked"] = "1"`. Key confirmed at `page.tsx:54` (`SS_KEY`), code `369963` at `page.tsx:53`. Keep the password-field fallback (`:149-150`) verbatim.

**3 · Surface enumeration (new `openSurface(page, tab, level)`).**
Tabs come from `page.tsx:573`: `Portfolio` (label is the dynamic `stackName`), `Gate Requirements`, `Dashboards`, `Setup`. Drive with `page.getByRole("button", { name: … }).first().click()`, mirroring `:151`.

| Surface | Navigation | Notes |
|---------|-----------|-------|
| Portfolio Prioritization / Rack & Stack — product | Portfolio tab → click `Product #` | The IMG_8295 case |
| Rack & Stack — group | Portfolio tab → click `BU`, then `SBU`, then `Alpha Grp` | 3 sub-runs |
| Rack & Stack — BOM | Portfolio tab → click `Material #` | |
| Growth Model | Portfolio tab @ any group level | Rendered only when `isGroupLevel` (`page.tsx:589`) |
| Project detail | Portfolio tab → click first `[data-stack-row]` (`page.tsx:726` / `:956`) | Portrait reveals it below |
| Pipeline by Gate · ROI Visuals · Allocation & upside · Rollup · Dependency Constellation | Dashboards tab; inside ROI Visuals also click `Metrics`, `Spend`, `Cash Flow` (`page.tsx:5355`) | |
| Gate Requirements | Gate Requirements tab | |

**4 · Boxed-surface selector.** There is **no page-level hook today** (`data-panel*` exists only in the deck, `page.tsx:3086-3094`). Two options; pick (a):
 (a) **Add `data-surface="<slug>"` to each card root** — `:598` (stack), `:826` (detail), `DashCard` root `:5122`, `:4830` (growth), `:5301`/`:5290` (pipeline), Gate Requirements root. Then `document.querySelectorAll("[data-surface]")` is the audit set and every failure is self-naming. *(This is a 6-attribute diff, no behaviour change.)*
 (b) Fall back to `main div.rounded-xl.border.border-slate-800` — brittle, only if (a) is refused.

**5 · Assertions** (new `PAGE_AUDIT`, modelled on `:105-122` but page-scoped — the canvas-bounds check at `:116-122` does **not** apply):
- **A · Clip:** for every descendant of a `[data-surface]`, fail when `getComputedStyle` overflow matches `/hidden|clip/` **and** (`scrollWidth − clientWidth > 1` or `scrollHeight − clientHeight > 1`). Keep the 1px sub-pixel slack from `:108-109`.
- **B · Compression (the R1 detector — new, and the one that would have caught IMG_8295):** for every `table`/`grid` inside a `[data-surface]`, fail when its **parent** is `overflow-x:auto|scroll` **and** the child's `scrollWidth <= clientWidth` **and** the child has `>= 6` column cells (`:scope > thead > tr > th` count or `gridTemplateColumns` track count). Meaning: "you put it in a scroller but it can't scroll — so it compressed."
- **C · Control outside viewport:** for every `button, [role="button"], input, select, a[href]` inside a `[data-surface]`, take `getBoundingClientRect()` and fail when `rect.left < -2 || rect.right > innerWidth + 2 || rect.width === 0`. **Open every dropdown first** (click `ScopeFilter` trigger `page.tsx:1419`) — R5 is invisible while closed.
- **D · Page never scrolls sideways:** `document.documentElement.scrollWidth <= innerWidth + 1`.
- **E · Touch target:** any control with `rect.height < 24 || rect.width < 24` is a warning line (not a failure) — informs, doesn't block.

**6 · Reporting & wiring.** Reuse the `failures.push(\`${tag} — …\`)` shape (`:195-209`) and `SHOTS=1` PNG dump (`:189-192`) writing to `docs/feedback/shots/<surface>_phone-portrait.png`. Add `"test:page-shots"` to `package.json` beside `"test:slide-shots"` (`package.json:40`). **Note:** `test:slide-shots` is currently **absent from `test:all`** (`package.json:55`) — both gates should be added there, or neither runs in CI.

---

## PART 4 — AsM VERDICT

**Aset — consistency.** Six maximize controls, five different implementations: two class recipes (`px-2 py-0.5 text-[11px]` vs `px-1.5 py-0.5 text-[13px]`), two label systems (lexicon at `:607-608`, raw English everywhere else), one control that carries a word (`:5293` "⤡ Minimize") while its own twin two lines away (`:5306`) is icon-only, and one (`:606`) parked on the *opposite side of the header* from every sibling. A user who learns the glyph on the Pipeline card cannot find it on the Portfolio card. `ChartFrame` (`:1011-1029`) already solved this correctly; the fix is to make five call sites agree with the primitive that exists, not to write a sixth.

**Sofia — phone vs desktop.** On desktop nothing here is visible: at 1440px every table fits, every pill row sits on one line, the ScopeFilter panel opens into empty space. Portrait 390 inverts all of it. The recurring root cause is one idiom applied without its other half: `overflow-x-auto` wrapped around a `w-full` table (R1, R2, R3, R11) or a `1fr` grid (R7) can never scroll, so the browser silently compresses instead — the failure mode is *unreadable*, not *scrollable*, and it looks fine in every desktop screenshot. Worth naming: the page already contains the correct pattern **four times** (`:1327`, `:4160`, `:5213`, `:5688`). This is not a design problem, it is four missing `min-w-[…]` tokens.

**Christo — can every persona still act?** Mostly yes, with one hard no. Managers, SBU Directors and VPs can still read the stack (compressed, ugly, but present) and every maximize control is reachable. The blocking case is **R5**: the ScopeFilter panel (`:1426`) opens off the right edge at 390px, so a VP on a phone cannot select a BU/SBU/Alpha group — the single most persona-defining action on the page — and the same dropdown gates the Growth Model (`:4858`). That is a selectable control that is not fully visible and does not minimize: the operator's law, violated. Everything else in this register degrades gracefully; R5 removes a capability.

### MoT SYNTHESIS
1. **Highest-value fix: add the missing `min-w-[…]` to the four scroll containers (`:745` → `720px`, `:773` → `820px`, `:687` → `560px`, `:5448` → `520px`).** Four tokens, zero new components, and it is exactly the IMG_8295 defect — Portfolio Prioritization becomes readable-by-scroll instead of crushed-to-illegible.
2. Immediately after, ship **R5** (`right-0` on `:1426`) — it is one class and it restores an action that is currently impossible on a phone.
3. Then the Part-1 normalisation (six call sites, one recipe) and the Part-3 gate — the gate's **assertion B** is what stops this whole family of defects from returning, because tsc and unit tests structurally cannot see it.
