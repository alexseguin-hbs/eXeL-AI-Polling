"""Cost Estimation Test — 3 responses × 4 providers = 12 API calls.

Sends a ~333-word AI governance response through each provider's summarization
API (333→111→33 single-prompt) and measures token usage + latency.

Extrapolates cost for 1000 users × 3 responses × 333 words each.
"""

import json
import os
import time
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Sample 333-word response (simulating real user input)
# ---------------------------------------------------------------------------

SAMPLE_RESPONSES = [
    # Response 1: Risk-focused
    "Artificial intelligence governance requires comprehensive frameworks that address multiple critical dimensions simultaneously. "
    "First and foremost organizations must establish clear accountability structures that define who is responsible when AI systems "
    "make decisions that affect people's lives. This includes creating oversight boards with diverse representation from technical "
    "experts ethicists legal professionals and community stakeholders. The risk of algorithmic bias represents one of the most "
    "pressing concerns in AI deployment. Historical data used to train models often reflects existing societal inequalities which "
    "can perpetuate and even amplify discrimination against marginalized groups. Regular bias audits using standardized metrics "
    "should be mandatory for any AI system deployed in high-stakes domains such as healthcare criminal justice hiring and financial "
    "services. Transparency is another fundamental pillar of responsible AI governance. Organizations must be able to explain how "
    "their AI systems arrive at decisions in terms that affected individuals can understand. This goes beyond technical "
    "interpretability to include clear communication about what data is collected how it is used and what recourse individuals "
    "have when they disagree with automated decisions. Privacy protection must be built into AI systems from the ground up "
    "following privacy by design principles rather than being added as an afterthought. Data minimization purpose limitation "
    "and robust security measures are essential components of any AI governance framework. The rapid pace of AI advancement "
    "also demands adaptive regulatory approaches that can evolve alongside technology. Static regulations risk becoming obsolete "
    "before they are even fully implemented. Regulatory sandboxes international cooperation and multi-stakeholder dialogue "
    "mechanisms offer promising pathways for creating governance frameworks that are both effective and flexible enough to "
    "accommodate future developments. Finally organizations must invest in AI literacy programs that empower both employees "
    "and the general public to understand engage with and meaningfully participate in decisions about how AI is developed "
    "and deployed in their communities and workplaces.",

    # Response 2: Support-focused
    "The potential benefits of well-governed artificial intelligence are truly transformative for society. When properly "
    "implemented AI systems can dramatically improve healthcare outcomes by analyzing medical imaging with accuracy that "
    "surpasses human radiologists detecting diseases earlier and enabling personalized treatment plans based on individual "
    "genetic profiles and health histories. In education AI-powered adaptive learning platforms can provide every student "
    "with a customized educational experience that adjusts to their learning pace style and interests creating equitable "
    "access to high-quality education regardless of geographic location or socioeconomic background. Climate change "
    "represents another domain where AI governance done right can accelerate solutions. Machine learning models are already "
    "optimizing energy grids predicting weather patterns with unprecedented accuracy and identifying the most promising "
    "pathways for carbon capture and renewable energy deployment. Smart agriculture powered by AI can reduce water usage "
    "minimize pesticide application and increase crop yields to feed a growing global population sustainably. The economic "
    "benefits are equally compelling with AI-driven automation freeing workers from repetitive dangerous tasks and creating "
    "new categories of employment that we cannot yet fully envision. Strong governance frameworks actually enable faster "
    "and more widespread AI adoption by building public trust and providing clear guidelines for responsible innovation. "
    "Companies that demonstrate commitment to ethical AI practices gain competitive advantages through enhanced brand "
    "reputation customer loyalty and reduced regulatory risk. International cooperation on AI standards can prevent a "
    "race to the bottom on safety while fostering healthy competition on innovation. The key insight is that governance "
    "and innovation are not opposing forces but complementary elements of a mature technology ecosystem. By establishing "
    "clear rules of the road we create the conditions for AI to deliver on its extraordinary promise while protecting "
    "the rights and dignity of every individual affected by these powerful systems.",

    # Response 3: Neutral/balanced
    "When examining AI governance from a balanced perspective it becomes clear that both the opportunities and challenges "
    "are significant and neither should be minimized. Current governance frameworks vary considerably across jurisdictions "
    "with the European Union taking a more regulatory approach through the AI Act while the United States has favored "
    "voluntary guidelines and industry self-regulation. Asian countries present a mixed picture with some nations "
    "prioritizing rapid AI development while others are developing comprehensive regulatory frameworks. The effectiveness "
    "of any governance approach ultimately depends on several factors including enforcement mechanisms stakeholder "
    "engagement and the ability to adapt to rapidly changing technology. One observation is that governance frameworks "
    "tend to be most effective when they are developed through genuine collaboration between government industry "
    "academia and civil society rather than imposed top down by any single actor. The technical complexity of AI systems "
    "means that effective governance requires deep understanding of both the capabilities and limitations of current "
    "technology. This creates a challenge because the people best positioned to understand the technology are often "
    "employed by the companies developing it potentially creating conflicts of interest. Independent research institutions "
    "and academic centers play a crucial role in bridging this gap by providing unbiased technical assessments and "
    "developing tools for algorithmic auditing. The question of international coordination remains largely unresolved "
    "with different cultural values legal traditions and economic interests making global consensus difficult to achieve. "
    "Regional approaches may prove more practical in the near term with bilateral and multilateral agreements gradually "
    "building toward broader international norms. What seems clear is that the status quo of minimal governance is "
    "unsustainable as AI systems become more powerful and pervasive in every aspect of daily life. The path forward "
    "likely involves a combination of hard regulation for high-risk applications soft governance tools for lower-risk "
    "uses and continued investment in research and public engagement to inform evidence-based policymaking.",
]

