#!/usr/bin/env python3
"""Translate The Atlantis Accord into up to 32 languages using Claude / OpenAI / Gemini.

Reads /tmp/atlantis_en.json (produced by frontend/scripts/dump-atlantis-source.mjs),
translates all 28 passages (7 sections × 4 tiers: 7/33/111/333 words) per language,
and writes frontend/lib/atlantis-accord-translations/<lang>.ts

Usage:
    python translate_atlantis_accord.py --wave 1   # 11 languages
    python translate_atlantis_accord.py --wave 2   # +11 (22 total)
    python translate_atlantis_accord.py --wave 3   # +10 (32 total)
    python translate_atlantis_accord.py --langs fr,es,de
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load backend/.env
REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / "backend" / ".env")

SOURCE_PATH = Path("/tmp/atlantis_en.json")
OUT_DIR = REPO_ROOT / "frontend" / "lib" / "atlantis-accord-translations"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ─── Provider distribution ─────────────────────────────────────
# Each language is assigned to one provider. Provider strengths guide the pairing:
#  - Claude: nuanced tone, romance + CJK
#  - OpenAI: broad coverage, mid-resource
#  - Gemini: strong on translation eval + Indic/African
LANGUAGE_PROVIDERS: dict[str, str] = {
    # Wave 1 (11 languages · major world)
    "es": "openai",
    "fr": "claude",
    "pt": "gemini",
    "de": "claude",
    "it": "openai",
    "zh": "gemini",
    "ja": "claude",
    "ko": "openai",
    "ar": "gemini",
    "hi": "claude",
    "ru": "openai",
    # Wave 2 (+11 = 22 total · European + additional)
    "nl": "gemini",
    "pl": "claude",
    "uk": "openai",
    "tr": "gemini",
    "el": "claude",
    "cs": "openai",
    "sv": "gemini",
    "da": "claude",
    "no": "openai",
    "fi": "gemini",
    "ro": "claude",
    # Wave 3 (+10 = 32 total · rest)
    "he": "openai",
    "sw": "gemini",
    "ne": "claude",
    "bn": "openai",
    "pa": "gemini",
    "th": "claude",
    "vi": "openai",
    "id": "gemini",
    "ms": "claude",
    "tl": "openai",
}

WAVES: dict[int, list[str]] = {
    1: ["es", "fr", "pt", "de", "it", "zh", "ja", "ko", "ar", "hi", "ru"],
    2: ["nl", "pl", "uk", "tr", "el", "cs", "sv", "da", "no", "fi", "ro"],
    3: ["he", "sw", "ne", "bn", "pa", "th", "vi", "id", "ms", "tl"],
}

LANGUAGE_NAMES: dict[str, str] = {
    "es": "Spanish",
    "fr": "French",
    "pt": "Portuguese",
    "de": "German",
    "it": "Italian",
    "zh": "Chinese (Simplified)",
    "ja": "Japanese",
    "ko": "Korean",
    "ar": "Arabic",
    "hi": "Hindi",
    "ru": "Russian",
    "nl": "Dutch",
    "pl": "Polish",
    "uk": "Ukrainian",
    "tr": "Turkish",
    "el": "Greek",
    "cs": "Czech",
    "sv": "Swedish",
    "da": "Danish",
    "no": "Norwegian",
    "fi": "Finnish",
    "ro": "Romanian",
    "he": "Hebrew",
    "sw": "Swahili",
    "ne": "Nepali",
    "bn": "Bengali",
    "pa": "Punjabi",
    "th": "Thai",
    "vi": "Vietnamese",
    "id": "Indonesian",
    "ms": "Malay",
    "tl": "Filipino (Tagalog)",
}

# ─── Prompt template ──────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a professional translator specialising in visionary policy and treaty language. "
    "You translate The Atlantis Accord — a pilot charter to be signed by government, education, "
    "and innovation leaders in Cambodia, Honduras, and Austin, Texas — into other languages. "
    "Preserve the visionary, promissory, dignified tone. Preserve section structure and any "
    "proper nouns (PILOT, REPLAY, QUALIFY, CERTIFY, ADOPT, EDUCATE, EXPAND, eXeL, Cambodia, "
    "Honduras, Austin, Vision 2525, Atlantis Accord). "
    "For each section, translate the title and the four tiered summaries (7, 33, 111, 333 words). "
    "Strive to match the source word counts closely in the target language (±15% for grammatical "
    "necessity is acceptable). Return ONLY valid JSON matching the requested schema — no commentary."
)


def build_user_prompt(sections: list[dict], target_lang: str) -> str:
    lang_name = LANGUAGE_NAMES.get(target_lang, target_lang)
    return (
        f"Translate the following 7 sections of The Atlantis Accord from English into {lang_name} ({target_lang}).\n\n"
        f"Return valid JSON in this exact schema:\n"
        "{\n"
        '  "sections": [\n'
        '    { "id": "pilot", "title": "<translated>", "content_7": "<>", "content_33": "<>", "content_111": "<>", "content_333": "<>" },\n'
        "    ... 7 sections total, in order: pilot, replay, qualify, certify, adopt, educate, expand\n"
        "  ]\n"
        "}\n\n"
        f"Source English content:\n{json.dumps(sections, ensure_ascii=False, indent=2)}\n\n"
        "Do not include any keys outside the schema. Do not add commentary. Return only the JSON object."
    )


# ─── Providers ────────────────────────────────────────────────

async def translate_with_claude(sections: list[dict], lang: str) -> list[dict]:
    import anthropic
    client = anthropic.AsyncAnthropic()
    msg = await client.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=16000,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": build_user_prompt(sections, lang)}],
    )
    text = msg.content[0].text.strip()
    return _parse_json_response(text, lang)


async def translate_with_openai(sections: list[dict], lang: str) -> list[dict]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI()
    resp = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_user_prompt(sections, lang)},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
    )
    text = resp.choices[0].message.content or ""
    return _parse_json_response(text, lang)


async def translate_with_gemini(sections: list[dict], lang: str) -> list[dict]:
    import google.generativeai as genai
    genai.configure(api_key=os.environ["GEMINI_API_KEY"])
    model = genai.GenerativeModel(
        "gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
        generation_config={"response_mime_type": "application/json", "temperature": 0.3},
    )
    # Gemini SDK is sync — run in thread
    def _call() -> str:
        return model.generate_content(build_user_prompt(sections, lang)).text
    text = await asyncio.get_event_loop().run_in_executor(None, _call)
    return _parse_json_response(text, lang)


def _parse_json_response(text: str, lang: str) -> list[dict]:
    # Strip common markdown fences
    text = text.strip()
    if text.startswith("```"):
        # remove first line and trailing ```
        text = "\n".join(text.split("\n")[1:])
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    data = json.loads(text)
    sections = data.get("sections")
    if not isinstance(sections, list) or len(sections) != 7:
        raise ValueError(f"[{lang}] expected 7 sections, got {sections and len(sections)}")
    return sections


# ─── File writing ─────────────────────────────────────────────

def _ts_escape(s: str) -> str:
    """Escape a string for embedding as a JS template literal (backtick)."""
    return s.replace("\\", "\\\\").replace("`", "\\`").replace("${", "\\${")


def write_translation_file(lang: str, translated_sections: list[dict], source_sections: list[dict]) -> Path:
    """Write frontend/lib/atlantis-accord-translations/<lang>.ts"""
    const_name = f"ACCORD_{lang.upper().replace('-', '_')}"
    lines = [
        f"// Auto-generated by backend/scripts/translate_atlantis_accord.py",
        f"// Provider: {LANGUAGE_PROVIDERS.get(lang, 'unknown')} | Language: {LANGUAGE_NAMES.get(lang, lang)} ({lang})",
        "",
        'import type { AccordSection } from "@/lib/atlantis-accord-data";',
        "",
        f"export const {const_name}: AccordSection[] = [",
    ]
    for i, src in enumerate(source_sections):
        t = translated_sections[i]
        lines.append("  {")
        lines.append(f'    id: "{src["id"]}",')
        lines.append(f'    page: {src["page"]},')
        lines.append(f'    tag: "{src["tag"]}",')
        # Titles may contain quotes/apostrophes — use backtick
        lines.append(f"    title: `{_ts_escape(t.get('title', src['title']))}`,")
        lines.append("    content: {")
        for tier, key in [(7, "content_7"), (33, "content_33"), (111, "content_111"), (333, "content_333")]:
            val = t.get(key, src["content"][tier])
            lines.append(f"      {tier}: `{_ts_escape(val)}`,")
        lines.append("    },")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    out_path = OUT_DIR / f"{lang}.ts"
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


# ─── Orchestration ────────────────────────────────────────────

async def translate_language(sections: list[dict], lang: str) -> tuple[str, str]:
    provider = LANGUAGE_PROVIDERS.get(lang)
    if provider is None:
        return (lang, f"skip: no provider assigned")
    try:
        if provider == "claude":
            translated = await translate_with_claude(sections, lang)
        elif provider == "openai":
            translated = await translate_with_openai(sections, lang)
        elif provider == "gemini":
            translated = await translate_with_gemini(sections, lang)
        else:
            return (lang, f"skip: unknown provider {provider}")
        path = write_translation_file(lang, translated, sections)
        return (lang, f"ok · {provider} · {path.name}")
    except Exception as e:
        return (lang, f"ERROR · {provider} · {type(e).__name__}: {e}")


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--wave", type=int, choices=[1, 2, 3], help="Translate a preset wave")
    parser.add_argument("--langs", type=str, help="Comma-separated language codes")
    args = parser.parse_args()

    if args.wave:
        target_langs = WAVES[args.wave]
    elif args.langs:
        target_langs = [x.strip() for x in args.langs.split(",") if x.strip()]
    else:
        target_langs = list(LANGUAGE_PROVIDERS.keys())  # all 32

    if not SOURCE_PATH.exists():
        print(f"ERROR: {SOURCE_PATH} not found. Run frontend/scripts/dump-atlantis-source.mjs first.")
        sys.exit(1)

    sections = json.loads(SOURCE_PATH.read_text())
    print(f"→ Translating {len(target_langs)} languages · {len(sections)} sections × 4 tiers each")
    print(f"  langs: {', '.join(target_langs)}")

    results = await asyncio.gather(*(translate_language(sections, lang) for lang in target_langs))

    print("\nResults:")
    ok, err = 0, 0
    for lang, status in results:
        marker = "✓" if status.startswith("ok") else "✗"
        print(f"  {marker} {lang:4}  {status}")
        if status.startswith("ok"):
            ok += 1
        else:
            err += 1
    print(f"\nTotal: {ok} ok / {err} error")
    sys.exit(0 if err == 0 else 1)


if __name__ == "__main__":
    asyncio.run(main())
