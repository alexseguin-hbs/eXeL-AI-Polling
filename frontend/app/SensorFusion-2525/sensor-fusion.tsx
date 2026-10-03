"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Settings } from "lucide-react";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import { supabase } from "@/lib/supabase";
import {
  COLORS,
  FRAMES,
  MODELS,
  MENU,
  PLATFORMS,
  applyTheme,
  detectPlatform,
  explainCamera,
  sensorPath,
  type PlatformId,
  type SchemeId,
} from "./sf";
import { SENSOR_FUSION_RCORE_HISTORY } from "./ledger";
import styles from "./sensor-fusion.module.css";

const UI = "/sensor-fusion/ui";

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
  onClose,
  onScheme,
}: {
  open: boolean;
  scheme: SchemeId | "custom";
  customHex: string;
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
type Shot = { id: string; url: string; name?: string; source?: "sensor" | "device"; original?: string };
type Mark = { id: string; name: string; left: number; top: number; right: number; bottom: number };
type Edge = "l" | "r" | "t" | "b";

function pictureName(shot: Shot) {
  return shot.name || `${shot.id}.jpg`;
}

function xmlName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "") + ".xml";
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&" + "amp;")
    .replace(/</g, "&" + "lt;")
    .replace(/>/g, "&" + "gt;")
    .replace(/"/g, "&" + "quot;");
}

