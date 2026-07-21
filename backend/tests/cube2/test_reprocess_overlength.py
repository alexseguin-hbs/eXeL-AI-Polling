"""Cube 2 — over-length second-pass reprocessing (Thought-Master directive).

An over-length submission is NOT rejected — it is reprocessed to fit and INCLUDED,
so no participant's response is dropped.
"""

import pytest

from app.core.exceptions import ResponseValidationError
from app.core.submission_validators import (
    reprocess_overlength,
    validate_and_fit_text_input,
)


def test_within_limit_unchanged():
    text, was = reprocess_overlength("short response", 100)
    assert text == "short response" and was is False


def test_overlength_fitted_on_word_boundary():
    text, was = reprocess_overlength("one two three four five", 12)
    assert was is True
    assert len(text) <= 12
    assert not text.endswith(" ")
    assert " " not in text[-1:]  # trimmed cleanly
    assert text == "one two"  # backs off to the last whole word ≤ 12 chars


def test_overlength_no_whitespace_hard_cut():
    text, was = reprocess_overlength("x" * 50, 10)
    assert was is True and len(text) == 10


def test_deterministic():
    a = reprocess_overlength("alpha beta gamma delta epsilon", 15)
    b = reprocess_overlength("alpha beta gamma delta epsilon", 15)
    assert a == b


def test_validate_and_fit_includes_overlength():
    text, was = validate_and_fit_text_input("  " + ("word " * 2000), 3333)
    assert was is True
    assert len(text) <= 3333


def test_validate_and_fit_still_rejects_empty():
    with pytest.raises(ResponseValidationError):
        validate_and_fit_text_input("   ", 3333)
