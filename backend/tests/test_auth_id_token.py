"""t189u — Auth0 ID tokens (aud = SPA client id) are accepted as creator identity, verified
against the tenant JWKS + issuer; role is fixed "user"; forged/foreign tokens are refused."""
import asyncio
import time

import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import JWTError, jwk, jwt

from app.core import auth

DOMAIN = "tenant.example.auth0.com"
SPA = "spa-client-123"


def _key(kid):
    priv = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = priv.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption())
    pub = jwk.construct(priv.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo), "RS256").to_dict()
    pub.update({"kid": kid, "use": "sig"})
    pub["n"] = pub["n"].decode() if isinstance(pub["n"], bytes) else pub["n"]
    pub["e"] = pub["e"].decode() if isinstance(pub["e"], bytes) else pub["e"]
    return pem, pub


PEM, PUB = _key("k1")
OTHER_PEM, _ = _key("k1")  # same kid, different key → signature must fail


def _tok(pem=PEM, **over):
    claims = {"iss": f"https://{DOMAIN}/", "aud": SPA, "sub": "google-oauth2|42", "email": "c@example.com",
              "name": "Creator", "iat": int(time.time()), "exp": int(time.time()) + 600}
    claims.update(over)
    claims = {k: v for k, v in claims.items() if v is not None}
    return jwt.encode(claims, pem, algorithm="RS256", headers={"kid": "k1"})


@pytest.fixture(autouse=True)
def _cfg(monkeypatch):
    monkeypatch.setattr(auth.settings, "auth0_domain", DOMAIN)
    monkeypatch.setattr(auth.settings, "auth0_api_audience", "https://api.example")
    monkeypatch.setattr(auth.settings, "auth0_spa_client_id", SPA)

    async def jwks():
        return {"keys": [PUB]}

    monkeypatch.setattr(auth, "_get_jwks", jwks)


def run(t):
    return asyncio.run(auth._decode_token(t))


def test_id_token_gives_real_identity_as_user():
    u = run(_tok())
    assert (u.user_id, u.email, u.role, u.display_name) == ("google-oauth2|42", "c@example.com", "user", "Creator")


def test_id_token_cannot_claim_admin():
    u = run(_tok(**{"https://exel-polling.com/role": "admin"}))
    assert u.role == "user"


@pytest.mark.parametrize("bad", [
    dict(pem=OTHER_PEM),                       # forged signature
    dict(iss="https://evil.auth0.com/"),       # other tenant
    dict(exp=int(time.time()) - 10),           # expired
    dict(aud="some-other-client"),             # other app's token (falls to API-audience path → refused)
    dict(sub=None),                            # no subject
])
def test_bad_id_tokens_refused(bad):
    with pytest.raises(JWTError):
        run(_tok(**bad))


def test_disabled_without_spa_client_id(monkeypatch):
    monkeypatch.setattr(auth.settings, "auth0_spa_client_id", "")
    with pytest.raises(JWTError):
        run(_tok())


# --- t190u: "anyone can poll" — role "user" passes creator routes, never admin/strict ones ---
from fastapi import HTTPException  # noqa: E402

from app.core.auth import CurrentUser  # noqa: E402
from app.core.permissions import require_role  # noqa: E402


def _check(dep, role):
    return asyncio.run(dep(current_user=CurrentUser(user_id="u1", email=None, role=role, permissions=[])))


def test_user_role_passes_creator_routes():
    assert _check(require_role("moderator", "admin", creator=True), "user").user_id == "u1"


@pytest.mark.parametrize("dep", [require_role("admin"), require_role("admin", "lead_developer"),
                                 require_role("moderator", "admin"), require_role("admin", creator=True)])
def test_user_role_refused_on_admin_and_strict_routes(dep):
    with pytest.raises(HTTPException) as e:
        _check(dep, "user")
    assert e.value.status_code == 403


def test_api_key_is_not_a_creator():
    with pytest.raises(HTTPException):
        _check(require_role("moderator", "admin", creator=True), "api_key")


def test_create_and_checkout_routes_are_creator_routes():
    """t190u: poll create / list / owner-verified lifecycle and moderator checkout admit any signed-in user."""
    import inspect

    from app.cubes.cube1_session import router as r1
    from app.cubes.cube8_tokens import router as r8

    src1 = inspect.getsource(r1)
    assert src1.count('require_role("moderator", "admin", creator=True)') == 12
    src8 = inspect.getsource(r8.create_moderator_checkout)
    assert "creator=True" in src8
