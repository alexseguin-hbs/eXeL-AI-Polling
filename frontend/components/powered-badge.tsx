"use client";

import { useRef, useEffect } from "react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { useTheme } from "@/lib/theme-context";
import { Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";

/**
 * Logo–Song pairings for Simulation Mode.
 * Top-center:   eXeL H.I. (웃) — "Unity in Diversity" (default)
 * Bottom-left:  eXeL A.I. (◬) — "Eternal Spark"
 * Bottom-right: eXeL S.I. (♡) — "Master of Thought"
 *
 * Files served from Next.js public/ directory.
 */
const SONG_PAIRINGS = [
  {
    symbol: "웃",
    label: "H.I.",
    songName: "Unity in Diversity",
    audio: "/audio/Unity in Diversity.mp3",
  },
  {
    symbol: "◬",
    label: "A.I.",
    songName: "Eternal Spark",
    audio: "/audio/Eternal Spark.mp3",
  },
  {
    symbol: "♡",
    label: "S.I.",
    songName: "Master of Thought",
    audio: "/audio/Master of Thought.mp3",
  },
];

/**
 * SimulationOverlay — transparent overlay on top of the current screen.
 * The underlying page remains fully visible and interactive.
 * Logos float at corners, play/pause at bottom center.
 */
function SimulationOverlay() {
  const { currentSong, playing, setSong, togglePlaying, exitSimulationMode } =
    useEasterEgg();
  const { currentTheme } = useTheme();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const accentColor = currentTheme.swatch;

  // Initialize audio element once, cleanup on unmount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.loop = true;
    audioRef.current.volume = 0.5;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
    };
  }, []);

  // Update source when song changes, play/pause when state changes
  useEffect(() => {
    if (!audioRef.current) return;
    const src = SONG_PAIRINGS[currentSong].audio;
    if (audioRef.current.src !== src) {
      audioRef.current.src = src;
      audioRef.current.load();
    }
    if (playing) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [currentSong, playing]);

  const current = SONG_PAIRINGS[currentSong];

  // Shared logo button renderer — Seed of Life SVG with theme color
  const renderLogo = (index: number) => {
    const pairing = SONG_PAIRINGS[index];
    const isActive = currentSong === index;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={() => setSong(index as 0 | 1 | 2)}
          className="h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: isActive ? accentColor : "hsl(183, 33%, 25%)",
            boxShadow: isActive ? `0 0 20px ${accentColor}40` : "none",
            background: isActive ? `${accentColor}15` : "hsl(183, 30%, 9% / 0.8)",
          }}
        >
          <SeedOfLifeLogo
            size={44}
            accentColor={accentColor}
            className={isActive ? "flower-pulse" : ""}
          />
        </button>
        <span
          className="text-[9px] font-mono"
          style={{ color: isActive ? accentColor : "hsl(183, 11%, 64%)", opacity: isActive ? 1 : 0.6 }}
        >
          {pairing.label}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* ── Top center: "SIMULATION MODE" label + eXeL H.I. logo ── */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-1 pointer-events-auto">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-[0.25em]">
          Simulation Mode
        </span>
        {renderLogo(0)}
        {/* Exit X */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mt-0.5"
          onClick={exitSimulationMode}
          title="Exit simulation"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      {/* ── Bottom-left: eXeL A.I. logo ── */}
      <div className="fixed bottom-20 left-4 z-[70] pointer-events-auto">
        {renderLogo(1)}
      </div>

      {/* ── Bottom-right: eXeL S.I. logo ── */}
      <div className="fixed bottom-20 right-4 z-[70] pointer-events-auto">
        {renderLogo(2)}
      </div>

      {/* ── Play / Pause + song name at bottom center ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          onClick={togglePlaying}
          className="h-12 w-12 rounded-full border-2 border-primary bg-background/90 flex items-center justify-center hover:bg-primary/20 transition-all backdrop-blur"
        >
          {playing ? (
            <Pause className="h-5 w-5 text-primary" />
          ) : (
            <Play className="h-5 w-5 text-primary ml-0.5" />
          )}
        </button>
        {/* Song name shown below play/pause */}
        <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur rounded-full px-3 py-1">
          {playing ? (
            <Volume2 className="h-3 w-3" style={{ color: accentColor }} />
          ) : (
            <VolumeX className="h-3 w-3 text-muted-foreground/40" />
          )}
          <span
            className="text-[10px] font-mono"
            style={{ color: accentColor }}
          >
            {current.songName}
          </span>
        </div>
      </div>
    </>
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
        className="badge-blink flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur cursor-pointer hover:bg-background/95 transition-colors"
      >
        <span className="font-medium text-primary">eXeL</span>
        <span>AI</span>
      </button>
    </div>
  );
}
