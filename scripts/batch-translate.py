#!/usr/bin/env python3
"""
Batch Translation Script — Divinity Guide
Uses Gemini API for fast parallel translation of all pages.
Translates 10 pages per API call for speed.
"""

import json
import os
import sys
import time
import concurrent.futures
from pathlib import Path

import urllib.request

BACKEND_ENV = Path(__file__).parent.parent / "backend" / ".env"
FRONTEND_LIB = Path(__file__).parent.parent / "frontend" / "lib"
TRANSLATIONS_DIR = FRONTEND_LIB / "translations"

LANGUAGES = {
    "es": {"name": "Spanish", "master": "Enki", "terms": {"Master of Thought": "Maestro del Pensamiento", "Divinity Guide": "Guía de la Divinidad", "Flower of Life": "Flor de la Vida"}},
    "uk": {"name": "Ukrainian", "master": "Aset", "terms": {"Master of Thought": "Майстер Думки", "Divinity Guide": "Путівник Божественності", "Flower of Life": "Квітка Життя"}},
    "ru": {"name": "Russian", "master": "Asar", "terms": {"Master of Thought": "Мастер Мысли", "Divinity Guide": "Путеводитель Божественности", "Flower of Life": "Цветок Жизни"}},
    "zh": {"name": "Chinese (Simplified)", "master": "Pangu", "terms": {"Master of Thought": "思想大师", "Divinity Guide": "神圣指南", "Flower of Life": "生命之花"}},
    "fa": {"name": "Persian/Farsi", "master": "Sofia", "terms": {"Master of Thought": "استاد اندیشه", "Divinity Guide": "راهنمای الهی", "Flower of Life": "گل زندگی"}},
    "he": {"name": "Hebrew", "master": "Christo", "terms": {"Master of Thought": "אדון המחשבה", "Divinity Guide": "מדריך האלוהות", "Flower of Life": "פרח החיים"}},
    "pt": {"name": "Brazilian Portuguese", "master": "Krishna", "terms": {"Master of Thought": "Mestre do Pensamento", "Divinity Guide": "Guia da Divindade", "Flower of Life": "Flor da Vida"}},
}

BATCH_SIZE = 10  # pages per API call


def load_api_key():
    """Load OpenAI API key from backend .env"""
    with open(BACKEND_ENV) as f:
        for line in f:
            if line.startswith("OPENAI_API_KEY="):
                return line.strip().split("=", 1)[1]
    raise RuntimeError("OPENAI_API_KEY not found in backend/.env")


def load_english_pages():
    """Load the English source JSON"""
    with open(FRONTEND_LIB / "divinity-pages.json") as f:
        return json.load(f)


def translate_batch(api_key, pages, lang_code, lang_info):
    """Translate a batch of pages using OpenAI API (gpt-4o-mini for speed)"""
    terms = lang_info["terms"]
    term_str = "\n".join(f'- "{k}" → "{v}"' for k, v in terms.items())

    pages_text = ""
    for p in pages:
        pages_text += f"===PAGE_ID:{p['id']}===\n{p['text']}\n===END===\n\n"

    system_prompt = f"""You are a sacred text translator. Translate to {lang_info['name']} with reverence and poetic quality.

TERMINOLOGY (use exactly):
{term_str}

RULES:
- Keep emojis, symbols (•••, ✦, ♡, ◬, 웃), URLs, proper names (Thoth, Odin, Krishna, etc.) unchanged
- Preserve paragraph breaks between paragraphs
- Each page: ===PAGE_ID:xxx=== ... ===END===
- Return SAME delimiters with translated text"""

    url = "https://api.openai.com/v1/chat/completions"
    data = json.dumps({
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": pages_text}
        ],
        "max_tokens": 16384,
        "temperature": 0.3
    }).encode()

    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    with urllib.request.urlopen(req, timeout=120) as resp:
        result = json.loads(resp.read())

    return result["choices"][0]["message"]["content"]


def parse_response(response_text, page_ids):
    """Parse the delimited response back into individual page translations"""
    translations = {}
    current_id = None
    current_text = []

    for line in response_text.split("\n"):
        if line.startswith("===PAGE_ID:") and line.endswith("==="):
            if current_id and current_text:
                translations[current_id] = "\n".join(current_text).strip()
            current_id = line.replace("===PAGE_ID:", "").replace("===", "")
            current_text = []
        elif line.strip() == "===END===":
            if current_id and current_text:
                translations[current_id] = "\n".join(current_text).strip()
            current_id = None
            current_text = []
        elif current_id is not None:
            current_text.append(line)

    # Handle last page if no final ===END===
    if current_id and current_text:
        translations[current_id] = "\n".join(current_text).strip()

    return translations


