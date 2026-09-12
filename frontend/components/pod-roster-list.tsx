"use client";

/**
 * The pod's recipient list — who has done what, at this step. The pattern is the signing flow's Roster
 * (components/sign/sign-flow.tsx): one line per person, name on the left, state on the right in colour, "you" on
 * your own line — the DocuSign envelope's Sent · Viewed · Completed, read in one look on a 375-px phone.
 */
export interface PodRosterRow { name: string; me: boolean; state: "done" | "turn" | "pending"; label: string }

export function PodRosterList({ rows, title, you }: { rows: PodRosterRow[]; title: string; you: string }) {
  return (
    <div className="mb-3" data-testid="pod-roster">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{title}</div>
      <ol className="mt-1 grid gap-1 text-xs">
        {rows.map((r, i) => (
          <li key={i} className="flex items-center justify-between rounded border border-border px-2 py-1" data-testid={`pod-roster-${i}`} data-state={r.state}>
            <span>{i + 1}. {r.name}{r.me && <span className="ms-1 rounded bg-primary/15 px-1 text-[10px]">{you}</span>}</span>
            <span className={r.state === "done" ? "text-green-500" : r.state === "turn" ? "text-primary" : "text-muted-foreground"}>
              {r.state === "done" ? `✓ ${r.label}` : r.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
