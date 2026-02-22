from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.models.db import Agent
from app.services.activity import log_event
from app.services.database import get_session

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
def list_agents(db: Session = Depends(get_session)):
    return list(db.exec(select(Agent)).all())


@router.post("")
def create_agent(agent: Agent, db: Session = Depends(get_session)):
    agent.last_active = datetime.utcnow()
    db.add(agent)
    db.commit()
    db.refresh(agent)
    log_event(db, source="human", event_type="agent.create", human_summary=f"Created agent {agent.name}")
    return agent
