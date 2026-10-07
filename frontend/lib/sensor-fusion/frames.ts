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

/** The picture name before a level is added. deer_0008.L1.png and deer_0008.jpg share deer_0008. */
export function pictureStem(fileName: string) {
  return fileName.replace(/\.(L[12])\.png$/i, "").replace(/\.[^.]+$/, "") || "picture";
}

/** Intake is stem.png. Level 1 is stem.L1.png. Level 2 is stem.L2.png. The XML keeps the stem. */
export function pngSet(fileName: string) {
  const stem = pictureStem(fileName);
  return { png: `${stem}.png`, level1: `${stem}.L1.png`, level2: `${stem}.L2.png`, xml: `${stem}.xml` };
}
