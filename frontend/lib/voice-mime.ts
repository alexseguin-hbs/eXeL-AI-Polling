/**
 * MediaRecorder MIME / container selection for Cube 3 voice capture.
 * Prefer opus/webm, then mp4/aac (Safari), then ogg — never hard-force webm alone.
 */

export const VOICE_MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/ogg;codecs=opus",
  "audio/ogg",
] as const;

export type VoiceContainer = "webm" | "mp4" | "m4a" | "ogg" | "wav";

export function containerFromMime(mime: string): VoiceContainer {
  const m = (mime || "").toLowerCase();
  if (m.includes("mp4") || m.includes("aac") || m.includes("m4a")) return "mp4";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  return "webm";
}

/** Pick the first candidate MediaRecorder reports as supported. */
export function pickVoiceMime(
  isTypeSupported: (type: string) => boolean = (t) =>
    typeof MediaRecorder !== "undefined" && typeof MediaRecorder.isTypeSupported === "function"
      ? MediaRecorder.isTypeSupported(t)
      : false,
): { mimeType: string | null; container: VoiceContainer } {
  for (const cand of VOICE_MIME_CANDIDATES) {
    try {
      if (isTypeSupported(cand)) return { mimeType: cand, container: containerFromMime(cand) };
    } catch {
      /* ignore */
    }
  }
  return { mimeType: null, container: "webm" };
}

export const VOICE_PROCESS_TIMEOUT_MS = 45_000;
export const VOICE_PERMISSION_TIMEOUT_MS = 20_000;

export function voiceErrorKind(err: unknown): "permission" | "unsupported" | "empty" | "timeout" | "network" | "other" {
  if (!err) return "other";
  const name = typeof err === "object" && err && "name" in err ? String((err as { name?: string }).name) : "";
  const msg = err instanceof Error ? err.message : String(err);
  if (name === "NotAllowedError" || name === "PermissionDeniedError" || /permission|denied|notallowed/i.test(msg)) {
    return "permission";
  }
  if (name === "NotFoundError" || /no microphone|notfound|device/i.test(msg)) return "unsupported";
  if (name === "NotSupportedError" || /not supported|mime/i.test(msg)) return "unsupported";
  if (/empty|no audio|0 bytes/i.test(msg)) return "empty";
  if (/timeout|aborted|AbortError/i.test(msg) || name === "TimeoutError" || name === "AbortError") return "timeout";
  if (/network|failed to fetch|connection/i.test(msg)) return "network";
  return "other";
}
