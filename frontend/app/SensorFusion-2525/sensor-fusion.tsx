"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Settings } from "lucide-react";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import {
  COLORS,
  FRAMES,
  MODELS,
  MENU,
  PLATFORMS,
  applyTheme,
  detectPlatform,
  explainCamera,
  modelFile,
  sensorPath,
  type PlatformId,
  type SchemeId,
} from "./sf";
import { SENSOR_FUSION_RCORE_HISTORY } from "./ledger";
import styles from "./sensor-fusion.module.css";

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
type Step = "login" | "menu" | "work";
type Shot = { id: string; url: string };

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
  const [name, setName] = useState("");
  const [count, setCount] = useState("4");
  const [note, setNote] = useState("");
  const [shots, setShots] = useState<Shot[]>([]);

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
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
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
      if (event.key === "f" || event.key === "F") setShowFps((on) => !on);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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

  async function takeShots() {
    const video = videoRef.current;
    const howMany = Math.min(12, Math.max(1, Number(count) || 1));
    if (!video || !sensorOn) {
      setError("Turn SENSOR 1 on before you save pictures.");
      setAnnotate(false);
      return;
    }
    const next: Shot[] = [];
    for (let i = 0; i < howMany; i += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      next.push({ id: `${Date.now()}-${i}`, url: canvas.toDataURL("image/jpeg", 0.8) });
      await new Promise((resolve) => window.setTimeout(resolve, 120));
    }
    setShots(next);
    setAnnotate(false);
    setSavedNote(true);
    window.localStorage.setItem(
      "sf2525-capture",
      JSON.stringify({ operator, platform, model, name, note, count: next.length, folder: sensorPath(platform, [name || "capture"]) }),
    );
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
    setCoral(item.coral);
    if (item.model) setModel(item.model);
    window.localStorage.setItem("sf2525-host", platform);
    if (item.go === "label") setAnnotate(true);
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

  if (step === "menu") {
    return (
      <main className={styles.screen}>
        <header className={styles.piTop}>
          <img className={styles.logo} src="/sensor-fusion/sensor_fusion_logo_001.png" alt="sensor fusion" />
          <span className={styles.who}>{who}</span>
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
            <p className={styles.alert}>Pose is not in the app yet. It does not have the three files the other models use.</p>
          )}
          <p className={styles.muted}>
            The app for a Raspberry Pi, Ubuntu, or a Windows PC runs the model on that computer. The phone uses this page for now.
          </p>
          <a className={styles.primary} href="/sensor-fusion/edge/sensor_fusion_edge.py" download>
            Download the app
          </a>
        </div>
        <SettingsSheet open={settings} scheme={scheme} customHex={customHex} onClose={() => setSettings(false)} onScheme={chooseScheme} />
        <Foot accent={accent} />
      </main>
    );
  }

  const current = MODELS.find((item) => item.id === model) ?? MODELS[0];
  const file = modelFile(coral);

  return (
    <main className={styles.screen}>
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
          SENSOR 1: {busy ? "…" : sensorOn ? "ON" : "OFF"}
        </button>
        <div className={styles.row}>
          <button type="button" className={styles.iconBtn} aria-label="Info" onClick={() => setInfoOpen((open) => !open)}>
            i
          </button>
          <button type="button" className={styles.iconBtn} aria-label="Settings" onClick={() => setSettings(true)}>
            <Settings aria-hidden />
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
            {who ? who.slice(0, 1) : "?"}
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
            ⛶
          </button>
        </div>
      </header>
      <section className={styles.stage}>
        <video ref={videoRef} autoPlay muted playsInline aria-label="Camera" />
        {!sensorOn && (
          <div className={styles.idle}>
            <p>Camera Sensor 1 is OFF</p>
            <p>1. Make sure the camera is connected</p>
            <p>2. Toggle SENSOR 1 to ON</p>
          </div>
        )}
        {showFps && <p className={styles.fps}>FPS — measured by the app on this computer</p>}
        {infoOpen && (
          <p className={styles.note}>
            {coral ? "With Coral" : "No Coral"}. This folder uses {file}. Press F to show or hide FPS.
          </p>
        )}
        {error && <p className={styles.alert}>{error}</p>}
      </section>
      <nav className={styles.piBot}>
        <button type="button" className={showScores ? styles.botOn : styles.bot} onClick={() => setShowScores((on) => !on)}>
          %
        </button>
        <button type="button" className={showLabels ? styles.botOn : styles.bot} onClick={() => setShowLabels((on) => !on)}>
          Labels
        </button>
        <label className={styles.pick}>
          Model
          <select
            value={model}
            onChange={(event) => {
              closeSensor();
              setModel(event.target.value);
            }}
          >
            {MODELS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={styles.annotate} onClick={() => setAnnotate(true)}>
          Annotate
        </button>
        <button type="button" className={styles.bot} onClick={() => setSavedNote(true)}>
          Upload Images
        </button>
      </nav>
      <p className={styles.path}>
        {sensorPath(platform, [current.folder, "Sample_TFLite_model", file])}
        {showLabels ? ` · ${current.sees}` : ""}
        {showScores ? " · %" : ""}
      </p>
      {annotate && (
        <div className={styles.modalWrap}>
          <div className={styles.modal} role="dialog" aria-label="Annotate">
            <h2>Save pictures</h2>
            <label>
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              How many
              <input value={count} onChange={(event) => setCount(event.target.value)} />
            </label>
            <label>
              Note
              <input value={note} onChange={(event) => setNote(event.target.value)} />
            </label>
            <div className={styles.actions}>
              <button type="button" onClick={() => void takeShots()}>
                SUBMIT
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
            <h2>Pictures stay on this computer until you upload them.</h2>
            <p className={styles.muted}>
              {shots.length} pictures in {sensorPath(platform, [name || "capture"])}.
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={() => setSavedNote(false)}>
                CLOSE
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
