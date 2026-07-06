
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Line3DCollection

# X-BAT-inspired conceptual wireframe — 3rd Pass.
# User-guided update: rear/aft wings corrected from vertical reference.
#
# This is a visual approximation from user-provided public imagery.
# It is not an engineering model, not a replica, and contains no flight/aero/weapon data.
#
# Orientation:
# X = wingspan left/right
# Y = depth/thickness front/back
# Z = vertical nose-up axis

HEIGHT = 26.0
Z_TOP = HEIGHT / 2.0
Z_BOTTOM = -HEIGHT / 2.0

# 3rd-pass vertical silhouette.
# The important update is the aft-wing/rear-wing region:
# - broad root blend at mid-lower body
# - straighter outer wing panel
# - clipped angular tip
# - inward lower notch near the fuselage
# - lower center keel taper
SILHOUETTE = np.array([
    [ 13.00,  0.00],   # top nose point
    [ 12.15,  0.95],
    [ 10.80,  2.05],
    [  8.90,  3.35],
    [  6.90,  4.75],
    [  4.85,  6.20],
    [  2.80,  8.10],
    [  0.55, 10.90],
    [ -1.85, 13.75],
    [ -3.95, 16.10],  # upper aft wing sweep
    [ -5.45, 18.30],  # outer panel leading corner
    [ -6.55, 19.45],  # max span / clipped upper tip
    [ -7.90, 19.05],  # clipped vertical-ish tip face
    [ -9.20, 17.45],  # lower tip transition
    [-10.45, 14.35],  # descending aft wing edge
    [-11.45, 10.60],  # rear wing lower edge
    [-12.45,  6.10],  # inward notch region
    [-13.00,  2.70],  # lower centerbody taper
], dtype=float)

def half_width(z):
    zs = SILHOUETTE[:, 0]
    ws = SILHOUETTE[:, 1]
    order = np.argsort(zs)
    return float(np.interp(z, zs[order], ws[order]))

def depth_profile(z, x):
    hw = max(half_width(z), 1e-6)
    span_frac = min(abs(x) / hw, 1.0) if hw > 0.05 else 0.0
    z_norm = (z - Z_BOTTOM) / (Z_TOP - Z_BOTTOM)

    vertical_bulge = np.sin(np.pi * z_norm) ** 0.68
    body_core = np.exp(-(x / max(hw * 0.34, 0.85)) ** 2)
    wing_slab = np.clip(1.0 - 0.88 * span_frac ** 1.85, 0.075, 1.0)

    # Full centerbody, thin rear wings
    depth = 0.34 + 2.25 * vertical_bulge * wing_slab + 1.62 * body_core * vertical_bulge

    # Lower center keel / aft body pod visible in reference
    if z < -1.6:
        depth += 0.35 * np.exp(-(x / 2.65) ** 2) * min((-z - 1.6) / 11.0, 1.0)

    # Make outer rear wing panels flatter/slabbier than the body
    if z < -4.5 and abs(x) > hw * 0.55:
        depth *= 0.68

    return depth

def surface_point(z, x, side=1.0, offset=0.0):
    y = side * depth_profile(z, x) + offset
    return np.array([x, y, z], dtype=float)

def add_line(segments, a, b):
    segments.append((np.array(a, dtype=float), np.array(b, dtype=float)))

def poly_on_surface(segments, pts_zx, side=1.0, offset=0.075, closed=True):
    pts = [surface_point(z, x, side, offset) for z, x in pts_zx]
    for a, b in zip(pts, pts[1:]):
        add_line(segments, a, b)
    if closed and len(pts) > 2:
        add_line(segments, pts[-1], pts[0])

