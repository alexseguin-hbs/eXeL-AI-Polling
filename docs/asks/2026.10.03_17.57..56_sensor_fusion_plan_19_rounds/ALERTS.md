# Sensor Fusion plan — risk alerts, schools and camera values (Addendum 1)

Moved verbatim out of `PLAN.md` in revision 0.17 (the Addendum 1 alert and school bullets, and the EdTech camera values).
The citations test scans this file as part of the plan. New words stay English in `AFTER_FILL`.

- **Risk alerts, a second output kind.** `detect-contract.ts` outputs an **action** or an **alert** (hazard id, picture reference, reason,
  recipient role). A camera or computer place emits only alerts. Hazards: blocked exit, spill, smoke or fire, fall, crowd building up, door
  open after hours, person in the robot's path. Each alert is one plain sentence, the reason and a link to the blurred picture. It goes to
  one named role, never a public screen. **Not through `lib/notify.ts`:** that route carries nothing but a signing request (`notify-core.js:26-27`:
  the server writes "Please sign", renames attachments `.pdf`, needs a raw address, an `Origin` and a Resend key, one mail per address per 20 s).
  **Decision 19:** (b) local-only alerts on the camera computer and paired staff devices, no server [recommended first]; or (a) later, on the
  server track, a second server-written kind `alert` in `notify-core.js`: member id → address looked up on the server, text written by the
  server, a link only, its own throttle per hazard track, the signing kind unchanged (`tests/notify-core.test.mjs`). **No picture leaves the
  site by default:** an alert is a sentence and a link that opens the blurred picture only on a **paired** staff device holding a role key;
  an attached picture needs a consent id. **Pairing:** each staff device pairs once with the camera computer through the shipped ECDH P-256
  → HKDF → AES-GCM pairing (`frontend/public/drone-2525/play.html` ~:3225, anchor `deriveKey`) with a 6-digit pairing code, never the key;
  no second protocol. That code generates its key extractable (`generateKey(..., true, ...)`), so long-lived staff role keys take a
  non-extractable path. The pairing code is single-use, expires within minutes and locks after 10 tries. The camera computer and robots
  run a Python port of the same steps, held to the browser by interop golden vectors (one transcript, one derived key). The camera computer
  runs the escalation timer for its place, and each robot runs its own. MAVLink 2 signing keys and SROS2 keystores live on the vehicle,
  never under `public/`; they rotate with the signer roster, and a revoked roster key voids the link. **Clips vs events:** field events hold
  only hashes; deleting a clip at retention writes a tombstone event, so the hash chain still verifies.
  Alerts, escalation and acknowledgement travel only on that paired channel; an unpaired device on the same LAN gets no picture and no text.
  The channel is an interface in `detect-contract.ts`; each hazard has a delivery budget, and a slower channel is
  refused for it. **Acknowledge** is an append-only field event (salted staff id, time) read by the escalation timer on the camera computer.
  Unacknowledged, the alert goes to a second named person after the time in the spec file; the staff line shows "Waiting for <role>". A
  second acknowledgement is a no-op. One alert per hazard track, then a
  cool-down. Each alert writes a field event, so cameras feed the hard cases. For a person alert a robot may only slow or stop.
- **Schools mean children; the policy is data.** The spec file holds per place: a deny list (`checkid`, `head`, `eyes`, face,
  named-person), `blurRequired`, `consentRequired` and alert routing to **role names only**. The role → member-id map stays on the camera computer, salted like
  the signature log, never under `public/` (the citations test refuses a member id, email or name there). Faces are blurred on the device before a
  picture is stored. A school picture needs a consent id in the R7 manifest, and the R9 merge refuses one without it. Consent withdrawn
  (decision 3): every card whose set hashes include that picture lapses to replay-ready until retrained. Signing refuses a camera clearance
  when any flag is unmet. Child-height person captures are a condition, taken only with consent; without it the child-height floor
  is "not ready", and no floor is ever scored on frames tagged synthetic. Retention for minors is decision 18. **Fall and crowd** report a place and a time, never
  who; crowd is a count above a threshold in a zone, and no track is kept past the cool-down. Both stay off on cameras that see minors
  until decision 20; the camera place refuses their hazard ids while it is open.
- **Camera retention.** Every field event and hard case from a camera place takes decision 18 (7 days), never decision 15 (90 days).
  Camera hard cases enter R2 only with a consent id.
- **What a teacher sees.** The staff line at 390 px ("Alert: spill near Room 12"), the blurred picture, the reason, Acknowledge. Never a
  name, a face match or a feed on a public screen. A **For schools** card (at most 8 lines) says what each alert means, that no face is
  matched, who receives it and how long a clip is kept. New words stay English in `AFTER_FILL`. Draft for the operator to approve:
  1. This camera looks for spills, smoke, blocked exits and doors left open after hours.
  2. It never recognises a face or says who anyone is.
  3. Faces are blurred on the camera before any picture is kept.
  4. An alert goes only to named staff on paired devices, never to a public screen.
  5. "Person in path" only makes a robot slow down or stop. It never names the person.
  6. Smoke alerts help staff; the building's fire alarm still does its job.
  7. Pictures of children are kept 7 days. (Any guardian-consent extension appears here only as decision 18's own value; test 40
     checks the card's number equals the spec's retention.)
  8. Ask the school office who receives alerts and how to see what is kept.

**EdTech camera values (proposed, decision 9).** Alerts only; no timing law. Gate 1 refuses a card above a hazard's time-to-alert ceiling.
**The camera values table lives in `loop-spec.draft.json`** (`cameraValues`).
Each hazard also needs at least 59 scored alerts for its p95 and a predicted-positive quota for its precision floor. **Smoke or fire is
advisory and never replaces the building's fire alarm;** if no paired staff device acknowledges within the delivery budget, the camera
computer sounds a local audible alert. False alerts at most 0.1 per camera per hour: zero false alerts in about 2.996 ÷ 0.1 ≈ 30 clear hours, from at least 30 distinct clips.
Card max age 90 days. A camera place missing any value is refused. A robot place with an alert purpose and no values row is refused (test 40).
