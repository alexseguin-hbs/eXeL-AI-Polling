"use client";
// R-CORE · </> CODE — the third reading of the compare the panel already holds.
//
// Operator 2026-10-15, settling the shape: "how we visualize elements (as 1-27 pieces of cube) and then deep
// dive on a section of code for that revision" — and, on method, "that way we avoid rework and prevents
// unnecessary token use". So nothing here is new furniture:
//   · the cube is components/2525-core/cube-voxel-3d.tsx, moved out of the SIM unchanged (one component, two
//     consumers), with THIS revision's areas lit and the rest a dim lattice;
//   · the numbered chip strip and the plain <pre> on #080f1d, font-mono 11px with a `# path` header, are the
//     SIM's own code pane (components/cube-dev-sim.tsx:313-325 and :432-438). No syntax highlighter is
//     introduced — there is none anywhere in this repository.
//
// His answers that bind it: a piece is a DECLARED AREA of the project, fixed per project, lit where this
// revision touched it (DD-66); the deck is NOT a special case (DD-67); and the deep dive is the CHANGE that
// revision made, not a file dump (DD-68).
//
// The patch text is never bundled. The drone record's full patch text is 33,122,965 B with a single revision at
// 1,768,506 B, so it is fetched per revision from /r-core/code/<id>/<rev>.json only once a reader opens an area,
// and the cap the generator applied is carried in the payload and shown rather than hidden.
import { useEffect, useMemo, useState } from "react";
import { useLexicon } from "@/lib/lexicon-context";
import { CubeVoxel3D } from "@/components/2525-core/cube-voxel-3d";
import type { RCoreCodeRecord } from "@/lib/2525-core/revisions";

const PAL = { line: "#22363a", raised: "#132428", ink: "#e2ecec", muted: "#8fa3a6", pre: "#080f1d" };

