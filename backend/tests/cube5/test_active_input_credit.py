"""CRS-19.09 anti-gaming tests for active typing/speaking ♡ credit."""

from app.cubes.cube5_gateway.active_input import (
    MAX_MS_PER_CHAR,
    RULE_VERSION,
    decide_active_input_credit,
    validate_active_ms,
)


def test_idle_claimed_time_capped_by_wall():
    # Client claims 10 minutes; wall since join is 30s → 30s credit max before char cap
    ms = validate_active_ms(
        claimed_ms=600_000,
        wall_ms=30_000,
        text_len=100,
        paste_detected=False,
    )
    assert ms == 30_000


def test_paste_zeros_typing_credit():
    ms = validate_active_ms(
        claimed_ms=60_000,
        wall_ms=120_000,
        text_len=500,
        paste_detected=True,
        voice_ms=0,
    )
    assert ms == 0


def test_paste_allows_voice_credit():
    ms = validate_active_ms(
        claimed_ms=60_000,
        wall_ms=120_000,
        text_len=50,
        paste_detected=True,
        voice_ms=15_000,
    )
    assert ms == 15_000


def test_inflated_active_ms_capped_by_chars():
    # 10 chars → max 10 * MAX_MS_PER_CHAR even if wall and claim are huge
    ms = validate_active_ms(
        claimed_ms=3_600_000,
        wall_ms=3_600_000,
        text_len=10,
        paste_detected=False,
    )
    assert ms == 10 * MAX_MS_PER_CHAR


def test_empty_text_earns_nothing():
    ms = validate_active_ms(
        claimed_ms=60_000,
        wall_ms=60_000,
        text_len=0,
        paste_detected=False,
        empty=True,
    )
    assert ms == 0
    d = decide_active_input_credit(
        claimed_ms=60_000,
        wall_ms=60_000,
        text="   ",
        paste_detected=False,
    )
    assert d.credited_ms == 0
    assert d.heart == 0.0
    assert d.unity == 0.0


def test_tokens_reuse_ceil_minutes_rule():
    # 90s active → ceil(1.5)=2 ♡, ◬=10 (unity multiplier default 5)
    d = decide_active_input_credit(
        claimed_ms=90_000,
        wall_ms=120_000,
        text="x" * 200,
        paste_detected=False,
    )
    assert d.credited_ms == 90_000
    assert d.heart == 2.0
    assert d.unity == 10.0
    assert d.rule_version == RULE_VERSION


def test_sub_minute_active_earns_one_heart():
    d = decide_active_input_credit(
        claimed_ms=5_000,
        wall_ms=60_000,
        text="hello world this is enough text",
        paste_detected=False,
    )
    assert d.credited_ms == 5_000
    assert d.heart == 1.0
    assert d.unity == 5.0
