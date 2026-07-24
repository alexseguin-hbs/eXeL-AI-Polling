"""Cube 1 — Session scope_ref wiring (API-first scope inheritance).

A polling session may pin a Project → Differentiator → Specification scope at creation;
downstream data inherits it via the session. Verifies the model column, that
create_session persists a valid scope_ref, rejects a malformed one (ValueError → 400 at
the router), and that the read schema surfaces it.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.cubes.cube1_session.service import create_session
from app.models.session import Session
from app.schemas.session import SessionCreate, SessionRead


def _mock_db():
    db = AsyncMock()
    db.commit = AsyncMock()
    db.refresh = AsyncMock()
    db.add = MagicMock()
    return db


class TestModelAndSchema:
    def test_session_has_scope_ref_column(self):
        assert "scope_ref" in Session.__table__.c
        assert Session.__table__.c.scope_ref.nullable is True

    def test_create_schema_accepts_scope_ref(self):
        p = SessionCreate(title="P", scope_ref="project/p1/differentiator/d1")
        assert p.scope_ref == "project/p1/differentiator/d1"

    def test_create_schema_defaults_none(self):
        assert SessionCreate(title="P").scope_ref is None

    def test_read_schema_exposes_scope_ref(self):
        assert "scope_ref" in SessionRead.model_fields


class TestServiceWiring:
    @pytest.mark.asyncio
    async def test_valid_scope_ref_persisted(self):
        with patch("app.cubes.cube1_session.service._generate_unique_short_code",
                   new_callable=AsyncMock) as code, \
             patch("app.cubes.cube1_session.service.settings") as st:
            code.return_value = "SC0PE123"
            st.frontend_url = "http://x"; st.session_seed = None; st.default_session_expiry_hours = 24
            s = await create_session(
                _mock_db(), title="Scoped", created_by="mod",
                scope_ref="project/p1/differentiator/d1/specification/s1",
            )
        assert s.scope_ref == "project/p1/differentiator/d1/specification/s1"

    @pytest.mark.asyncio
    async def test_none_scope_ref_is_unscoped(self):
        with patch("app.cubes.cube1_session.service._generate_unique_short_code",
                   new_callable=AsyncMock) as code, \
             patch("app.cubes.cube1_session.service.settings") as st:
            code.return_value = "SC0PE456"
            st.frontend_url = "http://x"; st.session_seed = None; st.default_session_expiry_hours = 24
            s = await create_session(_mock_db(), title="Free", created_by="mod")
        assert s.scope_ref is None

    @pytest.mark.asyncio
    @pytest.mark.parametrize("bad", ["widget/x", "project", "project/p/differentiator", ""])
    async def test_malformed_scope_ref_raises(self, bad):
        with patch("app.cubes.cube1_session.service._generate_unique_short_code",
                   new_callable=AsyncMock) as code, \
             patch("app.cubes.cube1_session.service.settings") as st:
            code.return_value = "SC0PE789"
            st.frontend_url = "http://x"; st.session_seed = None; st.default_session_expiry_hours = 24
            with pytest.raises(ValueError):
                await create_session(_mock_db(), title="Bad", created_by="mod", scope_ref=bad)
