"""Offline deterministic AI provider — NO external API, NO network, NO keys.

Purpose (Cube 6 SSSES: Stability/Scalability/Efficiency): the real theming
pipeline (classify → generate → reduce → assign → store → replay-hash) could
previously only run under LIVE_AI=1 against a billed API, so CI never exercised
it. This provider is a DETERMINISTIC input to the REAL phase_a/phase_b engine
(NOT a mock of it) — it emits exactly the text formats phase_b's parsers expect,
so every real code path runs in CI and the operator's theming test runs with no
key. Select it explicitly via `session.ai_provider = "offline"`.

Design guardrails (12 AsM council):
- Aset: emits the EXACT parse grammar (classify "THEME (Confidence: XX%)",
  theme-gen "T00n, Name, Desc", reduce CSV "T#, Theme, Desc, XX%", assign) so
  phase_b's fallbacks never silently trip.
- Enlil/Thor: PURE STDLIB — must NOT import anthropic/openai/numpy (sandbox-safe).
- Odin: NOT registered in the default failover chain — a missing prod key must
  error, never silently ship stub themes; offline is opt-in only.
- Thoth: fully deterministic (hash/keyword heuristics) → identical inputs yield
  identical themes + identical replay hash.
"""

import hashlib
import re

from app.cubes.cube6_ai.providers.base import (
    AIProviderName,
    EmbeddingProvider,
    SummarizationProvider,
)
from app.cubes.cube6_ai.centroid_summarizer import truncate_to_words

# Deterministic keyword lexicons for Theme01 classification (text → category).
_RISK_WORDS = (
    "concern", "risk", "frustrat", "dislike", "lack", "poor", "fail", "bug",
    "problem", "clunky", "missing", "broken", "slow", "difficult", "hard",
    "insufficient", "gap", "weak", "limited", "does not", "cannot", "no ",
)
_SUPPORT_WORDS = (
    "like", "appreciate", "great", "love", "excellent", "valuable", "effective",
    "useful", "helpful", "enjoy", "impressed", "strong", "fast", "clean",
    "elegant", "fair", "transparent", "game-changer", "genuinely", "praise",
)
# Lightweight stopword set for deterministic keyword extraction.
_STOPWORDS = frozenset({
    "input", "the", "and", "for", "that", "this", "with", "would", "which", "have",
    "their", "there", "about", "into", "from", "they", "what", "when", "where",
    "some", "more", "most", "than", "then", "them", "these", "those", "such",
    "also", "each", "over", "under", "very", "just", "like", "make", "made", "does",
    "not", "our", "are", "was", "were", "has", "had", "but", "can", "cannot",
    "could", "should", "still", "much", "many", "using", "used", "tool", "polling",
    "poll", "response", "responses", "feedback", "feature", "features", "users",
    "user", "want", "need", "needs", "adding", "improve", "improvements", "across",
})
_WORD_RE = re.compile(r"[a-zA-Z][a-zA-Z\-]{3,}")


def _classify_theme01(text: str) -> str:
    """Deterministic Theme01 classification via risk/support keyword balance."""
    low = text.lower()
    risk = sum(low.count(w) for w in _RISK_WORDS)
    support = sum(low.count(w) for w in _SUPPORT_WORDS)
    if risk == 0 and support == 0:
        return "Neutral Comments"
    if risk > support:
        return "Risk & Concerns"
    if support > risk:
        return "Supporting Comments"
    return "Neutral Comments"


def _top_keywords(text: str, n: int) -> list[str]:
    """Top-n significant keywords, deterministic (freq desc, then alphabetical)."""
    counts: dict[str, int] = {}
    for m in _WORD_RE.finditer(text.lower()):
        w = m.group(0)
        if w in _STOPWORDS:
            continue
        counts[w] = counts.get(w, 0) + 1
    ordered = sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    return [w for w, _ in ordered[:n]]


def _extract_count(instruction: str, text: str, default: int = 9) -> int:
    """Pull the reduce target count from 'exactly N' or 'Reduce ... to N'."""
    for pat in (r"exactly\s+(\d+)\s+unique", r"[Rr]educe.*?to\s+(\d+)"):
        m = re.search(pat, instruction) or re.search(pat, text)
        if m:
            return int(m.group(1))
    return default


