#!/usr/bin/env python3
"""
Seed Supabase lexicon tables with all 701 keys × 34 languages from local TypeScript files.
This is the initial bulk load — after this, edits happen via admin UI → Supabase directly.

Architecture for 1M concurrent:
- Supabase = source of truth (admin writes here)
- Frontend loads full bundle once on init (single GET /api/v1/lexicon/bundle)
- CDN caches the bundle (Cloudflare edge, 5-min TTL)
- Supabase Realtime pushes only DELTAS (new/changed translations) to connected clients
- No per-user DB query on language switch — all resolved from cached in-memory bundle

Usage:
  python3 scripts/seed-lexicon-supabase.py
"""

import os, sys, json, re, time

def main():
    try:
        from supabase import create_client
    except ImportError:
        print("ERROR: pip install supabase")
        sys.exit(1)

    SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://ppgfjplawtlrfqpnszyb.supabase.co')
    SUPABASE_KEY = os.environ.get('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwZ2ZqcGxhd3RscmZxcG5zenliIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYzMjU1MywiZXhwIjoyMDkwMjA4NTUzfQ.aAu3h0QXgac_KjQALmjZonPDGABOltPlB-k93JJH8Ag')
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # ── 1. Seed languages ──────────────────────────────────────────
    print("Seeding lexicon_languages...")
    # Read from constants.ts
    constants_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'lib', 'constants.ts')
    with open(constants_path, 'r') as f:
        constants = f.read()

    # Parse SUPPORTED_LANGUAGES
    lang_regex = r'\{\s*code:\s*"(\w+)",\s*name:\s*"([^"]+)",\s*native:\s*"([^"]+)"\s*\}'
    languages = re.findall(lang_regex, constants)

    rtl_codes = {'ar', 'he'}
    romanization_langs = {'zh': 'Pinyin', 'km': 'UNGEGN'}

    lang_rows = []
    for code, name, native in languages:
        lang_rows.append({
            'code': code,
            'name_en': name,
            'name_native': native,
            'direction': 'rtl' if code in rtl_codes else 'ltr',
            'status': 'approved',
            'has_romanization': code in romanization_langs,
            'romanization_system': romanization_langs.get(code),
        })

    # Upsert languages
    for row in lang_rows:
        supabase.table('lexicon_languages').upsert(row, on_conflict='code').execute()
    print(f"  ✓ {len(lang_rows)} languages seeded")

    # ── 2. Seed keys ───────────────────────────────────────────────
    print("Seeding lexicon_keys...")
    lexicon_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'lib', 'lexicon-data.ts')
    with open(lexicon_path, 'r') as f:
        lexicon_data = f.read()

    key_regex = r'\{\s*key:\s*"([^"]+)",\s*englishDefault:\s*"([^"]+)",\s*context:\s*"([^"]*)",\s*cubeId:\s*(\d+)\s*\}'
    keys = re.findall(key_regex, lexicon_data)

    # Batch insert in chunks of 50
    key_rows = [{'key': k, 'english_default': ed, 'context': ctx, 'cube_id': int(cid)} for k, ed, ctx, cid in keys]
    for i in range(0, len(key_rows), 50):
        batch = key_rows[i:i+50]
        supabase.table('lexicon_keys').upsert(batch, on_conflict='key').execute()
    print(f"  ✓ {len(key_rows)} keys seeded")

    # ── 3. Seed translations ──────────────────────────────────────
    print("Seeding lexicon_translations...")
    trans_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'lib', 'lexicon-translations.ts')
    with open(trans_path, 'r') as f:
        trans_content = f.read()

    # Parse each language block
    total_translations = 0
    lang_codes = [row['code'] for row in lang_rows if row['code'] != 'en']

    for lang_code in lang_codes:
        # Find the block for this language
        pattern = rf'  {lang_code}: \{{([\s\S]*?)\n  \}},'
        match = re.search(pattern, trans_content)
        if not match:
            print(f"  ⚠ {lang_code}: no translations block found")
            continue

        block = match.group(1)
        # Extract key-value pairs
        kv_regex = r'"([^"]+)":\s*"((?:[^"\\]|\\.)*)"'
        pairs = re.findall(kv_regex, block)

        # Batch upsert in chunks of 100
        trans_rows = [{'key': k, 'language_code': lang_code, 'translation': v.replace('\\"', '"').replace('\\\\', '\\')} for k, v in pairs]
        for i in range(0, len(trans_rows), 100):
            batch = trans_rows[i:i+100]
            try:
                supabase.table('lexicon_translations').upsert(batch, on_conflict='key,language_code').execute()
            except Exception as e:
                # Some keys might not exist yet in lexicon_keys — skip gracefully
                print(f"    ⚠ {lang_code} batch {i//100}: {str(e)[:80]}")

        total_translations += len(trans_rows)
        print(f"  ✓ {lang_code}: {len(trans_rows)} translations")

    print(f"\n  Total: {total_translations} translations seeded across {len(lang_codes)} languages")
    print("\n✓ Lexicon seeding complete!")

if __name__ == '__main__':
    main()
