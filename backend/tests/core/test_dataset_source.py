"""R1.2 — Supabase-first dataset loader with CSV-seed fallback ("CSV can't be source")."""

import asyncio
from unittest.mock import AsyncMock, MagicMock

from app.core import dataset_source as ds


def _run(coro):
    return asyncio.run(coro)


def test_csv_fallback_loads_committed_1000_at_20_cols():
    rows = ds.load_dataset_csv("sim_use_case_1000.csv", limit=5)
    assert len(rows) == 5
    assert len(rows[0].keys()) == 20  # 20-col schema
    assert "Theme01_Category" in rows[0]


def test_load_dataset_uses_csv_when_no_db():
    rows = _run(ds.load_dataset("sim_use_case_1000.csv", limit=3))
    assert len(rows) == 3
    assert rows[0]["Theme01_Category"] in ("risk", "support", "neutral")


def test_supabase_first_when_table_present():
    # A live db returning rows → Supabase is the source (CSV not touched).
    db = AsyncMock()
    result = MagicMock()
    row = MagicMock()
    row._mapping = {"dataset_name": "d", "row_index": 0, "Theme01_Category": "risk"}
    result.fetchall.return_value = [row]
    db.execute = AsyncMock(return_value=result)

    rows = _run(ds.load_dataset("d", db=db))
    assert rows == [{"dataset_name": "d", "row_index": 0, "Theme01_Category": "risk"}]


def test_supabase_error_falls_back_to_csv():
    # Table absent / query error → None → CSV seed used, never raises.
    db = AsyncMock()
    db.execute = AsyncMock(side_effect=RuntimeError("relation sim_datasets does not exist"))
    rows = _run(ds.load_dataset("sim_use_case_1000.csv", db=db, limit=2))
    assert len(rows) == 2  # fell back to CSV


def test_supabase_empty_falls_back_to_csv():
    db = AsyncMock()
    result = MagicMock()
    result.fetchall.return_value = []
    db.execute = AsyncMock(return_value=result)
    rows = _run(ds.load_dataset("sim_use_case_1000.csv", db=db, limit=2))
    assert len(rows) == 2  # empty table → CSV fallback
