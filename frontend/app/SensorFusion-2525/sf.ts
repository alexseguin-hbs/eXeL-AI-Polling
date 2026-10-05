export type PlatformId = "win" | "mac" | "android" | "iphone" | "pi" | "ubuntu";
export type SchemeId =
  | "violet"
  | "ocean"
  | "cyan"
  | "green"
  | "emerald"
  | "sunset"
  | "orange"
  | "crimson"
  | "atlantis"
  | "vision";

export const PLATFORMS: { id: PlatformId; label: string; detail: string }[] = [
  { id: "win", label: "PC-WIN", detail: "A computer at a desk" },
  { id: "mac", label: "Mac", detail: "An Apple computer" },
  { id: "android", label: "Android", detail: "A phone" },
  { id: "iphone", label: "iPhone", detail: "A phone" },
  { id: "pi", label: "Raspberry Pi", detail: "A small computer" },
  { id: "ubuntu", label: "Ubuntu", detail: "A shared computer" },
];

import catalog from "../../public/sensor-fusion/models.json" with { type: "json" };

type ModelFile = {
  id: string;
  label: string;
  folder: string;
  remote: string;
  labels: string[];
};

function usable(labels: string[]) {
  return labels.map((item) => item.trim()).filter((item) => item && item !== "???");
}

export const MODELS = (catalog.models as ModelFile[]).map((item) => {
  const labels = usable(item.labels);
  return {
    id: item.id,
    label: item.label,
    folder: item.folder,
    sees: labels.slice(0, 3).join(", "),
    labels,
  };
});

/**
 * The info still: the operator's Austin test card with the REAL Demo.90 boxes and scores.
 * Source of every box: docs/asks/2026.10.04_19.32..14_sensor_fusion_info_default_image_demo90_detections.json ("headline").
 * Pixel boxes are in the 1254 px original; the page divides by `size`, so the 840 px copy lines up.
 * Full frame plus 4 tiles found all five kinds. tests/sensor-fusion-info.test.mjs holds this list equal to that file.
 */
export const INFO_STILL = {
  src: "/sensor-fusion/info-default.webp",
  size: [1254, 1254] as const,
  boxes: [
    { label: "person", score: 0.766, box_px: [98, 595, 223, 1005], pass: "full" },
    { label: "person", score: 0.68, box_px: [476, 697, 607, 874], pass: "tile2" },
    { label: "bicycle", score: 0.688, box_px: [456, 765, 647, 894], pass: "tile2" },
    { label: "car", score: 0.75, box_px: [807, 729, 1177, 899], pass: "tile3" },
    { label: "dog", score: 0.766, box_px: [189, 822, 355, 1004], pass: "tile2" },
    { label: "traffic light", score: 0.766, box_px: [1056, 218, 1108, 331], pass: "full" },
  ] as { label: string; score: number; box_px: [number, number, number, number]; pass: string }[],
};

/** SAVE BOX adds a new box. Only a box opened with Fix (its id in `editing`) is replaced in place. */
export function placeBox<T extends { id: string }>(list: T[], mark: T, editing: string): T[] {
  if (editing && list.some((item) => item.id === editing)) return list.map((item) => (item.id === editing ? mark : item));
  return [...list, mark];
}

/** Where the movable box starts on every picture and after every save. */
export const START_BOX = { left: 40, top: 35, right: 60, bottom: 65 } as const;

type BoxLike = { id: string; name: string; left: number; top: number; right: number; bottom: number };

/**
 * SAVE BOX refuses a box that is already there (rev 43). Six taps without moving gave six identical boxes on the sky.
 * Returns "" when the box may be saved, else the one sentence the person reads. A Fix (editing) is never refused.
 */
export function refuseBox(list: BoxLike[], mark: BoxLike, editing: string): string {
  if (editing && list.some((item) => item.id === editing)) return "";
  const same = (item: BoxLike) =>
    item.left === mark.left && item.top === mark.top && item.right === mark.right && item.bottom === mark.bottom;
  if (list.some((item) => item.name === mark.name && same(item))) return "That box is already saved. Move the box onto the next object first.";
  const untouched = mark.left === START_BOX.left && mark.top === START_BOX.top && mark.right === START_BOX.right && mark.bottom === START_BOX.bottom;
  if (untouched && list.length) return "Move the box onto the next object first.";
  return "";
}

/** "How many" takes a whole number from 1 to 12. Anything else is refused with a sentence, never changed quietly (rev 43). */
export function howManyPictures(raw: string): { n: number; note: string } {
  const text = String(raw ?? "").trim();
  const value = Number(text);
  if (!/^\d+$/.test(text) || value < 1 || value > 12) return { n: 0, note: "How many takes a number from 1 to 12." };
  return { n: value, note: "" };
}

