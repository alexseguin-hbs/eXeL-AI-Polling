"""
SECURITY-2525 · MGRS Wireframe — Coordinate Engine
==================================================
Reusable conversion core. One point in → a full coordinate packet out, linking
human-readable geography (lat/lon, DMS) to military grids (UTM, MGRS) and to the
internal render grid / 3D scene coordinates used by the wireframe.

This is the foundation both AI specs (ChatGPT + Grok) call for. Kept dependency-
light: pyproj (UTM), mgrs (MGRS), pure-python DMS + grid math.

Ties to UCRS-2525 (base-3600 A.B.C) via latlon_to_ucrs() so every Earth point
also carries its native Vision-2525 coordinate. See docs/SECURITY_2525_FRAMEWORK.md §3.
"""
from __future__ import annotations
from dataclasses import dataclass, asdict
from typing import Optional
import math

import pyproj
import mgrs as _mgrs

_MGRS = _mgrs.MGRS()
_GEOD = pyproj.Geod(ellps="WGS84")


# ── DMS ──────────────────────────────────────────────────────────────────────
def _to_dms(value: float, positive: str, negative: str) -> str:
    hemi = positive if value >= 0 else negative
    v = abs(value)
    d = int(v)
    m_full = (v - d) * 60
    m = int(m_full)
    s = (m_full - m) * 60
    return f"{d}°{m:02d}'{s:05.2f}\"{hemi}"


def latlon_to_dms(lat: float, lon: float) -> dict:
    return {"lat": _to_dms(lat, "N", "S"), "lon": _to_dms(lon, "E", "W")}


# ── UTM (via pyproj) ─────────────────────────────────────────────────────────
def utm_zone(lon: float, lat: float) -> tuple[int, str]:
    zone = int((lon + 180) / 6) + 1
    band = "CDEFGHJKLMNPQRSTUVWX"[max(0, min(19, int((lat + 80) / 8)))]
    return zone, band


def latlon_to_utm(lat: float, lon: float) -> dict:
    zone, band = utm_zone(lon, lat)
    crs = pyproj.CRS.from_dict(
        {"proj": "utm", "zone": zone, "south": lat < 0, "ellps": "WGS84"}
    )
    tf = pyproj.Transformer.from_crs("EPSG:4326", crs, always_xy=True)
    e, n = tf.transform(lon, lat)
    return {"zone": f"{zone}{band}", "zone_num": zone, "band": band,
            "easting": round(e, 1), "northing": round(n, 1)}


def latlon_to_mgrs(lat: float, lon: float, precision: int = 5) -> str:
    return _MGRS.toMGRS(lat, lon, MGRSPrecision=precision)


# ── UCRS-2525 (base-3600 A.B.C) ──────────────────────────────────────────────
def _deg_to_abc(angle_deg: float, full: float) -> str:
    """Map a signed angle to base-3600 A.BBBB.0000 against a half-range `full`."""
    a = (angle_deg / full) * 1800.0
    sign = "-" if a < 0 else "+"
    a = abs(a)
    A = int(a)
    frac = round((a - A) * 10000)
    return f"{sign}{A:04d}.{frac:04d}.0000"


def latlon_to_ucrs(lat: float, lon: float) -> dict:
    # latitude half-range 90°, longitude half-range 180° (see framework §3.1)
    return {"phi": _deg_to_abc(lat, 90.0), "lambda": _deg_to_abc(lon, 180.0)}


# ── Internal render grid ─────────────────────────────────────────────────────
@dataclass
class BBox:
    west: float
    south: float
    east: float
    north: float

    def contains(self, lat: float, lon: float) -> bool:
        return self.west <= lon <= self.east and self.south <= lat <= self.north


def latlon_to_grid(lat: float, lon: float, bbox: BBox, w: int, h: int) -> tuple[int, int]:
    x_norm = (lon - bbox.west) / (bbox.east - bbox.west)
    y_norm = (bbox.north - lat) / (bbox.north - bbox.south)  # row 0 = north
    col = round(max(0.0, min(1.0, x_norm)) * (w - 1))
    row = round(max(0.0, min(1.0, y_norm)) * (h - 1))
    return row, col


def bearing_range(lat1, lon1, lat2, lon2) -> tuple[float, float]:
    """Forward azimuth (deg) and geodesic distance (m) point1→point2."""
    az, _, dist = _GEOD.inv(lon1, lat1, lon2, lat2)
    return (az % 360.0), dist


# ── Full packet ──────────────────────────────────────────────────────────────
@dataclass
class CoordPacket:
    name: str
    lat: float
    lon: float
    dms: dict
    utm: dict
    mgrs: str
    ucrs: dict
    grid: Optional[dict] = None
    elevation_m: Optional[float] = None
    surface_class: Optional[str] = None
    agl_m: Optional[float] = None

    def to_dict(self) -> dict:
        return asdict(self)


def coord_packet(name, lat, lon, bbox=None, grid_w=None, grid_h=None,
                 elevation_m=None, surface_class=None, agl_m=None) -> CoordPacket:
    grid = None
    if bbox and grid_w and grid_h:
        row, col = latlon_to_grid(lat, lon, bbox, grid_w, grid_h)
        grid = {"row": row, "col": col}
    return CoordPacket(
        name=name, lat=lat, lon=lon,
        dms=latlon_to_dms(lat, lon),
        utm=latlon_to_utm(lat, lon),
        mgrs=latlon_to_mgrs(lat, lon),
        ucrs=latlon_to_ucrs(lat, lon),
        grid=grid, elevation_m=elevation_m,
        surface_class=surface_class, agl_m=agl_m,
    )


if __name__ == "__main__":
    import json
    p = coord_packet("Camp Blanding", 29.9519, -81.9799,
                     bbox=BBox(-83.0183, 29.0526, -80.9415, 30.8512),
                     grid_w=160, grid_h=160, elevation_m=38.4, surface_class="land")
    print(json.dumps(p.to_dict(), indent=2, ensure_ascii=False))
