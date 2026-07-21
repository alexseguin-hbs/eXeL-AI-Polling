"""Cube 6: the themes_ready WEBHOOK actually fires on theming completion.

Source-guard lock — run_pipeline must wire webhook_service.deliver_event for the
"themes_ready" event, fire-and-forget (a webhook failure never breaks a completed run).
"""

import inspect

from app.cubes.cube6_ai.pipeline import run_pipeline


def test_pipeline_wires_deliver_event_for_themes_ready():
    src = inspect.getsource(run_pipeline)
    assert "deliver_event" in src
    assert '"themes_ready"' in src


def test_themes_ready_webhook_is_fire_and_forget():
    src = inspect.getsource(run_pipeline)
    assert "cube6.themes_ready.webhook_failed" in src
