// Encrypted Messaging — turn a user-authored message into the sealed 1×-read
// format (single-message, Level 1 by default). Reuses the Atlantis Accords seal
// engine: we hand buildAtlantisPackageHtml / buildAtlantisLink a one-section
// { en: [section] } map plus { fmt, msg } options.
//
// Message types: plain (rendered as text), html (rendered as-is), markdown
// (converted to html HERE so the standalone reader needs no markdown parser).

import type { AccordSection } from "@/lib/atlantis-accord-data";
import type { SealOptions } from "@/lib/atlantis-package";

export type MessageType = "plain" | "markdown" | "html";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Minimal, self-contained markdown → HTML (headings, bold/italic/code, links,
 *  ordered/unordered lists, blockquotes, paragraphs). Source is HTML-escaped
 *  first, so markdown cannot inject raw tags. */
export function markdownToHtml(md: string): string {
  const lines = escapeHtml(md).replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let inUl = false, inOl = false;
  let para: string[] = [];
  const inline = (t: string) =>
    t
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const flushPara = () => { if (para.length) { out.push("<p>" + inline(para.join(" ")) + "</p>"); para = []; } };
  const closeLists = () => { if (inUl) { out.push("</ul>"); inUl = false; } if (inOl) { out.push("</ol>"); inOl = false; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^\d+\.\s+(.*)$/);
    const bq = line.match(/^&gt;\s?(.*)$/);
    if (h) { flushPara(); closeLists(); const lv = h[1].length; out.push(`<h${lv}>` + inline(h[2]) + `</h${lv}>`); }
    else if (ul) { flushPara(); if (inOl) { out.push("</ol>"); inOl = false; } if (!inUl) { out.push("<ul>"); inUl = true; } out.push("<li>" + inline(ul[1]) + "</li>"); }
    else if (ol) { flushPara(); if (inUl) { out.push("</ul>"); inUl = false; } if (!inOl) { out.push("<ol>"); inOl = true; } out.push("<li>" + inline(ol[1]) + "</li>"); }
    else if (bq) { flushPara(); closeLists(); out.push("<blockquote>" + inline(bq[1]) + "</blockquote>"); }
    else if (line === "") { flushPara(); closeLists(); }
    else { para.push(line); }
  }
  flushPara(); closeLists();
  return out.join("\n");
}

/** Resolve the message body to its final rendered form + the reader fmt flag. */
export function renderMessage(body: string, type: MessageType): { content: string; fmt: "plain" | "html" } {
  if (type === "html") return { content: body, fmt: "html" };
  if (type === "markdown") return { content: markdownToHtml(body), fmt: "html" };
  return { content: body, fmt: "plain" };
}

/** Build the seal-engine arguments for a single user message. */
export function buildMessageSeal(
  title: string,
  body: string,
  type: MessageType,
): {
  translations: Record<string, AccordSection[]>;
  langNames: Record<string, string>;
  defaultLang: string;
  opts: SealOptions;
} {
  const { content, fmt } = renderMessage(body, type);
  const cleanTitle = title.trim();
  // Petal overview (7-tier): a short plain-text preview of the message.
  const preview = (cleanTitle || body).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 64);
  const section: AccordSection = {
    id: "message",
    page: 1,
    tag: (cleanTitle || "MESSAGE").slice(0, 24),
    title: cleanTitle || "Sealed Message",
    content: { 7: preview, 33: content, 111: content, 333: content },
  };
  return {
    translations: { en: [section] },
    langNames: { en: "English" },
    defaultLang: "en",
    opts: { fmt, msg: true },
  };
}
