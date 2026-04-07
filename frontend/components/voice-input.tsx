"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, RotateCcw, DollarSign, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { useLexicon } from "@/lib/lexicon-context";
import { api, ApiClientError } from "@/lib/api";

interface VoiceSubmissionResult {
  id: string;
  clean_text: string;
  submitted_at: string;
  summary_33?: string;
  heart_tokens_earned: number;
  unity_tokens_earned: number;
  transcript_text: string;
  transcript_confidence?: number;
  stt_provider?: string;
  cost_usd?: number;
}

interface VoiceInputProps {
  sessionId: string;
  questionId: string;
  participantId: string;
  languageCode?: string;
  onTranscript?: (text: string) => void;
  onTokensEarned?: (hearts: number, unity: number) => void;
  onSubmitted?: (result: VoiceSubmissionResult) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "requesting" | "recording" | "processing" | "done" | "error";

export function VoiceInput({
  sessionId,
  questionId,
  participantId,
  languageCode = "en",
  onTranscript,
  onTokensEarned,
  onSubmitted,
  disabled,
}: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [lastResult, setLastResult] = useState<VoiceSubmissionResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useLexicon();

  // Recording duration timer
  useEffect(() => {
    if (state === "recording") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state]);

  const processAudio = useCallback(
    async (audioBlob: Blob) => {
      setState("processing");

      try {
        const result = await api.submitVoiceResponse(
          sessionId,
          questionId,
          participantId,
          audioBlob,
          languageCode,
          "webm",
        );

        const voiceResult = result as VoiceSubmissionResult;
        setLastResult(voiceResult);

        // Pass transcript to parent for display in textarea
        if (onTranscript && result.transcript_text) {
          onTranscript(result.transcript_text);
        }

        // Notify parent of tokens earned for animation
        if (onTokensEarned) {
          onTokensEarned(result.heart_tokens_earned, result.unity_tokens_earned);
        }

        // Notify parent of full submission result
        if (onSubmitted) {
          onSubmitted(voiceResult);
        }

        // Low confidence warning (MoT feedback)
        const confidence = voiceResult.transcript_confidence ?? 1;
        if (confidence < 0.65) {
          toast({
            title: t("cube3.voice.low_confidence"),
            description: `${Math.round(confidence * 100)}% ${t("cube3.voice.confidence_label")}`,
            variant: "destructive",
          });
        } else {
          toast({
            title: t("cube3.voice.captured"),
            description: `${result.transcript_text.slice(0, 60)}${result.transcript_text.length > 60 ? "..." : ""}`,
          });
        }

        setState("done");
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.detail
            : t("cube3.voice.stt_pending");
        toast({
          title: t("cube3.voice.processing_audio"),
          description: message,
          variant: "destructive",
        });
        setState("error");
      }
    },
    [sessionId, questionId, participantId, languageCode, onTranscript, onTokensEarned, onSubmitted, t],
  );

  const startRecording = useCallback(async () => {
    setState("requesting");
    setLastResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        processAudio(audioBlob);
      };

      mediaRecorder.start();
      setState("recording");
    } catch {
      toast({
        title: t("cube3.voice.access_denied"),
        description: t("cube3.voice.allow_mic"),
        variant: "destructive",
      });
      setState("idle");
    }
  }, [processAudio, t]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [state]);

  const handleClick = () => {
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle" || state === "done" || state === "error") {
      startRecording();
    }
  };

  const handleRetry = () => {
    setLastResult(null);
    startRecording();
  };

  // Format seconds as m:ss
  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex items-center gap-2">
      {/* Main record/stop button */}
      <Button
        variant={state === "recording" ? "destructive" : "outline"}
        size="icon"
        onClick={handleClick}
        disabled={disabled || state === "requesting" || state === "processing"}
        title={
          state === "recording"
            ? t("cube3.voice.stop")
            : state === "processing"
            ? t("cube3.voice.processing_audio")
            : t("cube3.voice.record_response")
        }
        className="relative"
      >
        {state === "requesting" || state === "processing" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : state === "recording" ? (
          <>
            <MicOff className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
          </>
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {/* Recording duration timer */}
      {state === "recording" && (
        <span className="text-xs font-mono text-red-500 animate-pulse min-w-[3ch]">
          {formatDuration(duration)}
        </span>
      )}

      {/* Retry button on error */}
      {state === "error" && (
        <Button variant="ghost" size="sm" onClick={handleRetry} title={t("cube3.voice.retry")}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          <span className="text-xs">{t("cube3.voice.retry")}</span>
        </Button>
      )}

      {/* Post-submission metadata: provider, confidence, cost */}
      {state === "done" && lastResult && (
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {lastResult.stt_provider && (
            <span className="font-mono">{lastResult.stt_provider}</span>
          )}
          {lastResult.transcript_confidence != null && (
            <span
              className={`font-mono ${
                lastResult.transcript_confidence < 0.65
                  ? "text-yellow-500"
                  : "text-green-500"
              }`}
            >
              {Math.round(lastResult.transcript_confidence * 100)}%
              {lastResult.transcript_confidence < 0.65 && (
                <AlertTriangle className="h-3 w-3 inline ml-0.5" />
              )}
            </span>
          )}
          {lastResult.cost_usd != null && lastResult.cost_usd > 0 && (
            <span className="font-mono flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {lastResult.cost_usd < 0.01
                ? `${(lastResult.cost_usd * 100).toFixed(3)}¢`
                : `$${lastResult.cost_usd.toFixed(4)}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
