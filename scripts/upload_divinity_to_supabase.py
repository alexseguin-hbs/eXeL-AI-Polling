"""Upload Divinity Guide pages + Dictionary to Supabase.

Reads local JSON files and upserts into Supabase tables:
  - divinity_pages: 185 pages × 10 languages = 1,850 rows
  - divinity_dictionary: 4,436 words × 7 languages = 31,052 rows

Idempotent: uses ON CONFLICT upsert — safe to re-run.

Usage:
  python scripts/upload_divinity_to_supabase.py
  python scripts/upload_divinity_to_supabase.py --pages-only
  python scripts/upload_divinity_to_supabase.py --dict-only
  python scripts/upload_divinity_to_supabase.py --dry-run

Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars (or .env file).
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

# Load .env if available
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / "backend" / ".env")
except ImportError:
    pass

# Try supabase-py, fall back to httpx
try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

FRONTEND_LIB = Path(__file__).parent.parent / "frontend" / "lib"

# Language files: code → JSON filename
DIVINITY_LANGUAGES = {
    "en": "divinity-pages.json",
    "es": "divinity-pages-es.json",
    "uk": "divinity-pages-uk.json",
    "ru": "divinity-pages-ru.json",
    "zh": "divinity-pages-zh.json",
    "fa": "divinity-pages-fa.json",
    "he": "divinity-pages-he.json",
    "pt": "divinity-pages-pt.json",
    "ne": "divinity-pages-ne.json",
    "km": "divinity-pages-km.json",
}

DICTIONARY_FILE = "divinity-dictionary.json"

BATCH_SIZE = 500  # Supabase upsert batch size


# ---------------------------------------------------------------------------
# Supabase Client (httpx fallback)
# ---------------------------------------------------------------------------


class SupabaseUploader:
    """Uploads data to Supabase via REST API."""

    def __init__(self, url: str, key: str, dry_run: bool = False):
        self.url = url.rstrip("/")
        self.key = key
        self.dry_run = dry_run
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates",  # Upsert
        }
        self.stats = {"pages_uploaded": 0, "dict_uploaded": 0, "errors": 0}

    def _post(self, table: str, rows: list[dict]) -> bool:
        """POST rows to Supabase REST API."""
        if self.dry_run:
            print(f"  [DRY RUN] Would upsert {len(rows)} rows to {table}")
            return True

        endpoint = f"{self.url}/rest/v1/{table}"

        if HAS_HTTPX:
            resp = httpx.post(endpoint, json=rows, headers=self.headers, timeout=30.0)
        else:
            import urllib.request
            req = urllib.request.Request(
                endpoint,
                data=json.dumps(rows).encode(),
                headers=self.headers,
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp_obj:
                    resp_status = resp_obj.status
                if resp_status in (200, 201):
                    return True
            except Exception as e:
                print(f"  ERROR: {e}")
                self.stats["errors"] += 1
                return False

        if HAS_HTTPX:
            if resp.status_code in (200, 201):
                return True
            else:
                print(f"  ERROR [{resp.status_code}]: {resp.text[:200]}")
                self.stats["errors"] += 1
                return False
        return True

    def upload_pages(self) -> None:
        """Upload all divinity guide pages (9 languages × 185 pages)."""
        print("\n=== DIVINITY GUIDE PAGES ===")

        for lang_code, filename in DIVINITY_LANGUAGES.items():
            filepath = FRONTEND_LIB / filename
            if not filepath.exists():
                print(f"  SKIP: {filename} not found")
                continue

            with open(filepath, "r", encoding="utf-8") as f:
                pages = json.load(f)

            print(f"  {lang_code}: {len(pages)} pages from {filename}")

            rows = []
            for page in pages:
                rows.append({
                    "page_id": page["id"],
                    "language_code": lang_code,
                    "chapter": page["chapter"],
                    "page": page["page"],
                    "text": page["text"],
                    "gated": page.get("gated", False),
                })

            # Batch upload
            for i in range(0, len(rows), BATCH_SIZE):
                batch = rows[i:i + BATCH_SIZE]
                if self._post("divinity_pages", batch):
                    self.stats["pages_uploaded"] += len(batch)

        print(f"\n  Total pages uploaded: {self.stats['pages_uploaded']}")

    def upload_dictionary(self) -> None:
        """Upload dictionary (4,436 words × 7 languages)."""
        print("\n=== DIVINITY DICTIONARY ===")

        filepath = FRONTEND_LIB / DICTIONARY_FILE
        if not filepath.exists():
            print(f"  SKIP: {DICTIONARY_FILE} not found")
            return

        with open(filepath, "r", encoding="utf-8") as f:
            dictionary = json.load(f)

        print(f"  Words: {len(dictionary)}")

        rows = []
        for english_word, translations in dictionary.items():
            for lang_code, translation in translations.items():
                rows.append({
                    "english_word": english_word,
                    "language_code": lang_code,
                    "translation": translation,
                })

        print(f"  Total rows: {len(rows)}")

        # Batch upload
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            if self._post("divinity_dictionary", batch):
                self.stats["dict_uploaded"] += len(batch)
            # Rate limit: brief pause between batches
            if not self.dry_run and i + BATCH_SIZE < len(rows):
                time.sleep(0.1)

        print(f"\n  Total dictionary rows uploaded: {self.stats['dict_uploaded']}")

    def report(self) -> None:
        """Print final summary."""
        print("\n" + "=" * 50)
        print("UPLOAD SUMMARY")
        print("=" * 50)
        print(f"  Divinity pages:      {self.stats['pages_uploaded']:,}")
        print(f"  Dictionary entries:  {self.stats['dict_uploaded']:,}")
        print(f"  Errors:              {self.stats['errors']}")
        expected_pages = 185 * len(DIVINITY_LANGUAGES)
        expected_dict = 4436 * 7
        print(f"\n  Expected pages:      {expected_pages:,} (185 × {len(DIVINITY_LANGUAGES)} languages)")
        print(f"  Expected dictionary: {expected_dict:,} (4,436 × 7 languages)")

        if self.dry_run:
            print("\n  [DRY RUN MODE — no data was uploaded]")
        elif self.stats["errors"] == 0:
            print("\n  STATUS: SUCCESS")
        else:
            print(f"\n  STATUS: PARTIAL — {self.stats['errors']} errors")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Upload Divinity Guide data to Supabase")
    parser.add_argument("--pages-only", action="store_true", help="Upload pages only")
    parser.add_argument("--dict-only", action="store_true", help="Upload dictionary only")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be uploaded")
    args = parser.parse_args()

    supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_SERVICE_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

    if not supabase_url or not supabase_key:
        print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
        print("  (or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)")
        if not args.dry_run:
            sys.exit(1)
        else:
            supabase_url = "https://example.supabase.co"
            supabase_key = "dry-run-key"

    uploader = SupabaseUploader(supabase_url, supabase_key, dry_run=args.dry_run)

    start = time.time()

    if not args.dict_only:
        uploader.upload_pages()

    if not args.pages_only:
        uploader.upload_dictionary()

    elapsed = time.time() - start
    uploader.report()
    print(f"\n  Duration: {elapsed:.1f}s")


if __name__ == "__main__":
    main()
