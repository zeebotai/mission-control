from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Session(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    ended_at: Optional[datetime] = None
    status: str = Field(default="running")  # running|ended|error
    model: Optional[str] = None
    tokens_used: int = Field(default=0)
    cost_estimate: float = Field(default=0.0)


class Agent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    role: str = Field(default="")
    status: str = Field(default="idle")  # idle|running|paused|error
    current_task: str = Field(default="")
    last_active: datetime = Field(default_factory=datetime.utcnow)


class Job(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    schedule: str
    status: str = Field(default="idle")  # idle|running|paused|error
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None
    owner_agent: str = Field(default="")


class ActivityLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow, index=True)
    source: str  # agent|system|human
    event_type: str
    human_summary: str
    raw_data: str = Field(default="")


class MemoryEntry(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    type: str = Field(default="note")
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    created_by: str = Field(default="human")


class WorkspaceFile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    filename: str
    path: str
    last_modified: datetime = Field(default_factory=datetime.utcnow)


class CostEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    model: str = Field(default="")
    tokens: int = Field(default=0)
    estimated_cost: float = Field(default=0.0)


class Project(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    slug: str = Field(index=True, unique=True)
    name: str
    repo_url: str = Field(default="")
    status: str = Field(default="active", index=True)  # active|paused|done
    notes: str = Field(default="")


class Task(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow, index=True)

    project_slug: str = Field(default="", index=True)

    title: str
    description: str = Field(default="")

    status: str = Field(default="todo", index=True)  # todo|doing|blocked|done
    priority: int = Field(default=2, index=True)  # 1 high, 2 normal, 3 low

    owner: str = Field(default="human", index=True)  # human|openclaw|system
    assigned_to: str = Field(default="", index=True)  # agent name or handle

    source: str = Field(default="", index=True)  # e.g. activity, job, manual
    source_ref: str = Field(default="", index=True)  # id/url/etc
