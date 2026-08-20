// Atlantis Accords — offline standalone HTML package (clearance + Light Codex cover).
//
// Self-contained .html the moderator emails. The COVER is deliberately vague —
// no title text; a clearance-colored border; the clearance level shown only as
// circles (Seed of Life, not words); a single center circle seal; universal
// wonder words; and a Light Codex double-helix band encoding a signed message
// (date · CST time · sender). The full accord content unlocks with a 4-digit PIN
// transferred out-of-band by the sender. One-time view + self-destruct on close.
//
// Clearance 1–7 → rainbow (Red..Violet) = circles drawn = accord sections
// embedded. Only unlocked sections are written into the file.
//
// ⚠ Best-effort exclusivity (moderator-facing): the ciphertext ships in the
// file and the one-time lock is soft (multi-vector storage flags — copies can
// still be reopened). Seal strength is selectable: STANDARD 4-digit (~13 bits,
// verbal share, casual deterrent) · FORTIFIED 7-glyph (~35 bits) · ABYSSAL
// 12-glyph (~60 bits, beyond practical brute force). Hides in plain sight.
// Burn-on-close: on PC Chrome/Edge the sealed screen offers to overwrite the
// original file with a dead shell (ciphertext destroyed); phones/Safari rely
// on the multi-vector seal. True consume-once revocation requires the
// server-gated path (WireGuard-whitelisted cube key endpoint) — Level-7 tier.
//
// Cross-platform decrypt: iOS/Android often open local files in a NON-secure
// context where window.crypto.subtle is unavailable. The reader carries a
// pure-JS AES-256-GCM + PBKDF2 fallback (verified byte-compatible with
// WebCrypto) so the SAME ciphertext opens on every device.

import type { AccordSection } from "@/lib/atlantis-accord-data";
import { getReaderUI, type ReaderUI } from "@/lib/atlantis-reader-ui";
import { TRINITY_COLORS } from "@/lib/trinity-palette";
import { supabase } from "@/lib/supabase";

// PBKDF2-SHA256 work factor. Deliberately 100k (not the OWASP 600k) because the
// reader falls back to a PURE-JS KDF on devices without WebCrypto (iOS/Android
// local files) — 600k there costs ~20-40s. At 100k the fallback is ~2-3s, and
// for Level-1's threat model the CODE ENTROPY is the wall, not the KDF depth.
const PBKDF2_ITERATIONS = 100_000;

// The 7 clearance colors are 7 of the 13 SoI Trinity master colors (single source
// of truth: lib/trinity-palette.ts) — change a master color and every 7-color use
// across the platform follows. Level 3 = Sunset Yellow (temporal). Index 0 unused.
export const CLEARANCE_COLORS = [
  "",
  TRINITY_COLORS.evolution,    // 1 RED
  TRINITY_COLORS.intelligence, // 2 ORANGE
  TRINITY_COLORS.temporal,     // 3 YELLOW (Sunset)
  TRINITY_COLORS.ooda,         // 4 GREEN
  TRINITY_COLORS.wholeness,    // 5 BLUE
  TRINITY_COLORS.family,       // 6 INDIGO
  TRINITY_COLORS.governance,   // 7 VIOLET
];
export const CLEARANCE_NAMES = [
  "", "RED", "ORANGE", "YELLOW", "GREEN", "BLUE", "INDIGO", "VIOLET",
];
export const MAX_CLEARANCE = 7;

// ── Light Codex (double-helix encode) — ported from the reference python ─────
const ALPHA: Record<string, string> = {
  A: "WWCC", B: "RRRR", C: "CWRC", D: "YCCY", E: "CCRR", F: "WRRW", G: "YCYC",
  H: "WWRR", I: "YBBY", J: "CWWC", K: "YYCC", L: "YBYB", M: "WCWC", N: "CWCW",
  O: "RRYY", P: "CCCW", Q: "YYYY", R: "RWWR", S: "WWWC", T: "RWCC", U: "RWRW",
  V: "WRWR", W: "CCRW", X: "WCCW", Y: "YRYR", Z: "YCRB", " ": "BBBB", ".": "BBBW",
};
const NUMBERS: Record<string, string> = {
  "0": "BBBB", "1": "WBBB", "2": "WWBB", "3": "WWWB", "4": "WWWW",
  "5": "VBBB", "6": "VWBB", "7": "VWWB", "8": "VWWW", "9": "VVVV",
};
const TRANSMISSION: Record<string, string> = { "4": "GGGG", "3": "GGGR", "2": "GGRR", "1": "GRRR" };

function encodeChar(ch: string): string {
  if (ch >= "0" && ch <= "9") return NUMBERS[ch];
  const u = ch.toUpperCase();
  return ALPHA[u] ?? ALPHA[" "]; // unsupported → space (BBBB)
}
function encodeMessage(text: string): string {
  let out = "";
  for (const ch of text) out += encodeChar(ch);
  return out;
}
function frame(seq: string): string {
  let out = "";
  for (const c of seq) out += TRANSMISSION[c];
  return out;
}
/** Returns { fwd, rev } token strings (B/R/Y/G/C/V/W) for the double helix. */
function doubleHelix(message: string): { fwd: string; rev: string } {
  const rev = message.split("").reverse().join("");
  return {
    fwd: frame("4321") + encodeMessage(message) + frame("1234"),
    rev: frame("1234") + encodeMessage(rev) + frame("4321"),
  };
}

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s);
}

// ── Seal strength tiers (Council of Twelve hardening) ────────────────────────
// Glyph alphabet excludes ambiguous characters (0/O, 1/I/L) for verbal + visual
// clarity. 31 symbols ≈ 4.95 bits/glyph.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export interface SealStrength {
  id: string;
  numeral: string;   // roman numeral shown on the selector
  label: string;
  len: number;       // code length
  numeric: boolean;  // digits-only (verbal share) vs glyph alphabet
  bits: number;      // approx entropy, honest
  share: string;     // recommended share channel
  honest: string;    // moderator-facing truth about resistance
}

export const SEAL_STRENGTHS: SealStrength[] = [
  {
    id: "standard", numeral: "I", label: "Standard", len: 4, numeric: true, bits: 13,
    share: "verbal · text",
    honest: "Deters casual readers. Falls in seconds to a determined offline attack.",
  },
  {
    id: "fortified", numeral: "II", label: "Fortified", len: 7, numeric: false, bits: 35,
    share: "text · email",
    honest: "Weeks of dedicated GPU work to break — strong against most real-world actors.",
  },
  {
    id: "abyssal", numeral: "III", label: "Abyssal", len: 12, numeric: false, bits: 60,
    share: "copy-paste",
    honest: "Centuries at current compute — beyond practical brute force. The copy-seal itself remains soft.",
  },
];

/** Unbiased random index in [0, max) via rejection sampling (no modulo bias). */
function randomIndex(max: number): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  let v: number;
  do { v = crypto.getRandomValues(buf)[0]; } while (v >= limit);
  return v % max;
}

