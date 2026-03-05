from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.settings import settings


@dataclass
class DailyMemoryFile:
    date: str  # YYYY-MM-DD
    path: str


def _daily_dir() -> Path:
    return Path(settings.memory_daily_dir)


def _longterm_path() -> Path:
    return Path(settings.memory_longterm_path)


def list_daily() -> list[DailyMemoryFile]:
    d = _daily_dir()
    if not d.exists() or not d.is_dir():
        return []

    out: list[DailyMemoryFile] = []
    for p in sorted(d.glob("????-??-??.md"), reverse=True):
        out.append(DailyMemoryFile(date=p.stem, path=str(p)))
    return out


def read_daily(date: str) -> str:
    p = _daily_dir() / f"{date}.md"
    if not p.exists():
        raise FileNotFoundError(date)
    return p.read_text(encoding="utf-8")


def read_longterm() -> str:
    p = _longterm_path()
    if not p.exists() or p.is_dir():
        return ""
    return p.read_text(encoding="utf-8")
