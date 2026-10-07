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

/** The picture name before a level mark. deer_0008.L1.png and deer_0008.jpg share deer_0008. */
export function pictureStem(fileName: string) {
  return fileName.replace(/\.(L[12])\.png$/i, "").replace(/\.[^.]+$/, "") || "picture";
}

/** The file is always stem.png. The record is not part of the name. */
export function pngSet(fileName: string) {
  const stem = pictureStem(fileName);
  return { png: `${stem}.png`, xml: `${stem}.xml` };
}

function codexName(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9 ._-]/g, "").replace(/\s+/g, " ").trim() || "GUEST";
}

function codexTime(raw: string) {
  return raw.replace(/[^0-9._]/g, "");
}

/** Bottom-right record. Level 1 is the annotator. Level 2 adds the reviewer. */
export function bottomRightLine(who: string, when: string, reviewer = "", reviewedAt = "") {
  const name = codexName(who);
  const time = codexTime(when);
  if (!time) return "";
  const level1 = `LEVEL 1: ${name} ${time}`;
  if (reviewer && reviewedAt && codexTime(reviewedAt)) return `${level1} LEVEL 2: ${codexName(reviewer)} ${codexTime(reviewedAt)}`;
  return level1;
}

/** What the picture shows after the decoder reads the line. */
export function levelReadout(line: string) {
  return line.replaceAll("LEVEL 1:", "Level 1:").replaceAll("LEVEL 2:", "Level 2:").trim();
}
