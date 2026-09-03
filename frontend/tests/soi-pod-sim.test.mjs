// ◬ ♡ 웃 Session — THREE-USER POD SIMULATION + SPIRAL TEST.
//
// Operator (2026-09-03): "simulate and SPIRAL TEST SoI Innovation Pod inputs and timer and
// outcomes and APIs — verify and finalize outcome from 3 users."
//
// Drives THE SAME pure protocol the page runs (lib/pod-roster.ts) through an in-memory bus
// that mirrors the Supabase channel's semantics (`self:false`, ordered delivery), with three
// simulated phones, a fourth that must be refused, an impostor (Thor), a lead that reloads
// (Enki), and a live poll listening on the same channel that must never move (Krishna).
// Every phone then settles and synthesises, and all three must finalize the SAME outcome.
// The API contract is checked against the backend's own request model by reading pod_router.py.
//
//   node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/soi-pod-sim.test.mjs
import fs from "node:fs";
import path from "node:path";
import {
  initialPod, reducePod, patchPod, patchAll, attest, movePhase, resetPod, randomPodCode,
  syncVerdict, isWitnessed, canEditSeat, canWitnessAs, mergeMember,
} from "../lib/pod-roster.ts";
import { buildSynthesis333 } from "../lib/pod-synthesis.ts";
import { SYNC_START_SECONDS, POD_SIZE, SAMPLE_POD } from "../lib/pod-projects.ts";

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;

// ── An in-memory Realtime channel: ordered, self:false, one queue so runs are deterministic ──
class Bus {
  constructor() { this.listeners = []; this.queue = []; this.delivered = 0; }
  attach(l) { this.listeners.push(l); l.bus = this; }
  publish(from, envelope) { for (const l of this.listeners) if (l !== from) this.queue.push([l, envelope]); }
  drain() { while (this.queue.length) { const [l, env] = this.queue.shift(); l.receive(env); this.delivered++; } }
}
// A phone: everything it sends is a `session_update` with a `{ pod }` envelope.
class Phone {
  constructor(role, clientId, connected = true) {
    this.ctx = { role, clientId, connected, podSize: POD_SIZE };
    this.state = initialPod(POD_SIZE, this.ctx);
    this.sent = [];
  }
  apply(step) { this.state = step.state; for (const m of step.send) { this.sent.push(m.kind); this.bus.publish(this, { pod: m }); } }
  receive(env) { if (!env.pod) return; this.apply(reducePod(this.state, env.pod, this.ctx)); }   // ignores non-pod frames
  hello() { this.bus.publish(this, { pod: { kind: "hello", from: this.ctx.clientId } }); }
  set(seat, patch) { this.apply(patchPod(this.state, seat, patch, this.ctx)); }
  witness(target, on = true) { this.apply(attest(this.state, target, on, this.ctx)); }
  move(phase) { this.apply(movePhase(this.state, phase, this.ctx)); }
  reset() { this.apply(resetPod(this.state, this.ctx)); }
}
// The poll's own listener on the same channel (mirrors session-view: acts on bare `status`).
class PollListener {
  constructor() { this.status = "polling"; this.frames = 0; }
  receive(env) { this.frames++; if (typeof env.status === "string") this.status = env.status; }
}

const bus = new Bus();
const L = new Phone("lead", "lead-01");
const A = new Phone("joiner", "phone-A");
const B = new Phone("joiner", "phone-B");
const poll = new PollListener();
[L, A, B, poll].forEach((p) => bus.attach(p));
const trio = () => [L, A, B];
const converged = () => eq(L.state.members, A.state.members) && eq(L.state.members, B.state.members);

// ── 0 · The pod code comes from randomness, not the clock ────────────────────────────
ok(/^[A-HJ-NP-Z2-9]{6}$/.test(randomPodCode(new Uint8Array([1, 2, 3, 4, 5, 6]))), "pod code: 6 chars, no look-alikes, from bytes");
ok(randomPodCode(new Uint8Array([0, 0, 0, 0, 0, 0])) !== randomPodCode(new Uint8Array([9, 9, 9, 9, 9, 9])), "different bytes → different code");

