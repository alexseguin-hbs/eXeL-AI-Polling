"""333/111/33 word limits are hard upper bounds, counted with the repo tokenizer (trim → split(/\\s+/) → non-empty)."""
import json
import re

import pytest

from app.cubes.cube6_ai.phase_a import SUMMARY_TIERS, _parse_json_reply, cap_words, word_count


def js_count(text: str) -> int:  # literal port of text.trim().split(/\s+/).filter(Boolean).length
    return len([w for w in re.split(r"\s+", text.strip()) if w])


@pytest.mark.parametrize("n", [0, 1, 32, 33, 34, 110, 111, 112, 332, 333, 334, 1000])
@pytest.mark.parametrize("limit", SUMMARY_TIERS)
def test_cap_is_upper_bound_and_matches_tokenizer(n, limit):
    text = "  " + "\n\t ".join(f"w{i}" for i in range(n)) + "  "
    out = cap_words(text, limit)
    assert word_count(out) == js_count(out) == min(n, limit)
    if n <= limit:
        assert out == text.strip()


def test_tiers_are_333_111_33():
    assert SUMMARY_TIERS == (333, 111, 33)


def test_parse_json_reply_strips_fences():
    body = {"summary_333": "a", "summary_111": "b", "summary_33": "c"}
    assert _parse_json_reply("```json\n" + json.dumps(body) + "\n```") == body
    assert _parse_json_reply("Here you go: " + json.dumps(body)) == body
    with pytest.raises((json.JSONDecodeError, TypeError)):
        _parse_json_reply("no json here")


def test_cost_tracked_wrapper_counts_calls():
    import asyncio
    from app.cubes.cube6_ai.phase_a import _CostTracked

    class Inner:
        async def summarize(self, texts, instruction=""):
            return "x" * 40

    w = _CostTracked(Inner(), "openai")
    asyncio.run(w.summarize(["a" * 400], instruction="b" * 100))
    asyncio.run(w.summarize(["c" * 100]))
    t = w.tracker
    assert (t.total_calls, t.total_input_chars, t.total_output_chars) == (2, 600, 80)
    assert t.estimated_cost_usd > 0
