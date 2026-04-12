---
name: API/SDK billing model
description: API/SDK usage charges developers via ◬ tokens per call. Follows Claude/OpenAI/Grok/Gemini API best practices.
type: project
originSessionId: d359f04d-a822-4eff-986a-f830612ae051
---
API/SDK usage is BILLABLE. Developers who use the eXeL API/SDK pay with ◬ (AI) tokens.
- **Why:** User explicitly stated "API + SDK usage must charge the user (future developers)"
- **Model:** ◬ tokens consumed per API call, tracked via UsageMeter (core/sdk.py)
- **Linked to SoI Trinity:** ◬ (AI tokens) = cost of AI compute consumed by the API call
- **Best practices source:** Claude API, OpenAI API, Grok API, Gemini API pricing models
- **Panel:** Settings → API & SDK → shows usage counter + API key management
- **How to apply:** Every API endpoint consumed via external SDK deducts ◬ tokens from developer's account
