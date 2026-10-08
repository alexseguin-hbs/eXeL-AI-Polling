/**
 * Fitness-2525 · workout upload parsers.
 * Screenshot OCR text, TCX, GPX, and a minimal FIT reader.
 * Calories, heart rate, pace, power, and ascent stay null unless the source contains them.
 * Nothing here calls an AI provider.
 */
import type { FitDay, FitGarminStats, FitWorkout } from "./types";

export type UploadSource = "ocr" | "tcx" | "gpx" | "fit";

export interface ParsedActivity {
  source: UploadSource;
  sport: string | null;
  title: string | null;
  /** YYYY-MM-DD only when the source includes a year (or a FIT timestamp). */
  date: string | null;
  /** Partial date as read ("Oct 8") when the year was not in the source. */
  dateLabel: string | null;
  start: string | null;
  distance: { value: number; unit: "m" | "mi" | "km" | "yd" } | null;
  duration: string | null;
  minutes: number | null;
  pace: string | null;
  speed: string | null;
  avgHr: number | null;
  ascent: string | null;
  avgPower: number | null;
  /** Set only when the source text or file has a calorie field. Never estimated. */
  calories: number | null;
  zone: string | null;
  raw: string | null;
  warnings: string[];
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function emptyActivity(source: UploadSource, warnings: string[] = []): ParsedActivity {
  return {
    source, sport: null, title: null, date: null, dateLabel: null, start: null,
    distance: null, duration: null, minutes: null, pace: null, speed: null,
    avgHr: null, ascent: null, avgPower: null, calories: null, zone: null,
    raw: null, warnings,
  };
}

export function activityHasSignal(a: ParsedActivity): boolean {
  return !!(a.sport || a.distance || a.duration || a.avgHr != null || a.calories != null || a.pace || a.speed);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "";
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

function minutesFromSeconds(seconds: number): number | null {
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.round((seconds / 60) * 10) / 10;
}

function applyDuration(a: ParsedActivity, seconds: number | null): void {
  if (seconds == null || !Number.isFinite(seconds) || seconds <= 0) return;
  a.duration = formatDuration(seconds);
  a.minutes = minutesFromSeconds(seconds);
}

function chicagoParts(ms: number): { date: string; start: string } | null {
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const start = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Chicago", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
  return { date, start };
}

function applyInstant(a: ParsedActivity, ms: number): void {
  const p = chicagoParts(ms);
  if (!p) return;
  a.date = p.date;
  a.start = p.start;
}

const SPORT_RULES: [RegExp, string, string][] = [
  [/trail\s+running/i, "run", "Trail running"],
  [/road\s+cycling/i, "bike", "Road cycling"],
  [/mountain\s+bik/i, "bike", "Mountain bike"],
  [/gravel\s+(?:cycling|ride)/i, "bike", "Gravel ride"],
  [/indoor\s+cycling|virtual\s+ride/i, "bike", "Indoor cycling"],
  [/cycling/i, "bike", "Cycling"],
  [/pool\s+swim/i, "swim", "Pool swim"],
  [/open\s+water/i, "swim", "Open water swim"],
  [/swimming/i, "swim", "Swimming"],
  [/trail\s+run/i, "run", "Trail run"],
  [/treadmill/i, "run", "Treadmill"],
  [/running/i, "run", "Running"],
  [/\bswim\b/i, "swim", "Swim"],
  [/\b(?:ride|biking|bike)\b/i, "bike", "Bike"],
  [/\brun\b/i, "run", "Run"],
  [/strength|weight\s+training/i, "strength", "Strength"],
  [/walking/i, "walk", "Walk"],
  [/hiking/i, "hike", "Hike"],
];

function labelAt(text: string, labelRe: RegExp): number {
  const m = labelRe.exec(text);
  return m && m.index != null ? m.index : -1;
}

/** Value in the 48 characters after a label, else the last value in the 48 before it (Garmin overview stacks the number above the label). */
function valueNear(text: string, labelRe: RegExp, valueRe: RegExp): RegExpExecArray | null {
  const at = labelAt(text, labelRe);
  if (at < 0) return null;
  const labelLen = labelRe.exec(text)?.[0].length ?? 0;
  const after = text.slice(at + labelLen, at + labelLen + 48);
  const a = new RegExp(valueRe.source, valueRe.flags.replace("g", "")).exec(after);
  if (a) return a;
  const before = text.slice(Math.max(0, at - 48), at);
  const flags = valueRe.flags.includes("g") ? valueRe.flags : valueRe.flags + "g";
  const re = new RegExp(valueRe.source, flags);
  let last: RegExpExecArray | null = null;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(before))) last = hit;
  return last;
}

