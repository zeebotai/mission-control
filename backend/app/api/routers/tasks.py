from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select

from app.models.db import Task
from app.services.activity import log_event
from app.services.database import get_session

router = APIRouter(prefix="/tasks", tags=["tasks"])


class TaskCreate(BaseModel):
    title: str
    mission_alignment: str
    description: str | None = ""
    status: str | None = "todo"
    priority: int | None = 2
    owner: str | None = "human"
    assigned_to: str | None = ""
    project_slug: str | None = ""
    source: str | None = "manual"
    source_ref: str | None = ""


class TaskUpdate(BaseModel):
    title: str | None = None
    mission_alignment: str | None = None
    description: str | None = None
    status: str | None = None
    priority: int | None = None
    owner: str | None = None
    assigned_to: str | None = None


@router.get("")
def list_tasks(
    status: str | None = None,
    owner: str | None = None,
    limit: int = 200,
    db: Session = Depends(get_session),
) -> list[Task]:
    q = select(Task)
    if status:
        q = q.where(Task.status == status)
    if owner:
        q = q.where(Task.owner == owner)
    q = q.order_by(Task.priority, Task.updated_at.desc()).limit(limit)
    return list(db.exec(q).all())


@router.post("")
def create_task(payload: TaskCreate, db: Session = Depends(get_session)) -> dict[str, Any]:
    title = (payload.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="title_required")

    alignment = (payload.mission_alignment or "").strip()
    if not alignment:
        raise HTTPException(status_code=400, detail="mission_alignment_required")

    t = Task(
        title=title,
        description=(payload.description or "").strip(),
        mission_alignment=alignment,
        status=payload.status or "todo",
        priority=int(payload.priority or 2),
        owner=payload.owner or "human",
        assigned_to=payload.assigned_to or "",
        project_slug=(payload.project_slug or "").strip(),
        source=payload.source or "manual",
        source_ref=payload.source_ref or "",
    )
    db.add(t)
    db.commit()
    db.refresh(t)

    log_event(
        db,
        source="human",
        event_type="task.create",
        human_summary=f"Created task: {t.title}",
        raw={"task_id": t.id, "status": t.status, "priority": t.priority},
    )

    return {"ok": True, "task": t}


@router.patch("/{task_id}")
def update_task(task_id: int, payload: TaskUpdate, db: Session = Depends(get_session)) -> dict[str, Any]:
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(status_code=404, detail="task_not_found")

    before = {"title": t.title, "status": t.status, "priority": t.priority, "assigned_to": t.assigned_to}

    if payload.title is not None:
        t.title = payload.title.strip()
    if payload.mission_alignment is not None:
        t.mission_alignment = payload.mission_alignment
    if payload.description is not None:
        t.description = payload.description
    if payload.status is not None:
        t.status = payload.status
    if payload.priority is not None:
        t.priority = payload.priority
    if payload.owner is not None:
        t.owner = payload.owner
    if payload.assigned_to is not None:
        t.assigned_to = payload.assigned_to

    t.updated_at = datetime.utcnow()
    db.add(t)
    db.commit()
    db.refresh(t)

    log_event(
        db,
        source="human",
        event_type="task.update",
        human_summary=f"Updated task: {t.title}",
        raw={"task_id": t.id, "before": before, "after": {"title": t.title, "status": t.status, "priority": t.priority, "assigned_to": t.assigned_to}},
    )

    return {"ok": True, "task": t}


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_session)) -> dict[str, Any]:
    t = db.get(Task, task_id)
    if not t:
        raise HTTPException(status_code=404, detail="task_not_found")
    db.delete(t)
    db.commit()

    log_event(
        db,
        source="human",
        event_type="task.delete",
        human_summary=f"Deleted task: {t.title}",
        raw={"task_id": task_id},
    )

    return {"ok": True}
