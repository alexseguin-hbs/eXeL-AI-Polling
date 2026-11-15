#!/usr/bin/env python3
"""SECURITY-2525 — fetch an AO's OSM roads/water (Overpass, TILED) + elevation/bathymetry
(opentopodata GEBCO 2020 or aster30m) and write the map tiles:
  frontend/public/security-2525/osm-<key>.json   {roads:[{t,p}],water,waterPolys,bbox,center,radius_km}
  frontend/public/security-2525/dem-<key>.json   {bbox,nx,ny,elev,source}

Same data SOURCES as build_osm_overpass.py (Overpass) + build_dem.py (opentopodata), but:
  • TILED Overpass (N×N small bbox queries) so large AOs (e.g. 42 km / 84 km box) return
    instead of timing out on a single whole-region query.
  • mirror iteration (overpass.kumi.systems · overpass.osm.ch · overpass-api.de) — the main
    instance resets some egresses; mirrors are tried in order, best-effort per tile.
  • GEBCO 2020 default DEM so ocean/inlet BATHYMETRY (negative elevation) renders, not just land.

This is the tooling for the all-AO "42 km radius of detail" program and the download-any-AO
feature. Pure stdlib, no deps.

CAVEAT (recorded 2026-11-14): from a restricted cloud egress the Overpass mirrors may all
refuse (connection reset / read timeout / HTML error) — then OSM comes back empty and only the
DEM (opentopodata, usually reachable) is written. Re-run when a mirror recovers, or run from a
network that can reach Overpass.

Usage:
  fetch_ao_data.py --key jblm --center 47.0855,-122.5821 --radius 42
  fetch_ao_data.py --key dc   --center 38.8899,-77.0091  --radius 42 --dem aster30m --grid 72
  [--tiles 4] [--dem-only] [--osm-only] [--out <dir>]
"""
import json, math, sys, time, argparse, urllib.request, urllib.parse, os

EPS = ["https://overpass.kumi.systems/api/interpreter",
       "https://overpass.osm.ch/api/interpreter",
       "https://overpass-api.de/api/interpreter"]
TIER = {"motorway": 4, "trunk": 4, "primary": 4, "motorway_link": 4, "trunk_link": 4, "primary_link": 4,
        "secondary": 3, "secondary_link": 3}
HW = "|".join(TIER.keys())


def simplify(pts, tol=0.0006):
    if len(pts) < 3:
        return pts
    out = [pts[0]]
    for p in pts[1:-1]:
        if abs(p[0] - out[-1][0]) + abs(p[1] - out[-1][1]) >= tol:
            out.append(p)
    out.append(pts[-1])
    return out


