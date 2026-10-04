> Moved from `PLAN.md` in revision 0.12, unchanged. Part B — DETECT is future hardware, after Part C in build order.

# Appendix — Part B — DETECT (future hardware, after Part C in build order)

> Operator, verbatim (2026.10.03):
> "eventually i will generate hardware that can be added to HDMI or video data transfer cable that can add object detection to video
> stream, when this happens we will use light codex to transmit object, box locations, and % object
>
> on receiving end we will decrypt light codex locally so Object detection is almost magical to end user (with black box on cable
> (DETECT) and black box or equivalent at or bear display terminal (using drone-2525) 6 digit personal encryption scramble as needed for
> coding  / decoding)."

Methods only; future work. Nothing here changes R1–R10.

## The picture in one line
**DETECT** (a box on the cable) runs the model on each frame and writes a Light Codex band into it. The **display box** (or Drone-2525)
reads the band, unlocks it with the person's 6-digit code and draws the boxes. Without the code: an ordinary picture and a thin band.

## Why this can work where JPEG failed
- Light Codex broke through JPEG on 2026-10-02 (3 of 16 captions wrong yet verified, `2026-10-02_sensor_fusion_cnn_answer.md`, T14).
- HDMI and DisplayPort carry pixels without loss. Scaling, colour conversion or compression in between (overscan, a capture card's H.264,
  a video call, a stream) breaks the band. So DETECT and the display box are the two ends of the uncompressed link.
- A band that does not verify draws **nothing** and says "not verified", never a guessed box. A verified band with zero objects says "no detections".

## Methods to build (when the hardware exists)
1. **One payload format** — `lib/light-codex-detect.ts` (pure): `encodeDetections(record, key)` → a line; `decodeDetections(line, key)` →
   the record or null. The record is Part C's **Detection record v1** (~22 characters per object); the header carries format version, model
   id + labelmap hash, frame number, capture ms and object count. After encryption the bytes are digits or base-32; `unsupportedChars()`
   (`lib/light-codex.ts`) refuses anything else.
2. **Band:** the bottom rows, `placeSignature(..., blockSize 2)`; at 1920 px, 10 objects + header + tag fit in two lines (~6 px). The display
   box crops it before showing the picture; the model never sees it; never on training data (R10).
3. **Timing:** each band carries the frame number it describes; the display draws it on that frame or holds it up to the loop's max age
   from `loop-spec.json`, then clears it. The delay shows only in `?diag=1`.
4. **The 6-digit code is a pairing code, never the key.** Six digits are 1,000,000 choices, tried offline in seconds. The code authorizes a
   one-time ECDH P-256 → HKDF → AES-GCM-256 pairing, as Drone-2525 does (`frontend/public/drone-2525/play.html:3225-3239`, anchor `deriveKey`). The code comes from
   `generateSealCode` (`frontend/lib/atlantis-package.ts:141`). Each frame: a nonce (frame number + a random per-pairing salt, never reused
   after a reboot) and a tag, so a changed or replayed band is refused. Wrong code or tampered band: no boxes, "This screen is not paired".
5. **Display on Drone-2525:** strokes, the 13-colour palette, the amber/red rule unchanged. A detection never marks, approves or fires anything.
6. **Fallback:** HDMI InfoFrames (invisible, need chip support at both ends), with the payload of method 1 unchanged.

## Tests (when built)
1. Decode(encode(record)) returns the record (box within 1 unit; same capture ms and confidence).
2. JPEG, a 0.5 px scale or one changed block reads **not verified**, never a wrong box.
3. A wrong code, or a band recorded in another session, gives no boxes.
4. 10 objects fit in two lines at 1920 px, block size 2; more are counted as dropped.
5. A band older than the loop's max age is never drawn.
6. The picture shown and the model input have no band pixels.
7. A detection on Drone-2525 changes no slot, approval or fire state.
8. Two pairings never share a salt or a nonce.

## Decisions for DETECT
Items 10–13 of the one list. **Protected content (HDCP):** a box that rewrites the picture cannot carry copy-protected video, so DETECT is
for unprotected sources (cameras, drones, computers) unless licensed.
