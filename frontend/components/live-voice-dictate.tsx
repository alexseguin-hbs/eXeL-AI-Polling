"use client";

/**
 * CRS-15.09 — Live voice-to-text for Moderator and Participants.
 *
 * Prefer browser Web Speech API (free, on-device). When unsupported or it fails,
 * fall back to MediaRecorder → POST /sessions/{id}/voice/transcribe (Whisper/Gemini/AWS
 * via API Worker; keys stay server-side). Transcript is written into the caller's
 * editable field — never auto-submitted.
 *
 * Browser path is unverifiable in headless CI; server path is covered by API tests.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useLexicon } from "@/lib/lexicon-context";
import { api, ApiClientError } from "@/lib/api";
import { useSpeechRecognition } from "@/lib/use-speech-recognition";
import {
  pickVoiceMime,
  containerFromMime,
  voiceErrorKind,
  VOICE_PROCESS_TIMEOUT_MS,
  VOICE_PERMISSION_TIMEOUT_MS,
} from "@/lib/voice-mime";

export type LiveVoiceRole = "participant" | "moderator";

export interface LiveVoiceDictateProps {
  /** Session for server STT fallback. When omitted, browser-only (create-poll form). */
  sessionId?: string | null;
  participantId?: string | null;
  languageCode?: string;
  role?: LiveVoiceRole;
  /** Current field text so dictation appends. */
  value: string;
  /** Receives the full updated text (base + new words). */
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  /** Compact icon button (default) vs labeled. */
  size?: "icon" | "sm";
}

type Mode = "idle" | "browser" | "recording" | "processing" | "unsupported" | "denied";

