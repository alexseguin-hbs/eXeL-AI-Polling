// Fitness-2525 · AsM item 14: every entry saves per user (debounced autosave, device fallback, push on sign-in),
// meals + sugar feed calories in / sugar cap, tombstones stop deleted items coming back, fit-index once per sync.
// Run (from frontend/): node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/fitness-2525-autosave.test.mjs
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://sb.test";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-test";
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log("FAIL:", msg); } };

// mocked Supabase innovation_state RPCs (supabase-js + Worker both POST /rest/v1/rpc/<fn>)
const rows = new Map();
let puts = [];
globalThis.fetch = async (input, init = {}) => {
  const u = String(input && input.url || input);
  const m = u.match(/\/rest\/v1\/rpc\/(innovation_state_(get|put|del))/);
  if (!m) return new Response(JSON.stringify({ unexpected: u }), { status: 500 });
  const b = JSON.parse(init.body || "{}"), k = `${b.p_owner}/${b.p_name}`;
  if (m[2] === "put") { rows.set(k, JSON.parse(JSON.stringify(b.p_payload))); puts.push(b.p_name); return new Response("null", { headers: { "content-type": "application/json" } }); }
  if (m[2] === "del") { rows.delete(k); return new Response("null", { headers: { "content-type": "application/json" } }); }
  return new Response(JSON.stringify(rows.get(k) ?? null), { headers: { "content-type": "application/json" } });
};
const store = new Map();
globalThis.localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };

const { mergeFitDays, ownerKeyFor } = await import("../lib/fitness-2525/cloud.ts");
const { addMeal, addWorkout, deleteItem, mealTotals, withMealTotals, clampRating } = await import("../lib/fitness-2525/log.ts");
const { pushDeviceDays, sameDays, stableJson } = await import("../lib/fitness-2525/autosave.ts");

const base = (at, extra = {}) => ({ v: 1, date: "2026-10-05", workouts: [{ id: "w-swim", type: "swim", status: "completed", calories: 672 }], checkins: [], calories_in: null, sugar_out_g: null, at, ...extra });

// ── meals feed calories in + sugar; blanks stay blank ───────────────────────
let d = addMeal(base(1), { name: "Oats + eggs", time: "07:30", kcal: 520, carbs_g: 70, sugar_g: 12, protein_g: 28, fat_g: 14 });
ok(d.meals.length === 1 && d.calories_in === 520 && d.sugar_out_g === 12, "meal kcal/sugar → calories_in 520, sugar 12 g");
d = addMeal(d, { name: "Gel", sugar_g: 22 });
ok(d.calories_in === 520 && d.sugar_out_g === 34, "sugar-only entry adds sugar (34 g) without inventing kcal");
const t = mealTotals(d.meals);
ok(t.protein_g === 28 && t.fat_g === 14 && t.carbs_g === 70, "macro totals sum only logged values");
ok(mealTotals([{ id: "x", name: "?", at: 1 }]).kcal === null, "meal with no numbers → totals stay null (not 0)");
const noMeal = withMealTotals(base(1, { calories_in: 1800, sugar_out_g: 20 }));
ok(noMeal.calories_in === 1800 && noMeal.sugar_out_g === 20, "no meals logged → typed calories_in / sugar stand");
ok(clampRating(14) === 10 && clampRating(0) === 1 && clampRating(null) === null && clampRating(6.6) === 7, "energy rating clamps to 1–10, blank stays blank");

// ── tombstones: a deleted workout / meal never comes back on merge ──────────
const mealId = d.meals[0].id;
const phone = deleteItem(d, mealId, 100);
ok(!phone.meals.some((m) => m.id === mealId) && phone.calories_in === null && phone.sugar_out_g === 22, "delete meal → gone, totals recomputed (kcal blank again)");
const laptop = { ...d, at: 50 }; // older copy still holding the meal
const m1 = mergeFitDays(phone, laptop), m2 = mergeFitDays(laptop, phone);
ok(!m1.meals.some((m) => m.id === mealId) && !m2.meals.some((m) => m.id === mealId), "merge either direction → deleted meal stays deleted");
ok(m1.deleted[mealId] === 100 && m2.deleted[mealId] === 100, "tombstone survives the merge");
const noSwim = deleteItem(base(5), "w-swim", 200);
const seedAgain = mergeFitDays(noSwim, base(1)); // the seed day re-merged at hydrate still has the swim
ok(!seedAgain.workouts.some((w) => w.id === "w-swim"), "deleted seed workout is not resurrected by the seed / remote copy");
const later = mergeFitDays(base(300, { workouts: [] }), noSwim);
ok(!later.workouts.some((w) => w.id === "w-swim") && later.deleted["w-swim"], "newer copy without the tombstone still keeps it deleted");
const manual = addWorkout(base(1), { type: "run", minutes: 30, distance: { value: 3.1, unit: "mi" }, calories: null });
const mw = manual.workouts.find((w) => w.type === "run");
ok(mw && mw.status === "completed" && mw.calories === null && mw.id.startsWith("w-"), "manual run logged; no kcal invented");
const union = mergeFitDays(addMeal(base(10), { name: "A", kcal: 100 }), addMeal(base(20), { name: "B", kcal: 250 }));
ok(union.meals.length === 2 && union.calories_in === 350, "meals from two devices union by id → calories_in 350");
ok(mergeFitDays(base(10, { energy: 4 }), base(20, { energy: 8 })).energy === 8, "energy 1–10: newest wins");
ok(mergeFitDays(base(30, { energy: 4 }), base(20)).energy === 4, "energy kept when other side never set it");
ok(!("meals" in mergeFitDays(base(2), base(1))) && !("deleted" in mergeFitDays(base(2), base(1))), "old days without meals/tombstones merge unchanged");

