/** A video that is not the live camera. Thermal is a heat camera. Other is any other file. */
export type VideoSource = "thermal" | "other";

export function videoSourceName(source: VideoSource) {
  return source === "thermal" ? "Thermal imager" : "Other source";
}

export function isLabelingJpeg(fileName: string) {
  return /\.jpe?g$/i.test(fileName);
}

/**
 * A video is split into JPEGs for labeling.
 * Level 1 keeps the same name and writes a PNG plus the Light Codex strip.
 */
export function afterLevel1(fileName: string) {
  const stem = fileName.replace(/\.[^.]+$/, "") || "picture";
  return { jpeg: `${stem}.jpg`, png: `${stem}.png`, xml: `${stem}.xml`, codex: `${stem}.l1.codex.png` };
}
