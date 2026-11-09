"""Gemini provider runs on google-genai (gemini-embedding-001 768-dim, gemini-2.5-flash) — no deprecated SDK."""
import asyncio
from types import SimpleNamespace

from app.cubes.cube6_ai.providers import gemini_provider as gp


class _Models:
    def __init__(self):
        self.calls = []

    def embed_content(self, model, contents, config):
        self.calls.append(("embed", model, len(contents), config))
        return SimpleNamespace(embeddings=[SimpleNamespace(values=[0.1] * config["output_dimensionality"]) for _ in contents])

    def generate_content(self, model, contents, config):
        self.calls.append(("gen", model, contents, config))
        return SimpleNamespace(text="Theme: Safety")


def _fake(monkeypatch):
    models = _Models()
    monkeypatch.setattr(gp, "_client", lambda: SimpleNamespace(models=models))
    return models


def test_embed_batches_at_100_and_returns_768_dim(monkeypatch):
    models = _fake(monkeypatch)
    out = asyncio.run(gp.GeminiEmbedding().embed([f"t{i}" for i in range(150)]))
    assert len(out) == 150 and all(len(v) == 768 for v in out)
    assert [c[2] for c in models.calls] == [100, 50]
    assert all(c[1] == "gemini-embedding-001" for c in models.calls)
    assert gp.GeminiEmbedding().model_id() == "gemini-embedding-001"


def test_summarize_uses_flash_at_temperature_zero(monkeypatch):
    models = _fake(monkeypatch)
    text = asyncio.run(gp.GeminiSummarization().summarize(["a", "b"], instruction="Label"))
    assert text == "Theme: Safety"
    kind, model, prompt, config = models.calls[0]
    assert (kind, model, config["temperature"]) == ("gen", "gemini-2.5-flash", 0.0)
    assert prompt.startswith("Label\n\na\n\nb")


def test_no_deprecated_sdk_import():
    src = open(gp.__file__).read()
    assert "google.generativeai" not in src and "text-embedding-004\"" not in src
