"""
SECURITY-2525 · MGRS Wireframe — Tactical Terrain + Subsurface render (prototype)
=================================================================================
UI/UX assessment prototype. Renders the neon tactical blueprint described by the
ChatGPT + Grok specs, with the additions the operator requested:

  • real STATE + COUNTRY borders (Natural Earth), draped on terrain, in red
  • terrain GRID wireframe (green land)  ·  water surface (blue)
  • SUBSURFACE bathymetry below water level (cyan dashed)
  • ELEVATION / AGL highlighted in RED:
      - red vertical PROFILE BOX per marker (base box on ground + top box at AGL)
      - red ELEVATION OUTLINE around the whole AO (profile "all the way around")
  • MGRS-style grid overlay + coordinate-packet markers

Synthetic Florida-style terrain for now (Phase 0/3). Swap `synthetic_terrain`
for real Copernicus GLO-30 (land) + GEBCO (bathymetry) in the preprocessor phase.
Run:  .venv/bin/python wireframe_demo.py
"""
from __future__ import annotations
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Line3DCollection

from coordinate_engine import BBox, latlon_to_grid, coord_packet
from borders import load_borders

# ── Scenario (Camp Blanding AO, ~100 km radius) ──────────────────────────────
BBOX = BBox(-83.0183, 29.0526, -80.9415, 30.8512)
GRID = 120                 # medium fidelity default
VEXAG = 28.0               # vertical exaggeration (Florida terrain is subtle)
BATHY_EXAG = 28.0
WATER_LEVEL_M = 8.0        # nominal river/wetland surface elevation

# Locked color law (R-CORE Consolidation 1 §7 — HYBRID red):
#   green land · dim blue water · cyan dashed subsurface · red = borders/warnings
#   AGL + elevation emphasis = GOLD by default, → RED only on a risk trigger.
COL = {
    "land": "#00ff9f", "water": "#00bfff", "bathy": "#00ffff",
    "border_state": "#ff8c00", "border_country": "#ff4444",
    "ao": "#ff4444", "grid": "#2b3b47",
    "gold": "#ffd400", "risk": "#ff3b3b",
    "bg": "#0a0a0f",
}
# "Where we are looking" focus outline — user-identified, ORANGE by default.
# User can change both the color and the outline method (edge silhouette / AO box / contour).
OUTLINE_COLOR = "#ff8c00"
OUTLINE_METHOD = "edges"   # "edges" (perimeter silhouette) | "ao_box" | "contour"
MARKERS = [
    # name, lat, lon, color, agl_m, risk (True → AGL box turns red)
    ("Camp Blanding (SSG AO)", 29.9519, -81.9799, "#ffd400", 45.0, False),  # sensor tower
    ("Gainesville (SW)",       29.6516, -82.3248, "#ff00ff", 0.0, False),
    ("Jacksonville (NE)",      30.3322, -81.6557, "#00ffff", 0.0, False),
]


# ── Synthetic terrain + hydrography (replace with real DEM/GEBCO later) ───────
def synthetic_terrain(n: int):
    ys, xs = np.mgrid[0:n, 0:n] / (n - 1)
    # gentle Florida rolls
    z = (18 * np.sin(3.0 * xs + 0.4) * np.cos(2.2 * ys)
         + 12 * np.cos(4.1 * ys) + 10 * xs + 8
         + 6 * np.sin(7.0 * xs) * np.sin(5.0 * ys))   # secondary rolls
    rng = np.random.default_rng(2525)
    z += rng.normal(0, 0.6, z.shape)                  # light micro-relief
    # smooth a few passes so it reads as terrain, not grass (real DEM replaces this)
    for _ in range(3):
        z = (z + np.roll(z, 1, 0) + np.roll(z, -1, 0)
             + np.roll(z, 1, 1) + np.roll(z, -1, 1)) / 5.0
    z = np.clip(z, 0, None)

    # river corridor: curved diagonal band (water)
    river = np.abs((ys - 0.45) - 0.25 * np.sin(4.0 * xs)) < 0.05
    # wetland pocket near Camp Blanding (AO center)
    wet = ((xs - 0.5) ** 2 + (ys - 0.5) ** 2) < 0.010
    water = river | wet

    depth = np.zeros_like(z)
    depth[water] = 3.0 + 5.0 * np.exp(-((ys[water] - 0.45) ** 2) / 0.0015)  # ~3–8 m
    z[water] = WATER_LEVEL_M          # flatten to water surface
    return z, water, depth


