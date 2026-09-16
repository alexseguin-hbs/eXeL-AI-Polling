# eXeL AI feedback on Round 11 (r.050 adoption) — five non-negotiable gates

**Received:** 2026-09-16, via the operator, verbatim below. Persisted before analysis (CLAUDE.md: persist first).

---

The plan is directionally strong, but because Claude Code is in auto mode, I would tighten one thing: Round 11 should be an adoption/qualification bridge for r.050, not permission to absorb every earlier Round 8–10 idea at once. The deck already has a fairly crisp contract; the safest path is to make the repo reproduce that contract first, prove parity, and only then evolve it.

The biggest point I would feed back to Claude is that its Round 11 analysis is still slightly too generous to r.050. The uploaded file does not actually establish a local amber state when designate() runs. It records DESIGNATED … AMBER and broadcasts phase:'amber', but state.desig itself is created without phase:'amber'. Since fireN() distinguishes AMBER_NO_APPROVE only when state.desig.phase==='amber', a premature fire can fall through as NO_RED_BOX. That should be an explicit acceptance test, not just an implementation detail.

A second issue is the peer approval path. The notes promise that another tab can send {k:'APPROVE'} and turn the designation red, and approveDesig() does transmit that message. But the r.050 receive side shown in the file only updates peer/RTT/sequence state; the uploaded source does not demonstrate handling incoming APPROVE or DESIG messages. So R11-9 should explicitly prove both directions: device A designates amber → device B receives amber → B approves → A receives approval → both show the same red target and decision ID.

The rest of Claude's proposed bridge is well grounded in the deck. window.CONTROLS already declares L = BODY/WASD, R = HEAD/GIMBAL/arrows, Q/E yaw, U/J climb, T/1/2/3 targeting, F fire, C capture, voice commands, tap assignment, double-tap fire, drag gimbal, and the shared seat geometry. Porting this as data first is the right architecture because it prevents the React implementation from becoming the specification. r.050 also already implements deadzone/sensitivity/trim math and drives the R stick as pan/tilt rather than body yaw, so Claude should preserve that behavior rather than reinvent it.

I would lock the auto run behind five non-negotiable gates:

1. Deck parity before expansion. Repo behavior must reproduce the r.050 control schema, CH1–5/DIFF spine, QUAD/VTOL/FOIL identities, seat offsets, and amber→red→fire interaction before Round 8/9/10 features are allowed to modify those surfaces. tgSpec() in r.050 is already only a shim to challengeSpec(), so TG should remain dead.
2. State truth before UI truth. A TARGET action must literally create phase:'amber'; only the approval function may create phase:'red'; every fire path—F key, button, voice, double tap—must call the same gate. The notes define exactly this r.051+ contract.
3. Network parity, not just local parity. The same-device HI-2 approval can remain a documented solo simulation mode, but it must be visibly distinguished from a true second-participant approval. That distinction matters because the current UI allows the solo approval button directly.
4. Evidence integrity before the 99× regression. Fix the stale rev:'0.044' in decision and metrics records, update the replay scrubber to read verb/result, keep free-form feed strings out of the deterministic hash, and make metricsOf() derive holds/auth failures/handoffs from the same canonical source where those actions are actually recorded. r.050 already exports events, decisions, metrics, replayHash, and the non-destructive sidecar, so the architecture is there.
5. Fixture immutability. Keep ASM_CUP_99.* untouched. The old fixture establishes seed-2525 outcomes; the new sidecar establishes designation rate, holds, auth failures, handoffs, FPS, and replay hash. Those are complementary evidence sets, not one file to overwrite. That is already the doctrine in the r.042 prompt and r.050 save path.

One more important finding: the 42-aircraft Level-1 concern in Claude's Round 9 is supported by the operator deck itself. r.050 budgets swarm drawing to Math.floor(S.seg*0.55), while each craft costs AIR.glyph segments. So the later "whatever Level 1 cannot draw, nothing ships" gate is exactly the right kind of corrective test: test the production allocation, not a more generous test-only allocation.

So my recommendation for the auto run is: finish R11-0 through R11-13 as a bounded compatibility layer, prove it, then resume the larger game/42-aircraft evolution. Don't let the auto agent merge palette changes, physical-scale changes, swarm architecture, winners-circle mechanics, and operator-deck adoption into one qualification event. They are different hypotheses and should produce different revisions.

The R-CORE interpretation is particularly clean here:

r.050 = RECORD → repo adoption = REPLAY → parity tests = COMPARE → gates = QUALIFY → later game work = IMPROVE → next revision = SHARE.

That keeps the development process itself aligned with the doctrine rather than merely displaying the doctrine in the HUD.
