"use client";

/**
 * ◬ ♡ 웃 — the three doors before any session (operator, 2026-09-07):
 *   ♡ Session   (top)          → the pod-of-three working session
 *   웃 Sign Doc  (bottom-right) → upload, sign with a finger, hand off — no fees
 *   ◬ Create Doc (bottom-left)  → write or template a document, then sign it
 * The Trinity mark keeps its glyph identity (Aset, round 1); the arcs name the action, the
 * centre shows the glyph, and three plain cards repeat the choice for anyone who does not
 * read a diagram. Seed membership sits below, collapsed — nothing removed (Rule 6).
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { SoITrinity } from "@/components/soi-trinity";
import { SeedMembership } from "@/components/seed-membership";
import { useLexicon } from "@/lib/lexicon-context";
import { useThemeHue } from "@/lib/theme-hue";

export const SIGN_PATH = "/soi-session/sign/";
export const CREATE_PATH = "/soi-session/create/";

export function SoiLanding({ onEnter }: { onEnter: () => void }) {
  const { t } = useLexicon();
  const router = useRouter();
  const hue = useThemeHue();
  const doors = [
    { key: "session", glyph: "♡", color: hue.bright, title: t("soi.landing.btn.session"), desc: t("soi.landing.desc.session"), go: onEnter },
    { key: "sign", glyph: "웃", color: hue.mid, title: t("soi.landing.btn.sign"), desc: t("soi.landing.desc.sign"), href: SIGN_PATH },
    { key: "create", glyph: "◬", color: hue.dim, title: t("soi.landing.btn.create"), desc: t("soi.landing.desc.create"), href: CREATE_PATH },
  ] as const;
  const onRing = (i: 0 | 1 | 2) => {
    if (i === 0) onEnter();
    else router.push(i === 1 ? SIGN_PATH : CREATE_PATH);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6 text-center">
        <div className="mb-3 font-mono text-3xl tracking-[0.3em]" aria-hidden="true">
          <span style={{ color: hue.bright }}>&#9708;</span>{" "}
          <span style={{ color: hue.bright }}>&#9825;</span>{" "}
          <span style={{ color: hue.bright }}>&#50883;</span>
        </div>
        <h1 className="text-2xl font-semibold">{t("soi.landing.title")}</h1>
      </header>

      {/* The mark as the chooser — top ♡ Session · bottom-right 웃 Sign · bottom-left ◬ Create */}
      <div className="flex flex-col items-center gap-2">
        <SoITrinity
          size={300}
          labels={[t("soi.landing.ring.session"), t("soi.landing.ring.sign"), t("soi.landing.ring.create")]}
          colors={[hue.bright, hue.mid, hue.dim]}
          color={hue.bright}
          textColor={hue.ink}
          fontSize={10}
          centerGlyphs={["♡", "웃", "◬"]}
          onRingClick={onRing}
          ringAriaLabels={[t("soi.landing.btn.session"), t("soi.landing.btn.sign"), t("soi.landing.btn.create")]}
        />
        <p className="text-xs text-muted-foreground">{t("soi.landing.choose")}</p>
      </div>

      {/* The same three doors as cards — 44 px+ targets, one line each */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {doors.map((d) => {
          const inner = (
            <>
              <div className="flex items-center gap-2">
                {d.key !== "session" && <span className="font-mono text-2xl" style={{ color: d.color }} aria-hidden="true">{d.glyph}</span>}
                <span className="text-base font-semibold">{d.title}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d.desc}</p>
            </>
          );
          const cls = "block min-h-[44px] w-full rounded-xl border p-4 text-left transition-colors hover:bg-cyan-400/5 focus:outline-none focus:ring-2 focus:ring-cyan-400";
          return "href" in d ? (
            <Link key={d.key} href={d.href} className={cls} style={{ borderColor: hue.dim }}>{inner}</Link>
          ) : (
            <button key={d.key} type="button" onClick={d.go} className={cls} style={{ borderColor: hue.dim }}>{inner}</button>
          );
        })}
      </div>

      <div className="mt-8"><SeedMembership /></div>

      <p className="mt-8 text-center text-xs text-muted-foreground">{t("soi.landing.tagline")}</p>
    </div>
  );
}
