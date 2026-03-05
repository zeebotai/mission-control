from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from app.settings import settings


@dataclass
class CronJob:
    id: str
    name: str
    enabled: bool
    schedule: dict[str, Any]
    state: dict[str, Any] | None
    raw: dict[str, Any]


def _cron_dir() -> Path:
    return Path(settings.clawdbot_cron_dir).expanduser()


def list_jobs() -> list[CronJob]:
    jobs_path = _cron_dir() / "jobs.json"
    if not jobs_path.exists():
        return []
    data = json.loads(jobs_path.read_text(encoding="utf-8"))
    jobs = data.get("jobs", []) if isinstance(data, dict) else data
    out: list[CronJob] = []
    for j in jobs or []:
        out.append(
            CronJob(
                id=str(j.get("id") or ""),
                name=str(j.get("name") or ""),
                enabled=bool(j.get("enabled", True)),
                schedule=j.get("schedule") or {},
                state=j.get("state"),
                raw=j,
            )
        )
    return out


def list_runs(job_id: str, limit: int = 50) -> list[dict[str, Any]]:
    runs_path = _cron_dir() / "runs" / f"{job_id}.jsonl"
    if not runs_path.exists():
        return []
    lines = runs_path.read_text(encoding="utf-8").splitlines()
    # Keep last N
    selected = lines[-limit:]
    out: list[dict[str, Any]] = []
    for line in selected:
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out
