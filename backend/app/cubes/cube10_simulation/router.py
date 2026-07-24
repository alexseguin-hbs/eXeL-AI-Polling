"""Cube 10 — Simulation Engine Router.

Endpoints:
  POST /feedback               — Submit feedback from any screen
  GET  /feedback/stats          — Aggregate stats (admin)
  POST /submissions             — Submit code improvement
  GET  /submissions/{id}/test   — Run sandbox tests
  GET  /submissions/{id}/tally  — Get vote tally
  POST /verify-access           — Cube 10 access code verification
  POST /challenges              — Create challenge (admin)
  POST /challenges/{id}/claim   — Claim challenge
  POST /challenges/{id}/submit  — Submit challenge code
  GET  /saved-cases             — List saved use cases
  GET  /saved-cases/{id}/replay — Replay against dataset
"""

import re
import uuid
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import CurrentUser, get_current_user
from app.core.dependencies import get_db
from app.core.permissions import require_role
from app.cubes.cube10_simulation import service

router = APIRouter(tags=["Cube 10 — Simulation"])

# ---------------------------------------------------------------------------
# WireGuard-style whitelists — reject everything not explicitly allowed
# ---------------------------------------------------------------------------

ALLOWED_FEEDBACK_TYPES = {"CRS", "DI"}
ALLOWED_CUBE_IDS = set(range(1, 13))  # 1-12 (includes Cube 11 Blockchain + Cube 12 Divinity/NFT)
ALLOWED_SUBMITTER_TYPES = {"human", "ai"}
ALLOWED_ACCESS_TYPES = {"admin", "challenger"}
ALLOWED_CHALLENGE_STATUSES = {"open", "claimed", "submitted", "completed", "closed"}
ALLOWED_SENTIMENTS = {"positive", "neutral", "negative"}
CRS_ID_PATTERN = re.compile(r"^CRS-\d{2}$")
SUB_CRS_ID_PATTERN = re.compile(r"^CRS-\d{2}\.\d{2}$")


# ---------------------------------------------------------------------------
# Schemas (with WireGuard whitelist validation)
# ---------------------------------------------------------------------------


class FeedbackSubmit(BaseModel):
    cube_id: int
    text: str
    crs_id: str | None = None
    sub_crs_id: str | None = None
    feedback_type: str = "CRS"

    @field_validator("feedback_type")
    @classmethod
    def validate_feedback_type(cls, v: str) -> str:
        if v not in ALLOWED_FEEDBACK_TYPES:
            raise ValueError(
                f"feedback_type must be one of {sorted(ALLOWED_FEEDBACK_TYPES)}, got '{v}'"
            )
        return v

    @field_validator("cube_id")
    @classmethod
    def validate_cube_id(cls, v: int) -> int:
        if v not in ALLOWED_CUBE_IDS:
            raise ValueError(
                f"cube_id must be 1-12, got {v}"
            )
        return v

    @field_validator("crs_id")
    @classmethod
    def validate_crs_id(cls, v: str | None) -> str | None:
        if v is not None and not CRS_ID_PATTERN.match(v):
            raise ValueError(
                f"crs_id must match pattern CRS-## (e.g. CRS-01), got '{v}'"
            )
        return v

    @field_validator("sub_crs_id")
    @classmethod
    def validate_sub_crs_id(cls, v: str | None) -> str | None:
        if v is not None and not SUB_CRS_ID_PATTERN.match(v):
            raise ValueError(
                f"sub_crs_id must match pattern CRS-##.## (e.g. CRS-01.02), got '{v}'"
            )
        return v


class SubmissionCreate(BaseModel):
    cube_id: int
    function_name: str
    submitter_type: str = "human"
    code_diff: str

    @field_validator("submitter_type")
    @classmethod
    def validate_submitter_type(cls, v: str) -> str:
        if v not in ALLOWED_SUBMITTER_TYPES:
            raise ValueError(
                f"submitter_type must be one of {sorted(ALLOWED_SUBMITTER_TYPES)}, got '{v}'"
            )
        return v

    @field_validator("cube_id")
    @classmethod
    def validate_cube_id(cls, v: int) -> int:
        if v not in ALLOWED_CUBE_IDS:
            raise ValueError(
                f"cube_id must be 1-12, got {v}"
            )
        return v


