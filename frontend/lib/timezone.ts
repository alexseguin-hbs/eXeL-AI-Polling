/**
 * The time zone a signature is RECORDED in for people (operator 2026-09-09): default Central Time — Austin, Texas — with a
 * choice of region before the final signature. "Use my device's time zone" reads the device's clock settings
 * (Intl.resolvedOptions().timeZone) — never a location; the page says so. The ISO instant in every keyword stays UTC; this
 * only decides how the caption, the codex line and the receipt spell it.
 */
export const DEFAULT_TZ = "America/Chicago";
export const TZ_KEY = "soi.sign.tz";
export const ZONES: { id: string; label: string }[] = [
  { id: "America/Chicago", label: "Central — Austin, Texas (CST/CDT)" },
  { id: "America/New_York", label: "Eastern — New York (EST/EDT)" },
  { id: "America/Denver", label: "Mountain — Denver (MST/MDT)" },
  { id: "America/Phoenix", label: "Arizona — Phoenix (MST)" },
  { id: "America/Los_Angeles", label: "Pacific — Los Angeles (PST/PDT)" },
  { id: "America/Anchorage", label: "Alaska — Anchorage (AKST/AKDT)" },
  { id: "Pacific/Honolulu", label: "Hawaii — Honolulu (HST)" },
  { id: "America/Mexico_City", label: "Mexico City (CST)" },
  { id: "America/Toronto", label: "Toronto (EST/EDT)" },
  { id: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { id: "Europe/London", label: "London (GMT/BST)" },
  { id: "Europe/Paris", label: "Paris · Berlin · Madrid (CET/CEST)" },
  { id: "Asia/Dubai", label: "Dubai (GST)" },
  { id: "Asia/Kolkata", label: "India (IST)" },
  { id: "Asia/Singapore", label: "Singapore (SGT)" },
  { id: "Asia/Tokyo", label: "Tokyo (JST)" },
  { id: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { id: "UTC", label: "UTC" },
];
/** the device's clock zone (Intl), or the default when unknown */
export const deviceTz = (): string => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || DEFAULT_TZ; } catch { return DEFAULT_TZ; } };
export const isTz = (tz: string): boolean => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } };
export const readTz = (): string => { try { const v = localStorage.getItem(TZ_KEY); return v && isTz(v) ? v : DEFAULT_TZ; } catch { return DEFAULT_TZ; } };
export const saveTz = (tz: string): void => { try { localStorage.setItem(TZ_KEY, tz); } catch { /* storage off */ } };
/** the short zone name for an instant ("CDT", "GMT+1") */
export const zoneAbbr = (iso: string, tz: string): string => { try { return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(new Date(iso)).find((p) => p.type === "timeZoneName")?.value ?? tz; } catch { return tz; } };
