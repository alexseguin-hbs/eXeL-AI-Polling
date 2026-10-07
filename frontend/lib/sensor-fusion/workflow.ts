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

export const SIM_COUNT = 200;
export const SIM_ANIMALS = ["deer", "horse", "cow", "dog", "sheep", "goat"] as const;
export const SIM_LABELERS = ["Alex", "Blair", "Casey", "Drew", "Eden", "Fran"] as const;
export const SIM_REVIEWER = "Jordan";
export const SIM_LABEL_SECONDS = 8;
export const SIM_REVIEW_SECONDS = 3;

function simStamp(total: number) {
  const second = total % 60;
  const minute = Math.floor(total / 60) % 60;
  const hour = 12 + Math.floor(total / 3600);
  const part = (value: number) => String(value).padStart(2, "0");
  return `2026.10.07_${part(hour)}.${part(minute)}..${part(second)}`;
}

type LineWriter = (input: { file: string; level: 1 | 2; who: string; when: string; l1?: { who: string; when: string } }) => string;

/**
 * A class of 200 pictures, in memory only.
 * Six people label deer and other four-legged animals. A seventh person reviews every box.
 * Nothing is saved and nothing is uploaded.
 */
export function simulateClass(count = SIM_COUNT, now = 0, writeLine?: LineWriter) {
  const total = Math.max(1, Math.floor(count));
  const write: LineWriter = writeLine || ((input) => {
    const file = (input.file.replace(/\.[^.]+$/, "") || "PICTURE").toUpperCase();
    const who = memberName(input.who);
    return input.level === 2 && input.l1
      ? `L1 ${memberName(input.l1.who)} ${input.l1.when} L2 ${who} ${input.when} ${file}`
      : `L1 ${who} ${input.when} ${file}`;
  });
  const files: { animal: string; file: string }[] = [];
  const share = Math.floor(total / SIM_ANIMALS.length);
  let extra = total % SIM_ANIMALS.length;
  for (const animal of SIM_ANIMALS) {
    const take = share + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    for (let index = 1; index <= take; index += 1) files.push({ animal, file: `${animal}_${String(index).padStart(4, "0")}.png` });
  }
  let clock = emptyClock("deer");
  let t = now;
  let step = 0;
  const groups = new Map<string, { animal: string; file: string }[]>();
  files.forEach((item, index) => {
    const who = SIM_LABELERS[index % SIM_LABELERS.length];
    groups.set(who, [...(groups.get(who) || []), item]);
  });
  const labeled: { file: string; box: WorkBox }[] = [];
  for (const who of SIM_LABELERS) {
    const list = groups.get(who) || [];
    if (!list.length) continue;
    clock = startClock(clock, who, t);
    for (const item of list) {
      const at = simStamp(step);
      const saved = saveMark(undefined, { id: item.file, name: item.animal, left: 40, top: 35, right: 60, bottom: 65, level: 1, at }, who);
      labeled.push({ file: item.file, box: saved.box });
      clock = noteWork(clock, who, item.file, "annotate");
      step += SIM_LABEL_SECONDS;
      t += SIM_LABEL_SECONDS * 1000;
    }
    clock = stopClock(clock, t);
  }
  clock = startClock(clock, SIM_REVIEWER, t);
  const images: SubmissionImage[] = [];
  for (const [index, item] of labeled.entries()) {
    const when = simStamp(step);
    const moved = index % 10 === 9;
    const reviewed = moved
      ? saveMark(item.box, { ...item.box, left: 12, at: when }, SIM_REVIEWER)
      : acceptMark(item.box, SIM_REVIEWER, when);
    if ("ok" in reviewed && !reviewed.ok) return { ok: false as const, note: reviewed.note };
    const box = reviewed.box;
    const l1 = write({ file: item.file, level: 1, who: box.by || "", when: box.at || when });
    const l2 = write({ file: item.file, level: 2, who: box.reviewer || SIM_REVIEWER, when: box.reviewedAt || when, l1: { who: box.by || "", when: box.at || when } });
    images.push({ file: item.file, l1, l2, boxes: [box] });
    clock = noteWork(clock, SIM_REVIEWER, item.file, moved ? "adjust" : "level2");
    step += SIM_REVIEW_SECONDS;
    t += SIM_REVIEW_SECONDS * 1000;
  }
  clock = stopClock(clock, t);
  const built = finalSubmission({ clock, now: t, images });
  if (!built.ok) return built;
  return { ...built, note: `${built.note} Simulation only. Nothing was saved.` };
}