/** A video keeps every Nth frame. 2 is every other frame. 1 to 30, or a sentence. */
export function everyNthFrame(raw: string): { n: number; note: string } {
  const text = String(raw ?? "").trim();
  const value = Number(text);
  if (!/^\d+$/.test(text) || value < 1 || value > 30) return { n: 0, note: "Keep every takes a number from 1 to 30." };
  return { n: value, note: "" };
}

/** Frames pulled from one video. 1 to 120, or a sentence. */
export function howManyFrames(raw: string): { n: number; note: string } {
  const text = String(raw ?? "").trim();
  const value = Number(text);
  if (!/^\d+$/.test(text) || value < 1 || value > 120) return { n: 0, note: "How many frames takes a number from 1 to 120." };
  return { n: value, note: "" };
}

/** How far apart live pictures are. 1–6 per second, or one picture every 2 or 3 seconds. */
export const LIVE_PACE: { id: string; label: string; gap: number }[] = [
  { id: "6", label: "6 per second", gap: 1000 / 6 },
  { id: "5", label: "5 per second", gap: 200 },
  { id: "4", label: "4 per second", gap: 250 },
  { id: "3", label: "3 per second", gap: 1000 / 3 },
  { id: "2", label: "2 per second", gap: 500 },
  { id: "1", label: "1 per second", gap: 1000 },
  { id: "e2", label: "Every 2 seconds", gap: 2000 },
  { id: "e3", label: "Every 3 seconds", gap: 3000 },
];

export function livePace(id: string) {
  return LIVE_PACE.find((item) => item.id === id) ?? LIVE_PACE[6];
}

/** How long the camera stays on. The first picture is now. Each later picture waits. */
export function captureSeconds(pictures: number, paceId: string): { seconds: number; line: string } {
  const pace = livePace(paceId);
  const count = Math.max(0, Math.floor(pictures));
  const seconds = Math.round(((Math.max(0, count - 1) * pace.gap) / 1000) * 10) / 10;
  const shown = Number.isInteger(seconds) ? String(seconds) : seconds.toFixed(1);
  const picturesWord = count === 1 ? "1 picture" : `${count} pictures`;
  if (count <= 1) return { seconds: 0, line: "1 picture. No wait." };
  return { seconds, line: `${picturesWord}, ${pace.label.toLowerCase()}, takes ${shown} seconds.` };
}

/** What the save really did, in one sentence (rev 43). Never a folder the app did not make. */
export function savedLine(how: "folder" | "shared" | "downloaded", count: number, where = ""): string {
  const pictures = `${count} ${count === 1 ? "picture" : "pictures"}`;
  if (how === "folder") return `Saved ${pictures} in ${where}.`;
  if (how === "shared") return `Shared ${pictures}.`;
  return `Downloaded ${pictures}.`;
}

/** At most three names, then "and N more." */
export function nameList(names: string[], max = 3): string {
  const list = names.filter(Boolean);
  if (list.length <= max) return list.join(", ");
  return `${list.slice(0, max).join(", ")} and ${list.length - max} more.`;
}

type MenuFile = { n: string; id: string; label: string; go: "work" | "stop" | "label" | "pose" };

const FILE_MENU: MenuFile[] = [
  { n: "1", id: "fusion", label: "Sensor Fusion", go: "work" },
  { n: "2", id: "stop", label: "Stop", go: "stop" },
  { n: "3", id: "pose", label: "Pose", go: "pose" },
];

export const MENU = ((catalog as { menu?: MenuFile[] }).menu?.length ? (catalog as { menu: MenuFile[] }).menu : FILE_MENU).map((item) => ({
  n: item.n,
  id: item.id,
  label: item.label,
  go: item.go,
}));

export function modelFile(coral: boolean) {
  return coral ? "edgetpu.tflite" : "detect.tflite";
}

/** Coral is a switch. Check ID is a model, not its own menu row. */
export function runPlan(coralOn: boolean, modelId: string) {
  const known = MODELS.some((item) => item.id === modelId);
  const model = known ? modelId : "demo90";
  return { coral: coralOn, model, file: modelFile(coralOn) };
}

export type Lens = "wide" | "ultra" | "tele" | "front";

/** iPhone 12 Pro Max: 1 wide, 2 ultra, 3 tele. Zoom is used when the browser offers one back camera. */
export function lensZoom(lens: Lens, range?: { min: number; max: number } | null) {
  if (lens === "front" || !range) return null;
  if (lens === "ultra") return range.min;
  if (lens === "tele") return Math.min(range.max, Math.max(range.min, 2.5));
  return Math.min(range.max, Math.max(range.min, 1));
}

