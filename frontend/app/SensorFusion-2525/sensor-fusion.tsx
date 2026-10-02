"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { RCoreBadge } from "@/components/2525-core/rcore-badge";
import {
  COLORS,
  FRAMES,
  MODELS,
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

function withHistory(node: ReactNode, accent: string) {
  return (
    <>
      {node}
      <RCoreBadge history={SENSOR_FUSION_RCORE_HISTORY} accent={accent} />
    </>
  );
}
type Step = "login" | "device" | "work";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [step, setStep] = useState<Step>("login");
  const [operator, setOperator] = useState("");
  const [draft, setDraft] = useState("");
  const [platform, setPlatform] = useState<PlatformId>("win");
  const [scheme, setScheme] = useState<SchemeId | "custom">("cyan");
  const [customHex, setCustomHex] = useState("#19c8cf");
  const [settings, setSettings] = useState(false);
  const [sensorOn, setSensorOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [model, setModel] = useState("demo90");
  const [faster, setFaster] = useState(false);
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
    const who = window.localStorage.getItem("sf2525-operator") ?? "";
    const ready = window.localStorage.getItem("sf2525-ready") === "1";
    if (who) {
      setOperator(who);
      setDraft(who);
      setStep(ready && known ? "work" : "device");
    }
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
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
        video: { facingMode: nextFacing },
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

  const accent =
    scheme === "custom"
      ? customHex
      : (COLORS.find((item) => item.id === scheme)?.primary ?? FRAMES.find((item) => item.id === scheme)?.primary ?? "#00e5ff");

  if (step === "login") {
    return withHistory(
      <main className={styles.page}>
        <div className={styles.wrap}>
          <p className={styles.kicker}>MODULAR: EDGE</p>
          <h1>Sensor Fusion · 2525</h1>
          <p className={styles.muted}>
            Accessible from multiple devices: a Windows PC, an Android phone, an iPhone, a Raspberry Pi, or Ubuntu. Sign in as the System Operator.
          </p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const who = draft.trim();
              if (!who) return;
              setOperator(who);
              window.localStorage.setItem("sf2525-operator", who);
              setStep("device");
            }}
          >
            <label htmlFor="operator">System Operator</label>
            <input id="operator" value={draft} autoComplete="name" onChange={(event) => setDraft(event.target.value)} />
            <button className={styles.primary} type="submit" disabled={!draft.trim()}>
              Log in
            </button>
          </form>
          <p className={styles.muted}>Your name stays on this device. Next, pick the device.</p>
        </div>
      </main>,
      accent,
    );
  }

  if (step === "device") {
    return withHistory(
      <main className={styles.page}>
        <div className={styles.wrap}>
          <p className={styles.kicker}>MODULAR: EDGE</p>
          <h1>Sensor Fusion · 2525</h1>
          <p className={styles.muted}>
            System Operator {operator}. Accessible from multiple devices. Pick the one you are using. The folder is Home/SensorFusion. Windows uses a backslash.
          </p>
          <div className={`${styles.grid} ${styles.grid2}`}>
            {PLATFORMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.card} ${platform === item.id ? styles.cardOn : ""}`}
                onClick={() => setPlatform(item.id)}
              >
                {item.label}
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
          <p className={styles.muted}>Folder</p>
          <p className={styles.path}>{sensorPath(platform)}</p>
          <button
            className={styles.primary}
            type="button"
            onClick={() => {
              window.localStorage.setItem("sf2525-host", platform);
              window.localStorage.setItem("sf2525-ready", "1");
              setStep("work");
            }}
          >
            Continue
          </button>
        </div>
      </main>,
      accent,
    );
  }

  const current = MODELS.find((item) => item.id === model);

  return withHistory(
    <main className={styles.page}>
      <div className={styles.wrap}>
        <div className={styles.row}>
          <div style={{ flex: 1 }}>
            <p className={styles.kicker}>MODULAR: EDGE</p>
            <h1>
              System Operator <span style={{ color: "var(--sf-primary, #00e5ff)" }}>{operator}</span>
            </h1>
            <p className={styles.muted}>{PLATFORMS.find((item) => item.id === platform)?.label}</p>
            <p className={styles.path}>{sensorPath(platform, [current?.label ?? "Demo.90"])}</p>
          </div>
          <button className={styles.ghost} type="button" onClick={() => setStep("device")}>
            Device
          </button>
          <button
            className={styles.ghost}
            type="button"
            onClick={() => {
              closeSensor();
              window.localStorage.removeItem("sf2525-operator");
              window.localStorage.removeItem("sf2525-ready");
              setOperator("");
              setStep("login");
            }}
          >
            Log out
          </button>
          <button className={styles.ghost} type="button" onClick={() => setSettings(true)} aria-label="Settings">
            Settings
          </button>
        </div>

        <section className={styles.stage}>
          <video ref={videoRef} autoPlay muted playsInline aria-label="Camera" />
          {!sensorOn && <div className={styles.idle}>Turn SENSOR 1 on to use the camera.</div>}
        </section>
        <div className={styles.tools}>
          {error && <p className={`${styles.alert} ${styles.wide}`}>{error}</p>}
          <button className={`${styles.primary} ${styles.wide}`} type="button" disabled={busy} onClick={() => (sensorOn ? closeSensor() : void openSensor())}>
            {busy ? "Opening…" : sensorOn ? "SENSOR 1: ON" : "SENSOR 1: OFF"}
          </button>
          <button className={styles.ghost} type="button" disabled={!sensorOn} onClick={() => void openSensor(facing === "user" ? "environment" : "user")}>
            Other side
          </button>
          <button className={styles.ghost} type="button" onClick={() => setAnnotate(true)}>
            Annotate
          </button>
        </div>

        <h2>Choose a model</h2>
        <p className={styles.muted}>The previous model stops before the next one starts.</p>
        <div className={styles.models}>
          {MODELS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.card} ${model === item.id ? styles.cardOn : ""}`}
              onClick={() => setModel(item.id)}
            >
              {item.label}
              <small>{item.sees}</small>
            </button>
          ))}
        </div>

        <h2>This device</h2>
        <p className={styles.muted}>Optional. This can make the computer faster. It is not a camera.</p>
        <button className={styles.ghost} type="button" onClick={() => setFaster((value) => !value)} aria-pressed={faster}>
          See faster {faster ? "on" : "off"}
        </button>

        {shots.length > 0 && (
          <>
            <h2>Saved pictures</h2>
            <div className={styles.shots}>
              {shots.map((shot) => (
                <img key={shot.id} src={shot.url} alt="Saved picture" />
              ))}
            </div>
          </>
        )}
      </div>

      {settings && (
        <div className={styles.shade} onClick={() => setSettings(false)}>
          <aside className={styles.drawer} onClick={(event) => event.stopPropagation()} role="dialog" aria-label="Settings">
            <div className={styles.row}>
              <h2 style={{ flex: 1 }}>Settings</h2>
              <button className={styles.ghost} type="button" onClick={() => setSettings(false)} aria-label="Close settings">
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
                  onClick={() => chooseScheme(item.id)}
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
                onClick={() => chooseScheme("custom")}
              >
                {scheme === "custom" && <span className={styles.check}>✓</span>}
                <span className={styles.dot} style={{ background: customHex }} />
                Custom
              </button>
            </div>
            {scheme === "custom" && (
              <label>
                Custom color
                <input type="color" value={customHex} aria-label="Custom session color" onChange={(event) => chooseScheme("custom", event.target.value)} />
              </label>
            )}
            <button type="button" className={`${styles.frame} ${scheme === "atlantis" ? styles.swatchOn : ""}`} onClick={() => chooseScheme("atlantis")}>
              The Atlantis Accords
              <small className={styles.muted}> 7 sections</small>
            </button>
            <button type="button" className={`${styles.frame} ${scheme === "vision" ? styles.swatchOn : ""}`} onClick={() => chooseScheme("vision")}>
              Vision • 2525
              <small className={styles.muted}> Humanity’s Coordination Framework</small>
            </button>
          </aside>
        </div>
      )}

      {annotate && (
        <div className={styles.modalWrap}>
          <div className={styles.modal} role="dialog" aria-label="Capture images">
            <h2>Capture images for annotation.</h2>
            <label>
              Custom trained model name
              <input value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label>
              Images to capture
              <input inputMode="numeric" value={count} onChange={(event) => setCount(event.target.value)} />
            </label>
            <label>
              Custom trained model description
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
            <h2>File saved. Upload to start training.</h2>
            <p className={styles.muted}>
              {shots.length} pictures are on this device in {sensorPath(platform, [name || "capture"])}. Training starts when a trainer is connected. Nothing was sent yet.
            </p>
            <div className={styles.actions}>
              <button type="button" onClick={() => setSavedNote(false)}>
                UPLOAD
              </button>
              <button type="button" onClick={() => setSavedNote(false)}>
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </main>,
      accent,
    );
}
