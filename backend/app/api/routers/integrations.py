from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, HttpUrl
from sqlmodel import Session, select

from app.models.integrations import Integration
from app.services.activity import log_event
from app.services.database import get_session

router = APIRouter(prefix="/integrations", tags=["integrations"])


class BaserowConfig(BaseModel):
    mcp_url: HttpUrl
    table_url: HttpUrl | None = None
    # Baserow database token (scoped). Stored server-side; never returned.
    database_token: str | None = None
    leads_table_id: int | None = None


@router.get("/baserow")
def get_baserow(db: Session = Depends(get_session)) -> dict[str, Any]:
    row = db.exec(select(Integration).where(Integration.name == "baserow")).first()
    if not row:
        return {"configured": False}

    try:
        cfg = json.loads(row.config_json) if row.config_json else {}
    except Exception:
        cfg = {}

    # Do not return secrets in full.
    mcp_url = cfg.get("mcp_url", "")
    redacted = ""
    if mcp_url:
        redacted = mcp_url.split("/mcp/")[0] + "/mcp/***/sse" if "/mcp/" in mcp_url else "***"

    has_db_token = bool(cfg.get("database_token"))

    return {
        "configured": True,
        "mcp_url": redacted,
        "table_url": cfg.get("table_url"),
        "leads_table_id": cfg.get("leads_table_id"),
        "database_token": "set" if has_db_token else "missing",
        "status": "stub",
        "note": "Connection check not implemented yet.",
    }


@router.post("/baserow")
def set_baserow(cfg: BaserowConfig, db: Session = Depends(get_session)) -> dict[str, Any]:
    row = db.exec(select(Integration).where(Integration.name == "baserow")).first()

    # Merge with existing config so posting without the token doesn't clear it.
    existing: dict[str, Any] = {}
    if row and row.config_json:
        try:
            existing = json.loads(row.config_json)
        except Exception:
            existing = {}

    payload: dict[str, Any] = {
        **existing,
        "mcp_url": str(cfg.mcp_url),
        "table_url": str(cfg.table_url) if cfg.table_url else None,
    }

    if cfg.database_token is not None:
        payload["database_token"] = cfg.database_token

    if cfg.leads_table_id is not None:
        payload["leads_table_id"] = cfg.leads_table_id

    if row:
        row.config_json = json.dumps(payload)
        db.add(row)
    else:
        row = Integration(name="baserow", config_json=json.dumps(payload))
        db.add(row)

    db.commit()

    log_event(
        db,
        source="human",
        event_type="integration.configure",
        human_summary="Configured Baserow integration",
        raw={"integration": "baserow", "table_url": payload.get("table_url"), "leads_table_id": payload.get("leads_table_id")},
    )

    return {"ok": True}