def grid_xy(n: int):
    return np.meshgrid(np.arange(n), np.arange(n))  # X=col, Y=row


def _drape_z(row, col, Z, n):
    r = int(np.clip(row, 0, n - 1)); c = int(np.clip(col, 0, n - 1))
    return Z[r, c] * VEXAG


# ── Render one view ──────────────────────────────────────────────────────────
def render(view: str, elev: float, azim: float, path: str):
    n = GRID
    Z, water, depth = synthetic_terrain(n)
    X, Y = grid_xy(n)
    Zex = Z * VEXAG

    fig = plt.figure(figsize=(15, 12), facecolor=COL["bg"])
    ax = fig.add_subplot(111, projection="3d", facecolor=COL["bg"])

    # LAND wireframe (green) — mask water cells to NaN
    Zland = np.where(water, np.nan, Zex)
    ax.plot_wireframe(X, Y, Zland, rstride=2, cstride=2,
                      color=COL["land"], linewidth=0.5, alpha=0.85)

    # WATER surface (blue) — flat sheet where water
    Zwater = np.where(water, WATER_LEVEL_M * VEXAG, np.nan)
    ax.plot_wireframe(X, Y, Zwater, rstride=2, cstride=2,
                      color=COL["water"], linewidth=0.7, alpha=0.9)

    # SUBSURFACE bathymetry (cyan dashed) — below water level
    Zbathy = np.where(water, (WATER_LEVEL_M - depth * (BATHY_EXAG / VEXAG)) * VEXAG, np.nan)
    # emulate bathy_density: draw every 3rd line
    ax.plot_wireframe(X, Y, Zbathy, rstride=3, cstride=3,
                      color=COL["bathy"], linewidth=0.6, alpha=0.8,
                      linestyle=(0, (4, 3)))

    # FOCUS OUTLINE — "where we are looking" elevation profile. User-identified
    # color (ORANGE default) + selectable method (edges silhouette / AO box / contour).
    if OUTLINE_METHOD in ("edges",):
        for edge in ("top", "bottom", "left", "right"):
            if edge == "top":    xs, ys = np.arange(n), np.zeros(n, int)
            elif edge == "bottom": xs, ys = np.arange(n), np.full(n, n - 1)
            elif edge == "left":  xs, ys = np.zeros(n, int), np.arange(n)
            else:                 xs, ys = np.full(n, n - 1), np.arange(n)
            zs = Zex[ys, xs]
            ax.plot(xs, ys, zs, color=OUTLINE_COLOR, linewidth=2.2, alpha=0.95)
            # drop "curtain" verticals every 12 cells to read the profile
            for i in range(0, n, 12):
                ax.plot([xs[i], xs[i]], [ys[i], ys[i]], [0, zs[i]],
                        color=OUTLINE_COLOR, linewidth=0.5, alpha=0.35)

    # BORDERS draped (state=orange, country=red)
    borders = load_borders(BBOX)
    for kind, key in (("country", "border_country"), ("state", "border_state")):
        for pl in borders.get(kind, []):
            rc = [latlon_to_grid(la, lo, BBOX, n, n) for (la, lo) in pl]
            xs = [c for (_, c) in rc]; ys = [r for (r, _) in rc]
            zs = [_drape_z(r, c, Z, n) + 6 for (r, c) in rc]
            ax.plot(xs, ys, zs, color=COL[key], linewidth=1.8, alpha=0.9)

    # AO boundary box (red frame at altitude, as in Grok render)
    ao_z = (Zex.max() + 40)
    ax.plot([0, n - 1, n - 1, 0, 0], [0, 0, n - 1, n - 1, 0],
            [ao_z] * 5, color=COL["ao"], linewidth=2.5, alpha=0.8)

    # MARKERS + AGL profile boxes (GOLD default, RED only on risk trigger)
    for name, lat, lon, mcol, agl, risk in MARKERS:
        row, col = latlon_to_grid(lat, lon, BBOX, n, n)
        gz = _drape_z(row, col, Z, n)
        ax.scatter([col], [row], [gz + 4], color=mcol, s=90,
                   marker="*", edgecolors="white", linewidths=0.6, depthshade=False)
        ax.text(col, row, gz + 30, name, color=mcol, fontsize=8)
        if agl > 0:
            _agl_box(ax, col, row, gz, agl * VEXAG,
                     color=COL["risk"] if risk else COL["gold"])

    _style(ax, view, elev, azim, n, Zex)
    fig.suptitle("SECURITY-2525  ·  MGRS WIREFRAME v0.4  —  Camp Blanding AO",
                 color=COL["land"], fontsize=15, y=0.955)
    ax.set_title(f"Green=Land  Blue=Water  Cyan=Subsurface  Gold=AGL(→Red on risk)  Orange=Focus  Red=Borders   [{view.upper()} VIEW]",
                 color="#9fb3c8", fontsize=10, pad=2)
    fig.savefig(path, dpi=115, facecolor=COL["bg"], bbox_inches="tight")
    plt.close(fig)
    print(f"  wrote {path}")


