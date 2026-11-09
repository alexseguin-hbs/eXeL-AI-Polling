# SensorFusion — Anonymous seats, ♡ work credit, class reuse, WORK TRACEABILITY
**Phase A proposal only — NO product change until user approves.**  
Dated **2026-11-09** (America/Chicago) · Worker 3 · maps every item to a CRS id.

Related verified work (cite only verified SHAs):
- PR #16 merged `2026-11-09T13:27:30Z` — correction binding / no impersonation (`054_sensor_fusion_correction_binding.sql`).
- PR #20 merged `56c24257` — Auth0 audience prep (CRS-24.02); mock mode **not** flipped.
- API deploy **api-v1n** Worker version `53a50280-de69-42b6-80c2-92b1a56af2f1` (AUTH0_API_AUDIENCE live on Worker).
- E2E re-run evidence: `/workspace/research-exel/artifacts/e2e-launch/` (after api-v1n).

---

## 0. Existing Trinity token rules (REUSE — do not invent rates)

Source of truth in code/config (not invented):

| Token | Meaning | Rule (implemented) | Config |
|-------|---------|-------------------|--------|
| **♡** | **S.I.** Shared Intent / Shared Intention | Per time-entry: `♡ = ceil(duration_minutes)` (`calculate_tokens` in `backend/app/cubes/cube5_gateway/service.py`). Public cube5 stop re-derives as **floor(accumulated public minutes)** delta (HP-38). Login join credit: **♡ = `login_heart_tokens` (default 1.0)**. | `LOGIN_HEART_TOKENS=1.0` |
| **◬** | **A.I.** Artificial Intelligence / Unity | `◬ = ♡ × unity_heart_multiplier` (default **5**) | `UNITY_HEART_MULTIPLIER=5.0` |
| **웃** | **H.I.** Human Intelligence | `웃 = duration_min × (jurisdiction_rate/60)` **only when** `human_enabled=True` | **`human_enabled: bool = False`** today — “Flip to True when treasury funded” (`config.py`) |

**CRS already covering this:** CRS-19.01–19.02, CRS-25 / CRS-25.01, CRS-32–34, Requirements §6.1–6.2.

**For SensorFusion education labeling until H.I. is funded:** credit **♡ (and ◬=5×♡)** only. **Do not mint 웃** while `human_enabled` is false. No new ♡/minute rate — reuse Cube 5 `calculate_tokens` / login defaults.

**Gap to report (not invented):** There is **no existing per-annotation ♡ rate** in Cube 8 / CRS-25 (tokens are **time-based**, plus login ♡1). Proposal therefore credits annotation work via **measured active labeling time** (same ♡=ceil(minutes) per closed time entry), optionally plus the existing **login ♡1** when a seat joins a project session — not a new “♡ per box” constant.

---

## 1. CENTRAL — SensorFusion WORK TRACEABILITY (user t152u)

Every label, edit, correction, review, and class-merge must be attributable and exportable.

### 1.1 Required fields on every work event (append-only)

