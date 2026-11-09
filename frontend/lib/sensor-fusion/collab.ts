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
  correctionSaveFailed: "sf.collab.correction_save_failed",
  correctionNeedsIndep: "sf.collab.correction_needs_indep",
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

/** Live sensor_fusion_labels insert shape (columns applied 2026-11-08). */
export type LabelBoxInput = {
  name: string;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  level?: number;
  by?: string;
  at?: string;
  reviewer?: string;
  reviewedAt?: string;
};

export function labelInsertRows(
  owner: string,
  pictureId: string,
  projectId: string,
  boxes: readonly LabelBoxInput[],
  codex = "",
) {
  if (!owner?.trim()) throw new Error("labelInsertRows requires a signed-in member id");
  if (!pictureId?.trim()) throw new Error("labelInsertRows requires pictureId");
  return boxes.map((box) => ({
    owner_key: owner,
    picture_id: pictureId,
    name: box.name,
    x1: box.xmin,
    y1: box.ymin,
    x2: box.xmax,
    y2: box.ymax,
    project_id: projectId,
    level: box.level ?? 1,
    labeled_by: box.by || null,
    labeled_at: box.at || null,
    reviewed_by: box.reviewer || null,
    reviewed_at: box.reviewedAt || null,
    codex: codex || null,
  }));
}

/** Live sensor_fusion_pictures insert with XML/device provenance columns. */
export function pictureInsertRow(input: {
  owner: string;
  projectId: string;
  fileName: string;
  model: string;
  jpeg: string;
  xmlText?: string;
  sourceDevice?: string;
  renamedFrom?: string;
  codexL1?: string;
  codexL2?: string;
}) {
  if (!input.owner?.trim()) throw new Error("pictureInsertRow requires a signed-in member id");
  const pair = associatePngXml(input.fileName, {
    sourceDevice: input.sourceDevice,
    renamedFrom: input.renamedFrom,
  });
  return {
    owner_key: input.owner,
    name: input.fileName,
    model: input.model,
    jpeg: input.jpeg,
    project_id: input.projectId,
    codex_l1: input.codexL1 || null,
    codex_l2: input.codexL2 || null,
    xml_text: input.xmlText || null,
    source_device: pair.sourceDevice || null,
    renamed_from: pair.renamedFrom || null,
    pair_stem: pair.stem,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Live sensor_fusion_label_corrections insert (append-only). Independent reviewer required. */
export function correctionInsertRow(input: {
  owner: string;
  projectId: string;
  pictureId: string;
  labelId?: string | null;
  event: CorrectionEvent;
  labeledBy?: string;
}) {
  if (!input.owner?.trim()) throw new Error("correctionInsertRow requires a signed-in member id");
  if (input.labeledBy?.trim()) {
    const indep = authorizeReviewer(input.labeledBy, input.event.by);
    if (!indep.ok) throw new Error("correctionInsertRow refuses same-person correction");
  }
  return {
    project_id: input.projectId,
    picture_id: input.pictureId,
    // label_id is a UUID column; device-local box ids (e.g. "pic-0") are not label rows, so they send null.
    label_id: input.labelId && UUID_RE.test(input.labelId) ? input.labelId : null,
    corrected_by: input.event.by,
    // Bound to the signed-in member; migration 053 overwrites it with auth.uid() and refuses a mismatch.
    corrected_by_uid: input.owner,
    labeled_by: input.labeledBy || null,
    kind: input.event.kind,
    from_box: { ...input.event.from },
    to_box: { ...input.event.to },
    note: input.event.note || null,
  };
}

/**
 * Level-2 decision helper: approve (no correction), reject, or adjust.
 * Always requires an independent reviewer. Does not invent membership.
 */
export function level2Decision(input: {
  labeler: string;
  reviewer: string;
  kind: "approve" | "reject" | "adjust";
  from: CorrectionEvent["from"];
  to?: CorrectionEvent["to"];
  at: string;
  note?: string;
}):
  | { ok: true; kind: "approve" }
  | { ok: true; kind: "reject" | "adjust"; event: CorrectionEvent }
  | { ok: false; noteKey: SfNoteKey } {
  const gate = authorizeReviewer(input.labeler, input.reviewer);
  if (!gate.ok) return gate;
  if (input.kind === "approve") return { ok: true, kind: "approve" };
  return {
    ok: true,
    kind: input.kind,
    event: {
      at: input.at,
      by: input.reviewer.trim(),
      kind: input.kind,
      from: { ...input.from },
      to: { ...(input.to || {}) },
      note: input.note,
    },
  };
}
