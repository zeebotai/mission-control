from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.models.db import ActivityLog, Agent, Job, Session as McSession
from app.services.activity import log_event
from app.services.database import get_session

router = APIRouter(prefix="/system", tags=["system"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_session)) -> dict[str, Any]:
    # Basic counts; cost is a placeholder for now.
    agents = db.exec(select(Agent)).all()
    jobs = db.exec(select(Job)).all()
    sessions = db.exec(select(McSession)).all()

    active_agents = [a for a in agents if a.status == "running"]
    active_jobs = [j for j in jobs if j.status == "running"]
    active_sessions = [s for s in sessions if s.status == "running"]

    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    # naive: sum cost_estimate for sessions started in last 7 days
    cost_7d = sum(s.cost_estimate for s in sessions if s.started_at >= seven_days_ago)

    return {
        "workspace_files_count": 0,
        "active_jobs": len(active_jobs),
        "active_sessions": len(active_sessions),
        "estimated_cost_7d": round(cost_7d, 4),
        "system_health": "ok",
        "active_agents": len(active_agents),
    }


@router.get("/now")
def whats_running_now(db: Session = Depends(get_session)) -> dict[str, Any]:
    agents = db.exec(select(Agent)).all()
    jobs = db.exec(select(Job)).all()
    return {
        "agents": agents,
        "jobs": jobs,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


@router.get("/activity")
def recent_activity(limit: int = 50, db: Session = Depends(get_session)) -> list[ActivityLog]:
    stmt = select(ActivityLog).order_by(ActivityLog.timestamp.desc()).limit(limit)
    return list(db.exec(stmt).all())


@router.post("/actions/spawn-subagent")
def spawn_subagent(payload: dict[str, Any] | None = None, db: Session = Depends(get_session)):
    log_event(
        db,
        source="human",
        event_type="action.spawn_subagent",
        human_summary="Spawn sub-agent requested",
        raw=payload or {},
    )
    return {"ok": True, "note": "Stub: wire to sessions_spawn later."}


@router.post("/actions/pause-all")
def pause_all(db: Session = Depends(get_session)):
    agents = db.exec(select(Agent)).all()
    for a in agents:
        if a.status == "running":
            a.status = "paused"
    db.add_all(agents)
    db.commit()
    log_event(db, source="human", event_type="action.pause_all", human_summary="Paused all agents")
    return {"ok": True}


@router.post("/actions/resume-all")
def resume_all(db: Session = Depends(get_session)):
    agents = db.exec(select(Agent)).all()
    for a in agents:
        if a.status == "paused":
            a.status = "idle"
    db.add_all(agents)
    db.commit()
    log_event(db, source="human", event_type="action.resume_all", human_summary="Resumed agents")
    return {"ok": True}


@router.post("/actions/run-job")
def run_job(job_id: int, db: Session = Depends(get_session)):
    job = db.get(Job, job_id)
    if not job:
        return {"ok": False, "error": "job_not_found"}
    log_event(
        db,
        source="human",
        event_type="action.run_job",
        human_summary=f"Run job now: {job.name}",
        raw={"job_id": job_id},
    )
    return {"ok": True, "note": "Stub: scheduler execution to be implemented."}


@router.post("/actions/stop-task")
def stop_task(agent_id: int, db: Session = Depends(get_session)):
    agent = db.get(Agent, agent_id)
    if not agent:
        return {"ok": False, "error": "agent_not_found"}
    agent.status = "idle"
    agent.current_task = ""
    db.add(agent)
    db.commit()
    log_event(db, source="human", event_type="action.stop_task", human_summary=f"Stopped task for {agent.name}")
    return {"ok": True}


@router.post("/actions/create-memory")
def create_memory(entry: dict[str, Any], db: Session = Depends(get_session)):
    log_event(
        db,
        source="human",
        event_type="action.create_memory",
        human_summary="Created memory entry (stub)",
        raw=entry,
    )
    return {"ok": True, "note": "Stub: persist MemoryEntry + sync with memory plugin later."}


@router.post("/actions/health-check")
def health_check(db: Session = Depends(get_session)):
    log_event(
        db,
        source="system",
        event_type="health_check",
        human_summary="Health check triggered",
    )
    return {"ok": True, "status": "ok"}
