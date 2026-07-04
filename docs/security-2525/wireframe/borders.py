"""
SECURITY-2525 · MGRS Wireframe — Borders layer
==============================================
State (admin-1) and country (admin-0) border polylines, fetched once from
Natural Earth (public domain), cached to disk, and clipped to the AO bbox.

Low-compute philosophy: heavy GIS parsing happens ONCE here (preprocess), the
runtime consumes compact [(lat,lon), ...] polylines. No geopandas/shapely —
stdlib json + a Liang–Barsky segment clip.
"""
from __future__ import annotations
import json
import os
import urllib.request

from coordinate_engine import BBox

_CACHE = os.path.join(os.path.dirname(__file__), "cache")
_NE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson"
SOURCES = {
    "country": f"{_NE}/ne_50m_admin_0_countries.geojson",
    "state": f"{_NE}/ne_50m_admin_1_states_provinces.geojson",
}


def _fetch(kind: str) -> dict:
    os.makedirs(_CACHE, exist_ok=True)
    path = os.path.join(_CACHE, f"ne_50m_{kind}.geojson")
    if not os.path.exists(path):
        print(f"  fetching {kind} borders (Natural Earth 50m)…")
        urllib.request.urlretrieve(SOURCES[kind], path)
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _rings(geom):
    """Yield coordinate rings from Polygon / MultiPolygon geometry."""
    t = geom.get("type")
    if t == "Polygon":
        yield from geom["coordinates"]
    elif t == "MultiPolygon":
        for poly in geom["coordinates"]:
            yield from poly


def _clip_segment(p1, p2, b: BBox):
    """Liang–Barsky clip of lon/lat segment to bbox. Returns clipped (p1,p2) or None."""
    x1, y1 = p1
    x2, y2 = p2
    dx, dy = x2 - x1, y2 - y1
    t0, t1 = 0.0, 1.0
    for p, q in ((-dx, x1 - b.west), (dx, b.east - x1),
                 (-dy, y1 - b.south), (dy, b.north - y1)):
        if p == 0:
            if q < 0:
                return None  # parallel & outside
        else:
            r = q / p
            if p < 0:
                if r > t1:
                    return None
                if r > t0:
                    t0 = r
            else:
                if r < t0:
                    return None
                if r < t1:
                    t1 = r
    return ((x1 + t0 * dx, y1 + t0 * dy), (x1 + t1 * dx, y1 + t1 * dy))


def load_borders(bbox: BBox, kinds=("country", "state")) -> dict:
    """Return {kind: [polyline, ...]} where polyline = [(lat, lon), ...], clipped to bbox."""
    # small margin so a border just outside still shows its crossing
    m = 0.15
    big = BBox(bbox.west - m, bbox.south - m, bbox.east + m, bbox.north + m)
    out: dict[str, list] = {}
    for kind in kinds:
        gj = _fetch(kind)
        polylines: list[list[tuple[float, float]]] = []
        for feat in gj["features"]:
            for ring in _rings(feat["geometry"]):
                cur: list[tuple[float, float]] = []
                for i in range(len(ring) - 1):
                    seg = _clip_segment(ring[i][:2], ring[i + 1][:2], big)
                    if seg is None:
                        if cur:
                            polylines.append(cur)
                            cur = []
                        continue
                    (lo1, la1), (lo2, la2) = seg
                    if not cur:
                        cur.append((la1, lo1))
                    cur.append((la2, lo2))
                if cur:
                    polylines.append(cur)
        out[kind] = [pl for pl in polylines if len(pl) >= 2]
    return out


if __name__ == "__main__":
    bb = BBox(-83.0183, 29.0526, -80.9415, 30.8512)
    b = load_borders(bb)
    for k, v in b.items():
        pts = sum(len(pl) for pl in v)
        print(f"{k}: {len(v)} polylines, {pts} vertices (clipped to AO)")
