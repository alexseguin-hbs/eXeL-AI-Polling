"use client";

import { useEasterEgg } from "@/lib/easter-egg-context";
import { Play, Pause, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function SimulationOverlay() {
  const { currentSong, playing, setSong, togglePlaying, exitSimulationMode } =
    useEasterEgg();

  const logos = [
    { label: "◬", subtitle: "A.I.", position: "top" as const },
    { label: "♡", subtitle: "S.I.", position: "bottom-left" as const },
    { label: "웃", subtitle: "H.I.", position: "bottom-right" as const },
  ];

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
        <span className="text-sm font-semibold text-primary">Cube 10 Simulation</span>
      </div>

      {/* SoI Trinity logos — tap to switch songs */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setSong(0)}
          className={`h-16 w-16 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
            currentSong === 0
              ? "border-[#00D7E4] bg-[#00D7E4]/15 shadow-[0_0_20px_rgba(0,215,228,0.3)]"
              : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <span className="text-lg">{logos[0].label}</span>
          <span className="text-[9px] font-mono text-muted-foreground">{logos[0].subtitle}</span>
        </button>
      </div>
      <div className="absolute bottom-24 left-12">
        <button
          onClick={() => setSong(1)}
          className={`h-16 w-16 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
            currentSong === 1
              ? "border-[#D3B20F] bg-[#D3B20F]/15 shadow-[0_0_20px_rgba(211,178,15,0.3)]"
              : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <span className="text-lg">{logos[1].label}</span>
          <span className="text-[9px] font-mono text-muted-foreground">{logos[1].subtitle}</span>
        </button>
      </div>
      <div className="absolute bottom-24 right-12">
        <button
          onClick={() => setSong(2)}
          className={`h-16 w-16 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
            currentSong === 2
              ? "border-[#8D516F] bg-[#8D516F]/15 shadow-[0_0_20px_rgba(141,81,111,0.3)]"
              : "border-border bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <span className="text-lg">{logos[2].label}</span>
          <span className="text-[9px] font-mono text-muted-foreground">{logos[2].subtitle}</span>
        </button>
      </div>

      {/* Play/Pause center */}
      <button
        onClick={togglePlaying}
        className="h-20 w-20 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-all hover:shadow-[0_0_30px_rgba(0,215,228,0.2)]"
      >
        {playing ? (
          <Pause className="h-8 w-8 text-primary" />
        ) : (
          <Play className="h-8 w-8 text-primary ml-1" />
        )}
      </button>

      {/* Current song label */}
      <p className="mt-3 text-xs text-muted-foreground font-mono">
        Track {currentSong + 1} of 3
      </p>

      {/* Cube status ring */}
      <div className="mt-6 flex gap-1.5">
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
      <p className="mt-1 text-[10px] text-muted-foreground">
        Cubes 1-2 testable &middot; 3-9 scaffolded
      </p>

      {/* Simulation mode label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <span className="text-xs font-mono text-primary uppercase tracking-widest">
          Simulation Mode
        </span>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Upload assets to UX Files/ to enable audio &amp; logos
        </p>
      </div>
    </div>
  );
}

export function PoweredBadge() {
  const { activated, simulationMode, enterSimulationMode } = useEasterEgg();

  if (simulationMode) {
    return <SimulationOverlay />;
  }

  const shouldBlink = activated && !simulationMode;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => {
          if (shouldBlink) enterSimulationMode();
        }}
        className={`flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur ${
          shouldBlink ? "cursor-pointer" : "cursor-default"
        }`}
        style={
          shouldBlink
            ? { animation: "badge-blink 0.5s infinite" }
            : undefined
        }
      >
        <span className="font-medium text-primary">eXeL</span>
        <span>AI</span>
      </button>
      {shouldBlink && (
        <style jsx global>{`
          @keyframes badge-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      )}
    </div>
  );
}