def translate_language(api_key, pages, lang_code, lang_info):
    """Translate all pages for one language using batched API calls"""
    lang_dir = TRANSLATIONS_DIR / lang_code
    lang_dir.mkdir(parents=True, exist_ok=True)

    # Skip already-translated pages
    remaining = []
    for p in pages:
        txt_file = lang_dir / f"{p['id']}.txt"
        if not txt_file.exists() or txt_file.stat().st_size == 0:
            remaining.append(p)

    if not remaining:
        print(f"  {lang_info['master']:10s} {lang_info['name']:12s} — already complete ({len(pages)} pages)")
        return len(pages)

    print(f"  {lang_info['master']:10s} {lang_info['name']:12s} — {len(remaining)} pages to translate ({len(pages) - len(remaining)} cached)")

    translated_count = len(pages) - len(remaining)

    # Process in batches
    for i in range(0, len(remaining), BATCH_SIZE):
        batch = remaining[i:i + BATCH_SIZE]
        batch_ids = [p["id"] for p in batch]

        try:
            response_text = translate_batch(api_key, batch, lang_code, lang_info)

            translations = parse_response(response_text, batch_ids)

            # Save each translated page
            for p in batch:
                if p["id"] in translations:
                    txt_file = lang_dir / f"{p['id']}.txt"
                    txt_file.write_text(translations[p["id"]], encoding="utf-8")
                    translated_count += 1
                else:
                    print(f"    WARNING: Missing translation for {p['id']}")

            pct = translated_count * 100 // len(pages)
            print(f"    {lang_info['master']:10s} {lang_info['name']:12s} — {translated_count}/{len(pages)} ({pct}%)")

        except Exception as e:
            print(f"    ERROR batch {batch_ids[0]}-{batch_ids[-1]}: {e}")
            # Retry individual pages on batch failure
            for p in batch:
                try:
                    resp = translate_batch(api_key, [p], lang_code, lang_info)
                    translations = parse_response(resp, [p["id"]])
                    if p["id"] in translations:
                        txt_file = lang_dir / f"{p['id']}.txt"
                        txt_file.write_text(translations[p["id"]], encoding="utf-8")
                        translated_count += 1
                except Exception as e2:
                    print(f"      FAIL {p['id']}: {e2}")

            time.sleep(1)  # rate limit backoff

    return translated_count


def merge_translations(pages, lang_code):
    """Merge individual .txt files into final JSON"""
    lang_dir = TRANSLATIONS_DIR / lang_code
    result = []
    for p in pages:
        txt_file = lang_dir / f"{p['id']}.txt"
        if txt_file.exists():
            translated_text = txt_file.read_text(encoding="utf-8")
            result.append({**p, "text": translated_text})
        else:
            result.append(p)  # fallback to English

    out_file = FRONTEND_LIB / f"divinity-pages-{lang_code}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    return len(result)


def main():
    api_key = load_api_key()
    pages = load_english_pages()

    # Select languages to translate
    target_langs = sys.argv[1:] if len(sys.argv) > 1 else list(LANGUAGES.keys())

    print(f"\n{'='*60}")
    print(f"  Divinity Guide Batch Translation")
    print(f"  {len(pages)} pages × {len(target_langs)} languages = {len(pages) * len(target_langs)} translations")
    print(f"  Batch size: {BATCH_SIZE} pages/API call")
    print(f"  API: Gemini 2.0 Flash")
    print(f"{'='*60}\n")

    start = time.time()

    # Translate all languages in parallel (2 at a time to respect rate limits)
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
        futures = {}
        for lang_code in target_langs:
            if lang_code in LANGUAGES:
                f = executor.submit(translate_language, api_key, pages, lang_code, LANGUAGES[lang_code])
                futures[f] = lang_code

        for future in concurrent.futures.as_completed(futures):
            lang_code = futures[future]
            try:
                count = future.result()
                print(f"\n  ✓ {LANGUAGES[lang_code]['master']:10s} {LANGUAGES[lang_code]['name']:12s} — {count}/{len(pages)} pages complete")
                # Merge into final JSON
                merged = merge_translations(pages, lang_code)
                print(f"    → Merged {merged} pages into divinity-pages-{lang_code}.json")
            except Exception as e:
                print(f"\n  ✗ {lang_code}: {e}")

    elapsed = time.time() - start
    print(f"\n{'='*60}")
    print(f"  Completed in {elapsed:.1f}s ({elapsed/60:.1f} min)")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
