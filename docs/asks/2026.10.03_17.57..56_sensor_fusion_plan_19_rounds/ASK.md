# Ask — 19 rounds of SSSES · SPIRAL · AsM on the Sensor Fusion plan (2026.10.03_17.57..56 CST)

> Operator, verbatim (2026.10.03):
> "AsM, SPIRAL, and SSSES test this plan after 19 revisions.  this is how we create Drone-2525 and Manta-2525 and Mass-AI detection quickly
> as global team (which takes our models and introduces it to control loops)."
>
> Clarified (AskUserQuestion answer, verbatim): "run SSSES SPIRAL AND AsM Assessment; make changes (1x round). complete this simulation 19 rounds"

The plan under test: `PLAN.md` in this folder (revision 0.00 = the v3 FINAL ask R1–R10 + the DETECT note, consolidated).
Each round: twelve reviewer lenses score SSSES, trace the SPIRAL forward and backward, and grade the plan → one editor folds the fixes →
PLAN.md revision 0.NN + `rNN.md` (the round record) → commit + push. Methods only (no code). Out of scope by design: any weapon targeting.

## Addendum 1 (2026.10.03_18.53..10 CST) — read by every round from here on

> Operator, verbatim: "control looks of for targeting, obstacle avoidance, risk identification, etc for eXeL AI robot and Mass-AI robot
> (CNNs will be be able to be jointly developed for execution on EdTech security cameras, etc)."

> Restated by the operator (2026.10.03_18.56..06 CST), verbatim — the typo corrected, same ask:
> "control loops of for targeting, obstacle avoidance, risk identification, etc for eXeL AI robot and Mass-AI robot (CNNs will be be
> able to be jointly developed for execution on EdTech security cameras, etc)."

How the rounds read it (Claude Code's reading, stated so the operator can correct it):
- **Vehicles:** a second ground robot, the **eXeL AI robot**, joins **MASS-AI** in Part C. Both use the ground loop's action set
  (continue · slow · stop with the brake held) and the same contract, spec and gate. Each robot gets its own row with its own HAL tier
  and its own safe action.
- **"Targeting" means goal targeting:** pick a marked object or place, drive to it, follow it, dock, or line up on it. This is target
  acquisition for navigation and for handling objects. The scope boundary is unchanged: no real-world weapon targeting, and no
  detecting people in order to act against them.
- **Obstacle avoidance:** the existing failure table and safe actions apply; nothing maps to "continue".
- **Risk identification:** hazards the robot or a camera can see and report — a blocked exit, a spill, smoke or fire, a fall, a crowd
  building up, an open door after hours, a person in the robot's path. Output is an alert to a named human with the picture and the
  reason. A robot may slow, stop or hold for it. It takes no action toward a person.
- **One CNN, many places:** the same model folder (three files, one `models.json` card) runs on a robot, on an EdTech security camera
  or on a computer. The card records which places a version is cleared for. A camera only alerts; it never drives anything.
- **Schools mean children.** On EdTech cameras:
  - no face recognition and no identity models (`checkid` stays off cameras and off loops);
  - faces blurred in stored pictures;
  - training pictures only with recorded consent (decision 3);
  - alerts go to named staff, never to a public screen.

## Addendum 2 (2026.10.04_03.14..53 CST) — supersedes the control-loop scope

> Operator, verbatim: "remove all control loop from plan"

Effect: revision 0.20 removes every control-loop part (Part C, loop contract and spec, vehicles, gates and ladders, SITL, field and
bench stages, loop-only decisions and tests, `loop-spec.draft.json`). The plan's scope is now Sensor Fusion capture, labelling, review,
training hand-off, time, Light Codex, and DETECT detection and display. Addendum 1's robot and camera ask is kept on record only where
it is not a control loop: cameras alert people and never drive anything. Revisions 0.01–0.19 stay in git history and `r01`–`r19`.

## Addendum 3 (2026.10.04_03.38..50 CST) — alerting becomes a Sensor Fusion setting

> Operator, verbatim (asked whether school-camera alerts were meant to be dropped): "Alerting if works should be a SF setting"

Read together with the operator's revision 0.21 ("Alerts are all on. There is no school-alert mode."): revision 0.22 adds R11, one
**Alerts** setting in Sensor Fusion Settings. When it is on, every alert is on together. There are no categories and no place-based
mode. "If works" means a self-test must pass before the setting can be on. Alerts tell a person; they never drive anything.
