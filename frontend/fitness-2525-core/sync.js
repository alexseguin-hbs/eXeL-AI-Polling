// Fitness-2525 worker core — activity mapping, day merge, token refresh, status (split from fitness-2525-core.js; < 12KB per module for the GitHub connector)
import { json, STRAVA_TOKEN, GARMIN_TOKEN, rpcPut, rpcGet, dayOwner } from "./base.js";
import { tokOwner, tokenPut } from "./tokens.js";

export function athleteName(athlete) {
  if (!athlete || typeof athlete !== "object") return null;
  const first = athlete.firstname || athlete.first_name || "";
  const last = athlete.lastname || athlete.last_name || "";
  const full = `${first} ${last}`.trim();
  return full || athlete.username || athlete.display_name || (athlete.id != null ? `athlete-${athlete.id}` : null);
}

export function sportFromStrava(type) {
  const t = String(type || "").toLowerCase();
  if (t.includes("ride") || t.includes("virtualride") || t.includes("bike")) return "bike";
  if (t.includes("run") || t.includes("walk") || t.includes("hike")) return "run";
  if (t.includes("swim")) return "swim";
  if (t.includes("weight") || t.includes("workout")) return "strength";
  return t || "activity";
}

export function mapStravaActivity(act) {
  const start = act.start_date_local || act.start_date || null;
  const seconds = Number(act.moving_time || act.elapsed_time || 0) || 0;
  const meters = Number(act.distance || 0) || 0;
  const kcal = act.calories != null ? Number(act.calories) : act.kilojoules != null ? Math.round(Number(act.kilojoules) / 4.184) : null;
  const avgHr = act.average_heartrate != null ? Number(act.average_heartrate) : null;
  const id = `strava-${act.id}`;
  const hh = String(Math.floor(seconds / 3600)).padStart(1, "0");
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const startLocal = start ? String(start).slice(11, 16) : undefined;
  return {
    id,
    type: sportFromStrava(act.sport_type || act.type),
    title: act.name || sportFromStrava(act.type),
    status: "completed",
    minutes: seconds ? Math.round(seconds / 60) : null,
    distance: meters ? { value: Math.round((meters / 1000) * 100) / 100, unit: "km" } : null,
    calories: Number.isFinite(kcal) ? kcal : null,
    notes: `Synced from Strava #${act.id}`,
    timing: startLocal,
    garmin: {
      start: startLocal,
      duration: `${hh}:${mm}:${ss}`,
      avg_hr: Number.isFinite(avgHr) ? avgHr : null,
      kcal: Number.isFinite(kcal) ? kcal : null,
      cal_per_min: seconds > 0 && Number.isFinite(kcal) ? Math.round((kcal / (seconds / 60)) * 100) / 100 : null,
    },
    source: "strava",
    strava_id: act.id,
    start_iso: start,
  };
}

export function dayFromIso(iso, tzHint) {
  if (!iso) {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }
  // Prefer local date portion when Strava sends start_date_local (no Z).
  if (/^\d{4}-\d{2}-\d{2}T/.test(iso) && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso)) return iso.slice(0, 10);
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return String(tzHint || new Date().toISOString().slice(0, 10)).slice(0, 10);
  }
}

export async function mergeWorkoutIntoDay(env, auth0Sub, workout) {
  const owner = await dayOwner(auth0Sub);
  const date = dayFromIso(workout.start_iso);
  const name = `fit-day-${date}`;
  const existing = (await rpcGet(env, owner, name)) || {
    v: 1, date, tz: "America/Chicago", workouts: [], checkins: [], at: 0, source: "strava-webhook",
  };
  const workouts = Array.isArray(existing.workouts) ? existing.workouts.slice() : [];
  const idx = workouts.findIndex((w) => w && (w.id === workout.id || w.strava_id === workout.strava_id));
  const clean = { ...workout };
  delete clean.start_iso;
  delete clean.strava_id;
  if (idx >= 0) workouts[idx] = { ...workouts[idx], ...clean };
  else workouts.push(clean);
  const next = { ...existing, v: 1, date, workouts, at: Date.now(), source: existing.source || "strava" };
  if (clean.calories != null && (existing.calories_out == null || existing.source === "strava" || existing.source === "strava-webhook")) {
    const sum = workouts.reduce((acc, w) => acc + (typeof w.calories === "number" ? w.calories : 0), 0);
    next.calories_out = sum || existing.calories_out;
  }
  await rpcPut(env, owner, name, next);
  // touch index
  const idxName = "fit-index";
  const index = (await rpcGet(env, owner, idxName)) || { days: [], at: 0 };
  const days = Array.from(new Set([...(index.days || []), date])).filter(Boolean).sort();
  await rpcPut(env, owner, idxName, { days, at: Date.now() });
  return { date, id: clean.id };
}

export async function stravaRefresh(env, record) {
  if (!record || !record.refresh_token) return record;
  const expiresAt = Number(record.expires_at || 0) * 1000;
  if (expiresAt && expiresAt > Date.now() + 60_000) return record;
  const body = new URLSearchParams({
    client_id: String(env.STRAVA_CLIENT_ID || ""),
    client_secret: String(env.STRAVA_CLIENT_SECRET || ""),
    grant_type: "refresh_token",
    refresh_token: record.refresh_token,
  });
  const res = await fetch(STRAVA_TOKEN, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`strava refresh ${res.status}: ${data.message || JSON.stringify(data)}`);
  const next = {
    ...record,
    access_token: data.access_token,
    refresh_token: data.refresh_token || record.refresh_token,
    expires_at: data.expires_at,
    updated_at: Date.now(),
  };
  const owner = await tokOwner(record.auth0_sub);
  await tokenPut(env, owner, "strava", next);
  return next;
}

export async function garminRefresh(env, record) {
  if (!record || !record.refresh_token) return record;
  const expiresAt = Number(record.expires_at || 0);
  // Garmin access tokens last ~3 months; refresh if within 1 day of expiry (expires_at may be ms or s)
  const expMs = expiresAt > 1e12 ? expiresAt : expiresAt * 1000;
  if (expMs && expMs > Date.now() + 86_400_000) return record;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: String(env.GARMIN_CLIENT_ID || ""),
    client_secret: String(env.GARMIN_CLIENT_SECRET || ""),
    refresh_token: record.refresh_token,
  });
  const res = await fetch(GARMIN_TOKEN, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" }, body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`garmin refresh ${res.status}`);
  const next = {
    ...record,
    access_token: data.access_token,
    refresh_token: data.refresh_token || record.refresh_token,
    expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + Number(data.expires_in) : record.expires_at,
    updated_at: Date.now(),
  };
  const owner = await tokOwner(record.auth0_sub);
  await tokenPut(env, owner, "garmin", next);
  return next;
}

export function stravaConfigured(env) {
  return !!(env.STRAVA_CLIENT_ID && env.STRAVA_CLIENT_SECRET);
}
export function garminConfigured(env) {
  return !!(env.GARMIN_CLIENT_ID && env.GARMIN_CLIENT_SECRET);
}

export function publicStatus(record, pending) {
  if (pending) {
    return { connected: false, pending: true, name: null, last_sync: null, athlete_id: null };
  }
  if (!record || !record.access_token) {
    return { connected: false, pending: false, name: null, last_sync: null, athlete_id: null };
  }
  return {
    connected: true,
    pending: false,
    name: record.athlete_name || null,
    last_sync: record.last_sync || null,
    athlete_id: record.athlete_id != null ? record.athlete_id : null,
    connected_at: record.connected_at || null,
  };
}
