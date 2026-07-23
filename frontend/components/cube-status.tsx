"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";
import { cubeFingerprint, progressSegments } from "@/lib/voxel-fingerprint";

type CubeStatus = "deployed" | "in_progress" | "not_started" | "planned";

interface CubeInfo {
  number: number;
  name: string;
  status: CubeStatus;
  completion: number;
  description: string;
}

const STATUS_COLORS: Record<CubeStatus, string> = {
  deployed: "#22C55E",
  in_progress: "#F59E0B",
  not_started: "#EF4444",
  planned: "#3B82F6",
};

const STATUS_LABELS: Record<CubeStatus, string> = {
  deployed: "Deployed",
  in_progress: "In Progress",
  not_started: "Not Started",
  planned: "Planned",
};

// 3x3 grid layout matching the cube architecture diagram
// Row 0: 9, 2, 3
// Row 1: 8, 1, 4
// Row 2: 7, 6, 5
const CUBE_GRID: CubeInfo[][] = [
  [
    { number: 9, name: "Reports", status: "in_progress", completion: 76, description: "CSV/PDF export, CQS dashboard, response_summaries table live in Supabase, 84 tests. SSSES 76/100" },
    { number: 2, name: "Text", status: "deployed", completion: 98, description: "Text submission, PII/profanity, anonymization, integrity hash, Phase A retry + broadcast. SSSES 91/100" },
    { number: 3, name: "Voice", status: "deployed", completion: 89, description: "4 batch STT providers, circuit breaker failover, cost tracking, PII gate enforcement, DRY language base. SSSES 89/100" },
  ],
  [
    { number: 8, name: "Tokens", status: "deployed", completion: 82, description: "Stripe LIVE (4 flows), token_ledger + payment_transactions in Supabase, 59-jurisdiction precision, 106 tests. SSSES 82/100" },
    { number: 1, name: "Session", status: "deployed", completion: 100, description: "Session CRUD, state machine, QR, join flow, capacity tiers, RBAC. SSSES 100/100" },
    { number: 4, name: "Collector", status: "deployed", completion: 88, description: "Web_Results aggregation, SHA-256 anon hash, desired outcomes (CRS-10), session validation on all endpoints, single-query optimization. SSSES 88/100" },
  ],
  [
    { number: 7, name: "Ranking", status: "deployed", completion: 93, description: "DnD + tap ranking, deterministic Borda aggregation, rankings table in Supabase, mathematical proofs, 140 tests. SSSES 93/100" },
    { number: 6, name: "AI", status: "deployed", completion: 82, description: "Phase A live summarization, Phase B parallel theming (50-cap), CQS scoring engine, 4 providers, cost tracking, XSS sanitization. SSSES 82/100" },
    { number: 5, name: "Gateway", status: "deployed", completion: 89, description: "Time tracking, token calc, pipeline orchestrator, 5-min timeout, Cube 6→7 auto-chain. SSSES 89/100" },
  ],
];

// Level 2 — Prove · Value · Govern. SIM (10) at center; ring 11–18 spirals
// clockwise from top (top → top-right → right → … → top-left), matching the
// Level 1 / Level 3 numbering convention. The three concern-groups fall on
// contiguous arcs: Validation 11–13 (top→right), Value 14–15 (bottom),
// Governance 16–18 (bottom-left→top-left).
const LEVEL_2: CubeInfo[][] = [
  [
    { number: 18, name: "ARX · S.I.", status: "planned", completion: 0, description: "ARX physically-backed NFT tokens anchored to Shared Intent (S.I.). Governance group." },
    { number: 11, name: "Replay / Metrics", status: "planned", completion: 0, description: "Deterministic replay + metric-vs-baseline comparison for Cubes 1–9. Validation group." },
    { number: 12, name: "Verify", status: "planned", completion: 0, description: "SHA-256 determinism proofs, checkout/checkin, CI gating. Validation group." },
  ],
  [
    { number: 17, name: "Blockchain", status: "planned", completion: 0, description: "Quai/QI on-chain governance proofs; AI/SI/HI token conversion to QI/USDC. Governance group." },
    { number: 10, name: "Simulation", status: "in_progress", completion: 76, description: "Simulation Orchestrator — replays and validates Cubes 1–9. Center of Level 2. 108 tests. SSSES 76/100." },
    { number: 13, name: "Baseline Compare", status: "planned", completion: 0, description: "Simulation pass criteria — must exceed existing System, User, and Business metrics. Validation group." },
  ],
  [
    { number: 16, name: "Atlantis Accords", status: "in_progress", completion: 40, description: "Governance charter — accord sections, proposed approvals (Government/Education/Innovation), target countries, 33-language viewer. Governance group." },
    { number: 15, name: "Tokenization", status: "planned", completion: 0, description: "SoI Trinity tokens (♡ ◬ 웃) minting + cross-chain conversion. Value group." },
    { number: 14, name: "Payments", status: "planned", completion: 0, description: "Stripe monetization tiers + cost estimation, layered on Cube 8's operational ledger. Value group." },
  ],
];