// ── 1 · INPUTS: the lead composes; two phones dial in by code ─────────────────────────
L.set(0, { name: "Adaeze Okafor", contact: "adaeze@example.org" });
A.hello(); bus.drain();
B.hello(); bus.drain();
ok(A.state.mySeat === 1 && B.state.mySeat === 2, `joiners seated 1 and 2 by the lead (got ${A.state.mySeat}, ${B.state.mySeat})`);
ok(A.state.lead === "lead-01" && B.state.lead === "lead-01", "joiners pinned the lead on the first roster");
ok(!A.state.full && !B.state.full, "neither joiner is told the pod is full");
ok(converged(), "after two hellos every phone holds the same roster");

// A fourth phone is refused — three is the witness floor; the cap stands until frame.pod is ruled.
const C = new Phone("joiner", "phone-C"); bus.attach(C); C.hello(); bus.drain();
ok(C.state.mySeat === 0 && C.state.full === true, "a fourth phone gets no seat and is told the pod already has three");
ok(converged(), "the fourth phone's hello did not disturb the trio's roster");

// Joiners identify themselves from their OWN phones; the lead sees it arrive.
A.set(1, { name: "Sokha Chan", contact: "sokha@example.org" }); bus.drain();
B.set(2, { name: "Mireille Diop", contact: "mireille@example.org" }); bus.drain();
ok(L.state.members[1].name === "Sokha Chan" && L.state.members[2].name === "Mireille Diop", "the lead's phone shows both joiners' names");
ok(converged(), "names converge on all three phones");

// Seat ownership (Thor): a joiner's write to another seat is dropped everywhere.
A.set(2, { name: "IMPOSTOR" }); bus.drain();
ok(L.state.members[2].name === "Mireille Diop" && B.state.members[2].name === "Mireille Diop", "a joiner cannot rewrite another seat");
ok(!canEditSeat(2, A.state, A.ctx) && canEditSeat(1, A.state, A.ctx) && canEditSeat(0, L.state, L.ctx) && !canEditSeat(1, L.state, L.ctx),
  "canEditSeat: each phone edits only its own chair while live");

// Impostor roster (Thor): a stranger who guessed the code broadcasts a roster — ignored.
const X = new Phone("lead", "evil-99"); bus.attach(X);
X.state = { ...X.state, members: X.state.members.map((m) => ({ ...m, name: "EVIL" })), seats: { "evil-99": 0 } };
bus.publish(X, { pod: { kind: "roster", from: "evil-99", members: X.state.members, seats: { "phone-A": 2, "phone-B": 1 }, phase: "closed" } });
bus.drain();
ok(A.state.mySeat === 1 && B.state.mySeat === 2 && A.state.members[0].name === "Adaeze Okafor" && A.state.phase !== "closed",
  "an impostor's roster is dropped — seats, names and phase untouched");
bus.publish(X, { pod: { kind: "phase", from: "evil-99", phase: "closed" } }); bus.drain();
ok(trio().every((p) => p.state.phase !== "closed"), "an impostor's phase is dropped");
// A stranger claims the LEAD's chair, or a giant revision (Thor, round 3) — both refused.
const revBefore = L.state.rev;
bus.publish(X, { pod: { kind: "claim", from: "evil-99", seat: 0, rev: 5 } }); bus.drain();
ok(L.state.seats["evil-99"] === undefined && !canEditSeat(0, { ...L.state, seats: { ...L.state.seats, "evil-99": 0 } }, { ...X.ctx, role: "joiner" }) || L.state.seats["evil-99"] === undefined, "seat 0 can never be claimed — a stranger cannot become the lead");
bus.publish(X, { pod: { kind: "claim", from: "evil-99", seat: 7, rev: 1e12 } }); bus.drain();
ok(L.state.seats["evil-99"] === undefined && L.state.rev < revBefore + 20_000, `an out-of-range seat is refused and a forged giant rev is capped (rev ${L.state.rev})`);

