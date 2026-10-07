/** A video that is not the live camera. Thermal is a heat camera. Other is any other file. */
export type VideoSource = "thermal" | "other";

/** Pictures the browser can open. A file that will not draw is refused. */
export const IMAGE_INTAKE = "image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,.avif";

/** Videos the browser can play. Frames are saved as PNG. */
export const VIDEO_INTAKE = "video/*,.mp4,.mov,.webm,.mkv,.avi,.m4v";

export function videoSourceName(source: VideoSource) {
  return source === "thermal" ? "Thermal imager" : "Other source";
}

export function needsPng(fileName: string) {
  return !/\.png$/i.test(fileName);
}

/** One name inside the app. Level 1 and Level 2 both keep the PNG and add a Light Codex strip. */
export function pngSet(fileName: string) {
  const stem = fileName.replace(/\.[^.]+$/, "") || "picture";
  return { png: `${stem}.png`, xml: `${stem}.xml`, level1: `${stem}.l1.codex.png`, level2: `${stem}.l2.codex.png` };
}
