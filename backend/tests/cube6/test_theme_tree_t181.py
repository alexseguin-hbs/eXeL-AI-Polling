"""t181/t182: strict Theme02 tree links + count sums (no AI / no DB)."""
from collections import Counter

from app.cubes.cube6_ai.theme_tree import (
    DESCRIPTION_WORDS,
    build_description_prompt,
    enforce_count_sums,
    link_strict_tree,
)


def _themes(labels):
    return [{"label": lab, "description": f"short for {lab}", "confidence": 0.8} for lab in labels]


def test_description_word_targets():
    assert DESCRIPTION_WORDS == {"9": 111, "6": 222, "3": 333}
    p = build_description_prompt("Privacy", "9", ["cameras everywhere"])
    assert "111-word" in p and "Privacy" in p


def test_link_strict_tree_two_l6_three_l9_per_l3():
    levels = {
        "3": _themes(["Alpha", "Beta", "Gamma"]),
        "6": _themes(["A1", "A2", "B1", "B2", "C1", "C2"]),
        "9": _themes([f"{p}{k}" for p in "ABC" for k in "123"]),
    }
    # Responses: each L9 shares its letter with L6/L3
    responses = []
    for p, name in zip("ABC", ["Alpha", "Beta", "Gamma"]):
        for k in "12":
            for n in range(3):
                responses.append({
                    "theme01": "Risk & Concerns",
                    "theme2_3": name,
                    "theme2_6": f"{p}{k}",
                    "theme2_9": f"{p}{n+1}" if False else f"{p}{((n % 3) + 1)}",  # A1,A2,A3
                })
    # clearer responses
    responses = []
    for p, name in zip("ABC", ["Alpha", "Beta", "Gamma"]):
        for k in "12":
            for j in "123":
                responses.append({
                    "theme01": "Risk & Concerns",
                    "theme2_3": name,
                    "theme2_6": f"{p}{k}",
                    "theme2_9": f"{p}{j}",
                })
    pmap = link_strict_tree("Risk & Concerns", levels, responses)
    # each L6 under some L3
    for lab, parent in pmap["6"].items():
        assert parent in {"Alpha", "Beta", "Gamma"}
    # exactly 2 L6 per L3
    for root in ("Alpha", "Beta", "Gamma"):
        kids = [k for k, v in pmap["6"].items() if v == root]
        assert len(kids) == 2, (root, kids)
    # each L9 resolves to an L3 root (directly or via L6)
    def root_of(lab):
        p = pmap["9"][lab]
        if p in pmap["3"]:
            return p
        return pmap["6"].get(p)
    for root in ("Alpha", "Beta", "Gamma"):
        kids = [k for k in pmap["9"] if root_of(k) == root]
        assert len(kids) == 3, (root, kids)


def test_enforce_count_sums_rolls_up():
    levels = {
        "3": _themes(["Alpha"]),
        "6": _themes(["A1", "A2"]),
        "9": _themes(["A1a", "A1b", "A1c"]),
    }
    parent_map = {
        "3": {"Alpha": None},
        "6": {"A1": "Alpha", "A2": "Alpha"},
        "9": {"A1a": "A1", "A1b": "A1", "A1c": "A1"},
    }
    assigned = Counter({
        ("9", "Risk & Concerns", "A1a"): 4,
        ("9", "Risk & Concerns", "A1b"): 3,
        ("9", "Risk & Concerns", "A1c"): 1,
        ("6", "Risk & Concerns", "A1"): 99,  # ignored when children exist
        ("6", "Risk & Concerns", "A2"): 5,
        ("3", "Risk & Concerns", "Alpha"): 999,
    })
    enforce_count_sums(levels, parent_map, assigned, "Risk & Concerns")
    by = {lvl: {t["label"]: t["response_count"] for t in themes} for lvl, themes in levels.items()}
    assert by["9"]["A1a"] == 4 and by["9"]["A1b"] == 3 and by["9"]["A1c"] == 1
    assert by["6"]["A1"] == 8  # 4+3+1
    assert by["6"]["A2"] == 5  # no L9 children → own assign
    assert by["3"]["Alpha"] == 13  # 8+5
