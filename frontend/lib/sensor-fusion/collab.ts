/**
 * SensorFusion-2525 collaborative persistence contracts.
 * Pure helpers for PNG↔XML association, team progress, per-project settings,
 * independent Level-2 reviewer authorization, and append-only correction provenance.
 * Supabase writes are gated: missing auth is a hard failure, never a local-cache "success".
 */
import { pngSet, pictureStem } from "./frames";
import { sameMember, type WorkClock, type WorkBox, emptyClock } from "./workflow";

export type AuthGate =
  | { ok: true; owner: string }
  | { ok: false; note: string };

/** Fail honestly when the signed-in Supabase member session is missing. */
export function requireMemberSession(session: { user?: { id?: string | null } | null } | null | undefined): AuthGate {
  const owner = session?.user?.id?.trim() || "";
  if (!owner) {
    return {
      ok: false,
      note: "Sign in as a member of the sensor-fusion project. Local device copies stayed on this device; nothing was marked saved to the team project.",
    };
  }
  return { ok: true, owner };
}

/** A picture and its XML share one stem. Device moves keep that pairing. */
export type MediaPair = {
  stem: string;
  png: string;
  xml: string;
  sourceDevice?: string;
  renamedFrom?: string;
};

export function associatePngXml(fileName: string, opts?: { sourceDevice?: string; renamedFrom?: string }): MediaPair {
  const set = pngSet(fileName);
  return {
    stem: pictureStem(fileName),
    png: set.png,
    xml: set.xml,
    sourceDevice: opts?.sourceDevice?.trim() || undefined,
    renamedFrom: opts?.renamedFrom?.trim() || undefined,
  };
}

/** When a member moves a file onto another device, record rename provenance in the pair. */
export function recordDeviceMove(priorName: string, nextName: string, sourceDevice: string): MediaPair {
  const prior = associatePngXml(priorName);
  const next = associatePngXml(nextName, {
    sourceDevice,
    renamedFrom: prior.png !== pngSet(nextName).png ? prior.png : prior.renamedFrom,
  });
  if (prior.stem !== next.stem && !next.renamedFrom) {
    next.renamedFrom = prior.png;
  }
  return next;
}

