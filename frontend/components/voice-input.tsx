"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
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

type RecordingState = "idle" | "requesting" | "recording" | "processing";

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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { t } = useLexicon();

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

        // Pass transcript to parent for display in textarea
        if (onTranscript && result.transcript_text) {
          onTranscript(result.transcript_text);
        }

        // Notify parent of tokens earned for animation
        if (onTokensEarned) {
          onTokensEarned(
            result.heart_tokens_earned,
            result.unity_tokens_earned,
          );
        }

        // Notify parent of full submission result (for broadcast to moderator dashboard)
        if (onSubmitted) {
          onSubmitted(result as VoiceSubmissionResult);
        }

        toast({
          title: t("cube3.voice.captured"),
          description: `${result.transcript_text.slice(0, 60)}${result.transcript_text.length > 60 ? "..." : ""}`,
        });
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
      } finally {
        setState("idle");
      }
    },
    [sessionId, questionId, participantId, languageCode, onTranscript, onTokensEarned, onSubmitted, t],
  );

  const startRecording = useCallback(async () => {
    setState("requesting");
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
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });

        // Send to backend for STT processing
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
    } else if (state === "idle") {
      startRecording();
    }
  };

  return (
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
          {/* Pulsing red dot */}
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
        </>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
