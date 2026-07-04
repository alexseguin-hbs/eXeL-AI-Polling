"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Box } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLexicon } from "@/lib/lexicon-context";

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

// Level 2 — Prove · Value · Govern. SIM (10) at center; the ring (11–18) in
// three concern-groups: Validation (11–13), Value (14–15), Governance (16–18).
const LEVEL_2: CubeInfo[][] = [
  [
    { number: 11, name: "Replay / Metrics", status: "planned", completion: 0, description: "Deterministic replay + metric-vs-baseline comparison for Cubes 1–9. Validation group." },
    { number: 14, name: "Payments", status: "planned", completion: 0, description: "Stripe monetization tiers + cost estimation, layered on Cube 8's operational ledger. Value group." },
    { number: 16, name: "Atlantis Accords", status: "in_progress", completion: 40, description: "Governance charter — accord sections, proposed approvals (Government/Education/Innovation), target countries, 33-language viewer. Governance group." },
  ],
  [
    { number: 12, name: "Verify", status: "planned", completion: 0, description: "SHA-256 determinism proofs, checkout/checkin, CI gating. Validation group." },
    { number: 10, name: "SIM", status: "in_progress", completion: 76, description: "Simulation Orchestrator — replays and validates Cubes 1–9. Center of Level 2. 108 tests. SSSES 76/100." },
    { number: 17, name: "Blockchain", status: "planned", completion: 0, description: "Quai/QI on-chain governance proofs; AI/SI/HI token conversion to QI/USDC. Governance group." },
  ],
  [
    { number: 13, name: "Baseline Compare", status: "planned", completion: 0, description: "Simulation pass criteria — must exceed existing System, User, and Business metrics. Validation group." },
    { number: 15, name: "Tokenization", status: "planned", completion: 0, description: "SoI Trinity tokens (♡ ◬ 웃) minting + cross-chain conversion. Value group." },
    { number: 18, name: "ARX · S.I.", status: "planned", completion: 0, description: "ARX physically-backed NFT tokens anchored to Shared Intent (S.I.). Governance group." },
  ],
];

// Level 3 — Substrate primitives (X-2525). Placeholders for the portable
// 3×3×3 layer future products (robotics, drones, home design) build upon.
const LEVEL_3: CubeInfo[][] = [
  [
    { number: 19, name: "Architect-2525", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
    { number: 20, name: "Manta-2525", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
    { number: 21, name: "Drone-2525", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
  ],
  [
    { number: 22, name: "Security-2525", status: "planned", completion: 0, description: "Level 3 substrate primitive — pending placeholder." },
    { number: 23, name: "TBD", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
    { number: 24, name: "TBD", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
  ],
  [
    { number: 25, name: "TBD", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
    { number: 26, name: "TBD", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
    { number: 27, name: "TBD", status: "planned", completion: 0, description: "Level 3 substrate primitive — placeholder." },
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
      {/* Completion bar */}
      <div className="w-full h-1 rounded-full bg-muted mt-0.5">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${cube.completion}%`, backgroundColor: color }}
        />
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

      {/* Selected level — 3×3 grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {LEVELS[level - 1].flat().map((cube) => (
          <CubeCell key={cube.number} cube={cube} />
        ))}
      </div>
    </section>
  );
}
