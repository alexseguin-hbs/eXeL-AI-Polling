"""Cube 6 — ◬ ♡ 웃 Pod outcome synthesis (session-less).

The ◬ ♡ 웃 Session (frontend /soi-session) closes a pod with a 333-word, three-
paragraph synthesis of the recorded outcome — Results · What changed · What next.

Operating-mode alignment (Manual → Semi-Automated → Autonomous):
  • MANUAL (today): the frontend generates a deterministic, data-grounded synthesis
    locally (lib/pod-synthesis.ts). It runs with no backend — the pod is local-first.
  • SEMI-AUTOMATED / AUTONOMOUS (as HI + AI contributors come online): this endpoint
    hands the recorded outcome to the real Cube 6 provider factory (Gemini / OpenAI /
    Grok / Claude — keys server-side, circuit-breaker + failover), which writes the
    three paragraphs. No stub: it calls the same SummarizationProvider the theme
    pipeline uses.

When no provider key is configured (the factory degrades to OFFLINE), this endpoint
returns source="offline" with no paragraphs, and the frontend keeps its deterministic
Manual-mode synthesis rather than shipping a 33-word truncation. That is graceful
degradation, not a stub — the AI path is genuinely wired for when a key is present.
"""

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.cubes.cube6_ai.providers.factory import get_summarization_provider_or_offline
from app.cubes.cube6_ai.providers.offline_provider import OfflineSummarization

logger = structlog.get_logger(__name__)

VALID_PROVIDERS = ("openai", "grok", "gemini", "claude")

router = APIRouter(prefix="/pod", tags=["Cube 6 — Pod Synthesis"])


class PodFacts(BaseModel):
    witnessed_hours: float = 0
    yug_yok: float = 0            # 웃 that settle
    m: float = 1                  # the multiple
    baseline_hours: float = 0
    accel_delta: float = 0        # hours saved vs baseline
    ya_triangle: float = 0        # ◬ recognised
    signer_name: str = ""
    member_names: list[str] = Field(default_factory=list)
    pod_code: str = ""


class PodSynthesisRequest(BaseModel):
    intent: str = ""
    outcome: str = ""
    record_text: str = ""
    facts: PodFacts = Field(default_factory=PodFacts)
    provider: str = "openai"


class PodSynthesisResponse(BaseModel):
    source: str                  # "ai" | "offline"
    provider: str
    results: str | None = None
    changed: str | None = None
    next: str | None = None


_INSTRUCTION = (
    "You are the Master of Thought writing the close-out of a witnessed ◬ ♡ 웃 pod of "
    "three contributors. Write EXACTLY three paragraphs, about 333 words total, in a "
    "visionary-but-plain register that speaks to the hearts, minds, and spirits of the "
    "contributors. Paragraph 1 (Results): what the pod produced. Paragraph 2 (What "
    "changed): the witnessed hours that settled as 웃 (= M × hours), the ◬ recognised "
    "from the frozen-baseline delta if any, each person bound by the 9,999/yr ceiling. "
    "Paragraph 3 (What next): where the outcome goes. Invariants you must respect: "
    "recognition is not money; 웃 = M × qualified time only; ◬ is the hours delta only, "
    "never a profit metric; nothing new is minted — the pod gates ♡, 웃, ◬ that already "
    "exist. Separate the three paragraphs with a blank line. Do not add headings."
)


@router.post("/synthesis", response_model=PodSynthesisResponse)
async def pod_synthesis(payload: PodSynthesisRequest) -> PodSynthesisResponse:
    """Synthesize a pod's recorded outcome into a 3-paragraph ~333-word close-out.

    Uses the real Cube 6 provider (Gemini/OpenAI/…) when a key is configured; returns
    source="offline" (no paragraphs) so the frontend keeps its deterministic Manual-mode
    synthesis when no provider is available.
    """
    if payload.provider not in VALID_PROVIDERS:
        raise HTTPException(status_code=400, detail=f"provider must be one of: {', '.join(VALID_PROVIDERS)}")

    provider_obj = get_summarization_provider_or_offline(payload.provider)
    if isinstance(provider_obj, OfflineSummarization):
        # No real key — let the frontend's deterministic Manual synthesis stand.
        return PodSynthesisResponse(source="offline", provider="offline")

    f = payload.facts
    context = (
        f"INTENT: {payload.intent}\n"
        f"MEASURABLE OUTCOME: {payload.outcome}\n"
        f"CONTRIBUTORS: {', '.join(f.member_names) or 'the pod of three'}\n"
        f"POD CODE: {f.pod_code or '(local)'}\n"
        f"WITNESSED HOURS: {f.witnessed_hours}\n"
        f"웃 SETTLED (M x hours, M={f.m}): {f.yug_yok}\n"
        f"FROZEN BASELINE HOURS: {f.baseline_hours}\n"
        f"HOURS AHEAD OF BASELINE: {f.accel_delta}\n"
        f"◬ RECOGNISED (delta only): {f.ya_triangle}\n"
        f"ACCELERATOR SIGNER (conflict-excluded): {f.signer_name or '—'}\n"
        f"RECORDED OUTCOME (verbatim): {payload.record_text}\n"
    )

    try:
        raw = await provider_obj.summarize([context], _INSTRUCTION)
    except Exception as exc:  # provider outage → let the frontend fall back deterministically
        logger.warning("cube6.pod_synthesis.provider_error provider=%s err=%s", payload.provider, exc)
        return PodSynthesisResponse(source="offline", provider="offline")

    paras = [p.strip() for p in raw.split("\n\n") if p.strip()]
    if len(paras) < 3:
        # single-block reply — split on single newlines as a fallback
        paras = [p.strip() for p in raw.split("\n") if p.strip()]
    if len(paras) < 3:
        return PodSynthesisResponse(source="offline", provider="offline")

    return PodSynthesisResponse(
        source="ai", provider=payload.provider,
        results=paras[0], changed=paras[1], next=" ".join(paras[2:]),
    )