export function pairsMatch(pngName: string, xmlName: string): boolean {
  const a = associatePngXml(pngName);
  const b = associatePngXml(xmlName.replace(/\.xml$/i, ".png"));
  return a.stem === b.stem && a.xml === xmlName.replace(/^\.\//, "");
}

/** Independent Level-2 reviewer: never the same person as the Level-1 labeler. */
export function authorizeReviewer(labeler: string | undefined, reviewer: string | undefined):
  | { ok: true }
  | { ok: false; note: string } {
  const by = (labeler || "").trim();
  const who = (reviewer || "").trim();
  if (!by) return { ok: false, note: "Level 1 must name who labeled the box before Level 2." };
  if (!who) return { ok: false, note: "Level 2 must name a different reviewer." };
  if (sameMember(by, who)) {
    return { ok: false, note: "Level 2 must be a different person than the Level 1 labeler." };
  }
  return { ok: true };
}

export type CorrectionEvent = {
  at: string;
  by: string;
  kind: "adjust" | "reject" | "restore";
  from: Partial<Pick<WorkBox, "name" | "left" | "top" | "right" | "bottom" | "level">>;
  to: Partial<Pick<WorkBox, "name" | "left" | "top" | "right" | "bottom" | "level">>;
  note?: string;
};

/** Append-only correction provenance. Prior events are never edited. */
export function appendCorrection(
  prior: readonly CorrectionEvent[] | undefined,
  next: CorrectionEvent,
): CorrectionEvent[] {
  const list = Array.isArray(prior) ? [...prior] : [];
  list.push({
    at: next.at,
    by: next.by,
    kind: next.kind,
    from: { ...next.from },
    to: { ...next.to },
    note: next.note,
  });
  return list;
}

export type ProjectSettings = {
  projectId: string;
  scheme: string;
  coral: boolean;
  alerts: boolean;
  updatedAt: string;
  updatedBy?: string;
};

export function serializeProjectSettings(settings: ProjectSettings): string {
  if (!settings.projectId?.trim()) throw new Error("projectId is required");
  return JSON.stringify({
    projectId: settings.projectId.trim(),
    scheme: settings.scheme || "green",
    coral: !!settings.coral,
    alerts: !!settings.alerts,
    updatedAt: settings.updatedAt,
    updatedBy: settings.updatedBy || undefined,
  });
}

export function parseProjectSettings(raw: string, expectedProject?: string): ProjectSettings | null {
  try {
    const parsed = JSON.parse(raw) as ProjectSettings;
    if (!parsed?.projectId) return null;
    if (expectedProject && parsed.projectId !== expectedProject) return null;
    return {
      projectId: parsed.projectId,
      scheme: parsed.scheme || "green",
      coral: !!parsed.coral,
      alerts: !!parsed.alerts,
      updatedAt: parsed.updatedAt || "",
      updatedBy: parsed.updatedBy,
    };
  } catch {
    return null;
  }
}

export type TeamProgressSnapshot = {
  projectId: string;
  clock: WorkClock;
  pictures: number;
  level1: number;
  level2: number;
  reviewLeft: number;
  updatedAt: string;
  memberId?: string;
};

export function serializeTeamProgress(snap: TeamProgressSnapshot): string {
  if (!snap.projectId?.trim()) throw new Error("projectId is required");
  if (!snap.clock || snap.clock.project !== snap.projectId) {
    throw new Error("clock.project must match projectId");
  }
  return JSON.stringify({
    projectId: snap.projectId,
    clock: snap.clock,
    pictures: snap.pictures,
    level1: snap.level1,
    level2: snap.level2,
    reviewLeft: snap.reviewLeft,
    updatedAt: snap.updatedAt,
    memberId: snap.memberId,
  });
}

export function parseTeamProgress(raw: string, expectedProject?: string): TeamProgressSnapshot | null {
  try {
    const parsed = JSON.parse(raw) as TeamProgressSnapshot;
    if (!parsed?.projectId || !parsed.clock) return null;
    if (expectedProject && parsed.projectId !== expectedProject) return null;
    if (parsed.clock.project !== parsed.projectId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function emptyProgress(projectId: string, updatedAt = ""): TeamProgressSnapshot {
  return {
    projectId,
    clock: emptyClock(projectId),
    pictures: 0,
    level1: 0,
    level2: 0,
    reviewLeft: 0,
    updatedAt,
  };
}

/** Round-robin image ownership across 2–8 members for Level 1. Reviewer is the next teammate. */
export function distributeAssignments(files: string[], members: string[]): { file: string; labeler: string; reviewer: string }[] {
  const team = members.map((m) => m.trim()).filter(Boolean);
  if (team.length < 2 || team.length > 8) {
    throw new Error("A collaborative set needs 2 to 8 members.");
  }
  return files.map((file, index) => ({
    file,
    labeler: team[index % team.length],
    reviewer: team[(index + 1) % team.length],
  }));
}

/** Project JSON is allowed only after every picture has independent Level 1 + Level 2. */
export function projectJsonAllowed(
  images: { boxes: { level?: number; by?: string; reviewer?: string }[] }[],
): { ok: true } | { ok: false; note: string } {
  if (!images.length) return { ok: false, note: "Open the project's pictures first. Level 1 and Level 2 stay XML." };
  for (const image of images) {
    if (!image.boxes?.length) {
      return { ok: false, note: "Every picture needs a Level 1 box first. Both levels stay XML." };
    }
    for (const box of image.boxes) {
      const gate = authorizeReviewer(box.by, box.reviewer);
      if (box.level !== 2 || !gate.ok) {
        return { ok: false, note: "JSON waits. Every picture in this project still needs Level 2 by a different person, saved as XML." };
      }
    }
  }
  return { ok: true };
}

/**
 * Shape a progress upsert for Supabase. Callers must pass a gated owner.
 * Missing auth must not be treated as a local success.
 */
export function progressUpsertRow(owner: string, snap: TeamProgressSnapshot) {
  if (!owner?.trim()) {
    throw new Error("progressUpsertRow requires a signed-in member id");
  }
  return {
    project_id: snap.projectId,
    member_id: owner,
    payload: JSON.parse(serializeTeamProgress({ ...snap, memberId: owner })),
    updated_at: snap.updatedAt || new Date().toISOString(),
  };
}

export function settingsUpsertRow(owner: string, settings: ProjectSettings) {
  if (!owner?.trim()) {
    throw new Error("settingsUpsertRow requires a signed-in member id");
  }
  return {
    project_id: settings.projectId,
    settings: JSON.parse(serializeProjectSettings({ ...settings, updatedBy: owner })),
    updated_by: owner,
    updated_at: settings.updatedAt || new Date().toISOString(),
  };
}
