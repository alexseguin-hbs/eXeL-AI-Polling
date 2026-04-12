---
name: API credits and testing budget
description: Track AI provider credits and testing cost discipline — avoid burning credits on tests
type: project
---

OpenAI API key named `eXeL-AI-Polling-Cube02-Summary` — for summarization testing. Key was exposed in chat on 2026-03-31; user advised to rotate immediately.

Grok/xAI: $25 credits purchased 2026-03-31 at 8:55 PM CST. Avoid using Grok for testing — preserve credits for production use.

**Why:** Limited budget. Testing should use minimal API calls (1 response, not batch). Prefer OpenAI for testing since it's the default provider.

**How to apply:** When running test calls, always use OpenAI (cheapest for gpt-4o-mini). Never batch-test against Grok or Gemini unless explicitly asked. Keep test response count to 1 unless user says otherwise.