INSTRUCTION = (
    "You are a summarizer. "
    "Given the following text, produce three summaries at different lengths. "
    "Return ONLY valid JSON with exactly these three keys:\n"
    '{"summary_333": "~333 word summary", "summary_111": "~111 word summary", "summary_33": "~33 word summary"}\n'
    "All summaries must be in English. Preserve key points and meaning."
)

# ---------------------------------------------------------------------------
# Provider API callers (raw HTTP — no SDK dependency)
# ---------------------------------------------------------------------------


def call_openai(text: str, api_key: str) -> dict:
    """Call OpenAI gpt-4o-mini."""
    url = "https://api.openai.com/v1/chat/completions"
    body = {
        "model": "gpt-4o-mini",
        "temperature": 0.0,
        "messages": [
            {"role": "system", "content": INSTRUCTION},
            {"role": "user", "content": text[:8000]},
        ],
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    start = time.monotonic()
    resp = urllib.request.urlopen(req, timeout=30)
    duration = round(time.monotonic() - start, 2)
    data = json.loads(resp.read())
    usage = data.get("usage", {})
    return {
        "provider": "OpenAI (gpt-4o-mini)",
        "duration_sec": duration,
        "input_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "response_text": data["choices"][0]["message"]["content"][:200],
    }


def call_grok(text: str, api_key: str) -> dict:
    """Call xAI Grok-2 via OpenAI-compatible endpoint."""
    url = "https://api.x.ai/v1/chat/completions"
    body = {
        "model": "grok-2",
        "temperature": 0.0,
        "messages": [
            {"role": "system", "content": INSTRUCTION},
            {"role": "user", "content": text[:8000]},
        ],
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
    )
    start = time.monotonic()
    resp = urllib.request.urlopen(req, timeout=30)
    duration = round(time.monotonic() - start, 2)
    data = json.loads(resp.read())
    usage = data.get("usage", {})
    return {
        "provider": "Grok (grok-2)",
        "duration_sec": duration,
        "input_tokens": usage.get("prompt_tokens", 0),
        "output_tokens": usage.get("completion_tokens", 0),
        "total_tokens": usage.get("total_tokens", 0),
        "response_text": data["choices"][0]["message"]["content"][:200],
    }


def call_gemini(text: str, api_key: str) -> dict:
    """Call Google Gemini 2.0 Flash."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    body = {
        "contents": [{"parts": [{"text": f"{INSTRUCTION}\n\n{text[:8000]}"}]}],
        "generationConfig": {"temperature": 0.0},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    start = time.monotonic()
    resp = urllib.request.urlopen(req, timeout=30)
    duration = round(time.monotonic() - start, 2)
    data = json.loads(resp.read())
    text_out = data["candidates"][0]["content"]["parts"][0]["text"]
    usage = data.get("usageMetadata", {})
    return {
        "provider": "Gemini (gemini-2.5-flash)",
        "duration_sec": duration,
        "input_tokens": usage.get("promptTokenCount", 0),
        "output_tokens": usage.get("candidatesTokenCount", 0),
        "total_tokens": usage.get("totalTokenCount", 0),
        "response_text": text_out[:200],
    }


def call_claude(text: str, api_key: str) -> dict:
    """Call Anthropic Claude Sonnet 4.6."""
    url = "https://api.anthropic.com/v1/messages"
    body = {
        "model": "claude-sonnet-4-6-20250514",
        "max_tokens": 1024,
        "temperature": 0.0,
        "system": INSTRUCTION,
        "messages": [{"role": "user", "content": text[:8000]}],
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode(),
        headers={
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
        },
    )
    start = time.monotonic()
    resp = urllib.request.urlopen(req, timeout=30)
    duration = round(time.monotonic() - start, 2)
    data = json.loads(resp.read())
    usage = data.get("usage", {})
    return {
        "provider": "Claude (claude-sonnet-4-6)",
        "duration_sec": duration,
        "input_tokens": usage.get("input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
        "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
        "response_text": data["content"][0]["text"][:200],
    }


# ---------------------------------------------------------------------------
# Cost tables (per 1M tokens, as of March 2026)
# ---------------------------------------------------------------------------

PRICING = {
    "OpenAI (gpt-4o-mini)": {"input_per_1m": 0.15, "output_per_1m": 0.60},
    "Grok (grok-2)": {"input_per_1m": 2.00, "output_per_1m": 10.00},
    "Gemini (gemini-2.5-flash)": {"input_per_1m": 0.10, "output_per_1m": 0.40},
    "Claude (claude-sonnet-4-6)": {"input_per_1m": 3.00, "output_per_1m": 15.00},
}

# Scale: 1000 users × 3 responses each = 3000 summarizations
SCALE_FACTOR = 3000 / 3  # 3 test calls → 3000 at scale


def main():
    openai_key = os.environ.get("OPENAI_API_KEY", "")
    grok_key = os.environ.get("XAI_API_KEY", "")
    gemini_key = os.environ.get("GEMINI_API_KEY", "")
    claude_key = os.environ.get("ANTHROPIC_API_KEY", "")

    providers = [
        ("OpenAI", call_openai, openai_key),
        ("Grok", call_grok, grok_key),
        ("Gemini", call_gemini, gemini_key),
        ("Claude", call_claude, claude_key),
    ]

    all_results = []

    for name, caller, key in providers:
        if not key:
            print(f"\n--- {name}: SKIPPED (no API key) ---")
            continue

        print(f"\n--- {name}: Testing 3 responses ---")
        provider_results = []

        for i, text in enumerate(SAMPLE_RESPONSES):
            try:
                result = caller(text, key)
                provider_results.append(result)
                print(f"  Response {i+1}: {result['duration_sec']}s | "
                      f"in={result['input_tokens']} out={result['output_tokens']} "
                      f"total={result['total_tokens']}")
            except urllib.error.HTTPError as e:
                error_body = e.read().decode() if e.fp else ""
                print(f"  Response {i+1}: ERROR {e.code} — {error_body[:200]}")
            except Exception as e:
                print(f"  Response {i+1}: ERROR — {e}")

        if provider_results:
            all_results.append(provider_results)

    # ---------------------------------------------------------------------------
    # Cost Summary
    # ---------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print("COST ESTIMATE: 1000 Users × 3 Responses × 333 Words Each")
    print("=" * 80)
    print(f"{'Provider':<30} {'Avg Latency':>12} {'Avg In Tok':>10} {'Avg Out Tok':>11} "
          f"{'Cost/3 calls':>12} {'Est. 3000':>12}")
    print("-" * 80)

    for results in all_results:
        provider = results[0]["provider"]
        pricing = PRICING.get(provider, {"input_per_1m": 0, "output_per_1m": 0})

        avg_dur = sum(r["duration_sec"] for r in results) / len(results)
        avg_in = sum(r["input_tokens"] for r in results) / len(results)
        avg_out = sum(r["output_tokens"] for r in results) / len(results)
        total_in = sum(r["input_tokens"] for r in results)
        total_out = sum(r["output_tokens"] for r in results)

        cost_3 = (total_in * pricing["input_per_1m"] / 1_000_000 +
                  total_out * pricing["output_per_1m"] / 1_000_000)
        cost_3000 = cost_3 * SCALE_FACTOR

        print(f"{provider:<30} {avg_dur:>10.2f}s {avg_in:>10.0f} {avg_out:>10.0f} "
              f"${cost_3:>11.4f} ${cost_3000:>11.2f}")

    print("-" * 80)
    print("Note: Costs are estimates based on published per-1M-token pricing.")
    print("Phase A summarization = 1 call per response (single-prompt JSON).")
    print("Phase B theming adds ~20-30% overhead (classification + reduction + assignment).")
    print("Total estimated = Phase A cost × 1.3 for full pipeline.")

    # ---------------------------------------------------------------------------
    # Voice-to-Text (V2T / STT) Cost Estimate
    # ---------------------------------------------------------------------------
    # Assumption: 50% of 1000 users use voice (500 users × 3 responses = 1500 V2T calls)
    # Average audio per 333-word response ≈ 2.5 minutes (~150 words/min speaking pace)
    # Total audio: 1500 × 2.5 min = 3750 minutes
    v2t_users = 500
    v2t_responses = v2t_users * 3  # 1500
    avg_audio_min = 2.5  # ~333 words at normal speech pace
    total_audio_min = v2t_responses * avg_audio_min  # 3750 min
    total_audio_hrs = total_audio_min / 60  # 62.5 hrs

    V2T_PRICING = {
        "OpenAI Whisper (whisper-1)": 0.006,          # $0.006/min
        "Grok/xAI (whisper-large-v3)": 0.006,         # $0.006/min (OpenAI-compatible pricing)
        "Gemini (gemini-2.5-flash)": 0.00,             # Free tier: audio input billed as tokens (~$0.00015/sec)
        "AWS Transcribe (batch)": 0.024,               # $0.024/min (first 250K min/mo)
        "Azure Speech (real-time)": 0.016,             # $1/hr = $0.0167/min
    }

    # Gemini audio: ~25 tokens/sec of audio × $0.10/1M tokens = ~$0.00015/sec
    gemini_audio_cost_per_min = 25 * 60 * 0.10 / 1_000_000  # ~$0.00015/min

    print(f"\n{'=' * 80}")
    print("VOICE-TO-TEXT (V2T) COST ESTIMATE")
    print(f"Assumption: 500 users voice (50%), 500 text-only (50%)")
    print(f"Each voice user: 3 responses × ~2.5 min audio = 7.5 min/user")
    print(f"Total audio: {total_audio_min:.0f} min ({total_audio_hrs:.1f} hours)")
    print(f"{'=' * 80}")
    print(f"{'STT Provider':<35} {'$/min':>8} {'1500 calls':>12} {'3750 min':>12}")
    print(f"{'-' * 80}")

    for provider, per_min in V2T_PRICING.items():
        if "Gemini" in provider:
            cost = gemini_audio_cost_per_min * total_audio_min
        else:
            cost = per_min * total_audio_min
        print(f"{provider:<35} ${per_min:>7.4f} {'1500':>12} ${cost:>11.2f}")

    print(f"{'-' * 80}")

    # ---------------------------------------------------------------------------
    # Combined Total (Summarization + V2T)
    # ---------------------------------------------------------------------------
    print(f"\n{'=' * 80}")
    print("COMBINED COST ESTIMATE (Summarization + V2T)")
    print(f"1000 users × 3 responses × 333 words | 50% voice / 50% text")
    print(f"{'=' * 80}")
    print(f"{'Combo':<45} {'Summary':>10} {'V2T':>10} {'Total':>10}")
    print(f"{'-' * 80}")

    # Build combos: cheapest, moderate, premium
    summary_costs = {}
    for results in all_results:
        provider = results[0]["provider"]
        pricing = PRICING.get(provider, {"input_per_1m": 0, "output_per_1m": 0})
        total_in = sum(r["input_tokens"] for r in results)
        total_out = sum(r["output_tokens"] for r in results)
        cost_3 = (total_in * pricing["input_per_1m"] / 1_000_000 +
                  total_out * pricing["output_per_1m"] / 1_000_000)
        summary_costs[provider] = cost_3 * SCALE_FACTOR * 1.3  # ×1.3 for Phase B

    # Theoretical cost if no test data (use pricing × estimated tokens)
    # ~500 input tokens + ~300 output tokens per call at 333 words
    if not summary_costs:
        est_in = 500
        est_out = 300
        for pname, p in PRICING.items():
            cost = (est_in * p["input_per_1m"] / 1_000_000 +
                    est_out * p["output_per_1m"] / 1_000_000) * 3000 * 1.3
            summary_costs[pname] = cost

    whisper_v2t = 0.006 * total_audio_min
    gemini_v2t = gemini_audio_cost_per_min * total_audio_min
    aws_v2t = 0.024 * total_audio_min

    combos = [
        ("Gemini summary + Gemini V2T (cheapest)", "Gemini (gemini-2.5-flash)", gemini_v2t),
        ("OpenAI summary + Whisper V2T", "OpenAI (gpt-4o-mini)", whisper_v2t),
        ("Grok summary + Whisper V2T", "Grok (grok-2)", whisper_v2t),
        ("Claude summary + Whisper V2T", "Claude (claude-sonnet-4-6)", whisper_v2t),
        ("Claude summary + AWS V2T (most expensive)", "Claude (claude-sonnet-4-6)", aws_v2t),
    ]

    for label, sum_key, v2t_cost in combos:
        s_cost = summary_costs.get(sum_key, 0)
        total = s_cost + v2t_cost
        print(f"{label:<45} ${s_cost:>9.2f} ${v2t_cost:>9.2f} ${total:>9.2f}")

    print(f"{'-' * 80}")
    print("Pricing sources: OpenAI, xAI, Google, Anthropic, AWS published rates (March 2026)")
    print("V2T estimate assumes 50% of users use voice input (~2.5 min per 333-word response)\n")


if __name__ == "__main__":
    main()
