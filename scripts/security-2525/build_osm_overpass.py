#!/usr/bin/env python3
"""SECURITY-2525 — build osm-<key>.json road/water tiles from OpenStreetMap (Overpass).

Replicates the Capitol/JBLM tile schema for Florida bases (14G WA/FL/TX demo):
  { roads:[{t:tier, p:[[lon,lat],...]}], water:[[lon,lat],...],
    waterPolys:[[lon,lat],...], bbox:[minLon,minLat,maxLon,maxLat], source:str }

Tiers (match the map render): 4=major (motorway/trunk/primary), 3=secondary/tertiary,
2=residential/service/unclassified. Data © OpenStreetMap contributors (ODbL).
Deterministic per Overpass snapshot; simplify keeps files small.
"""
import json, math, sys, time, urllib.request, urllib.parse, os

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "security-2525")
OVERPASS = "https://overpass-api.de/api/interpreter"

# key: (lat, lon, radius_km)  radius ≈ base half-extent + 10 km buffer.
# Radii tuned so tiles stay ~1–4 MB (phone-friendly); metros trimmed vs bases.
BASES = {
    "campblanding": (29.9558, -81.9803, 16),
    "nasjax":       (30.2358, -81.6806, 15),
    "mayport":      (30.3936, -81.4243, 15),
    "naspensacola": (30.3536, -87.3190, 16),
    "naswhiting":   (30.7241, -87.0219, 16),
    "naskeywest":   (24.5758, -81.6889, 18),
    "jacksonville": (30.3322, -81.6557, 16),
}
TIER = {"motorway": 4, "trunk": 4, "primary": 4, "secondary": 3, "tertiary": 3,
        "residential": 2, "unclassified": 2, "service": 2, "motorway_link": 4,
        "trunk_link": 4, "primary_link": 4, "secondary_link": 3, "tertiary_link": 3}


def bbox(lat, lon, rkm):
    dlat = rkm / 110.574
    dlon = rkm / (111.320 * math.cos(math.radians(lat)))
    return (lat - dlat, lon - dlon, lat + dlat, lon + dlon)  # S,W,N,E


def simplify(pts, tol=0.00028):
    """Cheap decimation: drop points closer than tol (deg, ~30 m) to the last kept.
    Coarser than v1 to keep tiles phone-friendly (~1–4 MB)."""
    if len(pts) < 3:
        return pts
    out = [pts[0]]
    for p in pts[1:-1]:
        if abs(p[0] - out[-1][0]) + abs(p[1] - out[-1][1]) >= tol:
            out.append(p)
    out.append(pts[-1])
    return out


def query(s, w, n, e):
    hw = "|".join(TIER.keys())
    q = f"""[out:json][timeout:90];
(
  way["highway"~"^({hw})$"]({s},{w},{n},{e});
  way["waterway"~"^(river|stream|canal)$"]({s},{w},{n},{e});
  way["natural"="water"]({s},{w},{n},{e});
);
out geom;"""
    data = urllib.parse.urlencode({"data": q}).encode()
    req = urllib.request.Request(OVERPASS, data=data,
                                 headers={"User-Agent": "eXeL-SECURITY-2525/1.0"})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.load(r)


def build(key, lat, lon, rkm):
    s, w, n, e = bbox(lat, lon, rkm)
    res = query(s, w, n, e)
    roads, water, polys = [], [], []
    for el in res.get("elements", []):
        if el.get("type") != "way" or "geometry" not in el:
            continue
        pts = [[round(g["lon"], 5), round(g["lat"], 5)] for g in el["geometry"]]
        pts = simplify(pts)
        tags = el.get("tags", {})
        if "highway" in tags:
            roads.append({"t": TIER.get(tags["highway"], 2), "p": pts})
        elif "waterway" in tags:
            water.append(pts)
        elif tags.get("natural") == "water":
            polys.append(pts)
    out = {"roads": roads, "water": water, "waterPolys": polys,
           "bbox": [round(w, 5), round(s, 5), round(e, 5), round(n, 5)],
           "source": "OpenStreetMap contributors (ODbL) via Overpass"}
    path = os.path.join(OUT, f"osm-{key}.json")
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"  {key}: roads={len(roads)} water={len(water)} polys={len(polys)} "
          f"-> {os.path.getsize(path)//1024} KB")


if __name__ == "__main__":
    keys = sys.argv[1:] or list(BASES.keys())
    for k in keys:
        if k not in BASES:
            print(f"skip unknown {k}"); continue
        for attempt in range(3):
            try:
                build(k, *BASES[k]); break
            except Exception as ex:  # noqa
                print(f"  {k} attempt {attempt+1} failed: {ex}")
                time.sleep(20)
        time.sleep(8)  # be polite to Overpass
