"use client";

import { useRef, useEffect, useState } from "react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { Play, Pause, X, Zap, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

/**
 * Logo–Song pairings for Cube 10 Simulation Mode.
 * Top:          eXeL H.I. (웃) — "Unity in Diversity" (default)
 * Bottom-left:  eXeL A.I. (◬) — "Eternal Spark"
 * Bottom-right: eXeL S.I. (♡) — "Master of Thought"
 *
 * Files served from Next.js public/ directory.
 * Actual assets uploaded to UX Files/Audio/ and UX Files/Visual/.
 */
const SONG_PAIRINGS = [
  {
    symbol: "웃",
    label: "H.I.",
    songName: "Unity in Diversity",
    audio: "/audio/Unity in Diversity.mp3",
    logo: "/visual/eXeL HI.jpg",
    color: "#8D516F",
  },
  {
    symbol: "◬",
    label: "A.I.",
    songName: "Eternal Spark",
    audio: "/audio/Eternal Spark.mp3",
    logo: "/visual/eXeL AI.jpg",
    color: "#00D7E4",
  },
  {
    symbol: "♡",
    label: "S.I.",
    songName: "Master of Thought",
    audio: "/audio/Master of Thought.mp3",
    logo: "/visual/eXeL SI.jpg",
    color: "#D3B20F",
  },
];

