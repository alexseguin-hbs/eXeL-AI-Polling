// A Sensor Fusion envelope entering Drone-2525's own fire law (repo modules, strip-types). Feedback probe only.
const S = await import("/home/user/eXeL-AI-Polling/frontend/lib/drone-2525/slots.ts");
const D = await import("/home/user/eXeL-AI-Polling/frontend/lib/drone-2525/decisions.ts");
const env = { v: 1, peer: "edge-node", verb: "IDENTIFY", authority: "MARK", layers: [{ layer: 1, model: "Demo90", boxes: [{ label: "person", score: 0.73 }] }, { layer: 2, model: "Model02.Head", boxes: [{ label: "head", score: 0.98 }] }], hash: "117e81bef7592a62" };
const target = `SF-${env.hash.slice(0, 6)}`;        // the mark's id in the room: the decision hash, so both phones name it the same
const stamp = (t, actor, cur) => D.stampOf(t, actor, cur, 1, 1, 1, 0);
const log = (k, v) => console.log(k.padEnd(44), typeof v === "string" ? v : JSON.stringify(v));

// 1 · the CNN mark arrives: it may DESIGNATE (amber) in the machine's name, nothing more
let st = S.designate(S.initSlots(), S.nextFreeSlot(S.initSlots()), target, `SF:${env.layers.at(-1).model}`, 1000);
let L = D.initLedger("SF-probe");
({ ledger: L } = D.decide(L, "DESIGNATE", target, stamp(1.0, `SF:${env.layers.at(-1).model}`, st.s[1]), { source: "sensor-fusion", envelope: env.hash, authority: env.authority }));
({ ledger: L } = D.ev(L, "DESIGNATE", target, "AMBER", stamp(1.0, "SF", st.s[1]), "AI"));
log("1 machine mark → slot phase", st.s[1].phase);
log("  canFire on amber", S.canFire(st));

// 2 · the risk: if the integration passes the edge node's name as the approver, the gate cannot tell a machine from a person
const naive = S.approve(st, 1, `SF:${env.peer}`, 1500);
log("2 machine-named approve() → phase", naive.s[1].phase);
log("  approvalKind", S.approvalKind(naive.s[1]));
log("  canFire after a MACHINE approval", S.canFire(naive));

// 3 · the law as Drone-2525 means it: only a seated human approves; the integration refuses any approver whose envelope authority is MARK
const isHumanSeat = (by) => /^HI:(pilot|targeteer)$/.test(by);
const guardedApprove = (st, n, by, at) => (isHumanSeat(by) ? S.approve(st, n, by, at) : st);
const refused = guardedApprove(st, 1, `SF:${env.peer}`, 1500);
log("3 guarded approve by the machine → phase", refused.s[1].phase);
st = guardedApprove(st, 1, "HI:targeteer", 2400);
({ ledger: L } = D.decide(L, "APPROVE", target, stamp(2.4, "HI:targeteer", st.s[1])));
({ ledger: L } = D.ev(L, "APPROVE", target, "RED", stamp(2.4, "HI:targeteer", st.s[1]), "HI"));
log("  guarded approve by HI:targeteer → phase", st.s[1].phase + " · " + S.approvalKind(st.s[1]));
log("  canFire after a HUMAN approval", S.canFire(st));
({ ledger: L } = D.ev(L, "SIM-ACTION", target, "TAG", stamp(3.1, "HI:pilot", st.s[1]), "HI"));
log("4 record", L.events.map(D.feedLine));
log("  decisions", L.decisions.map((d) => `${d.decisionId} ${d.kind} ${d.actor}`));
log("  replay hash", D.replayHash(L));