// ── helpers ─────────────────────────────────────────────────────────────────
ok(stableJson({ b: 1, a: [1, { y: 2, x: 1 }] }) === stableJson({ a: [1, { x: 1, y: 2 }], b: 1 }), "stableJson ignores key order");
ok(sameDays({ days: ["b", "a"] }, { days: ["a", "b"] }) && !sameDays({ days: ["a"] }, { days: ["a", "b"] }) && !sameDays(null, { days: ["a"] }), "sameDays compares the day lists");

// ── push on sign-in: device days merge into the account; unchanged rows are not rewritten ──
const owner = await ownerKeyFor("auth0|autosave-test");
ok(/^[0-9a-f]{64}$/.test(owner), "owner key = sha256(fit2525:+sub)");
store.set("fit2525-index", JSON.stringify({ days: ["2026-10-03", "2026-10-04", "2026-10-05"], at: 1 }));
store.set("fit2525-day:2026-10-03", JSON.stringify(addMeal(base(5, { date: "2026-10-03", steps: 9000 }), { name: "Dinner", kcal: 700 })));
store.set("fit2525-day:2026-10-04", JSON.stringify(base(5, { date: "2026-10-04", source: "fitness-2525-example" })));
store.set("fit2525-day:2026-10-05", JSON.stringify(base(5)));
rows.set(`${owner}/fit-day-2026-10-03`, base(9, { date: "2026-10-03", weight: { value: 190, unit: "lb" } }));
puts = [];
const n = await pushDeviceDays(owner, "2026-10-05");
const r3 = rows.get(`${owner}/fit-day-2026-10-03`);
ok(n === 1 && puts.length === 1 && puts[0] === "fit-day-2026-10-03", `only the signed-out day is pushed (wrote ${n}, puts ${puts.join(",")})`);
ok(r3.steps === 9000 && r3.weight.value === 190 && r3.meals.length === 1 && r3.calories_in === 700, "pushed day = device entries merged with the account row");
ok(!rows.has(`${owner}/fit-day-2026-10-04`), "EXAMPLE day is never pushed");
puts = [];
ok(await pushDeviceDays(owner, "2026-10-05") === 0 && puts.length === 0, "second sign-in: nothing changed → no writes");

// ── Worker: tombstones honoured + fit-index written once per sync ───────────
const { mergeWorkoutIntoDay, touchIndex } = await import("../fitness-2525-core/sync.js");
const env = { SUPABASE_URL: "https://sb.test", SUPABASE_ANON_KEY: "anon-test" };
const dayOwner = await ownerKeyFor("auth0|worker-test");
rows.set(`${dayOwner}/fit-day-2026-10-05`, base(5, { deleted: { "strava-99": 7 } }));
puts = [];
const skip = await mergeWorkoutIntoDay(env, "auth0|worker-test", { id: "strava-99", strava_id: 99, type: "run", calories: 300, start_iso: "2026-10-05T07:00:00" });
ok(skip.skipped === "deleted" && puts.length === 0, "Worker: a Strava activity the athlete deleted is not re-added");
const dates = [];
for (const id of [1, 2, 3]) dates.push((await mergeWorkoutIntoDay(env, "auth0|worker-test", { id: `strava-${id}`, strava_id: id, type: "run", calories: 100, start_iso: "2026-10-05T0" + id + ":00:00" })).date);
await touchIndex(env, "auth0|worker-test", dates);
ok(puts.filter((p) => p === "fit-index").length === 1 && puts.filter((p) => p.startsWith("fit-day")).length === 3, "3 activities → 3 day writes, fit-index written ONCE");
puts = [];
ok(await touchIndex(env, "auth0|worker-test", dates) === false && puts.length === 0, "index unchanged → not rewritten");
const wday = rows.get(`${dayOwner}/fit-day-2026-10-05`);
ok(wday.deleted["strava-99"] && wday.workouts.filter((w) => w.id.startsWith("strava-")).length === 3, "Worker keeps the tombstone and the 3 activities");

console.log(`fitness-2525-autosave: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
