from __future__ import annotations

import json
from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
import httpx
from sqlmodel import Session, select

from app.models.integrations import Integration
from app.services.baserow import BaserowClient
from app.services.database import get_session

router = APIRouter(prefix="", tags=["cronobuilds"])


def _load_baserow_config(db: Session) -> dict[str, Any]:
    row = db.exec(select(Integration).where(Integration.name == "baserow")).first()
    if not row or not row.config_json:
        raise HTTPException(status_code=400, detail="baserow_not_configured")
    try:
        return json.loads(row.config_json)
    except Exception:
        raise HTTPException(status_code=400, detail="baserow_config_invalid")


def _get_any(row: dict[str, Any], keys: list[str]) -> Any:
    # Try exact key, then case-insensitive match.
    for k in keys:
        if k in row:
            return row.get(k)
    lower = {str(k).lower(): k for k in row.keys()}
    for k in keys:
        kk = lower.get(k.lower())
        if kk is not None:
            return row.get(kk)
    return None


@router.get("/followups/due")
async def due_followups(
    limit: int = 5,
    db: Session = Depends(get_session),
) -> dict[str, Any]:
    """Return up to `limit` follow-ups due today or earlier.

    This intentionally does NOT expose the Baserow token.
    """

    cfg = _load_baserow_config(db)
    token = cfg.get("database_token")
    table_id = int(cfg.get("leads_table_id") or 0)

    if not token:
        raise HTTPException(status_code=400, detail="baserow_database_token_missing")
    if not table_id:
        raise HTTPException(status_code=400, detail="baserow_table_id_missing")

    client = BaserowClient(token=token)

    today = date.today().isoformat()
    results: list[dict[str, Any]] = []

    page = 1
    while True:
        try:
            data = await client.list_rows(table_id=table_id, page=page, page_size=200, user_field_names=True)
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=502,
                detail={
                    "message": "baserow_list_failed",
                    "status_code": e.response.status_code if e.response is not None else None,
                    "response": (e.response.text if e.response is not None else str(e))[:2000],
                },
            )
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail={"message": "baserow_list_failed", "error": str(e)[:2000]},
            )
        rows = data.get("results", [])

        for r in rows:
            follow_up = _get_any(
                r,
                [
                    "Follow-Up Date",
                    "Follow-up Date",
                    "Follow Up Date",
                    "Follow up date",
                    "follow_up_date",
                    "followup_date",
                ],
            )
            status = _get_any(r, ["Status", "status"])
            name = _get_any(r, ["Business Name", "Name", "business_name"])
            phone = _get_any(r, ["Phone Number", "Phone", "phone_number"])

            # Date fields generally come back as YYYY-MM-DD.
            if not follow_up:
                continue
            follow_up_str = str(follow_up)[:10]

            # Filter statuses that are clearly "done".
            status_str = str(status or "").lower()
            if status_str in {"closed", "won", "dead", "do not contact", "dnc"}:
                continue

            if follow_up_str <= today:
                results.append(
                    {
                        "business_name": str(name or "(unknown)"),
                        "phone_number": str(phone or ""),
                        "follow_up_date": follow_up_str,
                        "status": status,
                        "row_id": r.get("id"),
                    }
                )
                if len(results) >= limit:
                    return {"today": today, "count": len(results), "followups": results}

        if not data.get("next"):
            break
        page += 1

    return {"today": today, "count": len(results), "followups": results}
