from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Integration(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True)
    config_json: str = Field(default="")
    updated_at: datetime = Field(default_factory=datetime.utcnow)
