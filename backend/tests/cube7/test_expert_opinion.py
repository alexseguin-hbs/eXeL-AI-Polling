"""CRS-38 Expert Opinion — column validation, 3-expert pager gate, SIMULATED pager text."""
from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.cubes.cube7_ranking import expert_opinion as eo


def test_require_all_three_columns():
    with pytest.raises(ValueError, match="Supporting"):
        eo._require_nonempty_columns("", "risk", "neutral")
    eo._require_nonempty_columns("s", "r", "n")


def test_deterministic_pager_labels_theme01():
    ops = []
    for i in range(3):
        op = MagicMock()
        op.support_summary = f"S{i}"
        op.risk_summary = f"R{i}"
        op.neutral_summary = f"N{i}"
        ops.append(op)
    text = eo._deterministic_pager(ops)
    assert "SIMULATED" in text
    assert "Supporting Comments" in text
    assert "Risk & Concerns" in text
    assert "Neutral Comments" in text
    assert "S0" in text and "R2" in text


@pytest.mark.asyncio
async def test_build_pager_not_ready_under_three():
    db = MagicMock()
    # opinions query returns 2; pager query returns None
    op_res = MagicMock()
    op_res.scalars.return_value.all.return_value = [MagicMock(), MagicMock()]
    pager_res = MagicMock()
    pager_res.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(side_effect=[op_res, pager_res])
    db.add = MagicMock()
    db.flush = AsyncMock()
    pager = await eo.build_pager_if_ready(db, uuid.uuid4(), uuid.uuid4())
    assert pager is not None
    assert pager.ready is False


@pytest.mark.asyncio
async def test_build_pager_ready_at_three():
    db = MagicMock()
    ops = []
    for i in range(3):
        op = MagicMock()
        op.id = uuid.uuid4()
        op.support_summary = f"S{i}"
        op.risk_summary = f"R{i}"
        op.neutral_summary = f"N{i}"
        ops.append(op)
    op_res = MagicMock()
    op_res.scalars.return_value.all.return_value = ops
    pager_res = MagicMock()
    pager_res.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(side_effect=[op_res, pager_res])
    db.add = MagicMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    pager = await eo.build_pager_if_ready(db, uuid.uuid4(), uuid.uuid4(), use_simulated=True)
    assert pager.ready is True
    assert "SIMULATED" in pager.pager_text
    assert len(pager.opinion_ids) == 3
