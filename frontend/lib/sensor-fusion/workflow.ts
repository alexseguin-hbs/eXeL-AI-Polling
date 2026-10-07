function memberName(raw: string) {
  const clean = (raw || "guest").toUpperCase().replace(/[^A-Z0-9 ._-]/g, "").replace(/\s+/g, " ").trim();
  return clean || "GUEST";
}

/** One box on a picture. Level 1 is the first person. Level 2 is a different person. */
export type WorkBox = {
  id: string;
  name: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  level: 1 | 2;
  by?: string;
  reviewer?: string;
  at?: string;
  reviewedAt?: string;
};

export type WorkRun = {
  member: string;
  seconds: number;
  images: string[];
  level2: number;
  adjustments: number;
};

export type WorkClock = {
  project: string;
  runs: WorkRun[];
  open: { member: string; startedAt: number; images: string[]; level2: number; adjustments: number } | null;
};

export function sameMember(a: string, b: string) {
  return memberName(a || "guest") === memberName(b || "guest");
}

export function emptyClock(project: string): WorkClock {
  return { project, runs: [], open: null };
}

function fold(runs: WorkRun[], member: string, add: Partial<WorkRun> & { images?: string[] }): WorkRun[] {
  const name = memberName(member);
  const prior = runs.find((run) => run.member === name);
  const images = Array.from(new Set([...(prior?.images || []), ...(add.images || [])]));
  const next: WorkRun = {
    member: name,
    seconds: (prior?.seconds || 0) + (add.seconds || 0),
    images,
    level2: (prior?.level2 || 0) + (add.level2 || 0),
    adjustments: (prior?.adjustments || 0) + (add.adjustments || 0),
  };
  return [...runs.filter((run) => run.member !== name), next];
}

/** START. A clock that is already running stays as it is. */
export function startClock(clock: WorkClock, member: string, now: number): WorkClock {
  if (clock.open) return clock;
  return { ...clock, open: { member: memberName(member), startedAt: now, images: [], level2: 0, adjustments: 0 } };
}

/** STOP. Seconds are whole seconds since START, added to that member. */
export function stopClock(clock: WorkClock, now: number): WorkClock {
  if (!clock.open) return clock;
  const seconds = Math.max(0, Math.round((now - clock.open.startedAt) / 1000));
  return {
    project: clock.project,
    open: null,
    runs: fold(clock.runs, clock.open.member, {
      seconds,
      images: clock.open.images,
      level2: clock.open.level2,
      adjustments: clock.open.adjustments,
    }),
  };
}

export function noteWork(clock: WorkClock, member: string, picture: string, kind: "annotate" | "level2" | "adjust"): WorkClock {
  const name = memberName(member);
  const level2 = kind === "annotate" ? 0 : 1;
  const adjustments = kind === "adjust" ? 1 : 0;
  if (clock.open && clock.open.member === name) {
    const images = clock.open.images.includes(picture) ? clock.open.images : [...clock.open.images, picture];
    return { ...clock, open: { ...clock.open, images, level2: clock.open.level2 + level2, adjustments: clock.open.adjustments + adjustments } };
  }
  return { ...clock, runs: fold(clock.runs, name, { images: picture ? [picture] : [], level2, adjustments }) };
}

export type MemberLine = { member: string; seconds: number; images: number; level2: number; adjustments: number; si: number };

/** ♡ S.I. One token is one started minute. Same rule as the rest of the site: ceil of the minutes. */
export function siTokens(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.ceil(seconds / 60);
}

/** What the screen shows, including the person whose clock is still running. */
export function workflowLines(clock: WorkClock, now: number): MemberLine[] {
  const closed = stopClock(clock, now);
  return closed.runs
    .map((run) => ({
      member: run.member,
      seconds: run.seconds,
      images: run.images.length,
      level2: run.level2,
      adjustments: run.adjustments,
      si: siTokens(run.seconds),
    }))
    .sort((a, b) => a.member.localeCompare(b.member));
}

export type SubmissionImage = {
  file: string;
  l1: string;
  l2: string;
  boxes: { name: string; level: number; by?: string; reviewer?: string; at?: string; reviewedAt?: string }[];
};

/**
 * The teacher's final packet.
 * Every picture must already have Level 1 and a different person's Level 2.
 * The packet carries the pictures, both Light Codex lines, and each person's S.I.
 */
