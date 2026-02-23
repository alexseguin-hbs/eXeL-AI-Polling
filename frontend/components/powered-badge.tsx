"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { useTheme } from "@/lib/theme-context";
import { Play, Pause, X, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";

/**
 * Trinity colors — fixed per intelligence, independent of active theme.
 * A.I. (◬) = Cyan, S.I. (♡) = Sunset, H.I. (웃) = Violet
 */
const TRINITY_COLORS = {
  HI: "#8D516F", // 웃 Violet
  AI: "#00D7E4", // ◬ Cyan
  SI: "#D3B20F", // ♡ Sunset
} as const;

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
    color: TRINITY_COLORS.HI,
  },
  {
    symbol: "◬",
    label: "A.I.",
    songName: "Eternal Spark",
    audio: "/audio/Eternal Spark.mp3",
    color: TRINITY_COLORS.AI,
  },
  {
    symbol: "♡",
    label: "S.I.",
    songName: "Master of Thought",
    audio: "/audio/Master of Thought.mp3",
    color: TRINITY_COLORS.SI,
  },
];

/**
 * SimulationOverlay — transparent overlay on top of the current screen.
 * The underlying page remains fully visible and interactive.
 * Logos float at corners, built-in audio player at bottom center.
 */
function SimulationOverlay() {
  const { currentSong, playing, setSong, togglePlaying, exitSimulationMode } =
    useEasterEgg();

  const audioRef = useRef<HTMLAudioElement>(null);
  const [audioError, setAudioError] = useState(false);
  const currentSrcRef = useRef<number>(-1);

  // Load new source when song changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSrcRef.current !== currentSong) {
      setAudioError(false);
      audio.src = SONG_PAIRINGS[currentSong].audio;
      audio.load();
      currentSrcRef.current = currentSong;
    }
  }, [currentSong]);

  // Play/pause when state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.play().catch(() => setAudioError(true));
    } else {
      audio.pause();
    }
  }, [playing, currentSong]);

  const handleAudioError = useCallback(() => {
    setAudioError(true);
  }, []);

  const current = SONG_PAIRINGS[currentSong];
  const activeColor = current.color;

  // Shared logo button renderer — Seed of Life SVG with fixed trinity color per intelligence
  const renderLogo = (index: number) => {
    const pairing = SONG_PAIRINGS[index];
    const logoColor = pairing.color;
    const isActive = currentSong === index;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={() => setSong(index as 0 | 1 | 2)}
          className="h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: isActive ? logoColor : `${logoColor}60`,
            boxShadow: isActive ? `0 0 20px ${logoColor}40` : "none",
            background: isActive ? `${logoColor}15` : "hsl(183, 30%, 9% / 0.8)",
          }}
        >
          <SeedOfLifeLogo
            size={44}
            accentColor={logoColor}
            className={isActive ? "flower-pulse" : ""}
          />
        </button>
        <span
          className="text-[9px] font-mono"
          style={{ color: logoColor, opacity: isActive ? 1 : 0.6 }}
        >
          {pairing.label}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Built-in HTML5 audio element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onError={handleAudioError}
        style={{ display: "none" }}
      />

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
          className="h-12 w-12 rounded-full border-2 bg-background/90 flex items-center justify-center hover:opacity-80 transition-all backdrop-blur"
          style={{ borderColor: activeColor }}
          title={playing ? "Pause" : "Play"}
        >
          {playing ? (
            <Pause className="h-5 w-5" style={{ color: activeColor }} />
          ) : (
            <Play className="h-5 w-5 ml-0.5" style={{ color: activeColor }} />
          )}
        </button>
        {/* Song name + error state */}
        <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur rounded-full px-3 py-1">
          {audioError ? (
            <>
              <AlertCircle className="h-3 w-3 text-red-400" />
              <span className="text-[10px] font-mono text-red-400">
                Audio unavailable
              </span>
            </>
          ) : playing ? (
            <>
              <Volume2 className="h-3 w-3" style={{ color: activeColor }} />
              <span className="text-[10px] font-mono" style={{ color: activeColor }}>
                {current.songName}
              </span>
            </>
          ) : (
            <>
              <VolumeX className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-[10px] font-mono" style={{ color: activeColor }}>
                {current.songName}
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function PoweredBadge() {
  const { simulationMode, easterEggUnlocked, enterSimulationMode } =
    useEasterEgg();
  const { currentTheme } = useTheme();

  if (simulationMode) {
    return <SimulationOverlay />;
  }

  // Badge color follows the active theme (defaults to AI Cyan when not authenticated)
  const badgeColor = currentTheme.swatch;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={easterEggUnlocked ? enterSimulationMode : undefined}
        className={`flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs backdrop-blur transition-colors ${
          easterEggUnlocked
            ? "badge-blink cursor-pointer hover:bg-background/95"
            : "cursor-default"
        }`}
        style={{
          borderColor: easterEggUnlocked ? badgeColor : undefined,
          boxShadow: easterEggUnlocked ? `0 0 12px ${badgeColor}30` : undefined,
        }}
        title={easterEggUnlocked ? "Enter Simulation Mode" : undefined}
      >
        <SeedOfLifeLogo
          size={18}
          accentColor={badgeColor}
        />
        <span className="font-medium" style={{ color: badgeColor }}>eXeL</span>
      </button>
    </div>
  );
}
