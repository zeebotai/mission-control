from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.models.db import Project
from app.services.activity import log_event
from app.services.database import get_session

router = APIRouter(prefix="/projects", tags=["projects"])


class ProjectCreate(BaseModel):
    slug: str
    name: str
    repo_url: str | None = ""
    status: str | None = "active"
    notes: str | None = ""


class ProjectUpdate(BaseModel):
    name: str | None = None
    repo_url: str | None = None
    status: str | None = None
    notes: str | None = None


@router.get("")
def list_projects(db: Session = Depends(get_session)) -> list[Project]:
    q = select(Project).order_by(Project.updated_at.desc())
    return list(db.exec(q).all())


@router.post("")
def create_project(payload: ProjectCreate, db: Session = Depends(get_session)) -> dict[str, Any]:
    slug = payload.slug.strip().lower()
    if not slug:
        raise HTTPException(status_code=400, detail="slug_required")
    existing = db.exec(select(Project).where(Project.slug == slug)).first()
    if existing:
        raise HTTPException(status_code=409, detail="project_exists")

    p = Project(
        slug=slug,
        name=payload.name.strip() or slug,
        repo_url=(payload.repo_url or "").strip(),
        status=payload.status or "active",
        notes=(payload.notes or "").strip(),
    )
    db.add(p)
    db.commit()
    db.refresh(p)

    log_event(db, source="human", event_type="project.create", human_summary=f"Created project: {p.name}")

    return {"ok": True, "project": p}


@router.patch("/{project_id}")
def update_project(project_id: int, payload: ProjectUpdate, db: Session = Depends(get_session)) -> dict[str, Any]:
    p = db.get(Project, project_id)
    if not p:
        raise HTTPException(status_code=404, detail="project_not_found")

    if payload.name is not None:
        p.name = payload.name
    if payload.repo_url is not None:
        p.repo_url = payload.repo_url
    if payload.status is not None:
        p.status = payload.status
    if payload.notes is not None:
        p.notes = payload.notes

    p.updated_at = datetime.utcnow()
    db.add(p)
    db.commit()
    db.refresh(p)

    log_event(db, source="human", event_type="project.update", human_summary=f"Updated project: {p.name}")

    return {"ok": True, "project": p}
