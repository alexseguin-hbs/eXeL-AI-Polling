"""Cube 8 — Stripe config wiring locks (no network).

Verifies test/live key resolution, the helpful missing-key error, and that status NEVER
leaks the full secret key. Charge capability itself is verified separately by
backend/scripts/verify_stripe_charge.py where api.stripe.com is reachable.

Run: cd backend && python -m pytest tests/cube8/test_stripe_config.py -v --tb=short
"""
import pytest

from app.config import settings
from app.cubes.cube8_tokens import stripe_config as sc

_SK_TEST = "sk_test_" + "A" * 40
_SK_LIVE = "sk_live_" + "B" * 40
_PK_TEST = "pk_test_" + "C" * 40


@pytest.fixture(autouse=True)
def _clear_keys(monkeypatch):
    for attr in ("stripe_secret_key", "stripe_publishable_key", "stripe_live_secret_key",
                 "stripe_live_publishable_key", "stripe_webhook_secret"):
        monkeypatch.setattr(settings, attr, "", raising=False)
    monkeypatch.setattr(settings, "environment", "development", raising=False)


class TestKeyMode:
    def test_prefixes(self):
        assert sc.key_mode(_SK_TEST) == "test"
        assert sc.key_mode(_SK_LIVE) == "live"
        assert sc.key_mode("rk_live_x") == "live"
        assert sc.key_mode("garbage") == "unknown"

    def test_mask_never_full(self):
        m = sc._mask(_SK_TEST)
        assert _SK_TEST not in m and m.startswith("sk_test_") and m.endswith("AAAA")


class TestResolve:
    def test_test_key_in_dev(self, monkeypatch):
        monkeypatch.setattr(settings, "stripe_secret_key", _SK_TEST)
        assert sc.resolve_secret_key() == _SK_TEST and sc.stripe_configured()

    def test_live_key_only_in_production(self, monkeypatch):
        monkeypatch.setattr(settings, "stripe_secret_key", _SK_TEST)
        monkeypatch.setattr(settings, "stripe_live_secret_key", _SK_LIVE)
        # dev → test key wins even when a live key exists
        assert sc.resolve_secret_key() == _SK_TEST
        monkeypatch.setattr(settings, "environment", "production")
        assert sc.resolve_secret_key() == _SK_LIVE

    def test_unconfigured(self):
        assert sc.resolve_secret_key() == "" and not sc.stripe_configured()


class TestStatusNoLeak:
    def test_unconfigured_status(self):
        s = sc.stripe_config_status()
        assert s["configured"] is False and s["mode"] == "unconfigured"
        assert s["secret_key_masked"] == ""

    def test_configured_status_masks_secret(self, monkeypatch):
        monkeypatch.setattr(settings, "stripe_secret_key", _SK_TEST)
        monkeypatch.setattr(settings, "stripe_publishable_key", _PK_TEST)
        monkeypatch.setattr(settings, "stripe_webhook_secret", "whsec_x")
        s = sc.stripe_config_status()
        assert s["configured"] and s["mode"] == "test" and s["webhook_configured"]
        # publishable is browser-safe (full); secret is ALWAYS masked, never full
        assert s["publishable_key"] == _PK_TEST
        assert _SK_TEST not in str(s) and s["secret_key_masked"].endswith("AAAA")

    def test_live_mode_warning(self, monkeypatch):
        monkeypatch.setattr(settings, "environment", "production")
        monkeypatch.setattr(settings, "stripe_live_secret_key", _SK_LIVE)
        s = sc.stripe_config_status()
        assert s["mode"] == "live" and s["live_mode_warning"] is True


class TestHelpfulError:
    def test_get_client_raises_when_unconfigured(self):
        with pytest.raises(sc.StripeNotConfiguredError) as e:
            sc.get_stripe_client()
        assert ".env" in str(e.value)  # points the user at the fix
