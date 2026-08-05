"use client";

/**
 * /main/Vision-2525 — the Vision • 2525 white paper itself, in the app.
 * =====================================================================
 * The document is a single self-contained HTML file (the same bytes that download), so this route
 * FRAMES it rather than re-implementing it. That is deliberate: a React re-implementation would be a
 * second copy of the argument, and the whole premise of the document is that there is ONE record with
 * several views over it. Embedding the real file means LIGHT MODE IS the downloaded layout — not an
 * imitation of it — by construction.
 *
 * Light / Dark is driven by stamping `data-theme` on the embedded document's root, which is exactly
 * the hook its own stylesheet already listens for. Same origin, so the reach-in is legal and cheap.
 *
 * The manifesto poster still lives at /vision-2525 and is linked from the bar.
 * No login. No account. The file is static and public.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SeedOfLifeLogo } from "@/components/seed-of-life-logo";
import { Download, Sun, Moon, ExternalLink, Sparkles } from "lucide-react";

const PAPER = "/whitepaper/vision-2525.html";
const GOLD = "#e8b64c";
const CYAN = "#22d3ee";

type Mode = "light" | "dark";

export default function MainVision2525Page() {
  const frame = useRef<HTMLIFrameElement | null>(null);
  const [mode, setMode] = useState<Mode>("light");

  /* Stamp the theme onto the embedded document. Its stylesheet already treats
     :root[data-theme] as the authority over prefers-color-scheme.

     Retried rather than fired once on load: this is a static export, and a
     local 900 KB file can finish loading BEFORE React hydrates — in which case
     the onLoad handler is attached too late to ever run, and the toggle is
     silently dead. Poll until the document is reachable, then stop. */
  const apply = useCallback((m: Mode) => {
    let tries = 0;
    const stamp = () => {
      const doc = frame.current?.contentDocument;
      if (doc?.documentElement) {
        doc.documentElement.setAttribute("data-theme", m);
        return true;
      }
      return false;
    };
    if (stamp()) return;
    const id = window.setInterval(() => {
      if (stamp() || ++tries > 60) window.clearInterval(id);
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => apply(mode), [mode, apply]);

  return (
    <div className="flex h-[100dvh] flex-col" style={{ background: mode === "dark" ? "#0b0f17" : "#f7f6f2" }}>
      {/* ── Bar: identity, theme, download. Deliberately slim — the document
             carries its own deck and two sets of chrome would fight. ── */}
      <header
        className="z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5 sm:px-6"
        style={{
          background: "linear-gradient(180deg,#070c16 0%,#0a1020 100%)",
          borderColor: "rgba(232,182,76,0.28)",
        }}
      >
        <SeedOfLifeLogo size={26} accentColor={CYAN} className="shrink-0 opacity-90" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base font-bold leading-tight sm:text-lg" style={{ color: GOLD }}>
            VISION <span style={{ color: CYAN }}>&bull;</span> 2525
          </p>
          <p className="truncate text-[11px] leading-tight text-slate-400 sm:text-xs">
            Recursive Coordination for Human Continuity
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-full border" style={{ borderColor: "rgba(148,163,184,0.35)" }}>
            {(["light", "dark"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                title={m === "light" ? "Light — the exact layout of the download" : "Dark"}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors"
                style={mode === m ? { background: GOLD, color: "#0a1020" } : { color: "#94a3b8" }}
              >
                {m === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{m === "light" ? "Light" : "Dark"}</span>
              </button>
            ))}
          </div>

          <a
            href={PAPER}
            download="Vision-2525.html"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-900 transition-transform hover:scale-[1.03]"
            style={{ background: GOLD }}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <a
            href={PAPER}
            target="_blank"
            rel="noreferrer"
            title="Open full screen"
            className="rounded-full border p-1.5 text-slate-300 transition-colors hover:text-cyan-300"
            style={{ borderColor: "rgba(148,163,184,0.35)" }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <Link
            href="/vision-2525/"
            title="The Vision 2525 manifesto"
            className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-cyan-300 md:flex"
            style={{ borderColor: "rgba(148,163,184,0.35)" }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Manifesto
          </Link>
        </div>
      </header>

      {/* ── The document. The real file, not a copy of it. ── */}
      <iframe
        ref={frame}
        src={PAPER}
        title="Vision 2525 — Recursive Coordination for Human Continuity"
        onLoad={() => apply(mode)}
        className="min-h-0 w-full flex-1 border-0"
      />
    </div>
  );
}
