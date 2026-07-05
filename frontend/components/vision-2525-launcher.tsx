"use client";

/**
 * VISION 2525 Launcher — the Easter-egg cube-grid gateway.
 * Thin wrapper over the shared <CubeLauncher>. SIM-2525 + SECURITY-2525 unlocked;
 * ARCHITECT / MANTA / DRONE locked. See cube-launcher.tsx for the shared UI.
 */
import { useEasterEgg } from "@/lib/easter-egg-context";
import { CubeLauncher, type CubeDomain } from "@/components/cube-launcher";

export function Vision2525Launcher() {
  const { setVisionView, exitSimulationMode } = useEasterEgg();

  const domains: CubeDomain[] = [
    { id: "sim", code: "SIM-2525", name: "SIMULATION", tagline: "Play · Train · Replay", color: "#19C8CF", unlocked: true, onEnter: () => setVisionView("sim") },
    { id: "security", code: "SECURITY-2525", name: "SECURITY", tagline: "Air & Missile Defense C2", color: "#ff4444", unlocked: true, onEnter: () => setVisionView("security") },
    { id: "architect", code: "ARCHITECT-2525", name: "ARCHITECT", tagline: "Design · Build · Model", color: "#c084fc", unlocked: false },
    { id: "manta", code: "MANTA-2525", name: "MANTA", tagline: "Maritime · Subsurface", color: "#38bdf8", unlocked: false },
    { id: "drone", code: "DRONE-2525", name: "DRONE", tagline: "Swarm · A.B..C Coordinates", color: "#f59e0b", unlocked: false },
  ];

  return (
    <CubeLauncher
      title="VISION • 2525"
      subtitle="One Civilization • One Framework • Limitless Possibilities • Humanity's Future"
      footer="◬ · ♡ · 웃  —  Where Shared Intention moves at the Speed of Thought"
      domains={domains}
      onExit={exitSimulationMode}
    />
  );
}