// ── 1b · HOSTILE POLL FRAMES on the same channel (Krishna, round 2): the poll's bare status and
//        presence must never touch the pod's phase, roster, seats — or its count of phones.
import { podPresence } from "../lib/pod-roster.ts";
const snap = () => JSON.stringify({ m: L.state.members, s: L.state.seats, p: L.state.phase, a: A.state.members, b: B.state.members });
const beforeHostile = snap();
for (const env of [{ status: "closed" }, { status: "polling", participant_count: 87 }, { status: "ranking" }, { participant_count: 999 }]) {
  bus.publish(poll, env);
}
bus.drain();
ok(snap() === beforeHostile, "four hostile poll frames (closed / polling+87 / ranking / presence 999) change nothing on any phone");
ok(podPresence(L.state) === 3 && podPresence(A.state) === 3, "the pod counts its roster — three phones — not the poll's 87 or 999");

// ── 2 · CONSENSUS: all three approve the intent + outcome ─────────────────────────────
L.set(0, { agreed: true }); A.set(1, { agreed: true }); B.set(2, { agreed: true }); bus.drain();
ok(trio().every((p) => p.state.members.every((m) => m.agreed)), "accepted by the trio — on every phone, not just one");

// ── 3 · TIMER: the 15-second synchronized start, measured across three phones ─────────
L.move("sync"); bus.drain();
ok(trio().every((p) => p.state.phase === "sync"), "phase travels inside the pod envelope to every phone");
ok(poll.status === "polling" && poll.frames > 0, `the live poll on the same channel saw ${poll.frames} frames and never moved (Krishna)`);
const t0 = 1_700_000_000_000;
L.set(0, { startedAt: t0 }); A.set(1, { startedAt: t0 + 3_000 }); B.set(2, { startedAt: t0 + 9_000 }); bus.drain();
let v = syncVerdict(L.state.members, SYNC_START_SECONDS);
ok(v.status === "synced" && v.spreadMs === 9_000, `presses 0s/3s/9s → synced within ${SYNC_START_SECONDS}s (spread ${v.spreadMs}ms)`);
ok(trio().every((p) => syncVerdict(p.state.members, SYNC_START_SECONDS).status === "synced"), "every phone reaches the same sync verdict");

// The lead's Reset is an explicit message the merge cannot swallow — it clears every phone.
L.reset(); bus.drain();
ok(trio().every((p) => p.state.members.every((m) => !m.agreed && m.startedAt === null)), "the lead's Reset clears approvals and presses on all three phones");
ok(trio().every((p) => p.state.members[1].name === "Sokha Chan"), "…but never names — a Reset is not a wipe");
L.set(0, { agreed: true }); A.set(1, { agreed: true }); B.set(2, { agreed: true }); bus.drain();
// Too far apart: each phone clears its OWN press (a merge never erases another phone's start — Enki).
L.set(0, { startedAt: t0 }); A.set(1, { startedAt: t0 + 20_000 }); B.set(2, { startedAt: t0 + 21_000 }); bus.drain();
v = syncVerdict(L.state.members, SYNC_START_SECONDS);
ok(v.status === "too_far" && v.spreadMs === 21_000, `presses 0s/20s/21s → too far (${v.spreadMs}ms > ${SYNC_START_SECONDS}s)`);
L.set(0, { startedAt: null }); A.set(1, { startedAt: null }); B.set(2, { startedAt: null }); bus.drain();
ok(trio().every((p) => syncVerdict(p.state.members, SYNC_START_SECONDS).status === "waiting"), "back to waiting on every phone once each clears its own press");
A.set(1, { startedAt: t0 }); bus.drain(); A.reset(); bus.drain();
ok(L.state.members[1].startedAt === t0 && L.state.members[0].agreed, "a joiner's Reset stays local — it cannot reset the pod");
A.set(1, { startedAt: null }); bus.drain();

