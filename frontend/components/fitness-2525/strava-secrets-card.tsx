"use client";

/** FITNESS-2525 · Strava Worker secrets card (no invented credentials; real OAuth only). */
import { C } from "./ux-helpers";

export function StravaSecretsCard({
  missing, setup, redirectUri,
}: {
  missing?: string[];
  setup?: string;
  redirectUri?: string;
}) {
  const miss = missing?.length ? missing : ["STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"];
  const cb = redirectUri || `${typeof window !== "undefined" ? window.location.origin : ""}/api/fitness-2525/strava/callback`;
  return (
    <div className="mb-2 rounded border p-2 text-[10px]" style={{ borderColor: C.amber, background: `${C.amber}10` }} data-fit-strava-secrets>
      <div className="font-semibold uppercase tracking-wide" style={{ color: C.amber }}>Strava secrets required (Worker)</div>
      <p className="mt-1" style={{ color: C.text }}>
        Connect Strava uses real Strava OAuth. It will not open until these Worker secrets are set
        (never invent credentials):
      </p>
      <ul className="mt-1 list-inside list-disc font-mono" style={{ color: C.cyan }}>
        {miss.map((m) => (<li key={m}>{m}</li>))}
      </ul>
      <p className="mt-1" style={{ color: C.dim }}>
        From <a href="https://www.strava.com/settings/api" target="_blank" rel="noreferrer" className="underline" style={{ color: C.cyan }}>strava.com/settings/api</a>
        . Callback URL must be exactly{" "}
        <span className="font-mono" style={{ color: C.text }}>{cb}</span>
        . Optional later: STRAVA_VERIFY_TOKEN, STRAVA_SUBSCRIPTION_ID (webhooks).
      </p>
      {setup && <p className="mt-1" style={{ color: C.dim }}>{setup}</p>}
    </div>
  );
}