function SimulationOverlay() {
  const { currentSong, playing, setSong, togglePlaying, exitSimulationMode } =
    useEasterEgg();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<number, boolean>>({});

  // Create/update audio element when song changes
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    audioRef.current.src = SONG_PAIRINGS[currentSong].audio;
    audioRef.current.load();
    if (playing) {
      audioRef.current.play().catch(() => {});
    }
  }, [currentSong, playing]);

  // Play/pause when state changes
  useEffect(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [playing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  const current = SONG_PAIRINGS[currentSong];

  return (
    <div className="fixed inset-0 z-[70] bg-background/95 backdrop-blur-lg flex flex-col items-center justify-center">
      {/* Exit button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4"
        onClick={exitSimulationMode}
      >
        <X className="h-5 w-5" />
      </Button>

      {/* Title */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold text-primary">
          Cube 10 Simulation
        </span>
      </div>

      {/* ── SoI Trinity Logos ── */}

      {/* Top center: Logo 1 — eXeL H.I. (default) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setSong(0)}
          className={`h-20 w-20 rounded-full border-2 flex flex-col items-center justify-center transition-all overflow-hidden ${
            currentSong === 0
              ? `border-[${SONG_PAIRINGS[0].color}] shadow-[0_0_24px_rgba(141,81,111,0.4)]`
              : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
          style={
            currentSong === 0
              ? {
                  borderColor: SONG_PAIRINGS[0].color,
                  boxShadow: `0 0 24px ${SONG_PAIRINGS[0].color}40`,
                }
              : undefined
          }
        >
          {!logoErrors[0] ? (
            <Image
              src={SONG_PAIRINGS[0].logo}
              alt="eXeL H.I."
              width={80}
              height={80}
              className="rounded-full object-cover"
              onError={() => setLogoErrors((e) => ({ ...e, 0: true }))}
            />
          ) : (
            <>
              <span className="text-2xl">{SONG_PAIRINGS[0].symbol}</span>
              <span className="text-[9px] font-mono text-muted-foreground">
                {SONG_PAIRINGS[0].label}
              </span>
            </>
          )}
        </button>
        <p className="text-[9px] text-center text-muted-foreground mt-1 font-mono">
          {SONG_PAIRINGS[0].songName}
        </p>
      </div>

      {/* Bottom-left: Logo 2 — eXeL A.I. */}
      <div className="absolute bottom-36 left-12">
        <button
          onClick={() => setSong(1)}
          className={`h-20 w-20 rounded-full border-2 flex flex-col items-center justify-center transition-all overflow-hidden ${
            currentSong === 1 ? "" : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
          style={
            currentSong === 1
              ? {
                  borderColor: SONG_PAIRINGS[1].color,
                  boxShadow: `0 0 24px ${SONG_PAIRINGS[1].color}40`,
                }
              : undefined
          }
        >
          {!logoErrors[1] ? (
            <Image
              src={SONG_PAIRINGS[1].logo}
              alt="eXeL A.I."
              width={80}
              height={80}
              className="rounded-full object-cover"
              onError={() => setLogoErrors((e) => ({ ...e, 1: true }))}
            />
          ) : (
            <>
              <span className="text-2xl">{SONG_PAIRINGS[1].symbol}</span>
              <span className="text-[9px] font-mono text-muted-foreground">
                {SONG_PAIRINGS[1].label}
              </span>
            </>
          )}
        </button>
        <p className="text-[9px] text-center text-muted-foreground mt-1 font-mono">
          {SONG_PAIRINGS[1].songName}
        </p>
      </div>

      {/* Bottom-right: Logo 3 — eXeL S.I. */}
      <div className="absolute bottom-36 right-12">
        <button
          onClick={() => setSong(2)}
          className={`h-20 w-20 rounded-full border-2 flex flex-col items-center justify-center transition-all overflow-hidden ${
            currentSong === 2 ? "" : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
          style={
            currentSong === 2
              ? {
                  borderColor: SONG_PAIRINGS[2].color,
                  boxShadow: `0 0 24px ${SONG_PAIRINGS[2].color}40`,
                }
              : undefined
          }
        >
          {!logoErrors[2] ? (
            <Image
              src={SONG_PAIRINGS[2].logo}
              alt="eXeL S.I."
              width={80}
              height={80}
              className="rounded-full object-cover"
              onError={() => setLogoErrors((e) => ({ ...e, 2: true }))}
            />
          ) : (
            <>
              <span className="text-2xl">{SONG_PAIRINGS[2].symbol}</span>
              <span className="text-[9px] font-mono text-muted-foreground">
                {SONG_PAIRINGS[2].label}
              </span>
            </>
          )}
        </button>
        <p className="text-[9px] text-center text-muted-foreground mt-1 font-mono">
          {SONG_PAIRINGS[2].songName}
        </p>
      </div>

      {/* ── Now Playing indicator ── */}
      <div className="flex items-center gap-2 mb-2">
        {playing ? (
          <Volume2 className="h-4 w-4" style={{ color: current.color }} />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground/40" />
        )}
        <p className="text-sm font-mono" style={{ color: current.color }}>
          {current.songName}
        </p>
      </div>

      {/* Cube status ring */}
      <div className="flex gap-1.5 mb-1">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor:
                i < 2 ? "hsl(var(--primary))" : "hsl(183, 33%, 25%)",
            }}
            title={`Cube ${i + 1}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground mb-4">
        Cubes 1-2 testable &middot; 3-9 scaffolded
      </p>

      {/* ── Play / Pause at bottom center ── */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <button
          onClick={togglePlaying}
          className="h-16 w-16 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all hover:shadow-[0_0_30px_rgba(0,215,228,0.2)]"
        >
          {playing ? (
            <Pause className="h-7 w-7 text-primary" />
          ) : (
            <Play className="h-7 w-7 text-primary ml-1" />
          )}
        </button>

        <span className="text-xs font-mono text-primary uppercase tracking-widest">
          Simulation Mode
        </span>
      </div>
    </div>
  );
}

export function PoweredBadge() {
  const { simulationMode, enterSimulationMode } = useEasterEgg();

  if (simulationMode) {
    return <SimulationOverlay />;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={enterSimulationMode}
        className="flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur cursor-pointer hover:bg-background/95 transition-colors"
      >
        <span className="font-medium text-primary">eXeL</span>
        <span>AI</span>
      </button>
    </div>
  );
}
