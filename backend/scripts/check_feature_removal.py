#!/usr/bin/env python3
"""Feature Removal Detector — WireGuard-inspired regression guard.

Scans git diff for removed functions, endpoints, imports, and features.
Prints WARNING for each removal found. Exit code 1 if any removals detected.

Usage:
    python scripts/check_feature_removal.py              # check staged changes
    python scripts/check_feature_removal.py HEAD~1..HEAD  # check last commit
    python scripts/check_feature_removal.py main..HEAD    # check branch diff

Philosophy: Features can only be ADDED, never removed without explicit approval.
"Never remove functionality from one version to the next, only add." — MoT
"""

import re
import subprocess
import sys
from dataclasses import dataclass


@dataclass
class Removal:
    file: str
    line_num: int
    category: str
    detail: str


# Patterns that indicate a feature/function/endpoint was removed
REMOVAL_PATTERNS = [
    # Python function definitions
    (r"^-\s*(async\s+)?def\s+(\w+)", "function", lambda m: m.group(2)),
    # Python class definitions
    (r"^-\s*class\s+(\w+)", "class", lambda m: m.group(1)),
    # FastAPI route decorators
    (r'^-\s*@router\.(get|post|put|delete|patch)\("([^"]+)"', "endpoint", lambda m: f"{m.group(1).upper()} {m.group(2)}"),
    # React component exports
    (r"^-\s*export\s+(default\s+)?function\s+(\w+)", "component", lambda m: m.group(2)),
    # React hook exports
    (r"^-\s*export\s+function\s+(use\w+)", "hook", lambda m: m.group(1)),
    # TypeScript interface/type exports
    (r"^-\s*export\s+(interface|type)\s+(\w+)", "type", lambda m: f"{m.group(1)} {m.group(2)}"),
    # Broadcast event listeners
    (r'^-\s*\.on\("broadcast",\s*\{\s*event:\s*"(\w+)"', "broadcast_event", lambda m: m.group(1)),
    # Supabase channel creation
    (r"^-\s*(?:const|let)\s+\w+\s*=\s*supabase\.channel\(", "supabase_channel", lambda _: "channel subscription"),
    # Import removals (entire import lines)
    (r"^-\s*(?:import|from)\s+.+(?:import|from)\s+.*\{([^}]+)\}", "import", lambda m: m.group(1).strip()),
    # Lexicon key removals
    (r'^-\s*\{\s*key:\s*"([^"]+)"', "lexicon_key", lambda m: m.group(1)),
    # Test function removals
    (r"^-\s*def\s+(test_\w+)", "test", lambda m: m.group(1)),
    # useCallback/useMemo/useEffect removals
    (r"^-\s*const\s+(\w+)\s*=\s*use(Callback|Memo|Effect)", "react_hook_usage", lambda m: m.group(1)),
    # CSS class/Tailwind removals (UI features)
    (r"^-\s*<(\w+).*className=", "ui_element", lambda m: f"<{m.group(1)}>"),
]

# Files/patterns to IGNORE (test files, generated code, etc.)
IGNORE_PATTERNS = [
    r"\.lock$",
    r"node_modules/",
    r"__pycache__/",
    r"\.next/",
    r"\.pyc$",
]


def get_diff(diff_range: str | None = None) -> str:
    """Get git diff output."""
    if diff_range:
        cmd = ["git", "diff", diff_range, "--unified=0"]
    else:
        # Staged changes
        cmd = ["git", "diff", "--cached", "--unified=0"]
    result = subprocess.run(cmd, capture_output=True, text=True, cwd=subprocess.os.path.dirname(__file__) or ".")
    return result.stdout


def parse_diff(diff_text: str) -> list[Removal]:
    """Parse diff and find feature removals."""
    removals: list[Removal] = []
    current_file = ""
    current_line = 0

    for line in diff_text.split("\n"):
        # Track current file
        if line.startswith("--- a/") or line.startswith("+++ b/"):
            if line.startswith("+++ b/"):
                current_file = line[6:]
            continue

        # Track line numbers from hunk headers
        hunk_match = re.match(r"^@@ -(\d+)", line)
        if hunk_match:
            current_line = int(hunk_match.group(1))
            continue

        # Skip ignored files
        if any(re.search(p, current_file) for p in IGNORE_PATTERNS):
            continue

        # Only check removed lines
        if not line.startswith("-") or line.startswith("---"):
            if line.startswith("-"):
                current_line += 1
            elif not line.startswith("+"):
                current_line += 1
            continue

        # Check against removal patterns
        for pattern, category, extractor in REMOVAL_PATTERNS:
            match = re.match(pattern, line)
            if match:
                # Check if this was actually MOVED (added back in the same diff)
                detail = extractor(match)
                removals.append(Removal(
                    file=current_file,
                    line_num=current_line,
                    category=category,
                    detail=detail,
                ))
                break

        current_line += 1

    return removals


def check_for_additions(diff_text: str, removals: list[Removal]) -> list[Removal]:
    """Filter out removals that were actually moved (re-added in diff)."""
    added_lines = [line for line in diff_text.split("\n") if line.startswith("+") and not line.startswith("+++")]
    added_text = "\n".join(added_lines)

    true_removals = []
    for r in removals:
        # If the same function/class/endpoint name appears in added lines, it was moved, not removed
        if r.detail and r.detail in added_text:
            continue
        true_removals.append(r)

    return true_removals


def main():
    diff_range = sys.argv[1] if len(sys.argv) > 1 else None
    diff_text = get_diff(diff_range)

    if not diff_text.strip():
        print("No changes detected.")
        return 0

    removals = parse_diff(diff_text)
    removals = check_for_additions(diff_text, removals)

    if not removals:
        print("No feature removals detected. All clear.")
        return 0

    print("\n" + "=" * 70)
    print("WARNING: FEATURE REMOVALS DETECTED")
    print("=" * 70)
    print('"Never remove functionality from one version to the next, only add."')
    print("— Master of Thought")
    print("=" * 70 + "\n")

    # Group by file
    by_file: dict[str, list[Removal]] = {}
    for r in removals:
        by_file.setdefault(r.file, []).append(r)

    for file, file_removals in sorted(by_file.items()):
        print(f"  {file}:")
        for r in file_removals:
            print(f"    LINE {r.line_num}: [{r.category.upper()}] {r.detail}")
        print()

    print(f"Total: {len(removals)} removal(s) detected across {len(by_file)} file(s).")
    print("\nIf these removals are intentional (refactoring, moving code),")
    print("add a comment explaining WHY and get MoT approval before committing.")
    print()

    return 1


if __name__ == "__main__":
    sys.exit(main())