/** How many pictures still have no Level 1 box. */
export function level1Left(pages: { boxes: { by?: string }[] }[]) {
  return pages.filter((page) => !page.boxes.some((box) => box.by)).length;
}

/** Level 2 waits until both people have finished Level 1. A person still cannot review their own box. */
export function crossReview(box: WorkBox, who: string, when: string, pages: { boxes: { by?: string }[] }[]) {
  const left = level1Left(pages);
  if (left > 0) return { ok: false as const, note: `Finish Level 1 first. ${left} ${left === 1 ? "picture" : "pictures"} still need a box.` };
  return acceptMark(box, who, when);
}

export type SwarmPage = { id: string; boxes: { by?: string; level?: number; reviewer?: string }[] };

function pageLabeled(page: SwarmPage) {
  return page.boxes.some((box) => box.by);
}

function pageReviewed(page: SwarmPage) {
  return page.boxes.length > 0 && page.boxes.every((box) => box.level === 2 && !!box.reviewer && !!box.by && !sameMember(box.reviewer, box.by || ""));
}

function pageMine(page: SwarmPage, who: string) {
  return pageLabeled(page) && !pageReviewed(page) && page.boxes.some((box) => box.by && !sameMember(box.by, who));
}

/** What the whole set still needs, in one sentence. The same numbers for every person. */
export function swarmStatus(pages: SwarmPage[], who: string) {
  const pictures = pages.length;
  const labelLeft = pages.filter((page) => !pageLabeled(page)).length;
  const reviewLeft = pages.filter((page) => pageLabeled(page) && !pageReviewed(page)).length;
  const mine = pages.filter((page) => pageMine(page, who)).length;
  const done = pictures > 0 && labelLeft === 0 && reviewLeft === 0;
  const note = !pictures
    ? "Add pictures. The team shares the labeling."
    : labelLeft
      ? `${labelLeft} left to label. Level 2 waits.`
      : mine
        ? `Labeling is done. ${mine} left for you to review.`
        : reviewLeft
          ? `Labeling is done. ${reviewLeft} left for the team.`
          : "Mission complete.";
  return { pictures, labelLeft, reviewLeft, mine, done, note };
}

/** Level 1 and Level 2 for the whole set, and for the person holding the device. */
export function levelMetrics(pages: SwarmPage[], who: string) {
  const status = swarmStatus(pages, who);
  const level1 = status.pictures - status.labelLeft;
  const level2 = status.pictures - status.labelLeft - status.reviewLeft;
  const mine1 = pages.filter((page) => page.boxes.some((box) => box.by && sameMember(box.by, who))).length;
  const mine2 = pages.filter((page) => page.boxes.some((box) => box.level === 2 && box.reviewer && sameMember(box.reviewer, who))).length;
  return { ...status, level1, level2, total: status.pictures, mine1, mine2 };
}

function seatOf(who: string, size: number) {
  const name = memberName(who);
  let total = 0;
  for (const ch of name) total += ch.charCodeAt(0);
  return size > 0 ? total % size : 0;
}

/** The next picture this person can do. The team fans out, so two people do not open the same one. */
export function nextFor(pages: SwarmPage[], who: string, current: string) {
  const status = swarmStatus(pages, who);
  if (!pages.length || status.done) return { id: current, ...status };
  const ready = status.labelLeft ? pages.filter((page) => !pageLabeled(page)) : pages.filter((page) => pageMine(page, who));
  if (!ready.length) return { id: current, ...status };
  const seat = seatOf(who, pages.length);
  const order = [...pages.slice(seat), ...pages.slice(0, seat)].filter((page) => ready.some((item) => item.id === page.id));
  const at = order.findIndex((page) => page.id === current);
  return { id: (at >= 0 ? order[at + 1] : order[0])?.id || current, ...status };
}

export const SIM_TEAM = ["Alex", "Riley", "Jordan", "Blair", "Casey", "Drew", "Eden", "Fran"] as const;

/**
 * A team of 2 to 8 shares Level 1. When every picture has a box, the next teammate reviews it.
 * Nothing is saved and nothing is uploaded.
 */
