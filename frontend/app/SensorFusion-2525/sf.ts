export type PlatformId = "win" | "android" | "iphone" | "pi" | "ubuntu";
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
  { id: "android", label: "Android", detail: "A phone" },
  { id: "iphone", label: "iPhone", detail: "A phone" },
  { id: "pi", label: "Raspberry Pi", detail: "A small computer" },
  { id: "ubuntu", label: "Ubuntu", detail: "A shared computer" },
];

export const MODELS = [
  { id: "demo90", label: "Demo.90", folder: "Demo90", sees: "person, bicycle, car" },
  { id: "deer", label: "Deer", folder: "Model01.Deer", sees: "deer" },
  { id: "head", label: "Head", folder: "Model02.Head", sees: "head" },
  { id: "eyes", label: "Eyes", folder: "Model03.Eyes", sees: "eyes" },
  { id: "tree", label: "Tree", folder: "Model04.Tree", sees: "tree" },
  { id: "custom01", label: "Custom.01", folder: "Custom.01", sees: "the everyday list" },
  { id: "custom02", label: "Custom.02", folder: "Custom.02", sees: "the everyday list" },
  { id: "custom03", label: "Custom.03", folder: "Custom.03", sees: "the everyday list" },
  { id: "custom04", label: "Custom.04", folder: "Custom.04", sees: "the everyday list" },
  { id: "checkid", label: "Check ID", folder: "checkid", sees: "Alex, Dara, Nick" },
  { id: "thermal01", label: "Thermal.01", folder: "thermal01", sees: "dog, person" },
];

export const MENU = [
  { n: "1", id: "fusion-coral", label: "Sensor Fusion, with Coral", coral: true, model: "demo90", go: "work" as const },
  { n: "2", id: "fusion-cpu", label: "Sensor Fusion, no Coral", coral: false, model: "demo90", go: "work" as const },
  { n: "3", id: "stop", label: "Stop", coral: false, model: "", go: "stop" as const },
  { n: "4", id: "labeler", label: "Image labeler", coral: false, model: "demo90", go: "label" as const },
  { n: "5", id: "check-coral", label: "Check ID, with Coral", coral: true, model: "checkid", go: "work" as const },
  { n: "6", id: "check-cpu", label: "Check ID, no Coral", coral: false, model: "checkid", go: "work" as const },
  { n: "7", id: "pose", label: "Pose", coral: false, model: "", go: "pose" as const },
];

export function modelFile(coral: boolean) {
  return coral ? "edgetpu.tflite" : "detect.tflite";
}

export const COLORS: { id: SchemeId; label: string; mark: string; swatch: string; bg: string; card: string; primary: string; line: string }[] = [
  { id: "violet", label: "Violet", mark: "웃", swatch: "#ff00ff", bg: "#140014", card: "#210021", primary: "#ff00ff", line: "#3a143a" },
  { id: "ocean", label: "Ocean Blue", mark: "", swatch: "#3b82f6", bg: "#081018", card: "#0c1824", primary: "#3c83f6", line: "#1c3148" },
  { id: "cyan", label: "Cyan", mark: "△", swatch: "#00e5ff", bg: "#001414", card: "#082121", primary: "#00e5ff", line: "#143a3a" },
  { id: "green", label: "Green", mark: "", swatch: "#00ff00", bg: "#001400", card: "#082108", primary: "#00ff00", line: "#143a14" },
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
