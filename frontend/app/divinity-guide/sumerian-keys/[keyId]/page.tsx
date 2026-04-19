import Link from "next/link";
import { notFound } from "next/navigation";
import { CUNEIFORM_KEYS, CUNEIFORM_KEY_ORDER } from "@/lib/cuneiform-keys";

export function generateStaticParams() {
  return CUNEIFORM_KEY_ORDER.map((id) => ({ keyId: id }));
}

export default function SumerianKeyPage({ params }: { params: { keyId: string } }) {
  const key = CUNEIFORM_KEYS[params.keyId];
  if (!key) notFound();

  const GOLD = "#D4AF37";
  const CYAN = "#00dcff";

  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/divinity-guide"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← The Divinity Guide
          </Link>
          <p className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
            Sumerian Key · {key.order} of 6
          </p>
        </div>
      </div>

      {/* Identity header */}
      <section className="max-w-4xl mx-auto px-6 pt-12 pb-6 text-center">
        <div className="text-5xl mb-6">{key.emoji}</div>
        <div
          className="tracking-[0.1em] mb-4 leading-none"
          style={{
            fontSize: "clamp(48px, 9vw, 84px)",
            color: GOLD,
            fontFamily: "serif",
          }}
        >
          {key.glyphs}
        </div>
        <div
          className="text-lg md:text-xl italic mb-6 tracking-wide"
          style={{ color: CYAN }}
        >
          {key.transliteration}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">{key.title}</h1>
      </section>

      {/* TABLE: Overview · 333 words · 3 paragraphs */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <p
          className="text-[10px] tracking-[0.3em] uppercase mb-4"
          style={{ color: CYAN }}
        >
          ◢ Overview · 333 Words
        </p>
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <table className="w-full">
            <tbody>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <td className="align-top py-4 px-3 w-32 md:w-40">
                  <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                    ◆ Anchor
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">Sumerian context</p>
                </td>
                <td className="py-4 px-3 text-sm leading-relaxed text-foreground/90">
                  {key.overview.anchor}
                </td>
              </tr>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <td className="align-top py-4 px-3 w-32 md:w-40">
                  <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                    ◆ Signs
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">Sign-by-sign</p>
                </td>
                <td className="py-4 px-3 text-sm leading-relaxed text-foreground/90">
                  {key.overview.signs}
                </td>
              </tr>
              <tr>
                <td className="align-top py-4 px-3 w-32 md:w-40">
                  <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD }}>
                    ◆ Synthesis
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-1">Compression</p>
                </td>
                <td className="py-4 px-3 text-sm leading-relaxed text-foreground/90">
                  {key.overview.synthesis}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* TABLE: Sign Key */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <p
          className="text-[10px] tracking-[0.3em] uppercase mb-4"
          style={{ color: CYAN }}
        >
          ◢ Sign Key
        </p>
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <table className="w-full text-sm">
            <thead style={{ background: "rgba(0, 220, 255, 0.06)" }}>
              <tr>
                <th className="text-left py-3 px-3 text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: CYAN }}>Sign</th>
                <th className="text-left py-3 px-3 text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: CYAN }}>Sound</th>
                <th className="text-left py-3 px-3 text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: CYAN }}>Literal</th>
                <th className="text-left py-3 px-3 text-[10px] tracking-[0.2em] uppercase font-bold" style={{ color: CYAN }}>Symbolic</th>
              </tr>
            </thead>
            <tbody>
              {key.signs.map((s, i) => (
                <tr
                  key={i}
                  className={i < key.signs.length - 1 ? "border-b" : ""}
                  style={{ borderColor: "rgba(255,255,255,0.06)" }}
                >
                  <td className="py-3 px-3 text-3xl align-middle" style={{ color: GOLD, fontFamily: "serif" }}>
                    {s.glyph}{" "}
                  </td>
                  <td className="py-3 px-3 italic align-middle" style={{ color: CYAN }}>
                    {s.sound}
                  </td>
                  <td className="py-3 px-3 align-middle">{s.literal}</td>
                  <td className="py-3 px-3 align-middle text-muted-foreground">{s.symbolic}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* SEAL: Synthesis line */}
      <section className="max-w-3xl mx-auto px-6 py-10 text-center">
        <div
          className="inline-block px-8 py-6 rounded-xl"
          style={{
            border: `2px solid ${GOLD}`,
            background: "rgba(212, 175, 55, 0.06)",
            boxShadow: "0 0 24px rgba(212, 175, 55, 0.15)",
          }}
        >
          <p className="text-xl md:text-2xl italic" style={{ color: GOLD }}>
            ✦&nbsp;&nbsp;{key.seal}&nbsp;&nbsp;✦
          </p>
        </div>
      </section>

      {/* TABLE: Badge + Unlock */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <p
          className="text-[10px] tracking-[0.3em] uppercase mb-4"
          style={{ color: CYAN }}
        >
          ◢ Badge &amp; Unlock
        </p>
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: "rgba(255,255,255,0.1)" }}
        >
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <td className="py-4 px-4 w-32 md:w-40 text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD }}>◆ Badge</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" style={{ color: GOLD }}>{key.badge.icon}</span>
                    <div>
                      <p className="font-bold tracking-wider">{key.badge.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Awarded tablet · sealed until unlocked</p>
                    </div>
                  </div>
                </td>
              </tr>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                <td className="py-4 px-4 w-32 md:w-40 text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD }}>◆ Token</td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl" style={{ color: GOLD, fontFamily: "serif" }}>{key.badge.tokenGlyph} </span>
                    <p className="text-sm text-muted-foreground">Minted into the reader's wallet upon unlock.</p>
                  </div>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4 w-32 md:w-40 text-[10px] tracking-[0.2em] uppercase" style={{ color: GOLD }}>◆ Unlock</td>
                <td className="py-4 px-4 text-sm">
                  <p>
                    <span className="font-bold">{key.unlock.readingMinutes} minutes</span> cumulative reading ·{" "}
                    <span className="font-bold">{key.unlock.dailyVisits} distinct days</span>
                  </p>
                  {key.unlock.note && (
                    <p className="text-[11px] italic text-muted-foreground mt-1">{key.unlock.note}</p>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Navigation */}
      <section className="max-w-3xl mx-auto px-6 py-10 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between">
          <Link
            href="/divinity-guide"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to the Guide
          </Link>
          <p className="text-[11px] italic text-muted-foreground text-right">
            Next Sumerian Key reveals once this one is earned&nbsp;→
          </p>
        </div>
      </section>
    </main>
  );
}
