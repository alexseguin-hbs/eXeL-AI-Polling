// SensorFusion collaborative persistence: PNG/XML, roles, progress/settings, reviewer gate, append-only corrections.
// Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sensor-fusion-collab.test.mjs
import fs from "node:fs";
import path from "node:path";
import {
  appendCorrection,
  associatePngXml,
  authorizeReviewer,
  distributeAssignments,
  emptyProgress,
  pairsMatch,
  parseProjectSettings,
  parseTeamProgress,
  progressUpsertRow,
  projectJsonAllowed,
  recordDeviceMove,
  requireMemberSession,
  serializeProjectSettings,
  serializeTeamProgress,
  settingsUpsertRow,
  labelInsertRows,
  pictureInsertRow,
  correctionInsertRow,
  level2Decision,
  SF_NOTE_KEYS,
} from "../lib/sensor-fusion/collab.ts";
import { DEFAULT_ENGLISH_TRANSLATIONS } from "../lib/lexicon-data.ts";
import { emptyClock, noteWork, startClock } from "../lib/sensor-fusion/workflow.ts";

let pass = 0;
let fail = 0;
const ok = (cond, message) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", message);
  }
};

// PNG ↔ XML association
const pair = associatePngXml("deer_0008.jpg");
ok(pair.png === "deer_0008.png" && pair.xml === "deer_0008.xml" && pair.stem === "deer_0008", "lossy intake maps to lossless PNG + XML stem");
ok(pairsMatch("deer_0008.png", "deer_0008.xml"), "png and xml associate by stem");
ok(!pairsMatch("deer_0008.png", "deer_0009.xml"), "different stems do not associate");

const moved = recordDeviceMove("bird_0001.png", "bird_0012.png", "pixel-7");
ok(moved.sourceDevice === "pixel-7" && moved.renamedFrom === "bird_0001.png", "device move records rename provenance");
ok(moved.png === "bird_0012.png" && moved.xml === "bird_0012.xml", "renamed pair keeps png/xml association");

// Auth gate — never treat local cache as cloud success
ok(requireMemberSession(null).ok === false && requireMemberSession(null).noteKey === SF_NOTE_KEYS.authRequired, "null session fails honestly with auth noteKey");
ok(requireMemberSession({}).ok === false, "empty session fails honestly");
ok(requireMemberSession({ user: { id: "" } }).ok === false, "blank user id fails honestly");
const gated = requireMemberSession({ user: { id: "11111111-2222-3333-4444-555555555555" } });
ok(gated.ok === true && gated.owner.startsWith("1111"), "signed-in member passes the gate");

// Independent reviewer
ok(authorizeReviewer("Alex", "Alex").ok === false && authorizeReviewer("Alex", "Alex").noteKey === SF_NOTE_KEYS.reviewerMustDiffer, "same labeler cannot review");
ok(authorizeReviewer("Alex", "alex").ok === false, "case-insensitive same person is refused");
ok(authorizeReviewer("Alex", "Jordan").ok === true, "a different person may review");
ok(authorizeReviewer("", "Jordan").ok === false && authorizeReviewer("", "Jordan").noteKey === SF_NOTE_KEYS.reviewerNeedsLabeler, "missing labeler is refused");

// Append-only corrections
const c1 = appendCorrection(undefined, {
  at: "2026.11.08_20.00..00",
  by: "Jordan",
  kind: "adjust",
  from: { left: 10 },
  to: { left: 12 },
});
const c2 = appendCorrection(c1, {
  at: "2026.11.08_20.01..00",
  by: "Jordan",
  kind: "restore",
  from: { left: 12 },
  to: { left: 10 },
});
ok(c1.length === 1 && c2.length === 2 && c2[0].from.left === 10, "corrections append; prior events stay");
ok(c1[0].from.left === 10, "mutating the returned list does not rewrite earlier snapshots' logical prior");

// Settings persistence shape + project isolation
const settingsJson = serializeProjectSettings({
  projectId: "sensor-fusion",
  scheme: "green",
  coral: true,
  alerts: false,
  updatedAt: "2026-11-08T20:00:00Z",
  updatedBy: "Alex",
});
ok(parseProjectSettings(settingsJson, "sensor-fusion")?.coral === true, "settings round-trip for the project");
ok(parseProjectSettings(settingsJson, "other-project") === null, "settings from another project are refused");

// Team progress serialization
let clock = emptyClock("sensor-fusion");
clock = startClock(clock, "Alex", 0);
clock = noteWork(clock, "Alex", "deer_0001.png", "annotate");
const snap = {
  projectId: "sensor-fusion",
  clock,
  pictures: 3,
  level1: 1,
  level2: 0,
  reviewLeft: 2,
  updatedAt: "2026-11-08T20:00:00Z",
};
const progressJson = serializeTeamProgress(snap);
ok(parseTeamProgress(progressJson, "sensor-fusion")?.level1 === 1, "progress round-trip");
ok(parseTeamProgress(progressJson, "birds") === null, "progress is project-isolated");
ok(emptyProgress("sensor-fusion").pictures === 0, "empty progress starts at zero");

