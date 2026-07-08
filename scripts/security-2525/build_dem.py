#!/usr/bin/env python3
"""SECURITY-2525 — build dem-<key>.json real elevation grids (opentopodata / SRTM 30m).

Samples a lat/lon grid of REAL elevation for each saved region so the map draws
real topographic contours (replaces the synthetic placeholder). Output:
  { bbox:[W,S,E,N], nx, ny, elev:[row-major ny*nx, metres MSL] }
Client bilinear-samples this grid. Data: opentopodata.org (SRTM/GEBCO, ODbL/public).
"""
import json, os, sys, time, urllib.request, urllib.parse

OUT = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "security-2525")
# GEBCO 2020 = real land elevation AND ocean depth (negative) — one consistent source
# so land contours AND ocean-floor bathymetry are both real. 100 loc/call, ~1 req/s.
API = "https://api.opentopodata.org/v1/gebco2020"

# key: (S, W, N, E, nx, ny)
REGIONS = {
    # base / AO tactical grids (~±0.6°), fine local relief
    "capitol":      (29.67, -98.34, 30.88, -97.14, 40, 40),
    "mabry":        (29.72, -98.36, 30.92, -97.16, 40, 40),
    "dc":           (38.31, -77.64, 39.51, -76.44, 40, 40),
    "jblm":         (46.49, -123.18, 47.69, -121.98, 40, 40),
    "campblanding": (29.36, -82.58, 30.56, -81.38, 40, 40),
    "nasjax":       (29.64, -82.28, 30.84, -81.08, 40, 40),
    "mayport":      (29.79, -82.02, 30.99, -80.82, 40, 40),
    "naspensacola": (29.75, -87.92, 30.95, -86.72, 40, 40),
    "naswhiting":   (30.12, -87.62, 31.32, -86.42, 40, 40),
    "naskeywest":   (23.98, -82.29, 25.18, -81.09, 40, 40),
    "jacksonville": (29.73, -82.26, 30.93, -81.06, 40, 40),
    # littoral + state / regional overviews ("all of TX/WA/FL" + DC+100km)
    "florida":      (24.4, -83.8, 31.0, -79.4, 56, 56),
    "texas":        (25.8, -106.7, 36.6, -93.4, 72, 60),
    "washington":   (45.5, -124.9, 49.1, -116.9, 60, 40),
    "floridastate": (24.3, -87.7, 31.1, -79.9, 60, 56),
    "dc100":        (37.9, -78.5, 39.9, -75.6, 48, 48),
}


def fetch(locs):
    q = "|".join(f"{lat:.4f},{lon:.4f}" for lat, lon in locs)
    url = f"{API}?locations={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={"User-Agent": "eXeL-SECURITY-2525/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.load(r)
    return [(x["elevation"] if x["elevation"] is not None else 0.0) for x in d["results"]]


def build(key, S, W, N, E, nx, ny):
    pts = []
    for j in range(ny):
        lat = N - (j / (ny - 1)) * (N - S)
        for i in range(nx):
            lon = W + (i / (nx - 1)) * (E - W)
            pts.append((lat, lon))
    elev = []
    for c in range(0, len(pts), 100):
        for attempt in range(4):
            try:
                elev.extend(fetch(pts[c:c + 100])); break
            except Exception as ex:  # noqa
                print(f"    {key} batch {c} retry {attempt+1}: {ex}"); time.sleep(6)
        time.sleep(1.2)  # respect ~1 req/s
    out = {"bbox": [round(W, 4), round(S, 4), round(E, 4), round(N, 4)],
           "nx": nx, "ny": ny, "elev": [round(e, 1) for e in elev],
           "source": "opentopodata / GEBCO 2020"}
    path = os.path.join(OUT, f"dem-{key}.json")
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    lo, hi = min(out["elev"]), max(out["elev"])
    print(f"  {key}: {nx}x{ny}  {lo:.0f}..{hi:.0f} m  -> {os.path.getsize(path)//1024} KB")


if __name__ == "__main__":
    keys = sys.argv[1:] or list(REGIONS.keys())
    for k in keys:
        if k in REGIONS:
            build(k, *REGIONS[k])
