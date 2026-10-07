"""Every theme assignment written equals a stored Theme label (Aset, AsM round 17): phase B stores labels html-escaped,
and a model that answers with the unescaped form, other casing, or a name not on the list must never write a label no
Theme row carries — CQS eligibility and theme counts compare the two."""
import asyncio

from app.cubes.cube6_ai.phase_b import _assign_themes_llm, _group_by_theme01, _snap_label

THEMES = [{"label": "Privacy &amp; Trust"}, {"label": "Energy Cost"}]


def test_snap_label_matches_the_stored_form():
    assert _snap_label("Privacy &amp; Trust", THEMES) == "Privacy &amp; Trust"
    assert _snap_label("Privacy & Trust", THEMES) == "Privacy &amp; Trust"
    assert _snap_label("energy cost", THEMES) == "Energy Cost"
    assert _snap_label("Something Else", THEMES) is None


class _Replies:
    def __init__(self, reply):
        self.reply = reply

    async def batch_summarize(self, items, timeout=120.0):
        return [self.reply] * len(items)


def _assign(reply):
    responses = [{"id": "1", "theme01": "Risk & Concerns", "summary_33": "privacy matters"}]
    reduced = {"Risk & Concerns": {lvl: THEMES for lvl in ("9", "6", "3")}}
    return asyncio.run(_assign_themes_llm(_Replies(reply), responses, reduced))[0]


def test_unescaped_reply_writes_the_stored_label():
    r = _assign("Privacy & Trust (Confidence: 96%)")
    assert r["theme2_3"] == "Privacy &amp; Trust" and r["theme2_3_confidence"] == 96


def test_unknown_reply_falls_back_named_at_zero_confidence():
    r = _assign("A Theme Not Listed (Confidence: 99%)")
    assert r["theme2_3"] == "Privacy &amp; Trust" and r["theme2_3_confidence"] == 0


def test_unknown_theme01_is_written_back_as_its_bin():
    rs = [{"theme01": "Mostly Positive"}]
    bins = _group_by_theme01(rs)
    assert rs[0]["theme01"] == "Neutral Comments" and bins["Neutral Comments"] == rs
