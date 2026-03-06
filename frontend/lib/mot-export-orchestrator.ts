/**
 * MoT Export Orchestrator — QR Results → Web_Results CSV
 *
 * Three sequential agents:
 *   1. Harvest Agent — Fetches responses from local + KV via existing API
 *   2. Anonymize Agent — Sorts by time, maps User_NNNN + language names
 *   3. Export Agent — Formats CSV, triggers browser download
 */

import { api } from "./api";
import { SUPPORTED_LANGUAGES } from "./constants";

// ── Types ────────────────────────────────────────────────────────

export interface MoTExportProgress {
  agent: "harvest" | "anonymize" | "export";
  agentLabel: string;
  status: "running" | "done" | "error";
  detail: string;
  responseCount?: number;
}

export type MoTProgressCallback = (progress: MoTExportProgress) => void;

interface HarvestedResponse {
  id: string;
  session_id: string;
  clean_text: string;
  submitted_at: string;
  participant_id: string;
  language_code: string;
  summary_333?: string;
  summary_111?: string;
  summary_33?: string;
}

interface AnonymizedRow {
  q_number: string;
  question: string;
  user: string;
  detailed_results: string;
  response_language: string;
  summary_333: string;
  summary_111: string;
  summary_33: string;
}

interface ExportResult {
  success: boolean;
  rowCount: number;
  filename: string;
}

// ── Language Lookup ──────────────────────────────────────────────

const LANGUAGE_MAP = new Map<string, string>(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l.name])
);

function resolveLanguageName(code: string): string {
  return LANGUAGE_MAP.get(code) || code;
}

// ── Agent 1: Harvest ─────────────────────────────────────────────

async function harvestAgent(
  sessionId: string,
  onProgress?: MoTProgressCallback
): Promise<HarvestedResponse[]> {
  onProgress?.({
    agent: "harvest",
    agentLabel: "Collecting",
    status: "running",
    detail: "Fetching responses from local + cross-device storage...",
  });

  const data = await api.get<{ items: HarvestedResponse[]; total: number }>(
    `/sessions/${sessionId}/responses`
  );

  const items = data.items || [];

  onProgress?.({
    agent: "harvest",
    agentLabel: "Collecting",
    status: "done",
    detail: `Harvested ${items.length} responses`,
    responseCount: items.length,
  });

  return items;
}

// ── Agent 2: Anonymize ───────────────────────────────────────────

function anonymizeAgent(
  responses: HarvestedResponse[],
  questionText: string,
  onProgress?: MoTProgressCallback
): AnonymizedRow[] {
  onProgress?.({
    agent: "anonymize",
    agentLabel: "Anonymizing",
    status: "running",
    detail: `Sorting ${responses.length} responses by submission time...`,
  });

  // Sort by submission time (earliest first)
  const sorted = [...responses].sort(
    (a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
  );

  // Map participant_id → sequential User_NNNN (first appearance order)
  const userMap = new Map<string, string>();
  let userCounter = 0;

  const rows: AnonymizedRow[] = sorted.map((r, i) => {
    if (!userMap.has(r.participant_id)) {
      userCounter++;
      userMap.set(r.participant_id, `User_${String(userCounter).padStart(4, "0")}`);
    }

    return {
      q_number: `Q-${String(i + 1).padStart(4, "0")}`,
      question: questionText,
      user: userMap.get(r.participant_id)!,
      detailed_results: r.clean_text,
      response_language: resolveLanguageName(r.language_code),
      summary_333: r.summary_333 || r.clean_text,
      summary_111: r.summary_111 || r.clean_text,
      summary_33: r.summary_33 || r.clean_text,
    };
  });

  onProgress?.({
    agent: "anonymize",
    agentLabel: "Anonymizing",
    status: "done",
    detail: `Anonymized ${rows.length} rows (${userMap.size} unique users)`,
    responseCount: rows.length,
  });

  return rows;
}

// ── Agent 3: Export ──────────────────────────────────────────────

function exportAgent(
  rows: AnonymizedRow[],
  sessionTitle: string,
  shortCode: string,
  onProgress?: MoTProgressCallback
): { filename: string } {
  onProgress?.({
    agent: "export",
    agentLabel: "Exporting",
    status: "running",
    detail: `Formatting ${rows.length} rows as CSV...`,
  });

  // CSV header — includes Cube 6 Phase A summary cascade columns
  const header = "Q_Number,Question,User,Detailed_Results,Response_Language,Summary_333,Summary_111,Summary_33";

  // Escape CSV field: wrap in quotes, double any internal quotes
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;

  const csvLines = rows.map(
    (r) =>
      `${esc(r.q_number)},${esc(r.question)},${esc(r.user)},${esc(r.detailed_results)},${esc(r.response_language)},${esc(r.summary_333)},${esc(r.summary_111)},${esc(r.summary_33)}`
  );

  const csv = [header, ...csvLines].join("\n");

  // UTF-8 BOM + content
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  // Sanitize title for filename
  const sanitized = sessionTitle
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `${sanitized}_${shortCode}_${timestamp}.csv`;

  // Trigger browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  onProgress?.({
    agent: "export",
    agentLabel: "Exporting",
    status: "done",
    detail: `Downloaded ${filename}`,
    responseCount: rows.length,
  });

  return { filename };
}

// ── MoT Orchestrator Entry Point ─────────────────────────────────

export async function runMoTExport(
  sessionId: string,
  sessionTitle: string,
  shortCode: string,
  questionText: string,
  onProgress?: MoTProgressCallback
): Promise<ExportResult> {
  try {
    // Agent 1: Harvest
    const responses = await harvestAgent(sessionId, onProgress);

    if (responses.length === 0) {
      onProgress?.({
        agent: "harvest",
        agentLabel: "Collecting",
        status: "error",
        detail: "No responses found",
        responseCount: 0,
      });
      return { success: false, rowCount: 0, filename: "" };
    }

    // Agent 2: Anonymize
    const rows = anonymizeAgent(responses, questionText, onProgress);

    // Agent 3: Export
    const { filename } = exportAgent(rows, sessionTitle, shortCode, onProgress);

    return { success: true, rowCount: rows.length, filename };
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Export failed";
    onProgress?.({
      agent: "export",
      agentLabel: "Exporting",
      status: "error",
      detail,
    });
    return { success: false, rowCount: 0, filename: "" };
  }
}
