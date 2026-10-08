"use client";

/**
 * FITNESS-2525 · Upload workout.
 * Screenshots: Tesseract.js in the browser (loaded on demand, not the Gemini key).
 * Files: .tcx .gpx parsed here; .fit via the minimal reader in upload.ts.
 * Fields stay blank unless the source contained them. Confirm before applyDay (device + autosave).
 */
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { FitDay } from "@/lib/fitness-2525/types";
import {
  activityHasSignal, coalesceActivities, mergeActivityIntoDay, parseFit, parseGarminText, parseGpx, parseTcx,
  type ParsedActivity,
} from "@/lib/fitness-2525/upload";
import { C } from "./ux-helpers";
import { AuthGate } from "./auth-gate";

const TESS_SRC = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";

type TessNS = { recognize: (image: Blob, lang?: string) => Promise<{ data?: { text?: string } }> };

function loadTesseract(): Promise<TessNS> {
  const w = window as unknown as { Tesseract?: TessNS };
  if (w.Tesseract?.recognize) return Promise.resolve(w.Tesseract);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = TESS_SRC;
    s.async = true;
    s.onload = () => {
      const t = (window as unknown as { Tesseract?: TessNS }).Tesseract;
      if (t?.recognize) resolve(t);
      else reject(new Error("Tesseract.js loaded but OCR is unavailable."));
    };
    s.onerror = () => reject(new Error("Could not load Tesseract.js for screenshot OCR. Check the network and try again."));
    document.head.appendChild(s);
  });
}

function shown(v: string | null | undefined, empty: string): string {
  return v ? v : empty;
}

function fieldRows(a: ParsedActivity): [string, string][] {
  const blank = "— not in source";
  return [
    ["Sport", shown(a.sport, blank)],
    ["Title", shown(a.title, blank)],
    ["Date", shown(a.date || a.dateLabel, blank)],
    ["Start", shown(a.start, blank)],
    ["Distance", a.distance ? `${a.distance.value} ${a.distance.unit}` : blank],
    ["Duration", shown(a.duration, blank)],
    ["Pace", shown(a.pace, blank)],
    ["Speed", shown(a.speed, blank)],
    ["Avg HR", a.avgHr != null ? `${a.avgHr} bpm` : blank],
    ["Ascent", shown(a.ascent, blank)],
    ["Avg power", a.avgPower != null ? `${a.avgPower} W` : blank],
    ["Calories", a.calories != null ? `${a.calories} kcal` : blank],
    ["Zone", shown(a.zone, blank)],
  ];
}