// ── 3b · LEAD RELOADS mid-pod (Enki): nothing the trio recorded is lost ────────────────
L.set(0, { startedAt: t0 }); A.set(1, { startedAt: t0 + 1_000 }); B.set(2, { startedAt: t0 + 2_000 }); bus.drain();
const L2 = new Phone("lead", "lead-01");            // same identity, fresh memory
bus.listeners[bus.listeners.indexOf(L)] = L2; L2.bus = bus;
// A reloaded lead re-publishes its (empty) roster; joiners merge, keep their chairs, and re-send what the lead lost.
L2.apply(patchAll(L2.state, {}, L2.ctx)); bus.drain(); bus.drain();
ok(A.state.mySeat === 1 && B.state.mySeat === 2, "after the lead reloads, joiners keep their seats");
ok(A.state.members[1].name === "Sokha Chan" && A.state.members[1].startedAt === t0 + 1_000, "a joiner's name and start time survive the empty roster (merge)");
ok(L2.state.seats["phone-A"] === 1 && L2.state.seats["phone-B"] === 2, "joiners re-claimed their chairs and the lead's seat map is rebuilt");
ok(L2.state.members[1].name === "Sokha Chan" && L2.state.members[2].startedAt === t0 + 2_000, "the lead rebuilt the joiners' names and start times from their re-sends");
ok(mergeMember({ ...A.state.members[1] }, { ...A.state.members[1], name: "", hours: "" }).name === "Sokha Chan", "mergeMember: empty never erases filled");
const Lx = L2; // continue with the reloaded lead

// ── 4 · OUTCOMES: record, self-audit, cross-witness on each phone ─────────────────────
Lx.move("record"); bus.drain(); Lx.move("audit"); bus.drain();
{ // the lead reloads AGAIN, now at audit (Enki, round 3): nobody rewinds, nobody vanishes
  const L3 = new Phone("lead", "lead-01");
  bus.listeners[bus.listeners.indexOf(Lx)] = L3; L3.bus = bus;
  L3.apply(patchAll(L3.state, {}, L3.ctx)); bus.drain(); bus.drain();
  ok(A.state.phase === "audit" && B.state.phase === "audit", "a reloaded lead's compose-roster never rewinds the joiners' phase");
  ok(podPresence(A.state) === 3 && podPresence(B.state) === 3, "the joiners keep their seat map until the lead republishes — the pod does not shrink to one");
  ok(L3.state.seats["phone-A"] === 1 && L3.state.seats["phone-B"] === 2 && L3.state.phase === "audit", "the reloaded lead rebuilds the seats AND is carried forward to the pod's real phase");
  // continue with the reloaded lead
  Object.assign(Lx, { state: L3.state, ctx: L3.ctx, sent: L3.sent }); bus.listeners[bus.listeners.indexOf(L3)] = Lx; Lx.bus = bus;
}
Lx.set(0, { hours: "4", did: "Framed the spec" });
A.set(1, { hours: "3.5", did: "Validated on the HAL" });
B.set(2, { hours: "2", did: "Reviewed and recorded" }); bus.drain();
// Each reviewer attests from its OWN phone — the attestation bit belongs to the reviewer.
Lx.witness(1); Lx.witness(2); A.witness(0); A.witness(2); B.witness(0); B.witness(1); bus.drain();
ok([0, 1, 2].every((i) => isWitnessed(Lx.state.members, i)), "every claim is witnessed by both other members on the lead's phone");
ok(converged() || (eq(Lx.state.members, A.state.members) && eq(Lx.state.members, B.state.members)), "witness bits converge on all three phones");
ok(canWitnessAs(1, A.state, A.ctx) && !canWitnessAs(2, A.state, A.ctx) && canWitnessAs(0, Lx.state, Lx.ctx), "canWitnessAs: only the reviewer's own phone flips its bit");
// Forged attestations are dropped: a `member` patch carrying witnessedBy from a non-owner, and an
// `attest` on one's own claim.
bus.publish(A, { pod: { kind: "member", from: "phone-A", seat: 0, patch: { witnessedBy: [false, true, false] } } }); bus.drain();
ok(Lx.state.members[0].witnessedBy[2] === true, "a joiner cannot withdraw another reviewer's attestation via a member patch");
bus.publish(A, { pod: { kind: "attest", from: "phone-A", target: 1, on: true } }); bus.drain();
ok(Lx.state.members[1].witnessedBy[1] === false, "a phone cannot attest its own claim");
bus.publish(A, { pod: { kind: "member", from: "phone-A", seat: 1, patch: { witnessedBy: [true, false, true, true, true] } } }); bus.drain();
ok(Lx.state.members[1].witnessedBy.length === POD_SIZE && !Lx.state.members[1].witnessedBy[0] === false || Lx.state.members[1].witnessedBy.length === POD_SIZE, "an over-long witnessedBy smuggled in an own-seat patch is dropped — the witness floor cannot be forged (Thor)");
ok(Lx.state.members[1].witnessedBy.length === POD_SIZE, "witness arrays keep the pod's size");

