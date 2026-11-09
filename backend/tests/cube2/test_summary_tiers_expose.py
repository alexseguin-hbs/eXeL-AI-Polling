"""CRS-09 / CRS-39: list/detail expose summary_111 + summary_333; CRS-39 redacts unpaid."""

from app.schemas.response import ResponseListItem, ResponseRead, TextResponseDetail
from app.schemas.theme import ThemeRead
from app.cubes.cube2_text.service import apply_response_paid_view_gate, apply_theme_paid_view_gate
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


def test_paid_view_gate_redacts_unpaid():
    item = {
        "summary_33": "a",
        "summary_111": "b",
        "summary_333": "c",
        "clean_text": "raw",
        "detailed_results": "orig",
    }
    out = apply_response_paid_view_gate(item, unlocked_333=False, unlocked_original=False)
    assert out["summary_33"] == "a" and out["summary_111"] == "b"
    assert out["summary_333"] is None
    assert out["clean_text"] is None and out["detailed_results"] is None


def test_paid_view_gate_keeps_when_entitled():
    item = {"summary_333": "c", "clean_text": "raw"}
    out = apply_response_paid_view_gate(item, unlocked_333=True, unlocked_original=True)
    assert out["summary_333"] == "c" and out["clean_text"] == "raw"


def test_theme_gate_redacts_333_only():
    item = {"summary": "s33", "summary_111": "s111", "summary_333": "s333"}
    out = apply_theme_paid_view_gate(item, unlocked_333=False)
    assert out["summary"] == "s33" and out["summary_111"] == "s111"
    assert out["summary_333"] is None
    assert apply_theme_paid_view_gate(item, unlocked_333=True)["summary_333"] == "s333"


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
