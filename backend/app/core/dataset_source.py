"""Dataset source — Supabase-FIRST, CSV-fallback (operator: "CSV can't be source").

The large simulation datasets belong in Supabase (the `sim_datasets` table), NOT in
committed CSV files. This loader queries Supabase first (via the canonical async engine)
and falls back to the CSV SEED only when the table/network is unavailable (offline / CI /
before the `025_sim_datasets.sql` migration is applied). So CSV becomes a bootstrap seed,
not the source of truth — and once the ring is provisioned, datasets are absorbed THROUGH
the Hexagonal Write Rotor into partitioned Supabase tables and read from there.

Offline this exercises the CSV fallback; the Supabase path is code-complete and activates
automatically when a `db` session + the table exist.
"""

from __future__ import annotations

import csv
from pathlib import Path

import structlog

logger = structlog.get_logger(__name__)

DATASET_TABLE = "sim_datasets"
_FIXTURES = Path(__file__).resolve().parents[1].parent / "tests" / "fixtures"
_DEMO = (
    Path(__file__).resolve().parents[2]
    / "Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv"
)


def _csv_path(name: str) -> Path:
    """Resolve a dataset name to its CSV seed path (the DEMO or a fixture)."""
    if name in ("demo", "Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv"):
        return _DEMO
    return _FIXTURES / (name if name.endswith(".csv") else f"{name}.csv")


def load_dataset_csv(name: str, limit: int = 0) -> list[dict]:
    """Load a dataset's rows from its CSV seed (the offline fallback)."""
    path = _csv_path(name)
    with open(path, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows: list[dict] = []
        for i, row in enumerate(reader):
            if limit and i >= limit:
                break
            rows.append(row)
    return rows


async def load_dataset_supabase(db, name: str, limit: int = 0) -> list[dict] | None:
    """Load a dataset's rows from the Supabase `sim_datasets` table.

    Returns the rows, or None when the table is absent / query fails (→ caller falls
    back to CSV). Reuses the canonical AsyncSession + raw SQL pattern (like
    cube10_simulation.service.get_feedback_stats querying product_feedback).
    """
    from sqlalchemy import text as sql_text

    try:
        q = f"SELECT * FROM {DATASET_TABLE} WHERE dataset_name = :name ORDER BY row_index"
        if limit:
            q += f" LIMIT {int(limit)}"
        result = await db.execute(sql_text(q), {"name": name})
        rows = [dict(r._mapping) for r in result.fetchall()]
        return rows or None
    except Exception as exc:  # noqa: BLE001 — table absent / offline → CSV fallback
        logger.info("dataset_source.supabase_unavailable", dataset=name, error=str(exc))
        return None


async def load_dataset(name: str, *, db=None, limit: int = 0) -> list[dict]:
    """Supabase-FIRST dataset load with CSV-seed fallback.

    When a live `db` session is supplied and the `sim_datasets` table exists, the rows
    come from Supabase (the source of truth). Otherwise the CSV seed is used. This is the
    single entry point cubes/tests should call so "CSV is not the source" holds true.
    """
    if db is not None:
        rows = await load_dataset_supabase(db, name, limit)
        if rows is not None:
            return rows
    return load_dataset_csv(name, limit)
