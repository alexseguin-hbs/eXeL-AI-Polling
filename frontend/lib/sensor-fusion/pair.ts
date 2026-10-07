import { unsupportedChars } from "../light-codex";

function refused(text: string) {
  return unsupportedChars(text);
}

function escapeName(value: string) {
  const amp = "&" + "amp;";
  const lt = "&" + "lt;";
  const gt = "&" + "gt;";
  const quot = "&" + "quot;";
  return value.replace(/&/g, amp).replace(/</g, lt).replace(/>/g, gt).replace(/"/g, quot);
}

/** The one project name the page sends a finished set to. */
export const SENSOR_FUSION_PROJECT = "sensor-fusion";

export type PairNames = { image: string; xml: string; codex1: string; codex2: string };

/** The picture, its XML, and its two Light Codex strips share one name and one folder. */
export function pairNames(fileName: string): PairNames {
  const stem = fileName.replace(/\.[^.]+$/, "") || "picture";
  return {
    image: fileName,
    xml: `${stem}.xml`,
    codex1: `${stem}.l1.codex.png`,
    codex2: `${stem}.l2.codex.png`,
  };
}

/** UTC time in the Vision-2525 stamp. Only characters Light Codex can carry. */
export function codexStamp(date = new Date()) {
  const part = (value: number) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}.${part(date.getUTCMonth() + 1)}.${part(date.getUTCDate())}_${part(date.getUTCHours())}.${part(date.getUTCMinutes())}..${part(date.getUTCSeconds())}`;
}

/** A person, kept to letters Light Codex can write. */
export function codexWho(raw: string) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9 ._-]/g, "").replace(/\s+/g, " ").trim();
  return clean || "GUEST";
}

export function codexLine(input: {
  file: string;
  level: 1 | 2;
  who: string;
  when: string;
  l1?: { who: string; when: string };
}) {
  const who = codexWho(input.who);
  void input.file;
  const line = input.level === 2 && input.l1
    ? `LEVEL 1: ${codexWho(input.l1.who)} ${input.l1.when} LEVEL 2: ${who} ${input.when}`
    : `LEVEL 1: ${who} ${input.when}`;
  const bad = refused(line);
  if (bad.length) throw new Error(`Light Codex cannot write ${bad.join(" ")}`);
  return line;
}

/** The boxes a live picture can carry. Level 2 replaces Level 1. One line: name, then left, top, right, bottom. */
export function upperLeftLine(boxes: { name: string; level: number; xmin: number; ymin: number; xmax: number; ymax: number }[], maxChars = 0) {
  const reviewed = boxes.filter((box) => box.level === 2);
  const chosen = reviewed.length ? reviewed : boxes;
  const parts = chosen
    .map((box) => `${codexWho(box.name)} ${Math.round(box.xmin)} ${Math.round(box.ymin)} ${Math.round(box.xmax)} ${Math.round(box.ymax)}`)
    .filter((part) => !unsupportedChars(part).length);
  while (parts.length > 1 && maxChars > 0 && parts.join(" • ").length > maxChars) parts.pop();
  const line = parts.join(" • ");
  if (!line || (maxChars > 0 && line.length > maxChars) || unsupportedChars(line).length) return "";
  return line;
}

/** The picture mark. Level 1 is written first, so the 1×1 line places it in the bottom-right corner. Level 2 continues to the left, the same way a later PDF signer sits left of the first. A blank time writes nothing. */
export function bottomRightLine(who: string, when: string, reviewer = "", reviewedAt = "") {
  const time = when.replace(/[^0-9._]/g, "");
  if (!time) return "";
  const reviewTime = reviewedAt.replace(/[^0-9._]/g, "");
  try {
    if (reviewer && reviewTime) return codexLine({ file: "picture", level: 2, who: reviewer, when: reviewTime, l1: { who, when: time } });
    return codexLine({ file: "picture", level: 1, who, when: time });
  } catch {
    return "";
  }
}

export function emptyPairXml(fileName: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<annotation>
  <folder>Pictures</folder>
  <filename>${escapeName(fileName)}</filename>
  <size><width>0</width><height>0</height><depth>3</depth></size>
</annotation>
`;
}

/** A set can go to the project only after a different person has reviewed every box. */
export function readyForProject(boxes: { level: number; by?: string; reviewer?: string }[]) {
  return boxes.length > 0 && boxes.every((box) => box.level === 2 && !!box.reviewer && !!box.by && box.reviewer !== box.by);
}
