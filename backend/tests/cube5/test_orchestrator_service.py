"""Cube 5 — Orchestrator Service Tests.

Tests:
  - Pipeline trigger creation (valid/invalid types, timestamp, metadata)
  - Pipeline status updates (status transitions, error storage, 404)
  - AI pipeline trigger (creates record, fires background task)
  - Ranking pipeline trigger (placeholder creation)
  - CQS scoring trigger (placeholder with metadata)
  - Post-polling orchestration (fires AI trigger, passes seed)
  - Pipeline status query (flags: pending/failed/completed, empty session)
"""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from tests.conftest import make_pipeline_trigger


# ---------------------------------------------------------------------------
# Create Trigger
# ---------------------------------------------------------------------------


class TestCreateTrigger:
    @pytest.mark.asyncio
    async def test_creates_valid_trigger(self):
        """Should create a PipelineTrigger record with correct fields."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import _create_trigger

        trigger = await _create_trigger(
            mock_db, uuid.uuid4(), "ai_theming", metadata={"seed": "test123"}
        )

        mock_db.add.assert_called_once()
        mock_db.commit.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_rejects_invalid_trigger_type(self):
        """Should raise ValueError for unknown trigger_type."""
        mock_db = AsyncMock()

        from app.cubes.cube5_gateway.service import _create_trigger

        with pytest.raises(ValueError, match="Invalid trigger_type"):
            await _create_trigger(mock_db, uuid.uuid4(), "invalid_type")

    @pytest.mark.asyncio
    async def test_all_valid_trigger_types(self):
        """Should accept all 4 valid trigger types."""
        valid_types = ["ai_theming", "ranking_aggregation", "cqs_scoring", "reward_payout"]
        for trigger_type in valid_types:
            mock_db = AsyncMock()
            mock_db.add = MagicMock()
            mock_db.commit = AsyncMock()
            mock_db.refresh = AsyncMock()

            from app.cubes.cube5_gateway.service import _create_trigger

            trigger = await _create_trigger(mock_db, uuid.uuid4(), trigger_type)
            mock_db.add.assert_called_once()

    @pytest.mark.asyncio
    async def test_trigger_has_timestamp(self):
        """Created trigger should have triggered_at set."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import _create_trigger

        before = datetime.now(timezone.utc)
        trigger = await _create_trigger(mock_db, uuid.uuid4(), "ai_theming")

        # Verify the added object has triggered_at
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.triggered_at is not None
        assert added_obj.status == "pending"

    @pytest.mark.asyncio
    async def test_trigger_stores_metadata(self):
        """Created trigger should store metadata JSONB."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import _create_trigger

        meta = {"seed": "abc", "use_embedding_assignment": True}
        await _create_trigger(mock_db, uuid.uuid4(), "ai_theming", metadata=meta)

        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_metadata == meta


# ---------------------------------------------------------------------------
# Update Pipeline Status
# ---------------------------------------------------------------------------


class TestUpdatePipelineStatus:
    @pytest.mark.asyncio
    async def test_updates_to_completed(self):
        """Should update status to completed and set completed_at."""
        trigger_id = uuid.uuid4()
        mock_trigger = make_pipeline_trigger(id=trigger_id, status="in_progress")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_trigger
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import update_pipeline_status

        result = await update_pipeline_status(mock_db, trigger_id, "completed")

        assert mock_trigger.status == "completed"
        assert mock_trigger.completed_at is not None

    @pytest.mark.asyncio
    async def test_updates_to_failed_with_error(self):
        """Should store error_message on failure."""
        trigger_id = uuid.uuid4()
        mock_trigger = make_pipeline_trigger(id=trigger_id, status="in_progress")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_trigger
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import update_pipeline_status

        result = await update_pipeline_status(
            mock_db, trigger_id, "failed", error_message="Provider timeout"
        )

        assert mock_trigger.status == "failed"
        assert mock_trigger.error_message == "Provider timeout"

    @pytest.mark.asyncio
    async def test_merges_result_metadata(self):
        """Should merge result_metadata into existing metadata."""
        trigger_id = uuid.uuid4()
        mock_trigger = make_pipeline_trigger(
            id=trigger_id, status="in_progress", metadata={"seed": "abc"}
        )

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = mock_trigger
        mock_db.execute = AsyncMock(return_value=mock_result)
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import update_pipeline_status

        await update_pipeline_status(
            mock_db, trigger_id, "completed",
            result_metadata={"total_responses": 42}
        )

        assert mock_trigger.trigger_metadata["seed"] == "abc"
        assert mock_trigger.trigger_metadata["total_responses"] == 42

    @pytest.mark.asyncio
    async def test_not_found_raises_404(self):
        """Should raise 404 if trigger_id doesn't exist."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_db.execute = AsyncMock(return_value=mock_result)

        from fastapi import HTTPException
        from app.cubes.cube5_gateway.service import update_pipeline_status

        with pytest.raises(HTTPException) as exc_info:
            await update_pipeline_status(mock_db, uuid.uuid4(), "completed")
        assert exc_info.value.status_code == 404


