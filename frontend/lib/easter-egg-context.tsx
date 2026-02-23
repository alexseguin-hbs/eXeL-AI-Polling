"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface SimulationState {
  simulationMode: boolean;
  currentSong: 0 | 1 | 2;
  playing: boolean;
}

interface SimulationContextValue extends SimulationState {
  enterSimulationMode: () => void;
  exitSimulationMode: () => void;
  setSong: (song: 0 | 1 | 2) => void;
  togglePlaying: () => void;
  stop: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function EasterEggProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimulationState>({
    simulationMode: false,
    currentSong: 0,
    playing: false,
  });

  const enterSimulationMode = useCallback(() => {
    setState({ simulationMode: true, currentSong: 0, playing: true });
  }, []);

  const exitSimulationMode = useCallback(() => {
    setState({ simulationMode: false, currentSong: 0, playing: false });
  }, []);

  const stop = useCallback(() => {
    setState({ simulationMode: false, currentSong: 0, playing: false });
  }, []);

  const setSong = useCallback((song: 0 | 1 | 2) => {
    setState((s) => ({ ...s, currentSong: song }));
  }, []);

  const togglePlaying = useCallback(() => {
    setState((s) => ({ ...s, playing: !s.playing }));
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        ...state,
        enterSimulationMode,
        exitSimulationMode,
        setSong,
        togglePlaying,
        stop,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useEasterEgg() {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error("useEasterEgg must be used within an EasterEggProvider");
  }
  return ctx;
}
