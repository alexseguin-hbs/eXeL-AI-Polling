"use client";

/**
 * Fitness-2525 · Connections card (Strava + Garmin Connect).
 * Matches Security-2525 Mission Planning palette used by command-ux1.
 * Requires Auth0 sign-in; tokens never touch localStorage.
 */
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link2, Link2Off, RefreshCw, Unplug } from "lucide-react";
import {
  beginConnect, disconnectProvider, fetchProviderStatus, formatSyncTime, syncProvider,
  type ProviderId, type ProviderStatus,
} from "@/lib/fitness-2525/integrations";

const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400",
};

const GARMIN_PENDING_MSG = "Garmin pending developer approval — connect Garmin to Strava meanwhile";
const GARMIN_APPLY = "https://developerportal.garmin.com/developer-programs/connect-developer-api";
const STRAVA_LINK_HINT = "https://www.strava.com/settings/apps";

export interface ConnectionsCardProps {
  isAuthenticated: boolean;
  isLoading?: boolean;
  onSignIn: () => void;
  /** Return Auth0 ID/access token for Worker Authorization header. */
  getToken: () => Promise<string | null | undefined>;
  /** Optional: bump parent cloud sync after Strava import. */
  onSynced?: () => void;
}

function statusLabel(s: ProviderStatus): { text: string; color: string } {
  if (s.pending && !s.connected) return { text: "Pending approval", color: C.amber };
  if (s.connected && s.name) return { text: `Connected as ${s.name}`, color: C.green };
  if (s.connected) return { text: "Connected", color: C.green };
  return { text: "Not connected", color: C.dim };
}

function ProviderRow({
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
          <button type="button" style={btnGhost} disabled title="Awaiting Garmin developer approval">
            <Link2Off className="mr-1 inline h-3 w-3" /> Connect Garmin
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

export function ConnectionsCard({ isAuthenticated, isLoading, onSignIn, getToken, onSynced }: ConnectionsCardProps) {
  const [strava, setStrava] = useState<ProviderStatus>({
    configured: false, connected: false, name: null, last_sync: null,
  });
  const [garmin, setGarmin] = useState<ProviderStatus>({
    configured: false, connected: false, pending: true, name: null, last_sync: null,
    message: GARMIN_PENDING_MSG, apply_url: GARMIN_APPLY,
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    const [s, g] = await Promise.all([
      fetchProviderStatus("strava", getToken),
      fetchProviderStatus("garmin", getToken),
    ]);
    setStrava(s);
    setGarmin(g);
  }, [getToken, isAuthenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Surface OAuth callback query flags once.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const u = new URL(window.location.href);
    const s = u.searchParams.get("strava");
    const g = u.searchParams.get("garmin");
    if (s === "connected") setMsg("Strava connected.");
    else if (s === "denied") setMsg("Strava authorization denied.");
    else if (s && s !== "connected") setMsg(`Strava: ${s}`);
    if (g === "connected") setMsg("Garmin connected.");
    else if (g === "denied") setMsg("Garmin authorization denied.");
    else if (g && g !== "connected") setMsg(`Garmin: ${g}`);
    if (s || g) {
      u.searchParams.delete("strava");
      u.searchParams.delete("garmin");
      // keep tab=CONNECTIONS
      window.history.replaceState({}, "", u.pathname + u.search + u.hash);
      void refresh();
    }
  }, [refresh]);

  const connect = async (provider: ProviderId) => {
    setBusy(provider);
    setMsg(null);
    try {
      const out = await beginConnect(provider, getToken);
      if (out.pending) {
        setMsg(out.message || GARMIN_PENDING_MSG);
        if (provider === "garmin") {
          setGarmin((prev) => ({ ...prev, pending: true, message: out.message || GARMIN_PENDING_MSG, apply_url: out.apply_url || GARMIN_APPLY }));
        }
        return;
      }
      if (out.error) { setMsg(out.error); return; }
      if (out.url) { window.location.href = out.url; return; }
      setMsg("No authorize URL");
    } catch (e) {
      setMsg(String((e as Error)?.message || e));
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (provider: ProviderId) => {
    setBusy(`${provider}-disconnect`);
    setMsg(null);
    try {
      const out = await disconnectProvider(provider, getToken);
      if (!out.ok) setMsg(out.error || "Disconnect failed");
      else setMsg(`${provider === "strava" ? "Strava" : "Garmin"} disconnected.`);
      await refresh();
    } catch (e) {
      setMsg(String((e as Error)?.message || e));
    } finally {
      setBusy(null);
    }
  };

  const sync = async (provider: ProviderId) => {
    setBusy(`${provider}-sync`);
    setMsg(null);
    try {
      const out = await syncProvider(provider, getToken);
      if (!out.ok) setMsg(out.error || out.message || "Sync failed");
      else {
        setMsg(
          provider === "strava"
            ? `Synced ${out.imported ?? 0} Strava activities.`
            : out.message || "Garmin push acknowledged.",
        );
        onSynced?.();
      }
      await refresh();
    } catch (e) {
      setMsg(String((e as Error)?.message || e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="rounded-lg border p-3"
      style={{ background: C.panel, borderColor: C.border }}
      data-fit-connections
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.cyan }}>
          Connections · Strava / Garmin
        </div>
        <button
          type="button"
          className="rounded border px-1.5 py-0.5 text-[8px] font-semibold"
          style={{ borderColor: C.border, color: C.dim }}
          onClick={() => void refresh()}
          disabled={!isAuthenticated || !!busy}
        >
          Refresh
        </button>
      </div>

      {!isAuthenticated ? (
        <div className="rounded border p-3 text-center" style={{ borderColor: C.border, background: "#0b1119" }}>
          <p className="mb-2 text-[11px]" style={{ color: C.text }}>
            Sign in with Auth0 to connect your own Strava or Garmin account.
          </p>
          <button
            type="button"
            disabled={isLoading}
            onClick={onSignIn}
            style={{
              border: `1px solid ${C.cyan}`, background: C.cyan, color: "#041016",
              borderRadius: 4, padding: "8px 14px", fontSize: 11, fontWeight: 700,
            }}
          >
            SIGN IN TO CONNECT
          </button>
        </div>
      ) : (
        <>
          <ProviderRow
            id="strava"
            label="Strava"
            status={strava}
            busy={busy}
            disabled={!!busy}
            onConnect={() => void connect("strava")}
            onDisconnect={() => void disconnect("strava")}
            onSync={() => void sync("strava")}
          />
          <ProviderRow
            id="garmin"
            label="Garmin Connect"
            status={garmin}
            busy={busy}
            disabled={!!busy}
            onConnect={() => void connect("garmin")}
            onDisconnect={() => void disconnect("garmin")}
            onSync={() => void sync("garmin")}
          />
        </>
      )}

      {msg && (
        <p className="mt-1 text-[10px]" style={{ color: msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("denied") ? C.red : C.cyan }}>
          {msg}
        </p>
      )}
      <p className="mt-2 text-[8px]" style={{ color: C.dim }}>
        OAuth tokens are stored server-side per Auth0 user — never in localStorage. Prefer linking Garmin→Strava while Garmin API approval is pending.
      </p>
    </div>
  );
}

export default ConnectionsCard;
