"""Cube 10 — Semi-Auto / Full-Auto agent SCAFFOLD (DISABLED by default).

Operator sequence: Manual is the only ENABLED tier. Semi-Auto (② AI proposes,
human selects) and Full-Auto (③ AI evolves under guardrails, the community SI
vote approves, human override permanent) are DESIGNED + DEMOED here on the SAME
backbone (`challenge_loop.decide_swap` tiers) — but no autonomous swap runs until
the operator confirms "Manual aligned".

This module is PURE + DETERMINISTIC + OFFLINE-safe:
  * It proposes candidate variants deterministically from the block's real
    functions (a scaffold of what a provider WOULD return) — no network.
  * A real provider is invoked ONLY when a BYOK key is configured AND the tier
    is explicitly enabled. With no key it degrades to the deterministic scaffold
    and reports `provider_available=false` (Odin's guardrail: never silently
    ship an autonomous swap without an explicit key + enablement).
  * The 12-lens council mirrors the 12 Ascended Masters; Thor holds a SAFE veto
    (a regression-risk lens can block RECOMMENDED regardless of the others).

Nothing here bypasses the permanent equivalence guardrail on the automated tier
(`decide_swap`), the ≥3-member human validation gate, or the replay evidence.
"""

from __future__ import annotations

# The 12 Ascended Masters review lenses (CLAUDE.md). Thor = the SAFE veto.
COUNCIL_LENSES = (
    "Aset", "Asar", "Athena", "Christo", "Enki", "Enlil",
    "Krishna", "Odin", "Pangu", "Sofia", "Thoth", "Thor",
)
_VETO_LENS = "Thor"  # risk/security stress — a fail here forces SAFE=false


def provider_available() -> bool:
    """True only when a real AI provider key (BYOK) is configured. Offline → False."""
    try:
        from app.cubes.cube6_ai.providers.base import AIProviderName
        from app.cubes.cube6_ai.providers.factory import _has_api_key

        return any(
            _has_api_key(p)
            for p in (
                AIProviderName.OPENAI, AIProviderName.GEMINI,
                AIProviderName.GROK, AIProviderName.CLAUDE,
            )
        )
    except Exception:
        return False


def _det_pct(seed: str, lo: int, hi: int) -> int:
    """Deterministic pseudo-value in [lo, hi] from a seed (no randomness — replayable)."""
    import hashlib

    h = int(hashlib.sha256(seed.encode()).hexdigest(), 16)
    return lo + (h % (hi - lo + 1))


def propose_variants(cube_id: int, section: str, functions: list[str], *, count: int = 3) -> list[dict]:
    """Scaffold the variants a provider WOULD propose for a block — deterministic, offline.

    Each variant is a labelled *strategy* over the block's real functions with a
    projected efficiency gain, NOT executable code — the human still writes/selects
    the real candidate. This is the demo surface for Semi-Auto proposal.
    """
    strategies = (
        ("batch", "Batch the row-by-row calls in this block into one vectorized pass."),
        ("memoize", "Memoize the block's deterministic sub-results (cache repeated work)."),
        ("stream", "Stream/incremental-update instead of recomputing the block whole."),
        ("prune", "Prune redundant branches; short-circuit the common path first."),
        ("parallelize", "Fan the block's independent units across the worker pool."),
    )
    fn0 = functions[0] if functions else f"cube{cube_id}"
    out: list[dict] = []
    for i in range(max(1, min(count, len(strategies)))):
        key, desc = strategies[i]
        seed = f"{cube_id}:{section}:{key}:{fn0}"
        out.append({
            "id": f"{section}~{key}",
            "strategy": key,
            "description": desc,
            "target_fn": fn0,
            "projected_efficiency_pct": _det_pct(seed, 6, 22),
            "source": "scaffold",  # not a live provider proposal
        })
    return out


def council_review(cube_id: int, variant: dict) -> dict:
    """12-lens SAFE + RECOMMENDED verdict for a proposed variant (deterministic scaffold).

    RECOMMENDED = a supermajority of lenses approve AND the projected gain clears the
    win threshold. SAFE = Thor's risk lens did not veto. An unsafe variant can never be
    RECOMMENDED — the guardrail is permanent (mirrors decide_swap's equivalence veto).
    """
    proj = int(variant.get("projected_efficiency_pct", 0))
    votes: dict[str, bool] = {}
    for lens in COUNCIL_LENSES:
        seed = f"{cube_id}:{variant.get('id','')}:{lens}"
        # A lens approves if its deterministic confidence clears 40 — Thor is stricter.
        bar = 62 if lens == _VETO_LENS else 40
        votes[lens] = _det_pct(seed, 0, 100) >= bar
    safe = votes.get(_VETO_LENS, False)
    approvals = sum(1 for v in votes.values() if v)
    supermajority = approvals >= (2 * len(COUNCIL_LENSES) + 2) // 3  # ⌈2/3⌉
    recommended = bool(safe and supermajority and proj >= 10)
    return {
        "safe": safe,
        "recommended": recommended,
        "approvals": approvals,
        "lenses": len(COUNCIL_LENSES),
        "votes": votes,
        "veto_lens": _VETO_LENS,
        "note": (
            "SAFE + RECOMMENDED — human selects to proceed (Semi-Auto)"
            if recommended else
            "blocked by Thor (risk veto)" if not safe else
            "not recommended — insufficient council consensus or projected gain <10%"
        ),
    }


def ai_council(cube_id: int, section: str, functions: list[str], *, count: int = 3) -> dict:
    """Semi/Full-Auto SCAFFOLD entry point. Returns proposed variants + council verdicts.

    `enabled` is False unless a BYOK provider key is present — the autonomy tiers stay
    demo-only until the operator both configures a key AND confirms Manual aligned.
    """
    variants = propose_variants(cube_id, section, functions, count=count)
    reviewed = [{**v, "council": council_review(cube_id, v)} for v in variants]
    avail = provider_available()
    return {
        "cube_id": cube_id,
        "section": section,
        "enabled": False,           # DISABLED: demo + scaffold only (operator sequence)
        "provider_available": avail,
        "tier_ladder": ["manual", "semi", "automated"],
        "active_tier": "manual",
        "variants": reviewed,
        "recommended": [v for v in reviewed if v["council"]["recommended"]],
        "note": (
            "Semi/Full-Auto are scaffolded on the same backbone (decide_swap tiers) but "
            "stay DISABLED until Manual is confirmed aligned. Variants shown are a "
            "deterministic scaffold; a live provider runs only with a BYOK key."
        ),
    }
