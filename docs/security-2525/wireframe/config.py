"""
SECURITY-2525 · MGRS Wireframe — LOCKED defaults (R-CORE Consolidation 2)
========================================================================
Build-ready defaults reconciled from both SSSES pressure-tests (Grok + eXeL AI
GPT). These are the single source of truth for the preprocessor + renderer.
See ../RCORE_CONSOLIDATION_2.md for rationale. Prototype status — NOT certified.
"""

# ── Fidelity ─────────────────────────────────────────────────────────────────
FIDELITY = {
    "low":    {"grid": 80,  "rib_spacing_cells": 20, "min_depth_m": 2.0, "mgrs_spacing_m": 10000, "bathy_stride": 4},
    "medium": {"grid": 160, "rib_spacing_cells": 12, "min_depth_m": 1.0, "mgrs_spacing_m": 5000,  "bathy_stride": 3},
    "high":   {"grid": 300, "rib_spacing_cells": 6,  "min_depth_m": 0.5, "mgrs_spacing_m": 1000,  "bathy_stride": 2},
}

# ── Line budgets (hard caps) ─────────────────────────────────────────────────
LINE_BUDGET = {"mobile": 20_000, "tablet": 50_000, "desktop": 100_000}
MAX_RIBS_VISIBLE = {"mobile": 200, "tablet": 400, "desktop": 1000}

# ── Sparse depth ribs — ADAPTIVE first, spacing as fallback ──────────────────
# Ribs render only where they add understanding (not uniformly).
RIB = {
    "placement": [  # priority reasons a rib is drawn
        "water_body_centroid", "deepest_point", "shallowest_safe_crossing",
        "selected_transect", "inflection_point", "river_centerline_every_n",
    ],
    "per_body": {          # caps by water-body size (reconciled Grok 4–6 core + GPT bands)
        "small": {"min": 3,  "max": 12},   # ponds
        "medium": {"min": 4, "max": 40},   # lakes / rivers (core visual read = 4–6)
        "large": {"decimate_by": "screen_space"},
    },
    "min_spacing_m": 400,          # Grok 300–800 m along primary axis
    "max_spacing_m": 800,
    "uniform_only_if": "diagnostic_mode",
    "opacity": 0.6,
}

# ── Vertical datum — EGM2008 orthometric default ─────────────────────────────
VERTICAL = {
    "target_datum": "EGM2008",          # orthometric meters, MSL-aligned
    "horizontal_datum": "WGS84",        # EPSG:4326 in; UTM (17N Camp Blanding) internal
    "units": "meters",
    "water_level_default_m": 0.0,       # local water ref unless real data exists
    "confidence": {                     # per-fusion vertical confidence score
        "all_known_normalized": 100, "all_known_minor_mismatch": 80,
        "one_approximated": 60, "one_missing_datum": 40, "multiple_unknown": 0,
    },
    "gates": {                          # certification thresholds
        "certified_min": 80, "operational_min": 70,
        "training_below_70": "allow_with_warning",
        "block_certified_if_datum_unknown": True,
    },
}

# ── Risk triggers — GOLD → ORANGE → RED (red = warning/border only) ──────────
# Visualization thresholds, NOT operational clearance. Scenario-tunable.
RISK = {
    "fording_depth_m": {                # reconciled: strictest when platform unknown
        "unknown":   {"orange": 0.4, "red": 0.7},   # default = conservative
        "personnel": {"orange": 0.4, "red": 0.7},
        "vehicle":   {"orange": 0.6, "red": 1.2},
        "force_red_if": ["flow_velocity_unknown_and_crossing", "bathy_confidence_low",
                          "water_level_stale", "nodata_on_transect"],
        "force_orange_if": ["interpolated_depth"],
        "disclaimer": "Depth visualization only. Not a crossing clearance.",
    },
    "los": {                            # line-of-sight clearance along ray
        "observer_height_m": {"person": 2, "vehicle_mast": 10, "tower_drone": 30},
        "target_height_m": 2,
        "clear_min_clearance_m": 5,     # >5 m = clear (green)
        "marginal_clearance_m": [0, 5], # 0–5 m = orange
        "obstruction_angle_deg": {"orange": 4, "red": 8},
        "red_if": ["ray_intersects_terrain", "confidence_below_60"],
        "orange_if": ["confidence_60_to_80", "vexag_active_visual", "dsm_used_needs_bare_earth"],
        "disclaimer": "LOS estimate depends on DEM type, object heights, and vertical datum.",
    },
    "envelope": {                       # generalized risk envelope / boundary (NOT weapon modeling)
        "boundary_caution_km": 1.0,     # orange within 1 km of restricted boundary
        "ao_radius_caution_pct": 5,     # orange within 5% of AO boundary radius
        "example_threat_radius_km": {"area": 2.5, "close_in": 0.5},  # tunable example only
        "red_if": ["inside_or_crossing_restricted", "outside_ao", "boundary_source_unknown_restricted_mode"],
        "language": ["risk envelope", "restricted zone", "hazard area", "mission boundary"],
    },
    "revert": "gold_when_risk_clears",  # red is transient, not permanent
}

# ── Vertical exaggeration ────────────────────────────────────────────────────
VEXAG = {"default": 10, "low_relief_max": 25, "warn_above": 50, "diagnostic_above": 100}

# ── Locked visual law (opacity + color) ──────────────────────────────────────
OPACITY = {"water_surface": 0.25, "bathymetry": 0.75, "depth_rib": 0.6}
COLOR = {
    "land": "#00ff9f", "water": "#00bfff", "bathy": "#00ffff",
    "border": "#ef4444", "warn_caution": "#f59e0b", "warn_critical": "#ef4444",
    "selected": "#ffd400", "agl_gold": "#ffd400", "agl_risk": "#ef4444",
    "focus_outline": "#ff8c00", "grid": "#dfe7ee", "labels": "#e5edf5",
}

# ── Export modes ─────────────────────────────────────────────────────────────
EXPORT_MODES = ["public", "training", "internal", "restricted"]

# ── Camp Blanding scenario (default AO) ──────────────────────────────────────
SCENARIO_CAMP_BLANDING = {
    "bbox": [-83.0183, 29.0526, -80.9415, 30.8512],  # W,S,E,N (~100 km radius)
    "utm_zone": "17N",
    "points": {
        "camp_blanding": (29.9519, -81.9799),
        "gainesville": (29.6516, -82.3248),
        "jacksonville": (30.3322, -81.6557),
    },
    "vexag": 25,  # low-relief Florida
}