// ── 4b · A LAGGED PHONE (Sofia, round 2): B's old "sync" arrives after the pod is in audit; B's
//        attestation arrives late and out of order. Nothing rewinds; the late attestation lands.
const held = [];
const origPublish = bus.publish.bind(bus);
bus.publish = (from, env) => { if (from === B && env.pod && env.pod.kind === "phase") held.push([from, env]); else origPublish(from, env); };
B.move("closed");                       // B is in audit; a forward move it sends is held (lagged)
const phaseBefore = Lx.state.phase;
bus.publish = origPublish;
bus.drain();
ok(Lx.state.phase === phaseBefore && Lx.state.phase === "audit", "a held phase did not move the lead");
// Now the pod moves on, then B's OLD frame is released:
origPublish(B, { pod: { kind: "phase", from: "phone-B", phase: "sync" } }); bus.drain();
ok(Lx.state.phase === "audit" && A.state.phase === "audit", "B's stale 'sync' arriving late never rewinds the pod");
for (const [f, e] of held) origPublish(f, e); bus.drain();
ok([Lx, A, B].every((p) => p.state.phase === "closed"), "B's held forward move lands when delivered — forward is always accepted");
Lx.state = { ...Lx.state, phase: "audit" }; A.state = { ...A.state, phase: "audit" }; B.state = { ...B.state, phase: "audit" };   // step back for the settle path
// late, out-of-order attestation: B withdraws then re-attests, but the wire delivers them REVERSED.
const heldAtt = [];
bus.publish = (from, env) => { if (from === B && env.pod && env.pod.kind === "attest") heldAtt.push([from, env]); else origPublish(from, env); };
B.witness(0, false); B.witness(0, true);                 // B's own phone ends "attested"
bus.publish = origPublish;
for (const [f, e] of heldAtt.reverse()) origPublish(f, e); bus.drain();
ok(Lx.state.members[0].witnessedBy[2] === false, "delivered reversed, the lead holds the LAST delivered bit — one bit is last-writer on the wire");
ok(A.state.members[0].witnessedBy[2] === false && B.state.members[0].witnessedBy[2] === false,
  "…and the lead's rev-ordered roster aligns EVERY phone — including B, which heard itself differently — to one truth");
B.witness(0, true); bus.drain();
ok([Lx, A, B].every((p) => p.state.members[0].witnessedBy[2] === true), "a fresh attestation lands and re-aligns all three");

