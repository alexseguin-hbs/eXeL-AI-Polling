"""CRS-09 / CRS-39: list/detail expose summary_111 + summary_333 (no generation change)."""

from app.schemas.response import ResponseListItem, ResponseRead, TextResponseDetail
from app.schemas.theme import ThemeRead
from app.cubes.cube2_text.service import apply_response_paid_view_gate
from app.cubes.cube8_tokens.cost_ledger import CostKind, lines_from_ai_cost_row


def test_response_read_schema_has_111_333():
    fields = ResponseRead.model_fields
    assert "summary_33" in fields
    assert "summary_111" in fields
    assert "summary_333" in fields
    assert "summary_111" in ResponseListItem.model_fields
    assert "summary_333" in TextResponseDetail.model_fields


def test_theme_read_schema_has_111_333():
    fields = ThemeRead.model_fields
    assert "summary_111" in fields
    assert "summary_333" in fields


def test_paid_view_gate_redacts_333_when_locked():
    """CRS-39.02 (W2 hook wired): locked → 333 withheld; owner-route raw text unchanged (existing flow)."""
    item = {"summary_33": "a", "summary_111": "b", "summary_333": "c", "clean_text": "raw"}
    out = apply_response_paid_view_gate(item, unlocked_333=False)
    assert out["summary_333"] is None and out["summary_111"] == "b" and out["clean_text"] == "raw"
    assert apply_response_paid_view_gate(item, unlocked_333=True)["summary_333"] == "c"
    assert apply_response_paid_view_gate(item)["summary_333"] == "c"  # no caller identity → unchanged


def test_phase_a_ai_cost_maps_to_phase_a_kind():
    line = lines_from_ai_cost_row(
        {
            "provider": "openai",
            "total_input_chars": 100,
            "total_output_chars": 40,
            "estimated_cost_usd": 0.0015,
            "phase": "phase_a",
            "source": "ai_cost_logs",
        },
        session_id="sess-1",
    )
    assert line.kind == CostKind.PHASE_A
    assert line.meta.get("phase") == "phase_a"
    assert float(line.amount_usd) == 0.0015


def test_phase_b_ai_cost_stays_theme02():
    line = lines_from_ai_cost_row(
        {
            "provider": "openai",
            "total_input_chars": 200,
            "total_output_chars": 80,
            "estimated_cost_usd": 0.01,
            "phase": "phase_b",
        },
        session_id="sess-1",
    )
    assert line.kind == CostKind.THEME02
