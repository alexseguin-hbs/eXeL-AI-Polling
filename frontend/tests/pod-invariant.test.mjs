// THE POD INVARIANT — Vision 2525 §14 (unit.witness · unit.accel · unit.aitoken · unit.heart · si.clockless-ladder).
//
//   Time already recorded is never lost or altered. The measured session and the claim are two numbers, never one,
//   and a claim may never exceed what the platform actually witnessed.
//
// The White Paper's rule is verbatim: "웃 is minted only for TIME CLOCKED BY THE PLATFORM." Before this gate the pod had
// no clock and minted from a hand-typed number — it minted for time CLAIMED. This file reads the shipped source and the
// shipped behaviour so that guarantee cannot be refactored away, the way the Sign Doc invariant is held.
import fs from 'fs';
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };
const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');

const clock = read('../lib/pod-clock.ts');
const base = read('../lib/pod-baseline.ts');

// 1 · the two numbers are kept apart, and the claim is bounded by the measurement
ok(/export function supported\(/.test(clock), 'a claim is passed through supported(), never used raw');
ok(/Math\.min\(claim, seen\)/.test(clock), 'a claim may never exceed what the platform witnessed');
ok(/witnessed: false/.test(clock), 'an unwitnessed claim is FLAGGED, never silently trusted');
ok(/MAX_YUG_PER_MIN\s*=\s*9999 \/ 525600/.test(clock), 'the ceiling rate is the paper\'s: 9,999 ÷ 525,600 minutes');
ok(/YUG_CEILING\s*=\s*9999/.test(clock), 'the annual ceiling is 9,999 웃 per natural person');
ok(/POD_MIN\s*=\s*3/.test(clock), 'a pod is three or more — two can agree on a lie in private');

// 2 · the clock is append-only: events fold, they do not overwrite
ok(/export function measure\(events: ClockEvent\[\]/.test(clock), 'the measured span is DERIVED from an event log');
ok(/\[\.\.\.events\]\.sort/.test(clock), 'the log is read in time order and never mutated in place');
ok(!/events\.push|events\[\d\]\s*=/.test(clock), 'nothing rewrites an event once recorded');

// 3 · the clockless ♡ ladder is exactly three rungs, fixed values, nothing between or above (D12)
const rungs = [...clock.matchAll(/\{ id: "(\w+)", hearts: (\d+) \}/g)].map((m) => [m[1], Number(m[2])]);
ok(JSON.stringify(rungs) === JSON.stringify([["none",0],["noted",1],["adopted",3],["foundational",7]]),
   `the ♡ ladder is Noted 1 · Adopted 3 · Foundational 7 and nothing else — got ${JSON.stringify(rungs)}`);

// 4 · a minute is ♡ OR 웃, never both (unit.aitoken)
ok(/settles웃 \?/.test(clock), 'a settling pod carries no per-minute ♡ for the same minutes');

// 5 · the estimate is locked BEFORE the work, signed, and hashed (unit.accel)
ok(/signedBy: string/.test(base) && /signedAt: string/.test(base) && /hash: string/.test(base),
   'a baseline carries its signer, its instant and a Replay hash');
ok(/export async function lockBaseline/.test(base) && /sha256Hex/.test(base), 'locking a baseline hashes every field');
ok(/export async function verifyBaseline/.test(base), 'a lock can be re-checked, so an edit is detectable not deniable');
ok(/version: number/.test(base) && /a re-lock appends/.test(base), 'a changed estimate APPENDS a version, never edits one');

// 6 · the six conditions are all required, none inferred, none defaulting to true
const ids = (base.match(/CONDITION_IDS[^=]*=\s*\n?\s*\[([^\]]+)\]/) || [])[1] || '';
const six = (ids.match(/"/g) || []).length / 2;
ok(six === 6, `the accelerator has exactly six conditions — found ${six}`);
ok(/noConditions = \(\)[^}]*false[^}]*false[^}]*false[^}]*false[^}]*false[^}]*false/s.test(base), 'every condition starts false');
ok(/CONDITION_IDS\.every/.test(base), 'the bonus needs ALL six, not a majority');

