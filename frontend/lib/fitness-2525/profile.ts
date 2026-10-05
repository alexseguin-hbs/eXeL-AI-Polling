/**
 * Fitness-2525 · athlete profile math + device persistence (pure helpers).
 * Never prefills numbers. Hydration rules cited in docs/fitness-2525/ENERGY_MODEL.md
 * (ACSM Exercise and Fluid Replacement position stand).
 */
import type {
  FitFluid, FitProfile, FitRateUnitSetting, FitUnitSystem, FitWeight,
} from "./types";

export const DEVICE_PROFILE_KEY = "fit2525-profile";
export const DEVICE_SETTINGS_KEY = "fit2525-settings";
export const RATE_UNIT_ORDER: FitRateUnitSetting[] = ["per_hr", "per_min", "per_sec"];
export const RATE_UNIT_LABEL: Record<FitRateUnitSetting, string> = { per_hr: "cal/hr", per_min: "cal/min", per_sec: "cal/sec" };
export const DEFAULT_RATE_UNIT: FitRateUnitSetting = "per_min";
/** ACSM: >2% body-mass loss degrades endurance performance. */
export const DEHYDRATION_WARN_PCT = 2;
/** ACSM: replace ~1.25–1.5 L fluid per kg body mass lost. */
export const REHYDRATE_LOW = 1.25;
export const REHYDRATE_HIGH = 1.5;

export function emptyProfile(): FitProfile {
  return { v: 1, units: "imperial", settings: { rate_unit: DEFAULT_RATE_UNIT, show_all_rates: false }, at: 0 };
}

export function isRateUnit(u: unknown): u is FitRateUnitSetting {
  return u === "per_hr" || u === "per_min" || u === "per_sec";
}

export function loadDeviceProfile(): FitProfile {
  try {
    const raw = localStorage.getItem(DEVICE_PROFILE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as FitProfile;
      if (p && p.v === 1) return { ...emptyProfile(), ...p, settings: { ...emptyProfile().settings, ...(p.settings ?? {}) } };
    }
  } catch { /* ignore */ }
  // Legacy standalone settings key (rate unit chosen before a profile existed).
  const base = emptyProfile();
  try {
    const s = JSON.parse(localStorage.getItem(DEVICE_SETTINGS_KEY) ?? "null");
    if (s && isRateUnit(s.rate_unit)) base.settings = { ...base.settings, rate_unit: s.rate_unit, show_all_rates: !!s.show_all_rates };
  } catch { /* ignore */ }
  return base;
}

export function saveDeviceProfile(p: FitProfile): void {
  try {
    localStorage.setItem(DEVICE_PROFILE_KEY, JSON.stringify(p));
    localStorage.setItem(DEVICE_SETTINGS_KEY, JSON.stringify(p.settings ?? {}));
  } catch { /* ignore */ }
}

// ── units ────────────────────────────────────────────────────────────────
export const LB_PER_KG = 2.2046226218;
export function weightUnitFor(units: FitUnitSystem): "lb" | "kg" { return units === "metric" ? "kg" : "lb"; }
export function heightUnitFor(units: FitUnitSystem): "in" | "cm" { return units === "metric" ? "cm" : "in"; }
export function fluidUnitFor(units: FitUnitSystem): "oz" | "ml" { return units === "metric" ? "ml" : "oz"; }

export function toKg(w: FitWeight | null | undefined): number | null {
  if (!w || typeof w.value !== "number" || !Number.isFinite(w.value) || w.value <= 0) return null;
  return w.unit === "kg" ? w.value : w.value / LB_PER_KG;
}
export function kgTo(kg: number | null, units: FitUnitSystem): number | null {
  if (kg == null || !Number.isFinite(kg)) return null;
  return units === "metric" ? kg : kg * LB_PER_KG;
}
export function fluidKg(f: FitFluid | null | undefined): number | null {
  if (!f || typeof f.value !== "number" || !Number.isFinite(f.value) || f.value < 0) return null;
  return f.unit === "ml" ? f.value / 1000 : f.value * 0.0295735; // 1 L water ≈ 1 kg
}
export function heightCm(p: FitProfile): number | null {
  const h = p.height;
  if (typeof h !== "number" || !Number.isFinite(h) || h <= 0) return null;
  return p.units === "metric" ? h : h * 2.54;
}
export function fmtWeight(kg: number | null, units: FitUnitSystem, digits = 1): string {
  const v = kgTo(kg, units);
  return v == null ? "—" : `${v.toFixed(digits)} ${weightUnitFor(units)}`;
}
/** Litres → display fluid (oz or ml). */
export function fmtFluidL(l: number | null, units: FitUnitSystem): string {
  if (l == null || !Number.isFinite(l)) return "—";
  return units === "metric" ? `${Math.round(l * 1000)} ml` : `${(l / 0.0295735).toFixed(0)} oz`;
}

// ── hydration / sweat ───────────────────────────────────────────────────
export interface SweatResult {
  /** Body-mass change pre − post (kg). */
  massLossKg: number | null;
  /** Sweat loss = pre − post + fluids drunk (kg ≈ L). */
  sweatKg: number | null;
  /** (pre − post) / pre × 100. */
  pctBodyMass: number | null;
  warn: boolean;
  /** Rehydration target range in litres (1.25–1.5 × body-mass deficit). */
  rehydrateL: [number, number] | null;
  usedMorningAsPre: boolean;
}

export function sweatLoss(opts: {
  pre?: FitWeight | null;
  morning?: FitWeight | null;
  post?: FitWeight | null;
  fluids?: FitFluid | null;
}): SweatResult {
  const preKg = toKg(opts.pre) ?? toKg(opts.morning);
  const usedMorningAsPre = toKg(opts.pre) == null && toKg(opts.morning) != null;
  const postKg = toKg(opts.post);
  const empty: SweatResult = { massLossKg: null, sweatKg: null, pctBodyMass: null, warn: false, rehydrateL: null, usedMorningAsPre };
  if (preKg == null || postKg == null) return empty;
  const massLossKg = preKg - postKg;
  const drunk = fluidKg(opts.fluids) ?? 0;
  const pct = (massLossKg / preKg) * 100;
  const deficit = Math.max(0, massLossKg);
  return {
    massLossKg,
    sweatKg: massLossKg + drunk,
    pctBodyMass: pct,
    warn: pct >= DEHYDRATION_WARN_PCT,
    rehydrateL: deficit > 0 ? [deficit * REHYDRATE_LOW, deficit * REHYDRATE_HIGH] : null,
    usedMorningAsPre,
  };
}

/** Day water swing = morning − evening (kg). */
export function daySwingKg(morning?: FitWeight | null, evening?: FitWeight | null): number | null {
  const m = toKg(morning), e = toKg(evening);
  return m == null || e == null ? null : m - e;
}

/** Goal remaining from the latest MORNING weight (kg); null if either missing. */
export function goalRemainingKg(latestMorningKg: number | null, p: FitProfile): number | null {
  if (latestMorningKg == null) return null;
  const g = p.goal_weight;
  if (typeof g !== "number" || !Number.isFinite(g) || g <= 0) return null;
  const goalKg = p.units === "metric" ? g : g / LB_PER_KG;
  return latestMorningKg - goalKg;
}

/** Duration "h:mm:ss" or "mm:ss" → minutes. */
export function durationToMinutes(d?: string | null): number | null {
  if (!d) return null;
  const parts = d.split(":").map((x) => Number(x));
  if (parts.some((n) => !Number.isFinite(n))) return null;
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60;
  if (parts.length === 2) return parts[0] + parts[1] / 60;
  return null;
}
