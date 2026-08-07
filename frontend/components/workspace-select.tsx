"use client";

/**
 * WorkspaceSelect — post-login "Choose a workspace" gateway (operator design, IMG workspaceselect.html).
 * Shown AFTER Auth0 login and BEFORE the polling dashboard: the moderator picks a mode of operation.
 *   • Polling      — open → /dashboard
 *   • Innovation   — locked; tap the lock → enter the access key inline → Open Innovation (/innovation)
 *   • 3rd module   — sealed (reserved for eXeL AI)
 *
 * Faithful port of the provided static design (dark Harmattan theme, animated lock + shackle, key
 * panel, error shake). Rendered full-screen; pass `onClose` to use it as a dismissible overlay.
 *
 * The Innovation key matches the /innovation route gate (single key). On success we set the same
 * session flag the route reads (SS_KEY) so /innovation opens directly without a second prompt.
 */
import { useRef, useState } from "react";

// Must match the /innovation route gate (app/innovation/page.tsx: CODE + SS_KEY) — one key, one unlock.
const INNOVATION_CODE = "369963";
const INNOVATION_UNLOCK_KEY = "innovation-unlocked";
const ssSet = (k: string, v: string) => { try { if (typeof window !== "undefined") window.sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } };

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 30 30" fill="none" stroke="currentColor" strokeWidth="2.1" aria-hidden="true">
    <path className="wsel-shackle" d="M10 14V9.5a5 5 0 0 1 10 0V14" />
    <rect x="7" y="14" width="16" height="12" rx="3.2" />
  </svg>
);

