// Fitness-2525 worker core — Garmin OAuth/push (split from fitness-2525-core.js; < 12KB per module for the GitHub connector)
import { json, GARMIN_AUTH, GARMIN_TOKEN, GARMIN_USER } from "./base.js";
import { requireUser, mintState, readState, pkcePair } from "./auth.js";
import { tokOwner, mapOwner, tokenPut, tokenGet, tokenDel, tokenStoreReady, oauthNotReady } from "./tokens.js";
import { garminRefresh, garminConfigured, publicStatus } from "./sync.js";

export async function handleGarmin(request, env, action, url) {
  if (action === "callback") {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const err = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const notReady = oauthNotReady(env);
    if (notReady) return notReady;
    const st = await readState(env, state);
    const back = `${url.origin}/Fitness-2525/?tab=CONNECTIONS`;
    if (err) return Response.redirect(`${back}&garmin=denied`, 302);
    if (!code || !st || st.provider !== "garmin" || !st.verifier) return Response.redirect(`${back}&garmin=error`, 302);
    if (!garminConfigured(env)) return Response.redirect(`${back}&garmin=unconfigured`, 302);
    const redirectUri = `${url.origin}/api/fitness-2525/garmin/callback`;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: String(env.GARMIN_CLIENT_ID),
      client_secret: String(env.GARMIN_CLIENT_SECRET),
      code,
      code_verifier: st.verifier,
      redirect_uri: redirectUri,
      state,
    });
    const res = await fetch(GARMIN_TOKEN, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return Response.redirect(`${back}&garmin=token_error`, 302);
    let userId = null;
    let display = null;
    try {
      const u = await fetch(GARMIN_USER, { headers: { authorization: `Bearer ${data.access_token}` } });
      if (u.ok) {
        const uj = await u.json();
        userId = uj.userId || uj.user_id || null;
        display = userId ? `Garmin ${userId}` : null;
      }
    } catch (_e) { /* optional */ }
    const record = {
      provider: "garmin",
      auth0_sub: st.sub,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_in ? Math.floor(Date.now() / 1000) + Number(data.expires_in) : null,
      athlete_id: userId,
      athlete_name: display,
      connected_at: new Date().toISOString(),
      last_sync: null,
      updated_at: Date.now(),
    };
    await tokenPut(env, await tokOwner(st.sub), "garmin", record);
    if (userId != null) {
      await tokenPut(env, await mapOwner("garmin"), `athlete-${userId}`, { auth0_sub: st.sub, athlete_id: userId });
    }
    return Response.redirect(`${back}&garmin=connected`, 302);
  }

  if (action === "connect") {
    if (request.method !== "GET" && request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    if (!garminConfigured(env)) {
      return json({
        configured: false,
        pending: true,
        interim: "strava",
        message: "Garmin Connect API pending developer approval. Interim: connect Strava (real OAuth), then link Garmin→Strava at https://www.strava.com/settings/apps so activities sync via Strava.",
        apply_url: "https://developerportal.garmin.com/developer-programs/connect-developer-api",
        strava_link: "https://www.strava.com/settings/apps",
      });
    }
    const notReady = oauthNotReady(env);
    if (notReady) return notReady;
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const { verifier, challenge } = await pkcePair();
    const redirectUri = `${url.origin}/api/fitness-2525/garmin/callback`;
    const state = await mintState(env, { sub: auth.user.sub, provider: "garmin", verifier });
    const params = new URLSearchParams({
      client_id: String(env.GARMIN_CLIENT_ID),
      response_type: "code",
      redirect_uri: redirectUri,
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    return json({ configured: true, url: `${GARMIN_AUTH}?${params}` });
  }

  if (action === "status") {
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405);
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    if (!garminConfigured(env)) {
      return json({
        configured: false,
        pending: true,
        connected: false,
        name: null,
        last_sync: null,
        interim: "strava",
        message: "Garmin pending developer approval — use Connect Strava for now, then link Garmin→Strava",
        apply_url: "https://developerportal.garmin.com/developer-programs/connect-developer-api",
        strava_link: "https://www.strava.com/settings/apps",
      });
    }
    const record = await tokenGet(env, await tokOwner(auth.user.sub), "garmin");
    return json({ configured: true, tokens: tokenStoreReady(env) ? "kv-encrypted" : "unconfigured", ...publicStatus(record, false) });
  }

  if (action === "disconnect") {
    if (request.method !== "POST" && request.method !== "DELETE") return json({ error: "Method not allowed" }, 405);
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    const owner = await tokOwner(auth.user.sub);
    const record = await tokenGet(env, owner, "garmin");
    if (record?.access_token) {
      try {
        await fetch("https://apis.garmin.com/wellness-api/rest/user/registration", {
          method: "DELETE",
          headers: { authorization: `Bearer ${record.access_token}` },
        });
      } catch (_e) { /* best-effort */ }
    }
    if (record?.athlete_id != null) {
      await tokenDel(env, await mapOwner("garmin"), `athlete-${record.athlete_id}`);
    }
    await tokenDel(env, owner, "garmin");
    return json({ ok: true, connected: false });
  }

  if (action === "push") {
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
    const auth = await requireUser(request, env);
    if (auth.error) return auth.error;
    if (!garminConfigured(env)) {
      return json({
        configured: false,
        pending: true,
        message: "Garmin pending developer approval — connect Garmin to Strava meanwhile",
      }, 200);
    }
    let record = await tokenGet(env, await tokOwner(auth.user.sub), "garmin");
    if (!record?.access_token) return json({ error: "Not connected" }, 400);
    record = await garminRefresh(env, record);
    // Garmin Health/Activity is primarily push/webhook; acknowledge readiness.
    record.last_sync = new Date().toISOString();
    record.updated_at = Date.now();
    await tokenPut(env, await tokOwner(auth.user.sub), "garmin", record);
    return json({
      ok: true,
      last_sync: record.last_sync,
      name: record.athlete_name,
      note: "Garmin Activity/Health data arrives via push webhooks once the developer app is approved and endpoints registered.",
    });
  }

  return json({ error: "Unknown garmin action" }, 404);
}
