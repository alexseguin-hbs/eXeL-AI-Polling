"""Phase 2·3·4 — AuditLog parity: cubes 2/3/4 write a transition-level AuditLog row at
their key write transition (text submit, voice submit, desired-outcome create), matching
the cube1/7/8 audit pattern via the shared core.audit.log_audit helper."""

import ast
import pathlib

_BACKEND = pathlib.Path(__file__).resolve().parents[2]

_CASES = [
    ("app/cubes/cube2_text/service.py", "text.submitted"),
    ("app/cubes/cube3_voice/service.py", "voice.submitted"),
    ("app/cubes/cube4_collector/service.py", "collector.desired_outcome_created"),
]


def test_each_cube_imports_and_calls_log_audit():
    for rel, action in _CASES:
        src = (_BACKEND / rel).read_text()
        assert "from app.core.audit import log_audit" in src, f"{rel} missing shared import"
        assert "log_audit(" in src, f"{rel} does not call log_audit"
        assert action in src, f"{rel} missing action_type {action!r}"


def test_sources_parse_cleanly():
    for rel, _ in _CASES:
        ast.parse((_BACKEND / rel).read_text())  # raises SyntaxError on breakage
