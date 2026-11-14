// LOCK today's Security-2525 Mission Planning features with a source-scan gate.
//
// Two features shipped into components/security-2525/mission-planning.tsx but were ungated:
//   (1) a GPS "my position" button + marker (navigator.geolocation, secure-context guarded, with a
//       user-facing "Location Services" hint and a console "[gps] fix refused" trail), and
//   (2) a coordinate ✎ EDIT button on Active Items rows (Pencil icon, "Edit coordinate" affordance),
//       with the fix threaded to the map pane via a myPos PaneProp.
// An ungated feature is a feature the next refactor silently removes. This test reads the source and
// asserts each load-bearing identifier is still present, so a regression fails the build instead of a user.
//
// Pure file read — no deps, no network, no git — so it runs cheaply in test:ci.
import fs from 'node:fs';
import path from 'node:path';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const HERE = path.dirname(new URL(import.meta.url).pathname);
const FE = path.resolve(HERE, '..');
const SRC = path.join(FE, 'components', 'security-2525', 'mission-planning.tsx');

ok(fs.existsSync(SRC), 'mission-planning.tsx exists');
const src = fs.existsSync(SRC) ? fs.readFileSync(SRC, 'utf8') : '';

// (1) GPS: the browser geolocation call, guarded by a secure-context check, with the operator-facing
//     "Location Services" hint, a "[gps] fix refused" diagnostic trail, and the LocateFixed control icon.
ok(/navigator\.geolocation\.getCurrentPosition/.test(src), 'GPS: calls navigator.geolocation.getCurrentPosition');
ok(/isSecureContext/.test(src), 'GPS: guards on isSecureContext');
ok(/\[gps\] fix refused/.test(src), 'GPS: logs "[gps] fix refused" on failure');
ok(/Location Services/.test(src), 'GPS: user-facing "Location Services" hint present');
ok(/LocateFixed/.test(src), 'GPS: LocateFixed control icon present');

// (2) MY POS marker rendered on the map.
ok(/MY POS/.test(src), 'MY POS: current-position marker label present');

// (3) Coordinate ✎ EDIT button on Active Items rows.
ok(/Edit coordinate/.test(src), 'EDIT: "Edit coordinate" affordance present');
ok(/Pencil/.test(src), 'EDIT: Pencil icon present');

// (4) The GPS fix is threaded into the map pane via PaneProps.
ok(/myPos\?: \{ lat/.test(src), 'PaneProps: myPos?: { lat ... } threaded into the pane');

console.log(`\nmission-planning-gps-edit: ${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