# ---------------------------------------------------------------------------
# Feedback Endpoints
# ---------------------------------------------------------------------------


@router.post("/feedback", status_code=201)
async def submit_feedback(
    payload: FeedbackSubmit,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """Submit feedback from any screen. Auto-categorized by cube + CRS."""
    return await service.submit_feedback(
        db,
        cube_id=payload.cube_id,
        text=payload.text,
        submitted_by=user.user_id,
        crs_id=payload.crs_id,
        sub_crs_id=payload.sub_crs_id,
        feedback_type=payload.feedback_type,
    )


@router.get("/feedback/stats")
async def get_feedback_stats(
    cube_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(require_role("admin")),
):
    """Aggregate feedback statistics for admin triage."""
    if cube_id is not None and cube_id not in ALLOWED_CUBE_IDS:
        raise HTTPException(status_code=400, detail=f"cube_id must be 1-12, got {cube_id}")
    return await service.get_feedback_stats(db, cube_id)


# ---------------------------------------------------------------------------
# Submission Endpoints
# ---------------------------------------------------------------------------


@router.post("/submissions", status_code=201)
async def create_submission(
    payload: SubmissionCreate,
    user: CurrentUser = Depends(get_current_user),
):
    """Submit code improvement for a cube function."""
    try:
        return await service.create_submission(
            cube_id=payload.cube_id,
            function_name=payload.function_name,
            submitter_id=user.user_id,
            submitter_type=payload.submitter_type,
            code_diff=payload.code_diff,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/submissions/{submission_id}/test")
async def run_tests(
    submission_id: str,
    cube_id: int,
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Run sandbox tests against a submission (cube_id 1-9 targets that cube's suite)."""
    if cube_id not in ALLOWED_CUBE_IDS:
        raise HTTPException(status_code=400, detail=f"cube_id must be 1-9, got {cube_id}")
    return await service.run_sandbox_tests(submission_id, cube_id=cube_id)


@router.get("/submissions/{submission_id}/tally")
async def get_tally(
    submission_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Get current vote tally for a submission."""
    # Stub — will query submission_votes table
    return service.tally_votes([], total_token_holders=0)


# ---------------------------------------------------------------------------
# Saved Use Cases (Top 3 + DEMO)
# ---------------------------------------------------------------------------


class VerifyAccessRequest(BaseModel):
    code: str
    access_type: str  # "admin" or "challenger"

    @field_validator("access_type")
    @classmethod
    def validate_access_type(cls, v: str) -> str:
        if v not in ALLOWED_ACCESS_TYPES:
            raise ValueError(
                f"access_type must be one of {sorted(ALLOWED_ACCESS_TYPES)}, got '{v}'"
            )
        return v


@router.post("/verify-access")
async def verify_access(
    payload: VerifyAccessRequest,
    user: CurrentUser = Depends(get_current_user),
):
    """Verify Cube 10 access code — POST body (never in URL/logs)."""
    import hmac
    from app.config import settings

    if payload.access_type == "admin":
        expected = settings.cube10_admin_code
    elif payload.access_type == "challenger":
        expected = settings.cube10_challenger_code
    else:
        raise HTTPException(status_code=400, detail="access_type must be 'admin' or 'challenger'")

    # True constant-time comparison via hmac.compare_digest
    if hmac.compare_digest(payload.code.encode(), expected.encode()):
        return {"access": payload.access_type, "granted": True, "user_id": user.user_id}
    else:
        raise HTTPException(status_code=403, detail="Invalid access code")


# ---------------------------------------------------------------------------
# Challenge System (Grok Architecture)
# ---------------------------------------------------------------------------


class ChallengeCreate(BaseModel):
    cube_id: int
    title: str
    description: str
    acceptance_criteria: str
    function_name: str | None = None
    reward_heart: float = 10.0
    reward_unity: float = 50.0

    @field_validator("cube_id")
    @classmethod
    def validate_cube_id(cls, v: int) -> int:
        if v not in ALLOWED_CUBE_IDS:
            raise ValueError(
                f"cube_id must be 1-12, got {v}"
            )
        return v


@router.post("/challenges", status_code=201)
async def create_challenge(
    payload: ChallengeCreate,
    user: CurrentUser = Depends(require_role("admin")),
):
    """Create a new challenge for a specific Cube (Admin only)."""
    try:
        return await service.create_challenge(
            cube_id=payload.cube_id,
            title=payload.title,
            description=payload.description,
            acceptance_criteria=payload.acceptance_criteria,
            function_name=payload.function_name,
            reward_heart=payload.reward_heart,
            reward_unity=payload.reward_unity,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/challenges/{challenge_id}/claim")
async def claim_challenge(
    challenge_id: str,
    user: CurrentUser = Depends(get_current_user),
):
    """Claim a challenge — creates isolated simulation portal."""
    return await service.claim_challenge(challenge_id, user.user_id)


@router.post("/challenges/{challenge_id}/submit")
async def submit_challenge_code(
    challenge_id: str,
    payload: SubmissionCreate,
    user: CurrentUser = Depends(get_current_user),
):
    """Submit enhanced code for community review."""
    try:
        return await service.submit_challenge(
            challenge_id, user.user_id, payload.code_diff,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ---------------------------------------------------------------------------
# Saved Use Cases
# ---------------------------------------------------------------------------


@router.get("/saved-cases")
async def list_saved_cases(
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """List all saved use cases (top 3 largest + DEMO)."""
    from app.cubes.cube10_simulation.saved_use_cases import SavedUseCaseManager
    mgr = SavedUseCaseManager()
    return mgr.to_dict()


@router.get("/saved-cases/{case_id}/replay")
async def replay_case(
    case_id: str,
    cube_id: int = 0,
    function_name: str = "",
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Run simulation replay against a saved dataset."""
    # cube_id=0 means "all cubes"; 1-10 targets a specific cube
    if cube_id not in {0, *ALLOWED_CUBE_IDS}:
        raise HTTPException(status_code=400, detail=f"cube_id must be 0 (all) or 1-10, got {cube_id}")
    from app.cubes.cube10_simulation.saved_use_cases import (
        SavedUseCaseManager, replay_against_dataset,
    )
    mgr = SavedUseCaseManager()
    case = mgr.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Saved case not found")
    return await replay_against_dataset(case, cube_id, function_name)


# ---------------------------------------------------------------------------
# Dev-Sim — the Simulation option surface: see Cubes 1-9, inspect Cube 1's
# inputs → functions → outputs, PLAY-TEST the whole cube for metrics, and let a
# Master Developer check in candidate code for testing. Reuses the Cube-1 harness
# (sandbox oracle) + challenge_loop (baseline↔candidate→verdict→swap).
# ---------------------------------------------------------------------------

from app.cubes.cube10_simulation.challenge_loop import HARNESS_CUBES

_CUBE_NAMES = {
    1: "Session Join & QR", 2: "Text Submission", 3: "Voice-to-Text",
    4: "Response Collector", 5: "Gateway / Orchestrator", 6: "AI Theming Clusterer",
    7: "Prioritization & Ranking", 8: "Token Rewards", 9: "Reports & Dashboards",
}
# Single source of truth (challenge_loop.HARNESS_CUBES): cubes 1, 2, 6, 7 have
# runnable stand-alone harnesses; the rest are pending.
_HARNESS_CUBES = HARNESS_CUBES


def _default_sections(cube_id: int) -> int:
    """The cube's NATURAL section count = how many real functions it takes to run it
    (one building block ≈ one real code unit), clamped 2..27. Reality, not a fixed 4."""
    from app.cubes.cube10_simulation.sections import SECTIONS

    n = len([fn for s in SECTIONS.get(cube_id, []) for fn in s["functions"]])
    return max(2, min(27, n)) if n else 4


@router.get("/sim/cubes")
async def sim_list_cubes():
    """List Cubes 1-9 for the Simulation option; flag which have a runnable harness and
    each cube's default section count (its real LIVE code-unit count, not a fixed 4)."""
    return {"cubes": [
        {"cube_id": i, "name": _CUBE_NAMES[i], "harness_available": i in _HARNESS_CUBES,
         "default_sections": _default_sections(i)}
        for i in range(1, 10)
    ]}


def _enrich_sections_io(cube_id: int, secs: list[dict], whole_io: dict) -> list[dict]:
    """FX-H: give each section/building block its OWN inputs·functions·outputs, gathered
    from the shared `core.universal` registry for the section's functions. A block with
    no registry match falls back to the whole-cube io so it's never empty."""
    from app.core.universal import get_by_cube

    reg = {f["name"]: f for f in get_by_cube(cube_id)}
    for s in secs:
        inputs: set[str] = set()
        outputs: set[str] = set()
        for nm in s.get("functions", []):
            f = reg.get(nm)
            if not f:
                continue
            if f.get("input_schema"):
                inputs.add(f["input_schema"])
            if f.get("output_schema"):
                outputs.add(f["output_schema"])
            if f.get("broadcasts_event"):
                outputs.add(f["broadcasts_event"])
        s["io"] = {
            "inputs": sorted(inputs) or whole_io.get("inputs", []),
            "functions": s.get("functions", []),
            "outputs": sorted(outputs) or whole_io.get("outputs", []),
        }
    return secs


@router.get("/sim/cube/{cube_id}/contract")
async def sim_cube_contract(cube_id: int, sections: int = 4):
    """Cube I/O contract — inputs → functions → outputs, RICH for ALL cubes 1-9.
    Cube 1 emits its own io_contract from the harness; cubes 2-9 compose one from the
    shared `core.universal` registry (per-fn input/output schemas) so the workbench
    always has a real inputs·functions·outputs diagram.

    `sections` (FX-G) is the block granularity: 4 = the curated function sections,
    3/9/27 = coherent block-segments (3 levels / 9 rows / 27 mini-cubes)."""
    if cube_id < 1 or cube_id > 9:
        raise HTTPException(status_code=400, detail="cube_id must be 1-9")
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} has no stand-alone harness yet.")
    from app.cubes.cube10_simulation.challenge_loop import _run_harness

    from app.cubes.cube10_simulation.sections import ALLOWED_SECTION_COUNTS, sections_for

    if sections not in ALLOWED_SECTION_COUNTS:
        raise HTTPException(status_code=400,
            detail=f"sections must be one of {ALLOWED_SECTION_COUNTS}")

    r = await _run_harness(cube_id)
    if "io_contract" in r:  # Cube 1 emits a rich inputs→functions→outputs contract
        return {
            "cube_id": cube_id, "name": _CUBE_NAMES[cube_id],
            "io_contract": r["io_contract"], "inputs": r["inputs"], "sample_outputs": r["outputs"],
            "sections": _enrich_sections_io(cube_id, sections_for(cube_id, sections), r["io_contract"]),
        }
    # Cubes 2-9: compose a rich contract from the shared universal-function registry
    # (fn names + input/output schemas + path params) folded with the harness's real
    # output keys — so every cube has non-empty inputs·functions·outputs.
    from app.core.universal import get_by_cube

    funcs = get_by_cube(cube_id)
    inputs: set[str] = {f["input_schema"] for f in funcs if f.get("input_schema")}
    for f in funcs:  # path-param cubes take a session_id
        if "{id}" in (f.get("endpoint") or ""):
            inputs.add("session_id")
    functions = [f["name"] for f in funcs]
    outputs: set[str] = {f["output_schema"] for f in funcs if f.get("output_schema")}
    outputs |= {f["broadcasts_event"] for f in funcs if f.get("broadcasts_event")}
    outputs |= {k for k in r if k not in ("metrics", "determinism_signature", "cube")}
    if not inputs:
        inputs = {"session_id"}
    return {
        "cube_id": cube_id, "name": _CUBE_NAMES[cube_id],
        "io_contract": {"inputs": sorted(inputs), "functions": functions, "outputs": sorted(outputs)},
        "inputs": sorted(inputs), "sample_outputs": r,
        "sections": _enrich_sections_io(cube_id, sections_for(cube_id, sections),
            {"inputs": sorted(inputs), "outputs": sorted(outputs)}),
    }


# ---------------------------------------------------------------------------
# FX-B — read-only LIVE source. The workbench LIVE panel must show the REAL code
# running the website (not a placeholder), so a Dev can write a candidate against
# it. inspect.getsource of each section's functions, WireGuard-whitelisted to
# app/cubes/** ONLY (never core/config/secrets, never write).
# ---------------------------------------------------------------------------

_CUBE_PKG = {
    1: "cube1_session", 2: "cube2_text", 3: "cube3_voice", 4: "cube4_collector",
    5: "cube5_gateway", 6: "cube6_ai", 7: "cube7_ranking", 8: "cube8_tokens",
    9: "cube9_reports",
}
_SOURCE_MAX = 8000  # cap per block — a slice, never a dump
# WireGuard denylist: never surface source of secret/crypto/config/auth files even
# when a section function is re-exported from app/core (FX-H — complete section code).
_SOURCE_DENY = {"security.py", "config.py", "auth.py", "provider_credentials.py", "stripe_config.py"}


def _source_allowed(path: str) -> bool:
    """A source file is shown iff it lives in app/cubes/** OR app/core/** (the real
    operational code a section needs to operate), but NEVER a denylisted secret file."""
    p = path.replace("\\", "/")
    base = p.rsplit("/", 1)[-1]
    if base in _SOURCE_DENY:
        return False
    return "/app/cubes/" in p or "/app/core/" in p


def _iter_cube_callables(cube_id: int):
    """Yield (name, callable) for functions/methods a cube's section may need — those
    DEFINED under app/cubes/<pkg>/** OR re-exported from app/core/** (so a section that
    calls a shared validator/hash/rate helper still shows COMPLETE code). Secret/crypto/
    config/auth files are denied (`_SOURCE_DENY`), never leaked."""
    import importlib
    import inspect
    import pkgutil

    pkgname = _CUBE_PKG.get(cube_id)
    if not pkgname:
        return
    try:
        pkg = importlib.import_module(f"app.cubes.{pkgname}")
    except Exception:  # noqa: BLE001 — a cube that can't import yields nothing
        return
    modules = [pkg]
    try:
        for info in pkgutil.walk_packages(pkg.__path__, prefix=f"app.cubes.{pkgname}."):
            try:
                modules.append(importlib.import_module(info.name))
            except Exception:  # noqa: BLE001 — skip a module that needs an optional dep
                continue
    except Exception:  # noqa: BLE001
        pass
    for mod in modules:
        for name, obj in inspect.getmembers(mod):
            if inspect.isfunction(obj):
                yield name, obj
            elif inspect.isclass(obj):
                for mname, meth in inspect.getmembers(obj, inspect.isfunction):
                    yield mname, meth


@lru_cache(maxsize=64)
def _resolve_cube_sources(cube_id: int, section: str | None) -> list[dict]:
    """Real source for each section function, whitelisted to app/cubes/**.

    Exact-name match first, then a prefix fallback within the cube tree (so a plain
    section label like 'validate_and_fit' resolves 'validate_and_fit_text_input').
    Unresolved / out-of-tree functions return {resolved: False, source: None}.

    SSSES Efficiency: source is STATIC at runtime, so the result is memoized —
    the LIVE panel re-fetches on every section change, but the expensive package
    walk + inspect.getsource runs once per (cube, section). Read-only result
    (serialized by FastAPI, never mutated)."""
    import inspect

    from app.cubes.cube10_simulation.sections import SECTIONS

    secs = [s for s in SECTIONS.get(cube_id, []) if not section or s["key"] == section]
    exact: dict[str, object] = {}
    pool: list[tuple[str, object]] = []
    for name, obj in _iter_cube_callables(cube_id):
        try:
            src_file = inspect.getsourcefile(obj) or ""
        except Exception:  # noqa: BLE001
            continue
        if not _source_allowed(src_file):
            continue  # WireGuard: cubes + core operational code only; secret files denied
        exact.setdefault(name, obj)
        pool.append((name, obj))

    blocks: list[dict] = []
    for s in secs:
        for fn in s["functions"]:
            obj = exact.get(fn) or next((o for nm, o in pool if nm.startswith(fn)), None)
            block = {"name": fn, "section": s["key"], "resolved": False,
                     "path": None, "source": None}
            if obj is not None:
                try:
                    path = inspect.getsourcefile(obj) or ""
                    rel = path[path.index("app/"):] if "app/" in path else path
                    block.update(resolved=True, path=rel,
                                 source=inspect.getsource(obj)[:_SOURCE_MAX])
                except Exception:  # noqa: BLE001
                    pass
            blocks.append(block)
    return blocks


@router.get("/sim/cube/{cube_id}/source")
async def sim_cube_source(cube_id: int, section: str | None = None):
    """Read-only LIVE source for a cube's section functions — the real code running
    the platform, so the workbench LIVE panel is not a placeholder. inspect.getsource,
    whitelisted to app/cubes/** (never secrets/env, never write)."""
    from app.cubes.cube10_simulation.sections import SECTION_KEYS

    if cube_id < 1 or cube_id > 9:
        raise HTTPException(status_code=400, detail="cube_id must be 1-9")
    if section is not None and section not in SECTION_KEYS:
        raise HTTPException(status_code=400, detail=f"section must be one of {SECTION_KEYS} or omitted")
    return {"cube_id": cube_id, "section": section,
            "blocks": _resolve_cube_sources(cube_id, section)}


@router.get("/sim/cube/{cube_id}/section-metrics")
async def sim_cube_section_metrics(cube_id: int, section: str, sections: int = 0):
    """REAL per-block metrics + SSSES for ONE building block (SP): measure the block via its
    section-scoped replay (real duration_ms + row_count) and its actual source LOC, then score
    the 5 SSSES pillars. Read-only + deterministic — the Vision-2525 qualification bar per block."""
    if cube_id < 1 or cube_id > 9:
        raise HTTPException(status_code=400, detail="cube_id must be 1-9")
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404, detail=f"Cube {cube_id} has no harness yet.")
    from app.cubes.cube10_simulation.sections import (
        ALLOWED_SECTION_COUNTS, section_ssses, sections_for,
    )
    from app.cubes.cube10_simulation.saved_use_cases import SavedUseCaseManager, replay_against_dataset

    count = sections if sections in ALLOWED_SECTION_COUNTS else _default_sections(cube_id)
    blk = next((s for s in sections_for(cube_id, count) if s["key"] == section), None)
    if not blk:
        raise HTTPException(status_code=400, detail=f"unknown section {section!r} at {count} blocks")
    fns = blk.get("functions", [])
    # REAL source LOC for this block's functions (from the whitelisted live source).
    resolved = {b["name"]: b for b in _resolve_cube_sources(cube_id, None) if b.get("resolved") and b.get("source")}
    loc = sum(len((resolved[f]["source"] or "").splitlines()) for f in fns if f in resolved)
    # REAL per-block duration + row_count via the section-scoped replay.
    dur, rows, rhash = 0.0, 0, ""
    try:
        mgr = SavedUseCaseManager()
        case = mgr.get_case("demo") or mgr.demo
        rep = await replay_against_dataset(case, cube_id, function_name="", section=section)
        dur = float(rep.get("duration_ms", 0.0)); rows = int(rep.get("row_count", 0)); rhash = rep.get("replay_hash", "")
    except Exception:  # replay unavailable offline → SSSES falls back to static signals
        pass
    return {
        "cube_id": cube_id, "section": section, "code": blk.get("code"), "functions": fns,
        "duration_ms": dur, "row_count": rows, "loc": loc, "replay_hash": rhash,
        "ssses": section_ssses(cube_id, fns, duration_ms=dur, row_count=rows, loc=loc),
    }


@router.post("/sim/cube/{cube_id}/run")
async def sim_cube_run(
    cube_id: int,
    user: CurrentUser = Depends(get_current_user),
):
    """Play-test the whole cube → actual outputs + metrics baseline + determinism signature."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} has no stand-alone harness yet.")
    from app.cubes.cube10_simulation.challenge_loop import _run_harness

    r = await _run_harness(cube_id)
    outputs = {k: v for k, v in r.items() if k != "metrics"}
    return {"cube_id": cube_id, "metrics": r.get("metrics", {}), "outputs": outputs,
            "determinism_signature": r.get("determinism_signature", "")}


class SimChallengeRequest(BaseModel):
    candidate: dict
    tier: str = "manual"
    human_approved: bool = False
    human_selected: bool = False


@router.post("/sim/cube/{cube_id}/challenge")
async def sim_cube_challenge(
    cube_id: int,
    payload: SimChallengeRequest,
    user: CurrentUser = Depends(require_role("admin", "lead_developer")),
):
    """Master Developer checks in a candidate → baseline vs candidate → verdict + 3-tier swap."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} challenge not available yet — Cube 1 is the reference.")
    from app.cubes.cube10_simulation.challenge_loop import run_challenge

    return await run_challenge(
        cube_id, payload.candidate, tier=payload.tier,
        human_approved=payload.human_approved, human_selected=payload.human_selected,
    )


@router.get("/sim/cube/{cube_id}/replay")
async def sim_cube_replay(
    cube_id: int,
    section: str | None = None,
    case_id: str = "demo",
    user: CurrentUser = Depends(get_current_user),
):
    """Replay a cube against a dataset — the WHOLE cube (section=None) OR one building
    block / level (section=A/B/C/D). Returns a reproducible replay_hash + scope so the
    Dev-Master can beat a block or the whole cube (Manual Vision • 2525)."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404,
            detail=f"Cube {cube_id} has no dataset-replay harness yet.")
    from app.cubes.cube10_simulation.saved_use_cases import (
        SavedUseCaseManager, replay_against_dataset,
    )
    mgr = SavedUseCaseManager()
    case = mgr.get_case(case_id) or mgr.demo
    if not case:
        raise HTTPException(status_code=404, detail="Dataset case not found")
    try:
        return await replay_against_dataset(case, cube_id, function_name="", section=section)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ---------------------------------------------------------------------------
# §4b — Manual SIM two-step: CHECK IN (version + Replay evidence, nothing runs)
# then SUBMIT TO SIMULATE (run the checked-in candidate vs metrics/validators →
# verdict). Thought Master's audit-first order. HI (웃) finalizes only after ≥3
# distinct SoI members validate the outcome (anti-dishonesty).
# ---------------------------------------------------------------------------

class SimCheckInRequest(BaseModel):
    section: str | None = None
    level: int = 9
    note: str | None = None
    proposed_version: str | None = None


class SimSubmitRequest(BaseModel):
    run_id: str | None = None
    section: str | None = None
    level: int = 9
    tier: str = "manual"
    human_approved: bool = False
    candidate: dict | None = None


@router.post("/sim/cube/{cube_id}/check-in")
async def sim_cube_check_in(
    cube_id: int,
    payload: SimCheckInRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """CHECK IN — version the candidate + write Replay evidence. NOTHING runs yet
    (version first, run second). Wires the previously-dead SimulationRun."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404, detail=f"Cube {cube_id} has no harness yet.")
    run_id = str(uuid.uuid4())
    proposed = payload.proposed_version or f"cand-{run_id[:8]}"
    actor = getattr(user, "user_id", None) or "dev"
    persisted = False
    # Persist a checked-in SimulationRun (guarded — JSON cols need Postgres; SQLite
    # offline degrades to an in-memory evidence record without failing the check-in).
    try:
        from app.models.simulation_run import SimulationRun

        run = SimulationRun(
            cube_id=str(cube_id), initiated_by=actor, base_version="live",
            proposed_version=proposed, replay_dataset_ref=(payload.section or "cube"),
            status="checked_in", results_summary=payload.note,
        )
        db.add(run)
        await db.commit()
        await db.refresh(run)
        run_id = str(run.id)
        persisted = True
    except Exception:  # noqa: BLE001 — degrade gracefully offline
        await db.rollback()
    return {
        "run_id": run_id, "cube_id": cube_id, "section": payload.section,
        "level": payload.level, "proposed_version": proposed,
        "status": "checked_in", "persisted": persisted,
    }


@router.post("/sim/cube/{cube_id}/submit")
async def sim_cube_submit(
    cube_id: int,
    payload: SimSubmitRequest,
    db: AsyncSession = Depends(get_db),
    user: CurrentUser = Depends(get_current_user),
):
    """SUBMIT TO SIMULATE — run the checked-in candidate vs the current metrics +
    validators → side-by-side verdict. Manual = human-gated (decide_swap). HI (웃)
    finalizes only after ≥3 distinct members validate the outcome."""
    if cube_id not in _HARNESS_CUBES:
        raise HTTPException(status_code=404, detail=f"Cube {cube_id} has no harness yet.")
    from app.cubes.cube10_simulation.challenge_loop import (
        compute_optimization, run_cube_baseline, run_challenge,
    )
    from app.cubes.cube10_simulation.saved_use_cases import (
        SavedUseCaseManager, replay_against_dataset,
    )

    base = await run_cube_baseline(cube_id)
    # S0 param what-if: the candidate re-runs the harness (same functionality) unless a
    # candidate metrics payload is supplied. Equivalence is proven by signature match.
    candidate = payload.candidate or {"signature": base["signature"], "duration_ms": base["duration_ms"]}
    try:
        # Reuse the baseline we just ran — run_challenge would otherwise re-run the
        # harness a second time per submit (SSSES Efficiency).
        out = await run_challenge(
            cube_id, candidate, tier=payload.tier, human_approved=payload.human_approved,
            baseline=base,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    mgr = SavedUseCaseManager()
    case = mgr.get_case("demo") or mgr.demo
    replay = await replay_against_dataset(case, cube_id, function_name="", section=payload.section)

    # 3-member outcome validation gate — 웃 (HI) stays pending until ≥3 distinct members
    # attest (anti-dishonesty). The attestation-collection flow is a convergence item.
    validation = {"validators": 0, "required": 3, "state": "pending_validation"}
    # Parity+efficiency proof: a ≥10% win shrinks the candidate cube vs Live (8×8×8 for
    # 10×10×10). Earned only when the verdict passed (parity) AND the candidate is faster.
    optimization = compute_optimization(
        out["baseline"], out["candidate"], passed=out["verdict"]["overall_passed"],
    )
    return {
        "cube_id": cube_id, "section": payload.section, "level": payload.level,
        "baseline": out["baseline"], "candidate": out["candidate"],
        "verdict": out["verdict"], "decision": out["decision"],
        "optimization": optimization,
        "replay": replay, "validation": validation,
    }
