// Fitness-2525 · workout upload. Distance and duration come from the file; calories stay null unless present.
// Run: node --experimental-strip-types --loader ./tests/ts-ext-loader.mjs tests/fitness-2525-upload.test.mjs
import { parseGpx, parseTcx, parseGarminText, parseFit, mergeActivityIntoDay, coalesceActivities } from "../lib/fitness-2525/upload.ts";

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log("FAIL:", msg); } };

const tcx = `<?xml version="1.0"?>
<TrainingCenterDatabase>
  <Activities>
    <Activity Sport="Biking">
      <Id>2026-10-07T19:33:00Z</Id>
      <Lap StartTime="2026-10-07T19:33:00Z">
        <TotalTimeSeconds>2151</TotalTimeSeconds>
        <DistanceMeters>8159.3</DistanceMeters>
        <AverageHeartRateBpm><Value>138</Value></AverageHeartRateBpm>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;
const bike = parseTcx(tcx);
ok(bike.sport === "bike", `tcx sport bike (got ${bike.sport})`);
ok(bike.distance && bike.distance.unit === "m" && Math.abs(bike.distance.value - 8159.3) < 0.2, `tcx distance 8159.3 m (got ${JSON.stringify(bike.distance)})`);
ok(bike.duration === "35:51", `tcx duration 35:51 (got ${bike.duration})`);
ok(bike.avgHr === 138, `tcx hr 138 (got ${bike.avgHr})`);
ok(bike.calories == null, `tcx calories stay null (got ${bike.calories})`);
ok(bike.date === "2026-10-07", `tcx date from Id (got ${bike.date})`);

const tcxCal = tcx.replace("</Lap>", "<Calories>412</Calories></Lap>");
const withCal = parseTcx(tcxCal);
ok(withCal.calories === 412, `tcx keeps calories only when the file has them (got ${withCal.calories})`);

const gpx = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk>
    <name>Austin Road Cycling</name>
    <type>cycling</type>
    <trkseg>
      <trkpt lat="30.2672" lon="-97.7431"><time>2026-10-07T19:33:00Z</time></trkpt>
      <trkpt lat="30.2760" lon="-97.7431"><time>2026-10-07T19:43:00Z</time><extensions><gpxtpx:hr>138</gpxtpx:hr></extensions></trkpt>
    </trkseg>
  </trk>
</gpx>`;
const ride = parseGpx(gpx);
ok(ride.sport === "bike", `gpx sport bike (got ${ride.sport})`);
ok(ride.distance && ride.distance.unit === "m" && ride.distance.value > 900 && ride.distance.value < 1100, `gpx distance ~1 km (got ${JSON.stringify(ride.distance)})`);
ok(ride.duration === "10:00", `gpx duration 10:00 (got ${ride.duration})`);
ok(ride.avgHr === 138, `gpx hr 138 (got ${ride.avgHr})`);
ok(ride.calories == null, `gpx calories stay null (got ${ride.calories})`);
ok(ride.date === "2026-10-07" && ride.start === "14:33", `gpx start in Chicago (got ${ride.date} ${ride.start})`);

const shot = parseGarminText(`Trail Running
Oct 8 @ 7:35 AM
Austin Trail Running
11.35 mi
Distance
130 bpm
Avg Heart Rate
13:10 /mi
Avg Pace
2:29:25
Total Time
386 ft
Total Ascent
Base (Low Aerobic)
Primary Benefit`);
ok(shot.sport === "run", `ocr sport run (got ${shot.sport})`);
ok(shot.distance && shot.distance.value === 11.35 && shot.distance.unit === "mi", `ocr distance (got ${JSON.stringify(shot.distance)})`);
ok(shot.duration === "2:29:25", `ocr duration (got ${shot.duration})`);
ok(shot.pace === "13:10/mi", `ocr pace (got ${shot.pace})`);
ok(shot.avgHr === 130, `ocr hr 130 not a max (got ${shot.avgHr})`);
ok(shot.ascent === "386 ft", `ocr ascent (got ${shot.ascent})`);
ok(shot.calories == null, `ocr calories null when the screenshot has none (got ${shot.calories})`);
ok(shot.date == null && shot.dateLabel === "Oct 8", `ocr does not invent a year (got ${shot.date} ${shot.dateLabel})`);
ok(shot.start === "07:35", `ocr start (got ${shot.start})`);
ok(shot.zone && /Base/i.test(shot.zone), `ocr zone (got ${shot.zone})`);

