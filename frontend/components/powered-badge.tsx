"use client";

import { useEasterEgg } from "@/lib/easter-egg-context";
import { Play, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";

function SimulationOverlay() {
  const { currentSong, playing, setSong, togglePlaying, exitSimulationMode } =
    useEasterEgg();

  const songLabels = ["Song 1", "Song 2", "Song 3"];

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

      {/* 3 logo positions — placeholders until assets uploaded */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2">
        <button
          onClick={() => setSong(0)}
          className={`h-16 w-16 rounded-full border-2 flex items-center justify-center transition-colors ${
            currentSong === 0 ? "border-primary bg-primary/20" : "border-border bg-muted/30"
          }`}
        >
          <span className="text-xs font-mono">Logo 1</span>
        </button>
      </div>
      <div className="absolute bottom-20 left-12">
        <button
          onClick={() => setSong(1)}
          className={`h-16 w-16 rounded-full border-2 flex items-center justify-center transition-colors ${
            currentSong === 1 ? "border-primary bg-primary/20" : "border-border bg-muted/30"
          }`}
        >
          <span className="text-xs font-mono">Logo 2</span>
        </button>
      </div>
      <div className="absolute bottom-20 right-12">
        <button
          onClick={() => setSong(2)}
          className={`h-16 w-16 rounded-full border-2 flex items-center justify-center transition-colors ${
            currentSong === 2 ? "border-primary bg-primary/20" : "border-border bg-muted/30"
          }`}
        >
          <span className="text-xs font-mono">Logo 3</span>
        </button>
      </div>

      {/* Play/Pause center */}
      <button
        onClick={togglePlaying}
        className="h-20 w-20 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
      >
        {playing ? (
          <Pause className="h-8 w-8 text-primary" />
        ) : (
          <Play className="h-8 w-8 text-primary ml-1" />
        )}
      </button>

      {/* Current song label */}
      <p className="mt-4 text-sm text-muted-foreground">
        {songLabels[currentSong]}
      </p>

      {/* Simulation mode label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <span className="text-xs font-mono text-primary uppercase tracking-widest">
          Simulation Mode
        </span>
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
