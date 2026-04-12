#!/usr/bin/env python3
"""
Generate Khmer (km) translations for Divinity Guide pages.
Uses Google Translate API via googletrans library.

Prerequisites:
  pip install googletrans==4.0.0-rc1

Usage:
  python3 scripts/create-km-divinity-translations.py

Output:
  frontend/lib/divinity-pages-km.json
"""

import json
import time
import os
import sys

def main():
    try:
        from googletrans import Translator
    except ImportError:
        print("ERROR: googletrans not installed. Run: pip install googletrans==4.0.0-rc1")
        sys.exit(1)

    src_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'lib', 'divinity-pages.json')
    dst_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'lib', 'divinity-pages-km.json')

    with open(src_path, 'r', encoding='utf-8') as f:
        pages = json.load(f)

    translator = Translator()
    km_pages = []

    for i, page in enumerate(pages):
        print(f"Translating page {i+1}/{len(pages)}: {page['id']}...", end=' ', flush=True)

        # Split text into paragraphs for better translation quality
        paragraphs = page['text'].split('\n')
        translated_paragraphs = []

        for para in paragraphs:
            stripped = para.strip()
            if not stripped:
                translated_paragraphs.append('')
                continue

            # Preserve URLs, emojis, and special markers
            if stripped.startswith('http') or stripped.startswith('•••'):
                # Keep URLs as-is, translate "Master of Thought" marker
                if '••• Master of Thought' in stripped:
                    translated_paragraphs.append(stripped.replace('Master of Thought', 'ម្ចាស់គំនិត'))
                else:
                    translated_paragraphs.append(stripped)
                continue

            try:
                result = translator.translate(stripped, src='en', dest='km')
                translated_paragraphs.append(result.text)
            except Exception as e:
                print(f"\n  WARNING: Translation failed for paragraph, keeping English: {e}")
                translated_paragraphs.append(stripped)

            # Rate limit to avoid being blocked
            time.sleep(0.3)

        km_page = {
            'id': page['id'],
            'chapter': page['chapter'],
            'page': page['page'],
            'text': '\n'.join(translated_paragraphs),
            'gated': page['gated']
        }
        km_pages.append(km_page)
        print("OK")

    with open(dst_path, 'w', encoding='utf-8') as f:
        json.dump(km_pages, f, ensure_ascii=False, indent=2)

    print(f"\nDone! {len(km_pages)} pages translated to Khmer.")
    print(f"Output: {dst_path}")

if __name__ == '__main__':
    main()