function vocXml(fileName: string, width: number, height: number, objects: Mark[]) {
  const boxes = objects
    .map((item) => {
      const xmin = Math.round((Math.min(item.left, item.right) / 100) * width);
      const xmax = Math.round((Math.max(item.left, item.right) / 100) * width);
      const ymin = Math.round((Math.min(item.top, item.bottom) / 100) * height);
      const ymax = Math.round((Math.max(item.top, item.bottom) / 100) * height);
      return `  <object>
    <name>${escapeXml(item.name)}</name>
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

function peekNames(label: string, count: number) {
  const used = Number(window.localStorage.getItem(`sf2525-seq-${classKey(label)}`) || "0") || 0;
  return Array.from({ length: count }, (_, index) => `${classKey(label)}.${String(used + index + 1).padStart(4, "0")}.jpg`);
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
};

async function chooseSensorFusionFolder() {
  const picker = (window as Window & { showDirectoryPicker?: (options: { mode: "readwrite"; id: string }) => Promise<Folder> }).showDirectoryPicker;
  if (!picker) return null;
  if (phoneKind() === "android") {
    window.alert("Create a folder named SensorFusion, then choose that folder.");
    const picked = await picker({ mode: "readwrite", id: "sensor-fusion-android" });
    if (picked.name.toLowerCase() !== "sensorfusion") {
      throw new Error("Choose the folder named SensorFusion.");
    }
    return picked;
  }
  const parent = await picker({ mode: "readwrite", id: "sensor-fusion" });
  if (parent.name.toLowerCase() === "sensorfusion") return parent;
  return parent.getDirectoryHandle("SensorFusion", { create: true });
}

async function saveNumberedJpegs(setName: string, files: { name: string; blob: Blob }[]) {
  const folder = await chooseSensorFusionFolder();
  if (folder) {
    const setFolder = await folder.getDirectoryHandle(setName, { create: true });
    for (const file of files) {
      const handle = await setFolder.getFileHandle(file.name, { create: true });
      const writable = await handle.createWritable();
      await writable.write(file.blob);
      await writable.close();
    }
    return `SensorFusion/${setName}`;
  }
  const shared = files.map((file) => new File([file.blob], file.name, { type: "image/jpeg" }));
  const share = navigator as Navigator & { canShare?: (data: { files: File[] }) => boolean };
  if (share.canShare?.({ files: shared }) && navigator.share) {
    await navigator.share({ files: shared, title: "SensorFusion" });
    return `SensorFusion/${setName}`;
  }
  files.forEach((file) => downloadBlob(file.name, URL.createObjectURL(file.blob)));
  return `SensorFusion/${setName}`;
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
  operator,
  onBack,
}: {
  shots: Shot[];
  operator: string;
  onBack: () => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<Edge | null>(null);
  const edges = useRef({ left: 20, top: 15, right: 70, bottom: 80 });
  const [pics, setPics] = useState<Shot[]>(shots);
  const [index, setIndex] = useState(0);
  const [labelName, setLabelName] = useState("deer");
  const [left, setLeft] = useState(20);
  const [top, setTop] = useState(15);
  const [right, setRight] = useState(70);
  const [bottom, setBottom] = useState(80);
  const [marks, setMarks] = useState<Record<string, Mark[]>>({});
  const [note, setNote] = useState("");
  const pic = pics[index];
  edges.current = { left, top, right, bottom };

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

  function addFiles(files: FileList | null) {
    if (!files?.length) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || "");
        if (!url) return;
        setPics((current) => [{ id: `${Date.now()}-${file.name}`, url, name: file.name }, ...current]);
        setIndex(0);
      };
      reader.readAsDataURL(file);
    });
  }

  async function saveBox() {
    if (!pic) return;
    const mark: Mark = {
      id: `${Date.now()}`,
      name: labelName.trim() || "deer",
      left,
      top,
      right,
      bottom,
    };
    const list = [...(marks[pic.id] || []), mark];
    const next = { ...marks, [pic.id]: list };
    setMarks(next);
    const rows = Object.entries(next).flatMap(([picture, items]) => items.map((item) => ({ picture, ...item })));
    window.localStorage.setItem("sf2525-labels", JSON.stringify(rows));
    setNote("This box is on this screen only. It is not saved yet.");
  }

  async function shareTeam() {
    const rows = Object.entries(marks).flatMap(([picture, list]) => list.map((item) => ({ picture, ...item })));
    if (!rows.length) {
      setNote("Draw a box and save it first.");
      return;
    }
    if (!supabase) {
      setNote("The labels stay on this phone. The cloud is not connected.");
      return;
    }
    const { error } = await supabase.from("sensor_fusion_labels").insert(
      rows.map((item) => ({
        owner_key: operator || "guest",
        picture_id: item.picture,
        name: item.name,
        x1: item.left,
        y1: item.top,
        x2: item.right,
        y2: item.bottom,
      })),
    );
    setNote(error ? "The labels stayed on this phone. The team copy was not saved." : "The team can see these labels.");
  }

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
        <span className={styles.who}>Image labeler</span>
      </header>
      <div className={styles.fill}>
        <p className={styles.muted}>Pictures collected by the team show here after they are uploaded. Add more from this device.</p>
        <label className={styles.file}>
          Add pictures
          <input type="file" accept="image/*" multiple onChange={(event) => addFiles(event.target.files)} />
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
          <div
            className={styles.labelStage}
            ref={stageRef}
            onPointerMove={onMove}
            onPointerUp={() => {
              drag.current = null;
            }}
          >
            <img ref={imgRef} src={pic.url} alt="" />
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
        ) : (
          <p className={styles.muted}>No pictures yet. Turn the camera on and save some, or add pictures from this device.</p>
        )}
        {pic && <p className={styles.fileName}>{pictureName(pic)}</p>}
        <label>
          Label name
          <input value={labelName} onChange={(event) => setLabelName(event.target.value)} />
        </label>
        <div className={styles.corners}>
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
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={saveBox} disabled={!pic}>
            SAVE BOX
          </button>
          <button type="button" onClick={() => void shareTeam()} disabled={!pic}>
            SHARE WITH TEAM
          </button>
        </div>
        {note && <p className={styles.muted}>{note}</p>}
        {pic && (marks[pic.id] || []).map((mark) => (
          <p key={mark.id} className={styles.path}>
            {mark.name} · left {mark.left} top {mark.top} right {mark.right} bottom {mark.bottom}
          </p>
        ))}
      </div>
      <Foot accent="#00e5ff" />
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
  const picked = color ?? frame ?? COLORS[2];
  applyTheme(picked.bg, picked.card, picked.primary, picked.line);
}

export default function SensorFusion() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const operator = user?.name || user?.email || "";
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("login");
  const [platform, setPlatform] = useState<PlatformId>("win");
  const [scheme, setScheme] = useState<SchemeId | "custom">("cyan");
  const [customHex, setCustomHex] = useState("#19c8cf");
  const [settings, setSettings] = useState(false);
  const [sensorOn, setSensorOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [model, setModel] = useState("demo90");
  const [coral, setCoral] = useState(false);
  const [guest, setGuest] = useState(false);
  const [showScores, setShowScores] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showFps, setShowFps] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [poseNote, setPoseNote] = useState(false);
  const [annotate, setAnnotate] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [shotFolder, setShotFolder] = useState("");
  const [cloudSaved, setCloudSaved] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const [name, setName] = useState("");
  const [labelPick, setLabelPick] = useState("person");
  const [count, setCount] = useState("4");
  const [note, setNote] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const showScoresRef = useRef(showScores);
  const showLabelsRef = useRef(showLabels);
  const showFpsRef = useRef(showFps);
  showScoresRef.current = showScores;
  showLabelsRef.current = showLabels;
  showFpsRef.current = showFps;

  useEffect(() => {
    const savedScheme = window.localStorage.getItem("sf2525-scheme");
    const savedHex = window.localStorage.getItem("sf2525-custom") || "#19c8cf";
    const nextScheme = (savedScheme as SchemeId | "custom") || "cyan";
    setCustomHex(savedHex);
    setScheme(nextScheme);
    paint(nextScheme, savedHex);
    const savedHost = window.localStorage.getItem("sf2525-host") as PlatformId | null;
    const known = PLATFORMS.some((item) => item.id === savedHost);
    const host = known && savedHost ? savedHost : detectPlatform(navigator.userAgent);
    setPlatform(host);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sf-offline-sw.js").catch(() => undefined);
    }
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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
    const sees = (MODELS.find((item) => item.id === model)?.sees || "person")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && !item.startsWith("the "));
    if (sees[0]) setLabelPick(sees[0]);
  }, [model]);

  useEffect(() => {
    if (!sensorOn || step !== "work") return;
    let stop = false;
    const run = async () => {
      try {
        const cnn = await loadCnn();
        const session = await cnn.load(model);
        if (stop) return;
        let failed = false;
        const loop = async () => {
          if (stop) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (video && canvas && video.readyState >= 2) {
            try {
              const result = await cnn.detect(session, video);
              cnn.draw(canvas, video, result, showScoresRef.current, showLabelsRef.current, showFpsRef.current);
              const hits = (result.hits || []) as { score?: number }[];
              const top = hits.reduce((best, hit) => Math.max(best, Number(hit.score) || 0), 0);
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
        if (!stop) setError("The detector could not start on this device.");
      }
    };
    void run();
    return () => {
      stop = true;
    };
  }, [sensorOn, model, step]);

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

  async function openSensor(nextFacing = facing) {
    setBusy(true);
    setError("");
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setFacing(nextFacing);
      setSensorOn(true);
    } catch (err) {
      setSensorOn(false);
      setError(explainCamera(err));
    } finally {
      setBusy(false);
    }
  }

  function closeSensor() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSensorOn(false);
  }

  async function framesFromVideo() {
    const video = videoRef.current;
    const howMany = Math.min(12, Math.max(1, Number(count) || 4));
    if (!video || !sensorOn || video.readyState < 2) return { shots: [] as Shot[], files: [] as { name: string; blob: Blob }[], label: classKey(labelPick) };
    const label = classKey(labelPick);
    const names = peekNames(label, howMany);
    const shotsOut: Shot[] = [];
    const files: { name: string; blob: Blob }[] = [];
    for (let i = 0; i < howMany; i += 1) {
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
      const url = canvas.toDataURL("image/jpeg", 0.7);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((file) => resolve(file), "image/jpeg", 0.7));
      if (!blob) continue;
      shotsOut.push({ id: `${Date.now()}-${i}`, url, name: fileName, source: "sensor" });
      files.push({ name: fileName, blob });
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    return { shots: shotsOut, files, label };
  }

  async function takeShots() {
    const { shots: next, files, label } = await framesFromVideo();
    if (!next.length) {
      setError("Turn SENSOR 1 on before you save pictures.");
      setAnnotate(false);
      return;
    }
    try {
      const folder = await saveNumberedJpegs(label, files);
      commitNames(label, files.length);
      setShotFolder(folder);
      setError("");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setShotFolder("");
      setError(err instanceof Error ? err.message : "The pictures were not saved.");
      return;
    }
    setShots((current) => [...current, ...next]);
    setCloudSaved(false);
    setAnnotate(false);
    setSavedNote(true);
    window.localStorage.setItem(
      "sf2525-capture",
      JSON.stringify({ operator, platform, model, name: label, note, count: next.length, folder: `SensorFusion/${label}` }),
    );
  }

  async function addFromDevice(list: FileList | null) {
    if (!list?.length) return;
    const label = classKey(labelPick);
    const names = peekNames(label, list.length);
    const files: { name: string; blob: Blob }[] = [];
    const added: Shot[] = [];
    Array.from(list).forEach((file, index) => {
      const fileName = names[index];
      added.push({ id: `${Date.now()}-${index}`, url: "", name: fileName, source: "device", original: file.name });
      files.push({ name: fileName, blob: file });
    });
    const ready = await Promise.all(
      added.map(
        (shot, index) =>
          new Promise<Shot>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ ...shot, url: String(reader.result || "") });
            reader.readAsDataURL(list[index]);
          }),
      ),
    );
    const kept = ready.filter((shot) => shot.url);
    if (!kept.length) return;
    try {
      const folder = await saveNumberedJpegs(label, files);
      commitNames(label, files.length);
      setShotFolder(folder);
      setError("");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "The pictures were not saved.");
      return;
    }
    setShots((current) => [...current, ...kept]);
    setAnnotate(false);
    setSavedNote(true);
  }

  function uploadSet() {
    if (!shots.length) {
      setError("Capture images before you upload a set.");
      return;
    }
    const lines = [
      "Sensor Fusion set",
      "These pictures stay on this device. A training destination has not been chosen.",
      ...shots.map((shot) => [shot.name || "", shot.source || "sensor", shot.original || ""].join("\t")),
    ];
    downloadBlob(`${classKey(labelPick)}.set.txt`, URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" })));
    setError("");
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
    setCoral(item.coral);
    if (item.model) setModel(item.model);
    window.localStorage.setItem("sf2525-host", platform);
    setStep("work");
  }

  const who = operator || (guest ? "GUEST" : "");
  const accent =
    scheme === "custom"
      ? customHex
      : (COLORS.find((item) => item.id === scheme)?.primary ?? FRAMES.find((item) => item.id === scheme)?.primary ?? "#00e5ff");

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
    return <Labeler shots={shots} operator={operator} onBack={() => setStep("menu")} />;
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
          <h1>Menu</h1>
          <label>
            This computer
            <select value={platform} onChange={(event) => setPlatform(event.target.value as PlatformId)}>
              {PLATFORMS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.menu}>
            {MENU.map((item) => (
              <button key={item.id} type="button" className={styles.menuItem} onClick={() => pickMenu(item)}>
                <span>{item.n}</span>
                {item.label}
              </button>
            ))}
          </div>
          {poseNote && (
            <p className={styles.alert}>Pose is not designed yet. It does not have the three files the other models use.</p>
          )}
        </div>
        <SettingsSheet open={settings} scheme={scheme} customHex={customHex} onClose={() => setSettings(false)} onScheme={chooseScheme} />
        <Foot accent={accent} />
      </main>
    );
  }

  const current = MODELS.find((item) => item.id === model) ?? MODELS[0];

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
          <img src={sensorOn ? `${UI}/toggle_switch_on_001.png` : `${UI}/toggle_switch_off_001.png`} alt="" />
          SENSOR 1: {busy ? "…" : sensorOn ? "ON" : "OFF"}
        </button>
        <div className={styles.tools}>
          <ProgramDownload />
          <button type="button" className={styles.iconBtn} aria-label="Info" onClick={() => setInfoOpen((open) => !open)}>
            <img src={`${UI}/info_002.png`} alt="" />
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Settings" onClick={() => setSettings(true)}>
            <img src={`${UI}/settings_002.png`} alt="" />
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
            <img src={`${UI}/profile_icon_001.png`} alt="" />
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
            <img src={`${UI}/icon-navigation-fullscreen_001.png`} alt="" />
          </button>
        </div>
      </header>
      <section
        className={styles.stage}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button")) return;
          setShowFps((on) => !on);
        }}
      >
        <video ref={videoRef} autoPlay muted playsInline aria-label="Camera" />
        <canvas ref={canvasRef} className={styles.boxes} />
        {sensorOn && (
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
        {infoOpen && (
          <button type="button" className={styles.tutorial} onClick={() => setInfoOpen(false)} aria-label="Close the menu labels">
            <img src={`${UI}/MVP0_Tutorial_001.png`} alt="Camera ON/OFF, AI Detection Box, Profile Menu, Full Screen, AI Accuracy percent, Object ID, Switch Basic Models, Annotate, Switch Custom Models, Train New Custom Model, Future Feature" />
          </button>
        )}
        {error && <p className={styles.alert}>{error}</p>}
      </section>
      <div className={styles.dock}>
      <nav className={styles.piBot}>
        <button type="button" className={showScores ? styles.botOn : styles.bot} onClick={() => setShowScores((on) => !on)}>
          <img src={showScores ? `${UI}/toggle_switch_on_001.png` : `${UI}/toggle_switch_off_001.png`} alt="" />%
        </button>
        <button type="button" className={showLabels ? styles.botOn : styles.bot} onClick={() => setShowLabels((on) => !on)}>
          <img src={showLabels ? `${UI}/toggle_switch_on_001.png` : `${UI}/toggle_switch_off_001.png`} alt="" />
          Labels
        </button>
        <div className={styles.modelWrap}>
          <button type="button" className={styles.botOn} aria-expanded={modelsOpen} aria-haspopup="listbox" onClick={() => setModelsOpen((open) => !open)}>
            <img src={`${UI}/models_icon_001.png`} alt="" />
            {current.label}
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
        <button type="button" className={styles.annotate} aria-label="Capture images" onClick={() => setAnnotate(true)}>
          <img src={`${UI}/capture_images_001.png`} alt="" />
          Capture
        </button>
        <button type="button" className={styles.bot} aria-label="Annotate images" onClick={() => setStep("label")}>
          <img src={`${UI}/annotate_button_001.png`} alt="" />
          Annotate
        </button>
        <button type="button" className={styles.bot} aria-label="Upload a finished set" onClick={() => void uploadSet()}>
          <img src={`${UI}/train_model_001.png`} alt="" />
          Upload
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
        <div className={styles.modalWrap}>
          <div className={styles.modal} role="dialog" aria-label="Capture images">
            <h2>Capture images</h2>
            <p className={styles.muted}>From the sensor, or from this device. Then annotate them.</p>
            <label>
              Label
              <select value={labelPick} onChange={(event) => setLabelPick(event.target.value)}>
                {(current.sees || "person")
                  .split(",")
                  .map((item) => item.trim())
                  .filter((item) => item && !item.startsWith("the "))
                  .map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              How many
              <input value={count} onChange={(event) => setCount(event.target.value)} />
            </label>
            <label>
              Note
              <input value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <label className={styles.file}>
              From this device
              <input type="file" accept="image/*" multiple onChange={(event) => void addFromDevice(event.target.files)} />
            </label>
            <div className={styles.actions}>
              <button type="button" onClick={() => void takeShots()}>
                FROM SENSOR
              </button>
              <button type="button" onClick={() => setAnnotate(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
      {savedNote && (
        <div className={styles.modalWrap}>
          <div className={styles.modal} role="dialog" aria-label="Upload">
            <h2>Pictures saved.</h2>
            <p className={styles.muted}>
              {shots.length} pictures in {shotFolder || "SensorFusion"}.
              {" "}
              {shots.map((shot) => shot.name).filter(Boolean).join(", ")}
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
      <SettingsSheet open={settings} scheme={scheme} customHex={customHex} onClose={() => setSettings(false)} onScheme={chooseScheme} />
      <Foot accent={accent} />
    </main>
  );
}
