from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.models.db import Job
from app.services.activity import log_event
from app.services.database import get_session

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
def list_jobs(db: Session = Depends(get_session)):
    return list(db.exec(select(Job)).all())


@router.post("")
def create_job(job: Job, db: Session = Depends(get_session)):
    db.add(job)
    db.commit()
    db.refresh(job)
    log_event(db, source="human", event_type="job.create", human_summary=f"Created job {job.name}")
    return job
