"""Scoping helpers — pure, deterministic utilities for the Project → Differentiator →
Specification hierarchy. DB-free so they are trivially testable and reusable by any cube.

A "scope ref" is the canonical string identifier for a point in the hierarchy that all
downstream data (sessions, tokens, rankings) can inherit and filter on:
    project/{pid}
    project/{pid}/differentiator/{did}
    project/{pid}/differentiator/{did}/specification/{sid}
"""

from __future__ import annotations

import uuid

SCOPE_LEVELS = ("project", "differentiator", "specification")


def _norm(v: str | uuid.UUID) -> str:
    s = str(v).strip()
    if not s:
        raise ValueError("scope id must be non-empty")
    return s


def scope_ref(
    project_id: str | uuid.UUID,
    differentiator_id: str | uuid.UUID | None = None,
    specification_id: str | uuid.UUID | None = None,
) -> str:
    """Build the canonical scope ref. A specification requires a differentiator, which
    requires a project — you cannot skip a level (that would orphan the child)."""
    if specification_id is not None and differentiator_id is None:
        raise ValueError("specification scope requires a differentiator")
    parts = [f"project/{_norm(project_id)}"]
    if differentiator_id is not None:
        parts.append(f"differentiator/{_norm(differentiator_id)}")
    if specification_id is not None:
        parts.append(f"specification/{_norm(specification_id)}")
    return "/".join(parts)


def parse_scope_ref(ref: str) -> dict[str, str]:
    """Parse a scope ref back into its ids. Rejects malformed / skipped-level refs."""
    tokens = [t for t in (ref or "").split("/") if t != ""]
    if len(tokens) < 2 or tokens[0] != "project":
        raise ValueError(f"invalid scope ref: {ref!r}")
    out: dict[str, str] = {}
    expected = ["project", "differentiator", "specification"]
    for i, level in enumerate(expected):
        key_idx, val_idx = i * 2, i * 2 + 1
        if key_idx >= len(tokens):
            break
        if tokens[key_idx] != level or val_idx >= len(tokens):
            raise ValueError(f"invalid scope ref: {ref!r}")
        out[f"{level}_id"] = tokens[val_idx]
    if len(tokens) % 2 != 0:  # every level must be a key/value pair
        raise ValueError(f"invalid scope ref: {ref!r}")
    return out


def scope_depth(ref: str) -> int:
    """1 = project, 2 = differentiator, 3 = specification."""
    return len(parse_scope_ref(ref))


def is_descendant(child_ref: str, ancestor_ref: str) -> bool:
    """True if child_ref is at or below ancestor_ref in the same hierarchy branch —
    the inheritance rule: downstream data under a specification is also under its
    project. Guards against cross-project scope leakage."""
    a = parse_scope_ref(ancestor_ref)
    c = parse_scope_ref(child_ref)
    return all(c.get(k) == v for k, v in a.items())