export function UploadWorkout({
  day, applyDay, signedIn, onSignIn, authLoading, btnPrimary, btnGhost,
}: {
  day: FitDay;
  applyDay: (updater: (prev: FitDay) => FitDay) => void;
  signedIn: boolean;
  onSignIn: () => void;
  authLoading?: boolean;
  btnPrimary: CSSProperties;
  btnGhost: CSSProperties;
}) {
  const imgRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"screenshot" | "file">("screenshot");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<ParsedActivity[]>([]);
  const [applied, setApplied] = useState("");

  const onScreenshots = async (list: FileList | null) => {
    const files = fileList(list).filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic)$/i.test(f.name));
    if (!files.length) return;
    setError("");
    setApplied("");
    setBusy(`Reading ${files.length} screenshot${files.length > 1 ? "s" : ""}…`);
    try {
      const tess = await loadTesseract();
      const parsed: ParsedActivity[] = [];
      for (const file of files) {
        setBusy(`Reading ${file.name}…`);
        const out = await tess.recognize(file, "eng");
        const text = out?.data?.text || "";
        const one = parseGarminText(text);
        if (!text.trim()) one.warnings.push(`${file.name}: OCR returned no text.`);
        parsed.push(one);
      }
      setDrafts(coalesceActivities(parsed));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Screenshot OCR failed.");
    } finally {
      setBusy("");
      if (imgRef.current) imgRef.current.value = "";
    }
  };

  const onFiles = async (list: FileList | null) => {
    const files = fileList(list);
    if (!files.length) return;
    setError("");
    setApplied("");
    setBusy("Reading workout file…");
    try {
      const parsed: ParsedActivity[] = [];
      for (const file of files) {
        const ext = (file.name.split(".").pop() || "").toLowerCase();
        if (ext === "fit") parsed.push(parseFit(new Uint8Array(await file.arrayBuffer())));
        else if (ext === "tcx") parsed.push(parseTcx(await file.text()));
        else if (ext === "gpx") parsed.push(parseGpx(await file.text()));
        else parsed.push(emptyMiss(file.name));
      }
      setDrafts(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read that file.");
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const apply = () => {
    const usable = drafts.filter(activityHasSignal);
    if (!usable.length) {
      setError("Nothing to apply — no distance, time, sport, or heart rate was found.");
      return;
    }
    applyDay((prev) => {
      let next = prev;
      usable.forEach((a, i) => { next = mergeActivityIntoDay(next, a, Date.now() + i); });
      return next;
    });
    setDrafts([]);
    setApplied(signedIn
      ? `Applied ${usable.length} workout${usable.length > 1 ? "s" : ""} to ${day.date}. Autosave writes it to your account.`
      : `Applied ${usable.length} workout${usable.length > 1 ? "s" : ""} on this device only.`);
  };

  const tabBtn = (id: "screenshot" | "file"): CSSProperties => ({
    ...btnGhost,
    borderColor: mode === id ? C.cyan : C.border,
    color: mode === id ? C.cyan : C.dim,
  });

  return (
    <div id="fit-upload" data-fit-upload className="rounded border p-2" style={{ borderColor: `${C.cyan}55`, background: "#0b1119" }}>
      <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: C.gold }}>Upload workout</div>
      <p className="mt-1 text-[10px]" style={{ color: C.dim }}>
        Screenshot (Garmin Connect) or a .fit / .tcx / .gpx file. Calories stay blank unless the image or file actually contains them.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" style={tabBtn("screenshot")} onClick={() => setMode("screenshot")}>Screenshot</button>
        <button type="button" style={tabBtn("file")} onClick={() => setMode("file")}>File</button>
        {mode === "screenshot" ? (
          <button type="button" style={btnPrimary} disabled={!!busy} onClick={() => imgRef.current?.click()}>Choose images</button>
        ) : (
          <button type="button" style={btnPrimary} disabled={!!busy} onClick={() => fileRef.current?.click()}>Choose file</button>
        )}
      </div>
      <input ref={imgRef} type="file" accept="image/*" multiple hidden data-fit-upload-images onChange={(e) => { void onScreenshots(e.target.files); }} />
      <input ref={fileRef} type="file" accept=".fit,.tcx,.gpx,application/gpx+xml" multiple hidden data-fit-upload-files onChange={(e) => { void onFiles(e.target.files); }} />
      {busy && <p className="mt-2 text-[10px]" style={{ color: C.cyan }}>{busy}</p>}
      {error && <p className="mt-2 text-[10px]" style={{ color: C.red }}>{error}</p>}
      {applied && <p className="mt-2 text-[10px]" style={{ color: C.green }}>{applied}</p>}
      {drafts.map((a, i) => (
        <div key={`${a.source}-${i}`} className="mt-2 rounded border p-2" data-fit-upload-confirm style={{ borderColor: C.border }}>
          <div className="text-[10px] font-bold uppercase" style={{ color: C.cyan }}>Confirm · {a.source}</div>
          <dl className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
            {fieldRows(a).map(([k, v]) => (
              <div key={k} className="contents">
                <dt style={{ color: C.dim }}>{k}</dt>
                <dd style={{ color: v.startsWith("—") ? C.dim : C.text }}>{v}</dd>
              </div>
            ))}
          </dl>
          {a.warnings.length > 0 && <p className="mt-1 text-[10px]" style={{ color: C.amber }}>{a.warnings.join(" ")}</p>}
          {a.raw && (
            <details className="mt-1">
              <summary className="cursor-pointer text-[9px]" style={{ color: C.dim }}>Extracted text</summary>
              <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap text-[9px]" style={{ color: C.dim }}>{a.raw}</pre>
            </details>
          )}
        </div>
      ))}
      {drafts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" style={btnPrimary} onClick={apply}>Apply to this day</button>
          <button type="button" style={btnGhost} onClick={() => { setDrafts([]); setError(""); }}>Discard</button>
        </div>
      )}
      {!signedIn && (
        <div className="mt-2">
          <AuthGate compact onSignIn={onSignIn} isLoading={authLoading}
            message="Saved on this device only until you sign in. Auth0 is required to save workouts to your account." />
        </div>
      )}
    </div>
  );
}

function fileList(list: FileList | null): File[] {
  const out: File[] = [];
  if (!list) return out;
  for (let i = 0; i < list.length; i++) {
    const f = list.item(i);
    if (f) out.push(f);
  }
  return out;
}

function emptyMiss(name: string): ParsedActivity {
  return {
    source: "gpx", sport: null, title: name, date: null, dateLabel: null, start: null,
    distance: null, duration: null, minutes: null, pace: null, speed: null, avgHr: null,
    ascent: null, avgPower: null, calories: null, zone: null, raw: null,
    warnings: [`${name}: use a .fit, .tcx, or .gpx file.`],
  };
}