def build_wireframe(n_z=23, n_span=17):
    segments = []
    z_stations = np.linspace(Z_TOP, Z_BOTTOM, n_z)
    v_stations = np.linspace(-1.0, 1.0, n_span)

    # Front/back vertical ribs
    for side in [1.0, -1.0]:
        for v in v_stations:
            pts = []
            for z in z_stations:
                x = half_width(z) * v
                pts.append(surface_point(z, x, side))
            segments += list(zip(pts[:-1], pts[1:]))

    # Front/back span ribs
    for side in [1.0, -1.0]:
        for z in z_stations[1:-1]:
            hw = half_width(z)
            xs = np.linspace(-hw, hw, n_span)
            pts = [surface_point(z, x, side) for x in xs]
            segments += list(zip(pts[:-1], pts[1:]))

    # Depth/thickness ribs
    for z in z_stations[1:-1:2]:
        hw = half_width(z)
        for x in np.linspace(-hw, hw, 9):
            add_line(segments, surface_point(z, x, 1.0), surface_point(z, x, -1.0))

    # Outer outline, top/front and rear/back
    outline_right = [(z, half_width(z)) for z in z_stations]
    outline_left = [(z, -half_width(z)) for z in z_stations[::-1]]
    outline = outline_right + outline_left

    for side in [1.0, -1.0]:
        pts = [surface_point(z, x, side) for z, x in outline]
        for a, b in zip(pts, pts[1:] + [pts[0]]):
            add_line(segments, a, b)

    # Center raised spine
    center_pts = [surface_point(z, 0.0, 1.0, 0.16) for z in z_stations]
    segments += list(zip(center_pts[:-1], center_pts[1:]))

    # Body-to-wing crease lines
    for m in [-1.0, 1.0]:
        poly_on_surface(segments, [
            (11.4,  0.42*m),
            (7.2,   2.35*m),
            (3.4,   5.1*m),
            (-0.8,  9.2*m),
            (-4.7,  15.6*m),
            (-6.4,  18.2*m),
        ], offset=0.115, closed=False)

    # Corrected rear/aft wing edge panel lines:
    # These lines emphasize the clipped panel and lower inward notch.
    for m in [-1.0, 1.0]:
        # Outer clipped tip face
        poly_on_surface(segments, [
            (-5.55, 18.35*m),
            (-6.65, 19.25*m),
            (-7.95, 18.95*m),
            (-9.25, 17.35*m),
        ], offset=0.16, closed=False)

        # Lower rear wing edge / control-surface outline
        poly_on_surface(segments, [
            (-6.25, 11.15*m),
            (-7.20, 17.30*m),
            (-9.45, 16.55*m),
            (-10.72, 13.55*m),
            (-9.42, 9.45*m),
            (-7.05, 9.95*m),
        ], offset=0.145, closed=True)

        # Inboard rear notch near fuselage
        poly_on_surface(segments, [
            (-9.9, 6.8*m),
            (-11.35, 9.75*m),
            (-12.35, 5.7*m),
            (-11.25, 2.9*m),
        ], offset=0.13, closed=False)

    # Top faceted nose / sensors / communications patches
    poly_on_surface(segments, [
        (12.45,-0.48), (12.88,0.0), (12.45,0.48),
        (11.58,0.70), (10.96,0.0), (11.58,-0.70)
    ], offset=0.20)

    poly_on_surface(segments, [
        (10.25,-1.42), (9.45,-0.42), (9.90,0.58),
        (10.85,1.26), (11.20,0.10), (10.85,-0.98)
    ], offset=0.15)

    poly_on_surface(segments, [
        (7.70,-1.85), (6.90,-0.52), (7.28,0.68),
        (8.30,1.42), (8.85,0.06), (8.45,-1.25)
    ], offset=0.13)

    poly_on_surface(segments, [
        (4.78,-1.55), (4.00,-0.34), (4.55,0.68),
        (5.48,1.18), (6.05,0.02), (5.72,-1.05)
    ], offset=0.12)

    # Small triangular marker cues
    for z, x in [(6.85,-2.65), (6.85,2.65), (3.25,-3.25), (3.25,3.25), (0.55,-2.0), (0.55,2.0)]:
        poly_on_surface(segments, [(z+0.20,x), (z-0.16,x-0.25), (z-0.16,x+0.25)], offset=0.21)

    # Central engine/inlet bay rectangle + inner marker
    poly_on_surface(segments, [
        (0.65,-2.15), (0.65,2.15), (-2.45,2.15), (-2.45,-2.15)
    ], offset=0.165)

    hex_pts = []
    for a in np.linspace(0, 2*np.pi, 7)[:-1]:
        hex_pts.append((-1.00 + 0.76*np.sin(a), 0.82*np.cos(a)))
    poly_on_surface(segments, hex_pts, offset=0.23)

    # Rear/nozzle cue under centerbody
    ring_center = np.array([0.0, -3.30, -10.85])
    rx, rz = 1.48, 0.72
    ring = [ring_center + np.array([rx*np.cos(a), 0.0, rz*np.sin(a)]) for a in np.linspace(0, 2*np.pi, 32, endpoint=False)]
    for a, b in zip(ring, ring[1:] + [ring[0]]):
        add_line(segments, a, b)

    # Launch pedestal reference block behind body, matching upright display
    stand_y = -4.05
    stand = [
        np.array([-1.05, stand_y, 9.3]),
        np.array([ 1.05, stand_y, 9.3]),
        np.array([ 1.05, stand_y,-13.2]),
        np.array([-1.05, stand_y,-13.2]),
    ]
    for a, b in zip(stand, stand[1:] + [stand[0]]):
        add_line(segments, a, b)
    add_line(segments, stand[0], stand[2])
    add_line(segments, stand[1], stand[3])

    return segments

