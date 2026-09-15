"use client";

// SI — SHARED INTENT, the key-group consensus surface. PLACEHOLDER (operator 2026-09-15).
//
// "SI will be on or off and QR / link sent to key members only for volunteer with rewards of input of SI TOKENS."
//
// WHAT THIS SCREEN IS CAREFUL ABOUT. It shows a consensus forming next to a decision a person is about to
// make, and it must never read as the decision itself. So the tally is worded as advice throughout, the
// approve and hold controls that actually fire live in the round above and not here, and the panel says in
// one sentence that the group advises and a person decides.
//
// THE QR IS THE ONE FILLED THING ON THIS SURFACE, deliberately. A scannable code is a pattern of filled
// squares; there is no edges-only QR. It sits in this panel rather than in the arena, so the vector law
// that governs the drawing is untouched — the arena is still black ground and strokes only.
import { useCallback, useMemo, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { semanticHex } from "@/lib/wire-core/palette";
import { MONO, HUD, btn } from "./ui";
import { QrBlock } from "./qr-block";
import { heartsForRung } from "@/lib/pod-clock";
import {
  initSi, setSiOn, invite, uninvite, issueInvite, inviteLive, openCallOf, castVote, tally,
  owed, owedTotal, ledgerLines, SI_CHOICES, SI_GLYPH, QUORUM_FRACTION, SI_SEAMS,
  type SiState, type SiChoice,
} from "@/lib/drone-2525/si-pod";

/** A key group has to start as somebody. These four are examples and the panel says so. */
const SEED_ROSTER = [
  { id: "m1", name: "Ada", role: "pilot" },
  { id: "m2", name: "Bo", role: "targeteer" },
  { id: "m3", name: "Cass", role: "watch" },
  { id: "m4", name: "Dev", role: "range safety" },
];

export function SiPanel({ si, setSi, nowMs }: { si: SiState; setSi: (f: (s: SiState) => SiState) => void; nowMs: number }) {
  const { t } = useLexicon();
  const [showQr, setShowQr] = useState(false);
  const [asMember, setAsMember] = useState("m1");
  const call = useMemo(() => openCallOf(si, nowMs), [si, nowMs]);
  const tal = useMemo(() => (call ? tally(si, call, nowMs) : null), [si, call, nowMs]);
  const live = inviteLive(si, nowMs);

  const origin = typeof window === "undefined" ? "https://exel-ai-polling.explore-096.workers.dev" : window.location.origin;
  const seedRoster = useCallback(() => {
    setSi((s) => SEED_ROSTER.reduce((acc, m) => invite(acc, m, nowMs), s));
  }, [setSi, nowMs]);


  return (
    <section data-drone-si style={{ padding: "0 14px 22px", maxWidth: 900 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
        <span style={{ ...MONO, color: semanticHex("tagged") }}>{SI_GLYPH} {t("si.title")}</span>
        <button data-si-toggle onClick={() => setSi((s) => setSiOn(s, !s.on, nowMs))}
                style={btn({ on: si.on, hex: semanticHex("tree") })}>
          {si.on ? t("si.on") : t("si.off")}
        </button>
        <span style={{ ...MONO, color: HUD, opacity: 0.5 }}>{t("si.placeholder")}</span>
      </div>
      <p style={{ ...MONO, color: HUD, opacity: 0.6, lineHeight: 1.7, margin: "0 0 10px", maxWidth: "62ch" }}>
        {t("si.lead")}
      </p>
      <p style={{ ...MONO, color: semanticHex("pending"), opacity: 0.85, margin: "0 0 12px" }}>{t("si.authority")}</p>

      {si.on ? (
        <>
          {/* THE KEY GROUP — closed, named, and nobody arrives by accident. */}
          <div style={{ ...MONO, color: semanticHex("door"), marginBottom: 4 }}>{t("si.group")} · {si.roster.length}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {si.roster.map((m) => (
              <span key={m.id} data-si-member={m.id}
                    style={{ ...MONO, color: HUD, border: `1px solid ${semanticHex("contour")}`, padding: "3px 7px" }}>
                {m.name} · {m.role}
                {owed(si, m.id) ? <b style={{ color: semanticHex("tagged"), marginLeft: 6 }}>{owed(si, m.id)}{SI_GLYPH}</b> : null}
                <button onClick={() => setSi((s) => uninvite(s, m.id))} aria-label={`${t("si.remove")} ${m.name}`}
                        style={{ background: "none", border: "none", color: semanticHex("blocked"), cursor: "pointer", marginLeft: 6, padding: 0 }}>×</button>
              </span>
            ))}
            {si.roster.length === 0 ? (
              <button data-si-seed onClick={seedRoster} style={btn({ hex: semanticHex("door") })}>{t("si.add_examples")}</button>
            ) : null}
          </div>

          {/* THE INVITATION — key members only. An empty roster gets no link at all. */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 10 }}>
            <button data-si-invite onClick={() => setSi((s) => issueInvite(s, origin, "drone-2525", nowMs))}
                    disabled={!si.roster.length} style={btn({ hex: semanticHex("frustum"), enabled: Boolean(si.roster.length) })}>
              {t("si.issue")}
            </button>
            {si.invite ? (
              <>
                <span data-si-code style={{ ...MONO, color: semanticHex("mount"), fontSize: "clamp(12px, 3.4vw, 16px)", letterSpacing: "0.3em" }}>
                  {si.invite.code}
                </span>
                <span style={{ ...MONO, color: live ? semanticHex("tree") : semanticHex("blocked") }}>
                  {live ? `${t("si.expires")} ${Math.ceil((si.invite.expiresAtMs - nowMs) / 60000)} ${t("si.minutes")}` : t("si.expired")}
                </span>
                <button data-si-qr onClick={() => setShowQr((v) => !v)} style={btn({ on: showQr, hex: semanticHex("door") })}>
                  {showQr ? t("si.hide_qr") : t("si.show_qr")}
                </button>
                <button data-si-copy onClick={() => { void navigator.clipboard?.writeText(si.invite!.url); }}
                        style={btn({ hex: semanticHex("contour") })}>{t("si.copy")}</button>
              </>
            ) : null}
          </div>
          {si.invite && showQr ? (
            <QrBlock url={si.invite.url} size={168} note={`${t("si.only_these")} ${si.invite.to.length}`} />
          ) : null}

          {/* THE CALL — what the group is being asked, right now, with the clock on it. */}
          {call && tal ? (
            <div data-si-call style={{ border: `1px solid ${semanticHex("door")}`, padding: 12, marginBottom: 10 }}>
              <div style={{ ...MONO, color: semanticHex("door"), marginBottom: 6 }}>
                {call.question} · {tal.secondsLeft}s
              </div>
              <div data-si-tally style={{ ...MONO, color: tal.quorum ? semanticHex("tagged") : HUD, opacity: tal.quorum ? 1 : 0.7, marginBottom: 8 }}>
                {tal.line}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <select value={asMember} onChange={(e) => setAsMember(e.target.value)} data-si-as
                        style={{ ...btn({ on: true, hex: semanticHex("contour") }), minWidth: 110 }}>
                  {si.roster.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {SI_CHOICES.map((c) => (
                  <button key={c} data-si-vote={c} onClick={() => setSi((s) => castVote(s, call.id, asMember, c as SiChoice, nowMs))}
                          style={btn({ hex: c === "hold" ? semanticHex("ray") : c === "approve" ? semanticHex("tree") : semanticHex("contour") })}>
                    {t(`si.choice.${c}`)}
                  </button>
                ))}
              </div>
              <div style={{ ...MONO, color: HUD, opacity: 0.5, marginTop: 6 }}>{t("si.volunteer")}</div>
            </div>
          ) : (
            <div style={{ ...MONO, color: HUD, opacity: 0.5, marginBottom: 10 }}>{t("si.no_call")}</div>
          )}

          {/* WHAT IT EARNED — recognition on the ladder that already exists, not a balance. */}
          {si.ledger.length ? (
            <details data-si-ledger>
              <summary style={{ ...MONO, color: semanticHex("tagged"), cursor: "pointer" }}>
                {t("si.recognised")} {owedTotal(si)} {SI_GLYPH} · {si.ledger.length}
              </summary>
              <pre style={{ ...MONO, color: HUD, opacity: 0.65, whiteSpace: "pre-wrap", margin: "6px 0 0" }}>
                {ledgerLines(si).slice(-10).join("\n")}
              </pre>
              <div style={{ ...MONO, color: HUD, opacity: 0.5, marginTop: 6, maxWidth: "62ch", lineHeight: 1.7 }}>
                {t("si.ladder")} {heartsForRung("noted")}{SI_GLYPH} · {heartsForRung("adopted")}{SI_GLYPH} · {heartsForRung("foundational")}{SI_GLYPH}. {t("si.not_a_balance")}
              </div>
            </details>
          ) : null}

          {/* WHAT THIS PLACEHOLDER IS NOT — said plainly, with the seam that closes each gap. */}
          <details data-si-seams style={{ marginTop: 10 }}>
            <summary style={{ ...MONO, color: HUD, opacity: 0.6, cursor: "pointer" }}>{t("si.not_yet")}</summary>
            <ul style={{ ...MONO, color: HUD, opacity: 0.6, lineHeight: 1.8, margin: "6px 0 0", paddingLeft: 18 }}>
              {SI_SEAMS.map((s) => <li key={s.missing}>{s.missing} <span style={{ opacity: 0.7 }}>{s.then}</span></li>)}
            </ul>
          </details>
        </>
      ) : (
        <div style={{ ...MONO, color: HUD, opacity: 0.5 }}>{t("si.when_off")}</div>
      )}
      <div style={{ ...MONO, color: HUD, opacity: 0.35, marginTop: 8 }}>{t("si.quorum_note")} {QUORUM_FRACTION * 100}%</div>
    </section>
  );
}

export { initSi };