export function LiveVoiceDictate({
  sessionId,
  participantId,
  languageCode = "en",
  role = "participant",
  value,
  onChange,
  disabled,
  className,
  size = "icon",
}: LiveVoiceDictateProps) {
  const { t } = useLexicon();
  const [mode, setMode] = useState<Mode>("idle");
  const [interimPreview, setInterimPreview] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const bcp47 = languageCode.includes("-")
    ? languageCode
    : ({ en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-BR", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR", ar: "ar-SA", hi: "hi-IN" } as Record<string, string>)[languageCode.toLowerCase()]
      || `${languageCode}-${languageCode.toUpperCase()}`;

  const speech = useSpeechRecognition({
    lang: bcp47,
    baseText: value,
    onCommit: (full) => {
      onChange(full);
      setInterimPreview("");
    },
  });

  // Map hook errors → lexicon + mode
  useEffect(() => {
    if (!speech.error) return;
    if (/denied|not-allowed/i.test(speech.error)) {
      setMode("denied");
      toast({
        title: t("cube3.voice.access_denied"),
        description: t("cube3.voice.allow_mic"),
        variant: "destructive",
      });
    }
  }, [speech.error, t]);

  const stopBrowser = useCallback(() => {
    speech.stop();
    setMode("idle");
    setInterimPreview("");
  }, [speech]);

  const stopServerRecording = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch { /* noop */ }
    }
  }, []);

  const processServerAudio = useCallback(async (blob: Blob, container: string) => {
    if (!sessionId) {
      toast({
        title: t("cube3.voice.not_supported"),
        description: t("cube3.voice.browser_only_hint"),
        variant: "destructive",
      });
      setMode("idle");
      return;
    }
    setMode("processing");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VOICE_PROCESS_TIMEOUT_MS);
    try {
      const result = await api.transcribeVoice(sessionId, blob, {
        languageCode,
        audioFormat: container,
        participantId: participantId || undefined,
        role,
        signal: controller.signal,
      });
      const add = (result.transcript_text || "").trim();
      if (!add) {
        toast({
          title: t("cube3.voice.no_speech"),
          variant: "destructive",
        });
        setMode("idle");
        return;
      }
      const base = valueRef.current.trim();
      onChange(base && add ? `${base} ${add}` : base || add);
      const conf = result.transcript_confidence ?? 1;
      toast({
        title: t("cube3.voice.captured"),
        description: conf < 0.65
          ? `${Math.round(conf * 100)}% ${t("cube3.voice.confidence_label")} · ${t("cube3.voice.edit_before_submit")}`
          : t("cube3.voice.edit_before_submit"),
        variant: conf < 0.65 ? "destructive" : "default",
      });
      setMode("idle");
    } catch (err) {
      const kind = voiceErrorKind(err);
      const detail = err instanceof ApiClientError ? err.detail : undefined;
      toast({
        title: t("cube3.voice.processing_audio"),
        description:
          detail
          || (kind === "timeout" ? t("cube3.voice.timeout")
            : kind === "network" ? t("cube3.voice.network_error")
              : kind === "permission" ? t("cube3.voice.allow_mic")
                : t("cube3.voice.stt_fallback_failed")),
        variant: "destructive",
      });
      setMode("error" as Mode);
      setTimeout(() => setMode("idle"), 800);
    } finally {
      clearTimeout(timer);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
  }, [sessionId, languageCode, participantId, role, onChange, t]);

  const startServerFallback = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMode("unsupported");
      toast({
        title: t("cube3.voice.not_supported"),
        description: t("cube3.voice.allow_mic"),
        variant: "destructive",
      });
      return;
    }
    setMode("recording");
    try {
      const permissionDeadline = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(Object.assign(new Error("Microphone permission timed out"), { name: "TimeoutError" })),
          VOICE_PERMISSION_TIMEOUT_MS,
        );
      });
      const stream = await Promise.race([
        navigator.mediaDevices.getUserMedia({ audio: true }),
        permissionDeadline,
      ]);
      streamRef.current = stream;
      const { mimeType, container } = pickVoiceMime();
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      const chosenMime = mediaRecorder.mimeType || mimeType || `audio/${container}`;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: chosenMime });
        const fmt = containerFromMime(blob.type || chosenMime);
        void processServerAudio(blob, fmt);
      };
      mediaRecorder.start(250);
    } catch (err) {
      const kind = voiceErrorKind(err);
      setMode(kind === "permission" ? "denied" : "unsupported");
      toast({
        title: t("cube3.voice.access_denied"),
        description: kind === "permission" ? t("cube3.voice.allow_mic") : t("cube3.voice.not_supported"),
        variant: "destructive",
      });
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
  }, [processServerAudio, t]);

  const toggle = useCallback(() => {
    if (disabled) return;
    if (mode === "browser") {
      stopBrowser();
      return;
    }
    if (mode === "recording") {
      stopServerRecording();
      return;
    }
    if (mode === "processing") return;

    // Prefer browser Web Speech when available
    if (speech.supported) {
      setMode("browser");
      speech.start();
      return;
    }
    // Server fallback when a session exists; otherwise unsupported
    if (sessionId) {
      void startServerFallback();
      return;
    }
    setMode("unsupported");
    toast({
      title: t("cube3.voice.not_supported"),
      description: t("cube3.voice.browser_only_hint"),
      variant: "destructive",
    });
  }, [disabled, mode, speech, sessionId, startServerFallback, stopBrowser, stopServerRecording, t]);

  // Live interim from browser hook
  useEffect(() => {
    if (mode === "browser") setInterimPreview(speech.interim || "");
  }, [speech.interim, mode]);

  // If browser listening ends unexpectedly, return to idle
  useEffect(() => {
    if (mode === "browser" && !speech.listening && !speech.interim) {
      setMode("idle");
    }
  }, [mode, speech.listening, speech.interim]);

  const listening = mode === "browser" || mode === "recording";
  const busy = mode === "processing";
  const title =
    mode === "unsupported" ? t("cube3.voice.not_supported")
      : mode === "denied" ? t("cube3.voice.mic_denied")
        : listening ? t("cube3.voice.stop")
          : busy ? t("cube3.voice.processing_audio")
            : t("cube3.voice.dictate");

  return (
    <div className={className} data-live-voice-dictate={role} data-voice-mode={mode}>
      <Button
        type="button"
        variant={listening ? "destructive" : "outline"}
        size={size === "icon" ? "icon" : "sm"}
        onClick={toggle}
        disabled={disabled || busy}
        title={title}
        aria-label={title}
        aria-pressed={listening}
        data-voice-listening={listening ? "1" : "0"}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : listening ? (
          <MicOff className="h-4 w-4" />
        ) : mode === "unsupported" || mode === "denied" ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
        {size !== "icon" && <span className="ml-1 text-xs">{title}</span>}
      </Button>
      {interimPreview ? (
        <p className="text-[11px] text-muted-foreground mt-1 italic" data-voice-interim>
          {interimPreview}
        </p>
      ) : null}
    </div>
  );
}
