from __future__ import annotations

import json
from typing import Any

from sqlmodel import Session

from app.models.db import ActivityLog


def log_event(
    db: Session,
    *,
    source: str,
    event_type: str,
    human_summary: str,
    raw: Any | None = None,
) -> ActivityLog:
    entry = ActivityLog(
        source=source,
        event_type=event_type,
        human_summary=human_summary,
        raw_data=json.dumps(raw, default=str) if raw is not None else "",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