def ov(ep, query, timeout=45):
    data = urllib.parse.urlencode({"data": query}).encode()
    req = urllib.request.Request(ep, data=data, headers={"User-Agent": "eXeL-SECURITY-2525/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.load(r)


def tile_query(s, w, n, e):
    return (f'[out:json][timeout:50];('
            f'way["highway"~"^({HW})$"]({s},{w},{n},{e});'
            f'way["waterway"~"^(river|canal|stream)$"]({s},{w},{n},{e});'
            f'way["natural"~"^(water|coastline)$"]({s},{w},{n},{e});'
            f');out geom;')


def fetch_osm(S, W, N, E, tiles):
    roads, water, polys, seen = [], [], [], set()

    def parse(res):
        for el in res.get("elements", []):
            if "geometry" not in el or el.get("id") in seen:
                continue
            seen.add(el.get("id"))
            pts = simplify([[round(g["lon"], 5), round(g["lat"], 5)] for g in el["geometry"]])
            if len(pts) < 2:
                continue
            tags = el.get("tags", {})
            if "highway" in tags:
                roads.append({"t": TIER.get(tags["highway"], 3), "p": pts})
            elif "waterway" in tags:
                water.append(pts)
            elif tags.get("natural") == "water":
                polys.append(pts)
            elif tags.get("natural") == "coastline":
                water.append(pts)

    hit = 0
    for r in range(tiles):
        for c in range(tiles):
            s = S + (N - S) * r / tiles
            n = S + (N - S) * (r + 1) / tiles
            w = W + (E - W) * c / tiles
            e = W + (E - W) * (c + 1) / tiles
            got = False
            for j in range(2):
                ep = EPS[(r * tiles + c + j) % 2]  # alternate kumi/osm.ch (skip de=reset)
                host = ep.split("//")[1].split("/")[0]
                try:
                    parse(ov(ep, tile_query(s, w, n, e)))
                    hit += 1
                    got = True
                    print(f"  tile {r*tiles+c+1}/{tiles*tiles} @ {host}: roads={len(roads)} water={len(water)} polys={len(polys)}", flush=True)
                    break
                except Exception as ex:
                    print(f"  tile {r*tiles+c+1}/{tiles*tiles} @ {host} fail: {ex}", flush=True)
                    time.sleep(3)
            if not got:
                print(f"  tile {r*tiles+c+1}/{tiles*tiles} SKIPPED", flush=True)
            time.sleep(1.2)
    return roads, water, polys, hit


def fetch_dem(S, W, N, E, nx, ny, source):
    api = f"https://api.opentopodata.org/v1/{source}"

    def batch(locs):
        q = "|".join(f"{la:.5f},{lo:.5f}" for la, lo in locs)
        req = urllib.request.Request(f"{api}?locations={urllib.parse.quote(q)}", headers={"User-Agent": "eXeL-SECURITY-2525/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            return [(x["elevation"] if x["elevation"] is not None else 0.0) for x in json.load(r)["results"]]

    pts = []
    for j in range(ny):
        lat = N - (j / (ny - 1)) * (N - S)
        for i in range(nx):
            pts.append((lat, W + (i / (nx - 1)) * (E - W)))
    elev = []
    for c in range(0, len(pts), 100):
        for attempt in range(5):
            try:
                elev.extend(batch(pts[c:c + 100]))
                break
            except Exception as ex:
                print(f"    dem {c} retry{attempt+1}: {ex}", flush=True)
                time.sleep(6)
        else:
            raise SystemExit("opentopodata unreachable")
        if c % 1000 == 0:
            print(f"    dem {c}/{len(pts)}", flush=True)
        time.sleep(1.15)
    return elev


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", required=True)
    ap.add_argument("--center", required=True, help="lat,lon")
    ap.add_argument("--radius", type=float, default=42.0, help="km")
    ap.add_argument("--dem", default="gebco2020", help="opentopodata dataset (gebco2020 | aster30m | srtm30m)")
    ap.add_argument("--grid", type=int, default=80, help="DEM grid nx=ny")
    ap.add_argument("--tiles", type=int, default=4, help="OSM tile grid NxN")
    ap.add_argument("--dem-only", action="store_true")
    ap.add_argument("--osm-only", action="store_true")
    ap.add_argument("--out", default=os.path.join(os.path.dirname(__file__), "..", "..", "public", "security-2525"))
    a = ap.parse_args()
    clat, clon = [float(x) for x in a.center.split(",")]
    dlat = a.radius / 110.574
    dlon = a.radius / (111.320 * math.cos(math.radians(clat)))
    S, W, N, E = clat - dlat, clon - dlon, clat + dlat, clon + dlon
    print(f"AO {a.key}  center {clat},{clon}  r={a.radius}km  box S{S:.4f} W{W:.4f} N{N:.4f} E{E:.4f}", flush=True)
    t0 = time.time()

    if not a.dem_only:
        roads, water, polys, hit = fetch_osm(S, W, N, E, a.tiles)
        if roads or water or polys:
            out = {"roads": roads, "water": water, "waterPolys": polys,
                   "bbox": [round(W, 5), round(S, 5), round(E, 5), round(N, 5)],
                   "center": [clat, clon], "radius_km": a.radius,
                   "source": "OpenStreetMap contributors (ODbL) via Overpass (tiled)"}
            p = os.path.join(a.out, f"osm-{a.key}.json")
            json.dump(out, open(p, "w"), separators=(",", ":"))
            print(f"  OSM -> {p} ({os.path.getsize(p)//1024} KB, tiles_hit={hit}/{a.tiles*a.tiles})", flush=True)
        else:
            print("  OSM: EMPTY — all Overpass tiles failed (egress likely blocked); DEM still written", flush=True)

    if not a.osm_only:
        elev = fetch_dem(S, W, N, E, a.grid, a.grid, a.dem)
        out = {"bbox": [round(W, 4), round(S, 4), round(E, 4), round(N, 4)], "nx": a.grid, "ny": a.grid,
               "elev": [round(e, 1) for e in elev], "source": f"opentopodata / {a.dem}"}
        p = os.path.join(a.out, f"dem-{a.key}.json")
        json.dump(out, open(p, "w"), separators=(",", ":"))
        print(f"  DEM -> {p} ({a.grid}x{a.grid}, {min(out['elev']):.0f}..{max(out['elev']):.0f} m, {os.path.getsize(p)//1024} KB)", flush=True)

    print(f"done {a.key} in {time.time()-t0:.0f}s", flush=True)


if __name__ == "__main__":
    main()
