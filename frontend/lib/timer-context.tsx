"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

interface TokenState {
  hearts: number;     // ♡
  unity: number;      // ◬ (5x hearts)
  human: number;      // 웃 (#.###)
}

interface TimerContextValue {
  /** Elapsed seconds since timer started */
  elapsed: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Start the session timer */
  start: () => void;
  /** Stop the session timer */
  stop: () => void;
  /** Reset timer and tokens */
  reset: () => void;
  /** Reset elapsed to 0, keep accumulated tokens, and restart */
  restart: () => void;
  /** Current token accumulation */
  tokens: TokenState;
  /** Trigger a token earn animation (returns the new totals) */
  earnTokens: (hearts: number) => TokenState;
  /** Last earn event timestamp (for animation triggers) */
  lastEarnAt: number;
}

const TimerContext = createContext<TimerContextValue | null>(null);

// Default hourly rate for 웃 calculation (Austin TX $7.25/hr)
const DEFAULT_RATE_PER_HOUR = 7.25;

export function TimerProvider({ children }: { children: ReactNode }) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [tokens, setTokens] = useState<TokenState>({ hearts: 1, unity: 5, human: 0 });
  const [lastEarnAt, setLastEarnAt] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Tick every second when running — tracks elapsed time only.
  // Tokens are NOT auto-awarded per minute; they are earned via earnTokens()
  // which is called when the user submits a response via the button.
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const stop = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsed(0);
    setTokens({ hearts: 1, unity: 5, human: 0 }); // 1 ♡ on login
    setLastEarnAt(0);
  }, []);

  // Reset elapsed to 0 but keep accumulated tokens and restart
  const restart = useCallback(() => {
    setElapsed(0);
    setIsRunning(true);
  }, []);

  const earnTokens = useCallback((hearts: number): TokenState => {
    let result: TokenState = { hearts: 0, unity: 0, human: 0 };
    setTokens((prev) => {
      const newHearts = prev.hearts + hearts;
      result = {
        hearts: newHearts,
        unity: newHearts * 5,
        human: 0,
      };
      return result;
    });
    setLastEarnAt(Date.now());
    return result;
  }, []);

  return (
    <TimerContext.Provider
      value={{ elapsed, isRunning, start, stop, reset, restart, tokens, earnTokens, lastEarnAt }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) {
    throw new Error("useTimer must be used within a TimerProvider");
  }
  return ctx;
}
