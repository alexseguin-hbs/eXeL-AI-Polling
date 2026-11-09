// SensorFusion work events + ♡ time credit (CRS-19.08, CRS-25.02, CRS-32.04).
import { buildWorkEvent, heartCreditFromSeconds, loginJoinCredit, workEventsToCsv, UNITY_HEART_MULTIPLIER } from "../lib/sensor-fusion/work-events.ts";
import { siTokens } from "../lib/sensor-fusion/workflow.ts";
import { validateSeatName, joinSeatRpcArgs, parseJoinSeatPayload, SF_SEAT_KEYS } from "../lib/sensor-fusion/anon-seat.ts";

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error("FAIL:", msg); }
}

ok(UNITY_HEART_MULTIPLIER === 5, "unity multiplier is Cube 5 default 5");
ok(heartCreditFromSeconds(60).heart === 1 && heartCreditFromSeconds(60).unity === 5, "60s → ♡1 ◬5");
ok(heartCreditFromSeconds(61).heart === 2, "61s → ♡2 (ceil)");
ok(heartCreditFromSeconds(0).heart === 0, "0s → 0");
ok(heartCreditFromSeconds(125).heart === siTokens(125), "matches workflow.siTokens");
ok(heartCreditFromSeconds(90).human === 0, "웃 always 0 while HI unfunded");
ok(loginJoinCredit().heart === 1 && loginJoinCredit().unity === 5, "login ♡1 ◬5");

const stop = buildWorkEvent({
  project_id: "p",
  actor_uid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  display_name: "Deer Spotter",
  is_anonymous: true,
  event_type: "session_stop",
  duration_ms: 125000,
});
ok(stop.delta_heart === 3 && stop.delta_unity === 15 && stop.delta_human === 0, "session_stop credits ceil(125s/60)=3");

const create = buildWorkEvent({
  project_id: "p",
  actor_uid: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  event_type: "label_create",
  class_name: "car",
  credit_time: false,
});
ok(create.delta_heart === 0, "label_create without duration mints no ♡ (time-based only)");

const csv = workEventsToCsv([{ ...stop, event_id: "e1" }]);
ok(csv.includes("delta_heart") && csv.includes("Deer Spotter") && csv.includes("session_stop"), "CSV export includes trace fields");

ok(validateSeatName("", []).reason === "missing_name", "empty name refused");
ok(validateSeatName("Alex", ["alex"]).reason === "name_taken", "case-insensitive name taken");
ok(validateSeatName("Jordan", ["Alex"]).ok === true, "free name ok");
ok(joinSeatRpcArgs({ projectId: "p1", displayName: "  Pat  ", isAnonymous: true }).p_display_name === "Pat", "rpc args trim");
ok(parseJoinSeatPayload({ ok: true, member_id: "u1", display_name: "Pat", is_anonymous: true, already: false }).ok === true, "parse join ok");
ok(SF_SEAT_KEYS.anonymousChoose === "sf.seat.anonymous_choose", "lexicon key wired");

console.log(`sensor-fusion-work-events: pass=${pass} fail=${fail}`);
if (fail) process.exit(1);
