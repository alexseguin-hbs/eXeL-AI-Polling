"use client";

/**
 * Vision • 2525 — the white paper itself. NO IFRAME.
 * ==================================================
 * This component used to FRAME the document in an <iframe> inside a
 * `calc(100dvh - var(--site-chrome-h))` box. That one decision caused four
 * separate complaints, all of which were really the same complaint:
 *
 *   · Feedback / SECURITY-2525 / eXeL AI could never sit "at the very bottom
 *     after the text", because the text was a DIFFERENT DOCUMENT. The row was
 *     pinned in the outer page while the argument scrolled inside the frame,
 *     so it read as a bar laid over the words. Asked four times.
 *   · Landscape on a phone was unreadable — the frame was capped at viewport
 *     height minus chrome, and in landscape there is very little height left.
 *   · Two scrollbars, two theme owners, two footers.
 *   · The document opened light, because `mode` defaulted to "light" here even
 *     though the document itself has opened dark since r96.
 *
 * The document is already a complete, self-contained page at PAPER — its own
 * deck, its own Settings, its own theme, its own site row at the foot. So the
 * route hands the reader the document instead of a window onto it. One page,
 * one scroll, the site row last, dark by default because the document says so.
 *
 * The chrome this bar used to carry is not lost — it moved to where it always
 * belonged. Outline and Author are in the document's own Settings drawer and
 * its section rail (r104); Download is the browser's own save; the Manifesto
 * and the rest of the family are links in the document's foot.
 *
 * Rendered at /vision-2525/white-paper. No login. No account. Static and public.
 */
import { useEffect } from "react";

const PAPER = "/whitepaper/vision-2525.html";

/* v19 · the white paper follows the SAME language the rest of the app uses —
   the existing navbar globe / Settings selector, which persists the choice in
   localStorage["exel-active-locale"] (lexicon-context.tsx LOCALE_KEY). No new
   control: pick a language in the globe, the paper opens in that language.
   SHIPPED lists the languages whose per-language build is actually deployed at
   /whitepaper/vision-2525.<lang>.html — a locale not yet shipped falls back to
   English so a reader never hits a 404. Add each code here as its build ships. */
const SHIPPED = new Set<string>(["en", "es"]);
const LOCALE_KEY = "exel-active-locale";

function paperForLocale(): string {
  try {
    const loc = (localStorage.getItem(LOCALE_KEY) || "en").toLowerCase();
    if (loc && loc !== "en" && SHIPPED.has(loc)) return `/whitepaper/vision-2525.${loc}.html`;
  } catch { /* SSR / storage blocked — English */ }
  return PAPER;
}

export function Vision2525Reader() {
  /* replace(), not assign(): the frame-less document IS this route, so Back
     should return to whatever the reader came from rather than bouncing them
     through an empty shell they never saw. */
  useEffect(() => {
    window.location.replace(paperForLocale());
  }, []);

  return (
    <main
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        background: "#0b1314",
        color: "#94a3b8",
        fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      }}
    >
      {/* Seen only if JavaScript is off or the redirect is slow. It is a real
          link rather than a spinner, so the document is reachable either way. */}
      <p style={{ fontSize: 14, textAlign: "center", margin: 0 }}>
        Opening <strong style={{ color: "#e8b64c" }}>Vision • 2525</strong> —{" "}
        <a href={PAPER} style={{ color: "#22d3ee" }}>
          continue to the document
        </a>
        .
      </p>
    </main>
  );
}
