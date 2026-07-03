"""Cube 6 — Router endpoint tests for untested AI pipeline endpoints.

Covers:
  - POST /ai/run (run_ai_theming) — auth gate + 202 response
  - GET  /ai/status (get_ai_status) — auth gate + status structure
  - GET  /themes (get_themes) — optional auth + theme list
"""

import uuid
from unittest.mock import AsyncMock, patch

import pytest


SID = uuid.uuid4()
PREFIX = f"/api/v1/sessions/{SID}"


class TestRunAiTheming:
    """POST /ai/run — moderator/admin only, returns 202."""

    @pytest.mark.asyncio
    async def test_returns_202_on_success(self, client, moderator_user):
        mock_result = {"status": "completed", "themes_found": 3, "seed": 42}
        with patch("app.cubes.cube6_ai.service.run_pipeline", new_callable=AsyncMock, return_value=mock_result):
            resp = await client.post(f"{PREFIX}/ai/run")
        assert resp.status_code == 202
        assert resp.json()["themes_found"] == 3

    @pytest.mark.asyncio
    async def test_accepts_seed_in_payload(self, client, moderator_user):
        mock_result = {"status": "completed", "seed": "99"}
        with patch("app.cubes.cube6_ai.service.run_pipeline", new_callable=AsyncMock, return_value=mock_result) as mock_fn:
            resp = await client.post(f"{PREFIX}/ai/run", json={"seed": "99"})
        assert resp.status_code == 202
        mock_fn.assert_called_once()


class TestGetAiStatus:
    """GET /ai/status — moderator/admin/lead only."""

    @pytest.mark.asyncio
    async def test_returns_status_structure(self, client, moderator_user):
        mock_status = {"stage": "idle", "themes_count": 0, "error": None}
        with patch("app.cubes.cube6_ai.service.get_pipeline_status", new_callable=AsyncMock, return_value=mock_status):
            resp = await client.get(f"{PREFIX}/ai/status")
        assert resp.status_code == 200
        data = resp.json()
        assert "stage" in data

    @pytest.mark.asyncio
    async def test_returns_error_stage(self, client, moderator_user):
        mock_status = {"stage": "error", "themes_count": 0, "error": "Provider timeout"}
        with patch("app.cubes.cube6_ai.service.get_pipeline_status", new_callable=AsyncMock, return_value=mock_status):
            resp = await client.get(f"{PREFIX}/ai/status")
        assert resp.status_code == 200
        assert resp.json()["stage"] == "error"


class TestGetThemes:
    """GET /themes — optional auth, returns theme list."""

    @pytest.mark.asyncio
    async def test_returns_empty_list_for_new_session(self, client, moderator_user):
        with patch("app.cubes.cube6_ai.service.get_session_themes", new_callable=AsyncMock, return_value=[]):
            resp = await client.get(f"{PREFIX}/themes")
        assert resp.status_code == 200
        assert resp.json() == []

    @pytest.mark.asyncio
    async def test_rejects_bad_category_filter(self, client, moderator_user):
        """category outside {risk, support, neutral} must return 400."""
        resp = await client.get(f"{PREFIX}/themes?category=bogus")
        assert resp.status_code == 400
        assert "category" in resp.json()["detail"]

    @pytest.mark.asyncio
    async def test_rejects_bad_level_filter(self, client, moderator_user):
        """level outside {3, 6, 9} must return 400."""
        resp = await client.get(f"{PREFIX}/themes?level=12")
        assert resp.status_code == 400
        assert "level" in resp.json()["detail"]


class TestGetThemesEnrichment:
    """Enrichment path: theme01_category + theme_level + parent_theme_id.

    Cube 7 downstream contract: every Theme 02 row must carry the parent's
    canonical category key (risk|support|neutral) resolved from Theme 01 label.
    """

    def _label_map(self):
        return {
            "Risk & Concerns": "risk",
            "Supporting Comments": "support",
            "Neutral Comments": "neutral",
        }

    def test_category_key_canonical_labels(self):
        """Canonical English labels map to stable filter keys."""
        from app.cubes.cube6_ai.pipeline import _category_key
        assert _category_key("Risk & Concerns") == "risk"
        assert _category_key("Supporting Comments") == "support"
        assert _category_key("Neutral Comments") == "neutral"

    def test_category_key_fuzzy_match(self):
        """Non-canonical variants still resolve via case-insensitive substring."""
        from app.cubes.cube6_ai.pipeline import _category_key
        assert _category_key("risks going forward") == "risk"
        assert _category_key("SUPPORTING VIEWS") == "support"
        assert _category_key("Neutral / Other") == "neutral"

    def test_category_key_none_and_unknown(self):
        """None input and unrelated labels yield None."""
        from app.cubes.cube6_ai.pipeline import _category_key
        assert _category_key(None) is None
        assert _category_key("") is None
        assert _category_key("Some Other Theme") is None

    @pytest.mark.asyncio
    async def test_enriched_children_resolve_parent_category(self):
        """Theme 02 children get theme01_category resolved from the parent label."""
        from tests.conftest import seed_theme02_hierarchy
        from app.cubes.cube6_ai import pipeline as ppl

        session_id = uuid.uuid4()
        parent, children = seed_theme02_hierarchy(
            session_id, level="9", category="risk"
        )

        # Patch get_session_themes to return parent + children as a flat list.
        with patch(
            "app.cubes.cube6_ai.pipeline.get_session_themes",
            new_callable=AsyncMock,
            return_value=[parent] + children,
        ):
            # Fake DB: return parent label for parent_id lookup.
            mock_row = type("R", (), {"id": parent.id, "label": parent.label})
            mock_result = AsyncMock()
            mock_result.__iter__ = lambda self: iter([mock_row])
            # Use a synchronous list result compatible with the enrichment code.
            class _Rows:
                def __iter__(self_inner):
                    return iter([mock_row])
            mock_db = AsyncMock()
            mock_db.execute = AsyncMock(return_value=_Rows())

            enriched = await ppl.get_session_themes_enriched(mock_db, session_id)

        # 1 parent + 9 children
        assert len(enriched) == 10
        parent_row = next(e for e in enriched if e["parent_theme_id"] is None)
        assert parent_row["theme01_category"] == "risk"
        assert parent_row["theme_level"] is None

        child_rows = [e for e in enriched if e["parent_theme_id"] is not None]
        assert len(child_rows) == 9
        assert all(c["theme01_category"] == "risk" for c in child_rows)
        assert all(c["theme_level"] == "9" for c in child_rows)
