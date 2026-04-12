---
name: Commit style — no Co-Authored-By footer
description: Never add Co-Authored-By Claude footer to git commit messages
type: feedback
---

Never add the `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` line to git commits.

**Why:** User explicitly rejected this. Keep commit messages clean — just the description.

**How to apply:** Every commit, no exceptions. Strip the footer entirely.