export function simulateTeam(count = SIM_COUNT, teamSize = 2, now = 0, writeLine?: LineWriter) {
  const size = Math.max(2, Math.min(SIM_TEAM.length, Math.floor(teamSize) || 2));
  const team = SIM_TEAM.slice(0, size);
  const total = Math.max(size, Math.floor(count));
  const write: LineWriter = writeLine || ((input) => {
    const file = (input.file.replace(/\.[^.]+$/, "") || "PICTURE").toUpperCase();
    const who = memberName(input.who);
    return input.level === 2 && input.l1
      ? `L1 ${memberName(input.l1.who)} ${input.l1.when} L2 ${who} ${input.when} ${file}`
      : `L1 ${who} ${input.when} ${file}`;
  });
  const files: { animal: string; file: string }[] = [];
  const share = Math.floor(total / SIM_ANIMALS.length);
  let extra = total % SIM_ANIMALS.length;
  for (const animal of SIM_ANIMALS) {
    const take = share + (extra > 0 ? 1 : 0);
    if (extra > 0) extra -= 1;
    for (let index = 1; index <= take; index += 1) files.push({ animal, file: `${animal}_${String(index).padStart(4, "0")}.png` });
  }
  const owned = files.map((item, index) => ({ ...item, who: team[index % size], reviewer: team[(index + 1) % size] }));
  let clock = emptyClock("deer");
  let t = now;
  let step = 0;
  const labeled: { file: string; who: string; reviewer: string; box: WorkBox }[] = [];
  for (const who of team) {
    const list = owned.filter((item) => item.who === who);
    clock = startClock(clock, who, t);
    for (const item of list) {
      const at = simStamp(step);
      const saved = saveMark(undefined, { id: item.file, name: item.animal, left: 40, top: 35, right: 60, bottom: 65, level: 1, at }, who);
      labeled.push({ file: item.file, who, reviewer: item.reviewer, box: saved.box });
      clock = noteWork(clock, who, item.file, "annotate");
      step += SIM_LABEL_SECONDS;
      t += SIM_LABEL_SECONDS * 1000;
    }
    clock = stopClock(clock, t);
  }
  const earlyPages = labeled.map((item, index) => ({ boxes: index === labeled.length - 1 ? [] : [item.box] }));
  const early = crossReview(labeled[0].box, team[1], simStamp(step), earlyPages);
  if (early.ok) return { ok: false as const, note: "Level 2 started before Level 1 was finished." };
  for (const who of team) {
    const list = labeled.filter((item) => sameMember(item.reviewer, who));
    clock = startClock(clock, who, t);
    for (const [index, item] of list.entries()) {
      const when = simStamp(step);
      const moved = index % 10 === 9;
      const reviewed = moved
        ? saveMark(item.box, { ...item.box, left: 12, at: when }, who)
        : crossReview(item.box, who, when, labeled.map((page) => ({ boxes: [page.box] })));
      if ("ok" in reviewed) {
        if (!reviewed.ok) return { ok: false as const, note: reviewed.note };
        item.box = reviewed.box;
      } else {
        item.box = reviewed.box;
      }
      clock = noteWork(clock, who, item.file, moved ? "adjust" : "level2");
      step += SIM_REVIEW_SECONDS;
      t += SIM_REVIEW_SECONDS * 1000;
    }
    clock = stopClock(clock, t);
  }
  const images: SubmissionImage[] = labeled.map((item) => ({
    file: item.file,
    l1: write({ file: item.file, level: 1, who: item.box.by || item.who, when: item.box.at || simStamp(0) }),
    l2: write({
      file: item.file,
      level: 2,
      who: item.box.reviewer || "",
      when: item.box.reviewedAt || simStamp(0),
      l1: { who: item.box.by || item.who, when: item.box.at || simStamp(0) },
    }),
    boxes: [item.box],
  }));
  const built = finalSubmission({ clock, now: t, images });
  if (!built.ok) return built;
  return { ...built, note: `${built.note} Simulation only. Nothing was saved.`, held: early.note };
}

/** Two people are the smallest team. */
export function simulatePair(count = SIM_COUNT, now = 0, writeLine?: LineWriter) {
  return simulateTeam(count, 2, now, writeLine);
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
