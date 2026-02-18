"use client";

import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

interface VoiceInputProps {
  onTranscript?: (text: string) => void;
  disabled?: boolean;
}

type RecordingState = "idle" | "requesting" | "recording" | "processing";

export function VoiceInput({ onTranscript, disabled }: VoiceInputProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
        stream.getTracks().forEach((t) => t.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        setState("processing");

        // Stub: In production, send audioBlob to Cube 3 STT endpoint
        // For now, show a message that STT is pending
        toast({
          title: "Voice captured",
          description: `Audio recorded (${(audioBlob.size / 1024).toFixed(1)}KB). STT integration pending (Cube 3).`,
        });

        setState("idle");
      };

      mediaRecorder.start();
      setState("recording");
    } catch {
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
      setState("idle");
    }
  }, []);

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
          ? "Stop recording"
          : state === "processing"
          ? "Processing audio..."
          : "Record voice response"
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
