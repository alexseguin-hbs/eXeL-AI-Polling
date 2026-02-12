"""Cube 9 — Reports Service: CSV export matching 15-column schema.

Output columns:
  Q_Number, Question, User, Detailed_Results,
  333_Summary, 111_Summary, 33_Summary,
  Theme01, Theme01_Confidence,
  Theme2_9, Theme2_9_Confidence,
  Theme2_6, Theme2_6_Confidence,
  Theme2_3, Theme2_3_Confidence
"""

import io
import uuid

import pandas as pd
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question
from app.models.response_meta import ResponseMeta

# Exact 15-column schema matching reference CSV
CSV_COLUMNS = [
    "Q_Number",
    "Question",
    "User",
    "Detailed_Results",
    "333_Summary",
    "111_Summary",
    "33_Summary",
    "Theme01",
    "Theme01_Confidence",
    "Theme2_9",
    "Theme2_9_Confidence",
    "Theme2_6",
    "Theme2_6_Confidence",
    "Theme2_3",
    "Theme2_3_Confidence",
]


async def export_session_csv(
    db: AsyncSession,
    mongo_db: AsyncIOMotorDatabase,
    session_id: uuid.UUID,
) -> io.BytesIO:
    """Build 15-column CSV export for a session.

    Queries Postgres (ResponseMeta, Question) + MongoDB (raw text, summaries)
    and assembles matching the reference output schema.
    """
    # Fetch all response metadata
    result = await db.execute(
        select(ResponseMeta).where(ResponseMeta.session_id == session_id)
    )
    metas = list(result.scalars().all())

    # Build question lookup
    q_result = await db.execute(
        select(Question).where(Question.session_id == session_id)
    )
    questions = {str(q.id): q for q in q_result.scalars().all()}

    rows = []
    for meta in metas:
        # Fetch raw text from MongoDB
        doc = await mongo_db.responses.find_one({"_id": meta.mongo_ref})
        raw_text = doc.get("text", "") if doc else ""

        # Fetch summaries from MongoDB
        summary_doc = await mongo_db.summaries.find_one({
            "response_id": str(meta.id),
            "session_id": str(session_id),
        })

        question = questions.get(str(meta.question_id))
        q_number = question.order_index if question else 0
        q_text = question.question_text if question else ""

        def _fmt_confidence(val) -> str:
            if isinstance(val, (int, float)):
                return f"{int(val)}%" if val > 1 else f"{int(val * 100)}%"
            return str(val) if val else ""

        row = {
            "Q_Number": q_number,
            "Question": q_text,
            "User": str(meta.participant_id),
            "Detailed_Results": raw_text,
            "333_Summary": summary_doc.get("summary_333", "") if summary_doc else "",
            "111_Summary": summary_doc.get("summary_111", "") if summary_doc else "",
            "33_Summary": summary_doc.get("summary_33", "") if summary_doc else "",
            "Theme01": summary_doc.get("theme01", "") if summary_doc else "",
            "Theme01_Confidence": _fmt_confidence(
                summary_doc.get("theme01_confidence") if summary_doc else ""
            ),
            "Theme2_9": summary_doc.get("theme2_9", "") if summary_doc else "",
            "Theme2_9_Confidence": _fmt_confidence(
                summary_doc.get("theme2_9_confidence") if summary_doc else ""
            ),
            "Theme2_6": summary_doc.get("theme2_6", "") if summary_doc else "",
            "Theme2_6_Confidence": _fmt_confidence(
                summary_doc.get("theme2_6_confidence") if summary_doc else ""
            ),
            "Theme2_3": summary_doc.get("theme2_3", "") if summary_doc else "",
            "Theme2_3_Confidence": _fmt_confidence(
                summary_doc.get("theme2_3_confidence") if summary_doc else ""
            ),
        }
        rows.append(row)

    df = pd.DataFrame(rows, columns=CSV_COLUMNS)

    buf = io.BytesIO()
    df.to_csv(buf, index=False, encoding="utf-8-sig")
    buf.seek(0)
    return buf


async def export_session_csv_to_file(
    db: AsyncSession,
    mongo_db: AsyncIOMotorDatabase,
    session_id: uuid.UUID,
    output_dir: str = "/tmp/outputs",
) -> str:
    """Export CSV to filesystem. Returns output file path."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    buf = await export_session_csv(db, mongo_db, session_id)
    output_path = os.path.join(output_dir, f"{session_id}_themes.csv")
    with open(output_path, "wb") as f:
        f.write(buf.getvalue())
    return output_path
