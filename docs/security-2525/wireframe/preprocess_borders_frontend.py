"""Preprocess Natural Earth 50m -> compact frontend polylines.
Countries: whole globe. States: USA only. Round 2 decimals, decimate, drop tiny rings."""
import json, os

CACHE = "/home/alex/eXeL-AI-Polling/docs/security-2525/wireframe/cache"
OUT = "/home/alex/eXeL-AI-Polling/frontend/public/security-2525/borders-ne50m.json"

def rings(geom):
    t = geom.get("type")
    if t == "Polygon":
        yield from geom["coordinates"]
    elif t == "MultiPolygon":
        for poly in geom["coordinates"]:
            yield from poly

def simplify(ring, step=3, nd=2, min_pts=6):
    pts = [[round(x, nd), round(y, nd)] for x, y in ring[::step]]
    out = [pts[0]]
    for p in pts[1:]:
        if p != out[-1]:
            out.append(p)
    if len(out) < min_pts:
        return None
    return out

def load(kind):
    with open(os.path.join(CACHE, f"ne_50m_{kind}.geojson")) as f:
        return json.load(f)

countries = []
for feat in load("country")["features"]:
    for ring in rings(feat["geometry"]):
        s = simplify(ring)
        if s:
            countries.append(s)

us_states = []
for feat in load("state")["features"]:
    p = feat.get("properties", {})
    if (p.get("admin") or p.get("ADMIN") or p.get("adm0name")) != "United States of America":
        continue
    for ring in rings(feat["geometry"]):
        s = simplify(ring, step=2, min_pts=6)
        if s:
            us_states.append(s)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
data = {"source": "Natural Earth 50m (public domain)", "countries": countries, "usStates": us_states}
with open(OUT, "w") as f:
    json.dump(data, f, separators=(",", ":"))
print("countries rings:", len(countries), "us state rings:", len(us_states))
print("size KB:", os.path.getsize(OUT) // 1024)
