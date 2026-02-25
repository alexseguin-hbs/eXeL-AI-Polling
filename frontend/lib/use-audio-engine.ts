"use client";

import { useRef, useState, useCallback, useEffect } from "react";

// ─── Types ──────────────────────────────────────────────────────

interface TrackState {
  buffer: AudioBuffer | null;
  source: AudioBufferSourceNode | null;
  gain: GainNode | null;
  /** Playback offset in seconds (for resume) */
  offset: number;
  /** Wall-clock time when playback last started */
  startedAt: number;
}

export interface AudioEngineState {
  /** Whether the engine has loaded all buffers and is ready */
  ready: boolean;
  /** 0–100 loading progress */
  loadProgress: number;
  /** Index of the currently active track */
  currentTrack: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current master volume 0.0–1.0 */
  volume: number;
  /** Audio intensity from analyser, 0.0–1.0 */
  audioIntensity: number;
  /** Error message if initialization failed */
  error: string | null;
}

export interface AudioEngineControls {
  initialize: () => Promise<void>;
  play: () => void;
  pause: () => void;
  switchTrack: (index: number) => void;
  setVolume: (v: number) => void;
  dispose: () => void;
}

const VOLUME_STORAGE_KEY = "exel-simulation-volume";
const DEFAULT_VOLUME = 0.7;
const FADE_IN_DURATION = 0.1;
const FADE_OUT_DURATION = 0.1;
const CROSSFADE_DURATION = 1.5;
const FFT_SIZE = 256;
const VIS_FPS_TARGET = 30;
const VIS_FRAME_INTERVAL = 1000 / VIS_FPS_TARGET;

// Weighted energy bands: bass 50%, mid 30%, treble 20%
const BASS_WEIGHT = 0.5;
const MID_WEIGHT = 0.3;
const TREBLE_WEIGHT = 0.2;

function getStoredVolume(): number {
  if (typeof window === "undefined") return DEFAULT_VOLUME;
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored !== null) {
      const v = parseFloat(stored);
      if (!isNaN(v) && v >= 0 && v <= 1) return v;
    }
  } catch {
    // localStorage unavailable
  }
  return DEFAULT_VOLUME;
}

function storeVolume(v: number) {
  try {
    localStorage.setItem(VOLUME_STORAGE_KEY, v.toFixed(2));
  } catch {
    // localStorage unavailable
  }
}

// Safari compat
function getAudioContext(): AudioContext | null {
  const Ctx =
    typeof AudioContext !== "undefined"
      ? AudioContext
      : typeof (window as any).webkitAudioContext !== "undefined"
        ? (window as any).webkitAudioContext
        : null;
  if (!Ctx) return null;
  return new Ctx();
}

// Safari-compatible decodeAudioData
function decodeAudio(
  ctx: AudioContext,
  arrayBuffer: ArrayBuffer,
): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    // Try promise form first, fall back to callback form
    const result = ctx.decodeAudioData(
      arrayBuffer,
      (decoded) => resolve(decoded),
      (err) => reject(err),
    );
    // Some browsers return a promise
    if (result && typeof (result as any).then === "function") {
      (result as Promise<AudioBuffer>).then(resolve).catch(() => {
        // callback form already handled
      });
    }
  });
}

// ─── Hook ───────────────────────────────────────────────────────