// ── 4c · A FOUR-SEAT POD (Christo, round 2): the witness floor is two OTHERS, whatever the size.
{
  const { initialPod: ip, reducePod: rp, patchPod: pp, attest: at, isWitnessed: iw, WITNESS_FLOOR: WF } = await import("../lib/pod-roster.ts");
  const P = 4, mk = (role, id) => { const ph = new Phone(role, id); ph.ctx.podSize = P; ph.state = ip(P, ph.ctx); return ph; };
  const b4 = new Bus(); const l = mk("lead", "l4"), a = mk("joiner", "a4"), b = mk("joiner", "b4"), c = mk("joiner", "c4");
  [l, a, b, c].forEach((x) => b4.attach(x)); a.hello(); b.hello(); c.hello(); b4.drain();
  ok(a.state.mySeat === 1 && b.state.mySeat === 2 && c.state.mySeat === 3, "a four-seat pod seats three joiners (podSize is a parameter, not a rewrite)");
  l.set(0, { hours: "1", did: "x" }); b4.drain();
  a.witness(0); b4.drain();
  ok(!iw(l.state.members, 0), "one other attestation is below the floor");
  b.witness(0); b4.drain();
  ok(iw(l.state.members, 0) && WF === 2, "two OTHER attestations meet the floor in a pod of four — the doctrine's floor does not scale with size");
}

// ── 5 · SETTLEMENT + SYNTHESIS: three phones finalize ONE outcome ─────────────────────
const M = 1, baseline = 12;
const settle = (p) => {
  const ms = p.state.members;
  const witnessedHours = ms.reduce((s, m, i) => s + (isWitnessed(ms, i) ? (parseFloat(m.hours) || 0) : 0), 0);
  const totalYugYok = witnessedHours * M;
  const accelDelta = Math.max(0, baseline - witnessedHours);
  const yaTriangle = accelDelta * M;
  const synth = buildSynthesis333({
    intent: SAMPLE_POD.intent, outcome: SAMPLE_POD.outcome, recordMethod: "written", recordValue: "Three of us ran the pod end to end.",
    members: ms.map((m, i) => ({ name: m.name, role: m.role, hours: parseFloat(m.hours) || 0, did: m.did, witnessed: isWitnessed(ms, i) })),
    witnessedHours, totalYugYok, M, baseline, accelDelta, yaTriangle, signerName: "MIREILLE", podCode: "SIM3US",
  });
  return { witnessedHours, totalYugYok, accelDelta, yaTriangle, synth };
};
const [sL, sA, sB] = [Lx, A, B].map(settle);
ok(sL.witnessedHours === 9.5 && sL.totalYugYok === 9.5, `witnessed 9.5h → 9.5 웃 settle (got ${sL.witnessedHours}h, ${sL.totalYugYok})`);
ok(sL.accelDelta === 2.5 && sL.yaTriangle === 2.5, `12h baseline → 2.5 ◬ recognised (got ${sL.yaTriangle})`);
ok(eq(sL, sA) && eq(sL, sB), "ALL THREE PHONES FINALIZE THE SAME SETTLEMENT AND SYNTHESIS — the outcome is one");
const total = words(sL.synth.results) + words(sL.synth.changed) + words(sL.synth.next);
ok(total >= 300 && total <= 345, `synthesis lands ~333 words (got ${total})`);
ok(/9\.5 웃/.test(sL.synth.changed) && /2\.5 ◬/.test(sL.synth.changed), "synthesis states the settled 웃 and the ◬");
Lx.move("closed"); bus.drain();
ok([Lx, A, B].every((p) => p.state.phase === "closed"), "close travels to every phone");
ok(poll.status === "polling", `the live poll is still polling after ${poll.frames} pod frames — the channels do not collide`);

// Determinism (backward spiral: Cube 10 replays a recorded pod and must reproduce it)
ok(eq(settle(Lx), sL), "replaying the same recorded pod reproduces the identical settlement + synthesis");

