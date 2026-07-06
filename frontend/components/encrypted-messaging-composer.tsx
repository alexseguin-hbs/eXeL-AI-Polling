"use client";

/**
 * Encoded Messaging (ATLANTIS-2525) — compose your own message and seal it into
 * a 4-digit HTML download OR shareable link, reusing the Atlantis Accords
 * single-layer (Level 1) engine. "Encoded" not "encrypted" by design: real
 * crypto primitives are used, but a 4-digit code + soft one-time-view is
 * best-effort exclusivity, not certified secrecy. Message type (plain / markdown
 * / html) is converted at compose time so the standalone reader stays
 * parser-free. Level 7 (Light Codex PNG keyfile 2nd factor) layers in later.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildAtlantisPackageHtml,
  buildAtlantisLink,
  generateSealCode,
  SEAL_STRENGTHS,
  CLEARANCE_COLORS,
  CLEARANCE_NAMES,
  MAX_CLEARANCE,
} from "@/lib/atlantis-package";
import { buildMessageSeal, type MessageType } from "@/lib/encrypted-message";

const ACCENT = "#eab308";

const TYPES: { id: MessageType; label: string; hint: string }[] = [
  { id: "plain", label: "Plain text", hint: "Rendered exactly as typed" },
  { id: "markdown", label: "Markdown", hint: "# headings, **bold**, lists, links → formatted" },
  { id: "html", label: "HTML", hint: "Your raw HTML is rendered as-is" },
];

export function EncryptedMessagingComposer() {
  const router = useRouter();
  const [type, setType] = useState<MessageType>("plain");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sender, setSender] = useState("");
  const [level, setLevel] = useState(1);
  const [pin, setPin] = useState(() => generateSealCode(SEAL_STRENGTHS[0]));
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState<"" | "file" | "link">("");
  const [err, setErr] = useState("");

  const validPin = /^\d{4}$/.test(pin);
  const canGen = body.trim().length > 0 && validPin;

  async function generate(mode: "file" | "link") {
    if (!canGen) return;
    setBusy(mode); setErr(""); setLink(""); setCopied(false);
    try {
      const { translations, langNames, defaultLang, opts } = buildMessageSeal(title, body, type);
      const snd = sender.trim() || "Anonymous";
      if (mode === "file") {
        const html = await buildAtlantisPackageHtml(translations, langNames, defaultLang, pin, level, snd, opts);
        const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
        const a = document.createElement("a");
        a.href = url;
        a.download = `Sealed-Message${title.trim() ? "-" + title.trim().replace(/[^a-z0-9]+/gi, "-").slice(0, 32) : ""}.html`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } else {
        const l = await buildAtlantisLink(translations, langNames, defaultLang, pin, level, snd, opts);
        setLink(l);
        try { await navigator.clipboard.writeText(l); setCopied(true); } catch { /* clipboard blocked */ }
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0d12] text-slate-200">
      <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col gap-5 px-5 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: ACCENT }}>Encoded Messaging</h1>
            <p className="text-xs text-slate-500">Compose · Encode · Send — 4-digit sealed HTML</p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-800"
            aria-label="Close"
          >✕</button>
        </div>

        {/* Clearance level — 7 Seed-of-Life colors (Level 1 RED → Level 7 VIOLET) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Clearance level</span>
          <div className="flex gap-2">
            {Array.from({ length: MAX_CLEARANCE }, (_, i) => i + 1).map((lv) => {
              const c = CLEARANCE_COLORS[lv];
              const active = level === lv;
              return (
                <button
                  key={lv}
                  onClick={() => setLevel(lv)}
                  title={`Level ${lv} · ${CLEARANCE_NAMES[lv]}`}
                  className="flex h-11 flex-1 flex-col items-center justify-center gap-1 rounded-lg border transition"
                  style={{ borderColor: active ? c : "#334155", background: active ? `${c}22` : "transparent" }}
                >
                  <span className="h-4 w-4 rounded-full" style={{ background: c, boxShadow: active ? `0 0 0 2px ${c}66` : "none" }} />
                  <span className="text-[10px]" style={{ color: active ? c : "#64748b" }}>{lv}</span>
                </button>
              );
            })}
          </div>
          <span className="text-xs" style={{ color: CLEARANCE_COLORS[level] }}>
            Clearance: Level {level} · {CLEARANCE_NAMES[level]} — {level} Seed-of-Life {level === 1 ? "circle" : "circles"}
          </span>
        </div>

        {/* Message type */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as MessageType)}
            className="rounded-lg border border-slate-700 bg-[#11151c] px-3 py-2 text-sm outline-none focus:border-amber-500"
          >
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <span className="text-xs text-slate-500">{TYPES.find((t) => t.id === type)!.hint}</span>
        </label>

        {/* Title */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Title <span className="font-normal normal-case text-slate-600">(optional)</span></span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sealed Message"
            maxLength={80}
            className="rounded-lg border border-slate-700 bg-[#11151c] px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
        </label>

        {/* Message body */}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Message</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={type === "markdown" ? "# Heading\n\nYour **message** here…" : type === "html" ? "<p>Your <b>HTML</b> message…</p>" : "Type your message…"}
            rows={9}
            className="resize-y rounded-lg border border-slate-700 bg-[#11151c] px-3 py-2 font-mono text-sm outline-none focus:border-amber-500"
          />
        </label>

        {/* Sender + PIN */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sender <span className="font-normal normal-case text-slate-600">(optional)</span></span>
            <input
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="Anonymous"
              maxLength={48}
              className="rounded-lg border border-slate-700 bg-[#11151c] px-3 py-2 text-sm outline-none focus:border-amber-500"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">4-digit PIN</span>
            <div className="flex gap-2">
              <input
                value={pin}
                inputMode="numeric"
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full rounded-lg border border-slate-700 bg-[#11151c] px-3 py-2 text-center text-lg font-bold tracking-[0.3em] outline-none focus:border-amber-500"
              />
              <button
                onClick={() => setPin(generateSealCode(SEAL_STRENGTHS[0]))}
                className="shrink-0 rounded-lg border border-slate-700 px-3 text-xs text-slate-400 hover:bg-slate-800"
                title="Randomize"
              >⟳</button>
            </div>
          </label>
        </div>

        {/* Generate */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => generate("file")}
            disabled={!canGen || busy !== ""}
            className="flex-1 rounded-lg py-3 text-sm font-bold text-black disabled:opacity-40"
            style={{ background: ACCENT }}
          >{busy === "file" ? "Sealing…" : "⤓  Generate & Download .html"}</button>
          <button
            onClick={() => generate("link")}
            disabled={!canGen || busy !== ""}
            className="flex-1 rounded-lg border py-3 text-sm font-bold disabled:opacity-40"
            style={{ borderColor: ACCENT, color: ACCENT }}
          >{busy === "link" ? "Sealing…" : "🔗  Create Shareable Link"}</button>
        </div>

        {!validPin && body.trim().length > 0 && (
          <p className="text-xs text-amber-400">Enter a 4-digit PIN (or press ⟳ to randomize).</p>
        )}
        {err && <p className="text-xs text-red-400">Couldn’t seal: {err}</p>}

        {link && (
          <div className="rounded-lg border border-slate-700 bg-[#11151c] p-3">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Shareable link {copied && <span className="text-emerald-400">· copied</span>}
            </div>
            <div className="break-all font-mono text-xs text-amber-300">{link}</div>
          </div>
        )}

        {/* Share reminder */}
        <div className="mt-auto rounded-lg border border-amber-900/40 bg-amber-950/20 p-3 text-xs leading-relaxed text-slate-400">
          <span className="text-amber-300">🔑 Give your recipient PIN <b>{pin || "····"}</b> a different way</span> than the file or
          link — a text, a call, in person. The PIN is never stored anywhere; without it the message stays sealed.
          <br />
          <span className="text-slate-500">
            This is <b>encoding</b>, not certified encryption. A 4-digit PIN keeps out casual eyes, but someone determined who has
            the file can crack it offline, and the one-time-view is best-effort. Stronger protection — Level 7 pairs the PIN with a
            Light Codex image keyfile as a second factor — is coming.
          </span>
        </div>
      </div>
    </div>
  );
}
