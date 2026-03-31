"""Shared submission validators — used by Cube 2 (Text) and Cube 3 (Voice).

Extracted from cube2_text/service.py for modularity. Both cubes validate
the same preconditions before accepting a response: session must be polling,
question must belong to session, participant must be active.

Cube 10 checkout contract: Any cube replacement must preserve these function
signatures and error semantics.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import (
    ParticipantNotFoundError,
    QuestionNotFoundError,
    ResponseValidationError,
    SessionNotFoundError,
    SessionNotPollingError,
)
from app.models.participant import Participant
from app.models.question import Question
from app.models.session import Session


async def validate_session_for_submission(
    db: AsyncSession,
    session_id: uuid.UUID,
) -> Session:
    """Validate session exists and is in 'polling' state."""
    result = await db.execute(
        select(Session).where(Session.id == session_id)
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise SessionNotFoundError(str(session_id))
    if session.status != "polling":
        raise SessionNotPollingError(str(session_id), session.status)
    return session


async def validate_question(
    db: AsyncSession,
    question_id: uuid.UUID,
    session_id: uuid.UUID,
) -> Question:
    """Validate question exists and belongs to the session."""
    result = await db.execute(
        select(Question).where(
            Question.id == question_id,
            Question.session_id == session_id,
        )
    )
    question = result.scalar_one_or_none()
    if question is None:
        raise QuestionNotFoundError(str(question_id))
    return question


async def validate_participant(
    db: AsyncSession,
    participant_id: uuid.UUID,
    session_id: uuid.UUID,
) -> Participant:
    """Validate participant exists, is active, and belongs to the session."""
    result = await db.execute(
        select(Participant).where(
            Participant.id == participant_id,
            Participant.session_id == session_id,
            Participant.is_active.is_(True),
        )
    )
    participant = result.scalar_one_or_none()
    if participant is None:
        raise ParticipantNotFoundError(str(participant_id))
    return participant


def validate_text_input(raw_text: str, max_length: int) -> str:
    """Validate text is non-empty and within Unicode-aware length limit."""
    text = raw_text.strip()
    if not text:
        raise ResponseValidationError("Response text cannot be empty")
    if len(text) > max_length:
        raise ResponseValidationError(
            f"Response exceeds maximum length of {max_length} characters "
            f"(submitted: {len(text)})"
        )
    return text
