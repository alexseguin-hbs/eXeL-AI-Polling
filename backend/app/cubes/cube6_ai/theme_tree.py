"""t181/t182 — strict Theme02 tree (3→2→3 children) + level-sized descriptions.

Each level-3 theme has exactly 2 level-6 children and 3 level-9 descendants via tree_parent_id.
Counts at a parent equal the sum of its children's counts. Descriptions: 111 words at level 9,
222 at level 6, 333 at level 3, raced across all keyed vendors (no preference).
"""
from __future__ import annotations

import asyncio
import re
from collections import Counter, defaultdict
from typing import Any, Awaitable, Callable

DESCRIPTION_WORDS = {"9": 111, "6": 222, "3": 333}

SummarizeFn = Callable[[str], Awaitable[str]]


def _cooccur(responses: list[dict], cat: str) -> tuple[Counter, Counter, Counter]:
    """(l6,l3), (l9,l6), (l9,l3) co-occurrence among responses in this Theme01 category."""
    c63: Counter = Counter()
    c96: Counter = Counter()
    c93: Counter = Counter()
    for r in responses:
        if r.get("theme01") != cat:
            continue
        a9, a6, a3 = r.get("theme2_9") or "", r.get("theme2_6") or "", r.get("theme2_3") or ""
        if a6 and a3:
            c63[(a6, a3)] += 1
        if a9 and a6:
            c96[(a9, a6)] += 1
        if a9 and a3:
            c93[(a9, a3)] += 1
    return c63, c96, c93


def _best_parent(child: str, parents: list[str], scores: Counter, key_fn) -> str | None:
    best, n = None, -1
    for p in parents:
        s = scores.get(key_fn(child, p), 0)
        if s > n:
            best, n = p, s
    return best


def link_strict_tree(
    category: str,
    levels: dict[str, list[dict]],
    responses: list[dict],
) -> dict[str, dict[str, str | None]]:
    """Return {level: {label: tree_parent_label_or_None}} for non-empty themes.

    Level-3 roots have parent None. Level-6 → a level-3. Level-9 → a level-6 when possible,
    else a level-3. After greedy co-occurrence linking, rebalance so each L3 has exactly
    2 L6 and 3 L9 descendants (moving the lowest-count extras).
    """
    l3 = [t["label"] for t in levels.get("3", []) if t.get("label") and not t.get("is_empty")]
    l6 = [t["label"] for t in levels.get("6", []) if t.get("label") and not t.get("is_empty")]
    l9 = [t["label"] for t in levels.get("9", []) if t.get("label") and not t.get("is_empty")]
    c63, c96, c93 = _cooccur(responses, category)

    parent: dict[str, dict[str, str | None]] = {"3": {x: None for x in l3}, "6": {}, "9": {}}
    for lab in l6:
        parent["6"][lab] = _best_parent(lab, l3, c63, lambda c, p: (c, p)) if l3 else None
    for lab in l9:
        p6 = _best_parent(lab, l6, c96, lambda c, p: (c, p)) if l6 else None
        if p6:
            parent["9"][lab] = p6
        else:
            parent["9"][lab] = _best_parent(lab, l3, c93, lambda c, p: (c, p)) if l3 else None

    # Rebalance L6: each L3 gets exactly 2 (when enough children exist).
    if l3 and l6:
        groups: dict[str | None, list[str]] = defaultdict(list)
        for lab, p in parent["6"].items():
            groups[p].append(lab)
        # Orphans → round-robin onto L3
        orphans = groups.pop(None, [])
        for i, lab in enumerate(orphans):
            parent["6"][lab] = l3[i % len(l3)]
            groups[l3[i % len(l3)]].append(lab)
        # Trim / fill to 2 per L3 using leftovers
        extras: list[str] = []
        for p in l3:
            kids = groups.get(p, [])
            if len(kids) > 2:
                # keep the 2 with highest co-occur with p
                kids_sorted = sorted(kids, key=lambda k: c63.get((k, p), 0), reverse=True)
                groups[p] = kids_sorted[:2]
                extras.extend(kids_sorted[2:])
                for k in kids_sorted[2:]:
                    parent["6"][k] = None
            elif len(kids) < 2:
                groups[p] = kids
        for lab in extras:
            # give to the L3 with fewest children
            target = min(l3, key=lambda p: len([k for k, v in parent["6"].items() if v == p]))
            parent["6"][lab] = target

    # Rebalance L9: each L3 ends with exactly 3 descendants (via L6 chain or direct).
    def root_of_9(lab: str) -> str | None:
        p = parent["9"].get(lab)
        if p in l3:
            return p
        if p in parent["6"]:
            return parent["6"].get(p)
        return None

    if l3 and l9:
        for lab in l9:
            if root_of_9(lab) is None and l3:
                # attach under an L6 of the least-loaded L3, else direct to L3
                target3 = min(l3, key=lambda p: sum(1 for x in l9 if root_of_9(x) == p))
                kids6 = [k for k, v in parent["6"].items() if v == target3]
                parent["9"][lab] = kids6[0] if kids6 else target3
        # Trim to 3 per L3
        by_root: dict[str, list[str]] = defaultdict(list)
        for lab in l9:
            r = root_of_9(lab)
            if r:
                by_root[r].append(lab)
        for p in l3:
            kids = by_root.get(p, [])
            if len(kids) <= 3:
                continue
            kids_sorted = sorted(kids, key=lambda k: c93.get((k, p), 0), reverse=True)
            for k in kids_sorted[3:]:
                # move to under-filled root
                target = min(l3, key=lambda r: len(by_root.get(r, [])))
                if target == p:
                    continue
                kids6 = [x for x, v in parent["6"].items() if v == target]
                parent["9"][k] = kids6[0] if kids6 else target
                by_root[p].remove(k)
                by_root.setdefault(target, []).append(k)

    return parent