export function RCoreCodeView({ code, id, fromRev, toRev, accent }: {
  code: RCoreCodeRecord; id: string; fromRev: number; toRev: number; accent: string;
}) {
  const { t } = useLexicon();
  // Every revision strictly after Before, up to and including After — the same window the prose diff crosses.
  const crossed = useMemo(
    () => code.revs.filter((r) => r.r > fromRev && r.r <= toRev),
    [code, fromRev, toRev],
  );

  // THE STRIP IS THE FIXED MAP (DD-66: "a fixed map of the project's own areas ... declared once, the same
  // shape every revision, with this revision's pieces lit"). An earlier cut listed only the areas the window
  // touched, re-sorted by churn — so membership, order and NUMBERING changed with every compare, the anatomy
  // could not be learned, and chip "1" was a different piece from cube label "1". Now every declared area is
  // always present, always in the registry's order, numbered to match the cube's own labels; a piece the window
  // did not touch is simply quiet.
  const pieces = useMemo(() => {
    const roll = new Map<string, { add: number; del: number; f: number; revs: number[]; truncated: boolean }>();
    for (const rev of crossed)
      for (const a of rev.a) {
        const cur = roll.get(a.k) ?? { add: 0, del: 0, f: 0, revs: [], truncated: false };
        cur.add += a.add; cur.del += a.del; cur.f = Math.max(cur.f, a.f);
        cur.revs.push(rev.r); cur.truncated = cur.truncated || a.s === "truncated";
        roll.set(a.k, cur);
      }
    // Declared areas first, in registry order; then any area the record carries that the registry does not
    // name (the catch-all), so nothing a revision changed is ever dropped from the glass.
    const declared = code.areas.map((a) => ({ k: a.k, n: a.n, c: a.c, ...(roll.get(a.k) ?? { add: 0, del: 0, f: 0, revs: [] as number[], truncated: false }) }));
    const extraKeys = [...roll.keys()].filter((k) => !code.areas.some((a) => a.k === k));
    const extras = extraKeys.map((k) => {
      const nm = crossed.flatMap((r) => r.a).find((a) => a.k === k);
      return { k, n: nm?.n ?? k, c: (nm?.c ?? []) as readonly number[], ...roll.get(k)! };
    });
    return [...declared, ...extras];
  }, [code, crossed]);

  const firstTouched = useMemo(() => Math.max(0, pieces.findIndex((p) => p.revs.length)), [pieces]);
  const [sel, setSel] = useState(0);
  useEffect(() => { setSel(firstTouched); }, [fromRev, toRev, firstTouched]);
  const active = pieces[sel]?.revs.length ? pieces[sel] : undefined;

  // THE CUBE FOLLOWS THE SELECTION — the SIM's own contract ("Pick one → the voxel lights that block",
  // cube-dev-sim). An earlier cut lit every touched area at once, so the cube was a static picture and only the
  // <pre> moved. Selecting a piece now lights that piece and leaves the rest a dim lattice.
  const lit = useMemo(() => new Set<number>(pieces[sel] ? [...pieces[sel].c] : []), [pieces, sel]);
  // blockOf colours each cell by WHICH area owns it, so the cube reads as the project's anatomy.
  const blockOf = useMemo(() => {
    const arr = new Array(27).fill(0);
    pieces.forEach((a, i) => a.c.forEach((c) => { arr[c] = i; }));
    return arr;
  }, [pieces]);
  // The cube's labels and the chips are ONE numbering.
  const codes = useMemo(() => pieces.map((a, i) => `${i + 1}·${a.k}`), [pieces]);

  // THE FAILURE MUST NAME ITSELF. An earlier cut showed one sentence — "not carried" — for four different
  // outcomes, three of which it described falsely. That matters more here than usual because of how a missing
  // file actually arrives: wrangler.jsonc sets `not_found_handling: "single-page-application"`, so a missing
  // /r-core/code/<id>/<rev>.json returns **index.html with HTTP 200**; `r.ok` is true and the JSON parse throws.
  // A file that is gone and a record that genuinely has no patch are indistinguishable unless they are told
  // apart deliberately. So: `absent` only when the payload PARSED and simply has no text for this area;
  // anything else is `error`, and says so. The generator promises five honest states; the glass must keep that.
  const [patch, setPatch] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "absent" | "error">("idle");
  // Keyed on the REVISION, not the area: one revision's payload carries every area, so switching chips inside
  // one revision must not re-fetch (and the two effects below must not fire twice for one compare).
  const rev = active ? active.revs[active.revs.length - 1] : null;
  const [bag, setBag] = useState<{ rev: number | null; areas: Record<string, string> } | null>(null);
  useEffect(() => {
    if (rev == null) { setBag(null); setPatch(null); setState("idle"); return; }
    if (bag && bag.rev === rev) return;                       // already have this revision
    let alive = true;
    setState("loading"); setPatch(null);
    fetch(`/r-core/code/${id}/${rev}.json`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((txt) => {
        const j = JSON.parse(txt);                            // throws on the SPA fallback — caught as `error`
        if (!alive) return;
        setBag({ rev, areas: (j && j.areas) || {} });
      })
      .catch(() => { if (alive) { setBag(null); setPatch(null); setState("error"); } });
    return () => { alive = false; };
  }, [rev, id, bag]);
  useEffect(() => {
    if (!active || !bag || bag.rev !== rev) return;
    const t = bag.areas[active.k];
    setPatch(typeof t === "string" ? t : null);
    setState(typeof t === "string" ? "idle" : "absent");
  }, [active, bag, rev]);

  if (!pieces.some((p) => p.revs.length))
    return <p data-rcore-code-empty style={{ fontSize: 12, color: PAL.muted, margin: 0 }}>{t("rcore.code_none")}</p>;

  return (
    <div data-rcore-code>
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* The cube captures pointers to orbit (the SIM's gesture hook sets `touch-none`). Inside a long
            scrolling panel that would swallow a vertical swipe on a phone, so vertical panning is handed back
            to the page and only horizontal drag rotates. */}
        <div style={{ flex: "0 0 auto", touchAction: "pan-y" }}>
          <CubeVoxel3D lit={lit} blockOf={blockOf} nSections={pieces.length} codes={codes} px={150} />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex flex-wrap items-center gap-1.5">
            {pieces.map((a, i) => (
              <button key={a.k} data-rcore-code-area={a.k} type="button" onClick={() => setSel(i)}
                aria-pressed={i === sel}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${i === sel ? accent : PAL.line}`, padding: "3px 8px", fontSize: 11,
                  background: i === sel ? `${accent}22` : "transparent",
                  color: i === sel ? accent : PAL.muted, opacity: a.revs.length ? 1 : 0.45,
                }}>
                <span style={{ fontFamily: "ui-monospace, monospace", fontWeight: 700 }}>{i + 1}</span>
                <span>{a.n}</span>
                {a.revs.length
                  ? <span style={{ fontFamily: "ui-monospace, monospace", opacity: 0.85 }}>+{a.add}/−{a.del}</span>
                  : <span style={{ fontFamily: "ui-monospace, monospace", opacity: 0.5 }}>·</span>}
              </button>
            ))}
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 10, color: PAL.muted, fontFamily: "ui-monospace, monospace" }}>
            {active
              ? `${active.n} · ${active.f} ${active.f === 1 ? t("rcore.code_file_one") : t("rcore.code_file_many")} · r${active.revs[active.revs.length - 1]}`
                + (active.revs.length > 1 ? ` (${active.revs.length} ${t("rcore.code_window")})` : "")
                + (active.truncated ? ` · ${t("rcore.code_capped")}` : "")
              : `${pieces[sel]?.n ?? ""} · ${t("rcore.code_quiet")}`}
          </p>
        </div>
      </div>
      <div style={{ marginTop: 8, border: `1px solid ${PAL.line}`, borderRadius: 8, background: PAL.pre, overflow: "hidden" }}>
        <pre data-rcore-code-pre
          className="overflow-auto p-3 font-mono text-[11px]"
          style={{ margin: 0, maxHeight: 320, color: PAL.ink, whiteSpace: "pre" }}>
          {!active ? t("rcore.code_quiet_pane")
            : state === "loading" ? "…"
            : state === "error" ? t("rcore.code_error")
            : patch ?? t("rcore.code_absent")}
        </pre>
      </div>
    </div>
  );
}
