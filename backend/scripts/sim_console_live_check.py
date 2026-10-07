"""HP-21 proof: the Admin Console's LIVE sequence against a running backend (offline AI provider, no cost).

Usage (backend running with ENVIRONMENT=development on a local DB): python scripts/sim_console_live_check.py [base_url] [n]
"""
import json, random, sys, time, httpx
B = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8765/api/v1"
N = int(sys.argv[2]) if len(sys.argv) > 2 else 60
c = httpx.Client(base_url=B, timeout=120)
def ok(r, what):
    if r.status_code >= 400: print("FAIL", what, r.status_code, r.text[:300]); sys.exit(1)
    return r.json()
s = ok(c.post("/sessions", json={"title": "HP-21 live run", "polling_mode_type": "live_interactive", "ai_provider": "openai",
        "session_type": "simulation", "theme2_voting_level": "theme2_9", "theme01_category": "risk"}), "create")
sid = s["id"]; print("session", sid, s["status"], s.get("session_type"))
q = ok(c.post(f"/sessions/{sid}/questions", json={"question_text": "What should our city prioritize for AI governance?"}), "question")
ok(c.post(f"/sessions/{sid}/open"), "open"); ok(c.post(f"/sessions/{sid}/poll"), "poll")
rng = random.Random(7)
risk = ["privacy breaches worry me", "bias in automated decisions is a serious risk", "job losses could hurt families", "surveillance concerns are growing"]
sup = ["transparent audits would build trust", "AI can speed up permits", "open data helps everyone", "training programs for workers are great"]
neu = ["we need more information first", "it depends on the budget", "other cities have tried different approaches", "time will tell"]
resp = [{"text": f"{rng.choice(rng.choice([risk, sup, neu]))}. {rng.choice(rng.choice([risk, sup, neu]))} and we should discuss it openly."} for _ in range(N)]
t0 = time.time(); out = ok(c.post(f"/sessions/{sid}/sim/responses", json={"question_id": q["id"], "responses": resp}), "sim/responses")
print("responses accepted", out["accepted"], "of", N, "refused", out["refused_count"], f"{time.time()-t0:.1f}s", out["refused"][:2])
time.sleep(3)
t0 = time.time(); run = ok(c.post(f"/sessions/{sid}/ai/run", json={}), "ai/run"); print("ai/run", run.get("status"), f"{time.time()-t0:.1f}s", {k: run.get(k) for k in ("total_responses", "theme_count", "replay_hash")})
rows = ok(c.get(f"/sessions/{sid}/themes"), "themes")
parents = [r for r in rows if r.get("parent_theme_id") is None]
print("themes", len(rows), "parents", [p["label"] for p in parents])
risk_p = next((p for p in parents if p["label"].lower().startswith("risk")), None)
nine = [r["id"] for r in rows if str(r.get("theme_level") or (r.get("cluster_metadata") or {}).get("level")) == "9" and r.get("label") and (not risk_p or r.get("parent_theme_id") == risk_p["id"])]
print("ballot pool (Risk, level 9):", len(nine))
ok(c.post(f"/sessions/{sid}/rank"), "rank")
ballots = []
for _ in range(20):
    b = list(nine); rng.shuffle(b); ballots.append(b)
out = ok(c.post(f"/sessions/{sid}/sim/ballots", json={"ballots": ballots}), "sim/ballots"); print("ballots accepted", out["accepted"], "refused", out["refused_count"], out["refused"][:2])
agg = ok(c.post(f"/sessions/{sid}/rankings/aggregate", json={}), "aggregate")
print("aggregate:", json.dumps(agg)[:400])
# a REAL session refuses the seed endpoints
real = ok(c.post("/sessions", json={"title": "real", "polling_mode_type": "live_interactive", "ai_provider": "openai"}), "create real")
r = c.post(f"/sessions/{real['id']}/sim/ballots", json={"ballots": [ballots[0]]}); print("real session refuses sim/ballots:", r.status_code, r.text[:120])