def enforce_count_sums(
    levels: dict[str, list[dict]],
    parent_map: dict[str, dict[str, str | None]],
    assigned: Counter,
    category: str,
) -> None:
    """In-place: set each theme's response_count from assignment; then lift child sums to parents.

    L9 counts come from assigned[(9, cat, label)]. L6 = sum of its L9 children (or own assign if no kids).
    L3 = sum of its L6 children (or own assign). Mutates theme dicts' response_count.
    """
    by_label = {lvl: {t["label"]: t for t in themes if t.get("label")} for lvl, themes in levels.items()}

    for t in levels.get("9", []):
        if not t.get("label") or t.get("is_empty"):
            t["response_count"] = 0
            continue
        t["response_count"] = int(assigned.get(("9", category, t["label"]), 0))

    # L6 = sum of L9 whose parent is this L6
    children9: dict[str, list[str]] = defaultdict(list)
    for lab, p in parent_map.get("9", {}).items():
        if p:
            children9[p].append(lab)
    for t in levels.get("6", []):
        lab = t.get("label") or ""
        if not lab or t.get("is_empty"):
            t["response_count"] = 0
            continue
        kids = children9.get(lab, [])
        if kids:
            t["response_count"] = sum(by_label["9"][k]["response_count"] for k in kids if k in by_label.get("9", {}))
        else:
            t["response_count"] = int(assigned.get(("6", category, lab), 0))

    children6: dict[str, list[str]] = defaultdict(list)
    for lab, p in parent_map.get("6", {}).items():
        if p:
            children6[p].append(lab)
    # Also L9 attached directly to L3
    direct9: dict[str, list[str]] = defaultdict(list)
    for lab, p in parent_map.get("9", {}).items():
        if p in parent_map.get("3", {}):
            direct9[p].append(lab)
    for t in levels.get("3", []):
        lab = t.get("label") or ""
        if not lab or t.get("is_empty"):
            t["response_count"] = 0
            continue
        s = sum(by_label["6"][k]["response_count"] for k in children6.get(lab, []) if k in by_label.get("6", {}))
        s += sum(by_label["9"][k]["response_count"] for k in direct9.get(lab, []) if k in by_label.get("9", {}))
        t["response_count"] = s if s else int(assigned.get(("3", category, lab), 0))


def _word_count(text: str) -> int:
    return len([w for w in re.split(r"\s+", (text or "").strip()) if w])


def build_description_prompt(label: str, level: str, samples: list[str]) -> str:
    n = DESCRIPTION_WORDS[level]
    joined = "\n---\n".join(samples[:40])
    return (
        f'Write a {n}-word description of the theme "{label}" that summarizes what participants said.\n'
        f"Use ONLY the sampled responses below. Analytical tone. No bullet lists. "
        f"Aim for exactly {n} words (±10).\n\nSAMPLED RESPONSES:\n{joined}\n\n"
        f"Reply with the description only — no title, no word count."
    )


async def generate_descriptions(
    levels: dict[str, list[dict]],
    responses: list[dict],
    category: str,
    summarize: SummarizeFn,
    *,
    concurrency: int = 6,
) -> None:
    """Fill theme['description'] in-place for non-empty themes. Failures leave description unset."""
    sem = asyncio.Semaphore(concurrency)

    async def one(level: str, theme: dict) -> None:
        label = theme.get("label") or ""
        if not label or theme.get("is_empty"):
            return
        key = f"theme2_{level}"
        samples = []
        for r in responses:
            if r.get("theme01") != category or r.get(key) != label:
                continue
            s = (r.get("summary_33") or r.get("summary_111") or r.get("raw_text") or "").strip()
            if s:
                samples.append(s[:500])
            if len(samples) >= 40:
                break
        if not samples:
            samples = [label]
        prompt = build_description_prompt(label, level, samples)
        async with sem:
            try:
                text = (await summarize(prompt) or "").strip()
            except Exception:
                return
        if text:
            theme["description"] = text

    tasks = [one(lvl, t) for lvl in ("9", "6", "3") for t in levels.get(lvl, [])]
    if tasks:
        await asyncio.gather(*tasks)
