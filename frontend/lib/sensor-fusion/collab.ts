/**
 * SensorFusion-2525 collaborative persistence contracts.
 * Pure helpers for PNG↔XML association, team progress, per-project settings,
 * independent Level-2 reviewer authorization, and append-only correction provenance.
 * Supabase writes are gated: missing auth is a hard failure, never a local-cache "success".
 */
import { pngSet, pictureStem } from "./frames";
import { sameMember, type WorkClock, type WorkBox, emptyClock } from "./workflow";

/** Lexicon keys for newly introduced collab UI notes. English lives in lexicon-data; ×32 fill is AFTER_FILL / unverified. */
export const SF_NOTE_KEYS = {
  authRequired: "sf.collab.auth_required",
  reviewerNeedsLabeler: "sf.collab.reviewer_needs_labeler",
  reviewerNeedsName: "sf.collab.reviewer_needs_name",
  reviewerMustDiffer: "sf.collab.reviewer_must_differ",
  progressNotConnected: "sf.collab.progress_not_connected",
  progressSaveFailed: "sf.collab.progress_save_failed",
  settingsSaveFailed: "sf.collab.settings_save_failed",
  pairNameMismatch: "sf.collab.pair_name_mismatch",
  syncWaitingTables: "sf.collab.sync_waiting_tables",
  jsonNeedsPictures: "sf.collab.json_needs_pictures",
  jsonNeedsLevel1: "sf.collab.json_needs_level1",
  jsonNeedsLevel2: "sf.collab.json_needs_level2",
} as const;

export type SfNoteKey = (typeof SF_NOTE_KEYS)[keyof typeof SF_NOTE_KEYS];

export type AuthGate =
  | { ok: true; owner: string }
  | { ok: false; noteKey: SfNoteKey };

/** Fail honestly when the signed-in Supabase member session is missing. */
export function requireMemberSession(session: { user?: { id?: string | null } | null } | null | undefined): AuthGate {
  const owner = session?.user?.id?.trim() || "";
  if (!owner) {
    return { ok: false, noteKey: SF_NOTE_KEYS.authRequired };
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
  | { ok: false; noteKey: SfNoteKey } {
  const by = (labeler || "").trim();
  const who = (reviewer || "").trim();
  if (!by) return { ok: false, noteKey: SF_NOTE_KEYS.reviewerNeedsLabeler };
  if (!who) return { ok: false, noteKey: SF_NOTE_KEYS.reviewerNeedsName };
  if (sameMember(by, who)) {
    return { ok: false, noteKey: SF_NOTE_KEYS.reviewerMustDiffer };
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
): { ok: true } | { ok: false; noteKey: SfNoteKey } {
  if (!images.length) return { ok: false, noteKey: SF_NOTE_KEYS.jsonNeedsPictures };
  for (const image of images) {
    if (!image.boxes?.length) {
      return { ok: false, noteKey: SF_NOTE_KEYS.jsonNeedsLevel1 };
    }
    for (const box of image.boxes) {
      const gate = authorizeReviewer(box.by, box.reviewer);
      if (box.level !== 2 || !gate.ok) {
        return { ok: false, noteKey: SF_NOTE_KEYS.jsonNeedsLevel2 };
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