class OfflineSummarization(SummarizationProvider):
    """Deterministic summarizer that speaks phase_b's exact grammar."""

    provider_name = AIProviderName.OFFLINE

    async def summarize(self, texts: list[str], instruction: str = "") -> str:
        text = texts[0] if texts else ""
        instr = instruction or ""

        # 1. Theme01 classification (_CLASSIFY_INSTRUCTION).
        if "three exact phrases" in instr and "Risk & Concerns" in instr:
            payload = text[7:] if text.startswith("INPUT:") else text
            return f"{_classify_theme01(payload)} (Confidence: 85%)"

        # 2. Theme assignment (_ASSIGN_INSTRUCTION): pick best from "List: ...\nInput: ...".
        if instr.startswith("Choose the best fitting theme"):
            themes = _parse_list_block(text)
            if not themes:
                return ""
            chosen = _best_match(themes, text)
            return f"{chosen} (Confidence: 85%)"

        # 3. Theme generation (_THEME_GEN_INSTRUCTION): 3 lines "T00n, Name, Desc".
        if "SUMMARY THEMES" in instr or "T001, Theme Name" in instr:
            kws = _top_keywords(text, 3)
            lines: list[str] = []
            for i, kw in enumerate(kws):
                name = f"{kw.capitalize()} Improvements"
                lines.append(f"T00{i + 1}, {name}, feedback about {kw} raised across these responses")
            while len(lines) < 3:
                idx = len(lines) + 1
                lines.append(f"T00{idx}, General Theme {idx}, general feedback observed in this response group")
            return "\n".join(lines[:3])

        # 4. Theme reduction (_REDUCE_INSTRUCTION): N CSV lines "T#, Theme, Desc, XX%".
        if "unique themes" in instr and ("CSV" in instr or "T_Number" in instr):
            count = _extract_count(instr, text)
            themes = _dedupe([ln.strip() for ln in text.split("\n")[1:] if ln.strip()])
            if not themes:
                themes = _top_keywords(text, count) or ["General Theme"]
            out: list[str] = []
            for i, name in enumerate(themes[:count]):
                clean = name.split(",")[0].strip() or f"Theme {i + 1}"
                out.append(f"T{i + 1}, {clean}, consolidated theme covering {clean.lower()}, 85%")
            return "\n".join(out)

        # 5. Fallback = deterministic word-truncated summary (Phase A tiers, etc.).
        return truncate_to_words(text, 33)


def _parse_list_block(text: str) -> list[str]:
    """From 'List: a\\nb\\nInput: ...' return [a, b] (the candidate theme labels)."""
    if "List:" not in text:
        return []
    body = text.split("List:", 1)[1]
    body = body.split("Input:", 1)[0]
    return [ln.strip() for ln in body.strip().split("\n") if ln.strip()]


def _best_match(themes: list[str], text: str) -> str:
    """Deterministic theme pick: most keyword overlap with the input, tiebreak first."""
    low = text.lower()
    best = themes[0]
    best_score = -1
    for t in themes:
        score = sum(1 for w in _WORD_RE.findall(t.lower()) if w in low)
        if score > best_score:
            best_score = score
            best = t
    return best


def _dedupe(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for it in items:
        key = it.lower()
        if key not in seen:
            seen.add(key)
            out.append(it)
    return out


class OfflineEmbedding(EmbeddingProvider):
    """Deterministic hash-seeded embeddings (for the embedding-assignment path)."""

    provider_name = AIProviderName.OFFLINE
    _DIM = 16

    async def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._vector(t) for t in texts]

    def _vector(self, text: str) -> list[float]:
        digest = hashlib.sha256(text.encode("utf-8")).digest()
        # Map digest bytes to DIM floats in [0, 1] — deterministic, offline.
        return [digest[i % len(digest)] / 255.0 for i in range(self._DIM)]

    def model_id(self) -> str:
        return "offline-hash-v1"
