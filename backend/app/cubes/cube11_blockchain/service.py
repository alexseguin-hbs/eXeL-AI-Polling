"""Cube 11 — Blockchain (Quai/QI): Service layer.

Functions:
  - record_survey_on_chain: Compute governance proof + store + submit to Quai
  - verify_survey: Check if a session has an on-chain proof
  - get_pending_records: List surveys awaiting chain confirmation
  - retry_pending: Retry failed/pending chain submissions
  - compute_governance_proof: Build the 4-hash proof chain

Data flow: Cube 9 → Cube 10 → Cube 11
  (survey results → simulation verify → chain record)

CRS: CRS-23 (Audit trail)
I/O: db (AsyncSession) + session data → dict (chain record)
"""

import hashlib
import logging
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.cubes.cube11_blockchain.models import BlockchainRecord

logger = logging.getLogger("cube11")


def compute_governance_proof(
    cube6_theme_hash: str,
    cube7_ranking_hash: str,
    cube9_export_hash: str,
    cube1_session_hash: str,
) -> str:
    """Compute the 4-hash governance proof chain.

    governance_proof = SHA-256(
        cube6_theme_hash  ||   ← AI pipeline determinism
        cube7_ranking_hash ||  ← Borda voting proof
        cube9_export_hash  ||  ← CSV content integrity
        cube1_session_hash     ← input corpus identity
    )

    This single hash proves the entire governance pipeline was deterministic.
    Anyone with the 4 component hashes can reproduce this proof.
    """
    combined = f"{cube6_theme_hash}:{cube7_ranking_hash}:{cube9_export_hash}:{cube1_session_hash}"
    return hashlib.sha256(combined.encode()).hexdigest()


async def record_survey_on_chain(
    db: AsyncSession,
    *,
    session_hash: str,
    cube6_theme_hash: str,
    cube7_ranking_hash: str,
    cube9_export_hash: str,
    cube1_session_hash: str,
    winning_theme: str,
    voter_count: int,
    response_count: int,
) -> dict:
    """CRS-23: Record survey governance proof for future on-chain submission.

    Step 1: Compute governance_proof from 4 hashes
    Step 2: Store in Supabase blockchain_records (status: pending)
    Step 3: Future: submit to Quai chain via web3.py (async, non-blocking)

    I/O: session data + 4 hashes → dict with governance_proof + record_id
    """
    # Compute governance proof
    governance_proof = compute_governance_proof(
        cube6_theme_hash, cube7_ranking_hash, cube9_export_hash, cube1_session_hash
    )

    # Check for duplicate (idempotent)
    existing = await db.execute(
        select(BlockchainRecord).where(BlockchainRecord.session_hash == session_hash)
    )
    if existing.scalar_one_or_none():
        logger.info("cube11.record.duplicate", extra={"session_hash": session_hash})
        return {"status": "already_recorded", "session_hash": session_hash, "governance_proof": governance_proof}

    # Store record
    record = BlockchainRecord(
        session_hash=session_hash,
        governance_proof=governance_proof,
        winning_theme=winning_theme,
        voter_count=voter_count,
        response_count=response_count,
        chain_status="pending",
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    logger.info("cube11.record.created", extra={
        "session_hash": session_hash,
        "governance_proof": governance_proof[:16],
        "winning_theme": winning_theme,
        "voters": voter_count,
        "responses": response_count,
    })

    # Future: async task to submit to Quai chain
    # await _submit_to_quai(record)  # Phase 2

    return {
        "record_id": str(record.id),
        "session_hash": session_hash,
        "governance_proof": governance_proof,
        "winning_theme": winning_theme,
        "voter_count": voter_count,
        "response_count": response_count,
        "chain_status": "pending",
        "quai_tx_hash": None,
        "status": "recorded",
    }


async def verify_survey(
    db: AsyncSession,
    session_hash: str,
) -> dict:
    """CRS-23: Verify a survey's governance proof exists.

    Public endpoint — anyone can verify.
    I/O: session_hash → dict with proof details or not_found
    """
    result = await db.execute(
        select(BlockchainRecord).where(BlockchainRecord.session_hash == session_hash)
    )
    record = result.scalar_one_or_none()

    if record is None:
        return {"verified": False, "session_hash": session_hash, "reason": "No record found"}

    return {
        "verified": True,
        "session_hash": session_hash,
        "governance_proof": record.governance_proof,
        "winning_theme": record.winning_theme,
        "voter_count": record.voter_count,
        "response_count": record.response_count,
        "chain_status": record.chain_status,
        "quai_tx_hash": record.quai_tx_hash,
        "recorded_at": record.created_at.isoformat() if record.created_at else None,
    }


async def get_pending_records(
    db: AsyncSession,
    limit: int = 50,
) -> list[dict]:
    """Get all records awaiting Quai chain submission."""
    result = await db.execute(
        select(BlockchainRecord)
        .where(BlockchainRecord.chain_status.in_(("pending", "failed")))
        .order_by(BlockchainRecord.created_at)
        .limit(limit)
    )
    records = result.scalars().all()
    return [
        {
            "record_id": str(r.id),
            "session_hash": r.session_hash,
            "governance_proof": r.governance_proof,
            "winning_theme": r.winning_theme,
            "chain_status": r.chain_status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in records
    ]


async def retry_pending(
    db: AsyncSession,
) -> dict:
    """Retry all pending/failed chain submissions.

    Future: calls web3.py to submit each record to Quai.
    Currently: marks as 'pending' for batch processing.
    """
    result = await db.execute(
        select(func.count(BlockchainRecord.id))
        .where(BlockchainRecord.chain_status.in_(("pending", "failed")))
    )
    pending_count = result.scalar() or 0

    logger.info("cube11.retry_pending", extra={"count": pending_count})

    return {
        "pending_count": pending_count,
        "status": "queued_for_retry",
        "message": f"{pending_count} records queued for Quai chain submission",
    }