def export_obj(path="/mnt/data/xbat_3rdpass_wireframe.obj"):
    segments = build_wireframe()
    vertices = []
    lines = []
    for a, b in segments:
        ia = len(vertices) + 1
        vertices.append(a)
        ib = len(vertices) + 1
        vertices.append(b)
        lines.append((ia, ib))

    with open(path, "w") as f:
        f.write("# X-BAT-inspired conceptual 3rd-pass line wireframe\n")
        f.write("# X span, Y depth, Z vertical nose-up axis\n")
        for v in vertices:
            f.write(f"v {v[0]:.6f} {v[1]:.6f} {v[2]:.6f}\n")
        for ia, ib in lines:
            f.write(f"l {ia} {ib}\n")

def set_equal_axes(ax, pts, pad=1.03):
    mins = pts.min(axis=0)
    maxs = pts.max(axis=0)
    center = (mins + maxs) / 2.0
    radius = (maxs - mins).max() / 2.0 * pad
    ax.set_xlim(center[0] - radius, center[0] + radius)
    ax.set_ylim(center[1] - radius, center[1] + radius)
    ax.set_zlim(center[2] - radius, center[2] + radius)

def render_view(path, title, elev, azim, figsize=(8,8), lw=1.05):
    segments = build_wireframe()
    pts = np.array([p for seg in segments for p in seg])

    fig = plt.figure(figsize=figsize)
    ax = fig.add_subplot(111, projection="3d")
    ax.add_collection3d(Line3DCollection(segments, linewidths=lw))
    set_equal_axes(ax, pts)
    ax.set_proj_type("ortho")
    ax.view_init(elev=elev, azim=azim)
    ax.set_xlabel("X span")
    ax.set_ylabel("Y depth")
    ax.set_zlabel("Z vertical")
    ax.set_title(title)
    plt.tight_layout()
    plt.savefig(path, dpi=190)
    plt.close(fig)

def render_sheet(path="/mnt/data/xbat_3rdpass_wireframe_sheet.png"):
    segments = build_wireframe()
    pts = np.array([p for seg in segments for p in seg])

    views = [
        ("Front-Top Oblique", 18, -67),
        ("Front View", 0, -90),
        ("Top View", 90, -90),
        ("Side View", 0, 0),
    ]

    fig = plt.figure(figsize=(18,12))
    for i, (title, elev, azim) in enumerate(views, start=1):
        ax = fig.add_subplot(2,2,i,projection="3d")
        ax.add_collection3d(Line3DCollection(segments, linewidths=0.95))
        set_equal_axes(ax, pts)
        ax.set_proj_type("ortho")
        ax.view_init(elev=elev, azim=azim)
        ax.set_title(title)
        ax.set_xlabel("X")
        ax.set_ylabel("Y")
        ax.set_zlabel("Z")
    plt.tight_layout()
    plt.savefig(path, dpi=190)
    plt.close(fig)

if __name__ == "__main__":
    render_view("/mnt/data/xbat_3rdpass_front_top_wireframe.png", "X-BAT 3rd Pass — Front-Top Oblique", 18, -67, figsize=(9,8))
    render_view("/mnt/data/xbat_3rdpass_front_wireframe.png", "X-BAT 3rd Pass — Front View", 0, -90)
    render_view("/mnt/data/xbat_3rdpass_top_wireframe.png", "X-BAT 3rd Pass — Top View", 90, -90)
    render_view("/mnt/data/xbat_3rdpass_side_wireframe.png", "X-BAT 3rd Pass — Side View", 0, 0)
    render_sheet("/mnt/data/xbat_3rdpass_wireframe_sheet.png")
    export_obj("/mnt/data/xbat_3rdpass_wireframe.obj")