/** The browser always uses detect.tflite. Coral runs only on the computer, and only when the chip is there. */
export function decideRun(where: "browser" | "edge", coral: boolean, chip: boolean) {
  if (where === "browser" || !(coral && chip)) return { file: "detect.tflite", engine: "processor" as const };
  return { file: "edgetpu.tflite", engine: "Coral" as const };
}

/**
 * The one line under the CPU CORAL switch (spec 2026.10.03_18.37..22, change 2; rev 43). Shown only with CORAL picked,
 * and only while the page itself runs on the processor — decideRun is the one rule.
 */
export function coralNote(coral: boolean): string {
  if (!coral) return "";
  return decideRun("browser", coral, false).engine === "processor"
    ? "Coral runs on a computer with the Coral chip. This page uses the processor."
    : "";
}

export const COLORS: { id: SchemeId; label: string; mark: string; swatch: string; bg: string; card: string; primary: string; line: string }[] = [
  { id: "violet", label: "Violet", mark: "웃", swatch: "#ff00ff", bg: "#140014", card: "#210021", primary: "#ff00ff", line: "#3a143a" },
  { id: "ocean", label: "Ocean Blue", mark: "", swatch: "#3b82f6", bg: "#081018", card: "#0c1824", primary: "#3c83f6", line: "#1c3148" },
  { id: "cyan", label: "Cyan", mark: "△", swatch: "#00e5ff", bg: "#001414", card: "#082121", primary: "#00e5ff", line: "#143a3a" },
  { id: "green", label: "Green", mark: "", swatch: "#0cff00", bg: "#3e505c", card: "#212121", primary: "#0cff00", line: "#2f6a38" },
  { id: "emerald", label: "Emerald", mark: "", swatch: "#10b981", bg: "#02110c", card: "#0c1c16", primary: "#10b981", line: "#143028" },
  { id: "sunset", label: "Sunset", mark: "♡", swatch: "#ffe600", bg: "#141400", card: "#212108", primary: "#ffe600", line: "#3a3a14" },
  { id: "orange", label: "Burnt Orange", mark: "", swatch: "#f97316", bg: "#140a04", card: "#21140c", primary: "#f97316", line: "#3a2414" },
  { id: "crimson", label: "Crimson Red", mark: "", swatch: "#ff2a2a", bg: "#140000", card: "#210808", primary: "#ff2a2a", line: "#3a1414" },
];

export const FRAMES: { id: SchemeId; label: string; note: string; bg: string; card: string; primary: string; line: string }[] = [
  { id: "atlantis", label: "The Atlantis Accords", note: "7 sections", bg: "#07141a", card: "#0e2228", primary: "#2ec4b6", line: "#1c3338" },
  { id: "vision", label: "Vision • 2525", note: "Humanity's Coordination Framework", bg: "#070a12", card: "#10151f", primary: "#e7b540", line: "#2a2618" },
];

export function pathSep(platform: PlatformId): "/" | "\\" {
  return platform === "win" ? "\\" : "/";
}

export function sensorPath(platform: PlatformId, parts: string[] = []): string {
  return ["Home", "SensorFusion", ...parts].join(pathSep(platform));
}

export function detectPlatform(ua: string, platform = ""): PlatformId {
  const blob = `${ua} ${platform}`;
  if (/Android/i.test(blob)) return "android";
  if (/iPhone|iPad/i.test(blob)) return "iphone";
  if (/Win/i.test(platform) || /Windows/i.test(ua)) return "win";
  if (/Mac/i.test(platform) || /Macintosh|Mac OS/i.test(ua)) return "mac";
  if (/Raspberry/i.test(blob)) return "pi";
  if (/Linux|Ubuntu/i.test(blob)) return "ubuntu";
  return "win";
}

export function applyTheme(bg: string, card: string, primary: string, line: string) {
  const root = document.documentElement;
  root.style.setProperty("--sf-bg", bg);
  root.style.setProperty("--sf-card", card);
  root.style.setProperty("--sf-primary", primary);
  root.style.setProperty("--sf-line", line);
}

export function explainCamera(err: unknown): string {
  const name = err instanceof DOMException ? err.name : "";
  const message = err instanceof Error ? err.message : "";
  const lower = `${name} ${message}`.toLowerCase();
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return lower.includes("policy")
      ? "This page is not allowed to open the camera yet."
      : "This PC blocked the camera. Click the lock icon in the address bar, set Camera to Allow, then press SENSOR 1 again.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No camera was found here.";
  if (name === "NotReadableError" || name === "TrackStartError") return "The camera is busy with another app. Close that app and try again.";
  if (name === "SecurityError") return "The camera opens only on a safe page.";
  return "The camera did not open. Try again.";
}
