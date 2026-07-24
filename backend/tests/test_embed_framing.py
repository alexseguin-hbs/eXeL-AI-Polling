"""Embed framing policy — default-safe DENY, opt-in per configured embed origin (Full-Embed).

No EMBED_ALLOWED_ORIGINS → X-Frame-Options: DENY + CSP frame-ancestors 'none' (unchanged).
Configured → drop X-Frame-Options + CSP frame-ancestors 'self' <origins> (only those embed).
"""

from unittest.mock import patch

import pytest


@pytest.mark.asyncio
async def test_default_denies_framing(client):
    r = await client.get("/api/v1/health")
    assert r.headers.get("X-Frame-Options") == "DENY"
    assert r.headers.get("Content-Security-Policy") == "frame-ancestors 'none'"


@pytest.mark.asyncio
async def test_configured_origins_allow_only_those(client):
    from app.core import middleware

    with patch.object(middleware.settings, "embed_allowed_origins",
                      "https://partner.example.com, https://acme.test"):
        r = await client.get("/api/v1/health")
    csp = r.headers.get("Content-Security-Policy", "")
    assert "frame-ancestors 'self' https://partner.example.com https://acme.test" == csp
    # X-Frame-Options is intentionally dropped so it can't override the CSP allowlist.
    assert "X-Frame-Options" not in r.headers


def test_embed_origins_parsing():
    from app.core import middleware

    with patch.object(middleware.settings, "embed_allowed_origins", " a.com , , b.com "):
        assert middleware._embed_origins() == ["a.com", "b.com"]
    with patch.object(middleware.settings, "embed_allowed_origins", ""):
        assert middleware._embed_origins() == []