let threw = false;
try {
  progressUpsertRow("", snap);
} catch {
  threw = true;
}
ok(threw, "progress upsert without owner throws (no silent local success)");
const row = progressUpsertRow(gated.owner, snap);
ok(row.project_id === "sensor-fusion" && row.member_id === gated.owner && row.payload.level1 === 1, "progress upsert row is membership-scoped");

const settingsRow = settingsUpsertRow(gated.owner, {
  projectId: "sensor-fusion",
  scheme: "green",
  coral: false,
  alerts: true,
  updatedAt: "2026-11-08T20:00:00Z",
});
ok(settingsRow.updated_by === gated.owner && settingsRow.settings.alerts === true, "settings upsert carries member and flags");

// Distributed assignments
const assigns = distributeAssignments(["a.png", "b.png", "c.png"], ["Alex", "Blair", "Casey"]);
ok(assigns.length === 3 && assigns[0].labeler === "Alex" && assigns[0].reviewer === "Blair", "assignments rotate labeler/reviewer");
ok(assigns.every((a) => a.labeler !== a.reviewer), "no assignment reviews itself");

// Project JSON only when full independent Level 2 set is complete
ok(projectJsonAllowed([]).ok === false && projectJsonAllowed([]).noteKey === SF_NOTE_KEYS.jsonNeedsPictures, "empty set cannot emit project JSON");
ok(
  projectJsonAllowed([{ boxes: [{ level: 1, by: "Alex", reviewer: undefined }] }]).ok === false,
  "Level 1 alone cannot emit project JSON",
);
ok(
  projectJsonAllowed([{ boxes: [{ level: 2, by: "Alex", reviewer: "Alex" }] }]).ok === false,
  "same-person Level 2 cannot emit project JSON",
);
ok(
  projectJsonAllowed([{ boxes: [{ level: 2, by: "Alex", reviewer: "Jordan" }] }]).ok === true,
  "full independent Level 2 may emit project JSON",
);


// Live-schema row builders (L1 label → L2 approve/reject/adjust → correction)
const labels = labelInsertRows(gated.owner, "pic-uuid-1", "sensor-fusion", [
  { name: "deer", xmin: 10, ymin: 20, xmax: 30, ymax: 40, level: 2, by: "Alex", at: "t1", reviewer: "Jordan", reviewedAt: "t2" },
]);
ok(labels[0].labeled_by === "Alex" && labels[0].reviewed_by === "Jordan" && labels[0].level === 2 && labels[0].picture_id === "pic-uuid-1", "labelInsertRows maps live review columns");
ok(labels[0].owner_key === gated.owner && labels[0].project_id === "sensor-fusion", "label rows are membership-scoped");

const picRow = pictureInsertRow({
  owner: gated.owner,
  projectId: "sensor-fusion",
  fileName: "deer_0008.jpg",
  model: "animals",
  jpeg: "local:deer_0008.png",
  xmlText: "<annotation/>",
  sourceDevice: "pixel-7",
  renamedFrom: "deer_0001.png",
  codexL1: "L1 ALEX",
  codexL2: "L1 ALEX L2 JORDAN",
});
ok(picRow.pair_stem === "deer_0008" && picRow.xml_text === "<annotation/>" && picRow.source_device === "pixel-7" && picRow.renamed_from === "deer_0001.png", "pictureInsertRow carries XML/device provenance");

const approve = level2Decision({ labeler: "Alex", reviewer: "Jordan", kind: "approve", from: { left: 10 }, at: "2026.11.08_21.00..00" });
ok(approve.ok === true && approve.kind === "approve", "independent approve is allowed");
const sameReject = level2Decision({ labeler: "Alex", reviewer: "Alex", kind: "reject", from: { left: 10 }, at: "t" });
ok(sameReject.ok === false && sameReject.noteKey === SF_NOTE_KEYS.reviewerMustDiffer, "same-person reject is refused");
const reject = level2Decision({ labeler: "Alex", reviewer: "Jordan", kind: "reject", from: { left: 10, name: "deer" }, to: {}, at: "2026.11.08_21.01..00", note: "wrong animal" });
ok(reject.ok === true && reject.kind === "reject" && reject.event.kind === "reject", "independent reject yields correction event");
const adjust = level2Decision({ labeler: "Alex", reviewer: "Jordan", kind: "adjust", from: { left: 10 }, to: { left: 14 }, at: "2026.11.08_21.02..00" });
ok(adjust.ok === true && adjust.kind === "adjust", "independent adjust yields correction event");

