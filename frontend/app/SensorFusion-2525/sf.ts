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

type MenuFile = { n: string; id: string; label: string; go: "work" | "stop" | "label" | "pose" };

export const MENU = ((catalog as { menu?: MenuFile[] }).menu ?? []).map((item) => ({
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

export function detectPlatform(ua: string): PlatformId {
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad/i.test(ua)) return "iphone";
  if (/Windows/i.test(ua)) return "win";
  if (/Macintosh|Mac OS/i.test(ua)) return "mac";
  if (/Linux/i.test(ua)) return "ubuntu";
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
