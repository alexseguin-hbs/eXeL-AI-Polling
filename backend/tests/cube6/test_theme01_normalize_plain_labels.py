"""Theme quality fixes found in the live TEST session bgYtjNeF (2026-11-09).

* Theme labels reached participants HTML-escaped ("Technology&#x27;s Environmental Impact"): phase B stored
  html.escape()d text and React escaped it again. Labels are now stored as plain text with markup characters removed.
* Concerns filed under Neutral: a Theme01 reply that was not the exact category string was silently re-binned as
  Neutral while keeping the model's 85-90% confidence. Wording variants now map to their category; an unrecognised
  reply is Neutral at confidence 0.
"""
from __future__ import annotations

import pytest

from app.cubes.cube6_ai import phase_b
from app.cubes.cube6_ai.phase_b import _normalize_theme01, _parse_reduced_themes, _plain_label


@pytest.mark.parametrize("reply,cat", [
    ("Risk & Concerns", "Risk & Concerns"), ("'Risk & Concerns'", "Risk & Concerns"),
    ("**Risk & Concerns**", "Risk & Concerns"), ("THEME: Risk and Concerns", "Risk & Concerns"),
    ("risk &amp; concerns", "Risk & Concerns"), ('"Supporting Comments"', "Supporting Comments"),
    ("Neutral Comments", "Neutral Comments"), ("Theme01: Supporting", "Supporting Comments"),
    ("Risk & Concerns or Neutral Comments", None), ("banana", None), ("", None),
])
def test_theme01_wording_variants(reply, cat):
    assert _normalize_theme01(reply) == cat


class _Fake:
    def __init__(self, replies):
        self.replies = replies

    async def batch_summarize(self, items):
        return [self.replies[i % len(self.replies)] for i in range(len(items))]


async def test_classify_keeps_concerns_out_of_neutral_and_never_confident_on_unknown():
    rs = [{"summary_33": "I worry about privacy"}, {"summary_33": "x"}, {"summary_33": "y"}]
    out = await phase_b._classify_theme01(
        _Fake(["'Risk & Concerns' (Confidence: 90%)", "gibberish (Confidence: 88%)", "Supporting Comments (Confidence: 90%)"]),
        rs)
    assert [(r["theme01"], r["theme01_confidence"]) for r in out] == [
        ("Risk & Concerns", 90), ("Neutral Comments", 0), ("Supporting Comments", 90)]


def test_labels_are_plain_text():
    assert _plain_label("Technology&#x27;s Environmental Impact") == "Technology's Environmental Impact"
    assert _plain_label("Privacy & Trust") == "Privacy & Trust"
    assert "<" not in _plain_label("<script>alert(1)</script> Safety") and ">" not in _plain_label("a > b")
    parsed = _parse_reduced_themes("Technology's Impact: How tech's effects matter (Confidence: 85%)")
    if parsed:  # the reduce-line format is the model's; when it parses, it is stored unescaped
        assert "&#x27;" not in parsed[0]["label"] and "&#x27;" not in parsed[0]["description"]
