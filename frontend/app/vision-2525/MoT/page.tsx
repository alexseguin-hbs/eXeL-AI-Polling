// /vision-2525/MoT — The Author, Master of Thought, as a standalone reading.
//
// A child of the manifesto, sibling to /vision-2525/white-paper. The operator asked for
// this section to be readable and downloadable on its own, and this is that page.
//
// ONE-DOCUMENT NOTE, because this is exactly the shape of defect 27.
// The living document is the source of truth; this is an EXTRACT, never a rival copy.
// The two are held together by `scripts/mot-drift-check.mjs`, which compares the standalone
// against the live `mot.author` block and fails if a single one of the r81/r82 edits is
// missing. A second file is only safe when a machine proves it has not drifted — the brief
// drifted in a day at r39 and three registers drifted at r79, both because nothing checked.
//
// No app route may differ from another only by case (webpack refuses), so `MoT` is the one
// spelling. And nothing goes in public/vision-2525/ — that directory would shadow this very
// route under trailingSlash, which is the deployment trap already documented at r71.
"use client";

import Link from "next/link";
import { Download, ExternalLink, ArrowLeft, BookOpen } from "lucide-react";

const FILE = "/whitepaper/mot-author.html";
const GOLD = "#e8b64c";
const CYAN = "#22d3ee";

export default function MoTPage() {
  return (
    /* Same footer arithmetic as the white-paper reader: the shared layout appends the
       Feedback / SECURITY-2525 / eXeL AI row BELOW this page, so claiming the whole
       viewport makes the document taller than the screen. Subtract the measured row. */
    <div
      className="flex flex-col"
      style={{ height: "calc(100dvh - var(--site-chrome-h, 0px))", background: "#0b1314" }}
    >
      <header
        className="z-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2.5 sm:px-6"
        style={{
          background: "linear-gradient(180deg,#070c16 0%,#0a1020 100%)",
          borderColor: "rgba(232,182,76,0.28)",
        }}
      >
        <Link
          href="/vision-2525/white-paper/"
          title="Back to the full document"
          className="rounded-full border p-1.5 text-slate-300 transition-colors hover:text-cyan-300"
          style={{ borderColor: "rgba(148,163,184,0.35)" }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="truncate font-serif text-base font-bold leading-tight sm:text-lg" style={{ color: GOLD }}>
            The Author <span style={{ color: CYAN }}>&middot;</span> Master of Thought
          </p>
          <p className="truncate text-[11px] leading-tight text-slate-400 sm:text-xs">
            One name. One responsibility. One practice you can begin today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            title="An extract of one section. The full document is the source of truth."
            className="hidden shrink-0 rounded-full border px-2.5 py-1 font-mono text-[11px] leading-none sm:inline-block"
            style={{ borderColor: "rgba(34,211,238,0.4)", color: CYAN }}
          >
            extract
          </span>

          <Link
            href="/vision-2525/white-paper/"
            className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:text-cyan-300"
            style={{ borderColor: "rgba(148,163,184,0.35)" }}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Full document</span>
          </Link>

          <a
            href={FILE}
            download="SoI_Vision2525_The_Author_Master_of_Thought.html"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-900 transition-transform hover:scale-[1.03]"
            style={{ background: GOLD }}
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <a
            href={FILE}
            target="_blank"
            rel="noreferrer"
            title="Open full screen"
            className="rounded-full border p-1.5 text-slate-300 transition-colors hover:text-cyan-300"
            style={{ borderColor: "rgba(148,163,184,0.35)" }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      {/* The real file, not a re-implementation — same bytes that download. */}
      <iframe
        src={FILE}
        title="The Author — Master of Thought"
        className="min-h-0 w-full flex-1 border-0"
      />
    </div>
  );
}
