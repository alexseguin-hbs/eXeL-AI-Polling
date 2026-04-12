---
name: Typing-based time tracking (anti-cheat)
description: Timer starts when user starts typing, logs stop-typing and submit times, subtracts dead time for accurate participation metrics
type: project
originSessionId: 3f1f26a1-b8ce-43e7-bf34-2741756f294e
---
Time tracking must subtract dead time to prevent metric cheating:

1. Timer starts when user begins typing (first keystroke)
2. Log timestamp when user stops typing (debounce ~2s of no input)
3. Log timestamp when user clicks Submit
4. Active time = total typing duration (subtract idle gaps between stop-typing and resume)
5. Dead time (stop_typing → submit_click) is NOT counted as participation

Applies to: Static Mode and Live Polling Mode

**Why:** Users could inflate their participation time (♡ tokens) by opening the input and waiting without typing.

**How to apply:** Frontend session-view.tsx must track keystroke timestamps and report active_typing_ms to backend. Cube 5 time tracking should use this for ♡ token calculation instead of raw session duration.