// 7 · the accelerator hypothesis is allowed to FAIL honestly (the paper's own instruction)
ok(/delta = baseline\.hours - actualHours/.test(base) && /Never clamped/.test(base),
   'a negative delta — the work took LONGER — is preserved, not clipped to zero');
ok(/reason: "no_locked_baseline"/.test(base) && /reason: "no_time_saved"/.test(base) && /reason: "conditions_unmet"/.test(base),
   'when nothing is earned the record says WHY');

// 8 · the two tranches (unit.tranche)
ok(/floor = Math\.max\(0, supportedHours\)/.test(base), 'the wage-floor tranche is the supported hours at 1x');
ok(/escrow = /.test(base) && /multiple - 1/.test(base), 'everything the multiple adds above the floor is escrowed');
ok(/NEVER clawed back/.test(base), 'the floor is never clawed back — the rule is stated where it is implemented');

/* ── behaviour, not just text: run the modules ─────────────────────────────────────────────────────────────────────── */
const { measure, supported, witnessedMinutes, hhmmss, heartsFor } =
  await import('../lib/pod-clock.ts').catch(() => ({}));
if (measure) {
  const t0 = 1_700_000_000_000;
  const ev = [{ kind: 'start', at: t0, by: 'a' }, { kind: 'stop', at: t0 + 3_600_000, by: 'a' }];
  const m = measure(ev, t0 + 9_999_999);
  ok(m.ms === 3_600_000 && !m.running, 'one hour measured, and a stopped clock does not keep running');
  ok(witnessedMinutes(m) === 60 && hhmmss(m.ms) === '1:00:00', 'sixty minutes read back as 1:00:00');
  ok(measure([...ev, { kind: 'start', at: t0 + 10, by: 'b' }], t0).ms === 3_600_000, 'a late duplicate start changes nothing');
  ok(supported(5, m).hours === 1 && supported(5, m).capped === true, 'a five-hour claim on a one-hour session is capped to one');
  ok(supported(0.5, m).hours === 0.5 && supported(0.5, m).capped === false, 'an honest claim passes through untouched');
  const none = measure([], t0);
  ok(supported(4, none).witnessed === false && supported(4, none).hours === 4, 'with no clock the claim stands but is flagged');
  ok(heartsFor({ settles웃: true, measured: m, rung: 'adopted' }) === 3, 'a settling pod earns ♡ only from the ladder');
  ok(heartsFor({ settles웃: false, measured: m, rung: 'none' }) === 60, 'a non-settling pod earns one ♡ per witnessed minute');
} else ok(false, 'lib/pod-clock.ts could not be imported');

const B = await import('../lib/pod-baseline.ts').catch(() => ({}));
if (B.accelerate) {
  const b = await B.lockBaseline({ id: 'POD1-1', version: 1, scope: 's', hours: 12, signedBy: 'Dana', signedAt: '2026-09-10T00:00:00Z' });
  ok(await B.verifyBaseline(b), 'a freshly locked baseline verifies');
  ok(!(await B.verifyBaseline({ ...b, hours: 2 })), 'an edited baseline FAILS verification');
  const all = { scheduleImproved: true, scopePreserved: true, qualityHeld: true, riskNotWorse: true, ssses: true, humanAccepted: true };
  ok(B.accelerate(b, 9.5, all).earned === 2.5, 'saving 2.5 hours against a 12-hour lock earns 2.5 ◬');
  ok(B.accelerate(b, 9.5, { ...all, ssses: false }).earned === 0, 'one failed condition earns nothing');
  ok(B.accelerate(b, 9.5, { ...all, ssses: false }).reason === 'conditions_unmet', 'and the record says which kind of failure');
  const slower = B.accelerate(b, 15, all);
  ok(slower.delta === -3 && slower.earned === 0, 'work that took LONGER records a negative delta and earns nothing');
  ok(B.accelerate(null, 9.5, all).reason === 'no_locked_baseline', 'no lock, no accelerator');
  const tr = B.split(9.5, 3, B.accelerate(b, 9.5, all));
  ok(tr.floor === 9.5 && Math.abs(tr.escrow - (19 + 2.5)) < 1e-9, 'the floor draws 9.5 and the rest escrows');
} else ok(false, 'lib/pod-baseline.ts could not be imported');

console.log(`pod-invariant: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
