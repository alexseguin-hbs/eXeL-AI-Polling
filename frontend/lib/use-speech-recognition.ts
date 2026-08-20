"use client";

/**
 * use-speech-recognition — a local-first, browser-native voice-to-text hook.
 *
 * The ◬ ♡ 웃 Session records an outcome by video link, written words, or voice
 * (operator: "allow voice to text"). The polling tool's own V2T (components/
 * voice-input.tsx) records audio and sends it to the Cube 3 STT backend; the pod,
 * however, is deliberately local-first (it degrades to a single-phone prototype
 * when Supabase / the backend is unreachable), so a backend round-trip would break
 * its offline design.
 *
 * This hook uses the Web Speech API (SpeechRecognition / webkitSpeechRecognition),
 * which transcribes ON DEVICE in the browser — no backend, works in the same
 * degraded mode the pod already supports. It streams interim results live and
 * commits final segments, appending them to whatever text the field already holds
 * so a speaker can dictate the outcome in one pass.
 *
 * Where the backend IS reachable, the polling tool's VoiceInput remains the richer
 * path (provider metadata, confidence, cost, Cube 6 33-word tier). This is the
 * pod's graceful-degrade sibling, not a replacement for it.
 *
 * Supported in Chrome/Edge/Safari; `supported` is false elsewhere, so the caller
 * shows the plain textarea instead. Nothing here touches the SACRED live-delivery
 * files — it is an additive, self-contained client utility.
 */

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the vendor-prefixed Web Speech API (not in lib.dom for all TS targets).
type SpeechRecognitionResultLike = {
  0: { transcript: string };
  isFinal: boolean;
  length: number;
};
type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: { length: number;[i: number]: SpeechRecognitionResultLike };
};
type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseSpeechRecognitionOptions {
  /** BCP-47 language tag for recognition (e.g. "en-US"). Defaults to the page language or "en-US". */
  lang?: string;
  /** Called with the full text (existing base + committed finals) each time a segment finalizes. */
  onCommit?: (fullText: string) => void;
  /** The text already in the field, so dictation appends rather than replaces. */
  baseText?: string;
}

export interface UseSpeechRecognition {
  supported: boolean;
  listening: boolean;
  /** The live interim (not-yet-final) transcript, for a faint preview under the field. */
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
}

export function useSpeechRecognition(opts: UseSpeechRecognitionOptions = {}): UseSpeechRecognition {
  const { lang, onCommit, baseText = "" } = opts;
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  // Keep the latest base text + callback in refs so the recognition handlers, bound
  // once, always see current values without re-creating the recognition object.
  const baseRef = useRef(baseText);
  const commitRef = useRef(onCommit);
  const committedRef = useRef("");   // finals accumulated during this listening run
  useEffect(() => { baseRef.current = baseText; }, [baseText]);
  useEffect(() => { commitRef.current = onCommit; }, [onCommit]);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (rec) { try { rec.stop(); } catch { /* already stopped */ } }
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) { setError("Voice-to-text is not supported in this browser."); return; }
    // Restart cleanly if already running.
    if (recRef.current) { try { recRef.current.abort(); } catch { /* noop */ } }

    const rec = new Ctor();
    rec.lang = lang
      || (typeof document !== "undefined" && document.documentElement.lang) || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    committedRef.current = "";
    setError(null);

    const joinBase = () => {
      const base = baseRef.current.trim();
      const add = committedRef.current.trim();
      return base && add ? `${base} ${add}` : base || add;
    };

    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0]?.transcript || "";
        if (r.isFinal) {
          committedRef.current = (committedRef.current + " " + text).trim();
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
      if (committedRef.current) commitRef.current?.(joinBase());
    };
    rec.onerror = (ev) => {
      const err = ev?.error || "unknown";
      // "no-speech" / "aborted" are benign stop conditions, not real failures.
      if (err !== "no-speech" && err !== "aborted") {
        setError(err === "not-allowed"
          ? "Microphone access was denied — allow the mic to dictate."
          : `Voice-to-text error: ${err}`);
      }
      setListening(false);
      setInterim("");
    };
    rec.onend = () => { setListening(false); setInterim(""); };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setError("Could not start voice-to-text.");
      setListening(false);
    }
  }, [lang]);

  // Clean up on unmount.
  useEffect(() => () => {
    const rec = recRef.current;
    if (rec) { try { rec.abort(); } catch { /* noop */ } }
  }, []);

  return { supported, listening, interim, error, start, stop };
}
