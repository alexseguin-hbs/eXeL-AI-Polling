"""Cube 11 — N=99 Governance Proof Determinism Tests.

Proves the 4-hash governance proof chain produces identical
output across 99 runs. Critical for blockchain immutability.
"""

import hashlib
import pytest

from app.cubes.cube11_blockchain.service import compute_governance_proof


class TestGovernanceProofN99:
    """N=99 determinism for governance proof computation."""

    N = 99

    def test_proof_determinism_n99(self):
        """Same 4 hashes → same proof across 99 runs."""
        reference = None
        for _ in range(self.N):
            proof = compute_governance_proof(
                "cube6_abc123", "cube7_def456", "cube9_ghi789", "cube1_jkl012"
            )
            if reference is None:
                reference = proof
            assert proof == reference

    def test_proof_changes_with_any_input_n99(self):
        """Changing any single hash changes the proof across 99 runs."""
        base = compute_governance_proof("a", "b", "c", "d")
        for _ in range(self.N):
            for i, modified in enumerate([
                compute_governance_proof("X", "b", "c", "d"),
                compute_governance_proof("a", "X", "c", "d"),
                compute_governance_proof("a", "b", "X", "d"),
                compute_governance_proof("a", "b", "c", "X"),
            ]):
                assert modified != base, f"Hash {i} change didn't change proof"

    def test_proof_is_64_char_hex_n99(self):
        """Proof is always a 64-character hex string."""
        for i in range(self.N):
            proof = compute_governance_proof(f"h6_{i}", f"h7_{i}", f"h9_{i}", f"h1_{i}")
            assert len(proof) == 64
            assert all(c in "0123456789abcdef" for c in proof)

    def test_12_user_simulation_proof_n99(self):
        """Simulate 12-user session → compute proof → verify deterministic."""
        reference = None
        for _ in range(self.N):
            # Simulate hashes from a 12-user, 36-response session
            cube6 = hashlib.sha256(b"themes:AI_Governance:Democracy:Ethics").hexdigest()
            cube7 = hashlib.sha256(b"borda:12voters:seed42:AI_Governance_wins").hexdigest()
            cube9 = hashlib.sha256(b"csv:36rows:19columns:sha256").hexdigest()
            cube1 = hashlib.sha256(b"session:DEMO2026:12participants").hexdigest()
            proof = compute_governance_proof(cube6, cube7, cube9, cube1)
            if reference is None:
                reference = proof
            assert proof == reference


class TestGovernanceProofSecurity:
    """Security properties of the governance proof."""

    def test_empty_hashes_still_produce_valid_proof(self):
        """Even empty hashes produce a valid (non-empty) proof."""
        proof = compute_governance_proof("", "", "", "")
        assert len(proof) == 64

    def test_whitespace_matters(self):
        """Whitespace in hashes changes the proof (no trimming)."""
        p1 = compute_governance_proof("a", "b", "c", "d")
        p2 = compute_governance_proof(" a", "b", "c", "d")
        assert p1 != p2

    def test_unicode_input_safe(self):
        """Unicode characters in hashes don't crash."""
        proof = compute_governance_proof("主题", "排名", "导出", "会话")
        assert len(proof) == 64
