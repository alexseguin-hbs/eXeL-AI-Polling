/**
 * Room designer — per-row Rotate/Delete regression lock (operator IMG_7611: "10 tries to delete mirror").
 * Source-level guard: every ELEMENTS row must expose Rotate + Delete on the right, wired to the tested pure
 * helpers (rotateObject / removeObject) with a deselect on delete. The behaviour of those helpers is covered
 * by room-audit (29 kinds × place·move·edit·rotate·remove). Here we lock the UI wiring so it can't regress.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "components/architect-2525/room-designer.tsx"), "utf8");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("FAIL:", m); } };

// the list-row block (between "objects.map((o)" and the SELECTED detail comment)
const listStart = src.indexOf("objects.map((o)");
const listEnd = src.indexOf("SELECTED detail");
const rowBlock = src.slice(listStart, listEnd);

ok(rowBlock.includes('data-arch-el-delete'), "per-row delete button present");
ok(rowBlock.includes('data-arch-el-rotate'), "per-row rotate button present");
ok(/data-arch-el-delete[\s\S]{0,160}removeObject\(objects, o\.id\)/.test(rowBlock), "row delete calls removeObject(objects, o.id)");
ok(/data-arch-el-delete[\s\S]{0,200}selId === o\.id[\s\S]{0,30}setSelId\(null\)/.test(rowBlock), "row delete deselects when the removed item was selected");
ok(/data-arch-el-rotate[\s\S]{0,160}rotateObject\(objects, o\.id\)/.test(rowBlock), "row rotate calls rotateObject(objects, o.id)");
ok(rowBlock.includes("setSelId(on ? null : o.id)"), "row name still toggles selection");
// buttons must be to the RIGHT of the name (delete/rotate appear after the flex-1 select button)
ok(rowBlock.indexOf("flex-1") < rowBlock.indexOf("data-arch-el-rotate"), "rotate sits right of the name area");
ok(rowBlock.indexOf("data-arch-el-rotate") < rowBlock.indexOf("data-arch-el-delete"), "order: rotate then delete");

console.log(`ROOM-ROW-ACTIONS ${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