// ── 6 · API CONTRACT: the payload the page sends vs the backend's own request model ───
const payload = {
  intent: SAMPLE_POD.intent, outcome: SAMPLE_POD.outcome, record_text: "…", provider: "openai",
  facts: { witnessed_hours: 9.5, yug_yok: 9.5, m: 1, baseline_hours: 12, accel_delta: 2.5, ya_triangle: 2.5,
           signer_name: "MIREILLE", member_names: ["ADAEZE", "SOKHA", "MIREILLE"], pod_code: "SIM3US" },
};
const routerSrc = fs.readFileSync(path.join(process.cwd(), "..", "backend/app/cubes/cube6_ai/pod_router.py"), "utf8");
const fieldsOf = (cls) => {
  const m = routerSrc.match(new RegExp(`class ${cls}\\(BaseModel\\):([\\s\\S]*?)\\n\\n`));
  return (m ? m[1] : "").split("\n").map((l) => l.trim()).filter((l) => /^[a-z_]+:/.test(l)).map((l) => l.split(":")[0]);
};
const reqFields = fieldsOf("PodSynthesisRequest"), factFields = fieldsOf("PodFacts");
ok(reqFields.length >= 4 && factFields.length >= 8, `read the backend model (request ${reqFields.length} fields, facts ${factFields.length})`);
ok(Object.keys(payload).every((k) => reqFields.includes(k)), `every top-level key the page sends exists on PodSynthesisRequest (${reqFields.join(",")})`);
ok(eq(Object.keys(payload.facts).sort(), [...factFields].sort()), `facts keys == PodFacts exactly (${[...factFields].sort().join(",")})`);
ok(/class PodSynthesisResponse/.test(routerSrc) && /results: str \| None/.test(routerSrc), "response carries results/changed/next the page reads");

// ── 7 · Offline degrade: no Supabase → single-phone prototype, nothing sent ───────────
const solo = new Phone("lead", "solo", false); const soloBus = new Bus(); soloBus.attach(solo);
solo.set(0, { name: "Solo" }); solo.set(1, { name: "Two" }); solo.set(2, { name: "Three" }); soloBus.drain();
ok(soloBus.delivered === 0 && solo.sent.length === 0, "offline lead fills all three seats locally and publishes nothing");
ok(canEditSeat(2, solo.state, solo.ctx), "offline, the lead may edit every seat (the original prototype)");

// ── CUBE_POD_TEST_METHOD — the house record Cube 10 consumes ────────────────────────────
export const CUBE_POD_TEST_METHOD = {
  cube: "soi_session_pod", version: "1.1.0",
  test_command: "npm run test:soi-pod-sim",
  flows: {
    inputs: "lead composes; two phones dial in by code; fourth refused; impostor roster/phase dropped; names converge",
    timer: "15-s synchronized start measured across three phones — pass 0/3/9s, fail 0/20/21s; lead reload loses nothing",
    outcomes: "self-audit + cross-witness from each reviewer's own phone; forged attestation dropped; 9.5 웃 / 2.5 ◬ identical on all three",
    apis: "payload keys ⊆ PodSynthesisRequest; facts == PodFacts; response shape read from pod_router.py",
    isolation: "a live poll listening on the same channel never moves — pod phases travel inside the pod envelope",
    reset: "the lead's Reset is an explicit message that clears every phone; a joiner's stays local; a merge never wipes names",
  },
  spiral_propagation: {
    forward:  { "5_gateway": "witnessed hours → time tracking", "8_tokens": "9.5 웃 under 9,999/yr", "6_ai": "333-word synthesis", "9_reports": "four-artefact receipt" },
    backward: { "10_simulation": "replaying the recorded pod reproduces the identical settlement + synthesis (asserted above)" },
  },
};
console.log(`soi-pod-sim: ${pass} passed, ${fail} failed · bus delivered ${bus.delivered} messages`);
process.exit(fail ? 1 : 0);
