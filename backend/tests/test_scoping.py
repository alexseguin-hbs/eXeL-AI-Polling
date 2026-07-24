"""Scoping hierarchy — models + pure helpers (Project → Differentiator → Specification).

Offline: verifies the ORM definitions (FKs, cascade, relationships, indexes) and the
DB-free scope-ref helpers that all downstream data uses to inherit + filter scope.
"""

import uuid

import pytest

from app.core.scoping import (
    is_descendant,
    parse_scope_ref,
    scope_depth,
    scope_ref,
)
from app.models import Differentiator, Project, Specification


class TestModelDefinitions:
    def test_tables_named(self):
        assert Project.__tablename__ == "projects"
        assert Differentiator.__tablename__ == "differentiators"
        assert Specification.__tablename__ == "specifications"

    def test_foreign_keys_chain_the_hierarchy(self):
        did_fk = next(iter(Differentiator.__table__.c.project_id.foreign_keys))
        assert did_fk.column.table.name == "projects"
        sid_fk = next(iter(Specification.__table__.c.differentiator_id.foreign_keys))
        assert sid_fk.column.table.name == "differentiators"

    def test_cascade_delete_orphan_configured(self):
        assert "delete-orphan" in Project.differentiators.property.cascade
        assert "delete-orphan" in Differentiator.specifications.property.cascade

    def test_relationships_are_bidirectional(self):
        assert Differentiator.project.property.back_populates == "differentiators"
        assert Specification.differentiator.property.back_populates == "specifications"

    def test_org_isolation_column_present_and_indexed(self):
        assert "org_id" in Project.__table__.c
        idx_cols = {tuple(c.name for c in ix.columns) for ix in Project.__table__.indexes}
        assert ("org_id", "status") in idx_cols

    def test_instantiate_full_hierarchy_in_memory(self):
        p = Project(org_id="acme", name="Checkout Revamp", created_by="u1")
        d = Differentiator(name="One-page vs multi-step", project=p)
        s = Specification(name="autofill on", differentiator=d)
        assert d in p.differentiators and s in d.specifications
        assert s.differentiator.project is p


class TestScopeRef:
    def test_build_each_depth(self):
        assert scope_ref("p1") == "project/p1"
        assert scope_ref("p1", "d1") == "project/p1/differentiator/d1"
        assert scope_ref("p1", "d1", "s1") == "project/p1/differentiator/d1/specification/s1"

    def test_accepts_uuid(self):
        pid = uuid.uuid4()
        assert scope_ref(pid) == f"project/{pid}"

    def test_cannot_skip_a_level(self):
        with pytest.raises(ValueError):
            scope_ref("p1", None, "s1")   # specification without differentiator

    def test_empty_id_rejected(self):
        with pytest.raises(ValueError):
            scope_ref("   ")

    def test_roundtrip_parse(self):
        ref = scope_ref("p1", "d1", "s1")
        assert parse_scope_ref(ref) == {
            "project_id": "p1", "differentiator_id": "d1", "specification_id": "s1",
        }

    @pytest.mark.parametrize("bad", ["", "widget/x", "project", "project/p/differentiator", "x/y/z/w"])
    def test_malformed_refs_rejected(self, bad):
        with pytest.raises(ValueError):
            parse_scope_ref(bad)

    def test_depth(self):
        assert scope_depth("project/p1") == 1
        assert scope_depth(scope_ref("p1", "d1")) == 2
        assert scope_depth(scope_ref("p1", "d1", "s1")) == 3


class TestInheritance:
    def test_descendant_within_branch(self):
        spec = scope_ref("p1", "d1", "s1")
        assert is_descendant(spec, "project/p1") is True
        assert is_descendant(spec, scope_ref("p1", "d1")) is True

    def test_not_descendant_across_projects(self):
        spec = scope_ref("p1", "d1", "s1")
        assert is_descendant(spec, "project/p2") is False           # cross-project isolation
        assert is_descendant(spec, scope_ref("p1", "d2")) is False  # cross-differentiator
