from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.models.integrations import Integration
from app.services.activity import log_event
from app.services.baserow import BaserowClient, normalize_name, normalize_phone
from app.services.database import get_session

from .leads import parse_leads, ParseRequest

router = APIRouter(prefix="", tags=["cronobuilds"])


class ImportRequest(BaseModel):
    raw: str


class ImportResponse(BaseModel):
    created: int
    duplicates: list[dict[str, Any]]


def _load_baserow_config(db: Session) -> dict[str, Any]:
    row = db.exec(select(Integration).where(Integration.name == "baserow")).first()
    if not row or not row.config_json:
        raise HTTPException(status_code=400, detail="baserow_not_configured")
    try:
        return json.loads(row.config_json)
    except Exception:
        raise HTTPException(status_code=400, detail="baserow_config_invalid")


async def _find_duplicate(
    client: BaserowClient,
    *,
    table_id: int,
    business_name: str,
    phone_number: str,
) -> dict[str, Any] | None:
    # Fetch rows (paged) and check normalized name+phone.
    target_name = normalize_name(business_name)
    target_phone = normalize_phone(phone_number)

    page = 1
    while True:
        data = await client.list_rows(table_id=table_id, page=page, page_size=200, user_field_names=True)
        results = data.get("results", [])
        for row in results:
            n = normalize_name(str(row.get("Business Name", "")))
            p = normalize_phone(str(row.get("Phone Number", "")))
            if n and p and n == target_name and p == target_phone:
                return row
        if not data.get("next"):
            return None
        page += 1


@router.post("/baserow/import", response_model=ImportResponse)
async def import_to_baserow(req: ImportRequest, db: Session = Depends(get_session)):
    cfg = _load_baserow_config(db)
    token = cfg.get("database_token")
    table_id = int(cfg.get("leads_table_id") or 0)

    if not token:
        raise HTTPException(status_code=400, detail="baserow_database_token_missing")
    if not table_id:
        raise HTTPException(status_code=400, detail="baserow_table_id_missing")

    parsed = parse_leads(ParseRequest(raw=req.raw), db)
    leads = parsed["leads"]

    client = BaserowClient(token=token)

    # Duplicate check pass. If any dup found, abort and ask human.
    duplicates: list[dict[str, Any]] = []
    for l in leads:
        if not l.phone_number:
            continue
        dup = await _find_duplicate(
            client,
            table_id=table_id,
            business_name=l.business_name,
            phone_number=l.phone_number,
        )
        if dup:
            duplicates.append(
                {
                    "business_name": l.business_name,
                    "phone_number": l.phone_number,
                    "existing_status": dup.get("Status"),
                    "existing_row_id": dup.get("id"),
                }
            )

    if duplicates:
        log_event(
            db,
            source="system",
            event_type="baserow.import.duplicates",
            human_summary=f"Baserow import blocked: {len(duplicates)} duplicates detected",
            raw={"duplicates": duplicates},
        )
        return {"created": 0, "duplicates": duplicates}

    created = 0
    for l in leads:
        # Use user_field_names=true so we can post readable keys.
        row = {
            "Business Name": l.business_name,
            "Phone Number": l.phone_number or "",
            "Contact Method": l.contact_method,
            "Website": "none",
            "Status": "lead",
            "Industry": l.industry or "",
            "Notes": l.notes,
            "Lead Source": "Google Maps",
        }
        await client.create_row(table_id=table_id, data=row, user_field_names=True)
        created += 1

    log_event(
        db,
        source="human",
        event_type="baserow.import",
        human_summary=f"Imported {created} leads to Baserow",
        raw={"count": created},
    )

    return {"created": created, "duplicates": []}
