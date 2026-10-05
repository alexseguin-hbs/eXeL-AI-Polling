# Claude Code notes · r.164 (2026-10-05)

**Asks (verbatim):** Addendum 19 — "Voice calibration should be a separate mode (under settings) to test key words for one's voice profile and allow
for acoustic modeling to enhance detection to a specfiic voice locally to feed model for maximizing chance of detection)." Addendum 20 — "choose top 3,
and lets have option to select in settings, once settings, we can test for our specific voice quality of detection."

## What a player meets
Settings (☰) → VOICE:
- ENGINE: BROWSER · VOSK · ON DEVICE · MY VOICE · TRAINED (remembered on this device).
- TEST MY VOICE: "SAY: TARGET" … "SAY: THREE"; a table of HEARD (green) · CONFUSED AS … (amber) · MISSED (red) and "N OF 7 HEARD".
- TRAIN MY VOICE (MY VOICE only): 8 × each word + room noise; trains in the browser; saved here only. RESET MY VOICE clears it.
- The VOICE button uses the picked engine.

## Sizes and sources
VOSK: vosk-browser 0.0.8 (jsdelivr) + the small English model (~40 MB, ccoreilly.github.io) — too big for our own host (25 MB per-file limit).
MY VOICE: tfjs 3.21.0 + speech-commands 0.5.4 (jsdelivr) + the 18-word base (~5.9 MB, storage.googleapis.com). Paths verified in the npm packages;
the Vosk model host could not be reached from the sandbox.

## Gates
QA VOICE_SETTINGS, VOICE_PHRASE_ASSEMBLER, VOICE_TEST_SCORES (scripted voice end to end); VOICE_NEGATION_HOLDS re-pointed. Real microphone, the Vosk
download and MY VOICE training need a device — first HI test.
