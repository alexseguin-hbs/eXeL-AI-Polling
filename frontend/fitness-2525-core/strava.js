// Fitness-2525 worker core — Strava OAuth/sync/webhook (split from fitness-2525-core.js; < 12KB per module for the GitHub connector)
import { json, STRAVA_AUTH, STRAVA_TOKEN, STRAVA_API, STRAVA_SCOPE, kvOf, supabaseCfg, rpcPut, rpcGet, rpcDel, tokOwner, mapOwner, requireUser, mintState, readState } from "./base.js";
import { athleteName, mapStravaActivity, mergeWorkoutIntoDay, stravaRefresh, stravaConfigured, publicStatus } from "./sync.js";

export async function handleStrava(request, env, action, url) {
  if (action === "webhook") {
    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      if (mode === "subscribe" && token && token === String(env.STRAVA_VERIFY_TOKEN || "") && challenge) {
        return json({ "hub.challenge": challenge });
      }
      return json({ error: "Verification failed" }, 403);
    }
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad JSON" }, 400); }
    // Strava may send hub challenge on POST rarely; ignore. Process activity create/update.
    const objectType = body.object_type || body.objectType;
    const aspect = body.aspect_type || body.aspectType;
    const objectId = body.object_id || body.objectId;
    const ownerId = body.owner_id || body.ownerId;
    if (objectType === "activity" && (aspect === "create" || aspect === "update") && objectId && ownerId) {
      const map = await rpcGet(env, await mapOwner("strava"), `athlete-${ownerId}`);
      if (map && map.auth0_sub) {
        try {
          let rec = await rpcGet(env, await tokOwner(map.auth0_sub), "strava");
          if (rec) {
            rec = await stravaRefresh(env, rec);
            const actRes = await fetch(`${STRAVA_API}/activities/${objectId}`, {
              headers: { authorization: `Bearer ${rec.access_token}` },
            });
            if (actRes.ok) {
              const act = await actRes.json();
              const workout = mapStravaActivity(act);
              await mergeWorkoutIntoDay(env, map.auth0_sub, workout);
              rec.last_sync = new Date().toISOString();
              rec.updated_at = Date.now();
              await rpcPut(env, await tokOwner(map.auth0_sub), "strava", rec);
            }
          }
        } catch (_e) {
          // webhook must 200 quickly; swallow processing errors
        }
      }
    }
    return json({ ok: true });
  }

  if (action === "callback") {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const err = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const st = await readState(env, state);
    const back = `${url.origin}/Fitness-2525/?tab=CONNECTIONS`;
    if (err) return Response.redirect(`${back}&strava=denied`, 302);
    if (!code || !st || st.provider !== "strava") return Response.redirect(`${back}&strava=error`, 302);
    if (!stravaConfigured(env)) return Response.redirect(`${back}&strava=unconfigured`, 302);
    const body = new URLSearchParams({
      client_id: String(env.STRAVA_CLIENT_ID),
      client_secret: String(env.STRAVA_CLIENT_SECRET),
      code,
      grant_type: "authorization_code",
    });
    const res = await fetch(STRAVA_TOKEN, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return Response.redirect(`${back}&strava=token_error`, 302);
    const athlete = data.athlete || {};
    const record = {
      provider: "strava",
      auth0_sub: st.sub,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      athlete_id: athlete.id,
      athlete_name: athleteName(athlete),
      scope: data.scope || STRAVA_SCOPE,
      connected_at: new Date().toISOString(),
      last_sync: null,
      updated_at: Date.now(),
    };
    await rpcPut(env, await tokOwner(st.sub), "strava", record);
    if (athlete.id != null) {
      await rpcPut(env, await mapOwner("strava"), `athlete-${athlete.id}`, { auth0_sub: st.sub, athlete_id: athlete.id });
    }
    return Response.redirect(`${back}&strava=connected`, 302);
  }

  if (action === "connect") {
    if (request.method !== "GET" && request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!stravaConfigured(env)) return json({ configured: false, error: "STRAVA_CLIENT_ID/SECRET not set" }, 200);
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const redirectUri = `${url.origin}/api/fitness-2525/strava/callback`;
    const state = await mintState(env, { sub: auth.user.sub, provider: "strava" });
    const params = new URLSearchParams({
      client_id: String(env.STRAVA_CLIENT_ID),
      redirect_uri: redirectUri,
      response_type: "code",
      approval_prompt: "auto",
      scope: STRAVA_SCOPE,
      state,
    });
    return json({ configured: true, url: `${STRAVA_AUTH}?${params}` });
  }

  if (action === "status") {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const record = await rpcGet(env, await tokOwner(auth.user.sub), "strava");
    return json({
      configured: stravaConfigured(env),
      storage: kvOf(env) ? "kv" : supabaseCfg(env) ? "supabase" : "none",
      ...publicStatus(record, false),
    });
  }

  if (action === "disconnect") {
    if (request.method !== "POST" && request.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const owner = await tokOwner(auth.user.sub);
    const record = await rpcGet(env, owner, "strava");
    if (record?.access_token && stravaConfigured(env)) {
      try {
        await fetch("https://www.strava.com/oauth/deauthorize", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ access_token: record.access_token }),
        });
      } catch (_e) { /* best-effort */ }
    }
    if (record?.athlete_id != null) {
      await rpcDel(env, await mapOwner("strava"), `athlete-${record.athlete_id}`);
    }
    await rpcDel(env, owner, "strava");
    return json({ ok: true, connected: false });
  }

  if (action === "sync") {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    if (!stravaConfigured(env)) return json({ error: "Strava not configured" }, 503);
    let record = await rpcGet(env, await tokOwner(auth.user.sub), "strava");
    if (!record?.access_token) return json({ error: "Not connected" }, 400);
    record = await stravaRefresh(env, record);
    const after = Math.floor(Date.now() / 1000) - 14 * 86400;
    const listRes = await fetch(`${STRAVA_API}/athlete/activities?per_page=30&after=${after}`, {
      headers: { authorization: `Bearer ${record.access_token}` },
    });
    if (!listRes.ok) return json({ error: `Strava API ${listRes.status}` }, 502);
    const activities = await listRes.json();
    let imported = 0;
    for (const act of Array.isArray(activities) ? activities : []) {
      await mergeWorkoutIntoDay(env, auth.user.sub, mapStravaActivity(act));
      imported += 1;
    }
    record.last_sync = new Date().toISOString();
    record.updated_at = Date.now();
    // refresh athlete display name
    try {
      const me = await fetch(`${STRAVA_API}/athlete`, { headers: { authorization: `Bearer ${record.access_token}` } });
      if (me.ok) {
        const athlete = await me.json();
        record.athlete_name = athleteName(athlete) || record.athlete_name;
        record.athlete_id = athlete.id ?? record.athlete_id;
      }
    } catch (_e) { /* ignore */ }
    await rpcPut(env, await tokOwner(auth.user.sub), "strava", record);
    return json({ ok: true, imported, last_sync: record.last_sync, name: record.athlete_name });
  }

  return json({ error: "Unknown strava action" }, 404);
}
