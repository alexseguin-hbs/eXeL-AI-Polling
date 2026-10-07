"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Settings } from "lucide-react";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
// One XML escape for the page and lib/sensor-fusion/voc.ts: a name with & or quotes reads back unchanged.
import { escapeXml, percentBox, unescapeXml } from "@/lib/sensor-fusion/voc";
import { bottomRightLine, codexLine, codexStamp, emptyPairXml, pairNames, readyForProject, SENSOR_FUSION_PROJECT, upperLeftLine } from "@/lib/sensor-fusion/pair";
import { IMAGE_INTAKE, VIDEO_INTAKE, pictureStem, pngSet, type VideoSource } from "@/lib/sensor-fusion/frames";
import { signSingleHelix, signUpperLeft } from "@/lib/light-codex";
import { crossReview, emptyClock, finalSubmission, level1Left, levelMetrics, nextFor, noteWork, readClock, saveMark, sameMember, siTokens, simulateClass, startClock, stopClock, workflowLines, writeClock, type WorkClock } from "@/lib/sensor-fusion/workflow";
import { supabase } from "@/lib/supabase";
import {
  COLORS,
  FRAMES,
  INFO_STILL,
  EXTRA_SENSORS,
  sensorsFromLabels,
  MODELS,
  MENU,
  PLATFORMS,
  START_BOX,
  applyTheme,
  coralNote,
  detectPlatform,
  explainCamera,
  captureSeconds,
  everyNthFrame,
  howManyFrames,
  howManyPictures,
  lensZoom,
  LIVE_PACE,
  livePace,
  nameList,
  placeBox,
  refuseBox,
  runPlan,
  savedLine,
  sensorPath,
  type Lens,
  type ExtraSensorId,
  type PlatformId,
  type SchemeId,
} from "./sf";
import { SENSOR_FUSION_RCORE_HISTORY } from "./ledger";
import { TRAIN_STEPS, StepIcon, type TrainStepId } from "./steps";
import styles from "./sensor-fusion.module.css";

const UI = "/sensor-fusion/ui";

function StepStrip({ current }: { current: number }) {
  return (
    <ol className={styles.stepStrip} aria-label="Training steps">
      {TRAIN_STEPS.map((step) => (
        <li
          key={step.id}
          className={step.n < current ? styles.stepDone : step.n === current ? styles.stepOn : styles.stepDim}
          aria-current={step.n === current ? "step" : undefined}
          title={step.line}
        >
          <StepIcon id={step.id as TrainStepId} />
          {step.n < current ? <span className={styles.tick}>✓</span> : null}
        </li>
      ))}
    </ol>
  );
}

function loadCnn(): Promise<{
  load: (id: string) => Promise<unknown>;
  detect: (session: unknown, video: HTMLVideoElement) => Promise<{ hits: unknown[]; fps: number }>;
  draw: (canvas: HTMLCanvasElement, video: HTMLVideoElement, result: { hits: unknown[]; fps: number }, showScores: boolean, showLabels: boolean, showFps: boolean) => void;
}> {
  const host = window as Window & { SFCnn?: Awaited<ReturnType<typeof loadCnn>> };
  if (host.SFCnn) return Promise.resolve(host.SFCnn);
  return new Promise((resolve, reject) => {
    const tag = document.createElement("script");
    tag.src = "/sensor-fusion/cnn.js";
    tag.onload = () => (host.SFCnn ? resolve(host.SFCnn) : reject(new Error("The model runner did not start.")));
    tag.onerror = () => reject(new Error("The model runner did not load."));
    document.head.appendChild(tag);
  });
}

function Glyph({ src, className }: { src: string; className?: string }) {
  return <span className={[styles.glyph, className].filter(Boolean).join(" ")} style={{ WebkitMaskImage: `url(${src})`, maskImage: `url(${src})` }} aria-hidden="true" />;
}

function ProgramDownload() {
  return (
    <a className={styles.dl} href="/sensor-fusion/download/SensorFusion-2525.html" download="SensorFusion-2525.html" title="Download" aria-label="Download">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v12" />
        <path d="M6 9l6 6 6-6" />
        <path d="M5 21h14" />
      </svg>
    </a>
  );
}

function Foot({ accent }: { accent: string }) {
  return (
    <footer className={styles.foot}>
      <RCoreBadge history={SENSOR_FUSION_RCORE_HISTORY} accent={accent} />
    </footer>
  );
}