export function useAudioEngine(trackUrls: string[]) {
  const [state, setState] = useState<AudioEngineState>({
    ready: false,
    loadProgress: 0,
    currentTrack: 0,
    isPlaying: false,
    volume: getStoredVolume(),
    audioIntensity: 0,
    error: null,
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const tracksRef = useRef<TrackState[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastVisTimeRef = useRef<number>(0);
  const disposedRef = useRef(false);
  const currentTrackRef = useRef(0);
  const isPlayingRef = useRef(false);

  // ── Initialize ──────────────────────────────────────────────

  const initialize = useCallback(async () => {
    if (ctxRef.current) return; // already initialized
    disposedRef.current = false;

    const ctx = getAudioContext();
    if (!ctx) {
      setState((s) => ({ ...s, error: "Web Audio API not supported" }));
      return;
    }

    // Resume if suspended (autoplay policy)
    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    ctxRef.current = ctx;

    // Build audio graph: master gain → analyser → destination
    const masterGain = ctx.createGain();
    const stored = getStoredVolume();
    masterGain.gain.value = stored;
    masterGainRef.current = masterGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;
    analyserRef.current = analyser;

    masterGain.connect(analyser);
    analyser.connect(ctx.destination);

    // Fetch + decode all tracks concurrently
    const trackCount = trackUrls.length;
    let loaded = 0;

    const tracks: TrackState[] = [];

    const fetchPromises = trackUrls.map(async (url, i) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await decodeAudio(ctx, arrayBuffer);

        const gain = ctx.createGain();
        gain.gain.value = 0; // all start silent
        gain.connect(masterGain);

        tracks[i] = {
          buffer,
          source: null,
          gain,
          offset: 0,
          startedAt: 0,
        };
      } catch (err) {
        tracks[i] = {
          buffer: null,
          source: null,
          gain: null,
          offset: 0,
          startedAt: 0,
        };
      }

      loaded++;
      if (!disposedRef.current) {
        setState((s) => ({
          ...s,
          loadProgress: Math.round((loaded / trackCount) * 100),
        }));
      }
    });

    await Promise.all(fetchPromises);

    if (disposedRef.current) return;

    tracksRef.current = tracks;

    // Check that at least the first track loaded
    const anyFailed = tracks.some((t) => !t.buffer);
    if (anyFailed) {
      const failedIndices = tracks
        .map((t, i) => (!t.buffer ? i : -1))
        .filter((i) => i >= 0);
      // Still mark ready if at least one track works
      const allFailed = tracks.every((t) => !t.buffer);
      if (allFailed) {
        setState((s) => ({
          ...s,
          error: "Failed to load audio files",
          loadProgress: 100,
        }));
        return;
      }
    }

    setState((s) => ({
      ...s,
      ready: true,
      loadProgress: 100,
      volume: stored,
    }));

    // Start visualization loop
    startVisualization();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackUrls]);

  // ── Visualization loop ──────────────────────────────────────

  const startVisualization = useCallback(() => {
    const loop = (time: number) => {
      if (disposedRef.current) return;

      // Throttle to ~30fps
      if (time - lastVisTimeRef.current < VIS_FRAME_INTERVAL) {
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }
      lastVisTimeRef.current = time;

      const analyser = analyserRef.current;
      if (!analyser || !isPlayingRef.current) {
        setState((s) => (s.audioIntensity === 0 ? s : { ...s, audioIntensity: 0 }));
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(freqData);

      const binCount = freqData.length; // FFT_SIZE / 2 = 128
      const bassEnd = Math.floor(binCount * 0.2);
      const midEnd = Math.floor(binCount * 0.6);

      let bassSum = 0;
      let midSum = 0;
      let trebleSum = 0;

      for (let i = 0; i < binCount; i++) {
        if (i < bassEnd) bassSum += freqData[i];
        else if (i < midEnd) midSum += freqData[i];
        else trebleSum += freqData[i];
      }

      const bassAvg = bassEnd > 0 ? bassSum / bassEnd / 255 : 0;
      const midAvg = midEnd - bassEnd > 0 ? midSum / (midEnd - bassEnd) / 255 : 0;
      const trebleAvg =
        binCount - midEnd > 0 ? trebleSum / (binCount - midEnd) / 255 : 0;

      const intensity = Math.min(
        1,
        bassAvg * BASS_WEIGHT + midAvg * MID_WEIGHT + trebleAvg * TREBLE_WEIGHT,
      );

      setState((s) => {
        const rounded = Math.round(intensity * 100) / 100;
        return s.audioIntensity === rounded ? s : { ...s, audioIntensity: rounded };
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, []);

  // ── Create + start a BufferSourceNode for a track ───────────

  const startSource = useCallback((trackIndex: number, fadeIn: number) => {
    const ctx = ctxRef.current;
    const track = tracksRef.current[trackIndex];
    if (!ctx || !track?.buffer || !track.gain) return;

    // Stop existing source if any
    if (track.source) {
      try {
        track.source.stop();
      } catch {
        // already stopped
      }
      track.source.disconnect();
    }

    const source = ctx.createBufferSource();
    source.buffer = track.buffer;
    source.loop = true;
    source.connect(track.gain);

    // Fade in
    track.gain.gain.setValueAtTime(0, ctx.currentTime);
    track.gain.gain.linearRampToValueAtTime(1, ctx.currentTime + fadeIn);

    source.start(0, track.offset % track.buffer.duration);
    track.source = source;
    track.startedAt = ctx.currentTime;
  }, []);

  // ── Stop a source with fade-out ──────────────────────────────

  const stopSource = useCallback((trackIndex: number, fadeOut: number) => {
    const ctx = ctxRef.current;
    const track = tracksRef.current[trackIndex];
    if (!ctx || !track?.source || !track.gain) return;

    // Save resume offset
    const elapsed = ctx.currentTime - track.startedAt;
    track.offset = (track.offset + elapsed) % (track.buffer?.duration || 1);

    // Fade out
    track.gain.gain.setValueAtTime(track.gain.gain.value, ctx.currentTime);
    track.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + fadeOut);

    // Schedule stop after fade
    const src = track.source;
    setTimeout(() => {
      try {
        src.stop();
      } catch {
        // already stopped
      }
      src.disconnect();
    }, fadeOut * 1000 + 50);

    track.source = null;
  }, []);

  // ── Play ────────────────────────────────────────────────────

  const play = useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Resume context if suspended (autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const idx = currentTrackRef.current;
    startSource(idx, FADE_IN_DURATION);
    isPlayingRef.current = true;
    setState((s) => ({ ...s, isPlaying: true }));
  }, [startSource]);

  // ── Pause ───────────────────────────────────────────────────

  const pause = useCallback(() => {
    const idx = currentTrackRef.current;
    stopSource(idx, FADE_OUT_DURATION);
    isPlayingRef.current = false;
    setState((s) => ({ ...s, isPlaying: false }));
  }, [stopSource]);

  // ── Switch Track (crossfade) ────────────────────────────────

  const switchTrack = useCallback(
    (index: number) => {
      const ctx = ctxRef.current;
      if (!ctx || index === currentTrackRef.current) return;

      const oldIdx = currentTrackRef.current;
      currentTrackRef.current = index;

      if (isPlayingRef.current) {
        // Crossfade: fade out old, fade in new
        const oldTrack = tracksRef.current[oldIdx];
        if (oldTrack?.source && oldTrack.gain) {
          // Save offset
          const elapsed = ctx.currentTime - oldTrack.startedAt;
          oldTrack.offset =
            (oldTrack.offset + elapsed) % (oldTrack.buffer?.duration || 1);

          // Ramp down
          oldTrack.gain.gain.setValueAtTime(
            oldTrack.gain.gain.value,
            ctx.currentTime,
          );
          oldTrack.gain.gain.exponentialRampToValueAtTime(
            0.001,
            ctx.currentTime + CROSSFADE_DURATION,
          );

          const src = oldTrack.source;
          setTimeout(() => {
            try {
              src.stop();
            } catch {
              // already stopped
            }
            src.disconnect();
          }, CROSSFADE_DURATION * 1000 + 50);
          oldTrack.source = null;
        }

        // Start new track with crossfade ramp
        const newTrack = tracksRef.current[index];
        if (newTrack?.buffer && newTrack.gain) {
          const source = ctx.createBufferSource();
          source.buffer = newTrack.buffer;
          source.loop = true;
          source.connect(newTrack.gain);

          newTrack.gain.gain.setValueAtTime(0.001, ctx.currentTime);
          newTrack.gain.gain.exponentialRampToValueAtTime(
            1,
            ctx.currentTime + CROSSFADE_DURATION,
          );

          source.start(0, newTrack.offset % newTrack.buffer.duration);
          newTrack.source = source;
          newTrack.startedAt = ctx.currentTime;
        }
      }

      setState((s) => ({ ...s, currentTrack: index }));
    },
    [],
  );

  // ── Set Volume ──────────────────────────────────────────────

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    const master = masterGainRef.current;
    const ctx = ctxRef.current;
    if (master && ctx) {
      master.gain.setValueAtTime(clamped, ctx.currentTime);
    }
    storeVolume(clamped);
    setState((s) => ({ ...s, volume: clamped }));
  }, []);

  // ── Dispose ─────────────────────────────────────────────────

  const dispose = useCallback(() => {
    disposedRef.current = true;
    isPlayingRef.current = false;

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }

    // Stop all sources
    for (const track of tracksRef.current) {
      if (track.source) {
        try {
          track.source.stop();
        } catch {
          // already stopped
        }
        track.source.disconnect();
        track.source = null;
      }
      if (track.gain) {
        track.gain.disconnect();
      }
      // Reset offsets for fresh start
      track.offset = 0;
      track.startedAt = 0;
    }
    tracksRef.current = [];

    if (masterGainRef.current) {
      masterGainRef.current.disconnect();
      masterGainRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }

    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }

    currentTrackRef.current = 0;

    setState({
      ready: false,
      loadProgress: 0,
      currentTrack: 0,
      isPlaying: false,
      volume: getStoredVolume(),
      audioIntensity: 0,
      error: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    state,
    initialize,
    play,
    pause,
    switchTrack,
    setVolume,
    dispose,
  };
}