export function finalSubmission(input: { clock: WorkClock; now: number; images: SubmissionImage[] }):
  | { ok: true; packet: { version: 1; purpose: "training"; subject: string; images: SubmissionImage[]; contributors: { member: string; seconds: number; images: number; reviews: number; changes: number; si: number }[]; si: number }; note: string }
  | { ok: false; note: string } {
  if (!input.images.length) return { ok: false, note: "Open the project's pictures first. Level 1 and Level 2 stay XML." };
  if (input.images.some((image) => !image.boxes.length || !image.l1)) {
    return { ok: false, note: "Every picture needs a Level 1 box first. Both levels stay XML." };
  }
  const unfinished = input.images.some(
    (image) => !image.l2 || image.boxes.some((box) => box.level !== 2 || !box.reviewer || !box.by || sameMember(box.reviewer, box.by)),
  );
  if (unfinished) return { ok: false, note: "JSON waits. Every picture in this project still needs Level 2, saved as XML." };
  const contributors = workflowLines(input.clock, input.now).map((line) => ({
    member: line.member,
    seconds: line.seconds,
    images: line.images,
    reviews: line.level2,
    changes: line.adjustments,
    si: line.si,
  }));
  const names = [...new Set(input.images.flatMap((image) => image.boxes.map((box) => box.name.trim()).filter(Boolean)))].sort();
  const subject = names.join(", ") || "animal";
  const si = contributors.reduce((sum, line) => sum + line.si, 0);
  const people = contributors.length;
  return {
    ok: true,
    note: `${input.images.length} pictures. ${people} ${people === 1 ? "person" : "people"}. ${si} S.I.`,
    packet: { version: 1, purpose: "training", subject, images: input.images, contributors, si },
  };
}

/**
 * Saving a box. The first person's name stays.
 * A different person who moves or renames it is a Level 2 change.
 */
export function saveMark(prior: WorkBox | undefined, next: WorkBox, who: string): { box: WorkBox; kind: "annotate" | "adjust" | "level2" } {
  const person = memberName(who);
  if (!prior) {
    return { box: { ...next, level: 1, by: person, at: next.at, reviewer: undefined, reviewedAt: undefined }, kind: "annotate" };
  }
  const moved = prior.left !== next.left || prior.top !== next.top || prior.right !== next.right || prior.bottom !== next.bottom || prior.name !== next.name;
  if (sameMember(prior.by || "guest", person)) {
    return {
      box: { ...prior, name: next.name, left: next.left, top: next.top, right: next.right, bottom: next.bottom, by: prior.by, at: prior.at },
      kind: "annotate",
    };
  }
  return {
    box: {
      ...prior,
      name: next.name,
      left: next.left,
      top: next.top,
      right: next.right,
      bottom: next.bottom,
      level: 2,
      by: prior.by,
      at: prior.at,
      reviewer: person,
      reviewedAt: next.at,
    },
    kind: moved ? "adjust" : "level2",
  };
}

/** LEVEL 2. The same person, including two guests, is refused. */
export function acceptMark(box: WorkBox, who: string, when: string): { ok: true; box: WorkBox } | { ok: false; note: string } {
  if (box.level === 2 && box.reviewer && !sameMember(box.reviewer, box.by || "guest")) {
    return { ok: false, note: "This box is already reviewed." };
  }
  if (sameMember(who, box.by || "guest")) {
    return { ok: false, note: "A different person must review this box." };
  }
  return { ok: true, box: { ...box, level: 2, reviewer: memberName(who), at: box.at || when, reviewedAt: when } };
}

const WORK_KEY = "sf2525-work";

export function readClock(project: string): WorkClock {
  try {
    const raw = window.localStorage.getItem(`${WORK_KEY}:${project}`);
    if (!raw) return emptyClock(project);
    const parsed = JSON.parse(raw) as WorkClock;
    if (!parsed || parsed.project !== project || !Array.isArray(parsed.runs)) return emptyClock(project);
    return { project, runs: parsed.runs, open: parsed.open || null };
  } catch {
    return emptyClock(project);
  }
}

export function writeClock(clock: WorkClock) {
  try {
    window.localStorage.setItem(`${WORK_KEY}:${clock.project}`, JSON.stringify(clock));
  } catch {
    /* A private tab still shows this visit. */
  }
}