// Level 3 — Vision 2525 innovation substrate (Cubes 19–27), Cube 19 at center.
// Canonical names + layout from docs/CUBE_19_27_LEVEL_3_FRAMEWORK.md. Domains
// (Architect-2525 / Manta-2525 / Drone-2525) plug in as Domain Play configs;
// the 9 cubes are the substrate and never fork per domain.
const LEVEL_3: CubeInfo[][] = [
  [
    { number: 27, name: "Delivery & Actuals", status: "planned", completion: 0, description: "Actuals vs quote delta; feeds the Cube 24 world model. Vision 2525 substrate." },
    { number: 20, name: "Concept Ingest", status: "planned", completion: 0, description: "Concept intake + Spec Slug validation per Domain Play. Vision 2525 substrate." },
    { number: 21, name: "Model Ingest", status: "planned", completion: 0, description: "CAD / Python edge / 3D model intake; validates on baseline HAL. Vision 2525 substrate." },
  ],
  [
    { number: 26, name: "Execution Marketplace", status: "planned", completion: 0, description: "Trust-weighted, multi-country contractors; routes execution by HAL profile. Vision 2525 substrate." },
    { number: 19, name: "Innovation Life Cycle", status: "planned", completion: 0, description: "CENTER — project life cycle across the 9 Level-3 cubes; Domain Play reference. Vision 2525 substrate." },
    { number: 22, name: "Proposal Collector", status: "planned", completion: 0, description: "Reviews/proposals (distinct from L1 votes); feeds Cube 25. Vision 2525 substrate." },
  ],
  [
    { number: 25, name: "Governance & Quote Board", status: "planned", completion: 0, description: "Quote-lock bound to the Principle Compliance Manifest; ≥1 human signer. Vision 2525 substrate." },
    { number: 24, name: "Estimator AI", status: "planned", completion: 0, description: "Cost / timeline / domain-declared axes; Monte Carlo P10/P50/P90. Vision 2525 substrate." },
    { number: 23, name: "De-Risk Gateway", status: "planned", completion: 0, description: "Phased polling gates — Pilot→Refine→Qualify→Adopt; Risk Register. Vision 2525 substrate." },
  ],
];

// One level visible at a time.
const LEVELS: CubeInfo[][][] = [CUBE_GRID, LEVEL_2, LEVEL_3];

function CubeCell({ cube }: { cube: CubeInfo }) {
  const [expanded, setExpanded] = useState(false);
  const color = STATUS_COLORS[cube.status];

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="relative flex flex-col items-center gap-1 rounded-lg border border-border p-2 transition-colors hover:bg-accent/50 text-left w-full"
    >
      {/* Status dot */}
      <span
        className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {/* Cube number */}
      <span className="text-lg font-bold" style={{ color }}>
        {cube.number}
      </span>
      {/* Name */}
      <span className="text-[10px] font-medium text-foreground leading-tight text-center">
        {cube.name}
      </span>
      {/* Deterministic 3×3 identity fingerprint — unique per cube (§5) */}
      <div className="grid grid-cols-3 gap-[1.5px] my-0.5" aria-hidden data-cube-fingerprint={cube.number}>
        {cubeFingerprint(cube.number).map((on, i) => (
          <span
            key={i}
            className="h-[3px] w-[3px] rounded-[1px]"
            style={{ backgroundColor: on ? color : "var(--muted)", opacity: on ? 1 : 0.35 }}
          />
        ))}
      </div>
      {/* 4-section completion (Overview·Inputs·Functions·Outputs) */}
      <div className="flex w-full gap-0.5 mt-0.5" title={`${cube.completion}%`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-1 flex-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: i < progressSegments(cube.completion, 4) ? "100%" : "0%",
                backgroundColor: color,
              }}
            />
          </div>
        ))}
      </div>
      {/* Expanded details */}
      {expanded && (
        <div className="w-full mt-1 pt-1 border-t border-border">
          <p className="text-[9px] text-muted-foreground leading-tight">
            {cube.description}
          </p>
          <p className="text-[9px] mt-0.5" style={{ color }}>
            {STATUS_LABELS[cube.status]} — {cube.completion}%
          </p>
        </div>
      )}
    </button>
  );
}

export function CubeArchitectureStatus() {
  const [expanded, setExpanded] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const { t } = useLexicon();

  // Count deployed cubes for collapsed summary (across all three levels)
  const allCubes = LEVELS.flat(2);
  const deployedCount = allCubes.filter((c) => c.status === "deployed").length;
  const inProgressCount = allCubes.filter((c) => c.status === "in_progress").length;

  if (!expanded) {
    return (
      <section>
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-2">
            <Box className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{t("cube1.settings.cube_architecture")}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {deployedCount} {t("cube1.settings.deployed").toLowerCase()}, {inProgressCount} {t("cube1.settings.in_progress_status").toLowerCase()}
          </span>
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Box className="h-4 w-4" />
          {t("cube1.settings.cube_architecture")}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            {showLegend ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {t("cube1.settings.legend")}
          </button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setExpanded(false)}
          >
            {t("cube1.settings.collapse")}
          </Button>
        </div>
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-3 text-xs">
          {(Object.entries(STATUS_COLORS) as [CubeStatus, string][]).map(([key, color]) => (
            <span key={key} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              {STATUS_LABELS[key]}
            </span>
          ))}
        </div>
      )}

      {/* Level switcher — one level visible at a time */}
      <div className="flex gap-1.5">
        {([1, 2, 3] as const).map((lv) => (
          <button
            key={lv}
            onClick={() => setLevel(lv)}
            className={`px-3 py-1 text-[11px] rounded-full transition-all ${
              level === lv
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {t(`cube1.settings.level${lv}`)}
          </button>
        ))}
      </div>

      {/* Caption for the current level */}
      <p className="text-[10px] text-muted-foreground -mt-1">
        {t(`cube1.settings.level${level}_caption`)}
      </p>

      {/* Selected level — 3×3 grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {LEVELS[level - 1].flat().map((cube) => (
          <CubeCell key={cube.number} cube={cube} />
        ))}
      </div>
    </section>
  );
}
