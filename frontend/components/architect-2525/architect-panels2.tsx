"use client";

/**
 * ARCHITECT-2525 · SIMULATE / REVIEW / TWIN / REPLAY panels (MASTER_SPEC §12 / §10).
 * ===============================================================================
 * PRODUCT TRUTH (Block E 2/n, 2026-10-23): none of these engines has run against the canonical project. Every
 * panel reads its honest state — NOT_RUN / NOT STARTED / no record — never a fabricated PASS, approval %, live
 * twin, or recorded decision. The category lists are the FUTURE capability set (illustrative), drawn
 * dim; they assert no current result. See docs/architecture-2525/PRODUCT_TRUTH_MIGRATION.md.
 *  - SimulatePanel — the simulation catalog, each entry NOT_RUN (no result produced).
 *  - ReviewPanel   — Global Architect Network + Multi-Agent AI, both with no reviews recorded.
 *  - TwinPanel     — the 5 digital twins, each NOT STARTED (no twin exists).
 *  - ReplayPanel   — no decisions recorded for replay + Knowledge-Graph teaser (future).
 */
import { useLexicon } from "@/lib/lexicon-context";
import { SimulateOptions } from "./simulate-options";

const C = { panel: "#111826", border: "#1e2b3a", text: "#c8d6e5", dim: "#5f7186", cyan: "#19c8cf", violet: "#c084fc", gold: "#ffd400", green: "#22c55e", amber: "#f59e0b" };

// SIMULATE tab (operator 2026-10-25: "show me a mock up; simulate options" + "3 options have tests to run like
// original" + the standing rule "simulate = come up with options"). The flat 13-engine catalog is superseded by the
// 3-model alternative-design chooser: each design option runs the SAME original 13-sim battery; COMPARE ALL ranks them.
// Product-truth (NOT_RUN until run; DERIVED vs ASSUMED; estimates not quotes) lives in SimulateOptions.
export function SimulatePanel() {
  return <SimulateOptions />;
}

export function ReviewPanel() {
  // PRODUCT TRUTH: no human or AI reviews have been recorded for this project. No fabricated votes / percentages.
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="space-y-1 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>GLOBAL ARCHITECT NETWORK</div>
        <div data-expert className="text-[11px]" style={{ color: C.dim }}>NO HUMAN REVIEWS RECORDED</div>
        <div className="border-t pt-1 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>Reviews are recorded to R-CORE when a reviewer acts. None yet.</div>
      </div>
      <div className="space-y-1 rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
        <div className="text-[10px] font-bold tracking-wider" style={{ color: C.violet }}>MULTI-AGENT AI · votes + explainability</div>
        <div className="text-[11px]" style={{ color: C.dim }}>NOT_RUN · no AI review has been run</div>
        <div className="mt-1 rounded border p-2 text-[9px]" style={{ borderColor: C.border, color: C.dim }}>
          AI may calculate and recommend; it does not silently approve. No recommendation produced for this project yet.
        </div>
      </div>
    </div>
  );
}

export function TwinPanel() {
  // PRODUCT TRUTH: no digital twin exists (nothing is built). The set is the future capability, each NOT STARTED.
  const twins = [{ k: "Construction", c: C.dim }, { k: "Maintenance", c: C.dim }, { k: "Emergency", c: C.dim }, { k: "Insurance", c: C.dim }, { k: "Renovation", c: C.dim }];
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>DIGITAL TWINS <span style={{ color: C.dim }}>· Actual · NOT STARTED</span></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {twins.map((tw) => (
          <div key={tw.k} data-twin className="rounded-lg border p-3" style={{ borderColor: C.border, background: C.panel }}>
            <div className="text-[11px] font-bold" style={{ color: tw.c }}>{tw.k}</div>
            <div className="mt-1 flex items-center gap-1 text-[9px]" style={{ color: C.dim }}><span>○</span> NOT STARTED</div>
            <div className="mt-0.5 text-[9px]" style={{ color: C.dim }}>Twin</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReplayPanel() {
  const { t } = useLexicon();
  // PRODUCT TRUTH: no human decisions have been recorded on this surface, so there is nothing to replay here.
  // (The canonical R-CORE replay/reverse is proven headlessly — see the §27 completion loop — but the live
  // Design-tab edit path that writes those decisions is Block D; until it is wired, this surface has no record.)
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider" style={{ color: C.violet }}>REPLAY ENGINE <span style={{ color: C.dim }}>· NOT_RUN</span></div>
      <div data-replay className="rounded-lg border p-3 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>
        No decisions recorded for this project. Each accepted edit writes one R-CORE event group that replays here.
      </div>
      <div className="rounded-lg border p-2 text-[10px]" style={{ borderColor: C.border, color: C.dim }}>
        <span style={{ color: C.violet }}>{t("arch.panels2.knowledge_graph")}</span> — each project improves the next (reusable design learning).
      </div>
    </div>
  );
}