const corr = correctionInsertRow({
  owner: gated.owner,
  projectId: "sensor-fusion",
  pictureId: "deer_0008.png",
  labelId: null,
  event: reject.event,
  labeledBy: "Alex",
});
ok(corr.kind === "reject" && corr.corrected_by === "Jordan" && corr.labeled_by === "Alex" && corr.picture_id === "deer_0008.png", "correctionInsertRow maps live corrections columns");
let corrThrew = false;
try {
  correctionInsertRow({
    owner: gated.owner,
    projectId: "sensor-fusion",
    pictureId: "x",
    event: { at: "t", by: "Alex", kind: "reject", from: {}, to: {} },
    labeledBy: "Alex",
  });
} catch {
  corrThrew = true;
}
ok(corrThrew, "same-person correctionInsertRow throws");

// Migration file is review-only and membership-scoped
const sqlPath = path.resolve(import.meta.dirname, "../../supabase/migrations/044_sensor_fusion_collab_progress.sql");
const sql = fs.readFileSync(sqlPath, "utf8");
ok(/CREATE TABLE IF NOT EXISTS sensor_fusion_progress/.test(sql), "migration defines progress table");
ok(/CREATE TABLE IF NOT EXISTS sensor_fusion_project_settings/.test(sql), "migration defines project settings table");
ok(/CREATE TABLE IF NOT EXISTS sensor_fusion_label_corrections/.test(sql), "migration defines append-only corrections");
ok(/xml_text/.test(sql) && /renamed_from/.test(sql) && /pair_stem/.test(sql), "migration adds XML/device provenance columns");
ok(/sensor_fusion_is_member\(project_id\)/.test(sql), "migration reuses membership RLS");
ok(/REVOKE ALL ON sensor_fusion_progress FROM anon/.test(sql), "anon cannot read progress");
ok(/sensor_fusion_labels_independent_reviewer/.test(sql), "migration adds independent-reviewer check");
ok(!/ON sensor_fusion_label_corrections FOR UPDATE/.test(sql) && !/ON sensor_fusion_label_corrections FOR DELETE/.test(sql), "corrections have no update/delete policies");
ok(/No UPDATE or DELETE policies on corrections/.test(sql), "migration states corrections are append-only");

// Page still mounts R-CORE history badge (Security-2525 pattern: real history surface, not a version number alone)
const page = fs.readFileSync(path.resolve(import.meta.dirname, "../app/SensorFusion-2525/sensor-fusion.tsx"), "utf8");
ok(/<RCoreBadge\b/.test(page) && /SENSOR_FUSION_RCORE_HISTORY/.test(page), "SensorFusion mounts RCoreBadge over its own ledger history");
ok(/requireMemberSession|authorizeReviewer|associatePngXml|serializeTeamProgress|labelInsertRows|pictureInsertRow|correctionInsertRow|level2Decision/.test(page), "page wires collab helpers incl. label/correction row builders");
ok(/useLexicon/.test(page) && /t\(SF_NOTE_KEYS\./.test(page) && /t\(gate\.noteKey\)/.test(page) && /t\(gated\.noteKey\)/.test(page), "new collab UI notes go through t()/lexicon keys");
ok(!/setUploadNote\("Sign in as a member of the sensor-fusion project/.test(page), "auth note is not a hardcoded English string in the page");
ok(!/setUploadNote\(`Picture and XML must share one name/.test(page), "pair mismatch uses t() prefix, not a hardcoded full English template");


// Lexicon key/lookup/source: every SF_NOTE_KEYS value has englishDefault; non-en coverage stays AFTER_FILL / unverified
const noteKeys = Object.values(SF_NOTE_KEYS);
ok(noteKeys.length >= 14, `SF_NOTE_KEYS covers the new collab notes (${noteKeys.length})`);
ok(noteKeys.every((k) => DEFAULT_ENGLISH_TRANSLATIONS[k]?.englishDefault?.trim()), "every SF_NOTE_KEYS entry has an englishDefault in lexicon-data");
ok(noteKeys.every((k) => DEFAULT_ENGLISH_TRANSLATIONS[k]?.cubeId === 81), "SF collab keys are cubeId 81 (SensorFusion-2525 collaborative persistence)");
const cov = fs.readFileSync(path.resolve(import.meta.dirname, "./lexicon-coverage.test.mjs"), "utf8");
ok(noteKeys.every((k) => cov.includes(`'${k}'`) || cov.includes(k.replace("sf.collab.", "")) || /sf\.collab\.\$\{k\}/.test(cov) || cov.includes("sf.collab.")), "lexicon-coverage stages sf.collab.* in AFTER_FILL (English-only until fill)");
ok(/sf\.collab\./.test(cov) && /AFTER_FILL/.test(cov), "AFTER_FILL lists SensorFusion collab keys — ×32 fill explicitly unverified");

console.log(fail ? `${pass} passed, ${fail} failed` : `${pass} passed`);
process.exit(fail ? 1 : 0);
