"""CRS-09.08.06 regression: Grok echoed the notebook's literal 'THEME (Confidence: XX%)' placeholder (0/30 parsed in a
2026-11-09 probe), sending every response to Neutral at confidence 0. The instruction must name a placeholder the model
replaces and show a filled-in example the parser accepts."""
from app.cubes.cube6_ai import phase_b as pb


def test_instruction_has_no_literal_theme_placeholder():
    assert "'THEME (" not in pb._CLASSIFY_INSTRUCTION
    assert "<category>" in pb._CLASSIFY_INSTRUCTION
    for cat in pb.THEME01_CATEGORIES:
        assert f"'{cat}'" in pb._CLASSIFY_INSTRUCTION


def test_example_reply_parses_to_risk():
    example = pb._CLASSIFY_INSTRUCTION.split("Example reply: ", 1)[1]
    m = pb._CLASSIFY_PATTERN.match(example)
    assert m and pb._normalize_theme01(m.group(1)) == "Risk & Concerns" and int(m.group(2)) == 85


def test_literal_placeholder_reply_is_not_binned_confidently():
    m = pb._CLASSIFY_PATTERN.match("THEME (Confidence: 40%)")
    assert m and pb._normalize_theme01(m.group(1)) is None
