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

export type MemberLine = { member: string; seconds: number; images: number; level2: number; adjustments: number };

/** What the screen shows, including the person whose clock is still running. */
export function workflowLines(clock: WorkClock, now: number): MemberLine[] {
  const closed = stopClock(clock, now);
  return closed.runs
    .map((run) => ({ member: run.member, seconds: run.seconds, images: run.images.length, level2: run.level2, adjustments: run.adjustments }))
    .sort((a, b) => a.member.localeCompare(b.member));
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
