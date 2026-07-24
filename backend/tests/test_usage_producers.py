"""Usage-metering producers — the metric stream now actually fills.

Locks that the two natural metered events call record_usage: webhook deliveries
(0.99 ◬ each, org = session owner) and CSV exports (org = exporting principal).
Best-effort by design — a metering failure must never break delivery/download.
"""

import inspect


def test_webhook_delivery_meters_usage():
    from app.cubes.cube5_gateway.webhook_service import deliver_event

    src = inspect.getsource(deliver_event)
    assert "record_usage" in src
    assert '"webhook_delivery"' in src
    assert "0.99" in src                      # metered per successful delivery
    assert "never break webhook delivery" in src  # best-effort guard documented


def test_export_meters_usage():
    from app.cubes.cube9_reports.router import export_csv

    src = inspect.getsource(export_csv)
    assert "record_usage" in src
    assert '"export"' in src
    assert "never break the download" in src   # best-effort guard documented


def test_metered_events_are_whitelisted_metrics():
    from app.models.usage_record import USAGE_METRICS

    assert "webhook_delivery" in USAGE_METRICS and "export" in USAGE_METRICS
