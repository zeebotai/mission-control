from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.models.db import Doc
from app.services.activity import log_event
from app.services.database import get_session

# NOTE: FastAPI uses /docs for Swagger UI by default, so we expose our app docs under /docstore.
router = APIRouter(prefix="/docstore", tags=["docs"])


class DocCreate(BaseModel):
    title: str
    content: str
    mission_alignment: str
    category: str | None = "general"
    project_slug: str | None = ""
    tags: str | None = ""


class DocUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    mission_alignment: str | None = None
    category: str | None = None
    project_slug: str | None = None
    tags: str | None = None


@router.get("")
def list_docs(
    q: str | None = None,
    project: str | None = None,
    category: str | None = None,
    limit: int = 100,
    db: Session = Depends(get_session),
) -> list[Doc]:
    stmt = select(Doc)

    if project:
        stmt = stmt.where(Doc.project_slug == project)

    if category:
        stmt = stmt.where(Doc.category == category)

    if q:
        like = f"%{q}%"
        stmt = stmt.where((Doc.title.like(like)) | (Doc.content.like(like)))

    stmt = stmt.order_by(Doc.updated_at.desc()).limit(limit)
    return list(db.exec(stmt).all())


@router.get("/{doc_id}")
def get_doc(doc_id: int, db: Session = Depends(get_session)) -> Doc:
    d = db.get(Doc, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="doc_not_found")
    return d


@router.post("")
def create_doc(payload: DocCreate, db: Session = Depends(get_session)) -> dict[str, Any]:
    title = (payload.title or "").strip()
    content = payload.content or ""
    if not title:
        raise HTTPException(status_code=400, detail="title_required")

    alignment = (payload.mission_alignment or "").strip()
    if not alignment:
        raise HTTPException(status_code=400, detail="mission_alignment_required")

    d = Doc(
        title=title,
        content=content,
        mission_alignment=alignment,
        category=(payload.category or "general").strip() or "general",
        project_slug=(payload.project_slug or "").strip(),
        tags=(payload.tags or "").strip(),
    )
    db.add(d)
    db.commit()
    db.refresh(d)

    log_event(
        db,
        source="human",
        event_type="doc.create",
        human_summary=f"Created doc: {d.title}",
        raw={"doc_id": d.id, "category": d.category, "project_slug": d.project_slug, "tags": d.tags},
    )

    return {"ok": True, "doc": d}


@router.patch("/{doc_id}")
def update_doc(doc_id: int, payload: DocUpdate, db: Session = Depends(get_session)) -> dict[str, Any]:
    d = db.get(Doc, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="doc_not_found")

    if payload.title is not None:
        d.title = payload.title
    if payload.content is not None:
        d.content = payload.content
    if payload.mission_alignment is not None:
        d.mission_alignment = payload.mission_alignment
    if payload.category is not None:
        d.category = payload.category
    if payload.project_slug is not None:
        d.project_slug = payload.project_slug
    if payload.tags is not None:
        d.tags = payload.tags

    d.updated_at = datetime.utcnow()
    db.add(d)
    db.commit()
    db.refresh(d)

    log_event(
        db,
        source="human",
        event_type="doc.update",
        human_summary=f"Updated doc: {d.title}",
        raw={"doc_id": d.id},
    )

    return {"ok": True, "doc": d}


@router.delete("/{doc_id}")
def delete_doc(doc_id: int, db: Session = Depends(get_session)) -> dict[str, Any]:
    d = db.get(Doc, doc_id)
    if not d:
        raise HTTPException(status_code=404, detail="doc_not_found")
    db.delete(d)
    db.commit()

    log_event(
        db,
        source="human",
        event_type="doc.delete",
        human_summary=f"Deleted doc: {d.title}",
        raw={"doc_id": doc_id},
    )

    return {"ok": True}
