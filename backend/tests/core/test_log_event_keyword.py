"""No structured log call may pass `event=` as a keyword (AsM round 7).

structlog's first positional argument is already named `event`, so `logger.warning("x", event=...)` raises
"got multiple values for argument 'event'" — inside the very except/notify path the log was meant to record.
It did exactly that in app/core/supabase_broadcast.py: every themes_ready broadcast logged its result with
event=..., the log call raised, and the pipeline's outer handler swallowed it (skipping the themes_ready webhook
after it). This scans every logger call in app/ so the class cannot come back.
"""
from __future__ import annotations

import ast
from pathlib import Path

LOG_METHODS = {"debug", "info", "warning", "warn", "error", "exception", "critical", "msg"}


def test_no_logger_call_passes_event_keyword():
    root = Path(__file__).resolve().parents[2] / "app"
    offenders = []
    for path in root.rglob("*.py"):
        tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        for node in ast.walk(tree):
            if (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                    and node.func.attr in LOG_METHODS
                    and isinstance(node.func.value, ast.Name) and node.func.value.id in {"logger", "log", "_log"}
                    and any(k.arg == "event" for k in node.keywords)):
                offenders.append(f"{path.relative_to(root.parent)}:{node.lineno}")
    assert not offenders, "logger calls passing event= (rename the field): " + ", ".join(offenders)
