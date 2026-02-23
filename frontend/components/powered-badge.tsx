"use client";

import { useRef, useEffect, useState } from "react";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { Play, Pause, X, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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

/**
 * SimulationOverlay — transparent overlay on top of the current screen.
 * The underlying page remains fully visible and interactive.
 * Logos float at corners, play/pause at bottom center.
 */
function SimulationOverlay() {
  const { currentSong, playing, setSong, togglePlaying, exitSimulationMode } =
    useEasterEgg();

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<number, boolean>>({});

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

  // Shared logo button renderer
  const renderLogo = (index: number, alt: string) => {
    const pairing = SONG_PAIRINGS[index];
    const isActive = currentSong === index;
    return (
      <button
        onClick={() => setSong(index as 0 | 1 | 2)}
        className="h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all overflow-hidden"
        style={{
          borderColor: isActive ? pairing.color : "hsl(183, 33%, 25%)",
          boxShadow: isActive ? `0 0 20px ${pairing.color}40` : "none",
          background: isActive ? `${pairing.color}15` : "hsl(183, 30%, 9% / 0.8)",
        }}
      >
        {!logoErrors[index] ? (
          <Image
            src={pairing.logo}
            alt={alt}
            width={56}
            height={56}
            className="rounded-full object-cover"
            onError={() => setLogoErrors((e) => ({ ...e, [index]: true }))}
          />
        ) : (
          <span className="text-xl">{pairing.symbol}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ── Top center: "SIMULATION MODE" label + eXeL H.I. logo ── */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-1 pointer-events-auto">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-[0.25em]">
          Simulation Mode
        </span>
        {renderLogo(0, "eXeL H.I.")}
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
        {renderLogo(1, "eXeL A.I.")}
      </div>

      {/* ── Bottom-right: eXeL S.I. logo ── */}
      <div className="fixed bottom-20 right-4 z-[70] pointer-events-auto">
        {renderLogo(2, "eXeL S.I.")}
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
            <Volume2 className="h-3 w-3" style={{ color: current.color }} />
          ) : (
            <VolumeX className="h-3 w-3 text-muted-foreground/40" />
          )}
          <span
            className="text-[10px] font-mono"
            style={{ color: current.color }}
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
        className="flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur cursor-pointer hover:bg-background/95 transition-colors"
      >
        <span className="font-medium text-primary">eXeL</span>
        <span>AI</span>
      </button>
    </div>
  );
}
