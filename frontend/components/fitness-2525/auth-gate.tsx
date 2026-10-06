"use client";

/**
 * FITNESS-2525 · Auth0 gate: personal plans, workouts, profile, nutrition, and anthropometrics
 * require Sign in with Auth0 (OAuth). EXAMPLE / read-only demo stays available when labeled.
 */
import type { ReactNode } from "react";
import { C } from "./ux-helpers";

export function AuthGate({
  onSignIn, isLoading, message, compact,
}: {
  onSignIn: () => void;
  isLoading?: boolean;
  message: string;
  compact?: boolean;
}) {
  return (
    <div
      data-fit-auth-gate
      className={compact ? "rounded border p-2 text-center" : "rounded border p-3 text-center"}
      style={{ borderColor: C.border, background: "#0b1119" }}
    >
      <p className={compact ? "mb-1.5 text-[10px]" : "mb-2 text-[11px]"} style={{ color: C.text }}>
        {message}
      </p>
      <button
        type="button"
        disabled={!!isLoading}
        onClick={onSignIn}
        data-fit-auth-signin
        style={{
          border: `1px solid ${C.cyan}`,
          background: C.cyan,
          color: "#041016",
          borderRadius: 4,
          padding: compact ? "6px 12px" : "8px 14px",
          fontSize: 11,
          fontWeight: 700,
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        SIGN IN WITH AUTH0
      </button>
    </div>
  );
}

/** When signed out, replace children with the Auth0 gate. */
export function RequireAuth({
  signedIn, onSignIn, isLoading, message, children,
}: {
  signedIn: boolean;
  onSignIn: () => void;
  isLoading?: boolean;
  message: string;
  children: ReactNode;
}) {
  if (signedIn) return <>{children}</>;
  return <AuthGate onSignIn={onSignIn} isLoading={isLoading} message={message} />;
}
