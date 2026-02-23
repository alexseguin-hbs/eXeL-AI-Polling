"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

interface SimulationState {
  simulationMode: boolean;
  currentSong: 0 | 1 | 2;
  playing: boolean;
}

interface SimulationContextValue extends SimulationState {
  /** Call when user enters simulation mode (only works after Easter egg unlocked) */
  enterSimulationMode: () => void;
  /** Exit simulation mode — resets Easter egg so sequence must be re-entered */
  exitSimulationMode: () => void;
  setSong: (song: 0 | 1 | 2) => void;
  togglePlaying: () => void;
  stop: () => void;
  /** Whether the Easter egg is currently unlocked (sequence completed) */
  easterEggUnlocked: boolean;
  /** Feed a theme click into the Easter egg sequence detector.
   *  Returns true if the sequence just completed (unlocked). */
  registerThemeClick: (themeId: string) => boolean;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

/**
 * Easter egg unlock sequence: A.I. → S.I. → H.I.
 * User must click the three trinity themes on the color wheel in this order:
 *   1. exel-cyan  (◬ A.I.)
 *   2. sunset     (♡ S.I.)
 *   3. violet     (웃 H.I.)
 *
 * Clicks must happen within 5 seconds of each other.
 * Any wrong click resets the sequence.
 */
const EASTER_EGG_SEQUENCE = ["exel-cyan", "sunset", "violet"];
const SEQUENCE_TIMEOUT_MS = 5000;

export function EasterEggProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimulationState>({
    simulationMode: false,
    currentSong: 0,
    playing: false,
  });
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false);

  // Track the Easter egg click sequence progress
  const sequenceIndexRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const enterSimulationMode = useCallback(() => {
    if (!easterEggUnlocked) return; // Guard: must unlock first
    setState({ simulationMode: true, currentSong: 0, playing: true });
  }, [easterEggUnlocked]);

  const exitSimulationMode = useCallback(() => {
    setState({ simulationMode: false, currentSong: 0, playing: false });
    // Reset Easter egg — must re-enter sequence to unlock again
    setEasterEggUnlocked(false);
    sequenceIndexRef.current = 0;
  }, []);

  const stop = useCallback(() => {
    setState({ simulationMode: false, currentSong: 0, playing: false });
    setEasterEggUnlocked(false);
    sequenceIndexRef.current = 0;
  }, []);

  const setSong = useCallback((song: 0 | 1 | 2) => {
    setState((s) => ({ ...s, currentSong: song }));
  }, []);

  const togglePlaying = useCallback(() => {
    setState((s) => ({ ...s, playing: !s.playing }));
  }, []);

  const registerThemeClick = useCallback((themeId: string): boolean => {
    const now = Date.now();
    const expectedTheme = EASTER_EGG_SEQUENCE[sequenceIndexRef.current];

    // Check timeout — reset if too slow
    if (
      sequenceIndexRef.current > 0 &&
      now - lastClickTimeRef.current > SEQUENCE_TIMEOUT_MS
    ) {
      sequenceIndexRef.current = 0;
    }

    // Check if this click matches the next expected theme
    if (themeId === EASTER_EGG_SEQUENCE[sequenceIndexRef.current]) {
      sequenceIndexRef.current += 1;
      lastClickTimeRef.current = now;

      // Sequence complete?
      if (sequenceIndexRef.current >= EASTER_EGG_SEQUENCE.length) {
        sequenceIndexRef.current = 0;
        setEasterEggUnlocked(true);
        return true;
      }
    } else if (themeId === EASTER_EGG_SEQUENCE[0]) {
      // Wrong theme but matches step 1 — restart from step 1
      sequenceIndexRef.current = 1;
      lastClickTimeRef.current = now;
    } else {
      // Wrong theme entirely — reset
      sequenceIndexRef.current = 0;
    }

    return false;
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
        easterEggUnlocked,
        registerThemeClick,
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
