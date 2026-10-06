"use client";

/**
 * Fitness-2525 · Connections card (Strava + Garmin Connect).
 * Matches Security-2525 Mission Planning palette used by command-ux1.
 * Requires Auth0 sign-in; tokens never touch localStorage.
 */
import { useCallback, useEffect, useState } from "react";
import {
  beginConnect, disconnectProvider, fetchProviderStatus, syncProvider,
  type ProviderId, type ProviderStatus,
} from "@/lib/fitness-2525/integrations";
import { StravaSecretsCard } from "./strava-secrets-card";
import { ProviderRow, GARMIN_APPLY, GARMIN_PENDING_MSG } from "./provider-row";

export interface ConnectionsCardProps {
  isAuthenticated: boolean;
  isLoading?: boolean;
  onSignIn: () => void;
  getToken: () => Promise<string | null | undefined>;
  onSynced?: () => void;
}

const C = {
  bg: "#0a0e14", panel: "#111826", border: "#1e2b3a",
  text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf",
  green: "#22c55e", amber: "#f59e0b", red: "#ef4444", gold: "#ffd400",
};

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
      // Garmin interim: no fake OAuth — send the athlete to real Strava connect (or show the secret card if Strava is unset).
      if (provider === "garmin" && (!garmin.configured || garmin.pending)) {
        const out = await beginConnect("strava", getToken);
        if (out.missing?.length) {
          setStrava((prev) => ({
            ...prev, configured: false, missing: out.missing, setup: out.setup, redirect_uri: out.redirect_uri,
            message: out.error || "Strava secrets required before any device connect",
          }));
          setMsg(out.setup || `${out.error} Missing: ${(out.missing || []).join(", ")}`);
          return;
        }
        if (out.url) { window.location.href = out.url; return; }
        if (out.error) { setMsg(out.error); return; }
        setMsg(GARMIN_PENDING_MSG);
        return;
      }
      const out = await beginConnect(provider, getToken);
      if (out.pending) {
        setMsg(out.message || GARMIN_PENDING_MSG);
        if (provider === "garmin") {
          setGarmin((prev) => ({
            ...prev, pending: true, message: out.message || GARMIN_PENDING_MSG,
            apply_url: out.apply_url || GARMIN_APPLY, interim: out.interim, strava_link: out.strava_link,
          }));
        }
        return;
      }
      if (out.missing?.length) {
        setStrava((prev) => ({
          ...prev, configured: false, missing: out.missing, setup: out.setup, redirect_uri: out.redirect_uri,
          message: out.error,
        }));
        setMsg(out.setup || `${out.error} Missing: ${out.missing.join(", ")}`);
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
          {!strava.configured && (
            <StravaSecretsCard missing={strava.missing} setup={strava.setup} redirectUri={strava.redirect_uri} />
          )}
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
