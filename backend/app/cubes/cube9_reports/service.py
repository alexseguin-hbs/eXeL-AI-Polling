"""Cube 9 — Reports Service: CSV export matching 16-column schema.

Output columns (ref: Updated_Web_Results_With_Themes_And_Summaries_v04.1_5000.csv):
  Q_Number, Question, User, Detailed_Results, Response_Language,
  333_Summary, 111_Summary, 33_Summary,
  Theme01, Theme01_Confidence,
  Theme2_9, Theme2_9_Confidence,
  Theme2_6, Theme2_6_Confidence,
  Theme2_3, Theme2_3_Confidence
"""

import io
import uuid

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.question import Question
from app.models.response_meta import ResponseMeta
from app.models.response_summary import ResponseSummary

# Exact 16-column schema matching reference CSV (v04.1_5000.csv)
CSV_COLUMNS = [
    "Q_Number",
    "Question",
    "User",
    "Detailed_Results",
    "Response_Language",
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
    session_id: uuid.UUID,
) -> io.BytesIO:
    """Build 15-column CSV export for a session.

    Queries Postgres (ResponseMeta, Question, ResponseSummary)
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
        # Fetch raw text from ResponseMeta.raw_text (PostgreSQL)
        raw_text = meta.raw_text or ""

        # Fetch summaries from PostgreSQL (ResponseSummary)
        summary_result = await db.execute(
            select(ResponseSummary).where(
                ResponseSummary.response_meta_id == meta.id,
            )
        )
        summary_row = summary_result.scalar_one_or_none()

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
            "333_Summary": summary_row.summary_333 or "" if summary_row else "",
            "111_Summary": summary_row.summary_111 or "" if summary_row else "",
            "33_Summary": summary_row.summary_33 or "" if summary_row else "",
            "Theme01": summary_row.theme01 or "" if summary_row else "",
            "Theme01_Confidence": _fmt_confidence(
                summary_row.theme01_confidence if summary_row else ""
            ),
            "Theme2_9": summary_row.theme2_9 or "" if summary_row else "",
            "Theme2_9_Confidence": _fmt_confidence(
                summary_row.theme2_9_confidence if summary_row else ""
            ),
            "Theme2_6": summary_row.theme2_6 or "" if summary_row else "",
            "Theme2_6_Confidence": _fmt_confidence(
                summary_row.theme2_6_confidence if summary_row else ""
            ),
            "Theme2_3": summary_row.theme2_3 or "" if summary_row else "",
            "Theme2_3_Confidence": _fmt_confidence(
                summary_row.theme2_3_confidence if summary_row else ""
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
    session_id: uuid.UUID,
    output_dir: str = "/tmp/outputs",
) -> str:
    """Export CSV to filesystem. Returns output file path."""
    import os
    os.makedirs(output_dir, exist_ok=True)

    buf = await export_session_csv(db, session_id)
    output_path = os.path.join(output_dir, f"{session_id}_themes.csv")
    with open(output_path, "wb") as f:
        f.write(buf.getvalue())
    return output_path