| Field | Source |
|-------|--------|
| `actor_uid` | Supabase `auth.uid()` (OAuth **or** anonymous auth user id) — **never** free-typed name alone |
| `display_name` | Canonical seat name from `sensor_fusion_members.display_name` (PR #16 keying) |
| `is_anonymous` | Seat flag |
| `project_id` | Project scope |
| `picture_id` / image ref | Existing labels/pictures |
| `event_type` | `label_create` · `label_edit` · `correction` · `review_l2` · `class_merge` · `session_start` · `session_stop` |
| `class_id` / `class_name` | Shared project class (see §3) |
| `box` before/after | Geometry + class (corrections already append-only in `sensor_fusion_label_corrections`) |
| `at` timestamptz | Server time |
| `duration_ms` / linked `time_entry_id` | Active time for this bout |
| `delta_heart` / `delta_unity` / `delta_human` | Ledger deltas (웃=0 while HI unfunded) |
| `ledger_row_id` | FK/ref into token ledger when credited |

### 1.2 Storage shape (proposed migration — not applied)

- New append-only table e.g. `sensor_fusion_work_events` (or extend corrections + add parallel event log for L1 creates/edits and merges).
- Preserve existing `sensor_fusion_label_corrections` append-only behavior (PR #16 / 054).
- RLS: project members **SELECT** own project; **INSERT** only as `actor_uid = auth.uid()` (RESTRICTIVE, same spirit as 054).
- Export: `GET`/CSV per `actor_uid` and per `project_id` (Cube 9 style — CRS-35.02 analogue for SF).

### 1.3 CRS sub-items (NEW — dated 2026-11-09)

Parent anchors: **CRS-19** (engagement/time), **CRS-24** (audit/RBAC), **CRS-25** (Trinity tokens), **CRS-32** (token attribution), **CRS-05** (anonymous vs identified).

| CRS id | Statement |
|--------|-----------|
| **CRS-19.07** | SensorFusion records per-user active labeling/review time with start/stop (Cube-5-compatible time entries or SF-local clock persisted to DB), attributable to `auth.uid()`. *(Proposed 2026-11-09)* |
| **CRS-19.08** | SensorFusion work log is append-only: label create/edit, Level-2 correction/review, and class-merge each write who/what/when/image/project/time/♡. *(Proposed 2026-11-09)* |
| **CRS-24.03** | SensorFusion work events bind `actor_uid = auth.uid()`; display names are non-authoritative for authorization (extends PR #16). *(Proposed 2026-11-09)* |
| **CRS-25.02** | SensorFusion education credit uses existing ♡/◬ rules only; 웃 remains gated by `human_enabled` until H.I. treasury funded. *(Proposed 2026-11-09)* |
| **CRS-32.04** | SensorFusion exports per-user and per-project work+token traces (CSV/JSON) including anonymous seats by uid. *(Proposed 2026-11-09)* |
| **CRS-05.04** | SensorFusion anonymous display seats use Supabase anonymous auth uid + unique canonical display name per project; no OAuth required for labeling participation. *(Proposed 2026-11-09)* |

---

## 2. Anonymous display name (no OAuth) — keep PR #16 protections

### Today
- Members table: `sensor_fusion_members (project_id, member_id=auth.uid())`; `display_name` + unique `sensor_fusion_member_key(display_name)` per project (054).
- RLS: **authenticated** members only; anon role revoked from pictures/labels (042).
- Corrections: `corrected_by_uid` forced to caller; cannot spoof another seat; case/spacing independence via `memberName()` / `sensor_fusion_member_key()`.

### Proposal
1. **Join path:** Supabase **anonymous sign-in** (`signInAnonymously`) → real `auth.uid()` → server/RPC inserts membership row (still no client INSERT on members — keep 042 intent; add SECURITY DEFINER join RPC that sets `member_id=auth.uid()`, `is_anonymous=true`, canonical `display_name`).
2. **Display name:** user picks an Anonymous name; normalize with existing `memberName()` / `sensor_fusion_member_key`; **unique per project**; reject collisions.
3. **Authorization:** all writes key off **uid**, not typed name (054 pattern). Level-2 reviewer ≠ Level-1 labeler by **uid** (and canonical name check as secondary UX).
4. **What anon can do:** Level-1 label, view project assets they are members of, earn ♡ for active time, appear in work log as anonymous seat.  
   **Cannot:** claim another seat’s name; self-review own L1 boxes; escalate to moderator; mint 웃; bypass RLS.
5. **Abuse limits:** rate-limit joins/labels per uid; one anonymous auth user per browser storage; optional captcha later; project owner can revoke seat.

### UI (`t()` keys — proposed)
- `sf.seat.anonymous_choose` — “Continue as Anonymous”
- `sf.seat.display_name` — “Display name”
- `sf.seat.name_taken` — “That name is taken in this project”
- `sf.seat.oauth_optional` — “Or sign in with your account”

### CRS
- **CRS-05.04** (above), **CRS-24.03**, retains PR #16 / migration 054 invariants.

---

## 3. Label class reuse / dedup (user t150u)

### Today
- Box `name` is **free text** on `sensor_fusion_labels.name` and in-memory `WorkBox.name` / VOC `<name>` — no project class table, no normalize-on-write, no autocomplete against shared list.
- Live duplicate count: **not readable** with anon key (`42501 permission denied for table sensor_fusion_labels` after members-only RLS). Needs member/service_role read for a verified count — **unverified** until then. Script stub: `/workspace/research-exel/artifacts/e2e-launch/sf-label-dup-count.json` records the access denial.

### Proposal
1. **Project-level shared class list** table e.g. `sensor_fusion_classes (project_id, class_id, canonical_name, name_key, use_count, created_by_uid, created_at)`.
2. **Label input UX:** autocomplete / pick list of existing classes first, **most-used first**; typing filters list.
3. **Normalize before create:** trim; casefold; collapse spaces/underscores/hyphens; strip punct; naive singularization (`cars`→`car`) for match key only — store canonical display from first creation or moderator rename.
4. **Match:** if `name_key` hits existing → reuse `class_id` (no new variant). If near-match → **“Did you mean X?”** confirm.
5. **Optional moderator merge:** merge duplicate classes → re-point boxes to surviving `class_id`; append `class_merge` work event with before/after class ids (history preserved).

### CRS sub-items (NEW — 2026-11-09)

| CRS id | Statement |
|--------|-----------|
| **CRS-08.04** | SensorFusion project maintains a shared class list; new labels prefer existing classes (autocomplete, most-used first). *(Proposed 2026-11-09; parent CRS-08 = secure/constrained submit analogue for labeling)* |
| **CRS-08.05** | New class names are normalized and matched before insert; near-duplicates prompt “did you mean?”. *(Proposed 2026-11-09)* |
| **CRS-08.06** | Moderator/reviewer may merge duplicate classes; boxes re-point; merge is append-only in the work log. *(Proposed 2026-11-09)* |

*(If product prefers SF-specific CRS numbering under a SensorFusion CRS doc instead of CRS-08.*, use **SF-CRS-01.xx** in `docs/traceability/sensorfusion-2525` ledger — same statements; do not invent rates.)*

---

## 4. Per-user annotation count + active time → ♡

| Metric | How measured | Credit |
|--------|--------------|--------|
| Annotations made | Count of `label_create` (+ optional edits) in work log for `actor_uid` | Display count; ♡ still from **time**, not per-box rate (no rate in repo) |
| Active time | Existing workflow clock (`WorkClock` open/runs) **persisted** via CRS-19.07 start/stop | On stop: `calculate_tokens(duration_seconds)` → ♡=ceil(min), ◬=5×♡, 웃=0 |
| Login/join | Optional | Existing ♡1 ◬5 (`login_heart_tokens`) when joining project labeling session |

HUD: reuse cube5 display pattern `"♡ {si} | ◬ {ai}"` via `t()` (`sf.tokens.hud`).

---

## 5. Schema / migration sketch (not applied)

1. `055+` (coordinate number with fleet — **055 claimed by ranking method** per W1 PROGRESS; use next free after live advisors):  
   - `sensor_fusion_members.is_anonymous bool`  
   - `sensor_fusion_classes` + FKs from labels  
   - `sensor_fusion_work_events` append-only  
   - join RPC for anonymous auth  
   - optional `class_id` column on labels/corrections  
2. Client: anonymous seat chooser; class autocomplete; work-event writers; export screens.  
3. Tests: binding suite extension (uid≠name); class normalize unit tests; work-log append + export; no 웃 while `human_enabled=false`.

---

## 6. Out of scope until approval
- Implementing migrations/UI.
- Flipping `NEXT_PUBLIC_MOCK_MODE`.
- Enabling `human_enabled` / 웃 payouts.
- Inventing a per-box ♡ rate.

## 7. Approval ask
Please confirm: (A) anonymous seats via Supabase anonymous auth + unique display names, (B) ♡ from **time** only using existing Cube 5 rules, (C) shared class list + normalize/did-you-mean/merge, (D) append-only work traceability export — then implement behind green checks with CRS ids in every commit/PR.