def _agl_box(ax, col, row, z0, h, color, d=3.0):
    """AGL wireframe column: base box on ground + top box at AGL height.
    color = gold (default) or red (risk trigger) per the hybrid color law."""
    z1 = z0 + h
    corners = [(-d, -d), (d, -d), (d, d), (-d, d)]
    for z in (z0, z1):  # top + bottom boxes
        loop = corners + [corners[0]]
        ax.plot([col + cx for cx, _ in loop], [row + cy for _, cy in loop],
                [z] * 5, color=color, linewidth=1.6, alpha=0.95)
    for cx, cy in corners:  # verticals
        ax.plot([col + cx, col + cx], [row + cy, row + cy], [z0, z1],
                color=color, linewidth=1.2, alpha=0.85)


def _style(ax, view, elev, azim, n, Zex):
    ax.view_init(elev=elev, azim=azim)
    ax.set_xlabel("Easting (grid col →)", color="#7f9bb3", fontsize=8)
    ax.set_ylabel("Northing (grid row →)", color="#7f9bb3", fontsize=8)
    ax.set_zlabel("Elevation (×vexag)", color="#7f9bb3", fontsize=8)
    ax.set_xlim(0, n - 1); ax.set_ylim(0, n - 1)
    ax.set_zlim(0, Zex.max() + 60)
    ax.invert_yaxis()  # row 0 (north) at back/top
    for pane in (ax.xaxis, ax.yaxis, ax.zaxis):
        pane.set_pane_color((0.04, 0.04, 0.06, 1.0))
        pane._axinfo["grid"]["color"] = COL["grid"]
        pane._axinfo["grid"]["linewidth"] = 0.4
    ax.tick_params(colors="#5a6b7a", labelsize=6)
    if view == "overhead":
        ax.set_zticks([])


if __name__ == "__main__":
    print("SECURITY-2525 wireframe — rendering prototype views…")
    render("oblique", elev=42, azim=-60, path="out/camp_blanding_oblique.png")
    render("overhead", elev=89, azim=-90, path="out/camp_blanding_overhead.png")
    # coordinate packets for the record
    import json
    packets = [coord_packet(n_, la, lo, BBOX, GRID, GRID, agl_m=agl)
               for (n_, la, lo, _, agl, _risk) in MARKERS]
    with open("out/coord_packets.json", "w") as f:
        json.dump([p.to_dict() for p in packets], f, indent=2, ensure_ascii=False)
    print("  wrote out/coord_packets.json")
    print("done.")
