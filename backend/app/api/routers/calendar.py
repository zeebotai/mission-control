from __future__ import annotations

from fastapi import APIRouter

from app.services import clawdbot_cron

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/cron")
def calendar_cron():
    jobs = clawdbot_cron.list_jobs()
    return [
        {
            "id": j.id,
            "name": j.name,
            "enabled": j.enabled,
            "schedule": j.schedule,
            "state": j.state,
        }
        for j in jobs
    ]


@router.get("/cron/{job_id}/runs")
def calendar_cron_runs(job_id: str, limit: int = 50):
    return {"job_id": job_id, "runs": clawdbot_cron.list_runs(job_id, limit=limit)}