/** Cryptographically random seal code for the given strength tier. */
export function generateSealCode(s: SealStrength): string {
  let out = "";
  for (let i = 0; i < s.len; i++) {
    out += s.numeric ? String(randomIndex(10)) : CODE_ALPHABET[randomIndex(CODE_ALPHABET.length)];
  }
  return out;
}

/** Display grouping — 4-glyph clusters read like a sigil: XXXX-XXXX-XXXX. */
export function formatSealCode(code: string): string {
  return code.length <= 4 ? code : (code.match(/.{1,4}/g) ?? [code]).join("-");
}

async function deriveKey(code: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(code) as BufferSource, "PBKDF2", false, ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt"],
  );
}

/** Austin (Central) date + time-of-day, codex-safe (digits/letters/space/period). */
function centralStamp(now: Date): { date: string; time: string } {
  const parts = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", ...opts }).formatToParts(now);
  const d = parts({ year: "numeric", month: "2-digit", day: "2-digit" });
  const g = (t: string) => d.find((p) => p.type === t)?.value ?? "";
  const date = `${g("year")}.${g("month")}.${g("day")}`;
  const t = parts({ hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" });
  const gt = (t2: string) => t.find((p) => p.type === t2)?.value ?? "";
  const tz = gt("timeZoneName").replace(/[^A-Z]/g, "");
  const time = `${gt("hour")}.${gt("minute")} ${tz}`;
  return { date, time };
}

// Live site + hosted reader. The reader is a STATIC, portable file
// (public/seal.html): copy it to ANY domain and point ATLANTIS_READER_URL at
// it — the sealed payload rides in the link's #fragment and is never sent to
// the host, so it stays zero-knowledge. Default = current deploy (works today).
export const SITE_URL = "https://exel-ai-polling.explore-096.workers.dev";
// Extensionless /seal (NOT /seal.html): Workers Static Assets 307-redirects the
// .html URL to the clean path, and that hop drops the #fragment the reader needs.
// /seal is a terminal 200, so the fragment survives — used for both the worker
// redirect target and the long-link fallback below.
export const ATLANTIS_READER_URL = SITE_URL + "/seal";
// Deep-link to the Atlantis Accords viewer itself (opens the reader directly,
// as if the user opened Settings → The Atlantis Accords). The in-viewer QR
// encodes this so a scan lands straight on the Accords, not the homepage.
// Canonical Accords page (replaces /atlantis — the old path redirects here).
// Trailing slash matches the static-export asset directly (no 307 hop on scan).
export const ATLANTIS_PAGE_URL = SITE_URL + "/Atlantis-Accords/";
// Pretty, on-brand share URL: /Atlantis-Accords/<7-char-hash> (a throwback to
// the 7 clearance levels). Served by worker.js, which 302-redirects to
// /seal#<hash> for the hosted reader.
export const ATLANTIS_LINK_BASE = SITE_URL + "/Atlantis-Accords/";
// Short-link store lives in Supabase (secure backend, ciphertext only) — the
// shared link becomes /seal#<7-char-hash> instead of an 8 KB #fragment.
const SEAL_TABLE = "atlantis_seals";
const SEAL_HASH_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
function newSealHash(): string {
  const b = crypto.getRandomValues(new Uint8Array(7));
  let s = "";
  for (let i = 0; i < 7; i++) s += SEAL_HASH_ALPHABET[b[i] % SEAL_HASH_ALPHABET.length];
  return s;
}

/** Build the sealed package object (encryption + cover meta), as a JSON string.
 *  Shared by the offline file and the universal link — identical payload.
 *
 *  MULTILINGUAL / REUSABLE "1x read" format: the encrypted payload embeds an
 *  i18n map { <lang>: { nav, sections } } for every provided language, plus the
 *  available lang codes + display names. The reader's language selector switches
 *  the whole document (petals, headers, all word tiers) in-memory after unlock.
 *  Tags stay as English step-codes (localized display labels are a later layer). */
export interface SealOptions {
  /** Content rendering: "plain" = textContent (default), "html" = innerHTML (pre-sanitized markdown/HTML message). */
  fmt?: "plain" | "html";
  /** Single-message mode: hide word-tier buttons, use the section's own tag/title (not Accord step codes). */
  msg?: boolean;
}

async function buildAtlantisPayloadJson(
  translations: Record<string, AccordSection[]>,
  langNames: Record<string, string>,
  defaultLang: string,
  code: string,
  clearance: number,
  sender: string,
  opts?: SealOptions,
): Promise<string> {
  const lvl = Math.max(1, Math.min(MAX_CLEARANCE, Math.round(clearance)));
  const snd = (sender || "eXeL AI").trim();

  const { date, time } = centralStamp(new Date());
  // Signed message encoded into the cover's Light Codex (hides in plain sight).
  const codexMsg =
    `THE ATLANTIS ACCORDS . WRITTEN 2026.07.04 . SENT ${date} ${time} AUSTIN TX . ${snd}`
      .toUpperCase().replace(/[^A-Z0-9 .]/g, " ");
  const helix = doubleHelix(codexMsg);

  // English is the canonical structure (tag codes + fallback source).
  const EN = translations.en ?? Object.values(translations)[0];
  const langs = Object.keys(translations);
  const i18n: Record<string, { nav: { tag: string; seven: string }[]; sections: { tag: string; title: string; content: AccordSection["content"] }[]; ui: ReaderUI }> = {};
  for (const lang of langs) {
    const secs = translations[lang];
    i18n[lang] = {
      // Tag stays the English step-code; the 7-word overview + title + tiers localize (English fallback per field).
      nav: EN.map((en, i) => ({ tag: en.tag, seven: secs[i]?.content?.[7] ?? en.content[7] })),
      sections: EN.map((en, i) => ({ tag: en.tag, title: secs[i]?.title ?? en.title, content: secs[i]?.content ?? en.content })),
      // Reader chrome + 7 step labels for this language (English fallback).
      ui: getReaderUI(lang),
    };
  }
  const dl = i18n[defaultLang] ? defaultLang : "en";

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(code, salt);
  const payload = JSON.stringify({
    title: "The Atlantis Accords",
    // Color-NAME (e.g. "RED") is deliberately NOT embedded — the level is
    // conveyed only by border/accent color, never the spelled-out name.
    clearance: lvl, color: CLEARANCE_COLORS[lvl],
    sender: snd, codexDate: date, cstTime: time,
    // Multilingual: all languages embedded; selector switches in-memory.
    defaultLang: dl, langs, langNames,
    // Message-mode flags: fmt drives plain vs html rendering; msg = single-message layout.
    fmt: opts?.fmt === "html" ? "html" : "plain", msg: !!opts?.msg,
    i18n,
    // Back-compat: default-language nav/sections at top level for older readers.
    nav: i18n[dl].nav,
    sections: i18n[dl].sections,
  });
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource }, key,
    new TextEncoder().encode(payload) as BufferSource,
  );

  const pkg = {
    v: 4, id: crypto.randomUUID(), it: PBKDF2_ITERATIONS,
    // Code shape (length + digits-vs-glyphs) drives the reader's input UX.
    // Knowing the shape does not weaken the key — the file's holder can read
    // the ciphertext anyway; entropy is what defends it.
    cl: code.length, num: /^[0-9]+$/.test(code),
    salt: b64(salt), iv: b64(iv), ct: b64(cipher),
    // Unencrypted cover meta (vague on purpose — the CONTENT stays sealed):
    lvl, color: CLEARANCE_COLORS[lvl], sender: snd, codexDate: date, cstTime: time,
    fwd: helix.fwd, rev: helix.rev,
  };
  return JSON.stringify(pkg);
}

