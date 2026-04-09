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
  simulationRole: "moderator" | "poller";
  simulationSessionId: string | null;
  currentSong: 0 | 1 | 2;
  playing: boolean;
}

/**
 * Cube 10 Access Levels (unlocked via icon sequences after Easter Egg):
 *
 * ADMIN:      H.I. → A.I. → S.I. (violet → cyan → sunset) + code 94561230
 * CHALLENGER: S.I. → A.I. → H.I. (sunset → cyan → violet) + code 366999
 *
 * Both require Easter Egg SIM mode to be active first.
 */
type Cube10Access = "none" | "admin_pending" | "admin" | "challenger_pending" | "challenger";

interface SimulationContextValue extends SimulationState {
  enterSimulationMode: (role?: "moderator" | "poller", sessionId?: string) => void;
  exitSimulationMode: () => void;
  setSong: (song: 0 | 1 | 2) => void;
  togglePlaying: () => void;
  stop: () => void;
  easterEggUnlocked: boolean;
  registerThemeClick: (themeId: string) => boolean;
  /** Cube 10 special access */
  cube10Access: Cube10Access;
  /** Register icon click for Cube 10 admin/challenger sequences */
  registerCube10Click: (iconId: "hi" | "ai" | "si") => "admin_pending" | "challenger_pending" | null;
  /** Verify access code for admin or challenger (server-side validation) */
  verifyCube10Code: (code: string) => Promise<boolean>;
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

// Cube 10 access sequences (inside SIM mode)
const ADMIN_SEQUENCE = ["hi", "ai", "si"];      // H.I. → A.I. → S.I.
const CHALLENGER_SEQUENCE = ["si", "ai", "hi"];  // S.I. → A.I. → H.I.
// Access codes verified server-side via POST /api/v1/verify-access
// Frontend NEVER stores or compares codes — only sends to backend
const VERIFY_ACCESS_ENDPOINT = "/api/v1/verify-access";

export function EasterEggProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SimulationState>({
    simulationMode: false,
    simulationRole: "poller",
    simulationSessionId: null,
    currentSong: 0,
    playing: false,
  });
  const [easterEggUnlocked, setEasterEggUnlocked] = useState(false);
  const [cube10Access, setCube10Access] = useState<Cube10Access>("none");

  // Track the Easter egg click sequence progress
  const sequenceIndexRef = useRef(0);
  const lastClickTimeRef = useRef(0);

  const enterSimulationMode = useCallback((role: "moderator" | "poller" = "poller", sessionId?: string) => {
    if (!easterEggUnlocked) return; // Guard: must unlock first
    setState({ simulationMode: true, simulationRole: role, simulationSessionId: sessionId ?? null, currentSong: 0, playing: true });
  }, [easterEggUnlocked]);

  const exitSimulationMode = useCallback(() => {
    setState({ simulationMode: false, simulationRole: "poller", simulationSessionId: null, currentSong: 0, playing: false });
    // Reset Easter egg — must re-enter sequence to unlock again
    setEasterEggUnlocked(false);
    sequenceIndexRef.current = 0;
  }, []);

  const stop = useCallback(() => {
    setState({ simulationMode: false, simulationRole: "poller", simulationSessionId: null, currentSong: 0, playing: false });
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

  // ── Cube 10: Admin / Challenger icon sequence detection ──
  const cube10SeqRef = useRef<string[]>([]);
  const cube10LastClickRef = useRef(0);

  const registerCube10Click = useCallback((iconId: "hi" | "ai" | "si"): "admin_pending" | "challenger_pending" | null => {
    if (!state.simulationMode) return null; // Must be in SIM mode

    const now = Date.now();
    if (now - cube10LastClickRef.current > SEQUENCE_TIMEOUT_MS) {
      cube10SeqRef.current = []; // Reset on timeout
    }
    cube10LastClickRef.current = now;
    cube10SeqRef.current.push(iconId);

    const seq = cube10SeqRef.current;

    // Check Admin: H.I. → A.I. → S.I.
    if (seq.length === 3) {
      if (seq[0] === "hi" && seq[1] === "ai" && seq[2] === "si") {
        cube10SeqRef.current = [];
        setCube10Access("admin_pending");
        return "admin_pending";
      }
      if (seq[0] === "si" && seq[1] === "ai" && seq[2] === "hi") {
        cube10SeqRef.current = [];
        setCube10Access("challenger_pending");
        return "challenger_pending";
      }
      // Wrong sequence — reset
      cube10SeqRef.current = [];
    }

    return null;
  }, [state.simulationMode]);

  const verifyCube10Code = useCallback(async (code: string): Promise<boolean> => {
    const accessType = cube10Access === "admin_pending" ? "admin" : "challenger";
    try {
      const resp = await fetch(VERIFY_ACCESS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, access_type: accessType }),
      });
      if (resp.ok) {
        setCube10Access(accessType as Cube10Access);
        return true;
      }
    } catch {
      // Network error — fall through to reset
    }
    setCube10Access("none");
    return false;
  }, [cube10Access]);

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
        cube10Access,
        registerCube10Click,
        verifyCube10Code,
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
