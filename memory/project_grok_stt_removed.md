---
name: Grok STT removed from Voice-to-Text
description: Grok (xAI) removed from Cube 3 STT factory — 403 permission denied on audio API. Still available for Cube 6 AI theming.
type: project
originSessionId: d359f04d-a822-4eff-986a-f830612ae051
---
Grok (xAI) STT provider removed from Cube 3 Voice factory on 2026-04-09.
- **Reason:** xAI API returns 403 "Team is not authorized to perform this action" on audio transcription
- **Impact:** STT factory serves: Whisper (OpenAI), Gemini (Google), AWS Transcribe. No Grok.
- **Cube 6:** Grok STILL works for AI theming (embeddings + summarization). Only STT removed.
- **Tests:** 2 Grok STT tests marked xfail (not failures)
- **Settings:** User requested Grok removed from frontend STT dropdown too