# ---------------------------------------------------------------------------
# Trigger AI Pipeline
# ---------------------------------------------------------------------------


class TestTriggerAiPipeline:
    @pytest.mark.asyncio
    async def test_creates_trigger_record(self):
        """Should create a PipelineTrigger record and return it."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_mongo = MagicMock()

        with patch("app.cubes.cube5_gateway.service.asyncio") as mock_asyncio:
            mock_asyncio.create_task = MagicMock()

            from app.cubes.cube5_gateway.service import trigger_ai_pipeline

            trigger = await trigger_ai_pipeline(
                mock_db, mock_mongo, uuid.uuid4(), seed="test_seed"
            )

        mock_db.add.assert_called_once()
        mock_asyncio.create_task.assert_called_once()

    @pytest.mark.asyncio
    async def test_passes_seed_to_metadata(self):
        """Should store seed in trigger metadata."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_mongo = MagicMock()

        with patch("app.cubes.cube5_gateway.service.asyncio") as mock_asyncio:
            mock_asyncio.create_task = MagicMock()

            from app.cubes.cube5_gateway.service import trigger_ai_pipeline

            await trigger_ai_pipeline(
                mock_db, mock_mongo, uuid.uuid4(), seed="my_seed"
            )

        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_metadata["seed"] == "my_seed"

    @pytest.mark.asyncio
    async def test_passes_embedding_flag(self):
        """Should store use_embedding_assignment in metadata."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_mongo = MagicMock()

        with patch("app.cubes.cube5_gateway.service.asyncio") as mock_asyncio:
            mock_asyncio.create_task = MagicMock()

            from app.cubes.cube5_gateway.service import trigger_ai_pipeline

            await trigger_ai_pipeline(
                mock_db, mock_mongo, uuid.uuid4(), use_embedding_assignment=True
            )

        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_metadata["use_embedding_assignment"] is True


# ---------------------------------------------------------------------------
# Trigger Ranking Pipeline (Placeholder)
# ---------------------------------------------------------------------------


class TestTriggerRankingPipeline:
    @pytest.mark.asyncio
    async def test_creates_ranking_trigger(self):
        """Should create a ranking_aggregation trigger record."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()

        from app.cubes.cube5_gateway.service import trigger_ranking_pipeline

        trigger = await trigger_ranking_pipeline(mock_db, uuid.uuid4())

        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_type == "ranking_aggregation"
        assert added_obj.status == "pending"


# ---------------------------------------------------------------------------
# Trigger CQS Scoring (Placeholder)
# ---------------------------------------------------------------------------


class TestTriggerCqsScoring:
    @pytest.mark.asyncio
    async def test_creates_cqs_trigger(self):
        """Should create a cqs_scoring trigger with theme metadata."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_mongo = MagicMock()

        from app.cubes.cube5_gateway.service import trigger_cqs_scoring

        trigger = await trigger_cqs_scoring(
            mock_db, mock_mongo, uuid.uuid4(), top_theme2_id="theme_xyz"
        )

        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_type == "cqs_scoring"
        assert added_obj.trigger_metadata["top_theme2_id"] == "theme_xyz"

    @pytest.mark.asyncio
    async def test_cqs_without_theme_id(self):
        """Should create cqs_scoring trigger even without top_theme2_id."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_mongo = MagicMock()

        from app.cubes.cube5_gateway.service import trigger_cqs_scoring

        await trigger_cqs_scoring(mock_db, mock_mongo, uuid.uuid4())

        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_metadata["top_theme2_id"] is None


