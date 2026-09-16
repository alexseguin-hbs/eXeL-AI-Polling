// T1 · T2 · T3 and AMBER → RED — the gate for the fire rule r.050 defines.
//
// The claims, each of which a later edition could quietly loosen:
//   a designation is amber and cannot fire
//   only approve() can make red, and it must be named
//   FIRE with nothing designated is NO_RED_BOX; FIRE on amber is AMBER_NO_APPROVE — refusals, not silence
//   one object lives in one slot; replacing a slot's object drops its approval
//   solo (HI-2) and two-person approvals are both recorded and told apart
//   a slot whose door stops being actionable is dropped, not left pointing at nothing
import {
  SLOT_NS, initSlots, designate, nextFreeSlot, slotOf, approve, approvalKind, canFire,
  clearSlot, pruneSlots, slotLine, refusalToast,
} from '../lib/drone-2525/slots.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ── DESIGNATE → AMBER, AND AMBER CANNOT FIRE ────────────────────────────────────────────────────
{
  let st = initSlots();
  ok(SLOT_NS.join() === '1,2,3', 'three slots, T1 T2 T3');
  ok(canFire(st).refusal === 'NO_RED_BOX' && !canFire(st).ok, 'nothing designated: NO_RED_BOX');
  ok(slotLine(st) === 'TARGET FIRST', 'and the HUD says TARGET FIRST');

  st = designate(st, 1, 'door.capitol.1', 'Alex', 10);
  ok(st.s[1]?.phase === 'amber', 'a designation is AMBER');
  ok(st.current === 1, 'and becomes the current slot');
  ok(!canFire(st).ok && canFire(st).refusal === 'AMBER_NO_APPROVE', 'amber cannot fire: AMBER_NO_APPROVE');
  ok(canFire(st, 1).doorId === 'door.capitol.1', 'the refusal names the door it refused');
  ok(/T1 · AMBER/.test(slotLine(st)), `the HUD reads amber: "${slotLine(st)}"`);
  ok(refusalToast('AMBER_NO_APPROVE') === 'AMBER · SECOND HI APPROVE' && refusalToast('NO_RED_BOX') === 'NO RED BOX',
     'the toasts are r.050\'s, verbatim');

  ok(designate(st, 1, 'door.capitol.1', '', 11) === st, 'an unnamed designator changes nothing');
  ok(designate(st, 1, '', 'Alex', 11) === st, 'nor does an empty door');
}

// ── APPROVE → RED, AND ONLY APPROVE ─────────────────────────────────────────────────────────────
{
  let st = designate(initSlots(), 2, 'door.sam.1', 'Alex', 10);
  ok(approve(st, 2, '', 12) === st, 'an unnamed approval changes nothing');
  ok(approve(st, 1, 'Dana', 12) === st, 'approving an empty slot changes nothing');

  st = approve(st, 2, 'Dana', 12);
  ok(st.s[2]?.phase === 'red', 'a named approval makes RED');
  ok(st.s[2]?.approvedBy === 'Dana' && st.s[2]?.approvedAtMs === 12, 'and records who and when');
  ok(canFire(st).ok && canFire(st).doorId === 'door.sam.1', 'red can fire');
  ok(approvalKind(st.s[2]) === 'two-person', 'Alex designated, Dana approved: two-person');
  ok(/T2 · RED \(Dana\)/.test(slotLine(st)), `the HUD names the approver: "${slotLine(st)}"`);
  ok(approve(st, 2, 'Someone', 13) === st, 'approving a red slot again is a no-op — it does not re-stamp');

  // The solo case r.050 permits, told apart rather than hidden.
  let solo = designate(initSlots(), 1, 'door.x.1', 'Alex', 10);
  solo = approve(solo, 1, 'Alex', 11);
  ok(solo.s[1]?.phase === 'red', 'the same person may approve as HI-2');
  ok(approvalKind(solo.s[1]) === 'two-step', 'but it is recorded as two-STEP, not two-person');
  ok(/\(HI-2\)/.test(slotLine(solo)), `and the HUD says HI-2, not a second name: "${slotLine(solo)}"`);

  // The only way to red is approve(). designate() never produces it, even re-designating a red door.
  const again = designate(st, 2, 'door.sam.1', 'Alex', 20);
  ok(again.s[2]?.phase === 'red', 're-designating the same door into the same slot keeps its red');
  const moved = designate(st, 2, 'door.other.1', 'Alex', 20);
  ok(moved.s[2]?.phase === 'amber' && moved.s[2]?.approvedBy === null, 'a DIFFERENT door into that slot drops the approval — a red box is for one object');
}

// ── ONE OBJECT, ONE SLOT ────────────────────────────────────────────────────────────────────────
{
  let st = designate(initSlots(), 1, 'door.a', 'Alex', 1);
  st = designate(st, 3, 'door.a', 'Alex', 2);
  ok(st.s[1] === null && st.s[3]?.doorId === 'door.a', 'designating the same door into T3 moves it out of T1');
  ok(slotOf(st, 'door.a') === 3 && slotOf(st, 'door.zzz') === null, 'slotOf finds it, and finds nothing for a stranger');
  ok(nextFreeSlot(st) === 1, 'the next free slot is the lowest empty one');
  st = designate(designate(st, 1, 'door.b', 'Alex', 3), 2, 'door.c', 'Alex', 4);
  ok(nextFreeSlot(st) === st.current, 'with all three taken, "next free" is the current one rather than a fourth');
}

// ── CLEARING AND PRUNING ────────────────────────────────────────────────────────────────────────
{
  let st = designate(designate(initSlots(), 1, 'door.a', 'Alex', 1), 2, 'door.b', 'Alex', 2);
  st = { ...st, current: 1 };
  st = clearSlot(st, 1);
  ok(st.s[1] === null && st.current === 2, 'clearing the current slot moves current to the next occupied one');
  st = clearSlot(st, 2);
  ok(st.current === null && slotLine(st) === 'TARGET FIRST', 'clearing the last one leaves TARGET FIRST');

  let p = designate(designate(initSlots(), 1, 'door.a', 'Alex', 1), 2, 'door.b', 'Alex', 2);
  p = approve(p, 2, 'Dana', 3);
  p = pruneSlots(p, new Set(['door.b']));
  ok(p.s[1] === null && p.s[2]?.doorId === 'door.b', 'a door that stopped being actionable is dropped; the live one stays');
  ok(p.s[2]?.phase === 'red', 'and pruning does not touch a surviving red box');
  ok(pruneSlots(p, new Set()).s[2] === null, 'with nothing actionable, everything is dropped');
}

// ── DOUBLE-CLICK MUST NOT SKIP APPROVE ──────────────────────────────────────────────────────────
// A double-click is "designate then fire" in one gesture. Modelled as exactly that: the second call goes
// through canFire, which sees amber and refuses. There is no path here that designates and fires at once.
{
  let st = designate(initSlots(), 1, 'door.a', 'Alex', 1);
  const check = canFire(st, 1);
  ok(!check.ok && check.refusal === 'AMBER_NO_APPROVE', 'tap-tap on a fresh mark is a refusal, not a shot');
  ok(typeof designate.fire === 'undefined' && typeof approve.fire === 'undefined', 'and there is no designate-and-fire function to call by mistake');
}

console.log(`\ndrone-slots: ${pass} passed, ${fail} failed · T1 T2 T3 · amber cannot fire · only approve() makes red · two-step and two-person told apart`);
process.exit(fail ? 1 : 0);