/** Self-contained offline .html (Android / PC — opens directly). Multilingual:
 *  pass the full { <lang>: AccordSection[] } map; the reader gets a selector. */
export async function buildAtlantisPackageHtml(
  translations: Record<string, AccordSection[]>,
  langNames: Record<string, string>,
  defaultLang: string,
  code: string,
  clearance: number,
  sender: string,
  opts?: SealOptions,
): Promise<string> {
  return htmlTemplate(await buildAtlantisPayloadJson(translations, langNames, defaultLang, code, clearance, sender, opts));
}

/** base64url (UTF-8 safe) — for carrying the payload in the link #fragment. */
function b64urlFromJson(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Universal link — opens the hosted reader in a real browser on ANY device
 *  (including iPhone/iPad, where local files can't run JS).
 *
 *  Short by default: the sealed payload is POSTed to the seal store, which
 *  returns a 7-char hash, so the shared link is tiny — `/seal.html#<hash>`.
 *  Only the CIPHERTEXT + cover meta are stored; the unlock code never touches
 *  the server, so it stays zero-knowledge. If the store is unreachable we fall
 *  back to the self-contained long link (full payload in the #fragment) so the
 *  link ALWAYS works. */
export async function buildAtlantisLink(
  translations: Record<string, AccordSection[]>,
  langNames: Record<string, string>,
  defaultLang: string,
  code: string,
  clearance: number,
  sender: string,
  opts?: SealOptions,
): Promise<string> {
  const json = await buildAtlantisPayloadJson(translations, langNames, defaultLang, code, clearance, sender, opts);
  if (supabase) {
    // Store the ciphertext under a fresh 7-char hash; retry on the (rare)
    // primary-key collision. The unlock code never touches the server.
    for (let tries = 0; tries < 3; tries++) {
      const hash = newSealHash();
      const { error } = await supabase.from(SEAL_TABLE).insert({ hash, payload: json });
      if (!error) return ATLANTIS_LINK_BASE + hash;
      if (error.code !== "23505") {
        // Council mandate: no silent degradation of a security feature.
        console.error(
          `[Atlantis] seal store insert failed (${error.code}): ${error.message} — ` +
            "falling back to the long #fragment link. If the table is missing, run supabase/atlantis_seals.sql.",
        );
        break;
      }
    }
  } else {
    console.error("[Atlantis] Supabase client not configured — falling back to the long #fragment link.");
  }
  // Supabase absent/unreachable → self-contained long link (payload in #fragment).
  return ATLANTIS_READER_URL + "#" + b64urlFromJson(json);
}

// ── The standalone document ──────────────────────────────────────────────────
function htmlTemplate(pkgJson: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>◬ · ♡ · 웃</title>
<style>
:root{--bg:#0a0e14;--bd:#1e2b3a;--tx:#c8d6e5;--dim:#5f7186}
*{box-sizing:border-box}html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--tx);font:15px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif}
.wrap{min-height:100%;display:flex;flex-direction:column}
.frame{position:relative;overflow:hidden;flex:1;margin:16px;border:2px solid #0a0e14;border-radius:8px;display:flex;flex-direction:column;background:var(--bg)}
.cover{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:34px 20px;gap:18px}
.seal{display:flex;align-items:center;justify-content:center}
.wonder{max-width:360px;color:var(--tx);font-size:15px;line-height:1.7}
.hint{color:var(--dim);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.codexTL{position:fixed;top:0;left:0;image-rendering:pixelated;opacity:.95;z-index:5}
.codexBR{position:fixed;bottom:0;right:0;image-rendering:pixelated;opacity:.95;z-index:5}
.meta{color:var(--dim);font-size:10px;letter-spacing:.08em;margin-top:6px}
.sealview{flex:1;display:none;flex-direction:column;align-items:center;justify-content:center;gap:16px;cursor:pointer}
.sealview .hint{animation:pulse 2.4s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.35}50%{opacity:.9}}
#code{width:150px;text-align:center;font-size:26px;letter-spacing:.4em;padding:9px;border-radius:10px;border:1px solid var(--bd);background:#0b1119;color:var(--tx)}
#code.glyph{width:min(340px,86vw);font:600 17px/1.5 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.18em;text-transform:uppercase}
button{cursor:pointer;border:1px solid var(--bd);background:#152238;color:var(--tx);border-radius:8px;padding:9px 16px;font-weight:600}
button:hover{background:#1b2c46}.err{color:#ef4444;font-size:12px;min-height:16px}
.reader{flex:1;display:none;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bd);padding:10px 16px}
.top h2{font-size:16px;margin:0}.badge{font-size:10px;letter-spacing:.15em;padding:3px 8px;border-radius:20px;border:1px solid}
.rbody{flex:1;display:flex;flex-direction:column}@media(min-width:760px){.rbody{flex-direction:row}}
.left,.right{padding:18px}.left{display:flex;align-items:center;justify-content:center}
@media(min-width:760px){.left{width:44%;border-right:1px solid var(--bd)}.right{width:56%;overflow:auto}}
.tiers{display:flex;gap:8px;margin:8px 0 14px;flex-wrap:wrap}
.tier{font-size:12px;padding:5px 12px;border-radius:20px;border:1px solid;background:transparent;cursor:pointer}
.tag{font-size:22px;font-weight:700}.title{color:var(--dim);font-weight:400}.content{white-space:pre-line;color:#dbe6f2}
.pager{display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--bd);padding:10px 16px}
.pager button{width:44px;height:44px;border-radius:50%}.mini{color:var(--dim);font-size:11px}
.done{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:24px}
.seal-eagle{width:132px;height:auto;margin:0 auto 8px;display:block;animation:sealstamp .72s cubic-bezier(.2,.8,.2,1) both}
@keyframes sealstamp{0%{opacity:0;transform:scale(1.55) rotate(-4deg)}55%{opacity:1;transform:scale(.93)}100%{opacity:.98;transform:scale(1) rotate(0)}}
</style></head><body>
<!-- No-JS notice: visible ONLY where scripting is disabled (iOS Quick Look /
     Mail & Files previews). The inline script below hides it the instant JS
     runs, so real browsers never see it (no flash). -->
<div id="nojs" style="padding:14px 18px;margin:16px 16px 0;border:1px solid #7f1d1d;border-radius:8px;background:#1a0e12;color:#fca5a5;font:13px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;text-align:center">
  <b>Code doesn't open it on iPhone/iPad?</b><br>You're viewing a file <i>preview</i>, where Apple disables the unlock. Ask the sender for the secure browser link, or open on Android / a computer. This copy opens directly there.
</div>
<script>try{document.getElementById('nojs').style.display='none'}catch(e){}</script>
<div class="wrap">
  <div class="frame" id="frame">
    <!-- Light Codex double helix (2x2 px), forward upper-left + reverse bottom-right.
         HIDDEN signature — plaintext date/time/sender is NOT shown; decode only via
         the SIM Light Codex decoder. -->
    <canvas class="codexTL" id="cxTL"></canvas>
    <canvas class="codexBR" id="cxBR"></canvas>
    <!-- COVER — professional / confidential. Clearance shown only as a growing Seed of Life. -->
    <div class="cover" id="cover">
      <div class="seal" id="seal"></div>
      <div class="wonder">This document is sealed under the Atlantis Accords. Access is granted to the intended recipient alone, by the key entrusted to them.</div>
      <div class="hint">Confidential · Please read privately</div>
      <div>
        <input id="code" type="text" placeholder="&#8226;&#8226;&#8226;&#8226;" autocomplete="off" spellcheck="false" autocapitalize="characters"><br>
        <div class="err" id="err"></div>
        <button id="unlock">Enter</button>
      </div>
    </div>
    <!-- SEAL VEIL (after correct PIN; click the seal to expose the Accords) -->
    <div class="sealview" id="sealview"><div class="seal" id="sealBig"></div><div class="hint" id="touchhint">Touch the seal to open</div></div>
    <!-- READER (unlocked) -->
    <div class="reader" id="reader">
      <div class="top"><h2 id="rtitle">The Atlantis Accords</h2>
        <div style="display:flex;gap:8px;align-items:center"><select id="lang" style="display:none;background:#0b1119;color:var(--tx);border:1px solid var(--bd);border-radius:8px;padding:5px 8px;font-size:12px;cursor:pointer"></select><span class="badge" id="badge"></span><button id="seal2">Close &amp; Seal</button></div></div>
      <div class="rbody">
        <div class="left" id="left"></div>
        <div class="right"><div class="tag" id="rtag"></div><div class="tiers" id="tiers"></div><div class="content" id="rcontent"></div></div>
      </div>
      <div class="pager"><button id="prev">&#8249;</button><span class="mini" id="pos"></span><button id="next">&#8250;</button></div>
    </div>
    <!-- SEALED -->
    <div class="done" id="done" style="display:none"><img id="sealEagle" class="seal-eagle" src="data:image/png;base64,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" alt="Master of Thought — sealed"/>
      <div class="hint" id="doneClosed">This copy has been closed and cannot be reopened</div>
      <div class="mini" id="doneFresh">Request a fresh copy from the sender.</div>
      <button id="burn" style="display:none;margin-top:10px">Burn this file</button>
      <div class="mini" id="burnHint"></div></div>
  </div>
</div>
<script id="pkg" type="application/json">${pkgJson}</script>
<script>
function __initSeal(){
  var _pk=document.getElementById('pkg');
  if(!_pk||!_pk.textContent.trim())return; // no payload yet
  var PKG=JSON.parse(_pk.textContent);
  var VKEY='atlantis_viewed_'+PKG.id;
  var frame=document.getElementById('frame'),cover=document.getElementById('cover'),reader=document.getElementById('reader'),done=document.getElementById('done');
  frame.style.setProperty('--clr',PKG.color);document.body.style.background=PKG.color;
  // Code input adapts to the seal strength baked into this copy (digits vs glyphs).
  var codeEl=document.getElementById('code');
  if(PKG.num){codeEl.setAttribute('inputmode','numeric');codeEl.maxLength=PKG.cl;}
  else{codeEl.classList.add('glyph');codeEl.maxLength=PKG.cl+3;codeEl.placeholder='••••-••••';}
  // Multi-vector one-time seal: localStorage + sessionStorage + cookie + IndexedDB.
  // Best-effort — a copied file can still be reopened; this hardens the casual path.
  var CK='atl_'+String(PKG.id).replace(/-/g,'');
  function seen(){
    try{if(localStorage.getItem(VKEY)==='1')return true}catch(e){}
    try{if(sessionStorage.getItem(VKEY)==='1')return true}catch(e){}
    try{if(document.cookie.indexOf(CK+'=1')>-1)return true}catch(e){}
    return false}
  function mark(){
    try{localStorage.setItem(VKEY,'1')}catch(e){}
    try{sessionStorage.setItem(VKEY,'1')}catch(e){}
    try{document.cookie=CK+'=1;max-age=63072000;path=/'}catch(e){}
    try{var r=indexedDB.open(CK,1);r.onupgradeneeded=function(){r.result.createObjectStore('s')};
      r.onsuccess=function(){try{r.result.transaction('s','readwrite').objectStore('s').put(1,'v')}catch(e){}}}catch(e){}}
  function sealScreen(){DATA=null;I18N=null;CT=null;cover.style.display='none';document.getElementById('sealview').style.display='none';reader.style.display='none';done.style.display='flex';stampEagle();}
  // IndexedDB survives some storage clears — async check seals reopened copies.
  try{var rq=indexedDB.open(CK,1);rq.onupgradeneeded=function(){rq.result.createObjectStore('s')};
    rq.onsuccess=function(){try{var g=rq.result.transaction('s').objectStore('s').get('v');
      g.onsuccess=function(){if(g.result===1){mark();sealScreen();}}}catch(e){}}}catch(e){}
  // Wrong-attempt backoff (soft, deters casual guessing): 3 free tries, then
  // escalating lockout 10s -> 20s -> 40s ... capped at 300s.
  var AKEY='atlantis_att_'+PKG.id;
  function att(){try{return JSON.parse(localStorage.getItem(AKEY))||{n:0,u:0}}catch(e){return{n:0,u:0}}}
  function setAtt(a){try{localStorage.setItem(AKEY,JSON.stringify(a))}catch(e){}}
  // Growing Seed of Life: N same-size circles (1 = small … 7 = full flower).
  function drawSeal(el,r){var pos=[[0,0]];for(var i=0;i<6;i++){var a=i*Math.PI/3-Math.PI/2;pos.push([r*Math.cos(a),r*Math.sin(a)]);}
    var use=pos.slice(0,PKG.lvl),minx=1e9,miny=1e9,maxx=-1e9,maxy=-1e9;
    use.forEach(function(p){minx=Math.min(minx,p[0]-r);maxx=Math.max(maxx,p[0]+r);miny=Math.min(miny,p[1]-r);maxy=Math.max(maxy,p[1]+r);});
    var pad=4,w=maxx-minx+2*pad,h=maxy-miny+2*pad,g='';
    use.forEach(function(p){g+='<circle cx="'+(p[0]-minx+pad).toFixed(1)+'" cy="'+(p[1]-miny+pad).toFixed(1)+'" r="'+r+'" fill="'+PKG.color+'" fill-opacity="0.10" stroke="'+PKG.color+'" stroke-width="2"/>';});
    el.innerHTML='<svg width="'+w.toFixed(0)+'" height="'+h.toFixed(0)+'" viewBox="0 0 '+w.toFixed(1)+' '+h.toFixed(1)+'">'+g+'</svg>';}
  drawSeal(document.getElementById('seal'),26);
  // Light Codex double helix — 1x1 px blocks (fits a full date/time/sender line
  // across a phone-portrait top edge), flush in the frame's far corners.
  (function(){var CM={B:[0,0,0],R:[255,0,0],Y:[255,255,0],G:[0,255,0],C:[0,255,255],V:[255,0,255],W:[255,255,255]},BLK=1;
    function draw(id,str){var cv=document.getElementById(id);cv.width=str.length*BLK;cv.height=BLK;var ctx=cv.getContext('2d');
      for(var i=0;i<str.length;i++){var c=CM[str[i]];if(!c)continue;ctx.fillStyle='rgb('+c[0]+','+c[1]+','+c[2]+')';ctx.fillRect(i*BLK,0,BLK,BLK);}}
    draw('cxTL',PKG.fwd);draw('cxBR',PKG.rev);})();
  if(seen()){cover.style.display='none';done.style.display='flex';stampEagle();return;}
  function d64(s){var b=atob(s),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a;}
  // ── Pure-JS AES-256-GCM + PBKDF2-HMAC-SHA256 (byte-compatible with WebCrypto) ─
  // Used when window.crypto.subtle is absent — iOS/Android local files run in a
  // non-secure context. Verified against WebCrypto ciphertext in Node.
  function _u8(s){return typeof s==='string'?new TextEncoder().encode(s):new Uint8Array(s);}
  var _K=[0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  function _sha256(msg){msg=_u8(msg);var l=msg.length,bl=l*8,withOne=l+1,k=(56-withOne%64+64)%64,total=withOne+k+8;
    var m=new Uint8Array(total);m.set(msg);m[l]=0x80;var dv=new DataView(m.buffer);
    dv.setUint32(total-4,bl>>>0,false);dv.setUint32(total-8,Math.floor(bl/0x100000000)>>>0,false);
    var H=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],w=new Uint32Array(64);
    for(var off=0;off<total;off+=64){for(var i=0;i<16;i++)w[i]=dv.getUint32(off+i*4,false);
      for(i=16;i<64;i++){var s0=((w[i-15]>>>7)|(w[i-15]<<25))^((w[i-15]>>>18)|(w[i-15]<<14))^(w[i-15]>>>3);
        var s1=((w[i-2]>>>17)|(w[i-2]<<15))^((w[i-2]>>>19)|(w[i-2]<<13))^(w[i-2]>>>10);w[i]=(w[i-16]+s0+w[i-7]+s1)|0;}
      var a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for(i=0;i<64;i++){var S1=((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)),ch=(e&f)^(~e&g),t1=(h+S1+ch+_K[i]+w[i])|0;
        var S0=((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)),maj=(a&b)^(a&c)^(b&c),t2=(S0+maj)|0;
        h=g;g=f;f=e;e=(d+t1)|0;d=c;c=b;b=a;a=(t1+t2)|0;}
      H[0]=(H[0]+a)|0;H[1]=(H[1]+b)|0;H[2]=(H[2]+c)|0;H[3]=(H[3]+d)|0;H[4]=(H[4]+e)|0;H[5]=(H[5]+f)|0;H[6]=(H[6]+g)|0;H[7]=(H[7]+h)|0;}
    var out=new Uint8Array(32),odv=new DataView(out.buffer);for(i=0;i<8;i++)odv.setUint32(i*4,H[i]>>>0,false);return out;}
  function _hmac(key,msg){key=_u8(key);msg=_u8(msg);if(key.length>64)key=_sha256(key);
    var ik=new Uint8Array(64),ok=new Uint8Array(64);ik.set(key);ok.set(key);
    for(var i=0;i<64;i++){ik[i]^=0x36;ok[i]^=0x5c;}
    var inner=new Uint8Array(64+msg.length);inner.set(ik);inner.set(msg,64);var ih=_sha256(inner);
    var outer=new Uint8Array(96);outer.set(ok);outer.set(ih,64);return _sha256(outer);}
  function _pbkdf2(pw,salt,iters,dkLen){pw=_u8(pw);salt=_u8(salt);var out=new Uint8Array(dkLen),blocks=Math.ceil(dkLen/32),pos=0;
    for(var b=1;b<=blocks;b++){var si=new Uint8Array(salt.length+4);si.set(salt);
      si[salt.length]=(b>>>24)&255;si[salt.length+1]=(b>>>16)&255;si[salt.length+2]=(b>>>8)&255;si[salt.length+3]=b&255;
      var u=_hmac(pw,si),t=u.slice();for(var i=1;i<iters;i++){u=_hmac(pw,u);for(var j=0;j<32;j++)t[j]^=u[j];}
      var n=Math.min(32,dkLen-pos);out.set(t.slice(0,n),pos);pos+=n;}return out;}
  var _SBOX=(function(){var p=1,q=1,sb=new Uint8Array(256);
    do{p=p^(p<<1)^(p&0x80?0x11b:0);p&=0xff;q^=q<<1;q^=q<<2;q^=q<<4;q&=0xff;if(q&0x80)q^=0x09;
      var x=q^((q<<1)|(q>>>7))^((q<<2)|(q>>>6))^((q<<3)|(q>>>5))^((q<<4)|(q>>>4));sb[p]=(x^0x63)&0xff;}while(p!==1);
    sb[0]=0x63;return sb;})();
  function _xt(a){return((a<<1)^((a&0x80)?0x1b:0))&0xff;}
  function _aesKey(key){var Nk=key.length/4,Nr=Nk+6,w=new Array(4*(Nr+1));
    for(var i=0;i<Nk;i++)w[i]=[key[4*i],key[4*i+1],key[4*i+2],key[4*i+3]];var rc=1;
    for(i=Nk;i<4*(Nr+1);i++){var t=w[i-1].slice();
      if(i%Nk===0){t=[t[1],t[2],t[3],t[0]];for(var k=0;k<4;k++)t[k]=_SBOX[t[k]];t[0]^=rc;rc=_xt(rc);}
      else if(Nk>6&&i%Nk===4){for(k=0;k<4;k++)t[k]=_SBOX[t[k]];}
      w[i]=[w[i-Nk][0]^t[0],w[i-Nk][1]^t[1],w[i-Nk][2]^t[2],w[i-Nk][3]^t[3]];}return{w:w,Nr:Nr};}
  function _aesEnc(ks,inp){var Nr=ks.Nr,w=ks.w,s=new Array(16);for(var i=0;i<16;i++)s[i]=inp[i];
    function ark(r){for(var c=0;c<4;c++)for(var row=0;row<4;row++)s[c*4+row]^=w[r*4+c][row];}
    ark(0);for(var round=1;round<Nr;round++){for(i=0;i<16;i++)s[i]=_SBOX[s[i]];
      var t=s.slice();for(var row=0;row<4;row++)for(var col=0;col<4;col++)s[col*4+row]=t[((col+row)%4)*4+row];
      for(col=0;col<4;col++){var a0=s[col*4],a1=s[col*4+1],a2=s[col*4+2],a3=s[col*4+3];
        s[col*4]=_xt(a0)^(_xt(a1)^a1)^a2^a3;s[col*4+1]=a0^_xt(a1)^(_xt(a2)^a2)^a3;
        s[col*4+2]=a0^a1^_xt(a2)^(_xt(a3)^a3);s[col*4+3]=(_xt(a0)^a0)^a1^a2^_xt(a3);}ark(round);}
    for(i=0;i<16;i++)s[i]=_SBOX[s[i]];var t2=s.slice();
    for(row=0;row<4;row++)for(col=0;col<4;col++)s[col*4+row]=t2[((col+row)%4)*4+row];ark(Nr);return new Uint8Array(s);}
  function _gfmul(X,Y){var Z=new Uint8Array(16),V=Y.slice();
    for(var i=0;i<128;i++){if((X[i>>>3]>>>(7-(i&7)))&1)for(var j=0;j<16;j++)Z[j]^=V[j];
      var lsb=V[15]&1;for(j=15;j>0;j--)V[j]=((V[j]>>>1)|((V[j-1]&1)<<7))&0xff;V[0]=V[0]>>>1;if(lsb)V[0]^=0xe1;}return Z;}
  function _ghash(H,data){var Y=new Uint8Array(16);for(var off=0;off<data.length;off+=16){for(var j=0;j<16;j++)Y[j]^=(data[off+j]||0);Y=_gfmul(Y,H);}return Y;}
  function _inc32(cb){var c=cb.slice(),n=(((c[12]<<24)|(c[13]<<16)|(c[14]<<8)|c[15])>>>0);n=(n+1)>>>0;
    c[12]=(n>>>24)&255;c[13]=(n>>>16)&255;c[14]=(n>>>8)&255;c[15]=n&255;return c;}
  function _gcmDecrypt(kb,iv,ctTag){var ks=_aesKey(kb),H=_aesEnc(ks,new Uint8Array(16));
    var J0=new Uint8Array(16);J0.set(iv.slice(0,12));J0[15]=1;
    var tag=ctTag.slice(ctTag.length-16),ct=ctTag.slice(0,ctTag.length-16),padC=(16-ct.length%16)%16;
    var buf=new Uint8Array(ct.length+padC+16),p=0;buf.set(ct,0);p=ct.length+padC;var dv=new DataView(buf.buffer);
    dv.setUint32(p,0,false);dv.setUint32(p+4,0,false);
    dv.setUint32(p+8,Math.floor(ct.length*8/0x100000000)>>>0,false);dv.setUint32(p+12,(ct.length*8)>>>0,false);
    var S=_ghash(H,buf),EJ0=_aesEnc(ks,J0),ok=1;for(var i=0;i<16;i++)if((S[i]^EJ0[i])!==tag[i])ok=0;
    if(!ok)throw new Error('auth');
    var out=new Uint8Array(ct.length),ctr=_inc32(J0);
    for(var off=0;off<ct.length;off+=16){var ek=_aesEnc(ks,ctr),n=Math.min(16,ct.length-off);
      for(i=0;i<n;i++)out[off+i]=ct[off+i]^ek[i];ctr=_inc32(ctr);}return out;}
  var hasSubtle=!!(window.crypto&&window.crypto.subtle&&window.crypto.subtle.decrypt);
  async function decrypt(code){var salt=d64(PKG.salt),iv=d64(PKG.iv),ct=d64(PKG.ct);
    if(hasSubtle){try{
      var base=await crypto.subtle.importKey('raw',new TextEncoder().encode(code),'PBKDF2',false,['deriveKey']);
      var key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:salt,iterations:PKG.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
      var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:iv},key,ct);return JSON.parse(new TextDecoder().decode(pt));
    }catch(e){if(e&&e.name==='OperationError')throw e;/* subtle broken → fall through to pure-JS */}}
    // Pure-JS path (no secure context needed). Yield first so the "Deciphering…" paint lands.
    await new Promise(function(r){setTimeout(r,30);});
    var dk=_pbkdf2(code,salt,PKG.it,32);
    var pt2=_gcmDecrypt(dk,iv,ct);return JSON.parse(new TextDecoder().decode(pt2));}
  var DATA=null,I18N=null,LANGS=[],LNAMES={},curLang='en',CT=null,ENS=null,UIc=null,RTL={ar:1,he:1,fa:1,ur:1},sec=0,tier=33,COL=PKG.color,LVL=PKG.lvl;
  // English fallback chrome for legacy single-language payloads (no ui block).
  var FB_UI={title:"The Atlantis Accords",clearance:"Clearance: Level",words:"words",closeSeal:"Close & Seal",touchSeal:"Touch the seal to open",sealedSection:"Sealed at Clearance: Level {n}. A higher clearance is required to open this section.",doneClosed:"This copy has been closed and cannot be reopened",doneFresh:"Request a fresh copy from the sender.",burn:"Burn this file",steps:["PILOT","REPLAY","QUALIFY","CERTIFY","ADOPT","EDUCATE","EXPAND"]};
  // Apply the current language's chrome strings to the persistent UI elements.
  function applyUI(){var u=UIc||FB_UI,e;
    if(e=document.getElementById('rtitle'))e.textContent=u.title;
    if(e=document.getElementById('seal2'))e.textContent=u.closeSeal;
    if(e=document.getElementById('touchhint'))e.textContent=u.touchSeal;
    if(e=document.getElementById('doneClosed'))e.textContent=u.doneClosed;
    if(e=document.getElementById('doneFresh'))e.textContent=u.doneFresh;
    if(e=document.getElementById('burn'))e.textContent=u.burn;
    if(e=document.getElementById('badge'))e.textContent=u.clearance+' '+LVL;}
  var TC={7:'#c084fc',33:'#FF0000',111:'#10B981',333:'#3B82F6',999:'#8B5CF6'};
  // Original AccordFlower geometry: 6 petals (idx 0-5) + EXPAND hub (idx 6).
  var POS=(function(){var CX=300,CY=250,a=[];for(var i=0;i<6;i++){var d=(-120+i*60)*Math.PI/180;a.push({cx:CX+130*Math.cos(d),cy:CY+130*Math.sin(d),r:85});}a.push({cx:CX,cy:CY,r:50});return a;})();
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
  function wrap(str,per){var w=String(str).split(' '),o=[],c=[];w.forEach(function(x){c.push(x);if(c.join(' ').length>=per){o.push(c.join(' '));c=[];}});if(c.length)o.push(c.join(' '));return o;}
  function drawLeft(){
    // Flower color follows the selected word-tier: 33=red, 111=green, 333=blue.
    var FC=TC[tier]||COL,g='',n=CT.sections.length;
    for(var i=0;i<7;i++){var p=POS[i],on=i<n,act=(i===sec),nv=CT.nav[i],hub=(i===6);
      var fill=on?FC:'#3a2530',fo=act?(on?0.42:0.20):(on?0.16:0.05),st=act?'#fff':(on?FC:'#3a2530');
      g+='<circle data-i="'+i+'" style="cursor:pointer" cx="'+p.cx.toFixed(1)+'" cy="'+p.cy.toFixed(1)+'" r="'+p.r+'" fill="'+fill+'" fill-opacity="'+fo+'" stroke="'+st+'" stroke-width="'+(act?3:2)+'" '+(on?'':'opacity="0.6"')+'/>';
      var tcol=on?'#fff':'#7a6470';
      g+='<text x="'+p.cx.toFixed(1)+'" y="'+(p.cy-(hub?0:12)).toFixed(1)+'" text-anchor="middle" fill="'+tcol+'" font-size="'+(hub?12:15)+'" font-weight="700" pointer-events="none">'+esc((DATA&&DATA.msg)?(nv.tag||''):((UIc||FB_UI).steps[i]||nv.tag))+'</text>';
      if(!hub){var L=wrap(nv.seven||'',18);L.slice(0,3).forEach(function(ln,li){g+='<text x="'+p.cx.toFixed(1)+'" y="'+(p.cy+6+li*12).toFixed(1)+'" text-anchor="middle" fill="'+(on?'#e6cccc':'#7a6470')+'" font-size="9" pointer-events="none">'+esc(ln)+'</text>';});}
    }
    document.getElementById('left').innerHTML='<svg viewBox="0 0 600 500" width="100%" style="max-height:74vh;overflow:visible">'+g+'</svg>';
    Array.prototype.forEach.call(document.querySelectorAll('#left circle[data-i]'),function(c){c.onclick=function(){var t=+c.dataset.i;if(DATA&&DATA.msg&&t>=CT.sections.length)return;sec=t;render();};});
  }
  // 999 resolves current-language content first, then the English 999 (translations
  // land later), matching the live viewer's fallback — the package must match exactly.
  function c999(i){var s=CT&&CT.sections[i];if(s&&s.content[999])return s.content[999];var e=I18N&&I18N.en&&I18N.en.sections&&I18N.en.sections[i];return (e&&e.content[999])||'';}
  function drawTiers(){var t=document.getElementById('tiers');t.innerHTML='';[33,111,333,999].forEach(function(n){if(n===999&&!c999(sec))return;var b=document.createElement('button');b.className='tier';b.textContent=n+' '+(UIc||FB_UI).words;b.style.borderColor=TC[n];b.style.color=n===tier?'#fff':TC[n];b.style.background=n===tier?TC[n]:'transparent';b.onclick=function(){tier=n;render();};t.appendChild(b);});}
  function render(){var n=CT.sections.length,ti=document.getElementById('tiers');
    if(sec<n){var s=CT.sections[sec];
      document.getElementById('rtag').innerHTML='<span>'+esc((DATA&&DATA.msg)?s.tag:((UIc||FB_UI).steps[sec]||s.tag))+'</span> <span class="title">· '+esc(s.title)+'</span>';
      var body=(DATA&&DATA.msg)?(s.content[333]||s.content[tier]||''):(tier===999?(c999(sec)||s.content[333]||''):(s.content[tier]||s.content[333]||''));
      if(DATA&&DATA.fmt==='html')document.getElementById('rcontent').innerHTML=body;else document.getElementById('rcontent').textContent=body;
      ti.style.display=(DATA&&DATA.msg)?'none':'flex';}
    else{var nv=CT.nav[sec];
      document.getElementById('rtag').innerHTML='<span>'+esc((DATA&&DATA.msg)?(nv.tag||''):((UIc||FB_UI).steps[sec]||nv.tag))+'</span>';
      document.getElementById('rcontent').innerHTML='<div style="opacity:.75;font-style:italic">'+esc(nv.seven||'')+'</div><div style="margin-top:16px;color:'+COL+'">'+esc((UIc||FB_UI).sealedSection.replace('{n}',LVL))+'</div>';ti.style.display='none';}
    document.getElementById('pos').textContent=(sec+1)+' / '+((DATA&&DATA.msg)?1:7);var _pg=document.querySelector('.pager');if(_pg)_pg.style.display=(DATA&&DATA.msg)?'none':'flex';drawTiers();drawLeft();}
  document.getElementById('unlock').onclick=async function(){
    var e=document.getElementById('err');
    var a=att(),now=Date.now();
    if(a.u>now){e.textContent='Sealed against attempts. Try again in '+Math.ceil((a.u-now)/1000)+'s.';return;}
    // Accept pasted grouped codes (dashes/spaces stripped); glyphs are case-insensitive.
    var c=codeEl.value.trim().toUpperCase().replace(/[\\s-]/g,'');
    var re=new RegExp('^'+(PKG.num?'[0-9]':'[2-9A-HJ-KM-NP-Z]')+'{'+PKG.cl+'}$');
    if(!re.test(c)){e.textContent='Enter the '+PKG.cl+'-'+(PKG.num?'digit':'character')+' code.';return;}
    // On devices without native crypto the pure-JS KDF takes a couple seconds.
    e.textContent=hasSubtle?'…':'Deciphering… a moment on this device.';
    document.getElementById('unlock').disabled=true;
    try{DATA=await decrypt(c);
      // Multilingual: build the language map + selector (back-compat: single-lang payloads).
      I18N=DATA.i18n||{en:{nav:DATA.nav,sections:DATA.sections}};
      LANGS=DATA.langs||Object.keys(I18N);LNAMES=DATA.langNames||{};
      curLang=(DATA.defaultLang&&I18N[DATA.defaultLang])?DATA.defaultLang:(LANGS[0]||'en');
      CT=I18N[curLang]||I18N[Object.keys(I18N)[0]];
      UIc=(CT&&CT.ui)?CT.ui:FB_UI;
      var lsel=document.getElementById('lang');
      if(lsel&&LANGS.length>1){lsel.innerHTML='';LANGS.slice().sort().forEach(function(lc){var o=document.createElement('option');o.value=lc;o.textContent=lc.toUpperCase()+' · '+(LNAMES[lc]||lc.toUpperCase());if(lc===curLang)o.selected=true;lsel.appendChild(o);});lsel.style.display='';lsel.onchange=function(){curLang=this.value;CT=I18N[curLang]||CT;UIc=(CT&&CT.ui)?CT.ui:FB_UI;document.body.dir=RTL[curLang]?'rtl':'ltr';applyUI();render();};}
      document.body.dir=RTL[curLang]?'rtl':'ltr';
      try{localStorage.removeItem(AKEY)}catch(x){}
      e.textContent='';
      COL=DATA.color;LVL=DATA.clearance;var bd=document.getElementById('badge');bd.style.color=COL;bd.style.borderColor=COL;applyUI();
      cover.style.display='none';drawSeal(document.getElementById('sealBig'),46);document.getElementById('sealview').style.display='flex';}
    catch(err){
      // 'auth' (pure-JS) or OperationError (native) = wrong code. Anything else
      // is an environment fault — surface it so failures are never silent.
      var wrong=!err||err.message==='auth'||err.name==='OperationError';
      if(wrong){a=att();a.n++;if(a.n>=3)a.u=Date.now()+Math.min(300,10*Math.pow(2,a.n-3))*1000;setAtt(a);e.textContent='Incorrect code.';}
      else{e.textContent='Could not open on this device: '+(err.message||err.name||'error');}}
    finally{document.getElementById('unlock').disabled=false;}};
  document.getElementById('sealview').onclick=function(){this.style.display='none';reader.style.display='flex';render();};
  document.getElementById('code').addEventListener('keydown',function(ev){if(ev.key==='Enter')document.getElementById('unlock').click();});
  document.getElementById('prev').onclick=function(){if(sec>0){sec--;render();}};
  document.getElementById('next').onclick=function(){if(sec<6){sec++;render();}};
  // Close & Seal — mark all vectors, then scrub decrypted content from the DOM
  // and drop the plaintext reference so nothing readable remains in memory.
  // Re-trigger the eagle 'stamp-in' flash each time the sealed screen appears.
  function stampEagle(){var eg=document.getElementById('sealEagle');if(eg){eg.style.animation='none';void eg.offsetWidth;eg.style.animation='';}}
  function seal(){mark();try{if(window.__atlDelete)window.__atlDelete();}catch(e){}DATA=null;I18N=null;CT=null;
    try{codeEl.value='';document.getElementById('rcontent').textContent='';document.getElementById('rtag').textContent='';document.getElementById('left').innerHTML='';}catch(e){}
    reader.style.display='none';cover.style.display='none';done.style.display='flex';stampEagle();}
  document.getElementById('seal2').onclick=seal;
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'&&DATA)mark();});
  window.addEventListener('pagehide',function(){if(DATA)mark();});
  // ── Burn-on-close (PC: Chrome/Edge File System Access API) ─────────────────
  // Overwrites the original .html on disk with a dead sealed shell — the
  // ciphertext is destroyed, not just flagged. Phones + Safari/Firefox have no
  // save-picker API: the button stays hidden and the multi-vector seal governs.
  function sealedShell(){
    return '<!doctype html><html lang="en"><head><meta charset="utf-8">'
      +'<meta name="viewport" content="width=device-width,initial-scale=1"><title>\\u25EC \\u00B7 \\u2661 \\u00B7 \\uC6C3</title></head>'
      +'<body style="margin:0;background:'+PKG.color+'">'
      +'<div style="min-height:100vh;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;'
      +'background:#0a0e14;margin:16px;border-radius:8px;color:#5f7186;font:14px -apple-system,Segoe UI,Roboto,sans-serif;text-align:center;padding:24px">'
      +'<div style="font-size:26px;color:'+PKG.color+'">&#9679;</div>'
      +'<div style="letter-spacing:.12em;text-transform:uppercase;font-size:11px">This copy has been closed and cannot be reopened</div>'
      +'<div style="font-size:11px">Request a fresh copy from the sender.</div></div></body></html>';}
  // Burn (downloaded FILE only). PC Chrome/Edge: File System Access save picker
  // pre-filled with the SAME filename — choosing the original file makes the
  // browser itself ask "Replace?", and we overwrite the real bytes on disk
  // (ciphertext destroyed, not renamed around). Anchor downloads can NEVER
  // overwrite — browsers auto-rename to "name (1).html" — so other browsers
  // fall back to that with an honest hint.
  (function(){var b=document.getElementById('burn');if(location.protocol!=='file:')return;
    b.style.display='inline-block';
    b.onclick=async function(){
      var hint=document.getElementById('burnHint');
      var name=location.pathname.split('/').pop()||'Atlantis-Accords.html';
      try{name=decodeURIComponent(name)}catch(e){}
      if(window.showSaveFilePicker){
        try{
          var h=await window.showSaveFilePicker({suggestedName:name,types:[{description:'HTML document',accept:{'text/html':['.html']}}]});
          var w=await h.createWritable();await w.write(sealedShell());await w.close();
          b.textContent='Burned';b.disabled=true;
          hint.textContent='Overwritten in place — this file is now a dead shell.';
          return;
        }catch(e){
          if(e&&e.name==='AbortError'){hint.textContent='Burn canceled — the file was not changed.';return;}
          /* picker unavailable or blocked on this device -> fall back to auto-download */
        }
      }
      try{
        var blob=new Blob([sealedShell()],{type:'text/html'});var url=URL.createObjectURL(blob);
        var a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
        setTimeout(function(){URL.revokeObjectURL(url)},1500);
        b.textContent='Burned';b.disabled=true;
        hint.textContent='A sealed shell was saved to Downloads — your browser may have added "(1)" to the name. Delete the original and keep the shell to finish the burn.';
      }catch(e){}};})();
}
</script>
<script>
// Universal launcher — runs for the offline file (payload embedded) AND the
// hosted reader (payload fetched from Supabase by a short #hash). The unlock
// code is never sent; only ciphertext is stored, and it is DELETED on close/burn.
var ATL_SB_URL="__ATL_SB_URL__",ATL_SB_KEY="__ATL_SB_KEY__",ATL_HASH=null;
window.__atlDelete=function(){try{if(ATL_HASH&&ATL_SB_URL.indexOf('__')!==0){fetch(ATL_SB_URL+'/rest/v1/atlantis_seals?hash=eq.'+encodeURIComponent(ATL_HASH),{method:'DELETE',headers:{apikey:ATL_SB_KEY,Authorization:'Bearer '+ATL_SB_KEY}});}}catch(e){}};
(function(){
  function fail(m){document.body.innerHTML='<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;color:#5f7186;font:14px -apple-system,Segoe UI,sans-serif;text-align:center;padding:24px">'+m+'</div>';}
  var pk=document.getElementById('pkg');
  if(pk&&pk.textContent.trim()){__initSeal();return;} // offline file: payload embedded
  var h=(location.hash||'').replace(/^#/,'');
  if(!h){fail('This reader opens a sealed Atlantis Accords link.<br>Please open the secure link you were sent.');return;}
  if(/^[A-Za-z0-9]{4,16}$/.test(h)){
    ATL_HASH=h;
    if(ATL_SB_URL.indexOf('__')===0){fail('This sealed link needs the secure reader.<br>Open it on the eXeL AI site, or ask the sender for the file.');return;}
    fetch(ATL_SB_URL+'/rest/v1/atlantis_seals?hash=eq.'+encodeURIComponent(h)+'&select=payload',{headers:{apikey:ATL_SB_KEY,Authorization:'Bearer '+ATL_SB_KEY}})
      .then(function(r){return r.json();})
      .then(function(rows){if(!rows||!rows.length||!rows[0].payload)throw 0;document.getElementById('pkg').textContent=rows[0].payload;__initSeal();})
      .catch(function(){fail('This sealed link has expired or was already opened.<br>Ask the sender for a fresh link.');});
  }else{
    try{var s=h.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var bin=atob(s),by=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)by[i]=bin.charCodeAt(i);document.getElementById('pkg').textContent=new TextDecoder().decode(by);__initSeal();}
    catch(e){fail('This sealed link could not be read.<br>Ask the sender for a fresh link.');}
  }
})();
</script>
</body></html>`;
}
