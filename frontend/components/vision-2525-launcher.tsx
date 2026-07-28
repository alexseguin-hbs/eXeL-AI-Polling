"use client";

/**
 * VISION 2525 Launcher — the Easter-egg cube-grid gateway.
 * Thin wrapper over the shared <CubeLauncher>. SIM / SECURITY / ATLANTIS / CODEX /
 * ARCHITECT unlocked; MANTA / DRONE locked. ARCHITECT-2525 → /main/Architect-2525.
 * ATLANTIS-2525 (7-level sealed
 * message generator) → /Atlantis-Accords; CODEX-2525 (Light Codex image keyfiles)
 * → /light-codex. See cube-launcher.tsx for the shared UI.
 */
import { useRouter } from "next/navigation";
import { useEasterEgg } from "@/lib/easter-egg-context";
import { CubeLauncher, type CubeDomain } from "@/components/cube-launcher";

export function Vision2525Launcher() {
  const { setVisionView, exitSimulationMode } = useEasterEgg();
  const router = useRouter();

  const domains: CubeDomain[] = [
    // E2: the old "SIMULATION" (music) card is removed — the 3-Seed music is now ALWAYS-ON
    // and persists over every easter-egg sub-menu (E1). The only simulation is CUBE SIM.
    // E5: CUBE SIM keeps easter-egg mode active (no exitSimulationMode) so the 3 seeds +
    // music persist on /sim too; the /sim page renders under the persistent seed layer.
    { id: "visionhub", code: "VISION-2525", name: "VISION HUB", tagline: "Manifesto · Framework · Worlds", color: "#e8b64c", unlocked: true, onEnter: () => { exitSimulationMode(); router.push("/vision-2525"); } },
    { id: "cubesim", code: "SIM-CUBE-2525", name: "CUBE SIM", tagline: "Cubes 1–9 · Dev-Sim", color: "#22d3ee", unlocked: true, onEnter: () => { router.push("/sim"); } },
    { id: "security", code: "SECURITY-2525", name: "SECURITY", tagline: "Air & Missile Defense C2", color: "#ff4444", unlocked: true, onEnter: () => setVisionView("security") },
    { id: "atlantis", code: "ATLANTIS-2525", name: "ENCODED MESSAGING", tagline: "Compose · Encode · Send", color: "#eab308", unlocked: true, onEnter: () => { exitSimulationMode(); router.push("/encrypted-messaging"); } },
    { id: "codex", code: "CODEX-2525", name: "LIGHT CODEX", tagline: "Encode · Image · Key", color: "#e879f9", unlocked: true, onEnter: () => { exitSimulationMode(); router.push("/light-codex"); } },
    { id: "architect", code: "ARCHITECT-2525", name: "ARCHITECT", tagline: "Design · Build · Model", color: "#c084fc", unlocked: true, onEnter: () => { exitSimulationMode(); router.push("/main/Architect-2525"); } },
    { id: "celestial", code: "CELESTIAL-2525", name: "CELESTIAL", tagline: "Sky · Learn · Family", color: "#a78bfa", unlocked: true, onEnter: () => { exitSimulationMode(); router.push("/main/Celestial-2525"); } },
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