function num(s: string | undefined): number | null {
  if (s == null) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export function parseGarminText(text: string): ParsedActivity {
  const a = emptyActivity("ocr");
  const raw = (text || "").replace(/\u00a0/g, " ");
  a.raw = raw.trim().slice(0, 4000);
  if (!raw.trim()) {
    a.warnings.push("No text extracted from the screenshot.");
    return a;
  }
  for (const [re, sport, title] of SPORT_RULES) {
    if (re.test(raw)) { a.sport = sport; a.title = title; break; }
  }
  const titled = raw.match(/([A-Z][A-Za-z0-9'., -]{1,40}(?:Running|Cycling|Swimming|Ride|Swim))/);
  if (titled) a.title = titled[1].replace(/\s+/g, " ").trim();

  const dist = valueNear(raw, /\bDistance\b/i, /(\d+(?:\.\d+)?)\s*(mi|km|yd|m)\b/i);
  if (dist) {
    const unit = dist[2].toLowerCase() as "mi" | "km" | "yd" | "m";
    const value = num(dist[1]);
    if (value != null && value > 0) a.distance = { value, unit };
  }

  const time = valueNear(raw, /\bTotal\s+Time\b/i, /(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (time) {
    a.duration = time[1];
    const parts = time[1].split(":").map(Number);
    const sec = parts.length === 3 ? parts[0] * 3600 + parts[1] * 60 + parts[2] : parts[0] * 60 + parts[1];
    a.minutes = minutesFromSeconds(sec);
  }

  const pace = valueNear(raw, /\bAvg(?:erage)?\s+Pace\b/i, /(\d{1,2}:\d{2})\s*\/\s*(mi|km|100\s*yd|100\s*m|100yd|100m)/i);
  if (pace) a.pace = `${pace[1]}/${pace[2].replace(/\s+/g, "")}`;

  const speed = valueNear(raw, /\bAvg(?:erage)?\s+Speed\b/i, /(\d+(?:\.\d+)?)\s*(mph|km\/h|kph)/i);
  if (speed) a.speed = `${speed[1]} ${speed[2]}`;

  const hr = valueNear(raw, /Avg(?:erage)?\s+Heart\s+Rate/i, /(\d{2,3})\s*bpm/i);
  const hrN = num(hr?.[1]);
  if (hrN != null && hrN > 30 && hrN < 230) a.avgHr = Math.round(hrN);

  const ascent = valueNear(raw, /Total\s+Ascent/i, /(\d+)\s*(ft|m)\b/i);
  if (ascent) a.ascent = `${ascent[1]} ${ascent[2].toLowerCase()}`;

  const power = valueNear(raw, /Avg(?:erage)?\s+Power/i, /(\d+)\s*w\b/i);
  const pN = num(power?.[1]);
  if (pN != null && pN > 0 && pN < 2500) a.avgPower = Math.round(pN);

  const kcal = valueNear(raw, /(?<!Fat\s)Calories\b/i, /(\d{1,5})(?:\s*(?:kcal|cal))?\b/i);
  const kN = num(kcal?.[1]);
  if (kN != null && kN > 0) a.calories = Math.round(kN);

  const zone = raw.match(/\b(Recovery|Base|Tempo|Threshold|VO2(?:\s*Max)?|Anaerobic)\s*\([^)\n]{1,40}\)/i);
  if (zone) a.zone = zone[0].replace(/\s+/g, " ").trim();

  const named = raw.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?(?:\s*@\s*(\d{1,2}):(\d{2})\s*(AM|PM))?/i);
  if (named) {
    const mon = MONTHS.indexOf(named[1].slice(0, 3).toLowerCase());
    const day = Number(named[2]);
    if (named[3] && mon >= 0) a.date = `${named[3]}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    else a.dateLabel = `${named[1].slice(0, 3)} ${day}`;
    if (named[4] && named[5]) {
      let hh = Number(named[4]);
      const pm = /^p/i.test(named[6] || "");
      if (pm && hh < 12) hh += 12;
      if (!pm && hh === 12) hh = 0;
      a.start = `${String(hh).padStart(2, "0")}:${named[5]}`;
    }
  } else {
    const slash = raw.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (slash) a.date = `${slash[3]}-${slash[1].padStart(2, "0")}-${slash[2].padStart(2, "0")}`;
  }
  if (!activityHasSignal(a)) a.warnings.push("No workout fields recognized in the extracted text.");
  return a;
}

function decodeXml(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function parseTcx(xml: string): ParsedActivity {
  const a = emptyActivity("tcx");
  const src = xml || "";
  if (!/TrainingCenterDatabase|<Activity\b/i.test(src)) {
    a.warnings.push("Not a TCX activity file.");
    return a;
  }
  const sportM = src.match(/<Activity\b[^>]*\bSport\s*=\s*"([^"]+)"/i);
  if (sportM) {
    const s = sportM[1].toLowerCase();
    a.title = sportM[1];
    if (/bik|cycl/.test(s)) a.sport = "bike";
    else if (/run/.test(s)) a.sport = "run";
    else if (/swim/.test(s)) a.sport = "swim";
    else if (/walk/.test(s)) a.sport = "walk";
    else a.sport = s.replace(/\s+/g, " ").slice(0, 32);
  }
  const id = src.match(/<Id>\s*([^<]+)\s*<\/Id>/i);
  if (id) {
    const ms = Date.parse(id[1].trim());
    if (Number.isFinite(ms)) applyInstant(a, ms);
    else a.dateLabel = id[1].trim();
  }
  const laps = src.split(/<Lap\b/i).slice(1);
  let seconds = 0;
  let meters = 0;
  let sawTime = false;
  let sawDist = false;
  let cal = 0;
  let sawCal = 0;
  let hrW = 0;
  let hrT = 0;
  for (const lap of laps) {
    const body = lap.split(/<\/Lap>/i)[0] || lap;
    const t = body.match(/<TotalTimeSeconds>\s*([0-9.]+)\s*<\/TotalTimeSeconds>/i);
    const d = body.match(/<DistanceMeters>\s*([0-9.]+)\s*<\/DistanceMeters>/i);
    const c = body.match(/<Calories>\s*([0-9.]+)\s*<\/Calories>/i);
    const h = body.match(/<AverageHeartRateBpm>\s*<Value>\s*(\d+)\s*<\/Value>/i);
    const lapSec = t ? Number(t[1]) : 0;
    if (t && Number.isFinite(lapSec)) { seconds += lapSec; sawTime = true; }
    if (d && Number.isFinite(Number(d[1]))) { meters += Number(d[1]); sawDist = true; }
    if (c && Number.isFinite(Number(c[1]))) { cal += Number(c[1]); sawCal += 1; }
    if (h) {
      const w = lapSec > 0 ? lapSec : 1;
      hrW += Number(h[1]) * w;
      hrT += w;
    }
  }
  if (sawTime) applyDuration(a, seconds);
  if (sawDist && meters > 0) a.distance = { value: Math.round(meters * 10) / 10, unit: "m" };
  if (sawCal > 0) {
    a.calories = Math.round(cal);
    if (laps.length && sawCal !== laps.length) a.warnings.push("Calories summed only from laps that included a Calories field.");
  }
  if (hrT > 0) a.avgHr = Math.round(hrW / hrT);
  if (!activityHasSignal(a)) a.warnings.push("TCX had no distance, time, heart rate, or calories.");
  return a;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const rad = (d: number) => d * Math.PI / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function parseGpx(xml: string): ParsedActivity {
  const a = emptyActivity("gpx");
  const src = xml || "";
  if (!/<gpx\b/i.test(src)) {
    a.warnings.push("Not a GPX file.");
    return a;
  }
  const name = src.match(/<name>\s*([^<]+)\s*<\/name>/i);
  if (name) a.title = decodeXml(name[1].trim()).slice(0, 80);
  const type = src.match(/<type>\s*([^<]+)\s*<\/type>/i);
  const sportSrc = `${type?.[1] || ""} ${name?.[1] || ""}`;
  for (const [re, sport, title] of SPORT_RULES) {
    if (re.test(sportSrc)) { a.sport = sport; if (!a.title) a.title = title; break; }
  }
  if (!a.sport && type) a.sport = decodeXml(type[1].trim()).toLowerCase().slice(0, 32);

  const points: { lat: number; lon: number; t: number | null; hr: number | null }[] = [];
  const re = /<(?:trkpt|rtept)\b([^>]*)>([\s\S]*?)<\/(?:trkpt|rtept)>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const tag = m[1];
    const latM = tag.match(/\blat\s*=\s*"([^"]+)"/i);
    const lonM = tag.match(/\blon\s*=\s*"([^"]+)"/i);
    const lat = latM ? Number(latM[1]) : NaN;
    const lon = lonM ? Number(lonM[1]) : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const body = m[2];
    const timeM = body.match(/<time>\s*([^<]+)\s*<\/time>/i);
    const hrM = body.match(/<(?:[\w.-]+:)?hr>\s*(\d+(?:\.\d+)?)\s*</i);
    const t = timeM ? Date.parse(timeM[1].trim()) : NaN;
    const hr = hrM ? Number(hrM[1]) : NaN;
    points.push({ lat, lon, t: Number.isFinite(t) ? t : null, hr: Number.isFinite(hr) && hr > 30 && hr < 230 ? hr : null });
  }
  let meters = 0;
  for (let i = 1; i < points.length; i++) meters += haversineM(points[i - 1].lat, points[i - 1].lon, points[i].lat, points[i].lon);
  if (meters >= 1) a.distance = { value: Math.round(meters * 10) / 10, unit: "m" };
  const times = points.map((p) => p.t).filter((t): t is number => t != null).sort((x, y) => x - y);
  if (times.length >= 2) {
    applyDuration(a, (times[times.length - 1] - times[0]) / 1000);
    applyInstant(a, times[0]);
  }
  const hrs = points.map((p) => p.hr).filter((h): h is number => h != null);
  if (hrs.length) a.avgHr = Math.round(hrs.reduce((s, h) => s + h, 0) / hrs.length);
  const cal = src.match(/<(?:[\w.-]+:)?calories>\s*([0-9.]+)\s*</i);
  if (cal && Number.isFinite(Number(cal[1])) && Number(cal[1]) > 0) a.calories = Math.round(Number(cal[1]));
  if (!points.length) a.warnings.push("GPX had no track points.");
  return a;
}

const GARMIN_EPOCH_MS = Date.UTC(1989, 11, 31);
const FIT_SPORT: Record<number, string> = {
  0: "workout", 1: "run", 2: "bike", 3: "transition", 4: "strength", 5: "swim",
  10: "training", 11: "walk", 15: "rowing", 17: "hike", 18: "multisport",
};

interface FitField { num: number; size: number; base: number }
interface FitDef { archLE: boolean; global: number; fields: FitField[] }
interface FitVals { present: Set<number>; num: Map<number, number> }

function u16(buf: Uint8Array, o: number, le: boolean): number {
  return le ? buf[o] | (buf[o + 1] << 8) : (buf[o] << 8) | buf[o + 1];
}
function u32(buf: Uint8Array, o: number, le: boolean): number {
  const b0 = le ? buf[o] : buf[o + 3];
  const b1 = le ? buf[o + 1] : buf[o + 2];
  const b2 = le ? buf[o + 2] : buf[o + 1];
  const b3 = le ? buf[o + 3] : buf[o];
  return (b0 + b1 * 256 + b2 * 65536 + b3 * 16777216) >>> 0;
}

function readFitValue(buf: Uint8Array, o: number, field: FitField, le: boolean): { value: number | null; next: number } {
  const next = o + field.size;
  if (next > buf.length) return { value: null, next: buf.length };
  if (field.base === 7 || field.base === 13) return { value: null, next };
  const width = field.base === 8 || field.base === 5 || field.base === 6 || field.base === 12 ? 4
    : field.base === 9 || field.base === 14 || field.base === 15 || field.base === 16 ? 8
    : field.base === 3 || field.base === 4 || field.base === 11 ? 2 : 1;
  if (field.size < width || o + width > buf.length) return { value: null, next };
  let value: number | null = null;
  if (width === 1) value = buf[o];
  else if (width === 2) value = u16(buf, o, le);
  else if (width === 4 && field.base !== 8) value = u32(buf, o, le);
  else return { value: null, next };
  if (width === 1 && value === 0xFF) value = null;
  if (width === 2 && value === 0xFFFF) value = null;
  if (width === 4 && value === 0xFFFFFFFF) value = null;
  if (field.base === 1 && value === 0x7F) value = null;
  if (field.base === 3 && value === 0x7FFF) value = null;
  return { value, next };
}

function readFitFields(buf: Uint8Array, o: number, def: FitDef): { vals: FitVals; next: number } {
  const present = new Set<number>();
  const num = new Map<number, number>();
  let p = o;
  for (const f of def.fields) {
    const r = readFitValue(buf, p, f, def.archLE);
    p = r.next;
    present.add(f.num);
    if (r.value != null) num.set(f.num, r.value);
  }
  return { vals: { present, num }, next: p };
}

interface FitSession {
  sport: number | null;
  seconds: number | null;
  meters: number | null;
  calories: number | null;
  hr: number | null;
  power: number | null;
  ascentM: number | null;
  speedMps: number | null;
  startSec: number | null;
}

function sessionFrom(vals: FitVals, kind: "session" | "lap"): FitSession {
  const g = (n: number, scale = 1): number | null => {
    if (!vals.present.has(n) || !vals.num.has(n)) return null;
    return (vals.num.get(n) as number) / scale;
  };
  const hrField = kind === "session" ? 16 : 15;
  const powerField = kind === "session" ? 20 : 19;
  const ascentField = kind === "session" ? 22 : 21;
  return {
    sport: g(kind === "session" ? 5 : 25),
    seconds: g(7, 1000) ?? g(8, 1000),
    meters: g(9, 100),
    calories: vals.present.has(11) && vals.num.has(11) ? vals.num.get(11) as number : null,
    hr: g(hrField),
    power: g(powerField),
    ascentM: g(ascentField),
    speedMps: g(kind === "session" ? 14 : 13, 1000),
    startSec: g(2),
  };
}

function fillFromSession(a: ParsedActivity, s: FitSession): void {
  if (s.sport != null) a.sport = FIT_SPORT[s.sport] || `sport ${s.sport}`;
  if (s.seconds != null && s.seconds > 0) applyDuration(a, s.seconds);
  if (s.meters != null && s.meters > 0) a.distance = { value: Math.round(s.meters * 10) / 10, unit: "m" };
  if (s.calories != null) a.calories = Math.round(s.calories);
  if (s.hr != null && s.hr > 30 && s.hr < 230) a.avgHr = Math.round(s.hr);
  if (s.power != null && s.power > 0) a.avgPower = Math.round(s.power);
  if (s.ascentM != null && s.ascentM > 0) a.ascent = `${Math.round(s.ascentM)} m`;
  if (s.speedMps != null && s.speedMps > 0) a.speed = `${s.speedMps.toFixed(2)} m/s`;
  if (s.startSec != null && s.startSec > 0) applyInstant(a, GARMIN_EPOCH_MS + s.startSec * 1000);
}

export function parseFit(buf: Uint8Array): ParsedActivity {
  const a = emptyActivity("fit");
  if (!buf || buf.length < 14) {
    a.warnings.push("File is too small to be a .fit activity. Export TCX or GPX, or use Connect Strava while Garmin's API is pending.");
    return a;
  }
  const headerSize = buf[0];
  const magic = String.fromCharCode(buf[8] || 0, buf[9] || 0, buf[10] || 0, buf[11] || 0);
  if (headerSize < 12 || headerSize > buf.length || magic !== ".FIT") {
    a.warnings.push(".fit header not recognized. Export TCX or GPX from Garmin Connect, or connect Strava while Garmin's API is pending.");
    return a;
  }
  const dataSize = u32(buf, 4, true);
  const end = Math.min(buf.length, headerSize + dataSize);
  const defs = new Map<number, FitDef>();
  const sessions: FitSession[] = [];
  const laps: FitSession[] = [];
  let o = headerSize;
  while (o < end) {
    const h = buf[o++];
    if (h & 0x80) {
      const local = (h >> 5) & 0x3;
      const def = defs.get(local);
      if (!def) { a.warnings.push("Stopped: compressed FIT record without a definition."); break; }
      const read = readFitFields(buf, o, def);
      o = read.next;
      if (def.global === 18) sessions.push(sessionFrom(read.vals, "session"));
      else if (def.global === 19) laps.push(sessionFrom(read.vals, "lap"));
      continue;
    }
    const local = h & 0x0f;
    if (h & 0x40) {
      if (o + 5 > end) break;
      o += 1;
      const archLE = buf[o++] === 0;
      const global = u16(buf, o, archLE);
      o += 2;
      const n = buf[o++];
      const fields: FitField[] = [];
      for (let i = 0; i < n; i++) {
        if (o + 3 > end) break;
        fields.push({ num: buf[o], size: buf[o + 1], base: buf[o + 2] });
        o += 3;
      }
      if (h & 0x20) {
        if (o >= end) break;
        const nd = buf[o++];
        o += nd * 3;
      }
      defs.set(local, { archLE, global, fields });
    } else {
      const def = defs.get(local);
      if (!def) { a.warnings.push("Stopped: FIT data record without a definition."); break; }
      const read = readFitFields(buf, o, def);
      o = read.next;
      if (def.global === 18) sessions.push(sessionFrom(read.vals, "session"));
      else if (def.global === 19) laps.push(sessionFrom(read.vals, "lap"));
    }
  }
  const session = sessions.find((s) => (s.meters || 0) > 0) || sessions[0];
  if (session) fillFromSession(a, session);
  else if (laps.length) {
    const sum: FitSession = { sport: null, seconds: 0, meters: 0, calories: null, hr: null, power: null, ascentM: 0, speedMps: null, startSec: null };
    let sawSec = false; let sawM = false; let sawAsc = false; let cal = 0; let sawCal = false; let hrW = 0; let hrT = 0;
    for (const lap of laps) {
      if (sum.sport == null && lap.sport != null) sum.sport = lap.sport;
      if (lap.seconds != null) { sum.seconds = (sum.seconds || 0) + lap.seconds; sawSec = true; }
      if (lap.meters != null) { sum.meters = (sum.meters || 0) + lap.meters; sawM = true; }
      if (lap.calories != null) { cal += lap.calories; sawCal = true; }
      if (lap.ascentM != null) { sum.ascentM = (sum.ascentM || 0) + lap.ascentM; sawAsc = true; }
      if (lap.hr != null) {
        const w = lap.seconds && lap.seconds > 0 ? lap.seconds : 1;
        hrW += lap.hr * w; hrT += w;
      }
      if (sum.startSec == null && lap.startSec != null) sum.startSec = lap.startSec;
    }
    if (!sawSec) sum.seconds = null;
    if (!sawM) sum.meters = null;
    if (!sawAsc) sum.ascentM = null;
    if (sawCal) sum.calories = cal;
    if (hrT > 0) sum.hr = hrW / hrT;
    fillFromSession(a, sum);
    a.warnings.push("No session message — totals taken from laps.");
  } else {
    a.warnings.push("No session in this .fit file. Export TCX or GPX if the activity does not show up.");
  }
  return a;
}

export function coalesceActivities(items: ParsedActivity[]): ParsedActivity[] {
  const out: ParsedActivity[] = [];
  for (const item of items) {
    const hit = out.find((b) => sameShot(b, item));
    if (hit) mergeShot(hit, item);
    else out.push({ ...item, warnings: [...item.warnings], distance: item.distance ? { ...item.distance } : null });
  }
  return out;
}

function sameShot(a: ParsedActivity, b: ParsedActivity): boolean {
  if ((a.sport || "") !== (b.sport || "")) return false;
  if (!a.sport && !b.sport) return false;
  if (a.duration && b.duration && a.duration !== b.duration) return false;
  if (a.distance && b.distance && (a.distance.unit !== b.distance.unit || Math.abs(a.distance.value - b.distance.value) > 0.05)) return false;
  if (!a.duration && !b.duration && !a.distance && !b.distance) return false;
  return true;
}

function mergeShot(into: ParsedActivity, extra: ParsedActivity): void {
  const take = <K extends keyof ParsedActivity>(k: K) => {
    if (into[k] == null || into[k] === "") (into[k] as ParsedActivity[K]) = extra[k];
  };
  take("sport"); take("title"); take("date"); take("dateLabel"); take("start");
  take("duration"); take("minutes"); take("pace"); take("speed"); take("avgHr");
  take("ascent"); take("avgPower"); take("calories"); take("zone");
  if (!into.distance && extra.distance) into.distance = { ...extra.distance };
  if (extra.raw) into.raw = [into.raw, extra.raw].filter(Boolean).join("\n").slice(0, 4000);
  into.warnings = [...into.warnings, ...extra.warnings];
}

/** Merge confirmed fields into the open day. Planned workout of the same sport is updated; a finished one is left alone. */
export function mergeActivityIntoDay(day: FitDay, activity: ParsedActivity, now = Date.now()): FitDay {
  const type = activity.sport || "workout";
  const garmin: FitGarminStats = {};
  let hasG = false;
  if (activity.start) { garmin.start = activity.start; hasG = true; }
  if (activity.duration) { garmin.duration = activity.duration; hasG = true; }
  if (activity.pace) { garmin.pace = activity.pace; hasG = true; }
  if (activity.avgHr != null) { garmin.avg_hr = activity.avgHr; hasG = true; }
  if (activity.zone) { garmin.zone = activity.zone; hasG = true; }
  if (activity.calories != null) { garmin.kcal = activity.calories; hasG = true; }
  const note = [
    `Uploaded ${activity.source}`,
    activity.date || activity.dateLabel,
    activity.speed ? `speed ${activity.speed}` : null,
    activity.ascent ? `ascent ${activity.ascent}` : null,
    activity.avgPower != null ? `avg power ${activity.avgPower} W` : null,
  ].filter(Boolean).join(" · ");
  const idx = day.workouts.findIndex((w) => w.type === type && (w.status === "planned" || w.status === "adjusted" || w.status == null));
  const base: FitWorkout = idx >= 0 ? day.workouts[idx] : {
    id: `w-upload-${now}`,
    type,
    status: "completed",
  };
  const nextW: FitWorkout = {
    ...base,
    type,
    status: "completed",
    title: activity.title || base.title,
    minutes: activity.minutes != null ? activity.minutes : base.minutes,
    distance: activity.distance ? { ...activity.distance } : base.distance,
    calories: activity.calories != null ? activity.calories : (base.calories ?? null),
    timing: activity.start || base.timing,
    garmin: hasG ? { ...(base.garmin ?? {}), ...garmin } : base.garmin,
    notes: [base.notes, note].filter(Boolean).join("\n"),
  };
  if (activity.calories == null && (base.calories == null || base.calories === undefined)) delete (nextW as { calories?: number | null }).calories;
  const workouts = day.workouts.slice();
  if (idx >= 0) workouts[idx] = nextW;
  else workouts.push(nextW);
  return { ...day, workouts };
}
