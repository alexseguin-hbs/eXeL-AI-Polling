"use client";

import type { CSSProperties } from "react";
import { Link2, RefreshCw, Unplug } from "lucide-react";
import { formatSyncTime, type ProviderId, type ProviderStatus } from "@/lib/fitness-2525/integrations";

const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400",
};

export const GARMIN_PENDING_MSG = "Garmin pending developer approval — Connect Strava (real OAuth), then link Garmin→Strava";
export const GARMIN_APPLY = "https://developerportal.garmin.com/developer-programs/connect-developer-api";
const STRAVA_LINK_HINT = "https://www.strava.com/settings/apps";

function statusLabel(s: ProviderStatus): { text: string; color: string } {
  if (s.pending && !s.connected) return { text: "Pending approval", color: C.amber };
  if (s.connected && s.name) return { text: `Connected as ${s.name}`, color: C.green };
  if (s.connected) return { text: "Connected", color: C.green };
  return { text: "Not connected", color: C.dim };
}

export function ProviderRow({
  id, label, status, busy, onConnect, onDisconnect, onSync, disabled,
}: {
  id: ProviderId;
  label: string;
  status: ProviderStatus;
  busy: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
  disabled: boolean;
}) {
  const st = statusLabel(status);
  const rowBusy = busy === id || busy === `${id}-sync` || busy === `${id}-disconnect`;
  const btnGhost: CSSProperties = {
    border: `1px solid ${C.border}`, color: C.cyan, background: "transparent",
    borderRadius: 4, padding: "6px 10px", fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
  };
  const btnPrimary: CSSProperties = {
    border: `1px solid ${C.cyan}`, background: C.cyan, color: "#041016",
    borderRadius: 4, padding: "6px 12px", fontSize: 10, fontWeight: 700,
  };
  const btnDanger: CSSProperties = {
    border: `1px solid ${C.red}66`, color: C.red, background: "transparent",
    borderRadius: 4, padding: "6px 10px", fontSize: 10, fontWeight: 600,
  };

  return (
    <div
      className="mb-2 rounded-lg border p-3"
      style={{ background: "#0b1119", borderColor: C.border }}
      data-fit-provider={id}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.text }}>{label}</div>
          <div className="mt-0.5 text-[10px] font-semibold" style={{ color: st.color }} data-fit-conn-status>
            {st.text}
          </div>
          <div className="mt-1 text-[9px]" style={{ color: C.dim }}>
            Last sync: {formatSyncTime(status.last_sync)}
          </div>
        </div>
        <span
          className="shrink-0 rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide"
          style={{
            color: status.connected ? C.green : status.pending ? C.amber : C.dim,
            background: status.connected ? `${C.green}18` : status.pending ? `${C.amber}18` : `${C.dim}18`,
            border: `1px solid ${status.connected ? C.green : status.pending ? C.amber : C.border}55`,
          }}
        >
          {status.connected ? "LIVE" : status.pending ? "PENDING" : "OFF"}
        </span>
      </div>

      {status.pending && !status.connected && (
        <p className="mb-2 text-[10px]" style={{ color: C.amber }}>
          {status.message || GARMIN_PENDING_MSG}{" "}
          <a
            href={status.apply_url || GARMIN_APPLY}
            target="_blank"
            rel="noreferrer"
            className="underline"
            style={{ color: C.cyan }}
          >
            Garmin developer program
          </a>
          {" · "}
          <a href={STRAVA_LINK_HINT} target="_blank" rel="noreferrer" className="underline" style={{ color: C.cyan }}>
            Link Garmin→Strava
          </a>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {!status.connected && !status.pending && (
          <button type="button" style={btnPrimary} disabled={disabled || rowBusy} onClick={onConnect}>
            <Link2 className="mr-1 inline h-3 w-3" />
            {busy === id ? "Opening…" : `Connect ${label}`}
          </button>
        )}
        {!status.connected && status.pending && (
          <button type="button" style={btnPrimary} disabled={disabled || rowBusy} onClick={onConnect} title="Garmin API pending — opens real Strava OAuth (interim)">
            <Link2 className="mr-1 inline h-3 w-3" />
            {busy === id ? "Opening…" : "Connect via Strava"}
          </button>
        )}
        {status.connected && (
          <>
            <button type="button" style={btnGhost} disabled={disabled || rowBusy} onClick={onSync}>
              <RefreshCw className={`mr-1 inline h-3 w-3 ${busy === `${id}-sync` ? "animate-spin" : ""}`} />
              {busy === `${id}-sync` ? "Syncing…" : "Sync now"}
            </button>
            <button type="button" style={btnDanger} disabled={disabled || rowBusy} onClick={onDisconnect}>
              <Unplug className="mr-1 inline h-3 w-3" />
              Disconnect
            </button>
          </>
        )}
      </div>
    </div>
  );
}