export function WorkspaceSelect({ onClose }: { onClose?: () => void }) {
  const [innoState, setInnoState] = useState<"locked" | "open">("locked");
  const [panelOpen, setPanelOpen] = useState(false);
  const [keyVal, setKeyVal] = useState("");
  const [note, setNote] = useState("");
  const [noteBad, setNoteBad] = useState(false);
  const [shakeInno, setShakeInno] = useState(false);
  const [shakeSealed, setShakeSealed] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reject = (msg: string) => {
    setNote(msg); setNoteBad(true);
    setShakeInno(false); requestAnimationFrame(() => setShakeInno(true));
    inputRef.current?.select();
  };
  const submitKey = () => {
    setNoteBad(false);
    if (!keyVal.trim()) return reject("Enter the access key.");
    if (keyVal.trim() === INNOVATION_CODE) {
      ssSet(INNOVATION_UNLOCK_KEY, "1"); // /innovation reads this → opens without re-prompting
      setInnoState("open"); setPanelOpen(false); setNote("");
    } else {
      reject("That key doesn't match. Try again.");
    }
  };
  const toggleLock = () => {
    if (innoState === "open") return;
    setPanelOpen((p) => { const next = !p; if (next) setTimeout(() => inputRef.current?.focus(), 0); return next; });
  };
  const sealedNudge = () => { setShakeSealed(false); requestAnimationFrame(() => setShakeSealed(true)); };

  return (
    <div className="wsel-root">
      <style>{WSEL_CSS}</style>

      {onClose && (
        <button className="wsel-x" type="button" aria-label="Close" onClick={onClose}>✕</button>
      )}

      <header className="wsel-topbar">
        <div className="wsel-wordmark"><b>eXeL</b><span>AI Polling</span></div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2DF3EF" strokeWidth="1.8" aria-hidden="true">
          <path d="M12 20s-7-4.6-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.6C19 15.4 12 20 12 20z" />
        </svg>
      </header>

      <main className="wsel-main">
        <p className="wsel-eyebrow">SESSION FACILITATOR ACCESS</p>
        <h1 className="wsel-h1">Choose a workspace</h1>
        <p className="wsel-lede">Polling is open. Innovation needs its own key — tap the lock to enter it.</p>

        <ul className="wsel-modules">
          {/* 1. POLLING — open */}
          <li className="wsel-module" data-state="open">
            <div className="wsel-module-head">
              <h2 className="wsel-module-name">Polling</h2>
              <button className="wsel-lock" type="button" aria-label="Polling is unlocked" disabled><LockIcon /></button>
            </div>
            <p className="wsel-module-desc">Run live or static sessions. Responses become AI-generated themes the team votes on.</p>
            <span className="wsel-module-status">UNLOCKED</span>
            <a className="wsel-enter" href="/dashboard/">Open Polling</a>
          </li>

          {/* 2. INNOVATION — locked, inline key unlock */}
          <li className="wsel-module" data-state={innoState} data-module="innovation">
            <div className="wsel-module-head">
              <h2 className="wsel-module-name">Innovation</h2>
              <button
                className={`wsel-lock${shakeInno ? " wsel-shake" : ""}`}
                type="button"
                aria-label={innoState === "open" ? "Innovation is unlocked" : "Unlock Innovation"}
                aria-expanded={panelOpen}
                disabled={innoState === "open"}
                onClick={toggleLock}
                onAnimationEnd={() => setShakeInno(false)}
              ><LockIcon /></button>
            </div>
            <p className="wsel-module-desc">Gate progression G1–G7, stack prioritization, and the dependency constellation across the portfolio.</p>
            <span className="wsel-module-status">{innoState === "open" ? "UNLOCKED" : "LOCKED — KEY REQUIRED"}</span>

            {innoState !== "open" && panelOpen && (
              <div className="wsel-keypanel">
                <label htmlFor="wsel-innovation-key">ACCESS KEY</label>
                <div className="wsel-keyrow">
                  <input
                    id="wsel-innovation-key" ref={inputRef} type="password" inputMode="text"
                    autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder="••••••"
                    value={keyVal}
                    onChange={(e) => setKeyVal(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") submitKey(); }}
                  />
                  <button type="button" onClick={submitKey}>Unlock</button>
                </div>
                <p className={`wsel-keynote${noteBad ? " bad" : ""}`}>{note || "Enter your Innovation access key."}</p>
              </div>
            )}

            {innoState === "open" && (
              <a className="wsel-enter" href="/SoI-2525/">Open SoI-2525</a>
            )}
          </li>

          {/* 3. SEALED — reserved */}
          <li className="wsel-module" data-state="sealed">
            <div className="wsel-module-head">
              <h2 className="wsel-module-name">Solution Brainstorm</h2>
              <button
                className={`wsel-lock${shakeSealed ? " wsel-shake" : ""}`}
                type="button" aria-label="Solution Brainstorm is not available yet"
                onClick={sealedNudge} onAnimationEnd={() => setShakeSealed(false)}
              ><LockIcon /></button>
            </div>
            <p className="wsel-module-desc">Explore · Diverge · Converge — reserved for eXeL AI.</p>
            <span className="wsel-module-status">NO KEY ISSUED</span>
          </li>
        </ul>
      </main>

      <footer className="wsel-footer">
        <span className="wsel-pill">SECURITY&mdash;2525</span>
        <span className="wsel-pill"><b style={{ color: "var(--wsel-cyan)" }}>eXeL</b> AI</span>
      </footer>
    </div>
  );
}

const WSEL_CSS = `
.wsel-root{
  --wsel-bg:#03110F; --wsel-surface:#072220; --wsel-surface-2:#0A2C29; --wsel-edge:#12403C;
  --wsel-cyan:#2DF3EF; --wsel-cyan-dim:#1A8C89; --wsel-ink:#FFFFFF; --wsel-muted:#7E9895; --wsel-alert:#FF5F5F;
  --wsel-mono:ui-monospace,"SF Mono",Menlo,Consolas,monospace;
  position:fixed; inset:0; z-index:70; overflow-y:auto;
  background:radial-gradient(120% 60% at 50% 0%, #0A2E2B 0%, var(--wsel-bg) 62%) no-repeat, var(--wsel-bg);
  color:var(--wsel-ink); font-family:-apple-system,BlinkMacSystemFont,"Helvetica Neue","Segoe UI",Roboto,sans-serif;
  -webkit-font-smoothing:antialiased;
}
.wsel-root *{ box-sizing:border-box; }
.wsel-x{ position:absolute; top:12px; right:14px; z-index:2; background:transparent; border:1px solid var(--wsel-edge);
  color:var(--wsel-muted); width:36px; height:36px; border-radius:10px; cursor:pointer; font-size:15px; }
.wsel-x:hover{ border-color:var(--wsel-cyan-dim); color:var(--wsel-ink); }
.wsel-topbar{ display:flex; align-items:center; justify-content:space-between; padding:16px 18px; border-bottom:1px solid var(--wsel-edge); }
.wsel-wordmark{ font-size:21px; letter-spacing:-.01em; }
.wsel-wordmark b{ color:var(--wsel-cyan); font-weight:800; }
.wsel-wordmark span{ color:#C6D6D4; font-weight:400; margin-left:6px; }
.wsel-main{ padding:34px 18px 40px; max-width:1080px; margin:0 auto; }
.wsel-eyebrow{ font-family:var(--wsel-mono); font-size:11px; letter-spacing:.18em; color:var(--wsel-cyan-dim); margin:0 0 12px; }
.wsel-h1{ font-size:clamp(30px,8vw,44px); line-height:1.04; letter-spacing:-.028em; font-weight:800; margin:0 0 10px; text-wrap:balance; }
.wsel-lede{ color:var(--wsel-muted); font-size:15px; line-height:1.5; margin:0 0 30px; max-width:46ch; }
.wsel-modules{ list-style:none; margin:0; padding:0; display:grid; gap:14px; }
@media (min-width:780px){ .wsel-modules{ grid-template-columns:repeat(3,1fr); align-items:start; } }
.wsel-module{ position:relative; background:var(--wsel-surface); border:1px solid var(--wsel-edge); border-radius:16px; padding:20px 18px; transition:border-color .45s ease, background .45s ease, box-shadow .45s ease; }
.wsel-module[data-state="open"]{ border-color:var(--wsel-cyan); background:var(--wsel-surface-2); box-shadow:0 0 0 1px rgba(45,243,239,.18), 0 14px 44px -22px rgba(45,243,239,.7); }
.wsel-module[data-state="sealed"]{ opacity:.58; }
.wsel-module-head{ display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
.wsel-module-name{ font-size:20px; font-weight:700; letter-spacing:-.015em; margin:0; }
.wsel-module[data-state="open"] .wsel-module-name{ color:var(--wsel-cyan); }
.wsel-module-desc{ color:var(--wsel-muted); font-size:14px; line-height:1.5; margin:8px 0 0; }
.wsel-module-status{ font-family:var(--wsel-mono); font-size:11px; letter-spacing:.14em; color:var(--wsel-muted); margin:16px 0 0; display:block; }
.wsel-module[data-state="open"] .wsel-module-status{ color:var(--wsel-cyan); }
.wsel-lock{ flex:0 0 auto; width:46px; height:46px; border-radius:13px; border:1px solid var(--wsel-edge); background:transparent; color:var(--wsel-cyan-dim); cursor:pointer; display:grid; place-items:center; padding:0; transition:color .3s ease, border-color .3s ease, transform .2s ease; }
.wsel-lock:hover{ border-color:var(--wsel-cyan-dim); }
.wsel-lock:active{ transform:scale(.94); }
.wsel-lock:focus-visible{ outline:2px solid var(--wsel-cyan); outline-offset:3px; }
.wsel-module[data-state="open"] .wsel-lock{ color:var(--wsel-cyan); border-color:var(--wsel-cyan); cursor:default; }
.wsel-module[data-state="sealed"] .wsel-lock{ cursor:not-allowed; }
.wsel-shackle{ transform-origin:15px 11px; transition:transform .5s cubic-bezier(.3,1.5,.5,1); }
.wsel-module[data-state="open"] .wsel-shackle{ transform:translateY(-3px) rotate(-22deg); }
.wsel-shake{ animation:wselShake .34s ease; }
@keyframes wselShake{ 25%{ transform:translateX(-5px);} 50%{ transform:translateX(5px);} 75%{ transform:translateX(-3px);} }
.wsel-keypanel{ display:grid; gap:10px; margin-top:18px; padding-top:18px; border-top:1px dashed var(--wsel-edge); }
.wsel-keypanel label{ font-family:var(--wsel-mono); font-size:11px; letter-spacing:.14em; color:var(--wsel-muted); }
.wsel-keyrow{ display:flex; gap:8px; }
.wsel-keypanel input{ flex:1 1 auto; min-width:0; background:#041816; border:1px solid var(--wsel-edge); border-radius:11px; color:var(--wsel-ink); font-family:var(--wsel-mono); font-size:16px; letter-spacing:.12em; padding:12px 13px; }
.wsel-keypanel input:focus{ outline:none; border-color:var(--wsel-cyan); }
.wsel-keypanel button{ flex:0 0 auto; background:var(--wsel-cyan); color:#03110F; border:0; border-radius:11px; font-size:14px; font-weight:700; padding:12px 18px; cursor:pointer; }
.wsel-keynote{ font-family:var(--wsel-mono); font-size:11px; letter-spacing:.06em; color:var(--wsel-muted); margin:0; min-height:14px; }
.wsel-keynote.bad{ color:var(--wsel-alert); }
.wsel-enter{ display:inline-flex; align-items:center; gap:8px; margin-top:16px; color:#03110F; background:var(--wsel-cyan); border-radius:999px; padding:11px 20px; font-size:15px; font-weight:700; text-decoration:none; }
.wsel-enter:focus-visible{ outline:2px solid var(--wsel-ink); outline-offset:2px; }
.wsel-footer{ display:flex; align-items:center; justify-content:space-between; gap:12px; padding:22px 18px 34px; max-width:1080px; margin:0 auto; }
.wsel-pill{ font-family:var(--wsel-mono); font-size:11px; letter-spacing:.12em; color:var(--wsel-muted); border:1px solid var(--wsel-edge); border-radius:999px; padding:9px 15px; }
@media (prefers-reduced-motion:reduce){ .wsel-root *{ animation:none !important; transition:none !important; } }
`;