const stats = parseGarminText(`Road Cycling
Avg Speed 8.5 mph
Max Speed 26.2 mph
Total Time 35:51
Moving Time 30:44
Avg Heart Rate 138 bpm
Max Heart Rate 162 bpm`);
ok(stats.sport === "bike" && stats.avgHr === 138, `stats hr is avg not max (got ${stats.avgHr})`);
ok(stats.speed === "8.5 mph", `stats speed is avg not max (got ${stats.speed})`);
ok(stats.duration === "35:51", `stats total time not moving time (got ${stats.duration})`);
ok(stats.distance == null && stats.calories == null, "stats page does not invent distance or calories");

const named = parseGarminText("Pool Swim\nCalories\n540 kcal\nTotal Time\n45:00");
ok(named.calories === 540 && named.sport === "swim", `ocr calories only from a Calories label (got ${named.calories} ${named.sport})`);

const mergedShots = coalesceActivities([shot, parseGarminText("Trail Running\nAvg Heart Rate 130 bpm\nTotal Time 2:29:25")]);
ok(mergedShots.length === 1 && mergedShots[0].distance && mergedShots[0].avgHr === 130, "same sport + duration screenshots coalesce");
ok(mergedShots[0].calories == null, "coalesce still has no calories");

function u32le(n) {
  return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255];
}
function fitBytes(extraFields, extraData) {
  const def = [0x40, 0x00, 0x00, 18, 0, 3 + extraFields.length / 3,
    9, 4, 6, 7, 4, 6, 5, 1, 0, ...extraFields];
  const start = Math.floor((Date.parse("2026-10-07T19:33:00Z") - Date.UTC(1989, 11, 31)) / 1000);
  const data = [0x00, ...u32le(815930), ...u32le(2151000), 2, ...extraData];
  const records = [...def, ...data];
  const header = [14, 0x20, 0, 0, ...u32le(records.length), 0x2e, 0x46, 0x49, 0x54, 0, 0];
  return new Uint8Array([...header, ...records]);
}
const fit = parseFit(fitBytes([], []));
ok(fit.sport === "bike", `fit sport bike (got ${fit.sport})`);
ok(fit.distance && Math.abs(fit.distance.value - 8159.3) < 0.2, `fit distance (got ${JSON.stringify(fit.distance)})`);
ok(fit.duration === "35:51", `fit duration (got ${fit.duration})`);
ok(fit.calories == null, `fit calories null when the field is absent (got ${fit.calories})`);
ok(!fit.warnings.some((w) => /not recognized/i.test(w)), `fit parsed (warnings ${fit.warnings.join("; ")})`);

const fitCal = parseFit(fitBytes([11, 2, 4], [156, 1]));
ok(fitCal.calories === 412, `fit calories when the field is present (got ${fitCal.calories})`);

const bad = parseFit(new Uint8Array([1, 2, 3, 4]));
ok(bad.calories == null && bad.warnings.length > 0, "short file is not a fit and invents nothing");

const day = { v: 1, date: "2026-10-08", workouts: [
  { id: "bike", type: "bike", status: "planned", title: "Long bike", minutes: 240 },
], checkins: [], at: 1 };
const next = mergeActivityIntoDay(day, bike, 99);
ok(next.workouts.length === 1, "planned bike of the same sport is updated, not duplicated");
ok(next.workouts[0].status === "completed", "uploaded activity marks the session completed");
ok(next.workouts[0].calories == null, `merge does not invent workout calories (got ${next.workouts[0].calories})`);
ok(next.workouts[0].distance && next.workouts[0].distance.value === 8159.3, "merge copies distance from the file");
ok(next.workouts[0].garmin && next.workouts[0].garmin.kcal == null && next.workouts[0].garmin.avg_hr === 138, "garmin kcal stays unset");

console.log(`${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
