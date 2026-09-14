"use client";

// WS-D Revision-history control for polling results (operator 2026-09-14: "create revision history
// control as well"). Save append-only snapshots of the current themed + ranked result, scrub the
// timeline, and A↔B compare two editions — field-level diffs from the shared Vision-2525 engine.
// localStorage-backed (best-effort), so a moderator keeps a history across reloads on this device.

import { useCallback, useEffect, useMemo, useState } from "react";
import { History, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SessionThemeData } from "@/lib/types";
import {
  type PollingSnapshot, type RankRow,
  snapshotResult, appendRevision, diffSnapshots, loadRevisions, saveRevisions,
} from "@/lib/polling-revisions";

export interface PollingRevisionHistoryProps {
  sessionId: string;
  data: SessionThemeData;
  ranking?: RankRow[];
  accentColor?: string;
}

export function PollingRevisionHistory({ sessionId, data, ranking = [], accentColor = "#00E5CC" }: PollingRevisionHistoryProps) {
  const [history, setHistory] = useState<PollingSnapshot[]>([]);
  const [aIdx, setAIdx] = useState(0);
  const [bIdx, setBIdx] = useState(0);

  useEffect(() => {
    const loaded = loadRevisions(sessionId);
    setHistory(loaded);
    setAIdx(Math.max(0, loaded.length - 2));
    setBIdx(Math.max(0, loaded.length - 1));
  }, [sessionId]);

  const save = useCallback(() => {
    const snap = snapshotResult(sessionId, data, ranking);
    setHistory((prev) => {
      const next = appendRevision(prev, snap);
      if (next !== prev) {
        saveRevisions(sessionId, next);
        setAIdx(Math.max(0, next.length - 2));
        setBIdx(next.length - 1);
      }
      return next;
    });
  }, [sessionId, data, ranking]);

  const canCompare = history.length >= 2 && aIdx !== bIdx;
  const changes = useMemo(
    () => (canCompare ? diffSnapshots(history[aIdx], history[bIdx]).filter((c) => c.kind !== "carried") : []),
    [canCompare, history, aIdx, bIdx],
  );

  const unchanged = history.length > 0 && snapshotResult(sessionId, data, ranking).id === history[history.length - 1]?.id;

  return (
    <section data-testid="polling-revision-history" style={{ marginTop: 16, border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        <h3 style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "var(--foreground)", margin: 0 }}>
          <History className="h-4 w-4" /> Revision history
        </h3>
        <Button size="sm" variant="outline" onClick={save} disabled={unchanged} className="gap-1" title={unchanged ? "No changes since the last snapshot" : "Save a snapshot of the current results"}>
          <Camera className="h-4 w-4" /> {unchanged ? "Saved" : "Save snapshot"}
        </Button>
      </div>

      {history.length === 0 && (
        <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>
          No snapshots yet. Save one to start a version history of this session&apos;s themes + priorities.
        </p>
      )}

      {history.length > 0 && (
        <>
          {/* Timeline scrubber */}
          <ol style={{ listStyle: "none", display: "flex", gap: 6, flexWrap: "wrap", margin: "0 0 10px", padding: 0 }}>
            {history.map((v, i) => (
              <li key={v.id + i}>
                <button
                  type="button"
                  onClick={() => { setAIdx(bIdx); setBIdx(i); }}
                  title={v.label}
                  style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 999, cursor: "pointer",
                    border: `1px solid ${i === bIdx ? accentColor : "var(--border)"}`,
                    background: i === bIdx ? accentColor : "transparent",
                    color: i === bIdx ? "#04121a" : "var(--muted-foreground)", fontVariantNumeric: "tabular-nums",
                  }}
                >
                  v{i + 1}
                </button>
              </li>
            ))}
          </ol>

          {/* A ↔ B compare selectors */}
          {history.length >= 2 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 12, color: "var(--muted-foreground)", marginBottom: 8 }}>
              <span>Compare</span>
              <VSelect value={aIdx} onChange={setAIdx} history={history} />
              <span aria-hidden>↔</span>
              <VSelect value={bIdx} onChange={setBIdx} history={history} />
            </div>
          )}

          {/* Diff */}
          {canCompare && (
            changes.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", margin: 0 }}>No differences between these two editions.</p>
            ) : (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                {changes.map((c) => (
                  <li key={c.key} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 8, alignItems: "baseline", fontSize: 12 }}>
                    <Badge kind={c.kind as "added" | "removed" | "changed"} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 600, color: "var(--foreground)" }}>{c.key}</span>
                      <span style={{ color: "var(--muted-foreground)" }}>
                        {c.kind === "added" ? <> — {c.to}</> : c.kind === "removed" ? <> — {c.from}</> : <> — <s>{c.from}</s> → {c.to}</>}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}
        </>
      )}
    </section>
  );
}

function VSelect({ value, onChange, history }: { value: number; onChange: (n: number) => void; history: PollingSnapshot[] }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}
      style={{ fontSize: 12, padding: "2px 6px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
      {history.map((v, i) => <option key={v.id + i} value={i}>{`v${i + 1}`}</option>)}
    </select>
  );
}

function Badge({ kind }: { kind: "added" | "removed" | "changed" }) {
  const map = { added: ["#16a34a", "+"], removed: ["#e5484d", "−"], changed: ["#d97706", "~"] } as const;
  const [color, sym] = map[kind];
  return <span style={{ color, fontWeight: 700, fontVariantNumeric: "tabular-nums", width: 12, textAlign: "center" }} aria-label={kind}>{sym}</span>;
}