# ---------------------------------------------------------------------------
# Orchestrate Post-Polling
# ---------------------------------------------------------------------------


class TestOrchestratePostPolling:
    @pytest.mark.asyncio
    async def test_fires_ai_trigger(self):
        """Should call trigger_ai_pipeline with session_id and seed."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_mongo = MagicMock()
        sid = uuid.uuid4()

        with patch("app.cubes.cube5_gateway.service.asyncio") as mock_asyncio:
            mock_asyncio.create_task = MagicMock()

            from app.cubes.cube5_gateway.service import orchestrate_post_polling

            trigger = await orchestrate_post_polling(
                mock_db, mock_mongo, sid, seed="test_seed"
            )

        # Should create ai_theming trigger
        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_type == "ai_theming"
        assert added_obj.session_id == sid

    @pytest.mark.asyncio
    async def test_passes_seed_through(self):
        """Should pass seed from orchestrator to ai_pipeline trigger."""
        mock_db = AsyncMock()
        mock_db.add = MagicMock()
        mock_db.commit = AsyncMock()
        mock_db.refresh = AsyncMock()
        mock_mongo = MagicMock()

        with patch("app.cubes.cube5_gateway.service.asyncio") as mock_asyncio:
            mock_asyncio.create_task = MagicMock()

            from app.cubes.cube5_gateway.service import orchestrate_post_polling

            await orchestrate_post_polling(
                mock_db, mock_mongo, uuid.uuid4(), seed="abc123"
            )

        added_obj = mock_db.add.call_args[0][0]
        assert added_obj.trigger_metadata["seed"] == "abc123"


# ---------------------------------------------------------------------------
# Get Pipeline Status
# ---------------------------------------------------------------------------


class TestGetPipelineStatus:
    @pytest.mark.asyncio
    async def test_empty_session_returns_no_triggers(self):
        """Should return empty triggers list for session with no pipelines."""
        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube5_gateway.service import get_pipeline_status

        result = await get_pipeline_status(mock_db, uuid.uuid4())

        assert result["total"] == 0
        assert result["has_pending"] is False
        assert result["has_failed"] is False
        assert result["all_completed"] is False

    @pytest.mark.asyncio
    async def test_pending_flag(self):
        """has_pending should be True when any trigger is pending."""
        t1 = make_pipeline_trigger(status="completed")
        t2 = make_pipeline_trigger(status="pending")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [t1, t2]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube5_gateway.service import get_pipeline_status

        result = await get_pipeline_status(mock_db, uuid.uuid4())

        assert result["total"] == 2
        assert result["has_pending"] is True
        assert result["all_completed"] is False

    @pytest.mark.asyncio
    async def test_failed_flag(self):
        """has_failed should be True when any trigger has failed."""
        t1 = make_pipeline_trigger(status="completed")
        t2 = make_pipeline_trigger(status="failed", error_message="timeout")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [t1, t2]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube5_gateway.service import get_pipeline_status

        result = await get_pipeline_status(mock_db, uuid.uuid4())

        assert result["has_failed"] is True
        assert result["all_completed"] is False

    @pytest.mark.asyncio
    async def test_all_completed_flag(self):
        """all_completed should be True when all triggers are completed."""
        t1 = make_pipeline_trigger(status="completed")
        t2 = make_pipeline_trigger(status="completed")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [t1, t2]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube5_gateway.service import get_pipeline_status

        result = await get_pipeline_status(mock_db, uuid.uuid4())

        assert result["all_completed"] is True
        assert result["has_pending"] is False
        assert result["has_failed"] is False

    @pytest.mark.asyncio
    async def test_in_progress_counts_as_pending(self):
        """has_pending should be True for in_progress triggers."""
        t1 = make_pipeline_trigger(status="in_progress")

        mock_db = AsyncMock()
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [t1]
        mock_db.execute = AsyncMock(return_value=mock_result)

        from app.cubes.cube5_gateway.service import get_pipeline_status

        result = await get_pipeline_status(mock_db, uuid.uuid4())

        assert result["has_pending"] is True
