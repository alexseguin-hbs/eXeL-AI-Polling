"""Every operation in the OpenAPI schema is called against a real database and none answers 500 or raises.

The committed form of the round-1 sweep (158 operations, 0 x 500). Bodies and query parameters are generated from
the schema itself (required fields only, first enum value, schema defaults), path ids point at one real session,
and a multipart operation gets a tiny audio file. A 4xx is a correct refusal of a made-up request; a 500 means an
unhandled path in our code, which is what this proof forbids. A 502/503 from an absent external provider (Stripe,
STT) is the documented degraded answer, not a crash.
"""
from __future__ import annotations

import asyncio
import re
import uuid
from collections import Counter

METHODS = ("get", "post", "put", "patch", "delete")


def _example_factory(components: dict):
    def resolve(s):
        while "$ref" in s:
            s = components[s["$ref"].split("/")[-1]]
        return s

    def example(s, depth=0, name=""):
        s = resolve(s)
        if depth > 5:
            return None
        for k in ("anyOf", "oneOf", "allOf"):
            if k in s:
                opts = [o for o in s[k] if resolve(o).get("type") != "null"]
                return example(opts[0], depth + 1, name) if opts else None
        if "enum" in s:
            return s["enum"][0]
        if s.get("default") is not None:
            return s["default"]
        t = s.get("type")
        if t == "object" or "properties" in s:
            return {p: example(ps, depth + 1, p) for p, ps in s.get("properties", {}).items()
                    if p in s.get("required", [])}
        if t == "array":
            return [example(s.get("items", {}), depth + 1, name) for _ in range(max(1, s.get("minItems", 1)))]
        if t == "integer":
            return max(1, s.get("minimum", 1))
        if t == "number":
            return max(1.0, s.get("minimum", 1.0))
        if t == "boolean":
            return True
        if t == "string":
            f = s.get("format", "")
            if f == "uuid":
                return str(uuid.uuid4())
            if f == "date-time":
                return "2026-10-07T12:00:00Z"
            if f == "email":
                return "a@example.com"
            if f == "uri":
                return "https://example.com/hook"
            ml = s.get("minLength", 3)
            return ("Test " + name + " value long enough ")[:max(ml, 8)] if ml < 40 else "x" * ml
        return "x"

    return example


async def test_every_openapi_operation_answers_without_500(live):
    from app.main import app

    client, who = live
    who.be("auth0|sweep-admin", role="admin", email="explore@exel-ai.com")
    spec = app.openapi()
    example = _example_factory(spec.get("components", {}).get("schemas", {}))

    r = await client.post("/api/v1/sessions", json={"title": "API sweep", "description": "sweep"})
    assert r.status_code == 201, r.text
    sid, code = r.json()["id"], r.json()["short_code"]

    results: list[tuple[int, str, str, str]] = []
    for path, ops in spec["paths"].items():
        for method, op in ops.items():
            if method not in METHODS:
                continue
            url = path
            for p in re.findall(r"{(\w+)}", path):
                value = sid if p == "session_id" else (code if "code" in p else str(uuid.uuid4()))
                url = url.replace("{" + p + "}", value)
            params = {}
            for prm in op.get("parameters", []):
                if prm.get("in") == "query" and prm.get("required"):
                    name = prm["name"]
                    params[name] = sid if name == "session_id" else example(prm.get("schema", {}), 0, name)
            content = op.get("requestBody", {}).get("content", {})
            try:
                if "multipart/form-data" in content:
                    resp = await client.request(
                        method.upper(), url, params=params, data={"session_id": sid},
                        files={"file": ("a.webm", b"\x1aE\xdf\xa3" * 64, "audio/webm")})
                else:
                    body = example(content["application/json"]["schema"]) if "application/json" in content else None
                    resp = await client.request(method.upper(), url, params=params, json=body)
                results.append((resp.status_code, method.upper(), path, resp.text[:300]))
            except Exception as exc:  # a raise is a failure, recorded with its cause
                results.append((599, method.upper(), path, repr(exc)[:300]))
    await asyncio.sleep(3)  # background work runs inside the lifespan; it must not crash either

    tally = Counter(s for s, *_ in results)
    print(f"\nOpenAPI sweep: {len(results)} operations, {dict(sorted(tally.items()))}")
    assert len(results) >= 150, f"the schema shrank to {len(results)} operations; the sweep would prove less"
    crashed = [x for x in results if x[0] in (500, 599)]
    assert not crashed, "operations that crashed:\n" + "\n".join(" ".join(map(str, x)) for x in crashed)
