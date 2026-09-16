// THE PLATFORM IDENTITIES — held to r.050's own units table and <select id="plat">, not to a memory of them.
import fs from 'node:fs';
import { PLATFORMS, platformOf, flies, wingAllowed, prefersWing, mountIdOf, DEFAULT_PLATFORM } from '../lib/drone-2525/platform.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

const html = fs.readFileSync(new URL('../../docs/drone-2525/operator-deck/drone-2525_r.050.html', import.meta.url), 'utf8');
// The dropdown, in order.
const opts = [...html.matchAll(/<option value="([A-Z0-9]+)">([^<]+)<\/option>/g)].map((m) => [m[1], m[2]]).filter(([id]) => ['T1','D1Q','D1','D1F','M99','M66','ARK','R2'].includes(id));
ok(opts.length === 8, `r.050 lists eight platforms (${opts.length})`);
ok(PLATFORMS.map((p) => p.id).join(',') === opts.map((o) => o[0]).join(','), `the ids, in the deck's order: ${PLATFORMS.map((p) => p.id).join(' ')}`);
for (const [id, label] of opts) ok(platformOf(id).label === label, `${id} is labelled "${label}", as the deck labels it`);
// The units table: kind and flight.
const units = html.slice(html.indexOf('const units={'), html.indexOf('};', html.indexOf('const units={')) + 2);
for (const p of PLATFORMS) {
  const rowText = (units.match(new RegExp(`\\b${p.id}:\\{([^}]*)\\}`)) || [])[1] || '';
  const kind = (rowText.match(/kind:'([a-z]+)'/) || [])[1] ?? null;
  const flight = (rowText.match(/flight:'([a-z]+)'/) || [])[1] ?? null;
  ok(kind === p.kind, `${p.id} kind "${p.kind}" is the deck's ("${kind}")`);
  ok(flight === p.flight, `${p.id} flight ${JSON.stringify(p.flight)} is the deck's (${JSON.stringify(flight)})`);
}
// What each one may do here.
ok(PLATFORMS.filter(flies).map((p) => p.id).join(',') === 'D1Q,D1,D1F', 'three flying platforms exist on this arena: QUAD, VTOL, FOIL');
ok(PLATFORMS.filter((p) => !p.here).map((p) => p.id).join(',') === 'M99,M66,ARK,R2', 'the sea craft, the sail and the droid are dated, not hidden');
ok(!wingAllowed(platformOf('D1Q')), 'a quad has no wing');
ok(wingAllowed(platformOf('D1')) && !prefersWing(platformOf('D1')), 'the VTOL has a wing and waits for the button');
ok(wingAllowed(platformOf('D1F')) && prefersWing(platformOf('D1F')), 'the foil has a wing and takes it as soon as it may');
ok(DEFAULT_PLATFORM === 'D1' && platformOf('nonsense').id === 'D1', 'the default is the VTOL, and an unknown id falls to it');
ok(mountIdOf(platformOf('D1F')) === 'd1f-01', 'the mount id carries the platform id');
// The round and the top bar use it.
const round = fs.readFileSync(new URL('../components/drone-2525/round.tsx', import.meta.url), 'utf8');
const ux = fs.readFileSync(new URL('../components/drone-2525/command-ux1.tsx', import.meta.url), 'utf8');
ok(/data-drone-platform/.test(ux) && /disabled=\{!p\.here\}/.test(ux), 'a PLATFORM dropdown in the top bar, dated ones disabled but listed');
ok(/airframeMount\(mountIdOf\(plat\), plat\.label/.test(round), 'the flying mount is named by the platform');
ok(/disabled=\{!wingAllowed\(plat\)\}/.test(round) && /drone\.fly\.no_wing/.test(round), 'the wing button refuses by name on the quad');
ok(/prefersWing\(plat\)/.test(round) && /canTransition\(AIRFRAME, flight\)\.ok/.test(round), 'the foil takes the wing through the same legality rule');
ok(!/vtol-01/.test(round), 'no platform is hard-wired in the round');
ok((round.match(/stepFlight\(AIRFRAME/g) || []).length >= 2 && !/AIRFRAME_QUAD|AIRFRAME_FOIL/.test(round), 'one airframe model, not one per platform');

console.log(`\ndrone-platforms: ${pass} passed, ${fail} failed · 8 identities held to r.050 · D1Q no wing · D1F wing first`);
process.exit(fail ? 1 : 0);
