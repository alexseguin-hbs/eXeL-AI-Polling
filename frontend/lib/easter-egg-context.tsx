"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface EasterEggState {
  activated: boolean;
  simulationMode: boolean;
  currentSong: 0 | 1 | 2;
  playing: boolean;
}

interface EasterEggContextValue extends EasterEggState {
  activate: () => void;
  enterSimulationMode: () => void;
  exitSimulationMode: () => void;
  setSong: (song: 0 | 1 | 2) => void;
  togglePlaying: () => void;
}

const EasterEggContext = createContext<EasterEggContextValue | null>(null);

export function EasterEggProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EasterEggState>({
    activated: false,
    simulationMode: false,
    currentSong: 0,
    playing: false,
  });

  const activate = useCallback(() => {
    setState((s) => ({ ...s, activated: true }));
  }, []);

  const enterSimulationMode = useCallback(() => {
    setState((s) => ({ ...s, simulationMode: true, playing: true }));
  }, []);

  const exitSimulationMode = useCallback(() => {
    setState((s) => ({
      ...s,
      simulationMode: false,
      activated: false,
      playing: false,
    }));
  }, []);

  const setSong = useCallback((song: 0 | 1 | 2) => {
    setState((s) => ({ ...s, currentSong: song }));
  }, []);

  const togglePlaying = useCallback(() => {
    setState((s) => ({ ...s, playing: !s.playing }));
  }, []);

  return (
    <EasterEggContext.Provider
      value={{
        ...state,
        activate,
        enterSimulationMode,
        exitSimulationMode,
        setSong,
        togglePlaying,
      }}
    >
      {children}
    </EasterEggContext.Provider>
  );
}

export function useEasterEgg() {
  const ctx = useContext(EasterEggContext);
  if (!ctx) {
    throw new Error("useEasterEgg must be used within an EasterEggProvider");
  }
  return ctx;
}
