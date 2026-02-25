"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { useTheme } from "@/lib/theme-context";
import { Play, Pause, X, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";
import { useLexicon } from "@/lib/lexicon-context";
import { useAudioEngine } from "@/lib/use-audio-engine";

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

const TRACK_URLS = SONG_PAIRINGS.map((s) => s.audio);

/**
 * SimulationOverlay — transparent overlay on top of the current screen.
 * The underlying page remains fully visible and interactive.
 * Logos float at corners, Web Audio engine for gapless crossfade playback.
 */
function SimulationOverlay() {
  const { exitSimulationMode } = useEasterEgg();
  const { t } = useLexicon();

  const {
    state: {
      ready,
      loadProgress,
      currentTrack,
      isPlaying,
      volume,
      audioIntensity,
      error: audioError,
    },
    initialize,
    play,
    pause,
    switchTrack,
    setVolume,
    dispose,
  } = useAudioEngine(TRACK_URLS);

  // Initialize engine on mount, auto-play when ready
  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (ready && !isPlaying) {
      play();
    }
    // Only trigger on ready becoming true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Dispose on exit
  const handleExit = useCallback(() => {
    dispose();
    exitSimulationMode();
  }, [dispose, exitSimulationMode]);

  const handleToggle = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  const current = SONG_PAIRINGS[currentTrack];
  const activeColor = current.color;

  // Shared logo button renderer — Seed of Life SVG with fixed trinity color per intelligence
  const renderLogo = (index: number) => {
    const pairing = SONG_PAIRINGS[index];
    const logoColor = pairing.color;
    const isActive = currentTrack === index;
    return (
      <div className="flex flex-col items-center gap-0.5">
        <button
          onClick={() => switchTrack(index)}
          className="h-14 w-14 rounded-full border-2 flex items-center justify-center transition-all"
          style={{
            borderColor: isActive ? logoColor : `${logoColor}60`,
            boxShadow: isActive
              ? `0 0 ${20 + audioIntensity * 25}px ${logoColor}40`
              : "none",
            background: isActive ? `${logoColor}15` : "hsl(183, 30%, 9% / 0.8)",
          }}
        >
          <SeedOfLifeLogo
            size={44}
            accentColor={logoColor}
            className={isActive ? "flower-pulse" : ""}
            audioIntensity={isActive && isPlaying ? audioIntensity : 0}
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

  // Loading state — circular progress ring
  if (!ready && !audioError) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-auto">
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-20 w-20">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="hsl(183, 30%, 20%)"
                strokeWidth="6"
              />
              {/* Progress ring */}
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={TRINITY_COLORS.AI}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - loadProgress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.3s" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-primary/80">
              {loadProgress}%
            </span>
          </div>
          <span className="text-[10px] font-mono text-primary/60">
            {t("shared.sim.loading")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Top center: "SIMULATION MODE" label + eXeL H.I. logo ── */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-1 pointer-events-auto">
        <span className="text-[10px] font-mono text-primary/80 uppercase tracking-[0.25em]">
          {t("shared.sim.simulation_mode")}
        </span>
        {renderLogo(0)}
        {/* Exit X */}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 mt-0.5"
          onClick={handleExit}
          title={t("shared.sim.exit")}
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

      {/* ── Play / Pause + volume + song name at bottom center ── */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] flex flex-col items-center gap-1.5 pointer-events-auto">
        <button
          onClick={handleToggle}
          className="h-12 w-12 rounded-full border-2 bg-background/90 flex items-center justify-center hover:opacity-80 transition-all backdrop-blur"
          style={{ borderColor: activeColor }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" style={{ color: activeColor }} />
          ) : (
            <Play className="h-5 w-5 ml-0.5" style={{ color: activeColor }} />
          )}
        </button>

        {/* Volume slider */}
        <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur rounded-full px-2.5 py-1">
          <VolumeX
            className="h-3 w-3 shrink-0 cursor-pointer"
            style={{ color: volume === 0 ? activeColor : "hsl(183, 10%, 40%)" }}
            onClick={() => setVolume(0)}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="h-1 w-16 appearance-none rounded-full outline-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${activeColor} ${volume * 100}%, hsl(183, 10%, 20%) ${volume * 100}%)`,
              accentColor: activeColor,
            }}
            title={t("shared.sim.volume")}
          />
          <Volume2
            className="h-3 w-3 shrink-0 cursor-pointer"
            style={{ color: volume > 0 ? activeColor : "hsl(183, 10%, 40%)" }}
            onClick={() => setVolume(1)}
          />
        </div>

        {/* Song name + error state */}
        <div className="flex items-center gap-1.5 bg-background/80 backdrop-blur rounded-full px-3 py-1">
          {audioError ? (
            <>
              <AlertCircle className="h-3 w-3 text-red-400" />
              <span className="text-[10px] font-mono text-red-400">
                {t("shared.sim.audio_unavailable")}
              </span>
            </>
          ) : isPlaying ? (
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
  const router = useRouter();
  const pathname = usePathname();

  const handleEnterSimulation = useCallback(() => {
    enterSimulationMode();
    // Navigate to session page so the user sees the poll UI + timer
    if (pathname !== "/session") {
      router.push("/session");
    }
  }, [enterSimulationMode, router, pathname]);

  if (simulationMode) {
    return <SimulationOverlay />;
  }

  // Badge color follows the active theme (defaults to AI Cyan when not authenticated)
  const badgeColor = currentTheme.swatch;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={easterEggUnlocked ? handleEnterSimulation : undefined}
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
