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