function SettingsSheet({
  open,
  scheme,
  customHex,
  coral,
  coralLive,
  alerts,
  onCoral,
  onAlerts,
  onClose,
  onScheme,
}: {
  open: boolean;
  scheme: SchemeId | "custom";
  customHex: string;
  coral: boolean;
  coralLive: "off" | "look" | "loaded" | "missing";
  alerts: boolean;
  onCoral: (on: boolean) => void;
  onAlerts: (on: boolean) => void;
  onClose: () => void;
  onScheme: (next: SchemeId | "custom", hex?: string) => void;
}) {
  if (!open) return null;
  return (
    <div className={styles.shade} onClick={onClose}>
      <aside className={styles.drawer} onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Settings">
        <div className={styles.row}>
          <h2 style={{ flex: 1 }}>Settings</h2>
          <button className={styles.ghost} type="button" onClick={onClose} aria-label="Close settings">
            Close
          </button>
        </div>
        <div className={styles.edgeBox}>
          <p>CPU CORAL</p>
          <div className={styles.edgePick} role="group" aria-label="CPU CORAL">
            <button type="button" aria-pressed={!coral} className={!coral ? styles.swatchOn : ""} onClick={() => onCoral(false)}>
              CPU
            </button>
            <button type="button" aria-pressed={coral} className={coral ? styles.swatchOn : ""} onClick={() => onCoral(true)}>
              <span className={styles.coralSlot}>
                <Glyph className={styles.coralIcon} src={`${UI}/coral_icon.png`} />
                {coralLive === "loaded" && <i className={styles.coralTick} />}
              </span>
              CORAL
            </button>
          </div>
          {/* rev 43: CORAL picked in a browser says where Coral really runs (decideRun via coralNote). */}
          {coralNote(coral) && <p className={styles.muted}>{coralNote(coral)}</p>}
          {coral && coralLive === "loaded" && <p className={styles.muted}>Loaded.</p>}
          {coral && coralLive !== "loaded" && (
            <p className={styles.muted}>
              {coralLive === "missing" ? "Not connected. Start the program on this PC." : "Looking for Coral."}
              <br />
              python sensor_fusion_edge.py --page --coral
            </p>
          )}
        </div>
        <div className={styles.edgeBox}>
          <p>ALERTS</p>
          <div className={styles.edgePick} role="group" aria-label="Alerts">
            <button type="button" aria-pressed={alerts} className={alerts ? styles.swatchOn : ""} onClick={() => onAlerts(true)}>
              ON
            </button>
            <button type="button" aria-pressed={!alerts} className={!alerts ? styles.swatchOn : ""} onClick={() => onAlerts(false)}>
              OFF
            </button>
          </div>
        </div>
        <p>SESSION COLOR SCHEME</p>
        <p className={styles.muted}>Applies to all participants in this session.</p>
        <div className={styles.swatches}>
          {COLORS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.swatch} ${scheme === item.id ? styles.swatchOn : ""}`}
              onClick={() => onScheme(item.id)}
            >
              {scheme === item.id && <span className={styles.check}>✓</span>}
              <span className={styles.dot} style={{ background: item.swatch }} />
              {item.mark ? `${item.mark} ` : ""}
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={`${styles.swatch} ${scheme === "custom" ? styles.swatchOn : ""}`}
            onClick={() => onScheme("custom")}
          >
            {scheme === "custom" && <span className={styles.check}>✓</span>}
            <span className={styles.dot} style={{ background: customHex }} />
            Custom
          </button>
        </div>
        {scheme === "custom" && (
          <label>
            Custom color
            <input type="color" value={customHex} aria-label="Custom session color" onChange={(event) => onScheme("custom", event.target.value)} />
          </label>
        )}
        <button type="button" className={`${styles.frame} ${scheme === "atlantis" ? styles.swatchOn : ""}`} onClick={() => onScheme("atlantis")}>
          The Atlantis Accords
          <small className={styles.muted}> 7 sections</small>
        </button>
        <button type="button" className={`${styles.frame} ${scheme === "vision" ? styles.swatchOn : ""}`} onClick={() => onScheme("vision")}>
          Vision • 2525
          <small className={styles.muted}> Humanity’s Coordination Framework</small>
        </button>
      </aside>
    </div>
  );
}
type Step = "login" | "menu" | "work" | "label";
const INFO_NOTES: Record<string, { text: string; side: "left" | "right" }> = {
  sensor: { text: "SENSOR 1. Turns the camera on or off.", side: "left" },
  lens: { text: "Front. Which camera. Wide sees more.", side: "left" },
  bar: { text: "Bar. How sure the strongest box is.", side: "left" },
  fps: { text: "FPS. Pictures a second. Tap the picture.", side: "left" },
  box: { text: "Box. What the model sees, and the name.", side: "right" },
  pct: { text: "%. Shows or hides the number.", side: "right" },
  labels: { text: "Labels. Shows or hides the name.", side: "right" },
  model: { text: "Demo.90. The model. Tap it to pick another.", side: "right" },
  capture: { text: "Capture. Saves pictures from the camera.", side: "right" },
  annotate: { text: "Annotate. You draw the boxes.", side: "right" },
  upload: { text: "Upload. Sends a finished set.", side: "right" },
};

type Shot = { id: string; url: string; name?: string; plain?: string; source?: "sensor" | "device" | "video" | VideoSource; original?: string };
type Mark = { id: string; name: string; left: number; top: number; right: number; bottom: number; level: 1 | 2; by?: string; reviewer?: string; at?: string; reviewedAt?: string };
type Edge = "l" | "r" | "t" | "b";

function shownCodex(list: Mark[]) {
  const labeled = list.find((item) => item.by && item.at);
  const reviewed = [...list].reverse().find((item) => item.level === 2 && item.reviewer && item.reviewedAt);
  if (!labeled?.by || !labeled.at) return "";
  return bottomRightLine(labeled.by, labeled.at, reviewed?.reviewer || "", reviewed?.reviewedAt || "");
}

function loadStill(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The picture did not open."));
    image.src = url;
  });
}

function pictureName(shot: Shot) {
  return shot.name || `${shot.id}.png`;
}

function xmlName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".xml";
}

function vocXml(fileName: string, width: number, height: number, objects: Mark[]) {
  const boxes = objects
    .map((item) => {
      const box = percentBox(item, width, height);
      const xmin = box.xmin;
      const xmax = box.xmax;
      const ymin = box.ymin;
      const ymax = box.ymax;
      const who = item.by ? `\n    <labeledby>${escapeXml(item.by)}</labeledby>` : "";
      const when = item.at ? `\n    <labeledat>${escapeXml(item.at)}</labeledat>` : "";
      const reviewer = item.reviewer ? `\n    <reviewedby>${escapeXml(item.reviewer)}</reviewedby>` : "";
      const reviewedAt = item.reviewedAt ? `\n    <reviewedat>${escapeXml(item.reviewedAt)}</reviewedat>` : "";
      return `  <object>
    <name>${escapeXml(item.name)}</name>${who}${when}${reviewer}${reviewedAt}
    <level>${item.level}</level>
    <pose>Unspecified</pose>
    <truncated>0</truncated>
    <difficult>0</difficult>
    <bndbox>
      <xmin>${xmin}</xmin>
      <ymin>${ymin}</ymin>
      <xmax>${xmax}</xmax>
      <ymax>${ymax}</ymax>
    </bndbox>
  </object>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<annotation>
  <folder>Pictures</folder>
  <filename>${escapeXml(fileName)}</filename>
  <size>
    <width>${width}</width>
    <height>${height}</height>
    <depth>3</depth>
  </size>
${boxes}
</annotation>
`;
}

function readXmlStore(): Record<string, string> {
  try {
    const parsed = JSON.parse(window.localStorage.getItem("sf2525-xml") || "{}") as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeXml(fileName: string, xml: string) {
  const stored = readXmlStore();
  stored[fileName] = xml;
  window.localStorage.setItem("sf2525-xml", JSON.stringify(stored));
}

function readVoc(xml: string) {
  const text = (value: string) => unescapeXml(value);
  const file = text(/<filename>([^<]*)<\/filename>/.exec(xml)?.[1] || "");
  const width = Number(/<width>(\d+)<\/width>/.exec(xml)?.[1] || 0);
  const height = Number(/<height>(\d+)<\/height>/.exec(xml)?.[1] || 0);
  const boxes: { name: string; xmin: number; ymin: number; xmax: number; ymax: number; level: number; by: string; reviewer: string; at: string; reviewedAt: string }[] = [];
  const blocks = xml.match(/<object>[\s\S]*?<\/object>/g) || [];
  for (const chunk of blocks) {
    const num = (tag: string) => Number(new RegExp(`<${tag}>(\\d+)</${tag}>`).exec(chunk)?.[1] || 0);
    boxes.push({
      name: text(/<name>([^<]*)<\/name>/.exec(chunk)?.[1] || ""),
      xmin: num("xmin"),
      ymin: num("ymin"),
      xmax: num("xmax"),
      ymax: num("ymax"),
      level: num("level") || 1,
      by: text(/<labeledby>([^<]*)<\/labeledby>/.exec(chunk)?.[1] || ""),
      reviewer: text(/<reviewedby>([^<]*)<\/reviewedby>/.exec(chunk)?.[1] || ""),
      at: text(/<labeledat>([^<]*)<\/labeledat>/.exec(chunk)?.[1] || ""),
      reviewedAt: text(/<reviewedat>([^<]*)<\/reviewedat>/.exec(chunk)?.[1] || ""),
    });
  }
  return { file, width, height, boxes };
}

function setFolderOf(fileName: string) {
  const base = pictureStem(fileName);
  return base.replace(/[._]\d+$/, "") || "capture";
}

async function writeNamed(folder: Folder, files: { name: string; blob: Blob }[]) {
  for (const file of files) {
    const handle = await folder.getFileHandle(file.name, { create: true });
    const writable = await handle.createWritable();
    await writable.write(file.blob);
    await writable.close();
  }
}

function downloadNamed(files: { name: string; blob: Blob }[]) {
  for (const file of files) downloadBlob(file.name, URL.createObjectURL(file.blob));
}

async function saveXmlFile(fileName: string, xml: string) {
  writeXml(fileName, xml);
  const set = pngSet(fileName);
  const files = [{ name: set.xml, blob: new Blob([xml], { type: "application/xml" }) }];
  if (chosenFolder) {
    const setFolder = await (await ecosystemRoot(chosenFolder)).getDirectoryHandle(setFolderOf(fileName), { create: true });
    await writeNamed(setFolder, files);
    return `${deviceSavePath()}/${setFolderOf(fileName)}/${set.xml}`;
  }
  downloadNamed(files);
  return set.xml;
}

function lensName(label: string): Lens | null {
  const name = label.toLowerCase();
  if (/front|face|selfie|user/.test(name)) return "front";
  if (/ultra/.test(name)) return "ultra";
  if (/tele/.test(name)) return "tele";
  if (/back|rear|environment|wide/.test(name)) return "wide";
  return null;
}

function realCameraCount(devices: MediaDeviceInfo[]) {
  const labels = devices
    .filter((device) => device.kind === "videoinput")
    .map((device) => device.label.trim())
    .filter((label) => label && !/infrared|\bdepth\b|\(ir\)/i.test(label));
  const names = new Set(labels.map((label) => label.toLowerCase().replace(/\s*\([^)]*\)\s*/g, "").trim()));
  return names.size;
}

function phoneKind() {
  const agent = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(agent)) return "ios";
  if (/Android/i.test(agent)) return "android";
  return "other";
}

function classKey(raw: string) {
  const clean = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  return clean || "picture";
}

function pictureFile(label: string, number: number, ext = "png") {
  return `${classKey(label)}_${String(number).padStart(4, "0")}.${ext}`;
}

function highestNumber(label: string, names: string[]) {
  const key = classKey(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${key}[_\\.](\\d+)(?:\\.L[12])?\\.(png|jpe?g|xml)$`, "i");
  let max = 0;
  for (const name of names) {
    const match = pattern.exec(name);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return max;
}

async function namesIn(folder: Folder) {
  if (!folder.entries) return [] as string[];
  const names: string[] = [];
  for await (const [name, handle] of folder.entries()) {
    names.push(name);
    if (handle.kind !== "directory") continue;
    try {
      const child = await folder.getDirectoryHandle(name, { create: false });
      if (!child.entries) continue;
      for await (const [childName] of child.entries()) names.push(childName);
    } catch {
      /* A folder we cannot read does not change the next number. */
    }
  }
  return names;
}

async function lastUsed(label: string) {
  const key = `sf2525-seq-${classKey(label)}`;
  const local = Number(window.localStorage.getItem(key) || "0") || 0;
  let fromFolder = 0;
  if (chosenFolder) {
    try {
      fromFolder = highestNumber(label, await namesIn(chosenFolder));
    } catch {
      fromFolder = 0;
    }
  }
  const used = Math.max(local, fromFolder);
  if (used !== local) window.localStorage.setItem(key, String(used));
  return used;
}

async function peekNames(label: string, count: number, ext = "png") {
  const used = await lastUsed(label);
  return Array.from({ length: count }, (_, index) => pictureFile(label, used + index + 1, ext));
}

function commitNames(label: string, count: number) {
  const key = `sf2525-seq-${classKey(label)}`;
  const used = Number(window.localStorage.getItem(key) || "0") || 0;
  window.localStorage.setItem(key, String(used + count));
}

function setNameOf(raw: string) {
  const clean = raw.trim().replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
  return clean || "capture";
}

type Writable = { write: (data: Blob) => Promise<void>; close: () => Promise<void> };
type Folder = {
  name: string;
  getDirectoryHandle: (name: string, options: { create: boolean }) => Promise<Folder>;
  getFileHandle: (name: string, options: { create: boolean }) => Promise<{ createWritable: () => Promise<Writable> }>;
  entries?: () => AsyncIterable<[string, { kind?: string }]>;
};

let chosenFolder: Folder | null = null;
let savePlatform: PlatformId = "win";

function deviceSavePath(parts: string[] = []) {
  return sensorPath(savePlatform, parts);
}

async function ecosystemRoot(folder: Folder) {
  if (folder.name === "SensorFusion") return folder;
  const home = folder.name === "Home" ? folder : await folder.getDirectoryHandle("Home", { create: true });
  return home.getDirectoryHandle("SensorFusion", { create: true });
}

async function pickFreshFolder() {
  const picker = (window as Window & { showDirectoryPicker?: (options: { mode: "readwrite"; id: string }) => Promise<Folder> }).showDirectoryPicker;
  if (!picker) return null;
  const picked = await picker({ mode: "readwrite", id: "sensor-fusion-new-folder" });
  chosenFolder = picked;
  return picked;
}

async function filesOf(list: Shot[]) {
  const store = readXmlStore();
  const files: { name: string; blob: Blob }[] = [];
  for (const shot of list) {
    const name = pictureName(shot);
    const response = await fetch(shot.url);
    files.push({ name, blob: await response.blob() });
    const xml = store[name] || emptyPairXml(name);
    files.push({ name: pngSet(name).xml, blob: new Blob([xml], { type: "application/xml" }) });
  }
  return files;
}

async function chooseSaveFolder() {
  const picker = (window as Window & { showDirectoryPicker?: (options: { mode: "readwrite"; id: string }) => Promise<Folder> }).showDirectoryPicker;
  if (!picker) return null;
  const picked = await picker({ mode: "readwrite", id: "sensor-fusion-save" });
  chosenFolder = picked;
  return picked;
}

type SaveResult = { how: "folder" | "shared" | "downloaded"; where: string };

// rev 43: the result says what really happened. A share or a download names no folder, because the app made none.
async function saveNumberedPictures(setName: string, files: { name: string; blob: Blob }[]): Promise<SaveResult> {
  const paired = files.flatMap((file) => {
    const names = pairNames(file.name);
    return [file, { name: names.xml, blob: new Blob([emptyPairXml(file.name)], { type: "application/xml" }) }];
  });
  const folder = chosenFolder || (await chooseSaveFolder());
  if (folder) {
    const setFolder = await (await ecosystemRoot(folder)).getDirectoryHandle(setName, { create: true });
    await writeNamed(setFolder, paired);
    return { how: "folder", where: deviceSavePath([setName]) };
  }
  const shared = files.map((file) => new File([file.blob], file.name, { type: file.name.endsWith(".jpg") ? "image/jpeg" : "image/png" }));
  const share = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (share.canShare?.({ files: shared }) && navigator.share) {
    await navigator.share({ files: shared, title: "SensorFusion" });
    downloadNamed(paired.filter((file) => file.name.endsWith(".xml")));
    return { how: "shared", where: "" };
  }
  downloadNamed(paired);
  return { how: "downloaded", where: deviceSavePath() };
}

const SAVED_TITLE: Record<SaveResult["how"], string> = { folder: "Pictures saved.", shared: "Pictures shared.", downloaded: "Pictures downloaded." };

async function fileToPng(file: File, name: string): Promise<{ name: string; blob: Blob; url: string } | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That picture did not open."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth || 1;
    canvas.height = image.naturalHeight || 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(image, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((item) => resolve(item), "image/png"));
    if (!blob) return null;
    return { name, blob, url: canvas.toDataURL("image/png") };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function downloadBlob(fileName: string, href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.click();
}

function clampPct(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function Labeler({
  shots,
  names,
  who,
  accent,
  onBack,
}: {
  shots: Shot[];
  names: string[];
  who: string;
  accent: string;
  onBack: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<Edge | null>(null);
  const edges = useRef<{ left: number; top: number; right: number; bottom: number }>({ ...START_BOX });
  const [pics, setPics] = useState<Shot[]>(shots);
  const [index, setIndex] = useState(0);
  const [labelName, setLabelName] = useState(names[0] || "person");
  const [left, setLeft] = useState<number>(START_BOX.left);
  const [top, setTop] = useState<number>(START_BOX.top);
  const [right, setRight] = useState<number>(START_BOX.right);
  const [bottom, setBottom] = useState<number>(START_BOX.bottom);
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});
  const [editing, setEditing] = useState("");
  const [note, setNote] = useState("");
  // The saved box whose row was tapped: its outline lights up (rev 43).
  const [lit, setLit] = useState("");
  const projectName = pics[0] ? setFolderOf(pictureName(pics[0])) : "project";
  const [clock, setClock] = useState<WorkClock>(() => emptyClock("project"));
  const [tick, setTick] = useState(0);
  const pic = pics[index];
  const picId = pic?.id || "";
  edges.current = { left, top, right, bottom };

  function resetBox() {
    setLeft(START_BOX.left);
    setTop(START_BOX.top);
    setRight(START_BOX.right);
    setBottom(START_BOX.bottom);
  }

  useEffect(() => {
    setClock(readClock(projectName));
  }, [projectName]);

  useEffect(() => {
    if (!clock.open) return;
    const id = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(id);
  }, [clock.open]);

  function remember(next: WorkClock) {
    setClock(next);
    writeClock(next);
  }

  function toggleClock() {
    remember(clock.open ? stopClock(clock, Date.now()) : startClock(clock, who || "guest", Date.now()));
  }

  function runSim() {
    try {
      const built = simulateClass(200, Date.now(), (input) => codexLine(input));
      setNote(built.ok ? built.note : built.note);
    } catch (err) {
      setNote(err instanceof Error ? err.message : "The simulation did not finish.");
    }
  }

  function goNext() {
    const pages = pics.map((shot) => ({ id: shot.id, boxes: marks[shot.id] || [] }));
    const step = nextFor(pages, who || "guest", pic?.id || "");
    const at = pics.findIndex((shot) => shot.id === step.id);
    if (at >= 0) setIndex(at);
    setNote(step.note);
  }

  function touchWork(picture: string, kind: "annotate" | "level2" | "adjust") {
    remember(noteWork(clock, who || "guest", picture, kind));
  }

  useEffect(() => {
    if (!pic) return;
    setEditing("");
    setLit("");
    const stored = readXmlStore()[pictureName(pic)];
    if (!stored) {
      resetBox();
      return;
    }
    const page = readVoc(stored);
    const list: Mark[] = page.boxes.map((box, boxIndex) => ({
      id: `${pic.id}-${boxIndex}`,
      name: box.name,
      left: page.width ? Math.round((box.xmin / page.width) * 100) : 40,
      top: page.height ? Math.round((box.ymin / page.height) * 100) : 35,
      right: page.width ? Math.round((box.xmax / page.width) * 100) : 60,
      bottom: page.height ? Math.round((box.ymax / page.height) * 100) : 65,
      level: box.level === 2 ? 2 : 1,
      by: box.by,
      reviewer: box.reviewer,
      at: box.at,
      reviewedAt: box.reviewedAt,
    }));
    setMarks((current) => ({ ...current, [pic.id]: list }));
    const box = list[list.length - 1];
    if (box) {
      setLeft(box.left);
      setTop(box.top);
      setRight(box.right);
      setBottom(box.bottom);
      setLabelName(box.name);
      setEditing(box.id);
      return;
    }
    resetBox();
  }, [picId]);

  useEffect(() => {
    const fit = fitRef.current;
    const frame = stageRef.current;
    const image = imgRef.current;
    if (!fit || !frame || !image) return;
    const place = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      if (!width || !height) return;
      const scale = Math.min(fit.clientWidth / width, fit.clientHeight / height);
      if (!Number.isFinite(scale) || scale <= 0) return;
      const nextW = Math.max(1, Math.floor(width * scale));
      const nextH = Math.max(1, Math.floor(height * scale));
      frame.style.width = `${nextW}px`;
      frame.style.height = `${nextH}px`;
      image.style.width = `${nextW}px`;
      image.style.height = `${nextH}px`;
    };
    place();
    const watch = new ResizeObserver(place);
    watch.observe(fit);
    image.addEventListener("load", place);
    return () => {
      watch.disconnect();
      image.removeEventListener("load", place);
    };
  }, [picId]);

  function point(event: ReactPointerEvent) {
    const box = stageRef.current?.getBoundingClientRect();
    if (!box || !box.width || !box.height) return null;
    return {
      x: clampPct(((event.clientX - box.left) / box.width) * 100),
      y: clampPct(((event.clientY - box.top) / box.height) * 100),
    };
  }

  function onMove(event: ReactPointerEvent) {
    if (!drag.current) return;
    const at = point(event);
    if (!at) return;
    const edge = edges.current;
    if (drag.current === "l") setLeft(clampPct(Math.min(at.x, edge.right - 1)));
    if (drag.current === "r") setRight(clampPct(Math.max(at.x, edge.left + 1)));
    if (drag.current === "t") setTop(clampPct(Math.min(at.y, edge.bottom - 1)));
    if (drag.current === "b") setBottom(clampPct(Math.max(at.y, edge.top + 1)));
  }

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const label = classKey(labelName);
    const names = await peekNames(label, files.length);
    const made = (await Promise.all(Array.from(files).map((file, fileIndex) => fileToPng(file, names[fileIndex])))).filter(
      (item): item is { name: string; blob: Blob; url: string } => Boolean(item),
    );
    if (!made.length) {
      setNote("Those pictures did not open.");
      return;
    }
    commitNames(label, made.length);
    if (chosenFolder) {
      try {
        await saveNumberedPictures(label, made.map((item) => ({ name: item.name, blob: item.blob })));
      } catch {
        /* The pictures still open here if the folder stops. */
      }
    }
    setPics((current) => [
      ...made.map((item, fileIndex) => ({ id: `${Date.now()}-${fileIndex}`, url: item.url, name: item.name, source: "device" as const })),
      ...current,
    ]);
    setIndex(0);
  }

  async function writePicture(fileName: string, list: Mark[]) {
    const image = imgRef.current;
    const width = image?.naturalWidth || 0;
    const height = image?.naturalHeight || 0;
    if (!width || !height) {
      setNote("The picture is still opening.");
      return "";
    }
    return saveXmlFile(fileName, vocXml(fileName, width, height, list));
  }

  async function ensurePng(fileName: string, list: Mark[]) {
    const named = pngSet(fileName).png;
    if (!pic) return named;
    const shown = imgRef.current;
    let base: HTMLImageElement | null = shown;
    if (pic.plain) {
      try {
        base = await loadStill(pic.plain);
      } catch {
        base = shown;
      }
    }
    if (!base || !(base.naturalWidth || base.width) || !(base.naturalHeight || base.height)) return fileName;
    const width = base.naturalWidth || base.width;
    const height = base.naturalHeight || base.height;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return fileName;
    ctx.drawImage(base, 0, 0);
    try {
      let pixels = ctx.getImageData(0, 0, width, height);
      const boxes = upperLeftLine(list.map((item) => percentBox(item, width, height)), Math.floor(width / 4) - 8);
      if (boxes && height >= 1) pixels = signUpperLeft(pixels, boxes);
      const line = shownCodex(list);
      if (line && width >= (line.length + 8) * 4 && height >= 1) pixels = signSingleHelix(pixels, line);
      ctx.putImageData(pixels, 0, 0);
    } catch {
      /* The XML still holds the boxes, the person, and the time. */
    }
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((item) => resolve(item), "image/png"));
    if (!blob) return fileName;
    const url = URL.createObjectURL(blob);
    if (chosenFolder) {
      try {
        const setFolder = await (await ecosystemRoot(chosenFolder)).getDirectoryHandle(classKey(labelName), { create: true });
        await writeNamed(setFolder, [{ name: named, blob }]);
      } catch {
        /* The new picture still replaces the old one on this screen. */
      }
    }
    const plain = pic.plain || pic.url;
    setPics((current) => current.map((shot) => (shot.id === pic.id ? { ...shot, name: named, plain, url } : shot)));
    return named;
  }

  async function saveBox() {
    if (!pic) return;
    if (!imgRef.current?.naturalWidth || !imgRef.current?.naturalHeight) {
      setNote("The picture is still opening.");
      return;
    }
    const prior = marks[pic.id] || [];
    const previous = editing ? prior.find((item) => item.id === editing) : undefined;
    const draft: Mark = {
      id: editing || `${Date.now()}`,
      name: labelName.trim() || names[0] || "person",
      left,
      top,
      right,
      bottom,
      level: 1,
      by: who || "guest",
      at: codexStamp(),
    };
    const saved = saveMark(previous, draft, who || "guest");
    const waiting = level1Left(pics.map((shot) => ({ boxes: marks[shot.id] || [] })));
    if (saved.kind !== "annotate" && waiting > 0) {
      setNote(`Finish Level 1 first. ${waiting} ${waiting === 1 ? "picture" : "pictures"} still need a box.`);
      return;
    }
    const mark: Mark = { ...saved.box, level: saved.box.level };
    // rev 43: a box that is already saved, or the untouched start box after a save, is refused with one sentence.
    const refused = refuseBox(prior, mark, editing);
    if (refused) {
      setNote(refused);
      return;
    }
    // One picture holds many boxes: SAVE BOX adds one, unless Fix opened a saved box (rev 38: a fix updates the same box).
    const list = placeBox(prior, mark, editing);
    setEditing("");
    resetBox();
    setMarks({ ...marks, [pic.id]: list });
    const fileName = await ensurePng(pictureName(pic), list);
    touchWork(fileName, saved.kind);
    const where = await writePicture(fileName, list);
    if (where) {
      const kept = chosenFolder ? `Saved ${where}.` : `Box ${list.length} kept on this device. FILES saves ${where}.`;
      setNote(`${kept} ${fileName}. Next: another box, or LEVEL 2 by a second person.`);
    }
  }

  async function acceptBox(mark: Mark) {
    if (!pic) return;
    const result = crossReview(mark, who || "guest", codexStamp(), pics.map((shot) => ({ boxes: marks[shot.id] || [] })));
    if (!result.ok) {
      setNote(result.note);
      return;
    }
    const list = (marks[pic.id] || []).map((item) => (item.id === mark.id ? { ...item, ...result.box } : item));
    setMarks({ ...marks, [pic.id]: list });
    const fileName = await ensurePng(pictureName(pic), list);
    touchWork(fileName, "level2");
    const where = await writePicture(fileName, list);
    if (where) setNote(`Level 2 saved. ${fileName}. ${where}`);
  }

  function fixBox(mark: Mark) {
    setEditing(mark.id);
    setLeft(mark.left);
    setTop(mark.top);
    setRight(mark.right);
    setBottom(mark.bottom);
    setLabelName(mark.name);
    setNote("Move the box, then save it again.");
  }

  async function rejectBox(mark: Mark) {
    if (!pic) return;
    const list = (marks[pic.id] || []).filter((item) => item.id !== mark.id);
    if (editing === mark.id) setEditing("");
    if (lit === mark.id) setLit("");
    setMarks({ ...marks, [pic.id]: list });
    if (who && !sameMember(who, mark.by || "guest")) touchWork(pictureName(pic), "adjust");
    const where = await writePicture(pictureName(pic), list);
    if (where) setNote(`Removed. ${where}`);
  }

  async function reviewOpen() {
    if (!pic) return;
    const list = marks[pic.id] || [];
    const mark = list.find((item) => item.id === editing) || list.find((item) => item.level !== 2);
    if (!mark) {
      setNote(list.length ? "This box is already reviewed." : "Save a box first.");
      return;
    }
    await acceptBox(mark);
  }

  function mergeTraining() {
    const project = pics.filter((shot) => pictureName(shot));
    if (!project.length) {
      setNote("Open the project's pictures first. Level 1 and Level 2 stay XML.");
      return;
    }
    const store = readXmlStore();
    const pages = project.map((shot) => {
      const xml = store[pictureName(shot)];
      return xml ? readVoc(xml) : null;
    });
    if (pages.some((page) => !page || !page.boxes.length)) {
      setNote("Every picture needs a Level 1 box first. Both levels stay XML.");
      return;
    }
    const ready = pages.flatMap((page) => page?.boxes || []);
    if (ready.some((box) => box.level !== 2 || !box.reviewer || box.reviewer === box.by)) {
      setNote("JSON waits. Every picture in this project still needs Level 2, saved as XML.");
      return;
    }
    const images = pages.filter((page): page is NonNullable<typeof page> => !!page && page.boxes.length > 0).map((page) => {
      const labeled = page.boxes.find((box) => box.by && box.at);
      const reviewed = [...page.boxes].reverse().find((box) => box.level === 2 && box.reviewer && box.reviewedAt && box.by && box.at);
      let l1 = "";
      let l2 = "";
      try {
        if (labeled) l1 = codexLine({ file: page.file, level: 1, who: labeled.by, when: labeled.at });
        if (labeled && reviewed) l2 = codexLine({ file: page.file, level: 2, who: reviewed.reviewer, when: reviewed.reviewedAt, l1: { who: labeled.by, when: labeled.at } });
      } catch (err) {
        setNote(err instanceof Error ? err.message : "The set could not be saved.");
        return null;
      }
      return { file: page.file, l1, l2, boxes: page.boxes };
    });
    if (images.some((image) => !image)) return;
    const built = finalSubmission({ clock, now: Date.now(), images: images.filter((image): image is NonNullable<typeof image> => !!image) });
    if (!built.ok) {
      setNote(built.note);
      return;
    }
    const packet = `${setFolderOf(pictureName(project[0]))}-training.json`;
    downloadBlob(packet, URL.createObjectURL(new Blob([JSON.stringify(built.packet, null, 2)], { type: "application/json" })));
    setNote(`${built.note} ${packet} is the packet for training.`);
  }

  async function saveFiles() {
    if (!pic) return;
    const list = marks[pic.id] || [];
    if (!list.length) {
      setNote("Save a box first.");
      return;
    }
    const image = imgRef.current;
    const width = image?.naturalWidth || 0;
    const height = image?.naturalHeight || 0;
    if (!width || !height) {
      setNote("The picture is still opening.");
      return;
    }
    const where = await saveXmlFile(pictureName(pic), vocXml(pictureName(pic), width, height, list));
    // R4a: nothing is written to the cloud yet (042 members-only) — the save says where the file is AND that it stays here.
    setNote(`Saved ${where}. These boxes stay on this device.`);
  }

  const metrics = levelMetrics(pics.map((shot) => ({ id: shot.id, boxes: marks[shot.id] || [] })), who || "guest");
  const boxLeft = Math.min(left, right);
  const boxTop = Math.min(top, bottom);
  const boxWidth = Math.abs(right - left);
  const boxHeight = Math.abs(bottom - top);

  return (
    <main className={styles.screen}>
      <header className={styles.piTop}>
        <button type="button" className={styles.ghost} onClick={onBack}>
          Menu
        </button>
        <StepIcon id="annotate" />
        <span className={styles.who}>Annotate Images</span>
      </header>
      <div className={`${styles.fill} ${styles.labelFill}`}>
        <StepStrip current={2} />
        <label className={styles.file}>
          Add pictures
          <input type="file" accept={IMAGE_INTAKE} multiple onChange={(event) => addFiles(event.target.files)} />
        </label>
        {pics.length > 1 && (
          <div className={styles.film}>
            {pics.map((item, itemIndex) => (
              <button key={item.id} type="button" className={itemIndex === index ? styles.filmOn : styles.filmItem} onClick={() => setIndex(itemIndex)}>
                <img src={item.url} alt="" />
              </button>
            ))}
          </div>
        )}
        {pic ? (
          <div className={styles.labelFit} ref={fitRef}>
          <div
            className={styles.labelFrame}
            ref={stageRef}
            onPointerMove={onMove}
            onPointerUp={() => {
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            <img ref={imgRef} src={pic.url} alt="" />
            {(marks[pic.id] || []).map((mark, markIndex) =>
              mark.id === editing ? null : (
                <div
                  key={mark.id}
                  className={`${styles.markOld} ${lit === mark.id ? styles.markLit : ""}`}
                  style={{
                    left: `${Math.min(mark.left, mark.right)}%`,
                    top: `${Math.min(mark.top, mark.bottom)}%`,
                    width: `${Math.abs(mark.right - mark.left)}%`,
                    height: `${Math.abs(mark.bottom - mark.top)}%`,
                  }}
                >
                  {/* rev 43: each saved box shows its number and name, the same words as its row. */}
                  <b
                    className={[
                      styles.stillTag,
                      styles.markTag,
                      Math.max(mark.left, mark.right) > 75 ? styles.stillTagEnd : "",
                      Math.min(mark.top, mark.bottom) < 8 ? styles.stillTagIn : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {markIndex + 1} {mark.name}
                  </b>
                </div>
              ),
            )}
            <div className={styles.markBox} style={{ left: `${boxLeft}%`, top: `${boxTop}%`, width: `${boxWidth}%`, height: `${boxHeight}%` }} />
            <button
              type="button"
              className={`${styles.edge} ${styles.edgeX} ${styles.edgeOutL}`}
              style={{ left: `${boxLeft}%`, top: `${boxTop + boxHeight * 0.15}%`, height: `${boxHeight * 0.7}%` }}
              aria-label="Move the left side"
              onPointerDown={(event) => {
                drag.current = "l";
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            />
            <button
              type="button"
              className={`${styles.edge} ${styles.edgeX} ${styles.edgeOutR}`}
              style={{ left: `${boxLeft + boxWidth}%`, top: `${boxTop + boxHeight * 0.15}%`, height: `${boxHeight * 0.7}%` }}
              aria-label="Move the right side"
              onPointerDown={(event) => {
                drag.current = "r";
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            />
            <button
              type="button"
              className={`${styles.edge} ${styles.edgeY} ${styles.edgeOutT}`}
              style={{ left: `${boxLeft + boxWidth * 0.15}%`, top: `${boxTop}%`, width: `${boxWidth * 0.7}%` }}
              aria-label="Move the top side"
              onPointerDown={(event) => {
                drag.current = "t";
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            />
            <button
              type="button"
              className={`${styles.edge} ${styles.edgeY} ${styles.edgeOutB}`}
              style={{ left: `${boxLeft + boxWidth * 0.15}%`, top: `${boxTop + boxHeight}%`, width: `${boxWidth * 0.7}%` }}
              aria-label="Move the bottom side"
              onPointerDown={(event) => {
                drag.current = "b";
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
            />
          </div>
          </div>
        ) : (
          <p className={styles.muted}>No pictures yet. Turn the camera on and save some, or add pictures from this device.</p>
        )}
        {pic && <p className={styles.fileName}>{pictureName(pic)}</p>}
        <label className={styles.nameLine}>
          Label name
          <input
            type="text"
            value={labelName}
            placeholder="Type a name"
            onChange={(event) => setLabelName(event.target.value)}
          />
        </label>
        <details className={styles.corners}>
          <summary>Box numbers</summary>
          <label>
            Left
            <input type="number" min={0} max={100} value={left} onChange={(event) => setLeft(clampPct(Number(event.target.value)))} />
          </label>
          <label>
            Top
            <input type="number" min={0} max={100} value={top} onChange={(event) => setTop(clampPct(Number(event.target.value)))} />
          </label>
          <label>
            Right
            <input type="number" min={0} max={100} value={right} onChange={(event) => setRight(clampPct(Number(event.target.value)))} />
          </label>
          <label>
            Bottom
            <input type="number" min={0} max={100} value={bottom} onChange={(event) => setBottom(clampPct(Number(event.target.value)))} />
          </label>
        </details>
        {/* rev 43: the buttons and the last note stay at the bottom of the pane while the picture and the rows scroll,
            so SAVE BOX is always in reach and a refused save is never silent. */}
        <div className={styles.labelDock}>
        <div className={styles.workLine}>
          <button type="button" onClick={toggleClock}>{clock.open ? "STOP" : "START"}</button>
          <button type="button" onClick={goNext}>NEXT</button>
          <button type="button" onClick={runSim}>SIM 200</button>
          <p>
            {workflowLines(clock, Date.now() + Math.min(tick, 0)).map((line) => `${line.member} ${line.seconds}s · ${line.images} images · ${line.adjustments} Level 2 ${line.adjustments === 1 ? "change" : "changes"} · ${siTokens(line.seconds)} S.I.`).join("  ·  ") || "START begins the clock."}
          </p>
        </div>
        <p className={styles.metrics}>Level 1  {metrics.level1}/{metrics.total} · Level 2  {metrics.level2}/{metrics.total} · You  {metrics.mine1} Level 1 · {metrics.mine2} Level 2</p>
        <p className={styles.swarm}>{metrics.note}</p>
        <div className={styles.labelBar}>
          <button type="button" onClick={saveBox} disabled={!pic}>
            SAVE BOX
          </button>
          <button type="button" onClick={() => void reviewOpen()} disabled={!pic}>
            LEVEL 2
          </button>
          <button type="button" onClick={mergeTraining}>
            MERGE
          </button>
          <button type="button" onClick={() => void saveFiles()} disabled={!pic}>
            FILES
          </button>
        </div>
        {note && (
          <p className={`${styles.muted} ${styles.labelNote}`} aria-live="polite">
            {note}
          </p>
        )}
        <p className={styles.rule}>The team shares Level 1, from 2 people up to the whole team. When every picture has a box, someone else reviews it. Upload sends the finished pictures and each person&apos;s S.I.</p>
        </div>
        {pic && (marks[pic.id] || []).length > 0 && (
          <div className={styles.boxList}>
            {(marks[pic.id] || []).map((mark, markIndex) => (
          <div key={mark.id} className={editing === mark.id || lit === mark.id ? styles.boxOn : styles.boxRow}>
            {/* rev 43: the row names its box; a tap lights that box's outline on the picture. */}
            <button type="button" className={styles.rowName} aria-pressed={lit === mark.id} onClick={() => setLit(lit === mark.id ? "" : mark.id)}>
              Box {markIndex + 1} · {mark.name} · {mark.level === 2 ? "reviewed" : "labeled"}
            </button>
            <button type="button" onClick={() => void acceptBox(mark)}>Accept</button>
            <button type="button" onClick={() => fixBox(mark)}>Fix</button>
            <button type="button" onClick={() => void rejectBox(mark)}>Reject</button>
          </div>
            ))}
          </div>
        )}
      </div>
      <Foot accent={accent} />
    </main>
  );
}

function paint(id: SchemeId | "custom", hex: string) {
  if (id === "custom") {
    applyTheme("#05080c", "#0c1218", hex, "#243038");
    return;
  }
  const color = COLORS.find((item) => item.id === id);
  const frame = FRAMES.find((item) => item.id === id);
  const picked = color ?? frame ?? COLORS.find((item) => item.id === "green") ?? COLORS[0];
  applyTheme(picked.bg, picked.card, picked.primary, picked.line);
}

export default function SensorFusion() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const operator = user?.name || user?.email || "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const video2Ref = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stream2Ref = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("login");
  const [platform, setPlatform] = useState<PlatformId>("win");
  const [found, setFound] = useState<PlatformId>("win");
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [scheme, setScheme] = useState<SchemeId | "custom">("green");
  const [customHex, setCustomHex] = useState("#19c8cf");
  const [settings, setSettings] = useState(false);
  const [sensorOn, setSensorOn] = useState(false);
  const [sensor2On, setSensor2On] = useState(false);
  const [sensor2Name, setSensor2Name] = useState("Camera");
  const [sensor2Note, setSensor2Note] = useState("");
  const [extra, setExtra] = useState<ExtraSensorId | "">("");
  const [extraOpen, setExtraOpen] = useState(false);
  const [dualOk, setDualOk] = useState(true);
  const [detected, setDetected] = useState<ExtraSensorId[]>([]);
  const [busy, setBusy] = useState(false);
  const [busy2, setBusy2] = useState(false);
  const [error, setError] = useState("");
  const [lens, setLens] = useState<Lens>("wide");
  const [model, setModel] = useState("demo90");
  const [coral, setCoral] = useState(false);
  const [coralLive, setCoralLive] = useState<"off" | "look" | "loaded" | "missing">("off");
  const [cameras, setCameras] = useState(0);
  const [alerts, setAlerts] = useState(true);
  const [alert, setAlert] = useState("");
  const [guest, setGuest] = useState(false);
  const [showScores, setShowScores] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showFps, setShowFps] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [tip, setTip] = useState("");
  const [tipAt, setTipAt] = useState({ left: 12, top: 12 });
  const lessonRef = useRef<HTMLDivElement>(null);
  const [poseNote, setPoseNote] = useState(false);
  const [annotate, setAnnotate] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [lastSave, setLastSave] = useState<{ title: string; line: string; names: string[] }>({ title: "Pictures saved.", line: "", names: [] });
  // One capture at a time (rev 43): the ref stops a second tap at once; the text is what the dialog shows meanwhile.
  const captureBusy = useRef(false);
  const quietRef = useRef(false);
  const [capturing, setCapturing] = useState("");
  quietRef.current = annotate || Boolean(capturing);
  const [saveFolder, setSaveFolder] = useState("");
  const [nextFile, setNextFile] = useState("");
  const [trainStatus, setTrainStatus] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [cloudSaved, setCloudSaved] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [lensOpen, setLensOpen] = useState(false);
  const [name, setName] = useState("");
  const [labelPick, setLabelPick] = useState("person");
  const [count, setCount] = useState("4");
  const [every, setEvery] = useState("2");
  const [pace, setPace] = useState("e2");
  const [captureMode, setCaptureMode] = useState<"live" | "video" | "pictures">("live");
  const [videoSource, setVideoSource] = useState<VideoSource>("thermal");
  const [note, setNote] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const showScoresRef = useRef(showScores);
  const coralRef = useRef(coral);
  const modelRef = useRef(model);
  const showLabelsRef = useRef(showLabels);
  const showFpsRef = useRef(showFps);
  const alertsRef = useRef(alerts);
  const lastAlert = useRef("");
  showScoresRef.current = showScores;
  coralRef.current = coral;
  modelRef.current = model;
  showLabelsRef.current = showLabels;
  showFpsRef.current = showFps;
  alertsRef.current = alerts;
  savePlatform = platform;

  useEffect(() => {
    const savedScheme = window.localStorage.getItem("sf2525-scheme");
    const savedHex = window.localStorage.getItem("sf2525-custom") || "#19c8cf";
    const nextScheme = (savedScheme as SchemeId | "custom") || "green";
    setCustomHex(savedHex);
    setScheme(nextScheme);
    paint(nextScheme, savedHex);
    const host = detectPlatform(navigator.userAgent, navigator.platform || "");
    setFound(host);
    setPlatform(host);
    if (phoneKind() !== "other") {
      try {
        if (sessionStorage.getItem("sf2525-one-camera") === "1") setDualOk(false);
      } catch {
        /* A private tab still starts with one try. */
      }
    }
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sf-offline-sw.js").catch(() => undefined);
    }
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      stream2Ref.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = video2Ref.current;
    const stream = stream2Ref.current;
    if (!sensor2On || !video || !stream) return;
    video.srcObject = stream;
    void video.play().catch(() => undefined);
  }, [sensor2On]);

  useEffect(() => {
    const fit = () => {
      const view = window.visualViewport;
      const root = document.documentElement.style;
      root.setProperty("--sf-h", `${Math.round(view?.height ?? window.innerHeight)}px`);
      root.setProperty("--sf-w", `${Math.round(view?.width ?? window.innerWidth)}px`);
      root.setProperty("--sf-x", `${Math.round(view?.offsetLeft ?? 0)}px`);
      root.setProperty("--sf-y", `${Math.round(view?.offsetTop ?? 0)}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    window.visualViewport?.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("scroll", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("scroll", fit);
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      const skipped = window.localStorage.getItem("sf2525-guest") === "1";
      setGuest(skipped);
      setStep(skipped ? "menu" : "login");
      return;
    }
    setGuest(false);
    setStep("menu");
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "f" && event.key !== "F") return;
      const field = event.target as HTMLElement | null;
      if (field && (field.tagName === "INPUT" || field.tagName === "TEXTAREA" || field.tagName === "SELECT")) return;
      setShowFps((on) => !on);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setCoral(window.localStorage.getItem("sf2525-coral") === "1");
    setAlerts(window.localStorage.getItem("sf2525-alerts") !== "0");
  }, []);

  useEffect(() => {
    if (!coral) {
      setCoralLive("off");
      return;
    }
    let stop = false;
    const ping = async () => {
      try {
        const health = await fetch("http://127.0.0.1:8765/health", { cache: "no-store" });
        const body = (await health.json()) as { engine?: string };
        if (!stop) setCoralLive(body.engine === "Coral" ? "loaded" : "missing");
      } catch {
        if (!stop) setCoralLive("missing");
      }
    };
    setCoralLive("look");
    void ping();
    const id = window.setInterval(ping, 2500);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [coral]);

  useEffect(() => {
    let stop = false;
    const count = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videos = devices.filter((device) => device.kind === "videoinput");
        if (stop) return;
        const seen = realCameraCount(videos);
        setCameras(seen);
        setDetected(sensorsFromLabels(videos.map((device) => device.label)));
        if (seen > 0 && seen < 2 && sensorsFromLabels(videos.map((device) => device.label)).length === 0) {
          stream2Ref.current?.getTracks().forEach((track) => track.stop());
          stream2Ref.current = null;
          setSensor2On(false);
          setExtra("");
        }
      } catch {
        /* The list appears after the camera is allowed. */
      }
    };
    void count();
    navigator.mediaDevices?.addEventListener("devicechange", count);
    return () => {
      stop = true;
      navigator.mediaDevices?.removeEventListener("devicechange", count);
    };
  }, []);

  useEffect(() => {
    let stop = false;
    void lastUsed(labelPick).then((used) => {
      if (!stop) setNextFile(pictureFile(labelPick, used + 1));
    });
    return () => {
      stop = true;
    };
  }, [labelPick, saveFolder]);

  useEffect(() => {
    const labels = MODELS.find((item) => item.id === model)?.labels || ["person"];
    if (labels[0]) setLabelPick(labels[0]);
  }, [model]);

  useEffect(() => {
    if (!sensorOn || step !== "work") return;
    let stop = false;
    const run = async () => {
      try {
        const cnn = await loadCnn();
        let session: unknown = null;
        if (!coralRef.current) session = await cnn.load(modelRef.current);
        if (stop) return;
        let failed = false;
        let coralLive = false;
        const clearBoxes = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
          const fill = meterRef.current?.querySelector("i");
          if (fill instanceof HTMLElement) fill.style.height = "0%";
          if (lastAlert.current) {
            lastAlert.current = "";
            setAlert("");
          }
        };
        if (coralRef.current) clearBoxes();
        const loop = async () => {
          if (stop) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2) {
            if (quietRef.current) {
              const ctx = canvas.getContext("2d");
              if (ctx && canvas.width) ctx.clearRect(0, 0, canvas.width, canvas.height);
              if (lastAlert.current) {
                lastAlert.current = "";
                setAlert("");
              }
              const quietFill = meterRef.current?.querySelector("i");
              if (quietFill instanceof HTMLElement) quietFill.style.height = "0%";
            } else if (coralRef.current) {
              try {
                if (!coralLive) {
                  const health = await fetch("http://127.0.0.1:8765/health", { cache: "no-store" });
                  const body = (await health.json()) as { engine?: string };
                  if (body.engine !== "Coral") {
                    clearBoxes();
                    setError(body.engine === "missing" ? "The program is running, but Coral did not start." : "Not connected. Start the program on this PC.");
                    if (!stop) window.setTimeout(loop, 1500);
                    return;
                  }
                  coralLive = true;
                  setError("");
                }
                const shot = document.createElement("canvas");
                const width = 640;
                const height = Math.max(1, Math.round((width * video.videoHeight) / (video.videoWidth || width)));
                shot.width = width;
                shot.height = height;
                shot.getContext("2d")?.drawImage(video, 0, 0, width, height);
                const blob = await new Promise<Blob | null>((resolve) => shot.toBlob(resolve, "image/jpeg", 0.7));
                if (!blob) throw new Error("no frame");
                const folder = MODELS.find((item) => item.id === modelRef.current)?.folder || "Demo90";
                const sent = await fetch(`http://127.0.0.1:8765/frame?model=${encodeURIComponent(folder)}`, {
                  method: "POST",
                  headers: { "Content-Type": "image/jpeg" },
                  body: blob,
                });
                if (!sent.ok) throw new Error("coral");
                const result = (await sent.json()) as { hits: { score?: number; name?: string }[]; fps: number; engine?: string };
                if (stop || !coralRef.current) return;
                if (result.engine !== "Coral") throw new Error("not coral");
                cnn.draw(canvas, video, result, showScoresRef.current, showLabelsRef.current, showFpsRef.current);
                const hits = result.hits || [];
                const top = hits.reduce((best, hit) => Math.max(best, Number(hit.score) || 0), 0);
                let line = "";
                if (alertsRef.current) {
                  const named = hits.filter((hit) => hit.name && hit.name !== "???");
                  const best = named.reduce<(typeof named)[number] | undefined>(
                    (pick, hit) => ((Number(hit.score) || 0) > (Number(pick?.score) || 0) ? hit : pick),
                    undefined,
                  );
                  if (best?.name) line = `${best.name} ${Math.round((Number(best.score) || 0) * 100)}%`;
                }
                if (line !== lastAlert.current) {
                  lastAlert.current = line;
                  setAlert(line);
                }
                const fill = meterRef.current?.querySelector("i");
                if (fill instanceof HTMLElement) {
                  const pct = Math.round(top * 100);
                  fill.style.height = `${pct}%`;
                  fill.style.background = pct >= 80 ? "#3ec96b" : pct >= 50 ? "#ffe600" : "#ff3b30";
                }
                if (failed) {
                  failed = false;
                  setError("");
                }
              } catch (err) {
                console.error(err);
                coralLive = false;
                clearBoxes();
                if (!failed && !stop) {
                  failed = true;
                  setError("Not connected. Start the program on this PC.");
                }
              }
            } else try {
              if (!session) session = await cnn.load(modelRef.current);
              const result = await cnn.detect(session, video);
              if (stop || coralRef.current) return;
              cnn.draw(canvas, video, result, showScoresRef.current, showLabelsRef.current, showFpsRef.current);
              const hits = (result.hits || []) as { score?: number; name?: string }[];
              const top = hits.reduce((best, hit) => Math.max(best, Number(hit.score) || 0), 0);
              let line = "";
              if (alertsRef.current) {
                const named = hits.filter((hit) => hit.name && hit.name !== "???");
                const best = named.reduce<(typeof named)[number] | undefined>(
                  (pick, hit) => ((Number(hit.score) || 0) > (Number(pick?.score) || 0) ? hit : pick),
                  undefined,
                );
                if (best?.name) line = `${best.name} ${Math.round((Number(best.score) || 0) * 100)}%`;
              }
              if (line !== lastAlert.current) {
                lastAlert.current = line;
                setAlert(line);
              }
              const fill = meterRef.current?.querySelector("i");
              if (fill instanceof HTMLElement) {
                const pct = Math.round(top * 100);
                fill.style.height = `${pct}%`;
                fill.style.background = pct >= 80 ? "#3ec96b" : pct >= 50 ? "#ffe600" : "#ff3b30";
              }
              if (failed) {
                failed = false;
                setError("");
              }
            } catch (err) {
              console.error(err);
              if (!failed && !stop) {
                failed = true;
                setError("The detector could not start on this device.");
              }
            }
          }
          if (!stop) window.setTimeout(loop, 40);
        };
        void loop();
      } catch (err) {
        console.error(err);
        if (!stop) setError(coralRef.current ? "Not connected. Start the program on this PC." : "The detector could not start on this device.");
      }
    };
    void run();
    return () => {
      stop = true;
      lastAlert.current = "";
      setAlert("");
    };
  }, [sensorOn, model, step, coral]);

  useEffect(() => {
    // Back on the camera screen, the new video gets the stream that is still open, so SENSOR 1: ON shows the picture.
    if (step !== "work") return;
    const stream = streamRef.current;
    const video = videoRef.current;
    if (!stream || !video) return;
    if (stream.getVideoTracks().every((track) => track.readyState === "ended")) {
      streamRef.current = null;
      setSensorOn(false);
      return;
    }
    if (video.srcObject !== stream) {
      video.srcObject = stream;
      void video.play().catch(() => undefined);
    }
  }, [step]);

  useEffect(() => {
    // Every dialog closes with Escape, so no screen traps the person. rev 43: Settings and the model list too (rev 42 said so).
    if (!annotate && !savedNote && !infoOpen && !settings && !modelsOpen && !lensOpen && !extraOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAnnotate(false);
      setSavedNote(false);
      setInfoOpen(false);
      setTip("");
      setSettings(false);
      setModelsOpen(false);
      setLensOpen(false);
      setExtraOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [annotate, savedNote, infoOpen, settings, modelsOpen, lensOpen, extraOpen]);

  function placeTip(id: string, event: React.MouseEvent<HTMLElement>) {
    const host = lessonRef.current?.getBoundingClientRect();
    const box = event.currentTarget.getBoundingClientRect();
    if (!host) {
      setTip(id);
      return;
    }
    const noteW = 230;
    const noteH = 44;
    let left = box.left - host.left;
    let top = box.bottom - host.top + 6;
    const inDock = box.bottom > host.bottom - 88;
    if (inDock) {
      top = box.top - host.top - noteH - 4;
      left = box.left - host.left;
    } else if (box.top < host.top + 64) {
      top = box.bottom - host.top + 6;
      left = box.left - host.left;
    } else if (box.left < host.left + host.width * 0.22) {
      left = box.right - host.left + 10;
      top = box.top - host.top;
    } else {
      left = box.right - host.left + 8;
      top = box.top - host.top;
      if (left + noteW > host.width - 8) left = box.left - host.left - noteW - 8;
    }
    left = Math.max(8, Math.min(left, host.width - noteW - 8));
    top = Math.max(8, Math.min(top, host.height - noteH - 8));
    setTip(id);
    setTipAt({ left, top });
  }

  function chooseScheme(next: SchemeId | "custom", hex?: string) {
    const color = hex || customHex;
    setScheme(next);
    window.localStorage.setItem("sf2525-scheme", next);
    if (next === "custom") {
      setCustomHex(color);
      window.localStorage.setItem("sf2525-custom", color);
    }
    paint(next, color);
  }

  function chooseCoral(on: boolean) {
    setCoral(on);
    window.localStorage.setItem("sf2525-coral", on ? "1" : "0");
    if (!on) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fill = meterRef.current?.querySelector("i");
    if (fill instanceof HTMLElement) fill.style.height = "0%";
    lastAlert.current = "";
    setAlert("");
  }

  function chooseAlerts(on: boolean) {
    setAlerts(on);
    window.localStorage.setItem("sf2525-alerts", on ? "1" : "0");
    if (!on) {
      lastAlert.current = "";
      setAlert("");
    }
  }

  async function streamForLens(next: Lens) {
    const first = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: next === "front" ? { facingMode: "user" } : { facingMode: "environment" },
    });
    const devices = await navigator.mediaDevices.enumerateDevices();
    const match = devices.find((device) => device.kind === "videoinput" && lensName(device.label) === next && device.deviceId);
    if (match) {
      first.getTracks().forEach((track) => track.stop());
      return navigator.mediaDevices.getUserMedia({ audio: false, video: { deviceId: { exact: match.deviceId } } });
    }
    const track = first.getVideoTracks()[0];
    const caps = track?.getCapabilities?.() as { zoom?: { min: number; max: number } } | undefined;
    const zoom = lensZoom(next, caps?.zoom);
    if (track && zoom != null) {
      try {
        await track.applyConstraints({ advanced: [{ zoom }] } as unknown as MediaTrackConstraints);
      } catch {
        /* The phone kept the closest back camera it can open. */
      }
    }
    return first;
  }

  async function openSensor(next: Lens = lens) {
    setBusy(true);
    setError("");
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await streamForLens(next);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setLens(next);
      setSensorOn(true);
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDetected(sensorsFromLabels(devices.filter((device) => device.kind === "videoinput").map((device) => device.label)));
      setCameras(realCameraCount(devices));
    } catch (err) {
      setSensorOn(false);
      setError(explainCamera(err));
    } finally {
      setBusy(false);
    }
  }

  function clearReadout() {
    lastAlert.current = "";
    setAlert("");
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    const fill = meterRef.current?.querySelector("i");
    if (fill instanceof HTMLElement) fill.style.height = "0%";
  }

  function chooseExtra(id: ExtraSensorId | "") {
    setExtraOpen(false);
    if (!id) {
      closeSensor2();
      setExtra("");
      return;
    }
    const sensor = EXTRA_SENSORS.find((item) => item.id === id);
    if (!sensor) return;
    if (sensor.live) {
      setExtra("camera");
      void openSensor2();
      return;
    }
    closeSensor2();
    setExtra(id);
  }

  function closeSensor2() {
    stream2Ref.current?.getTracks().forEach((track) => track.stop());
    stream2Ref.current = null;
    if (video2Ref.current) video2Ref.current.srcObject = null;
    setSensor2On(false);
    setSensor2Note("");
  }

  function oneCameraOnly() {
    try {
      sessionStorage.setItem("sf2525-one-camera", "1");
    } catch {
      /* The rest of this visit still stays on one camera. */
    }
    stream2Ref.current?.getTracks().forEach((track) => track.stop());
    stream2Ref.current = null;
    if (video2Ref.current) video2Ref.current.srcObject = null;
    setSensor2On(false);
    setSensor2Note("");
    setExtra("");
    setDualOk(false);
    setError("This phone runs one camera.");
  }

  async function openSensor2() {
    const phone = phoneKind() !== "other";
    if (phone && !dualOk) return;
    setExtra("camera");
    setBusy2(true);
    setError("");
    setSensor2Note("");
    const small = { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 15 } };
    try {
      if (!streamRef.current) await openSensor();
      const devices = (await navigator.mediaDevices.enumerateDevices()).filter((device) => device.kind === "videoinput" && device.deviceId);
      setDetected(sensorsFromLabels(devices.map((device) => device.label)));
      const used = streamRef.current?.getVideoTracks()[0]?.getSettings().deviceId || "";
      const ranked = devices
        .filter((device) => device.deviceId !== used)
        .sort((a, b) => Number(lensName(a.label) === "front") - Number(lensName(b.label) === "front"));
      const pick = ranked[0];
      if (!pick) {
        if (phone) oneCameraOnly();
        else {
          setSensor2On(true);
          setSensor2Note("Only one camera showed up.");
        }
        return;
      }
      if (phone) {
        const firstTrack = streamRef.current?.getVideoTracks()[0];
        try {
          await firstTrack?.applyConstraints(small);
        } catch {
          /* The first camera stays at the size it already has. */
        }
      }
      stream2Ref.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: phone ? { deviceId: { exact: pick.deviceId }, ...small } : { deviceId: { exact: pick.deviceId } },
      });
      stream2Ref.current = stream;
      if (phone) await new Promise((resolve) => window.setTimeout(resolve, 400));
      const first = streamRef.current?.getVideoTracks()[0];
      const second = stream.getVideoTracks()[0];
      if (phone && (first?.readyState !== "live" || second?.readyState !== "live")) {
        stream.getTracks().forEach((track) => track.stop());
        stream2Ref.current = null;
        if (!first || first.readyState !== "live") await openSensor();
        oneCameraOnly();
        return;
      }
      const kind = lensName(pick.label);
      setSensor2Name(kind === "ultra" ? "0.5x" : kind === "tele" ? "2.5x" : kind === "front" ? "Front" : kind === "wide" ? "Wide" : "Camera");
      setSensor2On(true);
      if (phone) {
        try {
          sessionStorage.setItem("sf2525-one-camera", "0");
        } catch {
          /* A working pair still stays on for this visit. */
        }
      }
    } catch {
      if (phone) {
        if (!streamRef.current?.getVideoTracks().some((track) => track.readyState === "live")) await openSensor();
        oneCameraOnly();
      } else {
        setSensor2On(true);
        setSensor2Note("This phone can show one camera at a time.");
      }
    } finally {
      setBusy2(false);
    }
  }

  function closeSensor() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    // An alert is only what this frame sees: with the camera off, nothing stays on screen.
    clearReadout();
    setSensorOn(false);
  }

  async function framesFromVideo(long: boolean, howMany: number) {
    const video = videoRef.current;
    const wait = long ? 500 : livePace(pace).gap;
    if (!video || video.readyState < 2) return { shots: [] as Shot[], files: [] as { name: string; blob: Blob }[], label: classKey(labelPick) };
    const label = classKey(labelPick);
    const names = await peekNames(label, howMany);
    const shotsOut: Shot[] = [];
    const files: { name: string; blob: Blob }[] = [];
    for (let i = 0; i < howMany; i += 1) {
      setCapturing(`${i + 1} / ${howMany}`);
      const canvas = document.createElement("canvas");
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      const scale = Math.min(1, 640 / width);
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const fileName = names[i];
      const url = canvas.toDataURL("image/png");
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((file) => resolve(file), "image/png"));
      if (!blob) continue;
      shotsOut.push({ id: `${Date.now()}-${i}`, url, name: fileName, source: "sensor" });
      files.push({ name: fileName, blob });
      if (i < howMany - 1) await new Promise((resolve) => window.setTimeout(resolve, wait));
    }
    return { shots: shotsOut, files, label };
  }

  async function takeShots(long = false) {
    // A double tap wrote person_0001–0004 twice (rev 43): one capture at a time, and How many is never changed quietly.
    if (captureBusy.current) return;
    const total = long ? 90 : howManyPictures(count).n;
    if (!total) return;
    captureBusy.current = true;
    setCapturing("Starting…");
    try {
      await captureFrames(long, total);
    } finally {
      captureBusy.current = false;
      setCapturing("");
    }
  }

  async function captureFrames(long: boolean, total: number) {
    try {
      if (!chosenFolder) {
        const picked = await chooseSaveFolder();
        if (picked) setSaveFolder(picked.name);
        else if (phoneKind() !== "ios") setSaveFolder("Files");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Choose a folder for the pictures.");
      return;
    }
    if (!videoRef.current?.srcObject) {
      await openSensor();
    }
    const video = videoRef.current;
    for (let i = 0; i < 30 && video && video.readyState < 2; i += 1) {
      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }
    setAnnotate(false);
    const { shots: next, files, label } = await framesFromVideo(long, total);
    if (!next.length) {
      setError("Turn SENSOR 1 on before you save pictures.");
      setAnnotate(false);
      return;
    }
    let saved: SaveResult = { how: "downloaded", where: "" };
    setCapturing("Saving…");
    try {
      saved = await saveNumberedPictures(label, files);
      commitNames(label, files.length);
      setLastSave({ title: SAVED_TITLE[saved.how], line: savedLine(saved.how, files.length, saved.where), names: files.map((file) => file.name) });
      setNextFile(pictureFile(label, (Number(window.localStorage.getItem(`sf2525-seq-${classKey(label)}`)) || 0) + 1));
      setError("");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "The pictures were not saved.");
      return;
    }
    setShots((current) => [...current, ...next]);
    setCloudSaved(false);
    setAnnotate(false);
    setTrainStatus("");
    setSavedNote(true);
    window.localStorage.setItem(
      "sf2525-capture",
      JSON.stringify({ operator, platform, model, name: label, note, count: next.length, folder: saved.where || saved.how }),
    );
  }

  async function addFromDevice(list: FileList | null) {
    if (!list?.length || captureBusy.current) return;
    captureBusy.current = true;
    setCapturing("Saving…");
    try {
      await addDeviceFiles(list);
    } finally {
      captureBusy.current = false;
      setCapturing("");
    }
  }

  async function addDeviceFiles(list: FileList) {
    const label = classKey(labelPick);
    const names = await peekNames(label, list.length);
    const made = (await Promise.all(Array.from(list).map((file, index) => fileToPng(file, names[index])))).filter((item): item is { name: string; blob: Blob; url: string } => Boolean(item));
    if (!made.length) {
      setError("Those pictures did not open.");
      return;
    }
    const files = made.map((item) => ({ name: item.name, blob: item.blob }));
    const added: Shot[] = made.map((item, index) => ({
      id: `${Date.now()}-${index}`,
      url: item.url,
      name: item.name,
      source: "device",
      original: list[index]?.name,
    }));
    try {
      const saved = await saveNumberedPictures(label, files);
      commitNames(label, files.length);
      setLastSave({ title: SAVED_TITLE[saved.how], line: savedLine(saved.how, files.length, saved.where), names: files.map((file) => file.name) });
      setNextFile(pictureFile(label, (Number(window.localStorage.getItem(`sf2525-seq-${classKey(label)}`)) || 0) + 1));
      setError("");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "The pictures were not saved.");
      return;
    }
    setShots((current) => [...current, ...added]);
    setAnnotate(false);
    setTrainStatus("");
    setSavedNote(true);
  }

  async function addFromVideo(file: File | undefined, from: VideoSource) {
    const step = everyNthFrame(every);
    const total = howManyFrames(count);
    if (!file || !step.n || !total.n || captureBusy.current) return;
    captureBusy.current = true;
    setCapturing("Opening the video…");
    try {
      const label = classKey(labelPick);
      const names = await peekNames(label, total.n, "png");
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.muted = true;
      video.playsInline = true;
      video.preload = "auto";
      video.src = url;
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror = () => reject(new Error("That video did not open."));
      });
      const made: { name: string; blob: Blob; url: string }[] = [];
      const keep = async (index: number) => {
        const canvas = document.createElement("canvas");
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 480;
        const scale = Math.min(1, 1280 / width);
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((item) => resolve(item), "image/png"));
        if (!blob) return;
        made.push({ name: names[index], blob, url: URL.createObjectURL(blob) });
        setCapturing(`${made.length} / ${total.n}`);
      };
      const stepped = video as HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => void };
      if (stepped.requestVideoFrameCallback) {
        await video.play();
        await new Promise<void>((resolve) => {
          let seen = 0;
          let saved = 0;
          let busy = false;
          const finish = () => {
            video.pause();
            resolve();
          };
          video.onended = finish;
          const onFrame = () => {
            if (saved >= total.n || video.ended) return finish();
            seen += 1;
            if ((seen - 1) % step.n !== 0) {
              stepped.requestVideoFrameCallback?.(onFrame);
              return;
            }
            if (busy) return;
            busy = true;
            const index = saved;
            saved += 1;
            void keep(index).then(() => {
              busy = false;
              if (saved >= total.n || video.ended) finish();
              else stepped.requestVideoFrameCallback?.(onFrame);
            });
          };
          stepped.requestVideoFrameCallback(onFrame);
        });
      } else {
        const gap = step.n / 30;
        for (let index = 0; index < total.n; index += 1) {
          const at = Math.min(Math.max(0, video.duration - 0.05), index * gap);
          video.currentTime = at;
          await new Promise<void>((resolve) => {
            video.onseeked = () => resolve();
          });
          await keep(index);
        }
      }
      URL.revokeObjectURL(url);
      if (!made.length) {
        setError("That video did not give any pictures.");
        return;
      }
      const files = made.map((item) => ({ name: item.name, blob: item.blob }));
      const added: Shot[] = made.map((item, index) => ({
        id: `${Date.now()}-${index}`,
        url: item.url,
        name: item.name,
        source: from,
        original: file.name,
      }));
      const saved = await saveNumberedPictures(label, files);
      commitNames(label, files.length);
      setLastSave({ title: SAVED_TITLE[saved.how], line: savedLine(saved.how, files.length, saved.where), names: files.map((item) => item.name) });
      setNextFile(pictureFile(label, (Number(window.localStorage.getItem(`sf2525-seq-${classKey(label)}`)) || 0) + 1));
      setShots((current) => [...current, ...added]);
      setError("");
      setAnnotate(false);
      setTrainStatus("");
      setSavedNote(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "That video did not open.");
    } finally {
      captureBusy.current = false;
      setCapturing("");
    }
  }

  async function uploadSet() {
    if (!shots.length) {
      setUploadNote("Capture images before you upload a set.");
      return;
    }
    const store = readXmlStore();
    const pages = shots.map((shot) => {
      const xml = store[pictureName(shot)];
      return xml ? readVoc(xml) : null;
    });
    if (!pages.every((page) => page && readyForProject(page.boxes))) {
      setUploadNote("Level 2 is still needed. A different person reviews each box before the project can take this set.");
      setTrainStatus("");
      return;
    }
    if (!supabase) {
      setUploadNote("The project is not connected from this page. The pictures and XML stayed in the folder.");
      return;
    }
    const { data: session } = await supabase.auth.getSession();
    const owner = session.session?.user?.id || "";
    if (!owner) {
      setUploadNote("Sign in as a member of the sensor-fusion project. The pictures and XML stayed in the folder.");
      return;
    }
    let sent = 0;
    for (let index = 0; index < shots.length; index += 1) {
      const shot = shots[index];
      const page = pages[index];
      if (!page) continue;
      const fileName = pictureName(shot);
      const labeled = page.boxes.find((box) => box.by && box.at);
      const reviewed = [...page.boxes].reverse().find((box) => box.reviewer && box.reviewedAt);
      const l1 = labeled ? codexLine({ file: fileName, level: 1, who: labeled.by, when: labeled.at }) : "";
      const l2 = reviewed && labeled ? codexLine({ file: fileName, level: 2, who: reviewed.reviewer, when: reviewed.reviewedAt, l1: { who: labeled.by, when: labeled.at } }) : "";
      const picture = await supabase.from("sensor_fusion_pictures").insert({
        owner_key: owner,
        name: fileName,
        model,
        jpeg: shot.url.startsWith("data:") ? shot.url.slice(0, 500000) : `local:${fileName}`,
        project_id: SENSOR_FUSION_PROJECT,
        codex_l1: l1,
        codex_l2: l2,
      }).select("id").single();
      if (picture.error || !picture.data) {
        setUploadNote(picture.error?.message || "The project did not take this set. The pictures and XML stayed in the folder.");
        return;
      }
      const labels = page.boxes.map((box) => ({
        owner_key: owner,
        picture_id: picture.data.id,
        name: box.name,
        x1: box.xmin,
        y1: box.ymin,
        x2: box.xmax,
        y2: box.ymax,
        project_id: SENSOR_FUSION_PROJECT,
        level: box.level,
        labeled_by: box.by,
        labeled_at: box.at,
        reviewed_by: box.reviewer,
        reviewed_at: box.reviewedAt,
        codex: l2,
      }));
      const written = await supabase.from("sensor_fusion_labels").insert(labels);
      if (written.error) {
        setUploadNote(written.error.message);
        return;
      }
      sent += 1;
    }
    setCloudSaved(true);
    setError("");
    const line = `${sent} pictures are in the sensor-fusion project.`;
    setTrainStatus(line);
    setUploadNote(line);
  }

  async function saveToNewFolder() {
    if (!shots.length) {
      setUploadNote("Capture images before you save a set.");
      return;
    }
    try {
      const files = await filesOf(shots);
      const picked = await pickFreshFolder();
      const setName = setFolderOf(pictureName(shots[0]));
      if (!picked) {
        downloadNamed(files);
        setUploadNote(`Downloaded ${files.length} files. Put them in ${deviceSavePath([setName])}.`);
        return;
      }
      const setFolder = await (await ecosystemRoot(picked)).getDirectoryHandle(setName, { create: true });
      await writeNamed(setFolder, files);
      setError("");
      setUploadNote(`Saved in ${deviceSavePath([setName])}.`);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setUploadNote(err instanceof Error ? err.message : "The folder was not saved.");
    }
  }

  function pickMenu(item: (typeof MENU)[number]) {
    setPoseNote(false);
    if (item.go === "stop") {
      closeSensor();
      setStep("menu");
      return;
    }
    if (item.go === "pose") {
      setPoseNote(true);
      return;
    }
    if (item.go === "label") {
      setStep("label");
      return;
    }
    const plan = runPlan(coral, model);
    setCoral(plan.coral);
    setModel(plan.model);
    window.localStorage.setItem("sf2525-host", platform);
    setStep("work");
  }

  const who = operator || (guest ? "GUEST" : "");
  const accent =
    scheme === "custom"
      ? customHex
      : (COLORS.find((item) => item.id === scheme)?.primary ?? FRAMES.find((item) => item.id === scheme)?.primary ?? "#0cff00");

  if (step === "login") {
    return (
      <main className={styles.screen}>
        <div className={styles.fill}>
          <img className={styles.logo} src="/sensor-fusion/sensor_fusion_logo_001.png" alt="sensor fusion" />
          <h1>Sensor Fusion</h1>
          <p className={styles.muted}>Sign in with the eXeL account. If that sign-in is down, skip it and stay on this device.</p>
          <button
            className={styles.primary}
            type="button"
            disabled={isLoading}
            onClick={() => loginWithRedirect({ appState: { returnTo: "/SensorFusion-2525/" } })}
          >
            {isLoading ? "Checking sign in…" : "SIGN IN"}
          </button>
          <button
            className={styles.ghost}
            type="button"
            onClick={() => {
              window.localStorage.setItem("sf2525-guest", "1");
              setGuest(true);
              setStep("menu");
            }}
          >
            SKIP TO SENSOR FUSION
          </button>
        </div>
        <Foot accent={accent} />
      </main>
    );
  }

  if (step === "label") {
    return <Labeler shots={shots} names={(MODELS.find((item) => item.id === model)?.labels || ["person"]).filter((item) => item && item !== "???")} who={operator} accent={accent} onBack={() => setStep("menu")} />;
  }

  if (step === "menu") {
    return (
      <main className={styles.screen}>
        <header className={styles.piTop}>
          <img className={styles.logo} src="/sensor-fusion/sensor_fusion_logo_001.png" alt="sensor fusion" />
          <span className={styles.who}>{who}</span>
          <ProgramDownload />
          <button type="button" className={styles.iconBtn} onClick={() => setSettings(true)} aria-label="Settings">
            <Settings aria-hidden />
          </button>
        </header>
        <div className={styles.fill}>
          <h1>This device</h1>
          <p className={styles.muted}>
            {platform === found
              ? `Found ${PLATFORMS.find((item) => item.id === found)?.label}.`
              : `Using ${PLATFORMS.find((item) => item.id === platform)?.label}. This machine is ${PLATFORMS.find((item) => item.id === found)?.label}.`}
          </p>
          <button
            type="button"
            className={styles.textBtn}
            onClick={() => {
              if (platform === found) {
                setDeviceOpen((open) => !open);
                return;
              }
              setPlatform(found);
              setDeviceOpen(false);
            }}
          >
            {platform === found ? (deviceOpen ? "Hide the list" : "Not this device") : "Use what was found"}
          </button>
          {deviceOpen && (
          <div className={styles.picks}>
            {PLATFORMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={platform === item.id ? styles.pickOn : styles.pick}
                aria-pressed={platform === item.id}
                onClick={() => {
                  setPlatform(item.id);
                  setDeviceOpen(false);
                }}
              >
                <b>{item.label}</b>
                <span>{item.detail}</span>
              </button>
            ))}
          </div>
          )}
          <h1>Open</h1>
          <div className={styles.menu}>
            {MENU.map((item) => (
              <button key={item.id} type="button" className={styles.menuItem} onClick={() => pickMenu(item)}>
                <span>{item.n}</span>
                <span>
                  <b>{item.label}</b>
                  <small>
                    {item.id === "fusion" ? "Open the camera." : item.id === "stop" ? "Turn the camera off." : "Not ready yet."}
                  </small>
                </span>
              </button>
            ))}
          </div>
          {poseNote && (
            <p className={styles.alert}>Pose is not designed yet. It does not have the three files the other models use.</p>
          )}
        </div>
        <SettingsSheet open={settings} scheme={scheme} customHex={customHex} coral={coral} coralLive={coralLive} alerts={alerts} onCoral={chooseCoral} onAlerts={chooseAlerts} onClose={() => setSettings(false)} onScheme={chooseScheme} />
        <Foot accent={accent} />
      </main>
    );
  }

  const current = MODELS.find((item) => item.id === model) ?? MODELS[0];
  const phone = phoneKind() !== "other";
  const showSecond = (cameras >= 2 && (phone ? dualOk : true)) || detected.length > 0;

  return (
    <main className={`${styles.screen} ${styles.work}`}>
      <header className={styles.piTop}>
        <button type="button" className={styles.logoBtn} onClick={() => setStep("menu")} title="Menu">
          <img className={styles.logo} src="/sensor-fusion/sensor_fusion_logo_001.png" alt="sensor fusion" />
        </button>
        <button
          type="button"
          className={styles.sensorSwitch}
          onClick={() => (sensorOn ? closeSensor() : void openSensor())}
          disabled={busy}
        >
          <Glyph src={sensorOn ? `${UI}/toggle_switch_on_001.png` : `${UI}/toggle_switch_off_001.png`} />
          SENSOR 1: {busy ? "…" : sensorOn ? "ON" : "OFF"}
        </button>
        {showSecond && (
        <div className={styles.lensWrap}>
          <button
            type="button"
            className={styles.sensorSwitch}
            aria-expanded={extraOpen}
            aria-haspopup="listbox"
            onClick={() => setExtraOpen((open) => !open)}
            disabled={busy2}
          >
            <Glyph src={extra ? `${UI}/toggle_switch_on_001.png` : `${UI}/toggle_switch_off_001.png`} />
            SENSOR 2: {busy2 ? "…" : extra ? EXTRA_SENSORS.find((item) => item.id === extra)?.label : "OFF"}
          </button>
          {extraOpen && (
            <ul className={`${styles.lensList} ${styles.sensorMenu}`} role="listbox" aria-label="Second sensor">
              <li>
                <button type="button" role="option" aria-selected={extra === ""} onClick={() => chooseExtra("")}>
                  Off
                </button>
              </li>
              {EXTRA_SENSORS.filter((item) => (item.id === "camera" ? cameras >= 2 && (phone ? dualOk : true) : detected.includes(item.id))).map((item) => (
                <li key={item.id}>
                  <button type="button" role="option" aria-selected={extra === item.id} onClick={() => chooseExtra(item.id)}>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}
        {phone && (
        <div className={styles.lensWrap}>
          <button
            type="button"
            className={styles.lensBtn}
            aria-label="Camera"
            aria-expanded={lensOpen}
            aria-haspopup="listbox"
            onClick={() => setLensOpen((open) => !open)}
          >
            {lens === "ultra" ? "0.5x" : lens === "tele" ? "2.5x" : lens === "front" ? "Front" : "Wide"}
          </button>
          {lensOpen && (
            <ul className={styles.lensList} role="listbox">
              {(
                [
                  ["ultra", "0.5x"],
                  ["wide", "Wide"],
                  ["tele", "2.5x"],
                  ["front", "Front"],
                ] as const
              ).map(([id, label]) => (
                <li key={id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={lens === id}
                    onClick={() => {
                      setLens(id);
                      setLensOpen(false);
                      if (sensorOn) void openSensor(id);
                    }}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        )}
        <div className={styles.tools}>
          <ProgramDownload />
          <button type="button" className={styles.iconBtn} aria-label="Info" onClick={() => setInfoOpen((open) => !open)}>
            <Glyph src={`${UI}/info_002.png`} />
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Settings" onClick={() => setSettings(true)}>
            <Glyph src={`${UI}/settings_002.png`} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Profile"
            onClick={() => {
              closeSensor();
              window.localStorage.removeItem("sf2525-guest");
              if (isAuthenticated) logout({ logoutParams: { returnTo: window.location.origin } });
              else setStep("login");
            }}
          >
            <Glyph src={`${UI}/profile_icon_001.png`} />
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Full screen"
            onClick={() => {
              if (document.fullscreenElement) void document.exitFullscreen();
              else void document.documentElement.requestFullscreen();
            }}
          >
            <Glyph src={`${UI}/icon-navigation-fullscreen_001.png`} />
          </button>
        </div>
      </header>
      <section
        className={`${styles.stage} ${extra ? styles.split : ""}`}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          setShowFps((on) => !on);
        }}
      >
        <div className={styles.pane}>
        <video ref={videoRef} autoPlay muted playsInline aria-label="SENSOR 1" />
        <canvas ref={canvasRef} className={styles.boxes} />
        {sensorOn && coral && coralLive === "loaded" && (
          <img className={styles.coralMark} src={`${UI}/coral_icon_loaded.png`} alt="Coral loaded" />
        )}
        {extra && <span className={styles.paneTag}>SENSOR 1</span>}
        {sensorOn && !annotate && !capturing && (
          <div className={styles.meter} ref={meterRef} aria-hidden="true">
            <i />
          </div>
        )}
        {!sensorOn && (
          <div className={styles.idle}>
            <p>Camera Sensor 1 is OFF</p>
            <p>1. Make sure the camera is connected</p>
            <p>2. Toggle SENSOR 1 to ON</p>
          </div>
        )}
        {sensorOn && coral && coralLive !== "loaded" && (
          <p className={styles.alert}>Not connected. Start the program on this PC. python sensor_fusion_edge.py --page --coral</p>
        )}
        {error && !(sensorOn && coral && coralLive !== "loaded") && <p className={styles.alert}>{error}</p>}
        {alert && !showLabels && <p className={styles.liveAlert}>{alert}</p>}
        {capturing && <p className={styles.captureCount}>{capturing}</p>}
        </div>
        {extra && (
          <div className={styles.pane}>
            {extra === "camera" ? (
              <>
            <video ref={video2Ref} autoPlay muted playsInline aria-label="SENSOR 2" />
            <span className={styles.paneTag}>SENSOR 2 · {sensor2Name}</span>
            {sensor2Note && <p className={styles.paneNote}>{sensor2Note}</p>}
              </>
            ) : (
              <>
                <span className={styles.paneTag}>{EXTRA_SENSORS.find((item) => item.id === extra)?.label}</span>
                <div className={styles.idle}>
                  <p>{EXTRA_SENSORS.find((item) => item.id === extra)?.line}</p>
                  <p>{EXTRA_SENSORS.find((item) => item.id === extra)?.where}. It will show here when that sensor is attached.</p>
                </div>
              </>
            )}
          </div>
        )}
        <Foot accent={accent} />
      </section>
      <div className={styles.dock}>
      <nav className={styles.piBot}>
          <button type="button" className={showScores ? styles.botOn : styles.bot} onClick={() => setShowScores((on) => !on)}>
            <Glyph src={showScores ? `${UI}/toggle_switch_on_001.png` : `${UI}/toggle_switch_off_001.png`} />
            <span className={styles.botLabel}>%</span>
          </button>
          <button type="button" className={showLabels ? styles.botOn : styles.bot} onClick={() => setShowLabels((on) => !on)}>
            <Glyph src={showLabels ? `${UI}/toggle_switch_on_001.png` : `${UI}/toggle_switch_off_001.png`} />
            <span className={styles.botLabel}>Labels</span>
          </button>
        <div className={styles.modelWrap}>
          <button type="button" className={styles.botOn} aria-expanded={modelsOpen} aria-haspopup="listbox" aria-label="Run Live" onClick={() => setModelsOpen((open) => !open)}>
            <Glyph src={`${UI}/models_icon_001.png`} />
            <span className={styles.botLabel}>{current.label}</span>
          </button>
          {modelsOpen && (
            <ul className={styles.modelList} role="listbox">
              {MODELS.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={item.id === model}
                    onClick={() => {
                      setModel(item.id);
                      setModelsOpen(false);
                    }}
                  >
                    {item.id === model ? "✓ " : ""}
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className={styles.bot} aria-label="Capture Images" onClick={() => setAnnotate(true)}>
          <StepIcon id="capture" />
          <span className={styles.botLabel}>Capture Images</span>
        </button>
        <button type="button" className={styles.bot} aria-label="Annotate Images" onClick={() => setStep("label")}>
          <StepIcon id="annotate" />
          <span className={styles.botLabel}>Annotate</span>
        </button>
        <button type="button" className={styles.bot} aria-label="Upload Images" onClick={() => { setUploadNote(""); setUploadOpen(true); }}>
          <StepIcon id="upload" />
          <span className={styles.botLabel}>Upload</span>
          {cloudSaved && (
            <span className={styles.cloudOn} role="img" aria-label="Uploaded">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6.6 19.5h10.9a4.5 4.5 0 0 0 .55-8.97 5.9 5.9 0 0 0-11.25-1.6A4.2 4.2 0 0 0 2.6 13.6c0 3.3 1.9 5.9 4 5.9z" />
                <path d="M8.6 14.4l2.3 2.3 4.6-4.6" />
              </svg>
            </span>
          )}
        </button>
      </nav>
      </div>
      {annotate && (
        <div className={styles.modalWrap} onClick={() => setAnnotate(false)}>
          <div className={styles.modal} role="dialog" aria-label="Capture images" onClick={(event) => event.stopPropagation()}>
            <StepStrip current={1} />
            <h2>Capture Images</h2>
            <p className={styles.muted}>Live, a video, or picture files. What opens is saved as PNG.</p>
            <div className={styles.row}>
              <button type="button" className={captureMode === "live" ? styles.botOn : styles.ghost} onClick={() => setCaptureMode("live")}>
                Live
              </button>
              <button type="button" className={captureMode === "video" ? styles.botOn : styles.ghost} onClick={() => setCaptureMode("video")}>
                Video
              </button>
              <button type="button" className={captureMode === "pictures" ? styles.botOn : styles.ghost} onClick={() => setCaptureMode("pictures")}>
                Pictures
              </button>
            </div>
            {captureMode === "video" && (
              <div className={styles.row}>
                <button type="button" className={videoSource === "thermal" ? styles.botOn : styles.ghost} onClick={() => setVideoSource("thermal")}>
                  Thermal imager
                </button>
                <button type="button" className={videoSource === "other" ? styles.botOn : styles.ghost} onClick={() => setVideoSource("other")}>
                  Other source
                </button>
              </div>
            )}
            <div className={styles.row}>
              <span className={styles.muted}>Save to {sensorPath(platform)}</span>
              <button
                type="button"
                className={styles.ghost}
                onClick={() => {
                  void chooseSaveFolder()
                    .then((picked) => setSaveFolder(picked ? picked.name : "Files"))
                    .catch((err: unknown) => {
                      if (err instanceof DOMException && err.name === "AbortError") return;
                      setError(err instanceof Error ? err.message : "Choose a folder for the pictures.");
                    });
                }}
              >
                Choose folder
              </button>
            </div>
            {nextFile && <p className={styles.muted}>Next picture: {nextFile}</p>}
            <label>
              Label
              <select value={labelPick} onChange={(event) => setLabelPick(event.target.value)}>
                {(current.labels.length ? current.labels : ["person"]).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              How many <span className={styles.muted}>{captureMode === "video" ? "Up to 120." : "Up to 12."}</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={captureMode === "video" ? 120 : 12}
                step={1}
                value={count}
                onChange={(event) => setCount(event.target.value)}
              />
            </label>
            {(captureMode === "video" ? howManyFrames(count).note : howManyPictures(count).note) && (
              <p className={styles.alert}>{captureMode === "video" ? howManyFrames(count).note : howManyPictures(count).note}</p>
            )}
            {captureMode === "live" && howManyPictures(count).n > 0 && (
              <label>
                How often <span className={styles.muted}>2 or 3 seconds apart gives a different picture.</span>
                <select value={pace} onChange={(event) => setPace(event.target.value)}>
                  {LIVE_PACE.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {captureMode === "live" && howManyPictures(count).n > 0 && <p className={styles.muted}>{captureSeconds(howManyPictures(count).n, pace).line}</p>}
            {captureMode === "video" && (
              <label>
                Keep every <span className={styles.muted}>2 is every other frame. 3 is every third.</span>
                <input type="number" inputMode="numeric" min={1} max={30} step={1} value={every} onChange={(event) => setEvery(event.target.value)} />
              </label>
            )}
            {captureMode === "video" && everyNthFrame(every).note && <p className={styles.alert}>{everyNthFrame(every).note}</p>}
            <label>
              Note
              <input value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            {captureMode === "video" ? (
              <label className={styles.file}>
                Choose a video
                <input
                  type="file"
                  accept={VIDEO_INTAKE}
                  disabled={Boolean(capturing) || !howManyFrames(count).n || !everyNthFrame(every).n}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    void addFromVideo(file, videoSource);
                  }}
                />
              </label>
            ) : captureMode === "pictures" ? (
              <label className={styles.file}>
                Choose pictures
                <input type="file" accept={IMAGE_INTAKE} multiple disabled={Boolean(capturing)} onChange={(event) => void addFromDevice(event.target.files)} />
              </label>
            ) : null}
            {capturing && (
              <p className={styles.muted} aria-live="polite">
                {capturing}
              </p>
            )}
            <div className={styles.actions}>
              {captureMode === "live" && (
                <button type="button" disabled={Boolean(capturing) || !howManyPictures(count).n} onClick={() => void takeShots()}>
                  FROM SENSOR
                </button>
              )}
              {captureMode === "live" && (
                <button type="button" disabled={Boolean(capturing)} onClick={() => void takeShots(true)}>
                  45–60 SEC
                </button>
              )}
              <button type="button" onClick={() => setAnnotate(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
      {savedNote && (
        <div className={styles.modalWrap} onClick={() => setSavedNote(false)}>
          <div className={styles.modal} role="dialog" aria-label="Upload" onClick={(event) => event.stopPropagation()}>
            {/* rev 43: nothing is uploaded yet, so Upload is lit, never ticked, and the title is the step's own name. */}
            <StepStrip current={trainStatus ? 3 : 2} />
            <h2>{trainStatus ? "Upload Images" : lastSave.title}</h2>
            {trainStatus ? (
              <p className={styles.statusLine}>
                <StepIcon id="develop" />
                {trainStatus}
              </p>
            ) : null}
            <p className={styles.muted}>
              {trainStatus ? `${shots.length} ${shots.length === 1 ? "picture" : "pictures"} in this set.` : lastSave.line}
              {" "}
              {nameList(trainStatus ? shots.map((shot) => shot.name || "") : lastSave.names)}
            </p>
            <div className={styles.actions}>
              <button
                type="button"
                onClick={() => {
                  setSavedNote(false);
                  setStep("label");
                }}
              >
                ANNOTATE
              </button>
              <button type="button" onClick={() => setSavedNote(false)}>
                NOT NOW
              </button>
            </div>
          </div>
        </div>
      )}
      {uploadOpen && (
        <div className={styles.modalWrap} onClick={() => setUploadOpen(false)}>
          <div className={styles.modal} role="dialog" aria-label="Save the set" onClick={(event) => event.stopPropagation()}>
            <h2>Upload Images</h2>
            <p className={styles.muted}>Save to the sensor-fusion project, or to a new folder on this device. The project takes a set only after Level 2.</p>
            {uploadNote ? <p className={styles.statusLine}>{uploadNote}</p> : null}
            <div className={styles.actions}>
              <button type="button" onClick={() => void uploadSet()}>
                PROJECT
              </button>
              <button type="button" onClick={() => void saveToNewFolder()}>
                NEW FOLDER
              </button>
              <button type="button" onClick={() => setUploadOpen(false)}>
                NOT NOW
              </button>
            </div>
          </div>
        </div>
      )}
      <SettingsSheet open={settings} scheme={scheme} customHex={customHex} coral={coral} coralLive={coralLive} alerts={alerts} onCoral={chooseCoral} onAlerts={chooseAlerts} onClose={() => setSettings(false)} onScheme={chooseScheme} />
      {infoOpen && (
        <div className={`${styles.lesson} ${styles.work}`} role="dialog" aria-label="Sensor Fusion" ref={lessonRef}>
          <header className={styles.piTop}>
            <img className={styles.logo} src="/sensor-fusion/sensor_fusion_logo_001.png" alt="sensor fusion" />
            <button type="button" className={`${styles.sensorSwitch} ${tip === "sensor" ? styles.tipOn : ""}`} onClick={(event) => placeTip("sensor", event)}>
              <Glyph src={`${UI}/toggle_switch_on_001.png`} />
              SENSOR 1: ON
            </button>
            <button type="button" className={`${styles.lensRead} ${tip === "lens" ? styles.tipOn : ""}`} onClick={(event) => placeTip("lens", event)}>
              Front
            </button>
            <div className={styles.tools}>
              <ProgramDownload />
              <button type="button" className={styles.iconBtn} aria-label="Close info" onClick={() => { setInfoOpen(false); setTip(""); }}>
                <Glyph src={`${UI}/info_002.png`} />
              </button>
              <span className={styles.iconBtn} aria-hidden="true">
                <Glyph src={`${UI}/settings_002.png`} />
              </span>
              <span className={styles.iconBtn} aria-hidden="true">
                <Glyph src={`${UI}/profile_icon_001.png`} />
              </span>
              <span className={styles.iconBtn} aria-hidden="true">
                <Glyph src={`${UI}/icon-navigation-fullscreen_001.png`} />
              </span>
            </div>
          </header>
          <section className={styles.stage}>
            <div className={styles.still}>
              <div className={styles.stillFrame}>
              <img src={INFO_STILL.src} width={840} height={840} alt="A street with two people, a bicycle, a car, a dog and a traffic light" />
              {INFO_STILL.boxes.map((box) => {
                const [width, height] = INFO_STILL.size;
                const [x1, y1, x2, y2] = box.box_px;
                const left = (x1 / width) * 100;
                const top = (y1 / height) * 100;
                const right = (x2 / width) * 100;
                const tagClass = [styles.stillTag, right > 75 ? styles.stillTagEnd : "", top < 8 ? styles.stillTagIn : ""].filter(Boolean).join(" ");
                return (
                  <button
                    key={box.box_px.join("-")}
                    type="button"
                    className={`${styles.stillBox} ${tip === "box" ? styles.tipOn : ""}`}
                    style={{ left: `${left}%`, top: `${top}%`, width: `${right - left}%`, height: `${((y2 - y1) / height) * 100}%` }}
                    aria-label={`${box.label} ${Math.round(box.score * 100)} percent`}
                    onClick={(event) => placeTip("box", event)}
                  >
                    <b className={tagClass}>
                      {box.label} · {Math.round(box.score * 100)}%
                    </b>
                  </button>
                );
              })}
              </div>
            </div>
            <button type="button" className={`${styles.fpsRead} ${tip === "fps" ? styles.tipOn : ""}`} onClick={(event) => placeTip("fps", event)}>
              FPS
            </button>
            <button type="button" className={`${styles.meter} ${tip === "bar" ? styles.tipOn : ""}`} aria-label="Bar" onClick={(event) => placeTip("bar", event)}>
              <i style={{ height: "77%", background: "#ffe600" }} />
            </button>
            {!tip && <p className={styles.tipHint}>Tap a control.</p>}
          </section>
          <div className={styles.dock}>
            <nav className={styles.piBot}>
              <button type="button" className={`${styles.botOn} ${tip === "pct" ? styles.tipOn : ""}`} onClick={(event) => placeTip("pct", event)}>
                <Glyph src={`${UI}/toggle_switch_on_001.png`} />
                <span className={styles.botLabel}>%</span>
              </button>
              <button type="button" className={`${styles.botOn} ${tip === "labels" ? styles.tipOn : ""}`} onClick={(event) => placeTip("labels", event)}>
                <Glyph src={`${UI}/toggle_switch_on_001.png`} />
                <span className={styles.botLabel}>Labels</span>
              </button>
              <button type="button" className={`${styles.botOn} ${tip === "model" ? styles.tipOn : ""}`} onClick={(event) => placeTip("model", event)}>
                <Glyph src={`${UI}/models_icon_001.png`} />
                <span className={styles.botLabel}>Demo.90</span>
              </button>
              <button type="button" className={`${styles.bot} ${tip === "capture" ? styles.tipOn : ""}`} onClick={(event) => placeTip("capture", event)}>
                <StepIcon id="capture" />
                <span className={styles.botLabel}>Capture Images</span>
              </button>
              <button type="button" className={`${styles.bot} ${tip === "annotate" ? styles.tipOn : ""}`} onClick={(event) => placeTip("annotate", event)}>
                <StepIcon id="annotate" />
                <span className={styles.botLabel}>Annotate</span>
              </button>
              <button type="button" className={`${styles.bot} ${tip === "upload" ? styles.tipOn : ""}`} onClick={(event) => placeTip("upload", event)}>
                <StepIcon id="upload" />
                <span className={styles.botLabel}>Upload</span>
              </button>
            </nav>
          </div>
          {tip && INFO_NOTES[tip] && (
            <p className={styles.tipNote} style={{ left: tipAt.left, top: tipAt.top }}>
              {INFO_NOTES[tip].text}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
